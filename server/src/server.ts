import "dotenv/config";
import { buildApp } from "./app.js";
import { pool } from "./db/client.js";
import { redis } from "./plugins/redis.js";

const app = await buildApp();
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await pool.query("select 1");
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error, "Backend startup failed.");
  await redis?.quit().catch(() => undefined);
  await pool.end().catch(() => undefined);
  process.exitCode = 1;
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void app.close().finally(async () => {
      await redis?.quit();
      await pool.end();
    });
  });
}
