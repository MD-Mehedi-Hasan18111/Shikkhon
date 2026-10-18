"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  MessageSquare,
  Send,
  Users,
  Search,
  Clock,
  User,
  Loader2,
  RefreshCw,
  Plus,
  Wifi,
  WifiOff,
  AlertTriangle,
  Flag,
  Check,
  CheckCheck,
  ExternalLink,
  X,
  HelpCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppSelector } from "@/store";
import { formatBanglaMessageTime, parseSafeMessageText } from "@/lib/message-utils";
import { useSocketChat } from "@/lib/socket-client";
import { ChatConversationView } from "@/components/chat/ChatConversationView";

export default function StudentMessagesPage() {
  const currentUser = useAppSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  // New Chat Modal state
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Report Modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedMessageForReport, setSelectedMessageForReport] = useState<any | null>(
    null
  );
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time Socket.IO Hook
  const {
    status: socketStatus,
    sendMessage: socketSendMessage,
    markAsRead,
    reconnect,
  } = useSocketChat({
    conversationId: activeConversationId,
    onNewMessage: (newMsg) => {
      if (newMsg.conversation === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        markAsRead();
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === newMsg.conversation
            ? {
                ...c,
                lastMessage: {
                  text: newMsg.text,
                  sender: newMsg.sender,
                  sentAt: newMsg.createdAt,
                },
                unreadCount:
                  c._id === activeConversationId
                    ? 0
                    : (c.unreadCount || 0) +
                      (newMsg.sender?._id !== currentUser?.id ? 1 : 0),
              }
            : c
        )
      );
    },
    onMessagesRead: ({ conversationId }) => {
      if (conversationId === activeConversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender?._id === currentUser?.id ? { ...m, status: "read" } : m
          )
        );
      }
    },
    onConversationUpdate: ({ conversationId, lastMessage }) => {
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, lastMessage } : c))
      );
    },
  });

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      const json = await res.json();
      if (json.success && json.data) {
        setConversations(json.data);
        if (json.data.length > 0 && !activeConversationId) {
          setActiveConversationId(json.data[0]._id);
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [activeConversationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const loadMessages = useCallback(async (convId: string, pageNum = 1) => {
    if (!convId) return;
    if (pageNum === 1) setLoadingMessages(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(
        `/api/messages?conversationId=${convId}&page=${pageNum}&limit=30`
      );
      const json = await res.json();
      if (json.success && json.data) {
        const fetchedMessages = json.data.messages || [];
        if (pageNum === 1) {
          setMessages(fetchedMessages);
        } else {
          setMessages((prev) => [...fetchedMessages, ...prev]);
        }
        setHasMore(Boolean(json.data.pagination?.hasMore));
        setPage(pageNum);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingMessages(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId, 1);
      markAsRead();
    }
  }, [activeConversationId, loadMessages, markAsRead]);

  useEffect(() => {
    if (!loadingMessages && page === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loadingMessages, page]);

  // Fetch authorized contacts for new conversation
  const fetchContacts = async (searchTerm = "") => {
    setLoadingContacts(true);
    try {
      const res = await fetch(
        `/api/messages/contacts?search=${encodeURIComponent(searchTerm)}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setContacts(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleStartNewChat = async (recipientId: string) => {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          text: "আসসালামু আলাইকুম।",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewChatModalOpen(false);
        await fetchConversations();
        if (json.data?.conversation) {
          setActiveConversationId(json.data.conversation);
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if ((!text.trim() && !imageUrl) || !activeConversationId) return;

    try {
      const newMsg = await socketSendMessage(text, imageUrl);
      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
      await fetchConversations();
    } catch {
      await loadMessages(activeConversationId, 1);
    }
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    const res = await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, text: newText }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "এডিট ব্যর্থ হয়েছে");
    }
    setMessages((prev) =>
      prev.map((m) => (m._id === messageId ? { ...m, text: newText, isEdited: true } : m))
    );
  };

  const handleDeleteMessage = async (messageId: string) => {
    const res = await fetch(`/api/messages?messageId=${messageId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "মুছে ফেলা সম্ভব হয়নি");
    }
    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId
          ? { ...m, isDeleted: true, text: "এই বার্তাটি মুছে ফেলা হয়েছে", imageUrl: null }
          : m
      )
    );
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const res = await fetch(`/api/messages?conversationId=${conversationId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "কথোপকথন মোছা যায়নি");
    }
    setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    setActiveConversationId(null);
  };

  const handleReportMessage = async () => {
    if (!selectedMessageForReport || !reportReason.trim() || reporting) return;
    setReporting(true);
    try {
      const res = await fetch("/api/messages/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: selectedMessageForReport._id,
          reason: reportReason.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setReportSuccess(true);
        setTimeout(() => {
          setReportModalOpen(false);
          setReportSuccess(false);
          setReportReason("");
          setSelectedMessageForReport(null);
        }, 1500);
      }
    } catch {
      // Ignore
    } finally {
      setReporting(false);
    }
  };

  const activeConv = conversations.find((c) => c._id === activeConversationId);
  const otherParticipant = activeConv?.participants?.find(
    (p: any) => p._id !== currentUser?.id
  );

  const filteredConversations = conversations.filter((c) => {
    const other = c.participants?.find((p: any) => p._id !== currentUser?.id);
    if (!other) return false;
    return (
      other.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      other.role?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="যোগাযোগ ও বার্তা ইনবক্স"
          description="একাডেমিক কর্তৃপক্ষ ও শিক্ষকদের সাথে নিরাপদ ও অনুমোদিত বার্তা বিনিময়"
        />

        {/* Real-time Status Badge */}
        <div className="flex items-center gap-2">
          {socketStatus === "connected" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              রিয়েলটাইম সংযুক্ত (অনলাইন)
            </span>
          )}
          {socketStatus === "reconnecting" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
              <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
              পুনরায় সংযোগ হচ্ছে...
            </span>
          )}
          {(socketStatus === "disconnected" || socketStatus === "error") && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
                <WifiOff className="h-3 w-3 text-rose-600" />
                অফলাইন মোড
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={reconnect}
                className="h-7 text-xs"
              >
                পুনরায় চেষ্টা
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Panel: Conversation List */}
        <div className="lg:col-span-4 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#00636b]" />
                <span>কথোপকথন তালিকা</span>
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNewChatModalOpen(true);
                  fetchContacts("");
                }}
                className="h-8 gap-1 text-xs text-[#00636b] hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>নতুন চ্যাট</span>
              </Button>
            </div>

            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="নাম বা ভূমিকা দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-9 bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Users className="h-8 w-8 mx-auto opacity-40 text-slate-400" />
                <p className="text-xs">কোনো বার্তা পাওয়া যায়নি</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewChatModalOpen(true);
                    fetchContacts("");
                  }}
                  className="text-xs mt-2"
                >
                  সাহায্য বা শিক্ষকের সাথে যোগাযোগ করুন
                </Button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = conv.participants?.find(
                  (p: any) => p._id !== currentUser?.id
                );
                const isActive = conv._id === activeConversationId;
                const unread = conv.unreadCount || 0;

                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConversationId(conv._id)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition ${
                      isActive
                        ? "bg-[#d7eef1]/40 border-l-4 border-[#00636b]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-[#00636b] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                      {other?.fullName?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {other?.fullName || "ব্যবহারকারী"}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {conv.lastMessage?.sentAt
                            ? formatBanglaMessageTime(conv.lastMessage.sentAt)
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[11px] text-slate-500 truncate">
                          {conv.lastMessage?.text || "কথোপকথন শুরু করুন..."}
                        </p>
                        {unread > 0 && (
                          <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Chat Thread Window */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {activeConv && otherParticipant ? (
            <ChatConversationView
              activeConversation={activeConv}
              messages={messages}
              currentUser={currentUser}
              loadingMessages={loadingMessages}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={() => loadMessages(activeConversationId!, page + 1)}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onDeleteConversation={handleDeleteConversation}
              onReportMessage={(msg) => {
                setSelectedMessageForReport(msg);
                setReportModalOpen(true);
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <MessageSquare className="h-12 w-12 text-slate-300 stroke-[1.5]" />
              <div>
                <h4 className="font-bold text-slate-700 text-sm">
                  কোনো বার্তা নির্বাচিত নেই
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  শিক্ষক বা একাডেমি কর্তৃপক্ষের সাথে যোগাযোগ করতে বাম পাশ থেকে নির্বাচন
                  করুন।
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-[#00636b]" />
                <span>অনুমোদিত কর্তৃপক্ষ ও শিক্ষকমণ্ডলী</span>
              </h3>
              <button
                onClick={() => setNewChatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3">
              <Input
                placeholder="নাম দিয়ে খুঁজুন..."
                value={contactSearch}
                onChange={(e) => {
                  setContactSearch(e.target.value);
                  fetchContacts(e.target.value);
                }}
                className="text-xs h-9 bg-slate-50"
              />
            </div>

            <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-slate-100">
              {loadingContacts ? (
                <div className="p-4 text-center text-xs text-slate-400">লোড হচ্ছে...</div>
              ) : contacts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  কোনো কর্তৃপক্ষ বা শিক্ষক পাওয়া যায়নি
                </div>
              ) : (
                contacts.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => handleStartNewChat(c._id)}
                    className="w-full py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg text-left transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[#00636b] text-white flex items-center justify-center font-bold text-xs">
                        {c.fullName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{c.fullName}</h4>
                        <span className="text-[10px] text-slate-400">
                          {c.role === "admin" || c.role === "super_admin"
                            ? "অ্যাকাডেমিক কো-অর্ডিনেটর"
                            : "ব্যাচ শিক্ষক"}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      বার্তা পাঠান
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-rose-600 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>মেসেজ রিপোর্ট করুন</span>
              </h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center text-xs text-emerald-600 font-semibold space-y-1">
                <Check className="h-8 w-8 mx-auto text-emerald-500" />
                <p>রিপোর্ট সফলভাবে জমা হয়েছে।</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  বার্তাটিতে অনুপযুক্ত কিছু থাকলে কারণ লিখে কর্তৃপক্ষকে অবহিত করুন:
                </p>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="রিপোর্টের কারণ লিখুন (কমপক্ষে ৫ অক্ষর)..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReportModalOpen(false)}
                    className="text-xs"
                  >
                    বাতিল
                  </Button>
                  <Button
                    size="sm"
                    disabled={reportReason.trim().length < 5 || reporting}
                    onClick={handleReportMessage}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1"
                  >
                    {reporting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "রিপোর্ট জমা দিন"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
