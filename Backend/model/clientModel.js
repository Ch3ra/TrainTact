const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
   
    height: {
      type: Number,
      required: true,
      min: [0, 'Height cannot be negative']  
    },
    weight: {
      type: Number,
      required: true,
      min: [0, 'Weight cannot be negative']  
    },
    fitnessLevel: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'], 
    },description: {
      type: String,
      default: '' 
    },  selectedExercises: [
      {
        exercise: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Exercise'
        },
        startDate: {
          type: Date,
          default: Date.now
        },
        active: {
          type: Boolean,
          default: true
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
