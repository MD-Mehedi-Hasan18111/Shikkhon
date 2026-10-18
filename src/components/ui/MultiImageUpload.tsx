"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import { X, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiImageUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  folder?: "general" | "banners" | "avatars";
  label?: string;
  description?: string;
  maxFiles?: number;
  className?: string;
}

export function MultiImageUpload({
  value = [],
  onChange,
  folder = "general",
  label,
  description,
  maxFiles = 100,
  className,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadSingleFile = async (file: File): Promise<string> => {
    // Validate type
    if (!file.type.startsWith("image/")) {
      throw new Error(`"${file.name}" কোনো ছবি ফাইল নয় (JPG, PNG, WebP দিন)।`);
    }

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`"${file.name}"-এর আকার ১০MB এর চেয়ে বেশি।`);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const json = await res.json();
    if (!res.ok || !json.success || !json.data?.url) {
      throw new Error(json.message || `"${file.name}" আপলোড ব্যর্থ হয়েছে।`);
    }

    return json.data.url;
  };

  const handleFiles = async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (maxFiles && maxFiles > 0 && value.length + fileArray.length > maxFiles) {
      setError(`একসাথে সর্বোচ্চ ${maxFiles}টি ছবি আপলোড করা যাবে।`);
      return;
    }

    try {
      setUploading(true);
      const uploadPromises = fileArray.map((f) => uploadSingleFile(f));
      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...value, ...uploadedUrls]);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "ছবি আপলোড করার সময় সমস্যা হয়েছে।"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleRemove = (indexToRemove: number) => {
    const updated = value.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}

      {/* Image Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
        {value.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="group relative aspect-video sm:aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs"
          >
            <Image
              src={url}
              alt={`Gallery Image ${index + 1}`}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              unoptimized={url.startsWith("/uploads/") || url.includes("ibb.co")}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600/90 text-white shadow-md opacity-0 group-hover:opacity-100 hover:bg-rose-700 transition"
              title="ছবিটি মুছুন"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white">
              {index + 1}
            </span>
          </div>
        ))}

        {/* Upload Trigger Tile */}
        {value.length < maxFiles && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "aspect-video sm:aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all",
              isDragOver
                ? "border-[#00636b] bg-teal-50/60 text-[#00636b]"
                : "border-slate-200 hover:border-[#00636b] bg-slate-50/70 hover:bg-teal-50/30 text-slate-500",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="h-5 w-5 animate-spin text-[#00636b]" />
                <span className="text-[10px] text-slate-600 font-medium">আপলোড হচ্ছে...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="p-1.5 rounded-full bg-white shadow-2xs border border-slate-200 text-[#00636b]">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-700 mt-1">
                  ছবি যোগ করুন
                </span>
                <span className="text-[10px] text-slate-400">
                  {value.length}/{maxFiles}টি
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        multiple
        className="hidden"
        onChange={handleInputChange}
        disabled={uploading}
      />

      {description && <p className="text-[11px] text-slate-500">{description}</p>}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
