import "dotenv/config";
import { pool } from "../db/client.js";

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id serial PRIMARY KEY,
      username text NOT NULL,
      password_hash text NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_unique
    ON admin_users (username)
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash text PRIMARY KEY,
      admin_id integer NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT admin_sessions_admin_id_admin_users_id_fk
        FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
    )
  `);
  console.log("Admin authentication tables are ready.");
} finally {
  await pool.end();
}
