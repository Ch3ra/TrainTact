const mongoose = require('mongoose');
const User = require('../model/userModel');

exports.connectDatabase = async () => {
  try {
    // Connect to the MongoDB database
    await mongoose.connect(process.env.Mongo_URI);
    console.log("Database is connected!");

    // Check if the admin user already exists
    const isAdminExist = await User.findOne({ email: "admin@gmail.com" });
    if (!isAdminExist) {
      // Create the admin user if not found
      await User.create({
        email: "admin@gmail.com",
        userName: "Ch3Ray", 
        password: "12345678",  // Consider hashing the password
        role: "Admin",
      });

      console.log("Admin user created successfully!");
    } else {
      console.log("Admin Already Seeded!");
    }
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};
