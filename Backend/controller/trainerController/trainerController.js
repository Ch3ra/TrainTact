// Import required modules
const Trainer = require("../../model/trainerModel");
const User = require("../../model/userModel");
const mongoose = require("mongoose");
const sendEmail = require("../../services/sendEmail");

// Get all trainers
const getAllTrainers = async (req, res) => {
  try {
    const BASE_URL = `${process.env.BASE_URL || "http://localhost:3000"}/uploads/profilePictures/`;

    // Fetch all trainers and populate the 'user' field
    const trainers = await Trainer.find().populate("user");

    // Map through trainers to prepare data with absolute URLs for profile pictures
    const trainersData = trainers
      .filter((trainer) => trainer && trainer.user)
      .map((trainer) => ({
        ...trainer._doc,
        user: {
          ...trainer.user._doc,
          profilePicture: trainer.user.profilePicture
            ? `${BASE_URL}${trainer.user.profilePicture}`
            : `${BASE_URL}default.png`, // Fallback to default image if profile picture is not available
        },
      }));

    res.status(200).json({
      success: true,
      message: "Fetched all trainers successfully",
      data: trainersData,
    });
  } catch (error) {
    console.error("Error fetching trainers:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trainers",
      error: error.message,
    });
  }
};

// Delete a trainer by ID
const deleteTrainer = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // Attempt to find and delete the trainer by ID
    const deletedTrainer = await Trainer.findOneAndDelete({ _id: id });

    if (!deletedTrainer) {
      console.log("No trainer found with the given ID");
      return res.status(404).json({
        success: false,
        message: "Trainer not found",
      });
    }

    // Delete the associated user if it exists
    if (deletedTrainer.user) {
      const deletedUser = await User.findByIdAndDelete(deletedTrainer.user);

      // Send rejection email
      await sendEmail({
        email: deletedUser.email,
        subject: "Traintact Registration Declined",
        message: `Dear ${deletedUser.userName},

We regret to inform you that your registration with Traintact has been declined. Unfortunately, you do not meet the criteria to be a part of our trainer network.

Thank you for your interest in Traintact.

Best regards,
Traintact Team`,
      });
      console.log("Associated user deleted:", deletedUser);
    }

    res.status(200).json({
      success: true,
      message: "Trainer and associated user deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting trainer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete trainer",
      error: error.message,
    });
  }
};

// Update OTP verification status
// Update OTP verification status
const updateOtpVerification = async (req, res) => {
  try {
    const { id } = req.params; // This should be the User ID
    const { isVerified } = req.body; // Ensure this is passed from the frontend

    console.log("Request to update OTP Verification:", { id, isVerified });

    // Validate the User ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID format",
      });
    }

    // Find the user and update `isOtpVerified` field
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isOtpVerified: isVerified },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      console.log("User not found with ID:", id);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("User updated successfully:", updatedUser);

    // Send appropriate email based on verification status
    if (isVerified) {
      await sendEmail({
        email: updatedUser.email,
        subject: "Welcome to Traintact!",
        message: `Dear ${updatedUser.userName},
        
Congratulations! Your account has been successfully verified. You can now log in to your Traintact account and explore our platform.

We’re thrilled to have you onboard!

Best regards,  
Traintact Team`,
      });
    }

    res.status(200).json({
      success: true,
      message: "User OTP verification updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating OTP verification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update OTP verification",
      error: error.message,
    });
  }
};

module.exports = { getAllTrainers, deleteTrainer, updateOtpVerification };
