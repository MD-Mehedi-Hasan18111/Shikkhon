import mongoose from "mongoose";
import { serverEnv } from "@/config/env";

/**
 * MongoDB connection cache interface for Next.js serverless/Node runtime
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Declare global cache variable to survive Next.js hot module reloading in development
declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connect to MongoDB with connection reuse
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  const MONGODB_URI = serverEnv.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable in .env.local");
  }

  // If already connected and ready, return existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection is in progress, wait for it
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        if (process.env.NODE_ENV !== "production") {
          console.log("✅ [MongoDB] Connected successfully to:", m.connection.name);
        }
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error("❌ [MongoDB] Connection error:", err.message);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Check MongoDB connection status
 */
export function getDbConnectionStatus(): {
  isConnected: boolean;
  readyState: number;
  stateName: string;
} {
  const state = mongoose.connection.readyState;
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    isConnected: state === 1,
    readyState: state,
    stateName: states[state] || "unknown",
  };
}
