import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import {
  loginSchema,
  signupSchema,
  createTeamMemberSchema,
  sendMessageSchema,
  connectGatewaySchema,
  updateProfileSchema,
  changePasswordSchema,
  type SmsProvider,
} from "@shared/schema";
import { z } from "zod";
import * as signalwire from "./signalwire";
import {
  createSmsProvider,
  NoGatewayProvider,
  type ISmsProvider,
} from "./sms-providers";

function formatToE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (phone.startsWith("+")) {
    return "+" + digits;
  }

  if (digits.length === 10) {
    return "+1" + digits;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return "+" + digits;
  }

  return "+" + digits;
}

interface ProviderContext {
  provider: ISmsProvider;
  adminId: string | null;
  gateway: Awaited<ReturnType<typeof storage.getActiveSmsGateway>>;
}

async function getProviderContext(userId: string): Promise<ProviderContext> {
  const user = await storage.getUser(userId);
  if (!user) {
    return {
      provider: new NoGatewayProvider(),
      adminId: null,
      gateway: undefined,
    };
  }

  const adminId = user.role === "admin" ? user.id : user.createdBy;
  if (!adminId) {
    return {
      provider: new NoGatewayProvider(),
      adminId: null,
      gateway: undefined,
    };
  }

  const gateway = await storage.getActiveSmsGateway(adminId);
  if (!gateway) {
    return { provider: new NoGatewayProvider(), adminId, gateway: undefined };
  }

  return {
    provider: createSmsProvider(gateway),
    adminId,
    gateway,
  };
}

async function getProviderForUser(userId: string): Promise<ISmsProvider> {
  const { provider } = await getProviderContext(userId);
  return provider;
}

declare module "express-session" {
  interface SessionData {
    passport: { user: string };
  }
}

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      fullName: string;
      role: "admin" | "team_member";
      isActive: boolean;
    }
  }
}

const clients = new Map<string, Set<WebSocket>>();
const userClients = new Map<string, Set<WebSocket>>();

function broadcastToConversation(conversationId: string, data: any) {
  const wsClients = clients.get(conversationId);
  if (wsClients) {
    const message = JSON.stringify(data);
    wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

function broadcastToUser(userId: string, data: any) {
  const wsClients = userClients.get(userId);
  if (wsClients) {
    const message = JSON.stringify(data);
    wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

function broadcastToAdmin(adminId: string, data: any) {
  const message = JSON.stringify(data);
  userClients.forEach((wsSet, userId) => {
    wsSet.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
}


export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret && process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET environment variable is required in production",
    );
  }

  // Use PostgreSQL session store for production
  const PgSession = connectPgSimple(session);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    client.release();
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }

  // Trust proxy in production for secure cookies behind reverse proxy
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  const sessionMiddleware = session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: sessionSecret || "conneclify-dev-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === "production",
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  });

  app.use(sessionMiddleware);

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        if (!user.isActive) {
          return done(null, false, { message: "Account is inactive" });
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role as Express.User["role"],
          isActive: user.isActive,
        });
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        done(null, {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role as Express.User["role"],
          isActive: user.isActive,
        });
      } else {
        done(null, false);
      }
    } catch (err) {
      done(err);
    }
  });

  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user?.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden - Admin access required" });
  };

  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
    }

    passport.authenticate(
      "local",
      (err: any, user: Express.User | false, info: any) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res
            .status(401)
            .json({ message: info?.message || "Login failed" });
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.json({ user });
        });
      },
    )(req, res, next);
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });

      const sessionUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role as Express.User["role"],
        isActive: user.isActive,
      };

      req.logIn(sessionUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after signup" });
        }
        return res.json({ user: sessionUser });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Signup error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({ user: req.user });
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const data = updateProfileSchema.parse(req.body);

      const user = await storage.getUser(req.user!.id);
      if (!user || !user.isActive) {
        return res.status(403).json({ message: "Account is inactive" });
      }

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail && existingEmail.id !== req.user!.id) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const updated = await storage.updateUser(req.user!.id, {
        fullName: data.fullName,
        email: data.email,
      });
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Profile update error:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const data = changePasswordSchema.parse(req.body);

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Account is inactive" });
      }

      const isValid = await bcrypt.compare(data.currentPassword, user.password);
      if (!isValid) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      await storage.updateUser(req.user!.id, { password: hashedPassword });

      res.json({ message: "Password changed successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Password change error:", err);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Update user theme preference
  app.patch("/api/auth/theme", requireAuth, async (req, res) => {
    try {
      const { theme } = req.body;
      if (typeof theme !== "string") {
        return res.status(400).json({ message: "Theme must be a string" });
      }

      const updated = await storage.updateUser(req.user!.id, { theme });
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err) {
      console.error("Theme update error:", err);
      res.status(500).json({ message: "Failed to update theme" });
    }
  });

  // Update user notification preferences (ringtone + notificationsEnabled)
  app.patch("/api/auth/notifications", requireAuth, async (req, res) => {
    try {
      const { ringtone, notificationsEnabled } = req.body;
      const updateData: Record<string, any> = {};
      if (typeof ringtone === "string") updateData.ringtone = ringtone;
      if (typeof notificationsEnabled === "boolean") updateData.notificationsEnabled = notificationsEnabled;

      const updated = await storage.updateUser(req.user!.id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err) {
      console.error("Notifications update error:", err);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // File upload endpoint for MMS media (images, audio)
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", (req, res, next) => {
    // Simple static file serving for uploads
    const filePath = path.join(uploadsDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadsDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || "";
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
      const allowed = /^(image\/(jpeg|png|gif|webp)|audio\/(mpeg|ogg|webm|wav|mp4|aac))$/;
      if (allowed.test(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only image and audio files are allowed"));
      }
    },
  });

  app.post("/api/upload", requireAuth, upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const url = `${protocol}://${host}/uploads/${req.file.filename}`;
      res.json({ url, mediaType: req.file.mimetype, filename: req.file.filename });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.get(
    "/api/dashboard/stats",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const stats = await storage.getDashboardStats(req.user!.id);
        res.json(stats);
      } catch (err) {
        console.error("Dashboard stats error:", err);
        res.status(500).json({ message: "Failed to fetch stats" });
      }
    },
  );

  app.get(
    "/api/dashboard/activity",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const activity = await storage.getRecentActivity(req.user!.id, 10);
        res.json(activity);
      } catch (err) {
        console.error("Recent activity error:", err);
        res.status(500).json({ message: "Failed to fetch recent activity" });
      }
    },
  );

  app.get("/api/team", requireAuth, requireAdmin, async (req, res) => {
    try {
      const adminId = req.user!.id;
      // Only show team members created by this admin (multi-tenant isolation)
      const allMembers = await storage.getTeamMembers();
      const myTeam = allMembers.filter(
        (m) => m.createdBy === adminId || m.id === adminId,
      );

      // Get all phone numbers for this admin's gateway
      const phoneNumbers = await storage.getPhoneNumbers(adminId);

      // Add assigned phone numbers to each team member
      const safeMembers = myTeam.map(({ password, ...rest }) => {
        const assignedNumbers = phoneNumbers
          .filter((p: (typeof phoneNumbers)[0]) => p.assignedTo === rest.id)
          .map((p: (typeof phoneNumbers)[0]) => ({
            id: p.id,
            number: p.number,
            friendlyName: p.friendlyName,
          }));
        return { ...rest, assignedNumbers };
      });

      res.json(safeMembers);
    } catch (err) {
      console.error("Team fetch error:", err);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.post("/api/team", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = createTeamMemberSchema.parse(req.body);

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        password: hashedPassword,
        role: "team_member",
        isActive: true,
        createdBy: req.user!.id,
      });

      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Create team member error:", err);
      res.status(500).json({ message: "Failed to create team member" });
    }
  });

  app.patch("/api/team/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;

      const user = await storage.updateUser(id, { isActive });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      console.error("Update team member error:", err);
      res.status(500).json({ message: "Failed to update team member" });
    }
  });

  app.delete("/api/team/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "admin") {
        return res.status(403).json({ message: "Cannot delete admin users" });
      }

      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (err) {
      console.error("Delete team member error:", err);
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });

  app.post(
    "/api/team/:id/reset-password",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const id = req.params.id as string;
        const user = await storage.getUser(id);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "admin") {
          return res
            .status(403)
            .json({ message: "Cannot reset admin password" });
        }

        const bcrypt = await import("bcrypt");
        const hashedPassword = await bcrypt.hash("password123", 10);
        await storage.updateUser(id, { password: hashedPassword });

        res.json({ message: "Password reset successfully" });
      } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ message: "Failed to reset password" });
      }
    },
  );

  app.get(
    "/api/team/:id/assignments",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const teamMemberId = req.params.id as string;
        const adminId = req.user!.id;

        console.log(
          `Getting assignments for team member: ${teamMemberId}, admin: ${adminId}`,
        );
        const assignments = await storage.getPhoneNumberAssignments(
          adminId,
          teamMemberId,
        );
        console.log(
          `Assignments result:`,
          JSON.stringify(
            assignments.map((a) => ({
              id: a.id,
              number: a.number,
              assignedTo: a.assignedTo,
              isAssigned: a.isAssigned,
            })),
          ),
        );
        res.json(assignments);
      } catch (err) {
        console.error("Get assignments error:", err);
        res.status(500).json({ message: "Failed to fetch assignments" });
      }
    },
  );

  app.post(
    "/api/team/:id/assignments",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const teamMemberId = req.params.id as string;
        const { phoneNumberId } = req.body;
        const adminId = req.user!.id;

        if (!phoneNumberId) {
          return res
            .status(400)
            .json({ message: "Phone number ID is required" });
        }

        // Verify the team member exists and is a team member (not an admin)
        const teamMember = await storage.getUser(teamMemberId);
        if (!teamMember) {
          return res.status(404).json({ message: "Team member not found" });
        }
        if (teamMember.role === "admin") {
          return res
            .status(400)
            .json({ message: "Cannot assign numbers to admin accounts" });
        }

        const phoneNumber = await storage.getPhoneNumber(phoneNumberId);
        if (!phoneNumber) {
          return res.status(404).json({ message: "Phone number not found" });
        }

        const gateway = phoneNumber.gatewayId
          ? await storage.getSmsGateway(phoneNumber.gatewayId)
          : null;
        if (!gateway || gateway.adminId !== adminId) {
          return res
            .status(403)
            .json({
              message: "You can only assign phone numbers from your gateway",
            });
        }

        if (phoneNumber.assignedTo && phoneNumber.assignedTo !== teamMemberId) {
          return res
            .status(409)
            .json({
              message: "This number is already assigned to another team member",
            });
        }

        await storage.assignPhoneNumber(phoneNumberId, teamMemberId);

        // Notify team member via WebSocket about new assignment
        broadcastToUser(teamMemberId, {
          type: "phone_assignment_changed",
          action: "assigned",
          phoneNumberId,
          phoneNumber: phoneNumber.number,
        });

        res.json({ message: "Phone number assigned successfully" });
      } catch (err) {
        console.error("Assign phone number error:", err);
        res.status(500).json({ message: "Failed to assign phone number" });
      }
    },
  );

  app.delete(
    "/api/team/:id/assignments/:phoneNumberId",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const teamMemberId = req.params.id as string;
        const phoneNumberId = req.params.phoneNumberId as string;
        const adminId = req.user!.id;

        const phoneNumber = await storage.getPhoneNumber(phoneNumberId);
        if (!phoneNumber) {
          return res.status(404).json({ message: "Phone number not found" });
        }

        const gateway = phoneNumber.gatewayId
          ? await storage.getSmsGateway(phoneNumber.gatewayId)
          : null;
        if (!gateway || gateway.adminId !== adminId) {
          return res
            .status(403)
            .json({
              message: "You can only unassign phone numbers from your gateway",
            });
        }

        if (phoneNumber.assignedTo !== teamMemberId) {
          return res
            .status(400)
            .json({
              message: "This number is not assigned to this team member",
            });
        }

        await storage.unassignPhoneNumber(phoneNumberId);

        // Notify team member via WebSocket about removed assignment
        broadcastToUser(teamMemberId, {
          type: "phone_assignment_changed",
          action: "unassigned",
          phoneNumberId,
          phoneNumber: phoneNumber.number,
        });

        res.json({ message: "Phone number unassigned successfully" });
      } catch (err) {
        console.error("Unassign phone number error:", err);
        res.status(500).json({ message: "Failed to unassign phone number" });
      }
    },
  );

  app.get(
    "/api/signalwire/status",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const configured = signalwire.isConfigured();
        const { projectId, spaceUrl } = signalwire.getConfig();
        res.json({
          configured,
          projectId: configured ? projectId : undefined,
          spaceUrl: configured ? spaceUrl : undefined,
        });
      } catch (err) {
        console.error("SignalWire status error:", err);
        res.status(500).json({ message: "Failed to check SignalWire status" });
      }
    },
  );

  app.get("/api/phone-numbers", requireAuth, async (req, res) => {
    try {
      const user = req.user!;

      // For team members, directly get their assigned phone numbers
      if (user.role === "team_member") {
        const phones = await storage.getPhoneNumbersAssignedToUser(user.id);
        return res.json(phones);
      }

      // For admins, get phone numbers from their gateway
      const { gateway } = await getProviderContext(user.id);
      const gatewayId = gateway?.id;

      if (!gatewayId) {
        return res.json([]);
      }

      const allPhones = await storage.getPhoneNumbers(undefined, gatewayId);

      // If includeAssigned=true (for Bought Numbers page), return all
      // Otherwise filter out assigned numbers (for Conversations dropdown)
      const includeAssigned = req.query.includeAssigned === "true";
      const phones = includeAssigned
        ? allPhones
        : allPhones.filter((phone) => !phone.assignedTo);
      res.json(phones);
    } catch (err) {
      console.error("Phone numbers fetch error:", err);
      res.status(500).json({ message: "Failed to fetch phone numbers" });
    }
  });

  app.post(
    "/api/phone-numbers/sync",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const { provider, adminId, gateway } = await getProviderContext(
          req.user!.id,
        );
        if (!provider.isConfigured() || !adminId) {
          return res
            .status(503)
            .json({
              message:
                "No SMS gateway configured. Please connect one in Settings > Integrations.",
            });
        }

        const ownedNumbers = await provider.getOwnedNumbers();

        // Get all numbers currently in DB for this gateway
        const dbNumbers = gateway?.id
          ? await storage.getPhoneNumbers(undefined, gateway.id)
          : [];

        // Build set of numbers that actually exist in the provider
        const providerNumberSet = new Set(ownedNumbers.map((n) => n.number));

        // Remove numbers from DB that no longer exist in Telnyx/provider
        let removed = 0;
        for (const dbNum of dbNumbers) {
          if (!providerNumberSet.has(dbNum.number)) {
            try {
              await storage.deletePhoneNumber(dbNum.id);
              removed++;
            } catch (delErr) {
              console.error(`Failed to remove stale number ${dbNum.number}:`, delErr);
            }
          }
        }

        // Add numbers that exist in provider but not yet in DB
        let synced = 0;
        let skipped = 0;
        for (const num of ownedNumbers) {
          try {
            const existingNumber = await storage.getPhoneNumberByNumber(num.number);
            if (existingNumber) {
              skipped++;
              continue;
            }

            await storage.createPhoneNumber({
              number: num.number,
              friendlyName: num.friendlyName || "Phone Number",
              providerId: num.id,
              provider: gateway?.provider || "signalwire",
              gatewayId: gateway?.id,
              adminId: adminId!,
              capabilities: num.capabilities || ["sms", "voice"],
              isActive: true,
              monthlyRate: "$1.15",
            });
            synced++;
          } catch (err: any) {
            if (err.code === "23505") {
              skipped++;
              continue;
            }
            throw err;
          }
        }

        res.json({
          message: `Synced ${synced} added, ${removed} removed from ${gateway?.provider || "provider"}`,
          synced,
          skipped,
          removed,
        });
      } catch (err: any) {
        console.error("Sync numbers error:", err);
        res
          .status(500)
          .json({ message: err.message || "Failed to sync numbers" });
      }
    },
  );

  app.get(
    "/api/phone-numbers/available",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const { areaCode, country, region } = req.query;

        const provider = await getProviderForUser(req.user!.id);
        if (!provider.isConfigured()) {
          return res
            .status(503)
            .json({
              message:
                "No SMS gateway configured. Please connect one in Settings > Integrations.",
            });
        }

        const numbers = await provider.getAvailableNumbers({
          areaCode: areaCode as string | undefined,
          country: (country as string) || "US",
          region: region as string | undefined,
        });
        res.json(numbers);
      } catch (err: any) {
        console.error("Available numbers error:", err);
        res
          .status(500)
          .json({
            message: err.message || "Failed to fetch available numbers",
          });
      }
    },
  );

  app.post(
    "/api/phone-numbers/purchase",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const { number } = req.body;
        if (!number) {
          return res.status(400).json({ message: "Phone number is required" });
        }

        const { provider, adminId, gateway } = await getProviderContext(
          req.user!.id,
        );
        if (!provider.isConfigured()) {
          return res
            .status(503)
            .json({
              message:
                "No SMS gateway configured. Please connect one in Settings > Integrations.",
            });
        }

        const purchasedNumber = await provider.purchaseNumber(number);

        const phone = await storage.createPhoneNumber({
          number: purchasedNumber.number,
          friendlyName: purchasedNumber.friendlyName || "Purchased Number",
          providerId: purchasedNumber.id,
          provider: gateway?.provider || "signalwire",
          gatewayId: gateway?.id,
          adminId: adminId!,
          capabilities: ["sms", "voice", "mms"],
          isActive: true,
          monthlyRate: "$1.15",
        });

        res.json(phone);
      } catch (err: any) {
        console.error("Purchase number error:", err);
        res
          .status(500)
          .json({ message: err.message || "Failed to purchase number" });
      }
    },
  );

  app.get("/api/conversations", requireAuth, async (req, res) => {
    try {
      const user = req.user!;

      if (user.role === "admin") {
        // Get admin's phone numbers and filter conversations by them
        const { gateway } = await getProviderContext(user.id);
        if (!gateway) {
          return res.json([]);
        }
        const adminPhones = await storage.getPhoneNumbers(
          undefined,
          gateway.id,
        );
        const phoneIds = new Set(adminPhones.map((p) => p.id));

        const allConversations = await storage.getConversations();
        const myConversations = allConversations.filter(
          (c) => c.phoneNumberId && phoneIds.has(c.phoneNumberId),
        );
        return res.json(myConversations);
      } else {
        // Team member sees conversations for phone numbers assigned to them
        const assignedPhones = await storage.getPhoneNumbersAssignedToUser(
          user.id,
        );
        if (assignedPhones.length === 0) {
          return res.json([]);
        }
        const phoneIds = new Set(assignedPhones.map((p) => p.id));

        const allConversations = await storage.getConversations();
        const myConversations = allConversations.filter(
          (c) => c.phoneNumberId && phoneIds.has(c.phoneNumberId),
        );
        return res.json(myConversations);
      }
    } catch (err) {
      console.error("Conversations fetch error:", err);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", requireAuth, async (req, res) => {
    try {
      const {
        contactNumber,
        contactName,
        phoneNumberId,
        assignedUserId,
        category,
      } = req.body;

      if (!contactNumber) {
        return res
          .status(400)
          .json({ message: "Contact phone number is required" });
      }

      const formattedContactNumber = formatToE164(contactNumber);

      const conversation = await storage.createConversation({
        contactNumber: formattedContactNumber,
        contactName: contactName || null,
        phoneNumberId: phoneNumberId || null,
        assignedUserId:
          req.user?.role === "admin" ? assignedUserId || null : req.user!.id,
        category: category || "general",
        unreadCount: 0,
        isArchived: false,
      });

      res.json(conversation);
    } catch (err) {
      console.error("Create conversation error:", err);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.patch("/api/conversations/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const { contactName, isPinned, category } = req.body;

      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      if (
        req.user?.role !== "admin" &&
        conversation.assignedUserId !== req.user?.id
      ) {
        return res
          .status(403)
          .json({ message: "Access denied to this conversation" });
      }

      const updates: any = {};
      if (contactName !== undefined) updates.contactName = contactName;
      if (isPinned !== undefined) updates.isPinned = isPinned;
      if (category !== undefined) updates.category = category;

      const updated = await storage.updateConversation(id, updates);
      res.json(updated);
    } catch (err) {
      console.error("Update conversation error:", err);
      res.status(500).json({ message: "Failed to update conversation" });
    }
  });

  // Mark conversation as read (reset unread count)
  app.post("/api/conversations/:id/read", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;

      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Check access: admin has full access, team member needs assigned phone number
      if (req.user?.role !== "admin") {
        const assignedPhones = await storage.getPhoneNumbersAssignedToUser(
          req.user!.id,
        );
        const phoneIds = new Set(assignedPhones.map((p) => p.id));
        if (
          !conversation.phoneNumberId ||
          !phoneIds.has(conversation.phoneNumberId)
        ) {
          return res
            .status(403)
            .json({ message: "Access denied to this conversation" });
        }
      }

      const updated = await storage.updateConversation(id, { unreadCount: 0 });
      res.json(updated);
    } catch (err) {
      console.error("Mark as read error:", err);
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  app.delete("/api/conversations/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;

      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      if (
        req.user?.role !== "admin" &&
        conversation.assignedUserId !== req.user?.id
      ) {
        return res
          .status(403)
          .json({ message: "Access denied to this conversation" });
      }

      await storage.deleteConversation(id);
      res.json({ success: true });
    } catch (err) {
      console.error("Delete conversation error:", err);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;

      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Check access: admin has full access, team member needs assigned phone number
      if (req.user?.role !== "admin") {
        const assignedPhones = await storage.getPhoneNumbersAssignedToUser(
          req.user!.id,
        );
        const phoneIds = new Set(assignedPhones.map((p) => p.id));
        if (
          !conversation.phoneNumberId ||
          !phoneIds.has(conversation.phoneNumberId)
        ) {
          return res
            .status(403)
            .json({ message: "Access denied to this conversation" });
        }
      }

      const messages = await storage.getMessages(id);
      res.json(messages);
    } catch (err) {
      console.error("Messages fetch error:", err);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const { content, mediaUrl, mediaType } = req.body;

      if (!content && !mediaUrl) {
        return res.status(400).json({ message: "Message content or media is required" });
      }

      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Check access: admin has full access, team member needs assigned phone number
      if (req.user?.role !== "admin") {
        const assignedPhones = await storage.getPhoneNumbersAssignedToUser(
          req.user!.id,
        );
        const phoneIds = new Set(assignedPhones.map((p) => p.id));
        if (
          !conversation.phoneNumberId ||
          !phoneIds.has(conversation.phoneNumberId)
        ) {
          return res
            .status(403)
            .json({ message: "Access denied to this conversation" });
        }
      }

      let smsStatus: "pending" | "sent" | "delivered" | "failed" = "pending";
      let providerMessageId: string | undefined = undefined;
      let smsErrorMessage: string | undefined = undefined;

      if (conversation.phoneNumberId) {
        const phoneNumber = await storage.getPhoneNumber(
          conversation.phoneNumberId,
        );
        if (
          phoneNumber &&
          phoneNumber.gatewayId &&
          conversation.contactNumber
        ) {
          // Get the gateway from the phone number, not from the user
          // This ensures team members use the correct admin's gateway
          const gateway = await storage.getSmsGateway(phoneNumber.gatewayId);
          if (gateway) {
            const provider = createSmsProvider(gateway);
            if (provider.isConfigured()) {
              try {
                // Build status callback URL from request host
                const protocol =
                  req.headers["x-forwarded-proto"] || req.protocol || "https";
                const host =
                  req.headers["x-forwarded-host"] || req.headers.host;
                const statusCallback = `${protocol}://${host}/api/webhooks/sms/status`;

                const smsResult = await provider.sendSms({
                  from: formatToE164(phoneNumber.number),
                  to: formatToE164(conversation.contactNumber),
                  body: content || "",
                  statusCallback,
                  mediaUrl: mediaUrl || undefined,
                });
                providerMessageId = smsResult.id;
                smsStatus =
                  smsResult.status === "queued" || smsResult.status === "sent"
                    ? "sent"
                    : "failed";
              } catch (smsError) {
                console.error("SMS send error:", smsError);
                smsStatus = "failed";
                smsErrorMessage = smsError instanceof Error ? smsError.message : "Unknown error";
              }
            }
          }
        }
      }

      const message = await storage.createMessage({
        conversationId: id as string,
        senderId: req.user!.id,
        content: (content as string) || "",
        direction: "outbound",
        status: smsStatus,
        signalwireMessageId: providerMessageId,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
      });

      const preview = content
        ? (content as string).substring(0, 100)
        : (mediaType?.startsWith("image/") ? "📷 Photo" : mediaType?.startsWith("audio/") ? "🎤 Voice message" : "📎 Attachment");

      await storage.updateConversation(id as string, {
        lastMessageAt: new Date(),
        lastMessagePreview: preview,
      });

      broadcastToConversation(id as string, {
        type: "new_message",
        message,
        conversation,
      });

      // Broadcast to the sender
      broadcastToUser(req.user!.id, {
        type: "conversation_updated",
        conversationId: id,
        lastMessageAt: new Date(),
        lastMessagePreview: (content as string).substring(0, 100),
      });

      // Also broadcast to assigned team member or admin if different from sender
      if (conversation.phoneNumberId) {
        const phoneNumber = await storage.getPhoneNumber(
          conversation.phoneNumberId,
        );
        if (phoneNumber) {
          // If sender is admin, notify assigned team member
          if (
            req.user!.role === "admin" &&
            phoneNumber.assignedTo &&
            phoneNumber.assignedTo !== req.user!.id
          ) {
            broadcastToUser(phoneNumber.assignedTo, {
              type: "new_message",
              message,
              conversation,
              conversationId: id,
            });
          }
          // If sender is team member, notify admin
          if (
            req.user!.role === "team_member" &&
            phoneNumber.adminId &&
            phoneNumber.adminId !== req.user!.id
          ) {
            broadcastToUser(phoneNumber.adminId, {
              type: "new_message",
              message,
              conversation,
              conversationId: id,
            });
          }
        }
      }

      if (smsErrorMessage) {
        res.json({ ...message, smsError: smsErrorMessage });
      } else {
        res.json(message);
      }
    } catch (err) {
      console.error("Send message error:", err);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/sms-blast", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { contacts, message, phoneNumberId, blastId } = req.body;


      if (!Array.isArray(contacts) || contacts.length === 0) {
        return res.status(400).json({ message: "contacts array is required" });
      }
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ message: "message is required" });
      }
      if (!phoneNumberId) {
        return res.status(400).json({ message: "phoneNumberId is required" });
      }

      const phoneNumber = await storage.getPhoneNumber(phoneNumberId as string);
      if (!phoneNumber) {
        return res.status(404).json({ message: "Phone number not found" });
      }
      if (!phoneNumber.gatewayId) {
        return res.status(400).json({ message: "Phone number has no gateway configured" });
      }

      const gateway = await storage.getSmsGateway(phoneNumber.gatewayId);
      if (!gateway) {
        return res.status(400).json({ message: "Gateway not found" });
      }

      const provider = createSmsProvider(gateway);
      if (!provider.isConfigured()) {
        return res.status(400).json({ message: "SMS provider is not configured" });
      }

      const results: { sent: number; failed: number; errors: { phone: string; error: string }[] } = {
        sent: 0,
        failed: 0,
        errors: [],
      };

      // Deduplicate contacts by phone number to avoid sending duplicates
      const seenPhones = new Set<string>();
      const uniqueContacts = (contacts as { phone: string; name?: string }[]).filter((c) => {
        if (!c.phone) return false;
        const normalized = formatToE164(c.phone);
        if (seenPhones.has(normalized)) return false;
        seenPhones.add(normalized);
        return true;
      });

      console.log(`[SMS Blast] Starting blast: ${uniqueContacts.length} unique contacts (${contacts.length} total), from=${phoneNumber.number}, provider=${gateway.provider}`);

      for (const contact of uniqueContacts) {
        if (!contact.phone) continue;
        const toNumber = formatToE164(contact.phone);
        console.log(`[SMS Blast] Sending to ${toNumber}...`);
        try {
          const smsResult = await provider.sendSms({
            from: formatToE164(phoneNumber.number),
            to: toNumber,
            body: message.trim(),
          });
          console.log(`[SMS Blast] Sent to ${toNumber}, id=${smsResult.id}, status=${smsResult.status}`);
          results.sent++;
        } catch (err) {
          console.error(`[SMS Blast] Failed to send to ${toNumber}:`, err);
          results.failed++;
          results.errors.push({
            phone: contact.phone,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      console.log(`[SMS Blast] Complete: ${results.sent} sent, ${results.failed} failed`);

      res.json(results);
    } catch (err) {
      console.error("SMS blast error:", err);
      res.status(500).json({ message: "SMS blast failed" });
    }
  });

  app.get("/api/insights", requireAuth, requireAdmin, async (req, res) => {
    try {
      const insights = await storage.getMessageInsightsForAdmin(req.user!.id);
      res.json(insights);
    } catch (err) {
      console.error("Insights fetch error:", err);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  // SMS Gateway Integration Routes
  app.get("/api/integrations/gateways", requireAuth, async (req, res) => {
    try {
      if (req.user?.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Only admins can manage integrations" });
      }

      const gateways = await storage.getSmsGateways(req.user.id);
      // Return gateways without exposing credentials
      const safeGateways = gateways.map((g) => ({
        ...g,
        credentials: undefined,
        hasCredentials: true,
      }));
      res.json(safeGateways);
    } catch (err) {
      console.error("Get gateways error:", err);
      res.status(500).json({ message: "Failed to fetch gateways" });
    }
  });

  app.get(
    "/api/integrations/gateways/active",
    requireAuth,
    async (req, res) => {
      try {
        // Get admin ID - for team members, get their creator's admin ID
        let adminId = req.user?.id;
        if (req.user?.role === "team_member") {
          const user = await storage.getUser(req.user.id);
          adminId = user?.createdBy || req.user.id;
        }

        const gateway = await storage.getActiveSmsGateway(adminId!);
        if (!gateway) {
          return res.json(null);
        }

        res.json({
          ...gateway,
          credentials: undefined,
          hasCredentials: true,
        });
      } catch (err) {
        console.error("Get active gateway error:", err);
        res.status(500).json({ message: "Failed to fetch active gateway" });
      }
    },
  );

  app.post("/api/integrations/gateways", requireAuth, async (req, res) => {
    try {
      if (req.user?.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Only admins can manage integrations" });
      }

      const validated = connectGatewaySchema.parse(req.body);

      // Test credentials before saving - create a temporary provider
      const tempGateway = {
        id: "temp",
        adminId: req.user.id,
        provider: validated.provider as SmsProvider,
        name: validated.name,
        credentials: validated.credentials as unknown as string,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tempProvider = createSmsProvider(tempGateway);
      const testResult = await tempProvider.testConnection();

      if (!testResult.success) {
        console.error("Gateway connection test failed:", testResult.error);
        return res.status(400).json({
          message: "Connection failed",
          error:
            testResult.error || "Please check your credentials and try again.",
        });
      }

      // Check if this is the first gateway for this admin
      const existingGateways = await storage.getSmsGateways(req.user.id);
      const isFirstGateway = existingGateways.length === 0;

      // Encrypt credentials before storing
      const encryptedCredentials = JSON.stringify(validated.credentials);

      const gateway = await storage.createSmsGateway({
        adminId: req.user.id,
        provider: validated.provider as SmsProvider,
        name: validated.name,
        credentials: encryptedCredentials,
        isActive: isFirstGateway,
      });

      // Auto-sync phone numbers from the new gateway
      let syncedCount = 0;
      if (isFirstGateway) {
        try {
          const provider = createSmsProvider(gateway);
          const ownedNumbers = await provider.getOwnedNumbers();

          for (const num of ownedNumbers) {
            try {
              const existingNumber = await storage.getPhoneNumberByNumber(
                num.number,
              );
              if (!existingNumber) {
                await storage.createPhoneNumber({
                  number: num.number,
                  friendlyName: num.friendlyName,
                  providerId: num.id,
                  provider: gateway.provider,
                  gatewayId: gateway.id,
                  adminId: req.user.id,
                  capabilities: num.capabilities,
                });
                syncedCount++;
              }
            } catch (syncErr) {
              console.error(`Failed to sync number ${num.number}:`, syncErr);
            }
          }
          console.log(
            `Auto-synced ${syncedCount} phone numbers for new gateway ${gateway.id}`,
          );
        } catch (syncErr) {
          console.error("Auto-sync failed:", syncErr);
        }
      }

      res.json({
        ...gateway,
        credentials: undefined,
        hasCredentials: true,
        syncedNumbers: syncedCount,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid gateway data", errors: err.errors });
      }
      console.error("Create gateway error:", err);
      res.status(500).json({ message: "Failed to create gateway" });
    }
  });

  app.patch(
    "/api/integrations/gateways/:id/activate",
    requireAuth,
    async (req, res) => {
      try {
        if (req.user?.role !== "admin") {
          return res
            .status(403)
            .json({ message: "Only admins can manage integrations" });
        }

        const gatewayId = req.params.id as string;
        const gateway = await storage.setActiveSmsGateway(
          req.user.id,
          gatewayId,
        );
        if (!gateway) {
          return res.status(404).json({ message: "Gateway not found" });
        }

        res.json({
          ...gateway,
          credentials: undefined,
          hasCredentials: true,
        });
      } catch (err) {
        console.error("Activate gateway error:", err);
        res.status(500).json({ message: "Failed to activate gateway" });
      }
    },
  );

  app.delete(
    "/api/integrations/gateways/:id",
    requireAuth,
    async (req, res) => {
      try {
        if (req.user?.role !== "admin") {
          return res
            .status(403)
            .json({ message: "Only admins can manage integrations" });
        }

        const gatewayId = req.params.id as string;
        const gateway = await storage.getSmsGateway(gatewayId);
        if (!gateway || gateway.adminId !== req.user.id) {
          return res.status(404).json({ message: "Gateway not found" });
        }

        // First, clear phoneNumberId from conversations that reference these phone numbers
        await storage.clearConversationPhoneNumbers(gatewayId);
        console.log(
          `Cleared phone number references from conversations for gateway ${gatewayId}`,
        );

        // Now delete associated phone numbers
        const deletedNumbers =
          await storage.deletePhoneNumbersByGateway(gatewayId);
        console.log(
          `Deleted ${deletedNumbers} phone numbers for gateway ${gatewayId}`,
        );

        await storage.deleteSmsGateway(gatewayId);
        res.json({ success: true, deletedNumbers });
      } catch (err) {
        console.error("Delete gateway error:", err);
        res.status(500).json({ message: "Failed to delete gateway" });
      }
    },
  );

  // ============== SMS WEBHOOKS ==============
  // These endpoints receive callbacks from SMS providers (Twilio, SignalWire, Telnyx)

  // Inbound SMS webhook - receives incoming messages
  app.post("/api/webhooks/sms/inbound", async (req, res) => {
    try {
      console.log(
        "Inbound SMS webhook received:",
        JSON.stringify(req.body, null, 2),
      );

      // Determine provider from request format
      let fromNumber: string;
      let toNumber: string;
      let messageBody: string;
      let providerMessageId: string;

      let inboundMediaUrl: string | null = null;
      let inboundMediaType: string | null = null;

      // Twilio/SignalWire format
      if (req.body.From && req.body.To && req.body.Body !== undefined) {
        fromNumber = formatToE164(req.body.From);
        toNumber = formatToE164(req.body.To);
        messageBody = req.body.Body || "";
        providerMessageId = req.body.MessageSid || req.body.SmsSid || "";
        // Parse MMS media (Twilio/SignalWire attach MediaUrl0, MediaContentType0, etc.)
        const numMedia = parseInt(req.body.NumMedia || "0", 10);
        if (numMedia > 0) {
          inboundMediaUrl = req.body.MediaUrl0 || null;
          inboundMediaType = req.body.MediaContentType0 || null;
        }
      }
      // Telnyx format
      else if (req.body.data?.payload) {
        const payload = req.body.data.payload;
        fromNumber = formatToE164(payload.from?.phone_number || "");
        toNumber = formatToE164(
          payload.to?.[0]?.phone_number || payload.to || "",
        );
        messageBody = payload.text || "";
        providerMessageId = payload.id || "";
        // Telnyx MMS media
        if (payload.media && payload.media.length > 0) {
          inboundMediaUrl = payload.media[0].url || null;
          inboundMediaType = payload.media[0].content_type || null;
        }
      } else {
        console.error("Unknown webhook format:", req.body);
        return res.status(400).json({ message: "Unknown webhook format" });
      }

      // Find the phone number in our system
      const phoneNumber = await storage.getPhoneNumberByNumber(toNumber);
      if (!phoneNumber) {
        console.error(`Phone number not found: ${toNumber}`);
        return res.status(404).json({ message: "Phone number not found" });
      }

      // Find or create conversation
      let conversation = await storage.getConversationByPhoneAndContact(
        phoneNumber.id,
        fromNumber,
      );

      if (!conversation) {
        // Create new conversation for this inbound message
        // If phone number is assigned to a team member, assign conversation to them
        conversation = await storage.createConversation({
          phoneNumberId: phoneNumber.id,
          contactNumber: fromNumber,
          contactName: null,
          category: "general",
          assignedUserId: phoneNumber.assignedTo || null,
        });
      }

      // Create the inbound message
      const message = await storage.createMessage({
        conversationId: conversation.id,
        content: messageBody,
        direction: "inbound",
        status: "delivered",
        senderId: null,
        signalwireMessageId: providerMessageId,
        mediaUrl: inboundMediaUrl,
        mediaType: inboundMediaType,
      });

      // Update conversation with incremented unread count and last message
      const inboundPreview = messageBody
        || (inboundMediaType?.startsWith("image/") ? "📷 Photo" : inboundMediaType?.startsWith("audio/") ? "🎤 Voice message" : "📎 Attachment");
      await storage.updateConversation(conversation.id, {
        unreadCount: (conversation.unreadCount || 0) + 1,
        lastMessagePreview: inboundPreview,
        lastMessageAt: new Date(),
      });

      // Prepare WebSocket message
      const wsMessageData = JSON.stringify({
        type: "new_inbound_message",
        conversationId: conversation!.id,
        phoneNumberId: phoneNumber.id,
        message: {
          ...message,
          senderName: conversation!.contactName || fromNumber,
        },
      });

      // Notification scoping:
      // - If number is assigned to a team member → notify ONLY that team member
      // - If number is NOT assigned → notify admin only
      if (phoneNumber.assignedTo && phoneNumber.assignedTo !== phoneNumber.adminId) {
        // Number is assigned to a team member — notify only them
        const teamMemberWsClients = userClients.get(phoneNumber.assignedTo);
        if (teamMemberWsClients) {
          teamMemberWsClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(wsMessageData);
              console.log(`Sent new_inbound_message to assigned team member WebSocket client`);
            }
          });
        }
      } else {
        // Number is unassigned — notify admin
        const adminWsClients = phoneNumber.adminId
          ? userClients.get(phoneNumber.adminId)
          : null;
        if (adminWsClients) {
          adminWsClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(wsMessageData);
              console.log(`Sent new_inbound_message to admin WebSocket client`);
            }
          });
        }
      }

      console.log(
        `Inbound message saved: ${message.id} from ${fromNumber} to ${toNumber}`,
      );

      // Respond with TwiML for Twilio/SignalWire (empty response)
      res
        .type("text/xml")
        .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    } catch (err) {
      console.error("Inbound webhook error:", err);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Status callback webhook - receives delivery status updates
  app.post("/api/webhooks/sms/status", async (req, res) => {
    try {
      console.log(
        "Status webhook received:",
        JSON.stringify(req.body, null, 2),
      );

      let providerMessageId: string;
      let status: string;
      let errorCode: string | null = null;

      // Twilio/SignalWire format
      if (req.body.MessageSid || req.body.SmsSid) {
        providerMessageId = req.body.MessageSid || req.body.SmsSid;
        const rawStatus = (
          req.body.MessageStatus ||
          req.body.SmsStatus ||
          ""
        ).toLowerCase();

        // Map provider status to our status
        switch (rawStatus) {
          case "queued":
          case "accepted":
            status = "pending";
            break;
          case "sending":
          case "sent":
            status = "sent";
            break;
          case "delivered":
            status = "delivered";
            break;
          case "undelivered":
          case "failed":
            status = "failed";
            errorCode = req.body.ErrorCode || null;
            break;
          default:
            status = "sent";
        }
      }
      // Telnyx format
      else if (req.body.data?.payload) {
        const payload = req.body.data.payload;
        providerMessageId = payload.id || "";
        const rawStatus = (payload.to?.[0]?.status || "").toLowerCase();

        switch (rawStatus) {
          case "queued":
            status = "pending";
            break;
          case "sending":
          case "sent":
            status = "sent";
            break;
          case "delivered":
            status = "delivered";
            break;
          case "delivery_failed":
          case "sending_failed":
            status = "failed";
            break;
          default:
            status = "sent";
        }
      } else {
        console.error("Unknown status webhook format:", req.body);
        return res.status(400).json({ message: "Unknown webhook format" });
      }

      // Find and update the message
      const message = await storage.getMessageBySignalwireId(providerMessageId);
      if (message) {
        await storage.updateMessage(message.id, { status: status as any });

        // Broadcast status update via WebSocket
        const wsMessage = {
          type: "message_status",
          messageId: message.id,
          conversationId: message.conversationId,
          status,
          errorCode,
        };
        const wsMessageStr = JSON.stringify(wsMessage);

        // Broadcast to conversation subscribers
        clients.get(message.conversationId)?.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(wsMessageStr);
          }
        });

        // Also broadcast to the sender's user connection for real-time updates
        if (message.senderId) {
          userClients.get(message.senderId)?.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(wsMessageStr);
            }
          });
        }

        console.log(`Message ${message.id} status updated to: ${status}`);
      } else {
        console.log(`Message not found for provider ID: ${providerMessageId}`);
      }

      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Status webhook error:", err);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    let subscribedConversations = new Set<string>();
    let authenticatedUser: Express.User | null = null;
    let authenticatedUserId: string | null = null;

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "auth") {
          const userId = message.userId;
          if (userId) {
            const user = await storage.getUser(userId);
            if (user) {
              authenticatedUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                isActive: user.isActive,
              };
              authenticatedUserId = user.id;

              if (!userClients.has(user.id)) {
                userClients.set(user.id, new Set());
              }
              userClients.get(user.id)!.add(ws);
              console.log(
                `WebSocket authenticated for user ${user.id} (${user.username}). Total clients: ${userClients.get(user.id)?.size}`,
              );

              ws.send(JSON.stringify({ type: "auth_success" }));
            } else {
              ws.send(
                JSON.stringify({ type: "auth_error", message: "Invalid user" }),
              );
            }
          }
          return;
        }

        if (!authenticatedUser) {
          ws.send(
            JSON.stringify({ type: "error", message: "Not authenticated" }),
          );
          return;
        }

        if (message.type === "subscribe") {
          const conversationId = message.conversationId;

          const conversation = await storage.getConversation(conversationId);
          if (!conversation) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Conversation not found",
              }),
            );
            return;
          }

          if (
            authenticatedUser.role !== "admin" &&
            conversation.assignedUserId !== authenticatedUser.id
          ) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Access denied to this conversation",
              }),
            );
            return;
          }

          subscribedConversations.add(conversationId);

          if (!clients.has(conversationId)) {
            clients.set(conversationId, new Set());
          }
          clients.get(conversationId)!.add(ws);
          ws.send(JSON.stringify({ type: "subscribed", conversationId }));
        }

        if (message.type === "unsubscribe") {
          const conversationId = message.conversationId;
          subscribedConversations.delete(conversationId);
          clients.get(conversationId)?.delete(ws);
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    ws.on("close", () => {
      subscribedConversations.forEach((conversationId) => {
        clients.get(conversationId)?.delete(ws);
      });
      if (authenticatedUserId) {
        userClients.get(authenticatedUserId)?.delete(ws);
      }
    });
  });

  return httpServer;
}
