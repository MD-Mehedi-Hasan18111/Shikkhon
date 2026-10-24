import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyJwtToken, TokenPayload } from "@/lib/auth";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";
import { SiteSettings } from "@/models/SiteSettings";

const SOCKET_PORT = parseInt(process.env.SOCKET_PORT || process.env.PORT || "3001", 10);

interface AuthenticatedSocket extends Socket {
  data: {
    user: TokenPayload;
    lastMessageTime?: number;
    messageCountWindow?: { count: number; windowStart: number };
  };
}

/**
 * Extracts authentication JWT token from socket handshake (cookies or auth payload).
 */
function extractAuthToken(socket: Socket): string | null {
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }

  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc: Record<string, string>, part) => {
    const [key, val] = part.trim().split("=");
    if (key && val) acc[key] = decodeURIComponent(val);
    return acc;
  }, {});

  return cookies["token"] || null;
}

export function initSocketServer(httpServer = createServer()) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // Authentication Middleware: Verify session on connection
  io.use(async (socket, next) => {
    try {
      const token = extractAuthToken(socket);
      if (!token) {
        return next(new Error("Authentication required: সেশন পাওয়া যায়নি"));
      }

      const decoded = verifyJwtToken(token);
      (socket as AuthenticatedSocket).data.user = decoded;
      next();
    } catch {
      return next(new Error("Authentication failed: মেয়াদোত্তীর্ণ বা অবৈধ সেশন"));
    }
  });

  io.on("connection", async (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const user = socket.data.user;

    // Join user's personal private room
    const userRoom = `user:${user.userId}`;
    socket.join(userRoom);

    // ==========================================
    // 1. Join Conversation Room (With strict DB check)
    // ==========================================
    socket.on(
      "join_conversation",
      async ({ conversationId }: { conversationId: string }, callback) => {
        try {
          if (!conversationId) {
            if (callback) callback({ error: "কথোপকথন আইডি আবশ্যক" });
            return;
          }

          await connectToDatabase();
          const conv = await Conversation.findOne({
            _id: conversationId,
            participants: user.userId,
            status: "active",
          });

          if (!conv) {
            if (callback) callback({ error: "অননুমোদিত বা নিষ্ক্রিয় কথোপকথন" });
            return;
          }

          const room = `conversation:${conversationId}`;
          socket.join(room);
          if (callback) callback({ success: true, room });
        } catch (err) {
          if (callback) callback({ error: "রুম সংযুক্তিতে ত্রুটি" });
        }
      }
    );

    // ==========================================
    // 2. Leave Conversation Room
    // ==========================================
    socket.on("leave_conversation", ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // ==========================================
    // 3. Send Real-time Message
    // ==========================================
    socket.on(
      "send_message",
      async (
        payload: { conversationId: string; text: string; attachments?: any[] },
        callback
      ) => {
        try {
          const { conversationId, text, attachments } = payload;

          // Validate message text length (1 to 2000 chars)
          if (!text || typeof text !== "string" || text.trim().length === 0) {
            if (callback) callback({ error: "মেসেজ লিখুন" });
            return;
          }

          if (text.length > 2000) {
            if (callback)
              callback({ error: "মেসেজ সর্বোচ্চ ২০০০ অক্ষরের মধ্যে হতে হবে" });
            return;
          }

          // Disallow attachments until complete virus scanning is in place
          if (attachments && attachments.length > 0) {
            if (callback) callback({ error: "ফাইল বা ছবি সংযুক্তি এখনো অনুমোদিত নয়" });
            return;
          }

          // Socket-level Frequency Rate Limiter (Max 10 messages per 10 seconds)
          const now = Date.now();
          const rateWindow = socket.data.messageCountWindow || {
            count: 0,
            windowStart: now,
          };
          if (now - rateWindow.windowStart > 10000) {
            rateWindow.count = 1;
            rateWindow.windowStart = now;
          } else {
            rateWindow.count += 1;
          }
          socket.data.messageCountWindow = rateWindow;

          if (rateWindow.count > 10) {
            if (callback)
              callback({
                error: "আপনি খুব ঘন ঘন বার্তা পাঠাচ্ছেন। কিছুক্ষণ অপেক্ষা করুন।",
              });
            return;
          }

          await connectToDatabase();

          // Verify conversation membership and active status
          const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: user.userId,
            status: "active",
          }).populate("participants", "role");

          if (!conversation) {
            if (callback) callback({ error: "কথোপকথনে প্রবেশের অনুমতি নেই" });
            return;
          }

          // Institution policy check for teacher <-> student
          const participantRoles = (conversation.participants as any[]).map(
            (p) => p.role
          );
          const hasTeacher = participantRoles.includes("teacher");
          const hasStudent =
            participantRoles.includes("student") || participantRoles.includes("guardian");

          if (hasTeacher && hasStudent) {
            const settings = await SiteSettings.findOne({ key: "main" }).lean();
            if (settings && settings.allowTeacherStudentMessaging === false) {
              if (callback)
                callback({
                  error:
                    "প্রতিষ্ঠানের নীতি অনুযায়ী শিক্ষক-শিক্ষার্থী চ্যাট সাময়িকভাবে স্থগিত",
                });
              return;
            }
          }

          // Persist Message in Database
          const message = await Message.create({
            conversation: conversation._id,
            sender: user.userId,
            text: text.trim(),
            readBy: [user.userId],
            deletedFor: [],
            status: "sent",
          });

          // Update Conversation lastMessage and unhide for participants
          conversation.deletedFor = [];
          conversation.lastMessage = {
            text: text.trim(),
            sender: user.userId as any,
            sentAt: new Date(),
          };
          await conversation.save();

          const populatedMessage = await Message.findById(message._id)
            .populate("sender", "fullName role avatarUrl")
            .lean();

          // Broadcast to conversation room
          const conversationRoom = `conversation:${conversationId}`;
          io.to(conversationRoom).emit("new_message", {
            conversationId,
            message: populatedMessage,
          });

          // Notify participant personal rooms about conversation update
          (conversation.participants as any[]).forEach((p) => {
            const pId = p._id ? p._id.toString() : p.toString();
            io.to(`user:${pId}`).emit("conversation_update", {
              conversationId,
              lastMessage: conversation.lastMessage,
            });
          });

          if (callback) callback({ success: true, message: populatedMessage });
        } catch (err) {
          if (callback) callback({ error: "মেসেজ পাঠানো সম্ভব হয়নি" });
        }
      }
    );

    // ==========================================
    // 4. Mark Messages as Read (Read Receipts)
    // ==========================================
    socket.on(
      "mark_read",
      async ({ conversationId }: { conversationId: string }, callback) => {
        try {
          if (!conversationId) return;
          await connectToDatabase();

          await Message.updateMany(
            {
              conversation: conversationId,
              deletedFor: { $ne: user.userId },
              sender: { $ne: user.userId },
              readBy: { $ne: user.userId },
            },
            {
              $addToSet: { readBy: user.userId },
              $set: { status: "read" },
            }
          );

          // Notify conversation room about read status
          io.to(`conversation:${conversationId}`).emit("messages_read", {
            conversationId,
            readerId: user.userId,
            readerName: user.fullName,
          });

          if (callback) callback({ success: true });
        } catch (err) {
          if (callback) callback({ error: "রিড রিসিট আপডেট ব্যর্থ" });
        }
      }
    );

    // ==========================================
    // 5. Typing Indicators
    // ==========================================
    socket.on("typing", ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit("user_typing", {
          conversationId,
          userId: user.userId,
          userName: user.fullName,
        });
      }
    });

    socket.on("stop_typing", ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit("user_stop_typing", {
          conversationId,
          userId: user.userId,
        });
      }
    });

    socket.on("disconnect", () => {
      // Disconnect cleaned up by socket.io automatically
    });
  });

  return { io, httpServer };
}

// Runnable standalone server entry point
if (require.main === module) {
  const server = createServer();
  initSocketServer(server);
  server.listen(SOCKET_PORT, () => {
    console.log(`⚡ [Socket.IO Server] Running persistently on port ${SOCKET_PORT}`);
  });
}
