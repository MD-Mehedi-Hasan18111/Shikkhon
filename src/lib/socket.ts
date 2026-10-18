import { io, Socket } from "socket.io-client";
import { clientEnv } from "@/config/env";

let socketInstance: Socket | null = null;

export interface RealtimeMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  batchId?: string;
  text: string;
  createdAt: string;
}

export interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "alert";
  timestamp: string;
}

/**
 * Initialize or retrieve a singleton Socket.IO client instance
 */
export function getSocketClient(authToken?: string): Socket {
  if (typeof window === "undefined") {
    throw new Error("Socket.IO client can only be initialized on client-side");
  }

  if (!socketInstance) {
    const socketUrl = clientEnv.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

    socketInstance = io(socketUrl, {
      autoConnect: false,
      auth: {
        token: authToken,
      },
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("⚡ [Socket.IO] Connected with ID:", socketInstance?.id);
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("⚠️ [Socket.IO] Connection error:", err.message);
    });
  }

  return socketInstance;
}

/**
 * Disconnect and clear socket instance
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
