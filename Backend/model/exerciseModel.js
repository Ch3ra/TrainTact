const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainer",
      required: [true, "Trainer reference is required"]
    },
    exerciseGoal: {
      type: String,
      required: [true, "Exercise goal is required"]
    },
    days: [
      {
        dayNumber: {
          type: Number,
         
          min: 1,
          max: 7
        },
        activities: {
          type: String,
       
        }
      }
    ],
    cardPhoto: {
      type: String,
      required: [true, "Card photo is required"]
    },
    backgroundVideo: {
      type: String,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exercise", exerciseSchema);