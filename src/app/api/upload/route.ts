import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/rbac";
import { serverEnv } from "@/config/env";
import { defaultStorageProvider } from "@/lib/cloudinary";

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const POST = createApiHandler(
  async (req: NextRequest) => {
    // 1. Require authenticated user
    const session = await getAuthenticatedUser(req);
    if (!session?.userId) {
      throw AppError.unauthorized(
        "Authentication required",
        "অনুগ্রহ করে প্রথমে লগইন করুন।"
      );
    }

    // 2. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      throw AppError.badRequest(
        "No file provided",
        "কোনো ছবি পাওয়া যায়নি। অনুগ্রহ করে একটি ছবি নির্বাচন করুন।"
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw AppError.badRequest(
        "Invalid file type",
        "শুধুমাত্র JPG, PNG, WebP বা GIF ফরম্যাটের ছবি আপলোড করা যাবে।"
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw AppError.badRequest(
        "File too large",
        "ছবির আকার সর্বোচ্চ ৫ মেগাবাইট (5MB) হতে পারবে।"
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 3. ImgBB Host Integration (Primary Cloud Image Host)
    const imgbbKey =
      serverEnv.IMGBB_API_KEY ||
      process.env.IMGBB_API_KEY ||
      "64f3b7044dcf199bf55ceaaa11b34134";

    if (imgbbKey) {
      try {
        const imgbbForm = new FormData();
        const base64Data = fileBuffer.toString("base64");
        imgbbForm.append("image", base64Data);
        imgbbForm.append("name", `${folder}_${Date.now()}`);

        const imgbbRes = await fetch(
          `https://api.imgbb.com/1/upload?key=${encodeURIComponent(imgbbKey)}`,
          {
            method: "POST",
            body: imgbbForm,
          }
        );

        const imgbbJson = await imgbbRes.json();

        if (imgbbRes.ok && imgbbJson?.success && imgbbJson?.data) {
          const directUrl =
            imgbbJson.data.display_url || imgbbJson.data.url || imgbbJson.data.image?.url;

          return apiSuccess(
            {
              url: directUrl,
              displayUrl: imgbbJson.data.display_url,
              deleteUrl: imgbbJson.data.delete_url,
              thumbUrl: imgbbJson.data.thumb?.url,
              provider: "imgbb",
            },
            "ছবি সফলভাবে ImgBB ক্লাউড হোস্টে আপলোড হয়েছে।"
          );
        } else {
          console.warn("ImgBB API upload returned error:", imgbbJson);
        }
      } catch (imgbbErr) {
        console.error("ImgBB upload failed, falling back to storage:", imgbbErr);
      }
    }

    // 4. If Cloudinary credentials exist, upload to Cloudinary (secondary fallback)
    if (
      serverEnv.CLOUDINARY_CLOUD_NAME &&
      serverEnv.CLOUDINARY_API_KEY &&
      serverEnv.CLOUDINARY_API_SECRET
    ) {
      try {
        const result = await defaultStorageProvider.uploadImage(
          fileBuffer,
          `coaching/${folder}`
        );
        return apiSuccess(
          { url: result.url, publicId: result.publicId, provider: "cloudinary" },
          "ছবি সফলভাবে ক্লাউডে আপলোড হয়েছে।"
        );
      } catch (err: any) {
        console.error("Cloudinary upload failed, falling back to local disk:", err);
      }
    }

    // 4. Local storage fallback (saves to public/uploads/[folder]/)
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
    const ext = path.extname(file.name) || ".png";
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const filename = `${sanitizedFolder}-${uniqueSuffix}${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads", sanitizedFolder);
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, fileBuffer);

    const publicUrl = `/uploads/${sanitizedFolder}/${filename}`;

    return apiSuccess({ url: publicUrl }, "ছবি সফলভাবে আপলোড হয়েছে।");
  },
  { requireDb: false }
);
