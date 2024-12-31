const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcrypt for hashing
const User = require('../model/userModel');

exports.connectDatabase = async () => {
  try {
    // Connect to the MongoDB database
    await mongoose.connect(process.env.Mongo_URI);
    console.log("Database is connected!");

    
    const isAdminExist = await User.findOne({ email: "admin@gmail.com" });
    if (!isAdminExist) {
      
      const hashedPassword = bcrypt.hashSync("12345678", 10); 

      
      await User.create({
        email: "admin@gmail.com", 
        userName: "Ch3Ray",
        password: hashedPassword, 
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
