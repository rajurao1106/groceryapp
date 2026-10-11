import { desc, eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { customers, deliveryPartners, orders } from "../db/schema.js";
import { requireAdminSession } from "../plugins/admin-auth.js";
import { getInitials, isUniqueViolation, parsePositiveId } from "./admin-domain-shared.js";

const customerInput = z.object({
  name: z.string().trim().min(1).max(160),
  initials: z.string().trim().min(1).max(8).optional(),
  phone: z.string().trim().min(1).max(40),
  address: z.string().trim().min(1).max(500),
});

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

export async function customerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/customers", { preHandler: requireAdminSession }, async (_request, reply) => {
    reply.header("Cache-Control", "no-store, max-age=0");
    const [customerRows, orderRows] = await Promise.all([
      db.select().from(customers).orderBy(desc(customers.createdAt)),
      db.select({ order: orders, partnerName: deliveryPartners.name })
        .from(orders)
        .leftJoin(deliveryPartners, eq(orders.deliveryPartnerId, deliveryPartners.id))
        .orderBy(desc(orders.createdAt)),
    ]);

    const histories = new Map<number, typeof orderRows>();
    const byPhone = new Map<string, number>();
    for (const customer of customerRows) byPhone.set(customer.phone.toLowerCase(), customer.id);
    for (const item of orderRows) {
      const customerId = item.order.customerId ?? byPhone.get(item.order.phone.toLowerCase());
      if (customerId === undefined) continue;
      const history = histories.get(customerId) ?? [];
      history.push(item);
      histories.set(customerId, history);
    }

    return {
      customers: customerRows.map((customer) => {
        const history = histories.get(customer.id) ?? [];
        const orderHistory = history.map(({ order, partnerName }) => toDemoOrder(order, partnerName));
        const totalPaid = history.reduce(
          (sum, { order }) => sum + (order.paymentStatus === "Paid" ? Number(order.amount) : 0),
          0,
        );
        return {
          id: customer.id,
          name: customer.name,
          initials: customer.initials,
          phone: customer.phone,
          address: customer.address,
          orderCount: history.length,
          totalPaid,
          latestOrder: orderHistory[0] ?? null,
          orders: orderHistory,
        };
      }),
    };
  });

  app.post("/customers", { preHandler: requireAdminSession }, async (request, reply) => {
    const parsed = customerInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid customer data.", details: parsed.error.flatten() });
    try {
      const [row] = await db.insert(customers).values({
        ...parsed.data,
        initials: parsed.data.initials ?? getInitials(parsed.data.name),
      }).returning();
      if (!row) throw new Error("The customer insert did not return a database row.");
      return reply.code(201).send({
        customer: { ...row, orderCount: 0, totalPaid: 0, latestOrder: null, orders: [] },
      });
    } catch (error) {
      if (isUniqueViolation(error)) return reply.code(409).send({ error: "A customer with this phone number already exists." });
      throw error;
    }
  });

  app.put("/customers/:id", { preHandler: requireAdminSession }, async (request, reply) => {
    const id = parsePositiveId((request.params as { id: string }).id);
    const parsed = customerInput.safeParse(request.body);
    if (!id || !parsed.success) {
      return reply.code(400).send({ error: "Invalid customer ID or customer data.", details: parsed.success ? undefined : parsed.error.flatten() });
    }
    try {
      const [row] = await db.update(customers).set({
        ...parsed.data,
        initials: parsed.data.initials ?? getInitials(parsed.data.name),
        updatedAt: new Date(),
      }).where(eq(customers.id, id)).returning();
      if (!row) return reply.code(404).send({ error: "Customer not found." });
      const history = await db.select({ order: orders, partnerName: deliveryPartners.name })
        .from(orders)
        .leftJoin(deliveryPartners, eq(orders.deliveryPartnerId, deliveryPartners.id))
        .where(sql`${orders.customerId} = ${id} OR ( ${orders.customerId} IS NULL AND lower(${orders.phone}) = ${row.phone.toLowerCase()} )`)
        .orderBy(desc(orders.createdAt));
      const orderHistory = history.map(({ order, partnerName }) => toDemoOrder(order, partnerName));
      return {
        customer: {
          id: row.id,
          name: row.name,
          initials: row.initials,
          phone: row.phone,
          address: row.address,
          orderCount: history.length,
          totalPaid: history.reduce((sum, { order }) => sum + (order.paymentStatus === "Paid" ? Number(order.amount) : 0), 0),
          latestOrder: orderHistory[0] ?? null,
          orders: orderHistory,
        },
      };
    } catch (error) {
      if (isUniqueViolation(error)) return reply.code(409).send({ error: "A customer with this phone number already exists." });
      throw error;
    }
  });

  app.delete("/customers/:id", { preHandler: requireAdminSession }, async (request, reply) => {
    const id = parsePositiveId((request.params as { id: string }).id);
    if (!id) return reply.code(400).send({ error: "Invalid customer ID." });
    const [row] = await db.delete(customers).where(eq(customers.id, id)).returning({ id: customers.id });
    if (!row) return reply.code(404).send({ error: "Customer not found." });
    return reply.code(204).send();
  });
}
