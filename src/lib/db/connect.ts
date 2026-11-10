import mongoose from "mongoose";
import { getEnv } from "@/lib/env";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalCache = globalThis as unknown as { _mongoose?: Cache };
const cache: Cache = (globalCache._mongoose ??= { conn: null, promise: null });

/** Reuses one connection across hot reloads and serverless invocations. */
export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  if (mongoose.connection?.readyState === 1) return mongoose; // already connected (e.g. tests)
  cache.promise ??= mongoose.connect(getEnv().MONGODB_URI, { bufferCommands: false });
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}
