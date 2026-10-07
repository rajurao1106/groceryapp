import "dotenv/config";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify from "fastify";
import { initializeFirebase } from "./plugins/firebase.js";
import { adminAuthRoutes } from "./routes/admin-auth.js";
import { paymentRoutes } from "./routes/payments.js";
import { productRoutes } from "./routes/products.js";

export async function buildApp() {
  const app = Fastify({ logger: true });
  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  await app.register(helmet);
  await app.register(cors, { origin: origins, credentials: true });
  await initializeFirebase();
  app.get("/health", async () => ({ status: "ok" }));
  await app.register(adminAuthRoutes, { prefix: "/api" });
  await app.register(productRoutes, { prefix: "/api" });
  await app.register(paymentRoutes, { prefix: "/api" });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    if (reply.sent) return;
    reply.code(500).send({ error: "Internal server error." });
  });
  return app;
}
