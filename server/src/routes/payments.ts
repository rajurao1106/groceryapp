import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import Razorpay from "razorpay";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { payments, products } from "../db/schema.js";
import { requireFirebaseUser } from "../plugins/firebase.js";

const createOrderInput = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive().max(99),
  })).min(1).max(50).refine(
    (items) => new Set(items.map((item) => item.productId)).size === items.length,
    "Each product may only appear once.",
  ),
});

const verifyPaymentInput = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

function getRazorpay(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error("Razorpay credentials are not configured.");
  return new Razorpay({ key_id, key_secret });
}

export async function paymentRoutes(app: FastifyInstance): Promise<void> {
  app.post("/payments/orders", { preHandler: requireFirebaseUser }, async (request, reply) => {
    const parsed = createOrderInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid payment order.", details: parsed.error.flatten() });
    const userId = request.firebaseUser?.uid;
    if (!userId) return reply.code(401).send({ error: "A Firebase user session is required." });

    const requestedIds = parsed.data.items.map((item) => item.productId);
    const catalogRows = await db.select().from(products).where(inArray(products.id, requestedIds));
    const catalogById = new Map(catalogRows.map((product) => [product.id, product]));
    let amountPaise = 0;
    for (const item of parsed.data.items) {
      const product = catalogById.get(item.productId);
      if (!product || !product.isPublished) {
        return reply.code(400).send({ error: `Product ${item.productId} is unavailable.` });
      }
      if (product.stock < item.quantity) {
        return reply.code(409).send({ error: `${product.name} does not have enough stock.` });
      }
      amountPaise += Math.round(Number(product.price) * 100) * item.quantity;
    }
    if (amountPaise > 10_000_000) {
      return reply.code(400).send({ error: "Order amount exceeds the supported limit." });
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: randomUUID().replaceAll("-", "").slice(0, 40),
    });
    await db.insert(payments).values({
      userId,
      razorpayOrderId: order.id,
      amountPaise,
      status: "created",
    });
    return reply.code(201).send({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
    });
  });

  app.post("/payments/verify", { preHandler: requireFirebaseUser }, async (request, reply) => {
    const parsed = verifyPaymentInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid payment verification data." });
    const userId = request.firebaseUser?.uid;
    if (!userId) return reply.code(401).send({ error: "A Firebase user session is required." });

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Razorpay credentials are not configured.");
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;
    const [storedPayment] = await db.select().from(payments).where(eq(payments.razorpayOrderId, razorpayOrderId)).limit(1);
    if (!storedPayment || storedPayment.userId !== userId) {
      return reply.code(404).send({ error: "Payment order not found for this user." });
    }

    const expected = createHmac("sha256", secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest();
    const supplied = Buffer.from(razorpaySignature, "hex");
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      return reply.code(400).send({ error: "Razorpay payment signature is invalid." });
    }

    const verifiedPayment = await getRazorpay().payments.fetch(razorpayPaymentId);
    if (
      verifiedPayment.order_id !== razorpayOrderId
      || verifiedPayment.amount !== storedPayment.amountPaise
      || verifiedPayment.currency !== "INR"
      || verifiedPayment.status !== "captured"
    ) {
      return reply.code(400).send({ error: "Razorpay has not confirmed this payment as captured." });
    }

    const [updated] = await db.update(payments).set({
      razorpayPaymentId,
      status: "paid",
      updatedAt: new Date(),
    }).where(eq(payments.id, storedPayment.id)).returning({ id: payments.id, status: payments.status });
    return { payment: updated };
  });
}
