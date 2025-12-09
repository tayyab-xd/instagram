import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    attachments: [
      {
        url: String,
        type: String // 'image'|'video'|'file'
      }
    ],
    // who has read this message (array of userIds)
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // who has been delivered (online delivery), optional
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
