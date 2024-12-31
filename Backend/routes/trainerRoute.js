const { getAllTrainers, deleteTrainer, updateOtpVerification } = require("../controller/trainerController/trainerController");
const router = require("express").Router();

// Existing routes
router.get("/getAllTrainers", getAllTrainers);
router.delete("/deleteTrainer/:id", deleteTrainer);

// New route to update OTP verification
router.patch("/updateOtpVerification/:id", updateOtpVerification);

module.exports = router;
