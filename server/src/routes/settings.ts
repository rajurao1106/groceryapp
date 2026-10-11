import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { storeSettings, type StoreSettings } from "../db/schema.js";
import { requireAdminSession } from "../plugins/admin-auth.js";

const defaultSettings: StoreSettings = {
  name: "Greenmart Grocery",
  phone: "+91 98765 00000",
  email: "hello@greenmart.example",
  address: "12, 100 Feet Road, Indiranagar, Bengaluru, Karnataka",
  openingHours: "7:00 AM – 11:00 PM",
  deliveryRadius: "5",
  minimumOrder: "99",
  prepTime: "15",
  acceptOrders: true,
  autoAssign: false,
  newOrderAlerts: true,
  lowStockAlerts: true,
  dailySummary: false,
};

const settingsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(254),
  address: z.string().trim().min(1).max(180),
  openingHours: z.string().trim().min(1).max(80),
  deliveryRadius: z.string().trim().min(1).max(16),
  minimumOrder: z.string().trim().min(1).max(16),
  prepTime: z.string().trim().min(1).max(16),
  acceptOrders: z.boolean(),
  autoAssign: z.boolean(),
  newOrderAlerts: z.boolean(),
  lowStockAlerts: z.boolean(),
  dailySummary: z.boolean(),
});

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/settings", { preHandler: requireAdminSession }, async (_request, reply) => {
    reply.header("Cache-Control", "no-store, max-age=0");
    const [row] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
    return { settings: row?.settings ?? defaultSettings };
  });

  app.put("/settings", { preHandler: requireAdminSession }, async (request, reply) => {
    const body = request.body;
    const wrappedSettings = typeof body === "object" && body !== null && "settings" in body
      ? (body as { settings: unknown }).settings
      : body;
    const parsed = settingsSchema.safeParse(wrappedSettings);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid store settings.", details: parsed.error.flatten() });
    const [row] = await db.insert(storeSettings).values({ id: 1, settings: parsed.data })
      .onConflictDoUpdate({
        target: storeSettings.id,
        set: { settings: parsed.data, updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error("The settings update did not return a database row.");
    return { settings: row.settings };
  });
}
