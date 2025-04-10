const express = require("express");
const router = express.Router();
const ratingController = require("../controller/rating/ratingController");

// Submit a rating
router.post("/submit", ratingController.submitRating);

// IMPORTANT: Place specific routes BEFORE parameter routes
// Get top rated trainers - this must come before /:ratingId
router.get("/top-trainers", ratingController.getTopRatedTrainers);

// Get ratings for a trainer
router.get("/trainer/:trainerId", ratingController.getTrainerRatings);

// Get ratings submitted by a client
router.get("/client/submitted", ratingController.getClientSubmittedRatings);

// Get rating for a specific workout
router.get("/workout/:workoutId", ratingController.getWorkoutRating);

// Check if a workout has been rated
router.get("/check/:workoutId", ratingController.checkWorkoutRated);

// Get completed workouts that need rating
router.get("/pending/client", ratingController.getCompletedWorkoutsNeedingRating);

// IMPORTANT: Place parameter routes AFTER specific routes
// Get a specific rating - this must come after all other specific routes
router.get("/:ratingId", ratingController.getRatingById);

module.exports = router;