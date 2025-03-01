const mongoose = require("mongoose");

const trainerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: [true, "User reference is required"]
    },
    yearsOfExperience: {
      type: Number,
      // required: [true, "Years of experience is required"]
    },
    price: {
      type: Number,
      // required: [true, "Price per session is required"],
      min: [0, "Price cannot be less than zero"]
    },
    availabilityHours: {
      type: String,
      enum: ["morning", "mid-day", "afternoon", "evening", "night"]
    },
    description: {
      type: String,
      // required: [true, "Description is required"]
    },
    startDay: {
      type: String,
      // required: [true, "Start day is required"],
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    },
    endDay: {
      type: String,
      // required: [true, "End day is required"],
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    
    },
    coverPhoto: {
      type: String,
      // required: [true, "Cover photo is required"]
    },
  advancedNeeded:{
    type: Boolean,
    default: false,
  }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trainer", trainerSchema);
