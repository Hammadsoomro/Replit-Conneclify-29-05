import {
  users,
  phoneNumbers,
  conversations,
  messages,
  smsGateways,
  type User,
  type InsertUser,
  type PhoneNumber,
  type InsertPhoneNumber,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type SmsGateway,
  type InsertSmsGateway,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getTeamMembers(): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  getPhoneNumbers(adminId?: string, gatewayId?: string): Promise<PhoneNumber[]>;
  getPhoneNumbersAssignedToUser(userId: string): Promise<PhoneNumber[]>;
  getPhoneNumber(id: string): Promise<PhoneNumber | undefined>;
  getPhoneNumberByNumber(number: string): Promise<PhoneNumber | undefined>;
  createPhoneNumber(phone: InsertPhoneNumber): Promise<PhoneNumber>;
  updatePhoneNumber(id: string, data: Partial<PhoneNumber>): Promise<PhoneNumber | undefined>;
  deletePhoneNumber(id: string): Promise<void>;
  deletePhoneNumbersByGateway(gatewayId: string): Promise<number>;
  clearConversationPhoneNumbers(gatewayId: string): Promise<void>;
  getPhoneNumberAssignments(adminId: string, teamMemberId: string): Promise<(PhoneNumber & { isAssigned: boolean })[]>;
  assignPhoneNumber(phoneNumberId: string, teamMemberId: string): Promise<void>;
  unassignPhoneNumber(phoneNumberId: string): Promise<void>;

  getConversations(userId?: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationByPhoneAndContact(phoneNumberId: string, contactNumber: string): Promise<Conversation | undefined>;
  createConversation(conv: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<void>;

  getMessages(conversationId: string): Promise<Message[]>;
  getMessageBySignalwireId(signalwireMessageId: string): Promise<Message | undefined>;
  createMessage(msg: InsertMessage): Promise<Message>;
  updateMessage(id: string, data: Partial<Message>): Promise<Message | undefined>;

  getDashboardStats(adminId: string): Promise<{
    totalConversations: number;
    activeConversations: number;
    totalMessages: number;
    phoneNumbers: number;
    teamMembers: number;
  }>;
  
  getRecentActivity(adminId: string, limit?: number): Promise<{
    id: string;
    type: string;
    description: string;
    contactName: string | null;
    phoneNumber: string;
    createdAt: Date;
  }[]>;
  
  getMessageInsightsForAdmin(adminId: string): Promise<{
    messagesByDay: { day: string; sent: number; received: number }[];
    messagesByHour: { hour: string; count: number }[];
    deliveryStats: { status: string; count: number }[];
    totalSent: number;
    totalReceived: number;
    avgResponseTime: string;
    deliveryRate: number;
  }>;

  // SMS Gateway methods
  getSmsGateways(adminId: string): Promise<SmsGateway[]>;
  getSmsGateway(id: string): Promise<SmsGateway | undefined>;
  getActiveSmsGateway(adminId: string): Promise<SmsGateway | undefined>;
  createSmsGateway(gateway: InsertSmsGateway): Promise<SmsGateway>;
  updateSmsGateway(id: string, data: Partial<SmsGateway>): Promise<SmsGateway | undefined>;
  deleteSmsGateway(id: string): Promise<void>;
  setActiveSmsGateway(adminId: string, gatewayId: string): Promise<SmsGateway | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Case-insensitive username lookup for better UX
    const [user] = await db.select().from(users).where(ilike(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

 async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();

    if (!result || result.length === 0) {
      throw new Error("User insert failed");
    }

    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getTeamMembers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<void> {
    // First nullify all FK references to this user to avoid constraint violations
    await db.update(conversations)
      .set({ assignedUserId: null })
      .where(eq(conversations.assignedUserId, id));
    await db.update(phoneNumbers)
      .set({ assignedTo: null })
      .where(eq(phoneNumbers.assignedTo, id));
    await db.update(messages)
      .set({ senderId: null })
      .where(eq(messages.senderId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async getPhoneNumbers(adminId?: string, gatewayId?: string): Promise<PhoneNumber[]> {
    if (gatewayId) {
      // Filter by gateway ID for proper multi-tenant isolation
      return db.select().from(phoneNumbers)
        .where(eq(phoneNumbers.gatewayId, gatewayId))
        .orderBy(desc(phoneNumbers.purchasedAt));
    }
    if (adminId) {
      return db.select().from(phoneNumbers)
        .where(eq(phoneNumbers.adminId, adminId))
        .orderBy(desc(phoneNumbers.purchasedAt));
    }
    return db.select().from(phoneNumbers).orderBy(desc(phoneNumbers.purchasedAt));
  }

  async getPhoneNumbersAssignedToUser(userId: string): Promise<PhoneNumber[]> {
    return db.select().from(phoneNumbers)
      .where(eq(phoneNumbers.assignedTo, userId))
      .orderBy(desc(phoneNumbers.purchasedAt));
  }

  async getPhoneNumber(id: string): Promise<PhoneNumber | undefined> {
    const [phone] = await db.select().from(phoneNumbers).where(eq(phoneNumbers.id, id));
    return phone || undefined;
  }

  async getPhoneNumberByNumber(number: string): Promise<PhoneNumber | undefined> {
    const [phone] = await db.select().from(phoneNumbers).where(eq(phoneNumbers.number, number));
    return phone || undefined;
  }

  async createPhoneNumber(phone: InsertPhoneNumber): Promise<PhoneNumber> {
    const result = await db.insert(phoneNumbers).values(phone).returning();

    if (!result || result.length === 0) {
      throw new Error("Phone number insert failed");
    }

    return result[0];
  }

  async updatePhoneNumber(id: string, data: Partial<PhoneNumber>): Promise<PhoneNumber | undefined> {
    const result = await db.update(phoneNumbers).set(data).where(eq(phoneNumbers.id, id)).returning();

    if (!result || result.length === 0) {
      throw new Error("Phone number update failed");
    }

    return result[0];
    }

  async deletePhoneNumber(id: string): Promise<void> {
    // Nullify FK references in conversations before deleting
    await db.update(conversations)
      .set({ phoneNumberId: null })
      .where(eq(conversations.phoneNumberId, id));
    await db.delete(phoneNumbers).where(eq(phoneNumbers.id, id));
  }

  async deletePhoneNumbersByGateway(gatewayId: string): Promise<number> {
    const deleted = await db.delete(phoneNumbers).where(eq(phoneNumbers.gatewayId, gatewayId)).returning();
    return deleted.length;
  }

  async clearConversationPhoneNumbers(gatewayId: string): Promise<void> {
    // Get all phone numbers for this gateway
    const nums = await db.select({ id: phoneNumbers.id }).from(phoneNumbers).where(eq(phoneNumbers.gatewayId, gatewayId));
    const phoneNumberIds = nums.map(n => n.id);
    
    if (phoneNumberIds.length > 0) {
      // Set phoneNumberId to null for all conversations referencing these phone numbers
      for (const phoneId of phoneNumberIds) {
        await db.update(conversations)
          .set({ phoneNumberId: null })
          .where(eq(conversations.phoneNumberId, phoneId));
      }
    }
  }

  async getPhoneNumberAssignments(adminId: string, teamMemberId: string): Promise<(PhoneNumber & { isAssigned: boolean })[]> {
    const phones = await db
      .select()
      .from(phoneNumbers)
      .innerJoin(smsGateways, eq(phoneNumbers.gatewayId, smsGateways.id))
      .where(eq(smsGateways.adminId, adminId));
    
    return phones.map(p => ({
      ...p.phone_numbers,
      isAssigned: p.phone_numbers.assignedTo === teamMemberId,
    }));
  }

  async assignPhoneNumber(phoneNumberId: string, teamMemberId: string): Promise<void> {
    await db.update(phoneNumbers)
      .set({ assignedTo: teamMemberId })
      .where(eq(phoneNumbers.id, phoneNumberId));
  }

  async unassignPhoneNumber(phoneNumberId: string): Promise<void> {
    await db.update(phoneNumbers)
      .set({ assignedTo: null })
      .where(eq(phoneNumbers.id, phoneNumberId));
  }

  async getConversations(userId?: string): Promise<Conversation[]> {
    if (userId) {
      return db
        .select()
        .from(conversations)
        .where(eq(conversations.assignedUserId, userId))
        .orderBy(desc(conversations.lastMessageAt));
    }
    return db.select().from(conversations).orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv || undefined;
  }

  async getConversationByPhoneAndContact(phoneNumberId: string, contactNumber: string): Promise<Conversation | undefined> {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.phoneNumberId, phoneNumberId),
          eq(conversations.contactNumber, contactNumber)
        )
      );
    return conv || undefined;
  }

  async createConversation(conv: InsertConversation): Promise<Conversation> {
    const [newConv] = await db.insert(conversations).values(conv).returning();
    return newConv;
  }

  async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation | undefined> {
    const [conv] = await db.update(conversations).set(data).where(eq(conversations.id, id)).returning();
    return conv || undefined;
  }

  async deleteConversation(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async getMessageBySignalwireId(signalwireMessageId: string): Promise<Message | undefined> {
    const [msg] = await db
      .select()
      .from(messages)
      .where(eq(messages.signalwireMessageId, signalwireMessageId));
    return msg || undefined;
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const [newMsg] = await db.insert(messages).values(msg).returning();
    return newMsg;
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<Message | undefined> {
    const [msg] = await db.update(messages).set(data).where(eq(messages.id, id)).returning();
    return msg || undefined;
  }

  async getDashboardStats(adminId: string) {
    // Get phone numbers owned by this admin
    const adminPhoneNumbers = await db
      .select({ id: phoneNumbers.id })
      .from(phoneNumbers)
      .innerJoin(smsGateways, eq(phoneNumbers.gatewayId, smsGateways.id))
      .where(eq(smsGateways.adminId, adminId));
    
    const phoneNumberIds = adminPhoneNumbers.map(p => p.id);
    
    if (phoneNumberIds.length === 0) {
      // Get team members created by this admin
      const [teamStats] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.createdBy, adminId));

      return {
        totalConversations: 0,
        activeConversations: 0,
        totalMessages: 0,
        phoneNumbers: 0,
        teamMembers: teamStats?.total || 0,
      };
    }

    const phoneFilter = sql`${conversations.phoneNumberId} IN (${sql.join(phoneNumberIds.map(id => sql`${id}`), sql`, `)})`;

    const [convStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${conversations.isArchived} = false)::int`,
      })
      .from(conversations)
      .where(phoneFilter);

    const [msgStats] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(phoneFilter);

    const [phoneStats] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(phoneNumbers)
      .innerJoin(smsGateways, eq(phoneNumbers.gatewayId, smsGateways.id))
      .where(eq(smsGateways.adminId, adminId));

    const [teamStats] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.createdBy, adminId));

    return {
      totalConversations: convStats?.total || 0,
      activeConversations: convStats?.active || 0,
      totalMessages: msgStats?.total || 0,
      phoneNumbers: phoneStats?.total || 0,
      teamMembers: teamStats?.total || 0,
    };
  }

  async getMessageInsights() {
    const messagesByDay = await db
      .select({
        day: sql<string>`to_char(${messages.createdAt}, 'Dy')`,
        sent: sql<number>`count(*) filter (where ${messages.direction} = 'outbound')::int`,
        received: sql<number>`count(*) filter (where ${messages.direction} = 'inbound')::int`,
      })
      .from(messages)
      .where(sql`${messages.createdAt} >= now() - interval '7 days'`)
      .groupBy(sql`to_char(${messages.createdAt}, 'Dy'), extract(dow from ${messages.createdAt})`)
      .orderBy(sql`extract(dow from ${messages.createdAt})`);

    const messagesByHour = await db
      .select({
        hour: sql<string>`to_char(${messages.createdAt}, 'HH12AM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(messages)
      .where(sql`${messages.createdAt} >= now() - interval '7 days'`)
      .groupBy(sql`to_char(${messages.createdAt}, 'HH12AM'), extract(hour from ${messages.createdAt})`)
      .orderBy(sql`extract(hour from ${messages.createdAt})`);

    const deliveryStats = await db
      .select({
        status: messages.status,
        count: sql<number>`count(*)::int`,
      })
      .from(messages)
      .where(eq(messages.direction, "outbound"))
      .groupBy(messages.status);

    const [totalSent] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(eq(messages.direction, "outbound"));

    const [totalReceived] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(eq(messages.direction, "inbound"));

    const [deliveredCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(and(eq(messages.direction, "outbound"), eq(messages.status, "delivered")));

    const totalOutbound = totalSent?.count || 0;
    const delivered = deliveredCount?.count || 0;
    const deliveryRate = totalOutbound > 0 ? ((delivered / totalOutbound) * 100).toFixed(1) : 0;

    const statusMap: Record<string, string> = {
      pending: "Pending",
      sent: "Sent",
      delivered: "Delivered",
      failed: "Failed",
    };

    return {
      messagesByDay: messagesByDay.length > 0 ? messagesByDay : [
        { day: "Mon", sent: 0, received: 0 },
        { day: "Tue", sent: 0, received: 0 },
        { day: "Wed", sent: 0, received: 0 },
        { day: "Thu", sent: 0, received: 0 },
        { day: "Fri", sent: 0, received: 0 },
        { day: "Sat", sent: 0, received: 0 },
        { day: "Sun", sent: 0, received: 0 },
      ],
      messagesByHour: messagesByHour.length > 0 ? messagesByHour : [
        { hour: "6AM", count: 0 },
        { hour: "9AM", count: 0 },
        { hour: "12PM", count: 0 },
        { hour: "3PM", count: 0 },
        { hour: "6PM", count: 0 },
        { hour: "9PM", count: 0 },
      ],
      deliveryStats: deliveryStats.map((d) => ({
        status: statusMap[d.status] || d.status,
        count: d.count,
      })),
      totalSent: totalSent?.count || 0,
      totalReceived: totalReceived?.count || 0,
      avgResponseTime: await this.calculateAvgResponseTime(),
      deliveryRate: Number(deliveryRate),
    };
  }

  async calculateAvgResponseTime(): Promise<string> {
    // Calculate average time between inbound message and next outbound message in same conversation
    const result = await db.execute(sql`
      WITH response_times AS (
        SELECT 
          m1.conversation_id,
          m1.created_at as inbound_time,
          (
            SELECT MIN(m2.created_at)
            FROM ${messages} m2
            WHERE m2.conversation_id = m1.conversation_id
              AND m2.direction = 'outbound'
              AND m2.created_at > m1.created_at
          ) as response_time
        FROM ${messages} m1
        WHERE m1.direction = 'inbound'
          AND m1.created_at >= now() - interval '7 days'
      )
      SELECT 
        EXTRACT(EPOCH FROM AVG(response_time - inbound_time)) as avg_seconds
      FROM response_times
      WHERE response_time IS NOT NULL
    `);
    
    const avgSeconds = Number((result.rows[0] as any)?.avg_seconds) || 0;
    
    if (avgSeconds === 0) return "N/A";
    
    if (avgSeconds < 60) {
      return `${Math.round(avgSeconds)}s`;
    } else if (avgSeconds < 3600) {
      const minutes = Math.floor(avgSeconds / 60);
      const seconds = Math.round(avgSeconds % 60);
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(avgSeconds / 3600);
      const minutes = Math.round((avgSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  async getRecentActivity(adminId: string, limit: number = 10) {
    // Get phone numbers owned by this admin (via their gateway)
    const adminPhoneNumbers = await db
      .select({ id: phoneNumbers.id })
      .from(phoneNumbers)
      .innerJoin(smsGateways, eq(phoneNumbers.gatewayId, smsGateways.id))
      .where(eq(smsGateways.adminId, adminId));
    
    const phoneNumberIds = adminPhoneNumbers.map(p => p.id);
    
    if (phoneNumberIds.length === 0) {
      return [];
    }

    const recentMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        direction: messages.direction,
        status: messages.status,
        createdAt: messages.createdAt,
        contactName: conversations.contactName,
        contactPhone: conversations.contactNumber,
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(sql`${conversations.phoneNumberId} IN (${sql.join(phoneNumberIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return recentMessages.map((msg) => ({
      id: msg.id,
      type: msg.direction === 'inbound' ? 'received' : 'sent',
      description: msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content,
      contactName: msg.contactName,
      phoneNumber: msg.contactPhone,
      createdAt: msg.createdAt,
    }));
  }
  
  async getMessageInsightsForAdmin(adminId: string) {
    // Get phone numbers owned by this admin
    const adminPhoneNumbers = await db
      .select({ id: phoneNumbers.id })
      .from(phoneNumbers)
      .innerJoin(smsGateways, eq(phoneNumbers.gatewayId, smsGateways.id))
      .where(eq(smsGateways.adminId, adminId));
    
    const phoneNumberIds = adminPhoneNumbers.map(p => p.id);
    
    if (phoneNumberIds.length === 0) {
      return {
        messagesByDay: [
          { day: "Mon", sent: 0, received: 0 },
          { day: "Tue", sent: 0, received: 0 },
          { day: "Wed", sent: 0, received: 0 },
          { day: "Thu", sent: 0, received: 0 },
          { day: "Fri", sent: 0, received: 0 },
          { day: "Sat", sent: 0, received: 0 },
          { day: "Sun", sent: 0, received: 0 },
        ],
        messagesByHour: [
          { hour: "6AM", count: 0 },
          { hour: "9AM", count: 0 },
          { hour: "12PM", count: 0 },
          { hour: "3PM", count: 0 },
          { hour: "6PM", count: 0 },
          { hour: "9PM", count: 0 },
        ],
        deliveryStats: [],
        totalSent: 0,
        totalReceived: 0,
        avgResponseTime: "N/A",
        deliveryRate: 0,
      };
    }

    const phoneFilter = sql`${conversations.phoneNumberId} IN (${sql.join(phoneNumberIds.map(id => sql`${id}`), sql`, `)})`;

    const messagesByDay = await db
      .select({
        day: sql<string>`to_char(${messages.createdAt}, 'Dy')`,
        sent: sql<number>`count(*) filter (where ${messages.direction} = 'outbound')::int`,
        received: sql<number>`count(*) filter (where ${messages.direction} = 'inbound')::int`,
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(
        sql`${messages.createdAt} >= now() - interval '7 days'`,
        phoneFilter
      ))
      .groupBy(sql`to_char(${messages.createdAt}, 'Dy'), extract(dow from ${messages.createdAt})`)
      .orderBy(sql`extract(dow from ${messages.createdAt})`);

    const messagesByHour = await db
      .select({
        hour: sql<string>`to_char(${messages.createdAt}, 'HH12AM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(
        sql`${messages.createdAt} >= now() - interval '7 days'`,
        phoneFilter
      ))
      .groupBy(sql`to_char(${messages.createdAt}, 'HH12AM'), extract(hour from ${messages.createdAt})`)
      .orderBy(sql`extract(hour from ${messages.createdAt})`);

    const deliveryStats = await db
      .select({
        status: messages.status,
        count: sql<number>`count(*)::int`,
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(eq(messages.direction, "outbound"), phoneFilter))
      .groupBy(messages.status);

    const [totalSent] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(eq(messages.direction, "outbound"), phoneFilter));

    const [totalReceived] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(eq(messages.direction, "inbound"), phoneFilter));

    const [deliveredCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(
        eq(messages.direction, "outbound"), 
        eq(messages.status, "delivered"),
        phoneFilter
      ));

    const totalOutbound = totalSent?.count || 0;
    const delivered = deliveredCount?.count || 0;
    const deliveryRate = totalOutbound > 0 ? ((delivered / totalOutbound) * 100).toFixed(1) : 0;

    const statusMap: Record<string, string> = {
      pending: "Pending",
      sent: "Sent",
      delivered: "Delivered",
      failed: "Failed",
    };

    // Calculate avg response time with admin scoping
    const avgResponseTime = await this.calculateAvgResponseTimeForAdmin(adminId);

    return {
      messagesByDay: messagesByDay.length > 0 ? messagesByDay : [
        { day: "Mon", sent: 0, received: 0 },
        { day: "Tue", sent: 0, received: 0 },
        { day: "Wed", sent: 0, received: 0 },
        { day: "Thu", sent: 0, received: 0 },
        { day: "Fri", sent: 0, received: 0 },
        { day: "Sat", sent: 0, received: 0 },
        { day: "Sun", sent: 0, received: 0 },
      ],
      messagesByHour: messagesByHour.length > 0 ? messagesByHour : [
        { hour: "6AM", count: 0 },
        { hour: "9AM", count: 0 },
        { hour: "12PM", count: 0 },
        { hour: "3PM", count: 0 },
        { hour: "6PM", count: 0 },
        { hour: "9PM", count: 0 },
      ],
      deliveryStats: deliveryStats.map((d) => ({
        status: statusMap[d.status] || d.status,
        count: d.count,
      })),
      totalSent: totalSent?.count || 0,
      totalReceived: totalReceived?.count || 0,
      avgResponseTime,
      deliveryRate: Number(deliveryRate),
    };
  }

  async calculateAvgResponseTimeForAdmin(adminId: string): Promise<string> {
    // Get phone numbers owned by this admin
    const adminPhoneNumbers = await db
      .select({ id: phoneNumbers.id })
      .from(phoneNumbers)
      .innerJoin(smsGateways, eq(phoneNumbers.gatewayId, smsGateways.id))
      .where(eq(smsGateways.adminId, adminId));
    
    const phoneNumberIds = adminPhoneNumbers.map(p => p.id);
    
    if (phoneNumberIds.length === 0) {
      return "N/A";
    }

    const result = await db.execute(sql`
      WITH admin_conversations AS (
        SELECT id FROM ${conversations}
        WHERE phone_number_id IN (${sql.join(phoneNumberIds.map(id => sql`${id}`), sql`, `)})
      ),
      response_times AS (
        SELECT 
          m1.conversation_id,
          m1.created_at as inbound_time,
          (
            SELECT MIN(m2.created_at)
            FROM ${messages} m2
            WHERE m2.conversation_id = m1.conversation_id
              AND m2.direction = 'outbound'
              AND m2.created_at > m1.created_at
              AND m2.created_at <= m1.created_at + interval '24 hours'
          ) as response_time
        FROM ${messages} m1
        WHERE m1.direction = 'inbound'
          AND m1.created_at >= now() - interval '7 days'
          AND m1.conversation_id IN (SELECT id FROM admin_conversations)
      )
      SELECT 
        EXTRACT(EPOCH FROM AVG(response_time - inbound_time)) as avg_seconds
      FROM response_times
      WHERE response_time IS NOT NULL
    `);
    
    const avgSeconds = Number((result.rows[0] as any)?.avg_seconds) || 0;
    
    if (avgSeconds === 0) return "N/A";
    
    if (avgSeconds < 60) {
      return `${Math.round(avgSeconds)}s`;
    } else if (avgSeconds < 3600) {
      const minutes = Math.floor(avgSeconds / 60);
      const seconds = Math.round(avgSeconds % 60);
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(avgSeconds / 3600);
      const minutes = Math.round((avgSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  // SMS Gateway methods
  async getSmsGateways(adminId: string): Promise<SmsGateway[]> {
    return await db.select().from(smsGateways).where(eq(smsGateways.adminId, adminId));
  }

  async getSmsGateway(id: string): Promise<SmsGateway | undefined> {
    const [gateway] = await db.select().from(smsGateways).where(eq(smsGateways.id, id));
    return gateway || undefined;
  }

  async getActiveSmsGateway(adminId: string): Promise<SmsGateway | undefined> {
    const [gateway] = await db
      .select()
      .from(smsGateways)
      .where(and(eq(smsGateways.adminId, adminId), eq(smsGateways.isActive, true)));
    return gateway || undefined;
  }

  async createSmsGateway(gateway: InsertSmsGateway): Promise<SmsGateway> {
    const [created] = await db.insert(smsGateways).values(gateway).returning();
    return created;
  }

  async updateSmsGateway(id: string, data: Partial<SmsGateway>): Promise<SmsGateway | undefined> {
    const [updated] = await db
      .update(smsGateways)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(smsGateways.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSmsGateway(id: string): Promise<void> {
    await db.delete(smsGateways).where(eq(smsGateways.id, id));
  }

  async setActiveSmsGateway(adminId: string, gatewayId: string): Promise<SmsGateway | undefined> {
    // First, deactivate all gateways for this admin
    await db
      .update(smsGateways)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(smsGateways.adminId, adminId));

    // Then, activate the selected gateway
    const [activated] = await db
      .update(smsGateways)
      .set({ isActive: true, updatedAt: new Date() })
      .where(and(eq(smsGateways.id, gatewayId), eq(smsGateways.adminId, adminId)))
      .returning();

    return activated || undefined;
  }
}

export const storage = new DatabaseStorage();
