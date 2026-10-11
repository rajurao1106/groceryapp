import "dotenv/config";
import { pool } from "../db/client.js";

const statements = [
  `CREATE TABLE IF NOT EXISTS customers (
    id serial PRIMARY KEY,
    name text NOT NULL,
    initials text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_unique
    ON customers (lower(phone))`,
  `CREATE TABLE IF NOT EXISTS delivery_partners (
    id serial PRIMARY KEY,
    name text NOT NULL,
    phone text NOT NULL,
    initials text NOT NULL,
    zone text NOT NULL,
    vehicle text NOT NULL,
    status text NOT NULL DEFAULT 'Pending review',
    deliveries integer NOT NULL DEFAULT 0,
    rating numeric(3, 2),
    joined text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id text PRIMARY KEY,
    customer_id integer REFERENCES customers(id) ON DELETE SET NULL,
    delivery_partner_id integer REFERENCES delivery_partners(id) ON DELETE SET NULL,
    customer text NOT NULL,
    initials text NOT NULL,
    avatar text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    time text NOT NULL,
    minutes_ago integer NOT NULL DEFAULT 0,
    amount numeric(12, 2) NOT NULL,
    item_count integer NOT NULL,
    status text NOT NULL,
    payment_method text NOT NULL,
    payment_status text NOT NULL,
    delivery_partner text,
    items jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS store_settings (
    id integer PRIMARY KEY DEFAULT 1,
    settings jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS staff_members (
    id serial PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    initials text NOT NULL,
    role text NOT NULL,
    status text NOT NULL,
    last_active text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS staff_members_email_unique
    ON staff_members (lower(email))`,
];

const requiredTables = ["customers", "delivery_partners", "orders", "store_settings", "staff_members"];

const client = await pool.connect();

try {
  await client.query("BEGIN");
  for (const statement of statements) await client.query(statement);

  const result = await client.query<{ table_name: string }>(
    `SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = ANY($1::text[])`,
    [requiredTables],
  );
  const createdTables = new Set(result.rows.map((row) => row.table_name));
  const missingTables = requiredTables.filter((table) => !createdTables.has(table));
  if (missingTables.length > 0) {
    throw new Error(`Admin CRUD schema verification failed for: ${missingTables.join(", ")}.`);
  }

  await client.query("COMMIT");
  console.log("Admin CRUD tables are ready. No records were inserted or changed.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
