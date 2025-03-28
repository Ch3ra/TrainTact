const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  workoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutSchedule',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one rating per workout
ratingSchema.index({ workoutId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);