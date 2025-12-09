import express from "express";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import verifyJWT from "../middleware/verifyJWT.js"; // simple middleware to set req.userId

const router = express.Router();

// Create or get a conversation between two users (1:1)
router.post("/conversations", verifyJWT, async (req, res) => {
  try {
    const { participantId } = req.body; // the other user id
    const me = req.userId;

    if (!participantId) return res.status(400).json({ message: "participantId required" });
    
    // find existing conversation (order independent)
    let convo = await Conversation.findOne({
      participants: { $all: [me, participantId], $size: 2 }
    });

    if (!convo) {
      convo = new Conversation({ participants: [me, participantId], unreadCount: { } });
      convo.unreadCount.set(me.toString(), 0);
      convo.unreadCount.set(participantId.toString(), 0);
      await convo.save();
    }

    convo = await Conversation.findById(convo._id)
      .populate("participants", "username profilePic");

    res.json(convo);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// Get all conversations for current user (with last message)
router.get("/conversations", verifyJWT, async (req, res) => {
  try {
    const me = req.userId;

    const convos = await Conversation.find({ participants: me })
      .sort({ updatedAt: -1 })
      .populate("participants", "username profilePic")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username profilePic" }
      });

    res.json(convos);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// Get paginated messages for a conversation (cursor-based)
router.get("/conversations/:id/messages", verifyJWT, async (req, res) => {
  try {
    const convoId = req.params.id;
    const me = req.userId;
    const { before, limit = 30 } = req.query; 

    // ensure participant
    const convo = await Conversation.findById(convoId);
    if (!convo || !convo.participants.map(p=>p.toString()).includes(me.toString())) {
      return res.status(403).json({ message: "Not part of this conversation" });
    }

    const query = { conversationId: convoId };
    if (before) {
      // if before looks like an ISO date
      const date = Date.parse(before);
      if (!isNaN(date)) query.createdAt = { $lt: new Date(before) };
      else query._id = { $lt: mongoose.Types.ObjectId(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("sender", "username profilePic");
    // return newest last (reverse)
    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// Optional: POST /api/chat/messages using HTTP fallback
router.post("/messages", verifyJWT, async (req, res) => {
  try {
    const { conversationId, text, attachments } = req.body;
    const me = req.userId;

    // validate convo
    const convo = await Conversation.findById(conversationId);
    if (!convo || !convo.participants.map(p=>p.toString()).includes(me.toString()))
      return res.status(403).json({ message: "Not allowed" });

    const message = new Message({ conversationId, sender: me, text, attachments: attachments || [] });
    await message.save();

    convo.lastMessage = message._id;
    // increment unread for other participant(s)
    convo.participants.forEach(pid => {
      const k = pid.toString();
      if (k !== me.toString()) {
        convo.unreadCount.set(k, (convo.unreadCount.get(k) || 0) + 1);
      }
    });
    await convo.save();

    const saved = await Message.findById(message._id).populate("sender", "username profilePic");

    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

export default router;
