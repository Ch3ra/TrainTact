const express = require("express");
const router = express.Router();
const ratingController = require("../controller/rating/ratingController");

// Submit a rating
router.post("/submit", ratingController.submitRating);

// Get ratings for a trainer
router.get("/trainer/:trainerId", ratingController.getTrainerRatings);

// Get ratings submitted by a client
router.get("/client/submitted",  ratingController.getClientSubmittedRatings);

// Get a specific rating
router.get("/:ratingId", ratingController.getRatingById);

// Get rating for a specific workout
router.get("/workout/:workoutId", ratingController.getWorkoutRating);

// Check if a workout has been rated
router.get("/check/:workoutId", ratingController.checkWorkoutRated);

// Get completed workouts that need rating
router.get("/pending/client", ratingController.getCompletedWorkoutsNeedingRating);

module.exports = router;