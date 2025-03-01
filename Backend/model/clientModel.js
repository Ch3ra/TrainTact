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
      min: [0, 'Height cannot be negative']  // Set a minimum value with an error message
    },
    weight: {
      type: Number,
      required: true,
      min: [0, 'Weight cannot be negative']  // Set a minimum value with an error message
    },
    fitnessLevel: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],  // Use an enum to limit the values to specific options
    },description: {
      type: String,
      default: ''  // Optional: provide a default empty string if no description is provided
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
