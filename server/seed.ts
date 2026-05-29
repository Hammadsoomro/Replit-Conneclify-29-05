import bcrypt from "bcrypt";
import { storage } from "./storage";
import { db } from "./db";
import { users, phoneNumbers } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  try {
    const [existingUsers] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    if (existingUsers && existingUsers.count > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database with sample data...");

    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await storage.createUser({
      username: "admin",
      email: "admin@conneclify.com",
      fullName: "John Administrator",
      password: adminPassword,
      role: "admin",
      isActive: true,
    });

    const team1Password = await bcrypt.hash("team123", 10);
    const team1 = await storage.createUser({
      username: "sarah.wilson",
      email: "sarah@conneclify.com",
      fullName: "Sarah Wilson",
      password: team1Password,
      role: "team_member",
      isActive: true,
      createdBy: admin.id,
    });

    const team2Password = await bcrypt.hash("team123", 10);
    const team2 = await storage.createUser({
      username: "mike.chen",
      email: "mike@conneclify.com",
      fullName: "Mike Chen",
      password: team2Password,
      role: "team_member",
      isActive: true,
      createdBy: admin.id,
    });


    console.log("Database seeded successfully!");
    console.log("Sample login credentials:");
    console.log("  Admin: username=admin, password=admin123");
    console.log("  Team: username=sarah.wilson, password=team123");
    console.log("  Team: username=mike.chen, password=team123");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
