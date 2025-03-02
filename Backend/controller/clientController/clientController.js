const Client = require("../../model/clientModel");
const User = require("../../model/userModel")

exports.getClientDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "Client") {
      const clientDetails = await Client.findOne({ user: userId });
      if (!clientDetails) {
        return res.status(404).json({ message: "Client details not found" });
      }
      return res.status(200).json({ user, clientDetails });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user/client information:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createOrUpdateClientProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fitnessGoal, height, weight, fitnessLevel, location, description } = req.body;
    const profilePicture = req.files?.profilePicture?.[0]?.filename || null;

    if (!fitnessGoal || !height || !weight || !fitnessLevel || !location) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const validFitnessLevels = ["Beginner", "Intermediate", "Advanced"];
    if (!validFitnessLevels.includes(fitnessLevel)) {
      return res.status(400).json({
        message: "Invalid fitness level. Choose Beginner, Intermediate, or Advanced."
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (profilePicture) {
      user.profilePicture = `${process.env.IMAGE_URL}uploads/profilePictures/${profilePicture}`;
    }
    user.fitnessGoal = fitnessGoal;
    user.location = location;
    await user.save();

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
};

exports.updateClientProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userName, email, fitnessGoal, location, description, height, weight, fitnessLevel } = req.body;
    const profilePicture = req.files?.profilePicture?.[0]?.filename || null;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (userName) user.userName = userName;
    if (email) user.email = email;
    if (fitnessGoal) user.fitnessGoal = fitnessGoal;
    if (location) user.location = location;
    if (profilePicture) {
      user.profilePicture = `${process.env.IMAGE_URL}uploads/profilePictures/${profilePicture}`;
    }
    await user.save();

    if (user.role === "Client") {
      let client = await Client.findOne({ user: userId });
      if (client) {
        if (height) client.height = height;
        if (weight) client.weight = weight;
        if (fitnessLevel) client.fitnessLevel = fitnessLevel;
        if (description) client.description = description;
        await client.save();
      } else {
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
};