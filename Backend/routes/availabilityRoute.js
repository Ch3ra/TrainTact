const express = require('express');
const { createSchedule, getClientBookings, getTrainerBookings, verifyBooking, deleteBooking } = require('../controller/availabilityController/availabilityController');
const router = express.Router();

// Create workout schedule
router.post('/createSchedule', createSchedule);

// Get client bookings
router.get('/clientBookings/:id', getClientBookings);

// Get trainer bookings
router.get("/trainerBookings/:id", getTrainerBookings);

// Verify booking and create conversation
router.put("/verify/:bookingId", verifyBooking);

// Delete booking
router.delete("/delete/:bookingId", deleteBooking);

module.exports = router;