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
  MoreVertical,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppDispatch, useAppSelector } from "@/store";
import { setCredentials } from "@/store/slices/authSlice";
import { formatBanglaMessageTime, parseSafeMessageText } from "@/lib/message-utils";
import { useSocketChat } from "@/lib/socket-client";
import { ChatConversationView } from "@/components/chat/ChatConversationView";
import { cn, toBanglaNumber } from "@/lib/utils";

export default function TeacherMessagesPage() {
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);
  const [currentUser, setCurrentUser] = useState<any>(reduxUser);

  useEffect(() => {
    if (reduxUser) {
      setCurrentUser(reduxUser);
    } else {
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setCurrentUser(json.data);
            dispatch(setCredentials({ user: json.data, token: "" }));
          }
        })
        .catch(() => {});
    }
  }, [reduxUser, dispatch]);

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

  // Conversation Item 3-dot menu state
  const [openConvMenuId, setOpenConvMenuId] = useState<string | null>(null);

  // Close conversation 3-dot menu on click outside
  useEffect(() => {
    const handleOutside = () => setOpenConvMenuId(null);
    if (openConvMenuId) {
      window.addEventListener("click", handleOutside);
    }
    return () => window.removeEventListener("click", handleOutside);
  }, [openConvMenuId]);

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
      // Update last message in conversation list
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
    onMessagesRead: ({ conversationId, readerId }) => {
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
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Silent sync for real-time messages & seen status without flickering loading spinners
  const syncActiveConversation = useCallback(async (convId: string) => {
    if (!convId) return;
    try {
      const res = await fetch(`/api/messages?conversationId=${convId}&page=1&limit=30`);
      const json = await res.json();
      if (json.success && json.data) {
        const latestMsgs: any[] = json.data.messages || [];
        setMessages((prev) => {
          if (latestMsgs.length === 0 && prev.length === 0) return prev;

          const isDifferent =
            latestMsgs.length !== prev.length ||
            latestMsgs.some((lm) => {
              const matchingPrev = prev.find((p) => p._id === lm._id);
              if (!matchingPrev) return true;
              return (
                matchingPrev.status !== lm.status ||
                (matchingPrev.readBy?.length || 0) !== (lm.readBy?.length || 0) ||
                matchingPrev.text !== lm.text
              );
            });

          if (!isDifferent) return prev;

          const olderMessages = prev.filter(
            (p) => !latestMsgs.some((lm) => lm._id === p._id)
          );
          return [...olderMessages, ...latestMsgs];
        });
      }
    } catch {
      // Ignore background sync errors
    }
  }, []);

  // Periodic live sync for active chat and conversations list
  useEffect(() => {
    if (!activeConversationId) {
      const listTimer = setInterval(() => {
        fetchConversations();
      }, 4000);
      return () => clearInterval(listTimer);
    }

    const activeTimer = setInterval(() => {
      syncActiveConversation(activeConversationId);
      fetchConversations();
    }, 2000);

    return () => clearInterval(activeTimer);
  }, [activeConversationId, syncActiveConversation, fetchConversations]);

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
          initOnly: true,
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
    setMessages([]);
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

  const currentUserId = String(currentUser?._id || currentUser?.id || "");

  const activeConv = conversations.find((c) => c._id === activeConversationId);
  const otherParticipant = activeConv?.participants?.find((p: any) => {
    const pId = String(p?._id || p?.id || p || "");
    return pId && pId !== currentUserId;
  }) || activeConv?.participants?.[0];

  const filteredConversations = conversations.filter((c) => {
    const other = c.participants?.find((p: any) => {
      const pId = String(p?._id || p?.id || p || "");
      return pId && pId !== currentUserId;
    }) || c.participants?.[0];
    if (!other) return false;
    return (
      other.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      other.phone?.toLowerCase().includes(search.toLowerCase()) ||
      other.role?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="যোগাযোগ ও বার্তা ইনবক্স"
          description="শিক্ষার্থী ও কর্তৃপক্ষের সাথে সরাসরি বার্তা বিনিময় ও একাডেমি নোটিফিকেশন"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
        {/* Left Panel: Conversation List (Messenger-style mobile toggle) */}
        <div
          className={cn(
            "flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs lg:col-span-4",
            activeConversationId ? "hidden lg:flex" : "flex"
          )}
        >
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
                  নতুন বার্তা শুরু করুন
                </Button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = conv.participants?.find((p: any) => {
                  const pId = String(p?._id || p?.id || p || "");
                  return pId && pId !== currentUserId;
                }) || conv.participants?.[0];
                const isActive = conv._id === activeConversationId;
                const unread = conv.unreadCount || 0;

                return (
                  <div
                    key={conv._id}
                    onClick={() => {
                      setActiveConversationId(conv._id);
                      setConversations((prev) =>
                        prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
                      );
                      window.dispatchEvent(new CustomEvent("messages-updated"));
                    }}
                    className={cn(
                      "w-full p-3.5 text-left flex items-start gap-3 transition cursor-pointer select-none group relative",
                      isActive
                        ? "bg-[#d7eef1]/40 border-l-4 border-[#00636b]"
                        : "hover:bg-slate-50"
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-[#00636b] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs overflow-hidden">
                      {other?.avatarUrl ? (
                        <img src={other.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>{other?.fullName?.charAt(0) || "U"}</span>
                      )}
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
                      {other?.phone && (
                        <p className="text-[10px] font-mono text-slate-500 truncate mb-0.5">
                          {other.phone}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-500 truncate flex-1">
                          {conv.lastMessage?.text || "কথোপকথন শুরু করুন..."}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {unread > 0 && (
                            <span className="h-5 min-w-5 px-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {toBanglaNumber(unread)}
                            </span>
                          )}
                          {/* 3-Dot Dropdown for conversation deletion */}
                          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenConvMenuId(openConvMenuId === conv._id ? null : conv._id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition"
                              title="কথোপকথন অপশন"
                              aria-label="Conversation options"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                            {openConvMenuId === conv._id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setOpenConvMenuId(null);
                                    if (confirm("আপনি কি নিশ্চিতভাবে এই কথোপকথনটি ইনবক্স থেকে মুছে ফেলতে চান?")) {
                                      await handleDeleteConversation(conv._id);
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                  <span>কথোপকথন মুছুন</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Chat Thread Window (Messenger-style mobile toggle) */}
        <div
          className={cn(
            "flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs lg:col-span-8",
            !activeConversationId ? "hidden lg:flex" : "flex"
          )}
        >
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
              onCloseConversation={() => setActiveConversationId(null)}
              onBack={() => setActiveConversationId(null)}
              onReportMessage={(msg) => {
                setSelectedMessageForReport(msg);
                setReportModalOpen(true);
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00636b] shadow-2xs">
                <MessageSquare className="h-7 w-7 text-[#00636b]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  কোনো কথোপকথন নির্বাচিত নেই
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  কথোপকথন দেখতে বা নতুন বার্তা পাঠাতে বাম পাশের তালিকা থেকে একটি কথোপকথন নির্বাচন করুন।
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Contact Selection Modal */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-[#00636b]" />
                <span>অনুমোদিত যোগাযোগ তালিকা</span>
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
                placeholder="নাম দিয়ে যোগাযোগ খুঁজুন..."
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
                  কোনো যোগাযোগ পাওয়া যায়নি
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
                            ? "কর্তৃপক্ষ / অ্যাডমিন"
                            : c.role === "student"
                              ? "শিক্ষার্থী"
                              : "শিক্ষক"}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-medium text-teal-700 bg-teal-50 border-teal-200">
                      Message
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Abusive Message Modal */}
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
                <p>রিপোর্ট সফলভাবে জমা হয়েছে। প্রশাসন এটি পর্যালোচনা করবে।</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  এই বার্তাটিতে কোনো আপত্তিকর, নীতিমালা বিরোধী বা বিভ্রান্তিকর তথ্য থাকলে
                  কারণ লিখে জমা দিন:
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
