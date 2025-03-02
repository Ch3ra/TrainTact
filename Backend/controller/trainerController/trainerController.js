// Import required modules
const Trainer = require("../../model/trainerModel");
const User = require("../../model/userModel");
const mongoose = require("mongoose");
const sendEmail = require("../../services/sendEmail");

// Get all trainers (only pending trainers, i.e. isOtpVerified is false)
const getAllTrainers = async (req, res) => {
  try {
    const BASE_URL = `${process.env.BASE_URL || "http://localhost:3000"}/uploads/profilePictures/`;

    // Fetch all trainers and populate the 'user' field
    const trainers = await Trainer.find().populate("user");

    // Filter trainers where a user exists and OTP has not been verified
    const filteredTrainers = trainers.filter(
      (trainer) => trainer && trainer.user && !trainer.user.isOtpVerified
    );

    // Map through the filtered trainers to prepare data with absolute URLs for profile pictures
    const trainersData = filteredTrainers.map((trainer) => ({
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
      message: "Fetched all pending trainers successfully",
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



const getTrainerDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch trainer information including linked user details
    const trainer = await Trainer.findOne({ user: userId })
      .populate({
        path: 'user',
        select: '-password' // Exclude the password field
      });

    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    // Construct a detailed response object
    const response = {
      message: "Trainer profile fetched successfully.",
      trainer: {
        
        userName: trainer.user.userName,
        email: trainer.user.email,
        
        profilePicture: trainer.user.profilePicture,
        fitnessGoal: trainer.user.fitnessGoal,
        location: trainer.user.location,
        yearsOfExperience: trainer.yearsOfExperience,
        price: trainer.price,
        availabilityHours: trainer.availabilityHours,
        description: trainer.description,
        startDay: trainer.startDay,
        endDay: trainer.endDay,
        coverPhoto: trainer.coverPhoto,
        advancedNeeded: trainer.advancedNeeded 
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching trainer information:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const createOrUpdateTrainer = async (req, res) => {
  const { userId } = req.params;
  const {
      price, availabilityHours, description,
      fitnessGoal, location, startDay, endDay,
      advancedNeeded
  } = req.body;


  const coverPhoto = req.file ? req.file.filename : null;

  try {
      const user = await User.findById(userId);
      if (!user || user.role !== "Trainer") {
          return res.status(404).json({ message: "Trainer not found or user is not a trainer." });
      }

      let trainer = await Trainer.findOne({ user: userId });
      if (trainer) {
          trainer.price = price;
          trainer.availabilityHours = availabilityHours;
          trainer.description = description;
          trainer.startDay = startDay;
          trainer.endDay = endDay;
          trainer.advancedNeeded = advancedNeeded === 'true' || advancedNeeded === true;
          if (coverPhoto) trainer.coverPhoto = coverPhoto;
          await trainer.save();
      } else {
          trainer = await Trainer.create({
              user: userId,
              price,
              availabilityHours,
              description,
              startDay,
              endDay,
              coverPhoto,
              advancedNeeded: advancedNeeded === 'true' || advancedNeeded === true
          });
      }

      user.fitnessGoal = fitnessGoal;
      user.location = location;
      await user.save();

      res.status(200).json({
          message: "Trainer profile updated successfully",
          trainer,
          user
      });
  } catch (error) {
      console.error("Error updating trainer profile:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
  }
};



//yo banauna baki yesko multer ko jot xa haii!!
const updateTrainerDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      userName,
      email,
      fitnessGoal,
      location,
      yearsOfExperience,
      price,
      availabilityTime,
      description,
      availableDays,
      advancedNeeded
    } = req.body;

    // Log incoming data for debugging
    console.log("Body:", req.body);
    console.log("Files:", req.files);

    // Handle file uploads
    const coverPhoto = req.files?.coverPhoto?.[0]?.filename;
    const profilePicture = req.files?.profilePicture?.[0]?.filename;

    // Find user and validate
    const user = await User.findById(userId);
    if (!user || user.role !== "Trainer") {
      return res.status(404).json({ message: "Trainer not found." });
    }

    // Update user fields only if provided
    if (userName !== undefined) user.userName = userName;
    if (email !== undefined) user.email = email;
    if (fitnessGoal !== undefined) user.fitnessGoal = fitnessGoal;
    if (location !== undefined) user.location = location;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    await user.save();

    // Update or create trainer profile
    let trainer = await Trainer.findOne({ user: userId });
    if (!trainer) trainer = new Trainer({ user: userId });

    // Update trainer fields only if provided
    if (yearsOfExperience !== undefined) trainer.yearsOfExperience = yearsOfExperience;
    if (price !== undefined) trainer.price = price;
    if (availabilityTime !== undefined) trainer.availabilityTime = availabilityTime;
    if (description !== undefined) trainer.description = description;
    if (availableDays !== undefined) trainer.availableDays = availableDays;
    if (coverPhoto !== undefined) trainer.coverPhoto = coverPhoto;
    
    // Handle boolean conversion safely
    if (advancedNeeded !== undefined) {
      trainer.advancedNeeded = String(advancedNeeded).toLowerCase() === 'true';
    }

    await trainer.save();

    res.status(200).json({
      message: "Profile updated successfully",
      profile: {
        ...user.toObject(),
        ...trainer.toObject()
      }
    });

  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ 
      message: "Server error during update",
      error: error.message
    });
  }
};



//client Dash Trainer Showing
const getCompleteProfiles =async (req, res) => {
  try {
    const BASE_URL = `${process.env.BASE_URL || "http://localhost:3000"}/uploads/profilePictures/`;
    console.log("BASE_URL:", BASE_URL);

    // Fetch all trainers
    const trainers = await Trainer.find({}).populate({
      path: 'user',
      select: 'userName profilePicture fitnessGoal'
    });

    console.log("Raw Trainer Data:", trainers);

    // Filter trainers to include only those with a defined, non-empty fitnessGoal
    const completeTrainers = trainers.filter(trainer => 
      trainer.user &&
      trainer.user.fitnessGoal &&
      trainer.user.fitnessGoal.trim() !== ''
    );

    if (!completeTrainers.length) {
      console.log("No trainers with complete profiles found.");
      return res.status(404).json({ message: "No trainers with complete profiles found." });
    }

    const trainersData = completeTrainers.map(trainer => ({
      
      ID : trainer.user && trainer.user.id,
      username: trainer.user ? trainer.user.userName : 'No username',
      fitnessGoal: trainer.user ? trainer.user.fitnessGoal : 'No fitnessGoal',
      profilePicture: trainer.user && trainer.user.profilePicture
        ? (trainer.user.profilePicture.startsWith('http') 
            ? trainer.user.profilePicture 
            : BASE_URL + trainer.user.profilePicture)
        : BASE_URL + 'default.png',
    }));

    console.log("Fetched Trainers Data:", trainersData);
    res.status(200).json({
      success: true,
      message: "Fetched trainers with complete profiles successfully",
      data: trainersData,
    });
  } catch (error) {
    console.error("Error fetching trainers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trainers",
      error: error.message,
    });
  }
};


module.exports = { 
  getAllTrainers, 
  deleteTrainer, 
  updateOtpVerification,
  getTrainerDetails,
  createOrUpdateTrainer,
  updateTrainerDetails,
  getCompleteProfiles
};

