const { 
  getAllTrainers, 
  deleteTrainer, 
  updateOtpVerification, 
  getCompleteProfiles, 
  updateTrainerDetails, 
  createOrUpdateTrainer, 
  getTrainerDetails, 
  getVerifiedTrainers 
} = require("../controller/trainerController/trainerController");

const router = require("express").Router();
const { upload } = require("./../middleware/multerConfig");

// Existing routes
router.get("/getAllTrainers", getAllTrainers);
router.delete("/deleteTrainer/:id", deleteTrainer);

// New route to update OTP verification
router.patch("/updateOtpVerification/:id", updateOtpVerification);
router.get("/getVerifiedTrainers", getVerifiedTrainers);

// Endpoint to get full trainer profile by user ID
router.get("/details/:userId", getTrainerDetails);

// Modified to handle resume uploads
router.post(
  '/add/:userId', 
  (req, res, next) => {
    console.log("Original request body before multer:", req.body);
    upload.fields([
      { name: 'coverPhoto', maxCount: 1 },
      { name: 'resume', maxCount: 1 } // Add resume field to upload
    ])(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ 
          success: false, 
          message: err.message.includes('Unexpected field') 
            ? 'Invalid file field detected' 
            : err.message 
        });
      }
      console.log("Request body after multer:", req.body);
      console.log("Files after multer:", req.files);
      next();
    });
  },
  createOrUpdateTrainer
);

// Modified to handle resume uploads
router.patch(
  '/trainer/:userId',
  (req, res, next) => {
    upload.fields([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'coverPhoto', maxCount: 1 },
      { name: 'resume', maxCount: 1 } // Add resume field to upload
    ])(req, res, (err) => {
      if (err) {
        // Handle specific Multer errors
        const message = err.message.includes('Unexpected field') 
          ? 'Invalid file field detected' 
          : err.message;
        return res.status(400).json({ success: false, message });
      }
      next();
    });
  },
  updateTrainerDetails
);

router.get('/completeProfiles', getCompleteProfiles);

module.exports = router;