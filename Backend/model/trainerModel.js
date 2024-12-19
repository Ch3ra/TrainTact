const mongoose = require("mongoose");

const trainerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    yearsOfExperience: {
      type: Number,
      required: true,
    },
    resume: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trainer', trainerSchema);
