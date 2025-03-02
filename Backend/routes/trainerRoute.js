const { getAllTrainers, deleteTrainer, updateOtpVerification, getCompleteProfiles, updateTrainerDetails, createOrUpdateTrainer, getTrainerDetails } = require("../controller/trainerController/trainerController");
const router = require("express").Router();
const { upload } = require("./../middleware/multerConfig");

// Existing routes
router.get("/getAllTrainers", getAllTrainers);
router.delete("/deleteTrainer/:id", deleteTrainer);

// New route to update OTP verification
router.patch("/updateOtpVerification/:id", updateOtpVerification);

// Endpoint to get full trainer profile by user ID
router.get("/details/:userId", getTrainerDetails);
router.post('/add/:userId', upload.single('coverPhoto'),createOrUpdateTrainer );
router.patch(
  '/trainer/:userId',
  
  (req, res, next) => {
    upload.fields([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'coverPhoto', maxCount: 1 }
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
