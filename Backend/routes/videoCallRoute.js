// routes/videoCall.js
const router = require("express").Router();
const videoCallController = require("../controller/chatController/videoCallController");

// Initialize video call
router.post("/initiateCall", videoCallController.initiateVideoCall);

// Get call history for a user
router.get("/history/:id", videoCallController.getCallHistory);

// Update call status
router.put("/updateStatus", videoCallController.updateCallStatus);
// Screen sharing routes
router.post("/startScreenShare", videoCallController.startScreenShare);
router.post("/stopScreenShare", videoCallController.stopScreenShare);

module.exports = router;