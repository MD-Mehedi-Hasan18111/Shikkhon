"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export type SocketStatus =
  "connected" | "connecting" | "reconnecting" | "disconnected" | "error";

interface UseSocketChatOptions {
  conversationId?: string | null;
  onNewMessage?: (message: any) => void;
  onMessagesRead?: (payload: {
    conversationId: string;
    readerId: string;
    readerName: string;
  }) => void;
  onConversationUpdate?: (payload: { conversationId: string; lastMessage: any }) => void;
}

let globalSocket: Socket | null = null;

export function getOrCreateSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("Socket client only available in browser runtime");
  }

  if (!globalSocket) {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== "undefined" && window.location.port === "3000"
        ? `${window.location.protocol}//${window.location.hostname}:3001`
        : window.location.origin);

    globalSocket = io(socketUrl, {
      autoConnect: true,
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  }

  return globalSocket;
}

export function useSocketChat({
  conversationId,
  onNewMessage,
  onMessagesRead,
  onConversationUpdate,
}: UseSocketChatOptions = {}) {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize and attach lifecycle listeners
  useEffect(() => {
    try {
      const socket = getOrCreateSocket();
      socketRef.current = socket;

      if (socket.connected) {
        setStatus("connected");
      } else {
        setStatus("connecting");
      }

      const handleConnect = () => {
        setStatus("connected");
        setError(null);
      };

      const handleDisconnect = (reason: string) => {
        setStatus("disconnected");
        if (reason === "io server disconnect") {
          // the disconnection was initiated by the server, reconnect manually
          socket.connect();
        }
      };

      const handleConnectError = (err: Error) => {
        setStatus("error");
        setError(err.message || "রিয়েলটাইম সার্ভারে সংযোগ সমস্যা");
      };

      const handleReconnectAttempt = () => {
        setStatus("reconnecting");
      };

      const handleReconnect = () => {
        setStatus("connected");
        setError(null);
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
      socket.io.on("reconnect_attempt", handleReconnectAttempt);
      socket.io.on("reconnect", handleReconnect);

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("connect_error", handleConnectError);
        socket.io.off("reconnect_attempt", handleReconnectAttempt);
        socket.io.off("reconnect", handleReconnect);
      };
    } catch {
      setStatus("disconnected");
    }
  }, []);

  // Subscribe to conversation room when conversationId changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId) return;

    if (socket.connected) {
      socket.emit("join_conversation", { conversationId });
    }

    const onConnectJoin = () => {
      socket.emit("join_conversation", { conversationId });
    };

    socket.on("connect", onConnectJoin);

    return () => {
      socket.off("connect", onConnectJoin);
      socket.emit("leave_conversation", { conversationId });
    };
  }, [conversationId]);

  // Message and update event handlers
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewMessage = (data: { conversationId: string; message: any }) => {
      if (onNewMessage) {
        onNewMessage(data.message);
      }
    };

    const handleMessagesRead = (payload: {
      conversationId: string;
      readerId: string;
      readerName: string;
    }) => {
      if (onMessagesRead) {
        onMessagesRead(payload);
      }
    };

    const handleConvUpdate = (payload: { conversationId: string; lastMessage: any }) => {
      if (onConversationUpdate) {
        onConversationUpdate(payload);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("messages_read", handleMessagesRead);
    socket.on("conversation_update", handleConvUpdate);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("messages_read", handleMessagesRead);
      socket.off("conversation_update", handleConvUpdate);
    };
  }, [onNewMessage, onMessagesRead, onConversationUpdate]);

  // Send message helper with fallback to REST API
  const sendMessage = useCallback(
    async (text: string, imageUrl?: string) => {
      if (!conversationId || (!text.trim() && !imageUrl)) return null;

      const socket = socketRef.current;
      if (socket && socket.connected) {
        return new Promise<any>((resolve, reject) => {
          socket.emit(
            "send_message",
            { conversationId, text: text.trim(), imageUrl },
            (response: { success?: boolean; message?: any; error?: string }) => {
              if (response.success && response.message) {
                resolve(response.message);
              } else {
                // If socket fails, fallback to REST
                fetch("/api/messages", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ conversationId, text: text.trim(), imageUrl }),
                })
                  .then((r) => r.json())
                  .then((json) => {
                    if (json.success && json.data) resolve(json.data);
                    else reject(new Error(response.error || "মেসেজ পাঠানো ব্যর্থ হয়েছে"));
                  })
                  .catch(reject);
              }
            }
          );
        });
      }

      // Offline / Disconnected Fallback: Send directly via REST API
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, text: text.trim(), imageUrl }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "মেসেজ পাঠানো যায়নি");
      }

      return json.data;
    },
    [conversationId]
  );

  // Mark read helper
  const markAsRead = useCallback(() => {
    if (!conversationId) return;
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit("mark_read", { conversationId });
    }
    fetch(`/api/messages?conversationId=${conversationId}&page=1&limit=1`).catch(() => {});
  }, [conversationId]);

  // Manual reconnect trigger
  const reconnect = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      setStatus("connecting");
      socket.connect();
    }
  }, []);

  return {
    status,
    error,
    sendMessage,
    markAsRead,
    reconnect,
  };
}
