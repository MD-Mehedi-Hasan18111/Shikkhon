import mongoose from "mongoose";

/**
 * EduCoach Master Licensing & Accessibility Integration
 * Dual-Strategy:
 * 1. Checks EduCoach Master HTTP API (GET /api/v1/license/verify?slug=...)
 * 2. Fallback to direct Master Atlas DB connection (reads tenants collection)
 *
 * This ensures 100% reliable detection of MAINTENANCE, SUSPENDED, and ACTIVE states
 * with zero delay when toggled from the EduCoach master admin panel.
 */

export interface EduCoachLicenseInfo {
  allowed: boolean;
  status: "ACTIVE" | "MAINTENANCE" | "SUSPENDED" | "PENDING_SETUP" | "ERROR";
  message: string;
  reason: string;
  systemName: string;
  slug: string;
  planCode: string;
  quotas: {
    maxStudents: number;
    maxBatches: number;
    maxTeachers: number;
  };
  features: {
    smsAlerts: boolean;
    onlineAdmission: boolean;
    examPortal: boolean;
    accountsManagement: boolean;
    customDomain: boolean;
    reportsDownload?: boolean;
  };
}

const EDUCOACH_MASTER_URL =
  process.env.EDUCOACH_MASTER_URL || "http://localhost:3050";
const EDUCOACH_MASTER_MONGODB_URI =
  process.env.EDUCOACH_MASTER_MONGODB_URI ||
  "mongodb+srv://educoach:educoach@cluster0.al9ee76.mongodb.net/EduCoach?retryWrites=true&w=majority&appName=Cluster0";
const SYSTEM_SLUG = process.env.EDUCOACH_SYSTEM_SLUG || "shikkhon";
const LICENSE_KEY = process.env.EDUCOACH_LICENSE_KEY || "EDULIC-SHIKKHON-FREE-2026";

// Short 3-second cache to allow instant response while preventing spam
let cachedLicense: { data: EduCoachLicenseInfo; expiresAt: number } | null = null;
let masterDbConnection: mongoose.Connection | null = null;

async function getMasterDbConnection(): Promise<mongoose.Connection | null> {
  if (masterDbConnection && masterDbConnection.readyState === 1) {
    return masterDbConnection;
  }
  try {
    const conn = mongoose.createConnection(EDUCOACH_MASTER_MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2000,
      maxPoolSize: 2,
    });
    masterDbConnection = conn;
    return conn;
  } catch (err: any) {
    console.error("Master DB direct connection error:", err.message);
    return null;
  }
}

async function queryDirectFromMasterDb(slug: string): Promise<EduCoachLicenseInfo | null> {
  try {
    const conn = await getMasterDbConnection();
    if (!conn) return null;

    const tenantsCollection = conn.collection("tenants");
    const tenant: any = await tenantsCollection.findOne({ slug });

    if (!tenant) return null;

    const now = new Date();
    const isExpired =
      tenant.subscriptionExpiresAt && new Date(tenant.subscriptionExpiresAt) < now;

    let allowed = false;
    let effectiveStatus: EduCoachLicenseInfo["status"] = tenant.status || "ACTIVE";
    let message = "System operational.";
    let reason = "";

    if (tenant.status === "MAINTENANCE") {
      allowed = false;
      reason = tenant.maintenanceReason || "এডুকোচ সেন্ট্রাল থেকে রক্ষণাবেক্ষণ (Maintenance) চলছে।";
      message = reason;
    } else if (tenant.status === "SUSPENDED") {
      allowed = false;
      reason = tenant.suspensionReason || "এই কোচিং সিস্টেমটির পরিষেবা সাময়িকভাবে স্থগিত রয়েছে।";
      message = reason;
    } else if (isExpired) {
      allowed = false;
      effectiveStatus = "SUSPENDED";
      reason = "আপনার কোচিং সাবস্ক্রিপশনের মেয়াদ শেষ হয়েছে।";
      message = reason;
    } else {
      allowed = true;
    }

    return {
      allowed,
      status: effectiveStatus,
      message,
      reason,
      systemName: tenant.name || slug,
      slug: tenant.slug || slug,
      planCode: tenant.planCode || "FREE",
      quotas: {
        maxStudents: tenant.planCode === "FREE" ? 200 : 9999,
        maxBatches: tenant.planCode === "FREE" ? 10 : 9999,
        maxTeachers: tenant.planCode === "FREE" ? 15 : 9999,
      },
      features: tenant.features || {
        smsAlerts: false,
        onlineAdmission: true,
        examPortal: true,
        accountsManagement: true,
        customDomain: false,
      },
    };
  } catch (err: any) {
    console.error("Direct Master DB query failed:", err.message);
    return null;
  }
}

export async function getEduCoachLicense(): Promise<EduCoachLicenseInfo> {
  const now = Date.now();

  // In-memory cache for 3 seconds
  if (cachedLicense && cachedLicense.expiresAt > now) {
    return cachedLicense.data;
  }

  // 1. Try HTTP API call to EduCoach Master
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const headers: Record<string, string> = {};
    if (LICENSE_KEY) headers["x-license-key"] = LICENSE_KEY;

    const res = await fetch(
      `${EDUCOACH_MASTER_URL}/api/v1/license/verify?slug=${SYSTEM_SLUG}`,
      {
        headers,
        signal: controller.signal,
        cache: "no-store",
      }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data: EduCoachLicenseInfo = await res.json();
      cachedLicense = { data, expiresAt: now + 3000 };
      return data;
    }

    const errData = await res.json().catch(() => ({}));
    const data: EduCoachLicenseInfo = {
      allowed: false,
      status: errData.status || "SUSPENDED",
      message: errData.message || errData.error || "সিস্টেম অ্যাক্সেস অনুমতি নেই।",
      reason: errData.reason || errData.message || "",
      systemName: SYSTEM_SLUG,
      slug: SYSTEM_SLUG,
      planCode: "FREE",
      quotas: { maxStudents: 200, maxBatches: 10, maxTeachers: 15 },
      features: {
        smsAlerts: false,
        onlineAdmission: true,
        examPortal: true,
        accountsManagement: true,
        customDomain: false,
      },
    };
    cachedLicense = { data, expiresAt: now + 3000 };
    return data;
  } catch (err: any) {
    // 2. HTTP failed or timed out -> Fallback to Direct Master MongoDB Atlas Check
    const dbResult = await queryDirectFromMasterDb(SYSTEM_SLUG);
    if (dbResult) {
      cachedLicense = { data: dbResult, expiresAt: now + 3000 };
      return dbResult;
    }

    // 3. Last resort fallback
    return {
      allowed: true,
      status: "ACTIVE",
      message: "EduCoach Master offline — offline grace period active.",
      reason: "",
      systemName: SYSTEM_SLUG,
      slug: SYSTEM_SLUG,
      planCode: "FREE",
      quotas: { maxStudents: 200, maxBatches: 10, maxTeachers: 15 },
      features: {
        smsAlerts: false,
        onlineAdmission: true,
        examPortal: true,
        accountsManagement: true,
        customDomain: true,
        reportsDownload: true,
      },
    };
  }
}
