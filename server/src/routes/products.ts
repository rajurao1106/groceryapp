import { asc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { products } from "../db/schema.js";
import { invalidateProductCache, PRODUCT_CACHE_KEY, PRODUCT_CACHE_TTL_SECONDS, redis } from "../plugins/redis.js";
import { requireAdminSession } from "../plugins/admin-auth.js";

const productInput = z.object({
  name: z.string().trim().min(1).max(160),
  brand: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  packSize: z.string().trim().min(1).max(80),
  sku: z.string().trim().min(1).max(80),
  price: z.number().finite().nonnegative(),
  mrp: z.number().finite().nonnegative(),
  stock: z.number().int().nonnegative(),
  status: z.enum(["Active", "Draft", "Out of stock"]),
  image: z.string().max(2048).default(""),
  color: z.string().max(80).default(""),
}).refine((value) => value.mrp >= value.price, {
  message: "MRP must be greater than or equal to the selling price.",
  path: ["mrp"],
});

function toAdminProduct(row: typeof products.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    packSize: row.packSize,
    sku: row.sku,
    price: Number(row.price),
    mrp: Number(row.mrp),
    stock: row.stock,
    status: row.isPublished ? (row.stock === 0 ? "Out of stock" : "Active") : "Draft",
    image: row.image,
    color: row.color,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function listProducts() {
  const cached = await redis?.get(PRODUCT_CACHE_KEY);
  if (cached) return JSON.parse(cached) as ReturnType<typeof toAdminProduct>[];

  const rows = await db.select().from(products).orderBy(asc(products.id));
  const result = rows.map(toAdminProduct);
  if (redis) {
    await redis.set(PRODUCT_CACHE_KEY, JSON.stringify(result), "EX", PRODUCT_CACHE_TTL_SECONDS);
  }
  return result;
}

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.get("/products", { preHandler: requireAdminSession }, async () => ({ products: await listProducts() }));

  app.get("/home", async () => {
    const catalog = await listProducts();
    const visibleProducts = catalog
      .filter((product) => product.status === "Active")
      .map((product) => ({
        id: String(product.id),
        name: product.name,
        brand: product.brand,
        packSize: product.packSize,
        imageUrl: product.image.startsWith("http") ? product.image : "",
        sellingPrice: product.price,
        mrp: product.mrp,
        discountPercent: product.mrp === 0 ? 0 : Math.round(((product.mrp - product.price) / product.mrp) * 100),
        isFavourite: false,
        keywords: [product.brand, product.category, product.sku],
        subcategory: product.category,
        stock: product.stock,
      }));
    const categoryNames = [...new Set(visibleProducts.map((product) => product.subcategory))];

    return {
      banners: [{
        id: "catalog-banner",
        title: "Fresh groceries",
        subtitle: "Farm fresh picks, updated from our shared catalog",
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
      }],
      categories: categoryNames.map((name) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name, imageUrl: "" })),
      sections: [{
        id: "catalog",
        title: "Shop products",
        subtitle: "Fresh products available now",
        products: visibleProducts,
      }],
    };
  });

  app.post("/products", { preHandler: requireAdminSession }, async (request, reply) => {
    const parsed = productInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid product data.", details: parsed.error.flatten() });
    const value = parsed.data;
    try {
      const [row] = await db.insert(products).values({
        name: value.name,
        brand: value.brand,
        category: value.category,
        packSize: value.packSize,
        sku: value.sku,
        price: value.price.toFixed(2),
        mrp: value.mrp.toFixed(2),
        stock: value.stock,
        isPublished: value.status !== "Draft",
        image: value.image,
        color: value.color,
      }).returning();
      if (!row) throw new Error("The product insert did not return a database row.");
      await invalidateProductCache();
      return reply.code(201).send({ product: toAdminProduct(row) });
    } catch (error) {
      if (isUniqueViolation(error)) return reply.code(409).send({ error: "A product with this SKU already exists." });
      throw error;
    }
  });

  app.put("/products/:id", { preHandler: requireAdminSession }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const parsed = productInput.safeParse(request.body);
    if (!Number.isSafeInteger(id) || id < 1 || !parsed.success) {
      return reply.code(400).send({ error: "Invalid product ID or product data.", details: parsed.success ? undefined : parsed.error.flatten() });
    }
    const value = parsed.data;
    try {
      const [row] = await db.update(products).set({
        name: value.name,
        brand: value.brand,
        category: value.category,
        packSize: value.packSize,
        sku: value.sku,
        price: value.price.toFixed(2),
        mrp: value.mrp.toFixed(2),
        stock: value.stock,
        isPublished: value.status !== "Draft",
        image: value.image,
        color: value.color,
        updatedAt: new Date(),
      }).where(eq(products.id, id)).returning();
      if (!row) return reply.code(404).send({ error: "Product not found." });
      await invalidateProductCache();
      return { product: toAdminProduct(row) };
    } catch (error) {
      if (isUniqueViolation(error)) return reply.code(409).send({ error: "A product with this SKU already exists." });
      throw error;
    }
  });

  app.delete("/products/:id", { preHandler: requireAdminSession }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isSafeInteger(id) || id < 1) return reply.code(400).send({ error: "Invalid product ID." });
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
    if (!deleted) return reply.code(404).send({ error: "Product not found." });
    await invalidateProductCache();
    return reply.code(204).send();
  });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
