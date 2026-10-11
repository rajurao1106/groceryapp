import "dotenv/config";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify from "fastify";
import { initializeFirebase } from "./plugins/firebase.js";
import { adminAuthRoutes } from "./routes/admin-auth.js";
import { customerRoutes } from "./routes/customers.js";
import { deliveryPartnerRoutes } from "./routes/delivery-partners.js";
import { orderRoutes } from "./routes/orders.js";
import { paymentRoutes } from "./routes/payments.js";
import { productRoutes } from "./routes/products.js";
import { settingsRoutes } from "./routes/settings.js";
import { staffRoutes } from "./routes/staff.js";

export async function buildApp() {
  const app = Fastify({ logger: true });
  const configuredOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const isLocalhostOrigin = (origin: string) => {
    try {
      const { hostname, protocol } = new URL(origin);
      const normalizedHostname = hostname.replace(/^\[|\]$/g, "");
      return (
        ["http:", "https:"].includes(protocol) &&
        ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(normalizedHostname)
      );
    } catch {
      return false;
    }
  };

  const isAllowedOrigin = (origin: string) =>
    configuredOrigins.includes(origin) || isLocalhostOrigin(origin);

  await app.register(helmet);
  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("This request origin is not allowed."), false);
    },
    credentials: true,
  });
  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    if (origin && !isAllowedOrigin(origin)) {
      return reply.code(403).send({ error: "This request origin is not allowed." });
    }
  });
  await initializeFirebase();
  app.get("/health", async () => ({ status: "ok" }));
  await app.register(adminAuthRoutes, { prefix: "/api" });
  await app.register(productRoutes, { prefix: "/api" });
  await app.register(paymentRoutes, { prefix: "/api" });
  await app.register(orderRoutes, { prefix: "/api" });
  await app.register(customerRoutes, { prefix: "/api" });
  await app.register(deliveryPartnerRoutes, { prefix: "/api" });
  await app.register(settingsRoutes, { prefix: "/api" });
  await app.register(staffRoutes, { prefix: "/api" });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    if (reply.sent) return;
    reply.code(500).send({ error: "Internal server error." });
  });
  return app;
}
