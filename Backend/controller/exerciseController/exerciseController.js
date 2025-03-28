const Exercise = require("../../model/exerciseModel");
const Trainer = require("../../model/trainerModel");
const User = require("../../model/userModel"); // Add this import
const { exerciseUpload } = require("../../middleware/multerConfig");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Middleware for handling file uploads
const handleExerciseUpload = exerciseUpload.fields([
  { name: "cardPhoto", maxCount: 1 },
  { name: "backgroundVideo", maxCount: 1 },
]);

// Create a new exercise
const createExercise = async (req, res) => {
  try {
    // Parse JSON data if it's sent as a string (for FormData)
    if (req.body.days && typeof req.body.days === "string") {
      req.body.days = JSON.parse(req.body.days);
    }

    // Check for trainer ID in different possible field names
    const userId = req.body.trainerId || req.body.trainer;

    console.log("Request body:", req.body);
    console.log("User ID being used:", userId);

    if (!userId) {
      // Remove uploaded files if user ID is missing
      if (req.files) {
        Object.values(req.files).forEach((fileArray) => {
          fileArray.forEach((file) => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // First, verify the user exists and has 'Trainer' role
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid user ID format");
      // Remove uploaded files
      if (req.files) {
        Object.values(req.files).forEach((fileArray) => {
          fileArray.forEach((file) => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    // Find the user first
    const user = await User.findById(userId);
    console.log("User query result:", user);

    if (!user) {
      console.error("User not found in database");
      // Remove uploaded files
      if (req.files) {
        Object.values(req.files).forEach((fileArray) => {
          fileArray.forEach((file) => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify user has trainer role
    if (user.role !== "Trainer") {
      console.error("User is not a trainer");
      // Remove uploaded files
      if (req.files) {
        Object.values(req.files).forEach((fileArray) => {
          fileArray.forEach((file) => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }
      return res.status(403).json({ success: false, message: "User is not a trainer" });
    }

    // Find trainer record associated with this user
    const trainer = await Trainer.findOne({ user: userId });
    console.log("Trainer query result:", trainer);

    if (!trainer) {
      console.error("Trainer profile not found for this user");
      // Create a basic trainer profile if it doesn't exist
      const newTrainer = new Trainer({
        user: userId,
        description: "Trainer profile automatically created",
        price: 0,
        yearsOfExperience: 0
      });
      
      const savedTrainer = await newTrainer.save();
      console.log("Created new trainer profile:", savedTrainer);
      
      // Use this new trainer for the exercise
      trainerId = savedTrainer._id;
    } else {
      trainerId = trainer._id;
    }

    // Check if card photo was uploaded
    if (!req.files || !req.files.cardPhoto) {
      return res.status(400).json({
        success: false,
        message: "Card photo is required",
      });
    }

    const { exerciseGoal } = req.body;
    
    // Process days, ensuring it has the correct structure
    let parsedDays = [];
    if (req.body.days && Array.isArray(req.body.days)) {
      parsedDays = req.body.days.map((day, index) => {
        return {
          dayNumber: day.dayNumber || index + 1,
          activities: day.activities || (day.exercises ? JSON.stringify(day.exercises) : "")
        };
      });
    }

    // Get file paths
    const cardPhotoPath = req.files.cardPhoto[0].path.replace(/\\/g, "/");
    let backgroundVideoPath = null;

    if (req.files.backgroundVideo && req.files.backgroundVideo.length > 0) {
      backgroundVideoPath = req.files.backgroundVideo[0].path.replace(/\\/g, "/");
    }

    // Create exercise object
    const exercise = new Exercise({
      trainer: trainerId, // Use the trainer ID we found or created
      exerciseGoal,
      days: parsedDays,
      cardPhoto: cardPhotoPath,
      backgroundVideo: backgroundVideoPath,
    });

    const savedExercise = await exercise.save();

    res.status(201).json({
      success: true,
      data: savedExercise,
    });
  } catch (error) {
    console.error("Error creating exercise:", error);

    // Clean up any uploaded files if there's an error
    if (req.files) {
      Object.values(req.files).forEach((fileArray) => {
        fileArray.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all exercises
const getExercises = async (req, res) => {
  try {
    const { trainerId, userId } = req.query;

    const query = {};
    
    // Filter by trainer ID
    if (trainerId) {
      query.trainer = trainerId;
    }
    
    // Filter by user ID (finding the trainer first)
    if (userId) {
      const trainer = await Trainer.findOne({ user: userId });
      if (trainer) {
        query.trainer = trainer._id;
      } else {
        // Return empty result if no trainer found for this user
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
    }

    const exercises = await Exercise.find(query).populate({
      path: "trainer",
      populate: {
        path: "user",
        select: "userName email profilePicture"
      }
    });

    res.status(200).json({
      success: true,
      count: exercises.length,
      data: exercises,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get exercise by ID
const getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id).populate({
      path: "trainer",
      populate: {
        path: "user",
        select: "userName email profilePicture"
      }
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found",
      });
    }

    res.status(200).json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update exercise
const updateExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      // Remove uploaded files if exercise not found
      if (req.files) {
        Object.values(req.files).forEach((fileArray) => {
          fileArray.forEach((file) => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }
      return res.status(404).json({
        success: false,
        message: "Exercise not found",
      });
    }

    // Parse JSON data if it's sent as a string (for FormData)
    if (req.body.days && typeof req.body.days === "string") {
      req.body.days = JSON.parse(req.body.days);
    }

    const { exerciseGoal, days, isActive } = req.body;

    // Update fields if provided
    if (exerciseGoal) exercise.exerciseGoal = exerciseGoal;
    
    // Process days, ensuring it has the correct structure
    if (days && Array.isArray(days)) {
      exercise.days = days.map((day, index) => {
        return {
          dayNumber: day.dayNumber || index + 1,
          activities: day.activities || (day.exercises ? JSON.stringify(day.exercises) : "")
        };
      });
    }
    
    if (isActive !== undefined) exercise.isActive = isActive;

    // Handle file updates
    if (req.files) {
      // Update card photo if provided
      if (req.files.cardPhoto && req.files.cardPhoto.length > 0) {
        // Delete old file if it exists
        if (exercise.cardPhoto && fs.existsSync(exercise.cardPhoto)) {
          fs.unlinkSync(exercise.cardPhoto);
        }
        exercise.cardPhoto = req.files.cardPhoto[0].path.replace(/\\/g, "/");
      }

      // Update background video if provided
      if (req.files.backgroundVideo && req.files.backgroundVideo.length > 0) {
        // Delete old file if it exists
        if (exercise.backgroundVideo && fs.existsSync(exercise.backgroundVideo)) {
          fs.unlinkSync(exercise.backgroundVideo);
        }
        exercise.backgroundVideo = req.files.backgroundVideo[0].path.replace(/\\/g, "/");
      }
    }

    const updatedExercise = await exercise.save();

    res.status(200).json({
      success: true,
      data: updatedExercise,
    });
  } catch (error) {
    // Clean up any uploaded files if there's an error
    if (req.files) {
      Object.values(req.files).forEach((fileArray) => {
        fileArray.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete exercise
const deleteExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found",
      });
    }

    // Delete associated files
    if (exercise.cardPhoto && fs.existsSync(exercise.cardPhoto)) {
      fs.unlinkSync(exercise.cardPhoto);
    }

    if (exercise.backgroundVideo && fs.existsSync(exercise.backgroundVideo)) {
      fs.unlinkSync(exercise.backgroundVideo);
    }

    await exercise.deleteOne();

    res.status(200).json({
      success: true,
      message: "Exercise deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Export all functions properly
module.exports = {
  handleExerciseUpload,
  createExercise,
  getExercises,
  getExerciseById,
  updateExercise,
  deleteExercise,
};