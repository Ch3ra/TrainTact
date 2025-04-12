const express = require("express")
const {
  createSchedule,
  getClientBookings,
  getTrainerBookings,
  verifyBooking,
  deleteBooking,
  getClientCompletedBookings,
  getClientTrainers,
  getTrainerClients,
  updateBookingStatus,
  getBookingById,
  getAllBookings,
  getBookingProgress,
  cleanupCompletedSessions,
} = require("../controller/availabilityController/availabilityController")
const router = express.Router()

// Create workout schedule
router.post("/createSchedule", createSchedule)

// Get client bookings
router.get("/clientBookings/:id", getClientBookings)

// Get trainer bookings
router.get("/trainerBookings/:id", getTrainerBookings)

// Verify booking and create conversation
router.put("/verify/:bookingId", verifyBooking)

// Delete booking
router.delete("/delete/:bookingId", deleteBooking)

router.get("/client/completed/:id", getClientCompletedBookings)

// routes/availabilityRoutes.js

// Add these new routes to your existing router
router.get("/admin/bookings", getAllBookings)
router.get("/admin/bookings/:id", getBookingById)
router.put("/admin/bookings/:id/status", updateBookingStatus)

// Get booking progress data for charts
router.get("/booking-progress", getBookingProgress)

// Get all trainers for a specific client
router.get("/client/trainers/:id", getClientTrainers)

router.get("/trainer/clients/:id", getTrainerClients)

// Add cleanup route
router.post("/cleanup-completed", cleanupCompletedSessions);

module.exports = router

