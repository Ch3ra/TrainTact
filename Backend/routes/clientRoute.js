const express = require("express");
const router = express.Router();
const { upload } = require("./../middleware/multerConfig");
const { getClientDetails, createOrUpdateClientProfile, updateClientProfile } = require("../controller/clientController/clientController");

// Get client/user information by ID
router.get("/:userId", getClientDetails);

// Create or update client profile
router.post(
  "/:userId",
  upload.fields([{ name: "profilePicture", maxCount: 1 }]),
  createOrUpdateClientProfile
);

// Update client profile
router.put(
  "/:userId",
  upload.fields([{ name: "profilePicture", maxCount: 1 }]),
  updateClientProfile
);

module.exports = router;