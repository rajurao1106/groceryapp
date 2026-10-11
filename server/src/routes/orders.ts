import { randomUUID } from "node:crypto";
import { asc, desc, eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { customers, deliveryPartners, orders } from "../db/schema.js";
import { requireAdminSession } from "../plugins/admin-auth.js";
import {
  getInitials,
  getOrderTotals,
  isUniqueViolation,
  orderFieldsSchema,
  orderStatuses,
  parsePositiveId,
  paymentStatuses,
  type OrderInput,
} from "./admin-domain-shared.js";

function toDemoOrder(row: typeof orders.$inferSelect, partnerName: string | null) {
  return {
    id: row.id,
    customer: row.customer,
    initials: row.initials,
    avatar: row.avatar,
    phone: row.phone,
    address: row.address,
    time: row.time,
    minutesAgo: row.minutesAgo,
    amount: Number(row.amount),
    itemCount: row.itemCount,
    status: row.status,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    deliveryPartner: partnerName ?? row.deliveryPartner,
    items: row.items,
    customerId: row.customerId,
    deliveryPartnerId: row.deliveryPartnerId,
  };
}

async function listOrders() {
  const rows = await db
    .select({ order: orders, partnerName: deliveryPartners.name })
    .from(orders)
    .leftJoin(deliveryPartners, eq(orders.deliveryPartnerId, deliveryPartners.id))
    .orderBy(desc(orders.createdAt), asc(orders.id));
  return rows.map(({ order, partnerName }) => toDemoOrder(order, partnerName));
}

async function findPartner(id: number) {
  const [partner] = await db.select().from(deliveryPartners).where(eq(deliveryPartners.id, id)).limit(1);
  return partner ?? null;
}

async function resolvePartner(input: OrderInput) {
  if (input.deliveryPartnerId !== undefined) {
    if (input.deliveryPartnerId === null) return { id: null, name: input.deliveryPartner ?? null };
    const partner = await findPartner(input.deliveryPartnerId);
    return partner ? { id: partner.id, name: partner.name } : null;
  }
  if (input.deliveryPartner === undefined) return { id: null, name: null };
  if (input.deliveryPartner === null) return { id: null, name: null };
  const [partner] = await db.select().from(deliveryPartners)
    .where(sql`lower(${deliveryPartners.name}) = ${input.deliveryPartner.toLowerCase()}`)
    .limit(1);
  return partner ? { id: partner.id, name: partner.name } : null;
}

async function findOrCreateCustomer(input: OrderInput) {
  if (input.customerId !== undefined) {
    if (input.customerId === null) return null;
    const [customer] = await db.select().from(customers).where(eq(customers.id, input.customerId)).limit(1);
    return customer ?? null;
  }

  const [existing] = await db.select().from(customers)
    .where(sql`lower(${customers.phone}) = ${input.phone.toLowerCase()}`)
    .limit(1);
  if (existing) return existing;
  const [created] = await db.insert(customers).values({
    name: input.customer,
    initials: input.initials ?? getInitials(input.customer),
    phone: input.phone,
    address: input.address,
  }).returning();
  return created ?? null;
}

async function materializeOrder(input: OrderInput) {
  const partner = await resolvePartner(input);
  if ((input.deliveryPartnerId && !partner) || (input.deliveryPartner && !partner)) {
    return { error: "Delivery partner not found." } as const;
  }
  const customer = await findOrCreateCustomer(input);
  if (input.customerId && !customer) return { error: "Customer not found." } as const;
  const totals = getOrderTotals(input.items);
  return {
    value: {
      customerId: customer?.id ?? null,
      deliveryPartnerId: partner?.id ?? null,
      customer: input.customer,
      initials: input.initials ?? getInitials(input.customer),
      avatar: input.avatar,
      phone: input.phone,
      address: input.address,
      time: input.time,
      minutesAgo: input.minutesAgo,
      amount: totals.amount.toFixed(2),
      itemCount: totals.itemCount,
      status: input.status,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      deliveryPartner: partner?.name ?? null,
      items: input.items,
      updatedAt: new Date(),
    },
  } as const;
}

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  app.get("/orders", { preHandler: requireAdminSession }, async (_request, reply) => {
    reply.header("Cache-Control", "no-store, max-age=0");
    return { orders: await listOrders() };
  });

  app.post("/orders", { preHandler: requireAdminSession }, async (request, reply) => {
    const parsed = orderFieldsSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid order data.", details: parsed.error.flatten() });
    const prepared = await materializeOrder(parsed.data);
    if ("error" in prepared) return reply.code(404).send({ error: prepared.error });
    const id = parsed.data.id ?? `#GM-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
    try {
      const [row] = await db.insert(orders).values({ id, ...prepared.value }).returning();
      if (!row) throw new Error("The order insert did not return a database row.");
      return reply.code(201).send({ order: toDemoOrder(row, prepared.value.deliveryPartner) });
    } catch (error) {
      if (isUniqueViolation(error)) return reply.code(409).send({ error: "An order with this ID already exists." });
      throw error;
    }
  });

  app.get("/orders/:id", { preHandler: requireAdminSession }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [result] = await db.select({ order: orders, partnerName: deliveryPartners.name })
      .from(orders)
      .leftJoin(deliveryPartners, eq(orders.deliveryPartnerId, deliveryPartners.id))
      .where(eq(orders.id, id))
      .limit(1);
    if (!result) return reply.code(404).send({ error: "Order not found." });
    return { order: toDemoOrder(result.order, result.partnerName) };
  });

  app.put("/orders/:id", { preHandler: requireAdminSession }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = orderFieldsSchema.safeParse(request.body);
    if (!id || id.length > 120 || !parsed.success) {
      return reply.code(400).send({ error: "Invalid order ID or order data.", details: parsed.success ? undefined : parsed.error.flatten() });
    }
    const prepared = await materializeOrder(parsed.data);
    if ("error" in prepared) return reply.code(404).send({ error: prepared.error });
    const [row] = await db.update(orders).set(prepared.value).where(eq(orders.id, id)).returning();
    if (!row) return reply.code(404).send({ error: "Order not found." });
    return { order: toDemoOrder(row, prepared.value.deliveryPartner) };
  });

  app.patch("/orders/:id/status", { preHandler: requireAdminSession }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = z.object({
      status: z.enum(orderStatuses),
      deliveryPartnerId: z.number().int().positive().nullable().optional(),
    }).safeParse(request.body);
    if (!id || id.length > 120 || !parsed.success) {
      return reply.code(400).send({ error: "Invalid order status update.", details: parsed.success ? undefined : parsed.error.flatten() });
    }
    let partnerId: number | null | undefined;
    let partnerName: string | null | undefined;
    if (parsed.data.deliveryPartnerId !== undefined) {
      partnerId = parsed.data.deliveryPartnerId;
      if (partnerId === null) partnerName = null;
      else {
        const partner = await findPartner(partnerId);
        if (!partner) return reply.code(404).send({ error: "Delivery partner not found." });
        partnerName = partner.name;
      }
    }
    const [row] = await db.update(orders).set({
      status: parsed.data.status,
      ...(partnerId === undefined ? {} : { deliveryPartnerId: partnerId, deliveryPartner: partnerName ?? null }),
      updatedAt: new Date(),
    }).where(eq(orders.id, id)).returning();
    if (!row) return reply.code(404).send({ error: "Order not found." });
    const assignedPartner = partnerName === undefined && row.deliveryPartnerId !== null
      ? await findPartner(row.deliveryPartnerId)
      : null;
    return { order: toDemoOrder(row, partnerName ?? assignedPartner?.name ?? null) };
  });

  app.patch("/orders/:id/payment", { preHandler: requireAdminSession }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = z.object({ paymentStatus: z.enum(paymentStatuses) }).safeParse(request.body);
    if (!id || id.length > 120 || !parsed.success) {
      return reply.code(400).send({ error: "Invalid order payment update.", details: parsed.success ? undefined : parsed.error.flatten() });
    }
    const [row] = await db.update(orders).set({
      paymentStatus: parsed.data.paymentStatus,
      updatedAt: new Date(),
    }).where(eq(orders.id, id)).returning();
    if (!row) return reply.code(404).send({ error: "Order not found." });
    const partner = row.deliveryPartnerId === null ? null : await findPartner(row.deliveryPartnerId);
    return { order: toDemoOrder(row, partner?.name ?? null) };
  });

  app.delete("/orders/:id", { preHandler: requireAdminSession }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!id || id.length > 120) return reply.code(400).send({ error: "Invalid order ID." });
    const [row] = await db.delete(orders).where(eq(orders.id, id)).returning({ id: orders.id });
    if (!row) return reply.code(404).send({ error: "Order not found." });
    return reply.code(204).send();
  });
}
