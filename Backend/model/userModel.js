const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ["Trainer", "Client", "Admin"], default: "Client" }, 
  profilePicture: { type: String },
  isOtpVerified: { type: Boolean, default: false }, 
  fitnessGoal: { type: String },
  location: {
    type: String,
    // required: true
  },
  otp: {
    type: String,
    required: false,
  },
  
  
});

module.exports = mongoose.model("User", userSchema);
