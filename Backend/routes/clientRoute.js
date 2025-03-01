const express = require("express");
const router = express.Router();
const Client = require("../model/clientModel");
const User = require("../model/userModel");
const { upload } = require("./../middleware/multerConfig"); 

// Get client/user information by ID
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
console.log("this is userid",userId);
    // Fetch user information
    const user = await User.findById(userId); 
    console.log(user)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If the role is Client, fetch additional client details
    if (user.role === "Client") {
      const clientDetails = await Client.findOne({ user: userId });
      if (!clientDetails) {
        return res.status(404).json({ message: "Client details not found" });
      }
      return res.status(200).json({ user, clientDetails });
    }

    // If the user is not a client, return only user details
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user/client information:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/:userId",
  upload.fields([{ name: "profilePicture", maxCount: 1 }]), // Handles profile picture upload
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { fitnessGoal, height, weight, fitnessLevel, location, description } = req.body;
      const profilePicture = req.files?.profilePicture?.[0]?.filename || null;

      // Validate required fields
      if (!fitnessGoal || !height || !weight || !fitnessLevel || !location) {
        return res.status(400).json({ message: "All fields are required." });
      }

      // Validate fitnessLevel
      const validFitnessLevels = ["Beginner", "Intermediate", "Advanced"];
      if (!validFitnessLevels.includes(fitnessLevel)) {
        return res
          .status(400)
          .json({ message: "Invalid fitness level. Choose Beginner, Intermediate, or Advanced." });
      }

      // Fetch the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Update the user's profile picture, fitness goal, and location
      if (profilePicture) user.profilePicture = process.env.IMAGE_URL+"uploads/profilePictures/"+profilePicture;
      user.fitnessGoal = fitnessGoal;
      user.location = location;
      await user.save();

      // If the user is a client, update or create client details
      if (user.role === "Client") {
        let client = await Client.findOne({ user: userId });
        if (client) {
          client.height = height;
          client.weight = weight;
          client.fitnessLevel = fitnessLevel;
          client.description = description;
          await client.save();
        } else {
          await Client.create({
            user: userId,
            height,
            weight,
            fitnessLevel,
            description,
          });
        }
      }

      res.status(200).json({
        message: "Profile updated successfully.",
        user,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Internal server error.", error: error.message });
    }
  }
);


// API to edit client/user profile
router.put("/:userId", upload.fields([{ name: "profilePicture", maxCount: 1 }]), async (req, res) => {
  console.log(req.body)
  try {
    const { userId } = req.params;
    const { userName, email, fitnessGoal, location, description, height, weight, fitnessLevel } = req.body;
    const profilePicture = req.files?.profilePicture?.[0]?.filename || null;

    // Fetch the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update user details
    if (userName) user.userName = userName;
    if (email) user.email = email;
    if (fitnessGoal) user.fitnessGoal = fitnessGoal;
    if (location) user.location = location;
    if (profilePicture) user.profilePicture = process.env.IMAGE_URL + "uploads/profilePictures/" + profilePicture;
    
    await user.save();

    // If the user is a client, update or create client details
    if (user.role === "Client") {
      let client = await Client.findOne({ user: userId });
      if (client) {
        if (height) client.height = height;
        if (weight) client.weight = weight;
        if (fitnessLevel) client.fitnessLevel = fitnessLevel;
        if (description) client.description = description;
        await client.save();
      } else {
        // Create new client details if none exist
        await Client.create({
          user: userId,
          height,
          weight,
          fitnessLevel,
          description
        });
      }
    }

    res.status(200).json({
      message: "Profile updated successfully.",
      userData: {
        userName: user.userName,
        email: user.email,
        fitnessGoal: user.fitnessGoal,
        location: user.location,
        profilePicture: user.profilePicture,
        clientDetails: user.role === "Client" ? { height, weight, fitnessLevel, description } : undefined
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});






module.exports = router;
