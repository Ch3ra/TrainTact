const mongoose = require('mongoose');

// Create a counter for booking numbers
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

const workoutScheduleSchema = new mongoose.Schema({
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
    startTime: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    message: {
        type: String
    },
    isClientVerified: {
      type: Boolean,
      default: false, 
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
    },
    amount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming',
    },
    bookingNumber: {
        type: String,
        unique: true
    }
}, { timestamps: true }); // This adds createdAt and updatedAt automatically

workoutScheduleSchema.pre('save', async function(next) {
    const doc = this;
    
    // Only generate booking number if it doesn't exist
    if (!doc.bookingNumber) {
        try {
            // Find and update counter
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'bookingNumber' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            
            // Format booking number with leading zeros (e.g., BOOK-00001)
            doc.bookingNumber = `BOOK-${counter.seq.toString().padStart(5, '0')}`;
            next();
        } catch (error) {
            return next(error);
        }
    } else {
        next();
    }
});

module.exports = mongoose.model('WorkoutSchedule', workoutScheduleSchema);