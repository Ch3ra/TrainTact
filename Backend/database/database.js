const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../model/userModel');

exports.connectDatabase = async () => {
  try {
    // Connect to the MongoDB database
    await mongoose.connect(process.env.Mongo_URI);
    console.log("Database is connected!");

    // Check if admin exists
    const isAdminExist = await User.findOne({ email: "Alish@gmail.com" });
    
    if (!isAdminExist) {

      const hashedPassword = bcrypt.hashSync("111111", 10); 

      // Create admin with profile picture and updated fields
      await User.create({
        email: "Alish@gmail.com", 
        userName: "Ch3RaY",
        password: hashedPassword, 
        role: "Admin",
        isOtpVerified: true,
        profilePicture: "http://localhost:3000/uploads/profilePictures/default-admin.jpg" // Default profile picture path
      });

      console.log("Admin user created successfully!");
    } else {
      // Update existing admin if needed
      const updatedAdmin = await User.findOneAndUpdate(
        { email: "Alish@gmail.com" },
        { 
          userName: "Ch3RaY",
          
        },
        { new: true }
      );
      
      console.log("Admin Already Exists and Updated!");
    }
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};