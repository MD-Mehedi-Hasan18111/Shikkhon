"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Image as ImageIcon,
  Loader2,
  Check,
  CheckCheck,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  Flag,
  User,
  MoreVertical,
  Maximize2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  parseSafeMessageText,
  formatMessageTime12h,
  formatDateGroupHeader,
  canEditMessage,
} from "@/lib/message-utils";
import { cn } from "@/lib/utils";

interface ChatConversationViewProps {
  activeConversation: any;
  messages: any[];
  currentUser: any;
  loadingMessages: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onSendMessage: (text: string, imageUrl?: string) => Promise<void>;
  onEditMessage: (messageId: string, newText: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onDeleteConversation: (conversationId: string) => Promise<void>;
  onCloseConversation?: () => void;
  onReportMessage?: (message: any) => void;
  onBack?: () => void;
}

export function ChatConversationView({
  activeConversation,
  messages,
  currentUser,
  loadingMessages,
  hasMore,
  loadingMore,
  onLoadMore,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onDeleteConversation,
  onCloseConversation,
  onReportMessage,
  onBack,
}: ChatConversationViewProps) {
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Full Image Lightbox modal state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Delete Conversation confirm modal
  const [showDeleteConvModal, setShowDeleteConvModal] = useState(false);
  const [deletingConv, setDeletingConv] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  // Close header menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setHeaderMenuOpen(false);
      }
    };
    if (headerMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [headerMenuOpen]);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        alert("শুধুমাত্র ছবি ফাইল নির্বাচন করুন (JPG, PNG, WebP)");
        return;
      }
      setSelectedImageFile(file);
      setSelectedImagePreview(URL.createObjectURL(file));
    }
  };

  const clearSelectedImage = () => {
    setSelectedImageFile(null);
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
      setSelectedImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImageFile) || sending) return;

    try {
      setSending(true);
      let uploadedUrl: string | undefined = undefined;

      // If an image is selected, upload to imgbb first
      if (selectedImageFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("file", selectedImageFile);
        formData.append("folder", "general");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok || !json.success || !json.data?.url) {
          throw new Error(json.message || "ছবি আপলোড ব্যর্থ হয়েছে");
        }
        uploadedUrl = json.data.url;
      }

      await onSendMessage(inputText.trim(), uploadedUrl);
      setInputText("");
      clearSelectedImage();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "মেসেজ পাঠানো সম্ভব হয়নি");
    } finally {
      setSending(false);
      setUploadingImage(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim() || savingEdit) return;

    setSavingEdit(true);
    try {
      await onEditMessage(editingMessageId, editingText.trim());
      setEditingMessageId(null);
      setEditingText("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "বার্তা এডিট ব্যর্থ হয়েছে");
    } finally {
      setSavingEdit(false);
    }
  };

  const currentUserId = String(currentUser?._id || currentUser?.id || "");
  const otherParticipant =
    activeConversation?.participants?.find((p: any) => {
      const pId = String(p?._id || p?.id || p || "");
      return pId && pId !== currentUserId;
    }) || activeConversation?.participants?.[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* 1. Chat Header */}
      <div className="p-3 sm:p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Back Button (Facebook Messenger Style) */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition shrink-0"
              title="কথোপকথন তালিকায় ফিরে যান"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-[#00636b] font-bold text-sm shrink-0 overflow-hidden">
            {otherParticipant?.avatarUrl ? (
              <img
                src={otherParticipant.avatarUrl}
                alt={otherParticipant.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{otherParticipant?.fullName?.slice(0, 1) || "চ্যা"}</span>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
              {otherParticipant?.fullName || "ব্যবহারকারী"}
            </h4>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500">
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 uppercase">
                {otherParticipant?.role || "সদস্য"}
              </Badge>
              {otherParticipant?.phone && (
                <span className="font-mono text-[11px] text-slate-500">
                  {otherParticipant.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action button & 3-dot options menu */}
        <div className="flex items-center gap-1 relative" ref={headerMenuRef}>
          {/* Desktop Close Button */}
          {(onCloseConversation || onBack) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onCloseConversation) onCloseConversation();
                else if (onBack) onBack();
              }}
              className="hidden sm:inline-flex text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs gap-1"
              title="কথোপকথন বন্ধ করুন"
            >
              <X className="h-3.5 w-3.5" />
              <span>বন্ধ করুন</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConvModal(true)}
            className="hidden sm:inline-flex text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs gap-1"
            title="ইনবক্স থেকে এই কথোপকথনটি মুছে ফেলুন"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>চ্যাট মুছুন</span>
          </Button>

          {/* 3-Dot Dropdown Trigger */}
          <button
            type="button"
            onClick={() => setHeaderMenuOpen((prev) => !prev)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition"
            title="অতিরিক্ত অপশন"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {/* 3-Dot Dropdown Menu */}
          {headerMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100">
              {(onCloseConversation || onBack) && (
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      if (onCloseConversation) onCloseConversation();
                      else if (onBack) onBack();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium transition"
                  >
                    <X className="h-3.5 w-3.5 text-slate-500" />
                    <span>কথোপকথন বন্ধ করুন</span>
                  </button>
                </div>
              )}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    setShowDeleteConvModal(true);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  <span>কথোপকথন মুছে ফেলুন</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        {/* Load More Button */}
        {hasMore && (
          <div className="text-center py-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="text-xs h-8 bg-white border-slate-200 shadow-2xs text-slate-600"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  লোড হচ্ছে...
                </>
              ) : (
                "পূর্ববর্তী বার্তা দেখুন"
              )}
            </Button>
          </div>
        )}

        {loadingMessages ? (
          <div className="space-y-4 py-8">
            <div className="flex justify-end"><div className="h-10 w-2/3 bg-slate-200 animate-pulse rounded-2xl" /></div>
            <div className="flex justify-start"><div className="h-12 w-1/2 bg-slate-200 animate-pulse rounded-2xl" /></div>
            <div className="flex justify-end"><div className="h-14 w-3/4 bg-slate-200 animate-pulse rounded-2xl" /></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <User className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium">এখনো কোনো বার্তা আদান-প্রদান হয়নি।</p>
            <p className="text-[11px] text-slate-400">নিচে লিখে কথা বলা শুরু করুন।</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const msgSenderId = String(msg.sender?._id || msg.sender?.id || msg.sender || "");
            const isMe = Boolean(currentUserId && msgSenderId && currentUserId === msgSenderId);
            const parsedParts = parseSafeMessageText(msg.text);

            // Date Grouping check (FB Messenger style)
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isDifferentDay =
              !prevMsg ||
              new Date(msg.createdAt).toDateString() !==
                new Date(prevMsg.createdAt).toDateString();

            const isEditable = isMe && canEditMessage(msg.createdAt) && !msg.isDeleted;
            const isEditing = editingMessageId === msg._id;

            return (
              <React.Fragment key={msg._id || index}>
                {/* Facebook Messenger style Date Header */}
                {isDifferentDay && (
                  <div className="flex items-center justify-center my-4 select-none">
                    <span className="px-3.5 py-1 bg-slate-200/90 text-slate-600 text-[11px] font-semibold rounded-full shadow-2xs border border-slate-300/60">
                      {formatDateGroupHeader(msg.createdAt)}
                    </span>
                  </div>
                )}

                {/* Message Bubble Row */}
                <div
                  className={cn(
                    "flex flex-col group relative",
                    isMe ? "items-end" : "items-start"
                  )}
                >
                  {/* Inline Message Bubble */}
                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[70%] rounded-2xl text-xs leading-relaxed transition-shadow",
                      isMe
                        ? "bg-[#00636b] text-white rounded-br-xs shadow-xs" // User End Message: Green Card
                        : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-2xs" // Opposite Side: White Card
                    )}
                  >
                    {/* Image Attachment (if present) */}
                    {msg.imageUrl && (
                      <div
                        onClick={() => setLightboxUrl(msg.imageUrl)}
                        className="p-1 cursor-pointer overflow-hidden rounded-t-xl group/img relative"
                        title="পূর্ণাঙ্গ সাইজে দেখতে ক্লিক করুন"
                      >
                        <img
                          src={msg.imageUrl}
                          alt="Attached picture"
                          className="max-h-60 sm:max-h-72 w-full object-cover rounded-xl transition duration-300 group-hover/img:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center rounded-xl">
                          <Maximize2 className="h-5 w-5 text-white drop-shadow" />
                        </div>
                      </div>
                    )}

                    {/* Text Body / Inline Edit Mode */}
                    <div className="px-3.5 py-2.5">
                      {isEditing ? (
                        <div className="space-y-2 pt-1 text-slate-900">
                          <textarea
                            rows={3}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditingText("");
                              }}
                              className="px-2 py-0.5 rounded text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                            >
                              বাতিল
                            </button>
                            <button
                              type="button"
                              disabled={savingEdit || !editingText.trim()}
                              onClick={handleSaveEdit}
                              className="px-2 py-0.5 rounded text-[11px] bg-teal-600 hover:bg-teal-700 text-white font-medium transition"
                            >
                              {savingEdit ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className={cn(
                            "whitespace-pre-wrap break-words",
                            msg.isDeleted && "italic opacity-70"
                          )}
                        >
                          {msg.isDeleted
                            ? "এই বার্তাটি মুছে ফেলা হয়েছে"
                            : parsedParts.map((part, idx) =>
                                part.type === "link" ? (
                                  <a
                                    key={idx}
                                    href={part.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "underline inline-flex items-center gap-0.5 font-medium",
                                      isMe
                                        ? "text-teal-200 hover:text-white"
                                        : "text-[#00636b] hover:underline"
                                    )}
                                  >
                                    <span>{part.content}</span>
                                    <ExternalLink className="h-2.5 w-2.5 inline" />
                                  </a>
                                ) : (
                                  <span key={idx}>{part.content}</span>
                                )
                              )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message Bottom Details: Time & Seen Status */}
                  <div
                    className={cn(
                      "flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 px-1 select-none",
                      isMe ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Timestamp */}
                    <span>{formatMessageTime12h(msg.createdAt)}</span>

                    {/* Edited Badge */}
                    {msg.isEdited && !msg.isDeleted && (
                      <span className="text-slate-400 italic">(এডিট করা)</span>
                    )}

                    {/* Seen Status (Only on sender side) */}
                    {isMe && !msg.isDeleted && (
                      <span className="flex items-center gap-0.5 font-medium text-[10px]">
                        {msg.status === "read" || (msg.readBy && msg.readBy.length > 1) ? (
                          <span
                            className="text-emerald-700 font-semibold flex items-center gap-0.5"
                            title="প্রাপক বার্তাটি পড়েছেন"
                          >
                            <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span>দেখা হয়েছে</span>
                          </span>
                        ) : (
                          <span
                            className="text-slate-400 flex items-center gap-0.5"
                            title="প্রাপক এখনো বার্তাটি পড়েননি"
                          >
                            <Check className="h-3 w-3 text-slate-400" />
                            <span>অপঠিত</span>
                          </span>
                        )}
                      </span>
                    )}

                    {/* Action Controls for User's own message: Edit (within 24h) and Delete */}
                    {isMe && !msg.isDeleted && (
                      <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                        {isEditable && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(msg._id);
                              setEditingText(msg.text);
                            }}
                            className="p-1 text-slate-500 sm:text-slate-400 hover:text-teal-700 transition"
                            title="বার্তা এডিট করুন (১ দিনের মধ্যে)"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("আপনি কি নিশ্চিতভাবে এই বার্তাটি মুছে ফেলতে চান?")) {
                              onDeleteMessage(msg._id);
                            }
                          }}
                          className="p-1 text-rose-500 sm:text-slate-400 hover:text-rose-600 active:scale-95 transition"
                          title="বার্তা মুছুন"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                        </button>
                      </div>
                    )}

                    {/* Report action for received message */}
                    {!isMe && onReportMessage && (
                      <button
                        type="button"
                        onClick={() => onReportMessage(msg)}
                        className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-rose-600 ml-1 flex items-center gap-0.5 text-[10px]"
                        title="রিপোর্ট করুন"
                      >
                        <Flag className="h-2.5 w-2.5" />
                        <span>রিপোর্ট</span>
                      </button>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Image Preview Tray (Before Sending) */}
      {selectedImagePreview && (
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300 bg-white shadow-2xs">
              <img
                src={selectedImagePreview}
                alt="Selected preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-slate-800 block truncate max-w-xs">
                {selectedImageFile?.name || "ছবি সংযুক্ত"}
              </span>
              <span className="text-[11px] text-teal-700">ছবি পাঠানোর জন্য প্রস্তুত</span>
            </div>
          </div>

          <button
            type="button"
            onClick={clearSelectedImage}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition"
            title="ছবি বাতিল করুন"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4. Message Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0 z-10"
      >
        {/* Hidden File Picker for Image */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Image Attachment Trigger Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || uploadingImage}
          className="p-2 text-slate-500 hover:text-[#00636b] hover:bg-teal-50 rounded-lg transition shrink-0"
          title="ছবি পাঠান"
        >
          <ImageIcon className="h-5 w-5" />
        </button>

        {/* Text Input */}
        <Input
          placeholder={
            selectedImageFile
              ? "ছবির সাথে ক্যাপশন লিখুন (ঐচ্ছিক)..."
              : "এখানে বার্তা লিখুন..."
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={2000}
          className="flex-1 text-xs sm:text-sm h-10 border-slate-300 focus:ring-[#00636b]"
        />

        {/* Send Button */}
        <Button
          type="submit"
          disabled={(!inputText.trim() && !selectedImageFile) || sending}
          className="h-10 px-4 bg-[#00636b] hover:bg-[#004f56] text-white text-xs gap-1.5 shrink-0 shadow-2xs font-semibold"
        >
          {sending || uploadingImage ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">পাঠানো হচ্ছে...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">পাঠান</span>
            </>
          )}
        </Button>
      </form>

      {/* Full-view Lightbox Modal for Chat Images */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Full view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete Conversation Confirmation Modal */}
      {showDeleteConvModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">কথোপকথন মুছে ফেলবেন?</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  এটি আপনার ইনবক্স তালিকা থেকে সম্পূর্ণ মুছে যাবে।
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConvModal(false)}
                disabled={deletingConv}
              >
                বাতিল
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={deletingConv}
                onClick={async () => {
                  try {
                    setDeletingConv(true);
                    await onDeleteConversation(activeConversation._id);
                    setShowDeleteConvModal(false);
                  } finally {
                    setDeletingConv(false);
                  }
                }}
              >
                {deletingConv ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
