import { v2 as cloudinary } from "cloudinary";
import { serverEnv } from "@/config/env";

// Configure Cloudinary if credentials exist
if (
  serverEnv.CLOUDINARY_CLOUD_NAME &&
  serverEnv.CLOUDINARY_API_KEY &&
  serverEnv.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: serverEnv.CLOUDINARY_CLOUD_NAME,
    api_key: serverEnv.CLOUDINARY_API_KEY,
    api_secret: serverEnv.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadResult {
  url: string;
  publicId: string;
  format?: string;
  sizeBytes?: number;
}

export interface StorageProvider {
  uploadImage(fileBuffer: Buffer, folder: string): Promise<UploadResult>;
  deleteImage(publicId: string): Promise<boolean>;
}

export class CloudinaryStorageProvider implements StorageProvider {
  async uploadImage(
    fileBuffer: Buffer,
    folder = "coaching-system"
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary upload failed"));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              sizeBytes: result.bytes,
            });
          }
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (err) {
      console.error("Failed to delete Cloudinary asset:", err);
      return false;
    }
  }
}

export const defaultStorageProvider = new CloudinaryStorageProvider();
