import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("team_member"),
  avatar: text("avatar"),
  theme: text("theme").default("default"),
  ringtone: text("ringtone").default("chime"),
  notificationsEnabled: integer("notifications_enabled", { mode: "boolean" }).notNull().default(true),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  createdBy: text("created_by"),
});

export const smsGateways = sqliteTable("sms_gateways", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull(),
  provider: text("provider").notNull(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  credentials: text("credentials").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const phoneNumbers = sqliteTable("phone_numbers", {
  id: text("id").primaryKey(),
  number: text("number").notNull().unique(),
  friendlyName: text("friendly_name"),
  providerId: text("provider_id"),
  provider: text("provider"),
  gatewayId: text("gateway_id"),
  adminId: text("admin_id"),
  assignedTo: text("assigned_to"),
  capabilities: text("capabilities"), // JSON string for array
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  purchasedAt: integer("purchased_at", { mode: "timestamp" }).notNull(),
  monthlyRate: text("monthly_rate"),
});

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  contactNumber: text("contact_number").notNull(),
  contactName: text("contact_name"),
  phoneNumberId: text("phone_number_id"),
  assignedUserId: text("assigned_user_id"),
  category: text("category").notNull().default("general"),
  lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
  lastMessagePreview: text("last_message_preview"),
  unreadCount: integer("unread_count").notNull().default(0),
  isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
  isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  senderId: text("sender_id"),
  content: text("content").notNull().default(""),
  direction: text("direction").notNull(),
  status: text("status").notNull().default("pending"),
  signalwireMessageId: text("signalwire_message_id"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createTeamMemberSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertPhoneNumberSchema = createInsertSchema(phoneNumbers).omit({
  id: true,
  purchasedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1, "Message cannot be empty"),
});

export const insertSmsGatewaySchema = createInsertSchema(smsGateways).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const connectGatewaySchema = z.object({
  provider: z.enum(["signalwire", "twilio", "telnyx"]),
  name: z.string().min(1, "Name is required"),
  credentials: z.record(z.string()),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;

export type InsertPhoneNumber = z.infer<typeof insertPhoneNumberSchema>;
export type PhoneNumber = typeof phoneNumbers.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export type InsertSmsGateway = z.infer<typeof insertSmsGatewaySchema>;
export type SmsGateway = typeof smsGateways.$inferSelect;
export type ConnectGatewayInput = z.infer<typeof connectGatewaySchema>;
export type SmsProvider = "signalwire" | "twilio" | "telnyx";
