import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export type OrderItemSnapshot = {
  name: string;
  packSize: string;
  quantity: number;
  price: number;
  image: string;
};

export type StoreSettings = {
  name: string;
  phone: string;
  email: string;
  address: string;
  openingHours: string;
  deliveryRadius: string;
  minimumOrder: string;
  prepTime: string;
  acceptOrders: boolean;
  autoAssign: boolean;
  newOrderAlerts: boolean;
  lowStockAlerts: boolean;
  dailySummary: boolean;
};

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    brand: text("brand").notNull(),
    category: text("category").notNull(),
    packSize: text("pack_size").notNull(),
    sku: text("sku").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    mrp: numeric("mrp", { precision: 10, scale: 2 }).notNull(),
    stock: integer("stock").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
    image: text("image").notNull().default(""),
    imagePublicId: text("image_public_id").notNull().default(""),
    color: text("color").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("products_sku_unique").on(sql`lower(${table.sku})`)],
);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("admin_users_username_unique").on(table.username)],
);

export const adminSessions = pgTable("admin_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    razorpayOrderId: text("razorpay_order_id").notNull(),
    razorpayPaymentId: text("razorpay_payment_id"),
    amountPaise: integer("amount_paise").notNull(),
    status: text("status").notNull().default("created"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("payments_razorpay_order_unique").on(table.razorpayOrderId)],
);

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    initials: text("initials").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("customers_phone_unique").on(sql`lower(${table.phone})`)],
);

export const deliveryPartners = pgTable("delivery_partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  initials: text("initials").notNull(),
  zone: text("zone").notNull(),
  vehicle: text("vehicle").notNull(),
  status: text("status").notNull().default("Pending review"),
  deliveries: integer("deliveries").notNull().default(0),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  joined: text("joined").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    deliveryPartnerId: integer("delivery_partner_id").references(() => deliveryPartners.id, { onDelete: "set null" }),
    customer: text("customer").notNull(),
    initials: text("initials").notNull(),
    avatar: text("avatar").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    time: text("time").notNull(),
    minutesAgo: integer("minutes_ago").notNull().default(0),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    itemCount: integer("item_count").notNull(),
    status: text("status").notNull(),
    paymentMethod: text("payment_method").notNull(),
    paymentStatus: text("payment_status").notNull(),
    deliveryPartner: text("delivery_partner"),
    items: jsonb("items").$type<OrderItemSnapshot[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export const storeSettings = pgTable("store_settings", {
  id: integer("id").primaryKey().default(1),
  settings: jsonb("settings").$type<StoreSettings>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const staffMembers = pgTable(
  "staff_members",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    initials: text("initials").notNull(),
    role: text("role").notNull(),
    status: text("status").notNull(),
    lastActive: text("last_active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("staff_members_email_unique").on(sql`lower(${table.email})`)],
);
