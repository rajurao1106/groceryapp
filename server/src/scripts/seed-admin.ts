import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "../db/client.js";
import { adminSessions, adminUsers } from "../db/schema.js";
import { hashPassword } from "../plugins/admin-auth.js";

const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD in server/.env before seeding the admin account.");
}
// if (username.length > 120 || password.length < 12 || password.length > 256) {
//   throw new Error("Admin username must be at most 120 characters and password must be 12-256 characters.");
// }

try {
  const passwordHash = hashPassword(password);
  const [admin] = await db
    .insert(adminUsers)
    .values({ username, passwordHash })
    .onConflictDoUpdate({
      target: adminUsers.username,
      set: {
        passwordHash,
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning({ id: adminUsers.id });
  if (!admin) throw new Error("Admin credential seed did not return the account.");
  await db.delete(adminSessions).where(eq(adminSessions.adminId, admin.id));
  console.log(`Seeded the admin account "${username}".`);
} finally {
  await pool.end();
}
