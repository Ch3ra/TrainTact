// model/videoCallModel.js
const mongoose = require("mongoose");

const videoCallSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["initiated", "ongoing", "completed", "missed", "rejected"],
      default: "initiated"
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number,
      default: 0
    },
    screenShareActive: {
      type: Boolean,
      default: false
    },
    screenSharer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("VideoCall", videoCallSchema);