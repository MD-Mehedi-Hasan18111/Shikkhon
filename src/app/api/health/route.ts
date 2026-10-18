import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getDbConnectionStatus } from "@/lib/mongodb";

export const GET = createApiHandler(
  async () => {
    const dbStatus = getDbConnectionStatus();

    const healthData = {
      status: "healthy",
      service: "Coaching Management System API",
      timestamp: new Date().toISOString(),
      database: {
        connected: dbStatus.isConnected,
        state: dbStatus.stateName,
      },
      environment: process.env.NODE_ENV || "development",
      uptimeSeconds: Math.floor(process.uptime()),
    };

    return apiSuccess(healthData, "সিস্টেম সফলভাবে চালু রয়েছে ও ডেটাবেজ সংযুক্ত।");
  },
  { requireDb: true }
);
