import { Redis } from "ioredis";

export const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    })
  : undefined;

redis?.on("error", (error: Error) => {
  console.error("Optional Redis cache connection failed.", error.message);
});

export const PRODUCT_CACHE_KEY = "catalog:products:v1";
export const PRODUCT_CACHE_TTL_SECONDS = 60;

export async function readProductCache(): Promise<string | null> {
  if (!redis) return null;
  try {
    return await redis.get(PRODUCT_CACHE_KEY);
  } catch (error) {
    console.error("Unable to read optional Redis product cache; using PostgreSQL.", error);
    return null;
  }
}

export async function writeProductCache(value: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(PRODUCT_CACHE_KEY, value, "EX", PRODUCT_CACHE_TTL_SECONDS);
  } catch (error) {
    console.error("Unable to write optional Redis product cache.", error);
  }
}

export async function invalidateProductCache(): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(PRODUCT_CACHE_KEY);
  } catch (error) {
    console.error("Unable to invalidate optional Redis product cache.", error);
  }
}
