"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: "avatars" | "banners" | "general";
  aspectRatio?: "square" | "banner";
  label?: string;
  description?: string;
  className?: string;
  rounded?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  folder = "general",
  aspectRatio = "square",
  label,
  description,
  className,
  rounded = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP) নির্বাচন করুন।");
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("ছবির আকার সর্বোচ্চ ৫ মেগাবাইট (5MB) হতে হবে।");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "ছবি আপলোড করা সম্ভব হয়নি।");
      }

      if (json.data?.url) {
        onChange(json.data.url);
      }
    } catch (err: any) {
      setError(err.message || "আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // reset input so same file can be selected again
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const isSquare = aspectRatio === "square";

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">{label}</label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        className="hidden"
        onChange={handleInputChange}
        disabled={uploading}
      />

      {value ? (
        <div className="flex flex-col items-center sm:items-start space-y-2">
          <div
            className={cn(
              "relative overflow-hidden border border-slate-200 bg-slate-100 shadow-xs",
              isSquare
                ? rounded
                  ? "w-24 h-24 sm:w-26 sm:h-26 rounded-full border-2 border-teal-600/30"
                  : "w-32 h-32 rounded-xl"
                : "w-full h-44 sm:h-56 rounded-2xl"
            )}
          >
            <Image
              src={value}
              alt="Uploaded Preview"
              fill
              className="object-cover"
              sizes={isSquare ? "120px" : "100vw"}
              unoptimized={value.startsWith("/uploads/") || value.startsWith("/images/") || value.includes("ibb.co")}
            />

            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-xs gap-1.5 backdrop-blur-2xs">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <span className="text-[11px]">আপলোড হচ্ছে...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 pt-0.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-[11px] h-7 px-2.5 gap-1 border-slate-300 text-slate-700 hover:text-[#00636b]"
            >
              <Upload className="h-3 w-3" />
              <span>ছবি পরিবর্তন</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange("")}
              disabled={uploading}
              className="text-[11px] h-7 px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <X className="h-3 w-3" />
              <span>মুছুন</span>
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center bg-white hover:bg-teal-50/40 border-slate-300 hover:border-[#00636b]",
            isDragOver && "border-[#00636b] bg-[#eff8f9]",
            isSquare
              ? rounded
                ? "w-24 h-24 sm:w-26 sm:h-26 rounded-full p-2 shrink-0"
                : "w-32 h-32 rounded-xl p-3"
              : "w-full h-40 sm:h-48 rounded-2xl p-6",
            uploading && "pointer-events-none opacity-70"
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-1 text-slate-600 text-xs">
              <Loader2 className="h-5 w-5 animate-spin text-[#00636b]" />
              <span className="text-[11px]">আপলোড হচ্ছে...</span>
            </div>
          ) : (
            <div className={cn("text-slate-600 flex flex-col items-center justify-center", rounded ? "space-y-1" : "space-y-1.5")}>
              <div className={cn(
                "rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#00636b]",
                rounded ? "w-7 h-7" : "w-9 h-9 mx-auto shadow-xs"
              )}>
                <ImageIcon className={cn(rounded ? "h-3.5 w-3.5" : "h-4 w-4")} />
              </div>
              <p className={cn("font-semibold text-slate-700 leading-tight", rounded ? "text-[11px]" : "text-xs")}>
                {isSquare ? "ছবি আপলোড" : "ক্লিক করুন বা ড্র্যাগ করে ছাড়ুন"}
              </p>
              {!isSquare && (
                <p className="text-[11px] text-slate-400">
                  PNG, JPG বা WebP (সর্বোচ্চ ৫ মেগাবাইট)
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {description && (
        <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
      )}

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
