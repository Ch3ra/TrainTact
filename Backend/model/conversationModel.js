const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    readStatus: {
      type: Map,
      of: Boolean, 
      default: {},
    },
  },
  { timestamps: true }
);

// Create an index for faster queries
conversationSchema.index({ members: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
