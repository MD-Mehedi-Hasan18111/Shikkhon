import { z } from "zod";

/**
 * Server-side Environment Variables Schema
 * Never expose these variables to the browser/client.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .default("mongodb://127.0.0.1:27017/coaching_management_system"),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters long")
    .default("temporary_dev_jwt_secret_change_in_production_12345"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  IMGBB_API_KEY: z.string().optional().default("64f3b7044dcf199bf55ceaaa11b34134"),
});

/**
 * Client-accessible Environment Variables Schema
 * Must be prefixed with NEXT_PUBLIC_
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("শিক্ষণ"),
  NEXT_PUBLIC_SOCKET_URL: z.string().optional().default("http://localhost:3000"),
});

// Process validation
const processServerEnv = () => {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid server environment configuration:", parsed.error.format());
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Invalid server environment configuration. Please check your environment variables."
      );
    }
  }
  return parsed.success ? parsed.data : serverEnvSchema.parse({});
};

const processClientEnv = () => {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  });
  if (!parsed.success) {
    console.error("❌ Invalid client environment configuration:", parsed.error.format());
  }
  return parsed.success ? parsed.data : clientEnvSchema.parse({});
};

export const serverEnv = processServerEnv();
export const clientEnv = processClientEnv();
