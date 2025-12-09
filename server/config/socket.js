import { createServer } from "http"; // if you construct a separate server
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";
import User from "./models/User.js";

export function initSocket(server, { jwtSecret, onReady } = {}) {
  // server: http.createServer(app) or your existing server
  const io = new Server(server, {
    cors: { origin: "*" } // set your origin(s) in production
  });

  // In-memory maps (for single-instance). Use Redis for multi-instance.
  const userSockets = new Map(); // userId -> Set(socketId)

  // auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));
      const payload = jwt.verify(token.replace("Bearer ", ""), jwtSecret || process.env.JWT_SECRET);
      socket.userId = payload.id || payload.userId || payload._id;
      next();
    } catch (err) {
      console.log("socket auth error", err.message);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.userId;
    console.log("socket connected:", uid, socket.id);

    // add socket to user's set
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);

    // Set online flag in DB (optional)
    User.findByIdAndUpdate(uid, { $set: { online: true } }).exec();
    // broadcast presence
    io.emit("presence:update", { userId: uid, online: true });

    // Helper to emit to all sockets of a user
    const emitToUser = (userId, event, payload) => {
      const sockets = userSockets.get(userId);
      if (!sockets) return;
      for (const sid of sockets) io.to(sid).emit(event, payload);
    };

    // join a conversation room
    socket.on("join_conversation", async ({ conversationId }) => {
      try {
        // optional: check participant
        const convo = await Conversation.findById(conversationId);
        if (!convo) return;
        if (!convo.participants.map(p=>p.toString()).includes(uid.toString())) return;
        socket.join(conversationId);
      } catch (err) {
        console.error(err);
      }
    });

    // send message
    socket.on("send_message", async (payload, ack) => {
      // payload: { conversationId, text, attachments }
      try {
        const { conversationId, text, attachments } = payload;
        // validate participant
        const convo = await Conversation.findById(conversationId);
        if (!convo) return ack?.({ error: "Conversation not found" });

        if (!convo.participants.map(p=>p.toString()).includes(uid.toString()))
          return ack?.({ error: "Not a participant" });

        const message = new Message({
          conversationId,
          sender: uid,
          text: text || "",
          attachments: attachments || [],
          readBy: [uid], // sender considered read by themselves
        });
        await message.save();

        convo.lastMessage = message._id;
        // increment unread for other participants
        convo.participants.forEach(pid => {
          const k = pid.toString();
          if (k !== uid.toString()) {
            convo.unreadCount.set(k, (convo.unreadCount.get(k) || 0) + 1);
          }
        });
        await convo.save();

        const saved = await Message.findById(message._id).populate("sender", "username profilePic");

        // emit to room (all participants currently in room)
        io.to(conversationId).emit("message:new", saved);

        // also emit conversation update for participants (optional)
        convoPopulated = await Conversation.findById(conversationId)
          .populate("participants", "username profilePic")
          .populate({
            path: "lastMessage",
            populate: { path: "sender", select: "username profilePic" }
          });

        convoPopulated = convoPopulated.toObject();
        // notify each participant individually (their conversation list may update)
        convo.participants.forEach(pid => {
          emitToUser(pid.toString(), "conversation:update", convoPopulated);
        });

        // ack to sender
        ack?.({ success: true, message: saved });
      } catch (err) {
        console.error("send_message error", err);
        ack?.({ error: err.message });
      }
    });

    // delivered
    socket.on("message:delivered", async ({ messageId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;
        if (!msg.deliveredTo.map(d=>d.toString()).includes(uid.toString())) {
          msg.deliveredTo.push(uid);
          await msg.save();
        }
        // notify sender(s)
        emitToUser(msg.sender.toString(), "message:delivered", { messageId, userId: uid });
      } catch (err) {
        console.error(err);
      }
    });

    // read
    socket.on("message:read", async ({ messageId, conversationId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;
        if (!msg.readBy.map(r=>r.toString()).includes(uid.toString())) {
          msg.readBy.push(uid);
          await msg.save();
        }
        // reduce unreadCount for this user on conversation
        const convo = await Conversation.findById(conversationId);
        if (convo) {
          convo.unreadCount.set(uid.toString(), 0);
          await convo.save();
          // notify participants about unread change
          convo.participants.forEach(pid => {
            emitToUser(pid.toString(), "conversation:update", convo);
          });
        }
        emitToUser(msg.sender.toString(), "message:read", { messageId, userId: uid });
      } catch (err) {
        console.error(err);
      }
    });

    // typing
    socket.on("typing", ({ conversationId, typing }) => {
      // broadcast to other participants in the room
      socket.to(conversationId).emit("typing", { conversationId, from: uid, typing });
    });

    socket.on("disconnect", () => {
      // remove socket id
      const set = userSockets.get(uid);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          userSockets.delete(uid);
          // set offline in DB
          User.findByIdAndUpdate(uid, { $set: { online: false } }).exec();
          io.emit("presence:update", { userId: uid, online: false });
        }
      }
      console.log("socket disconnected", uid, socket.id);
    });
  });

  if (onReady) onReady(io);
  return io;
}
