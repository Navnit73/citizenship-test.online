import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z
    .string({ error: "MONGODB_URI is required" })
    .regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI must start with mongodb:// or mongodb+srv://"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join(".") || "env"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }
  return result.data;
}

let cached: Env | undefined;

/** Lazily validated env; call at runtime (not import time) so builds don't need secrets. */
export function getEnv(): Env {
  return (cached ??= parseEnv(process.env));
}
