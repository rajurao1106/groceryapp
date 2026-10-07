import { Redis } from "ioredis";

export const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    })
  : undefined;

export const PRODUCT_CACHE_KEY = "catalog:products:v1";
export const PRODUCT_CACHE_TTL_SECONDS = 60;

export async function invalidateProductCache(): Promise<void> {
  if (redis) await redis.del(PRODUCT_CACHE_KEY);
}
