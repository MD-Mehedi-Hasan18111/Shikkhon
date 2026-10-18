"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  Undo,
  Redo,
  RemoveFormatting,
  Eye,
  Edit3,
  Code,
  Loader2,
  Check,
  X,
  Palette,
} from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "এখানে বিস্তারিত বিষয়বস্তু লিখুন...",
  minHeight = "280px",
  className = "",
  label,
  required = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"visual" | "preview" | "html">("visual");
  const [htmlSource, setHtmlSource] = useState(value || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Link Dialog State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const savedSelectionRange = useRef<Range | null>(null);

  // Color Palette Popover
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Sync value from props into editor DOM when mounted or switching back to visual
  useEffect(() => {
    if (editorRef.current && activeTab === "visual") {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    setHtmlSource(value || "");
  }, [value, activeTab]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedSelectionRange.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRange.current);
      }
    }
  };

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlSource(html);
      onChange(html);
    }
  }, [onChange]);

  const exec = (command: string, arg: string | undefined = undefined) => {
    if (activeTab !== "visual") return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    handleInput();
  };

  // Upload an image file to /api/upload (imgbb) and insert inline at cursor
  const uploadAndInsertImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP) নির্বাচন করুন।");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "general");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data?.url) {
        throw new Error(json.message || "ছবি আপলোড ব্যর্থ হয়েছে।");
      }

      const imageUrl = json.data.url;

      // Focus editor and insert image HTML at cursor
      if (editorRef.current) {
        editorRef.current.focus();
        restoreSelection();

        const imgHtml = `<figure class="my-4 text-center select-none" contenteditable="false"><img src="${imageUrl}" alt="Uploaded photo" class="max-w-full h-auto rounded-xl shadow-md inline-block border border-slate-200" style="max-height: 480px; object-fit: contain;" /><figcaption class="text-xs text-slate-500 mt-1 italic">সংযুক্ত ছবি</figcaption></figure><p><br></p>`;
        document.execCommand("insertHTML", false, imgHtml);
        handleInput();
      }
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error ? err.message : "ছবি আপলোডে কোনো ত্রুটি ঘটেছে।"
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Drag & Drop of Images directly into Editor
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        await uploadAndInsertImage(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Link Modal Handlers
  const openLinkModal = () => {
    saveSelection();
    const sel = window.getSelection();
    if (sel) {
      setLinkText(sel.toString());
    }
    setLinkUrl("https://");
    setShowLinkModal(true);
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    restoreSelection();
    if (linkText.trim()) {
      const linkHtml = `<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer" class="text-teal-700 underline font-medium hover:text-teal-900">${linkText}</a>`;
      document.execCommand("insertHTML", false, linkHtml);
    } else {
      exec("createLink", linkUrl.trim());
    }
    handleInput();
    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  };

  const colors = [
    { label: "স্বাভাবিক (কালো)", value: "#1e293b" },
    { label: "শিক্ষণ গাঢ় সবুজ", value: "#00636b" },
    { label: "গাঢ় নীল", value: "#1d4ed8" },
    { label: "লাল / জরুরি", value: "#dc2626" },
    { label: "অ্যাম্বার / সতর্কতা", value: "#d97706" },
    { label: "সবুজ", value: "#16a34a" },
    { label: "ধূসর", value: "#64748b" },
  ];

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("visual")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1",
                activeTab === "visual"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Edit3 className="h-3 w-3" />
              <span>এডিটর</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1",
                activeTab === "preview"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Eye className="h-3 w-3" />
              <span>প্রিভিউ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("html")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1",
                activeTab === "html"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Code className="h-3 w-3" />
              <span>HTML</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Editor Wrapper */}
      <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs focus-within:border-[#00636b] focus-within:ring-1 focus-within:ring-[#00636b] transition-all">
        {/* Formatting Toolbar (Only in visual tab) */}
        {activeTab === "visual" && (
          <div className="bg-slate-50 border-b border-slate-200 p-1.5 flex flex-wrap items-center gap-1 text-slate-700 select-none">
            {/* Undo / Redo */}
            <div className="flex items-center border-r border-slate-200 pr-1 mr-0.5">
              <button
                type="button"
                onClick={() => exec("undo")}
                className="p-1.5 rounded hover:bg-slate-200 transition"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec("redo")}
                className="p-1.5 rounded hover:bg-slate-200 transition"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Headings */}
            <div className="flex items-center border-r border-slate-200 pr-1 mr-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => exec("formatBlock", "<h1>")}
                className="px-2 py-1 rounded text-xs font-bold hover:bg-slate-200 transition"
                title="হেডিং ১"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => exec("formatBlock", "<h2>")}
                className="px-2 py-1 rounded text-xs font-bold hover:bg-slate-200 transition"
                title="হেডিং ২"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => exec("formatBlock", "<h3>")}
                className="px-2 py-1 rounded text-xs font-bold hover:bg-slate-200 transition"
                title="হেডিং ৩"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => exec("formatBlock", "<p>")}
                className="px-2 py-1 rounded text-xs font-normal hover:bg-slate-200 transition"
                title="স্বাভাবিক অনুচ্ছেদ"
              >
                P
              </button>
            </div>

            {/* Basic Formatting: Bold, Italic, Underline, Strikethrough */}
            <div className="flex items-center border-r border-slate-200 pr-1 mr-0.5">
              <button
                type="button"
                onClick={() => exec("bold")}
                className="p-1.5 rounded hover:bg-slate-200 transition font-bold"
                title="বোল্ড (Ctrl+B)"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec("italic")}
                className="p-1.5 rounded hover:bg-slate-200 transition italic"
                title="ইটালিক (Ctrl+I)"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec("underline")}
                className="p-1.5 rounded hover:bg-slate-200 transition underline"
                title="আন্ডারলাইন (Ctrl+U)"
              >
                <Underline className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec("strikeThrough")}
                className="p-1.5 rounded hover:bg-slate-200 transition line-through"
                title="কাটা দাগ (Strikethrough)"
              >
                <Strikethrough className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Colors */}
            <div className="relative border-r border-slate-200 pr-1 mr-0.5">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1.5 rounded hover:bg-slate-200 transition flex items-center gap-1"
                title="টেক্সট কালার"
              >
                <Palette className="h-3.5 w-3.5 text-teal-700" />
              </button>

              {showColorPicker && (
                <div className="absolute top-8 left-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-2 w-44 space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 mb-1">রং নির্বাচন করুন:</div>
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        exec("foreColor", c.value);
                        setShowColorPicker(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-slate-100 transition text-left"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300"
                        style={{ backgroundColor: c.value }}
                      />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Alignment */}
            <div className="flex items-center border-r border-slate-200 pr-1 mr-0.5">
              <button
                type="button"
                onClick={() => exec("justifyLeft")}
                className="p-1.5 rounded hover:bg-slate-200 transition"
                title="বামে সারিবদ্ধ"
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec("justifyCenter")}
                className="p-1.5 rounded hover:bg-slate-200 transition"
                title="মাঝখানে সারিবদ্ধ"
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec("justifyRight")}
                className="p-1.5 rounded hover:bg-slate-200 transition"
                title="ডানে সারিবদ্ধ"
              >
                <AlignRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec("justifyFull")}
                className="p-1.5 rounded hover:bg-slate-200 transition"
                title="জাস্টিফাই"
              >
                <AlignJustify className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Lists & Quotes */}
            <div className="flex items-center border-r border-slate-200 pr-1 mr-0.5">
              <button
                type="button"
                onClick={() => exec("insertUnorderedList")}
                className="p-1.5 rounded hover:bg-slate-200 transition"
                title="বুলেট পয়েন্ট তালিকা"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec("insertOrderedList")}
                className="p-1.5 rounded hover:bg-slate-200 transition"
                title="সংখ্যার তালিকা"
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec("formatBlock", "<blockquote>")}
                className="p-1.5 rounded hover:bg-slate-200 transition"
                title="কোটেশন"
              >
                <Quote className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => exec("insertHorizontalRule")}
                className="p-1.5 rounded hover:bg-slate-200 transition"
                title="ডিভাইডার দাগ"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Link & Inline Image Insert */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={openLinkModal}
                className="p-1.5 rounded hover:bg-slate-200 transition"
                title="লিঙ্ক যুক্ত করুন"
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </button>

              {/* MS Word style Inline Image Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    uploadAndInsertImage(e.target.files[0]);
                  }
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => {
                  saveSelection();
                  fileInputRef.current?.click();
                }}
                className={cn(
                  "px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-1.5 transition border border-teal-200",
                  isUploading && "opacity-60 cursor-not-allowed"
                )}
                title="লেখার মাঝে যেখানে ইচ্ছে ছবি আপলোড করে বসান (MS Word-এর মতো)"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-700" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5 text-teal-700" />
                )}
                <span>{isUploading ? "ছবি আপলোড হচ্ছে..." : "ছবি ইনসার্ট"}</span>
              </button>

              <button
                type="button"
                onClick={() => exec("removeFormat")}
                className="p-1.5 rounded hover:bg-slate-200 transition text-slate-500"
                title="ফরম্যাট মুছে ফেলুন"
              >
                <RemoveFormatting className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Upload Error Alert */}
        {uploadError && (
          <div className="px-3 py-1.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <span>{uploadError}</span>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-rose-500 hover:text-rose-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 1. Visual WYSIWYG Content Area */}
        {activeTab === "visual" && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onBlur={handleInput}
            style={{ minHeight }}
            className="p-4 outline-none text-sm text-slate-800 leading-relaxed overflow-y-auto prose prose-slate max-w-none focus:outline-none"
            data-placeholder={placeholder}
          />
        )}

        {/* 2. Live Preview Tab */}
        {activeTab === "preview" && (
          <div
            style={{ minHeight }}
            className="p-4 bg-slate-50/50 text-sm text-slate-800 leading-relaxed overflow-y-auto prose prose-slate max-w-none border-t border-slate-100"
          >
            {value?.trim() ? (
              <div dangerouslySetInnerHTML={{ __html: value }} />
            ) : (
              <div className="text-slate-400 italic py-8 text-center text-xs">
                প্রিভিউ করার জন্য কিছু লিখুন...
              </div>
            )}
          </div>
        )}

        {/* 3. Raw HTML Source Code Tab */}
        {activeTab === "html" && (
          <textarea
            value={htmlSource}
            onChange={(e) => {
              setHtmlSource(e.target.value);
              onChange(e.target.value);
            }}
            style={{ minHeight }}
            className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-900 text-emerald-400 outline-none resize-y"
            placeholder="<html>...</html>"
          />
        )}

        {/* Editor Bottom Status Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            💡 পরামর্শ: লেখার মাঝে ছবি যোগ করতে ওপরের <strong>'ছবি ইনসার্ট'</strong> বাটনে ক্লিক করুন
            অথবা ছবি ড্র্যাগ করে লেখার ওপর ছেড়ে দিন।
          </span>
          <span className="shrink-0 font-medium text-slate-400">
            {value?.replace(/<[^>]+>/g, "").length || 0} অক্ষর
          </span>
        </div>
      </div>

      {/* Insert Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <LinkIcon className="h-4 w-4 text-[#00636b]" />
              <span>হাইপারলিঙ্ক যুক্ত করুন</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  ডিসপ্লে টেক্সট (ঐচ্ছিক):
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="যেমন: এখানে ক্লিক করুন"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#00636b]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  ওয়েব লিঙ্ক / URL: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#00636b]"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLinkModal(false)}
              >
                বাতিল
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={insertLink}
                disabled={!linkUrl.trim()}
              >
                যুক্ত করুন
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
