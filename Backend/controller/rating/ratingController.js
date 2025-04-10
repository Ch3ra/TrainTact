  const Rating = require("../../model/ratingModel");
  const WorkoutSchedule = require("../../model/AvailabilityModel");
  const User = require("../../model/userModel");
  const notificationController = require("../notification/NotificationController");
  const mongoose = require("mongoose");

  // Submit a rating and feedback
  exports.submitRating = async (req, res) => {
    try {
      const { workoutId, rating, feedback, clientId } = req.body;
      
      // Use clientId from request body if req.user is not available
      const userId = req.user ? req.user.id : clientId;

      if (!userId) {
        return res.status(400).json({ message: "Client ID is required." });
      }

      // Validate input
      if (!workoutId || !rating || !feedback) {
        return res.status(400).json({ message: "Please provide all required fields." });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5." });
      }

      // Check if workout exists and is completed
      const workout = await WorkoutSchedule.findById(workoutId);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found." });
      }

      if (workout.status !== "completed") {
        return res.status(400).json({ 
          message: "You can only rate completed workouts.",
          status: workout.status
        });
      }

      // Verify the client is the one who participated in the workout
      if (workout.clientId.toString() !== userId) {
        return res.status(403).json({ message: "You can only rate workouts you participated in." });
      }

      // Check if rating already exists
      const existingRating = await Rating.findOne({ workoutId });
      if (existingRating) {
        return res.status(400).json({ message: "You have already rated this workout." });
      }

      // Create the rating
      const newRating = new Rating({
        workoutId,
        clientId: userId,
        trainerId: workout.trainerId,
        rating,
        feedback
      });

      const savedRating = await newRating.save();

      // Get client and trainer details for notification
      const [client, trainer] = await Promise.all([
        User.findById(userId),
        User.findById(workout.trainerId)
      ]);

      // Create notification for trainer about the new rating
      if (client && trainer) {
        try {
          const notificationData = {
            recipient: workout.trainerId,
            sender: userId,
            type: "system", // Changed from "new_rating" to "system"
            title: "New Rating Received",
            message: `${client.userName} has rated your training session with ${rating} stars and left feedback.`,
            relatedSchedule: workout._id
          };

          await notificationController.createNotification(notificationData);
          console.log("Rating notification created successfully");
        } catch (error) {
          console.error("Error creating rating notification:", error);
          // Continue with the response even if notification fails
        }
      }

      res.status(201).json({
        message: "Rating submitted successfully.",
        rating: savedRating
      });
    } catch (error) {
      console.error("Error submitting rating:", error);
      res.status(500).json({ message: "Server error: " + error.message });
    }
  };

  // In the getTrainerRatings function
  exports.getTrainerRatings = async (req, res) => {
    try {
      const { trainerId } = req.params;
      
      // Validate trainerId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        return res.status(400).json({ message: "Invalid trainer ID format" });
      }

      const ratings = await Rating.find({ trainerId })
        .populate({
          path: "clientId",
          select: "userName profilePicture",
          model: "User"
        })
        .populate({
          path: "workoutId",
          select: "startDate endDate",
          model: "WorkoutSchedule"
        })
        .sort({ createdAt: -1 });

      // Calculate average rating
      let averageRating = 0;
      if (ratings.length > 0) {
        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        averageRating = sum / ratings.length;
      }

      res.status(200).json({
        ratings,
        count: ratings.length,
        averageRating
      });
    } catch (error) {
      console.error("Error fetching trainer ratings:", error);
      res.status(500).json({ message: "Server error: " + error.message });
    }
  };

  // Get ratings submitted by a client
  exports.getClientSubmittedRatings = async (req, res) => {
    try {
      const { clientId } = req.query;
      const userId = req.user ? req.user.id : clientId;

      if (!userId) {
        return res.status(400).json({ message: "Client ID is required." });
      }

      const ratings = await Rating.find({ clientId: userId })
        .populate({
          path: "trainerId",
          select: "userName profilePicture",
          model: "User"
        })
        .populate({
          path: "workoutId",
          select: "startDate endDate",
          model: "WorkoutSchedule"
        })
        .sort({ createdAt: -1 });

      res.status(200).json({
        ratings,
        count: ratings.length
      });
    } catch (error) {
      console.error("Error fetching client submitted ratings:", error);
      res.status(500).json({ message: "Server error: " + error.message });
    }
  };

  // Get a specific rating
  exports.getRatingById = async (req, res) => {
    try {
      const { ratingId } = req.params;

      const rating = await Rating.findById(ratingId)
        .populate({
          path: "clientId",
          select: "userName profilePicture",
          model: "User"
        })
        .populate({
          path: "trainerId",
          select: "userName profilePicture",
          model: "User"
        })
        .populate({
          path: "workoutId",
          select: "startDate endDate",
          model: "WorkoutSchedule"
        });

      if (!rating) {
        return res.status(404).json({ message: "Rating not found." });
      }

      res.status(200).json(rating);
    } catch (error) {
      console.error("Error fetching rating:", error);
      res.status(500).json({ message: "Server error: " + error.message });
    }
  };

  // Get ratings for a specific workout
  exports.getWorkoutRating = async (req, res) => {
    try {
      const { workoutId } = req.params;

      const rating = await Rating.findOne({ workoutId })
        .populate({
          path: "clientId",
          select: "userName profilePicture",
          model: "User"
        });

      if (!rating) {
        return res.status(404).json({ message: "No rating found for this workout." });
      }

      res.status(200).json(rating);
    } catch (error) {
      console.error("Error fetching workout rating:", error);
      res.status(500).json({ message: "Server error: " + error.message });
    }
  };

  // Check if a workout has been rated
  exports.checkWorkoutRated = async (req, res) => {
    try {
      const { workoutId } = req.params;

      const rating = await Rating.findOne({ workoutId });
      
      res.status(200).json({
        isRated: !!rating,
        rating: rating
      });
    } catch (error) {
      console.error("Error checking workout rating:", error);
      res.status(500).json({ message: "Server error: " + error.message });
    }
  };

  // Get completed workouts that need rating
  exports.getCompletedWorkoutsNeedingRating = async (req, res) => {
    try {
      const { clientId } = req.query;
      const userId = req.user ? req.user.id : clientId;

      if (!userId) {
        return res.status(400).json({ message: "Client ID is required." });
      }

      // Find completed workouts for this client
      const completedWorkouts = await WorkoutSchedule.find({
        clientId: userId,
        status: "completed"
      }).populate({
        path: "trainerId",
        select: "userName profilePicture",
        model: "User"
      });

      if (completedWorkouts.length === 0) {
        return res.status(200).json({
          workouts: [],
          message: "No completed workouts found."
        });
      }

      // Get workoutIds
      const workoutIds = completedWorkouts.map(workout => workout._id);

      // Find which ones have ratings
      const existingRatings = await Rating.find({
        workoutId: { $in: workoutIds }
      });

      const ratedWorkoutIds = existingRatings.map(rating => 
        rating.workoutId.toString()
      );

      // Filter out workouts that already have ratings
      const unratedWorkouts = completedWorkouts.filter(
        workout => !ratedWorkoutIds.includes(workout._id.toString())
      );

      res.status(200).json({
        workouts: unratedWorkouts,
        count: unratedWorkouts.length
      });
    } catch (error) {
      console.error("Error fetching unrated workouts:", error);
      res.status(500).json({ message: "Server error: " + error.message });
    }
  };


  // Add this new function to your existing ratingController.js file

// Get top rated trainers
exports.getTopRatedTrainers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3; // Default to 3 trainers
    
    // Aggregate to calculate average rating for each trainer
    const topTrainers = await Rating.aggregate([
      // Group by trainerId and calculate average rating
      {
        $group: {
          _id: "$trainerId",
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 }
        }
      },
      // Only include trainers with at least 1 rating
      {
        $match: {
          totalRatings: { $gte: 1 }
        }
      },
      // Sort by average rating (highest first)
      {
        $sort: { averageRating: -1 }
      },
      // Limit to requested number of trainers
      {
        $limit: limit
      }
    ]);

    // If no trainers found with ratings
    if (topTrainers.length === 0) {
      return res.status(200).json({
        trainers: [],
        message: "No rated trainers found."
      });
    }

    // Get trainer IDs
    const trainerIds = topTrainers.map(trainer => trainer._id);

    // Fetch trainer details
    const trainerDetails = await User.find(
      { _id: { $in: trainerIds }, role: "Trainer" },
      { userName: 1, profilePicture: 1 }
    );

    // Fetch trainer profiles
    const trainerProfiles = await mongoose.model("Trainer").find(
      { user: { $in: trainerIds } },
      { description: 1, user: 1 }
    );

    // Combine data
    const result = topTrainers.map(trainer => {
      const userDetails = trainerDetails.find(
        user => user._id.toString() === trainer._id.toString()
      );
      
      const profile = trainerProfiles.find(
        profile => profile.user && profile.user.toString() === trainer._id.toString()
      );

      return {
        trainerId: trainer._id,
        name: userDetails ? userDetails.userName : "Unknown Trainer",
        profilePicture: userDetails ? userDetails.profilePicture : null,
        description: profile ? profile.description : "",
        averageRating: parseFloat(trainer.averageRating.toFixed(1)),
        totalRatings: trainer.totalRatings
      };
    });

    res.status(200).json({
      trainers: result
    });
  } catch (error) {
    console.error("Error fetching top rated trainers:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};