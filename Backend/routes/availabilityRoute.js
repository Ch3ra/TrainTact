const express = require('express');
const { createSchedule, getClientBookings, getTrainerBookings, verifyBooking, deleteBooking, getClientCompletedBookings, getClientTrainers, getTrainerClients } = require('../controller/availabilityController/availabilityController');
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

router.get("/client/completed/:id", getClientCompletedBookings);



// Get all trainers for a specific client
router.get("/client/trainers/:id", getClientTrainers);


router.get("/trainer/clients/:id", getTrainerClients);

module.exports = router;