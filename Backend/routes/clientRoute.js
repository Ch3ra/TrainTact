const express = require("express");
const router = express.Router();
const { upload } = require("../middleware/multerConfig");
const { 
  getClientDetails, 
  createOrUpdateClientProfile, 
  updateClientProfile,
  getAllClientUsers,
  getClientStats,
  updateOtpVerification,
  getClientRegistrationProgress
} = require("../controller/clientController/clientController");

// Get all client users
router.get("/getAllUsers", getAllClientUsers);

// Get client statistics
router.get("/stats", getClientStats);

// Get client registration progress data for charts
router.get("/registration-progress", getClientRegistrationProgress);

// Get client/user information by ID
router.get("/:userId", getClientDetails);

// Create or update client profile
router.post(
  "/:userId",
  upload.fields([{ name: "profilePicture", maxCount: 1 }]),
  createOrUpdateClientProfile
);
router.patch("/updateOtpVerification/:userId", updateOtpVerification)

// Update client profile
router.put(
  "/:userId",
  upload.fields([{ name: "profilePicture", maxCount: 1 }]),
  updateClientProfile
);

module.exports = router;
