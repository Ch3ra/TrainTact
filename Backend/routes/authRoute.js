const {
    registerClient,
    registerTrainer,
    loginUser,
    forgotPassword,
    verifyOtp,
    resetPassword,
    resendOtp,
    googleLogin
} = require("../controller/auth/authController");

const router = require("express").Router();
const { multer, storage } = require("./../middleware/multerConfig");

const upload = multer({ storage });

// Routes for registration
router.post("/register-client", registerClient);
router.post(
    "/register-trainer",
    upload.fields([
      { name: "resume", maxCount: 1 }, // Handle resume uploads
      { name: "profilePicture", maxCount: 1 }, // Handle profile picture uploads
    ]),
    registerTrainer
  );

// Other authentication routes
router.post("/login", loginUser);
router.post("/forgotPassword", forgotPassword);
router.post("/verifyOtp", verifyOtp);
router.post("/resetPassword", resetPassword);
router.post("/resendOtp", resendOtp);
router.post("/googleLogin",googleLogin)
module.exports = router;
