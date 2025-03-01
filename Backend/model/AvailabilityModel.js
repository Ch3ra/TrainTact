const mongoose = require('mongoose');

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
    paymentStatus:{
        type:Boolean,
        default:false
    },
    amount:{
        type:Number,
        default:0,
    }
    
});

module.exports = mongoose.model('WorkoutSchedule', workoutScheduleSchema);
