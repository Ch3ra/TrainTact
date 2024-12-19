const User = require("../../model/userModel");
const Trainer = require("../../model/trainerModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sendEmail = require("../../services/sendEmail");

// Helper function to generate OTP
const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

// Register Client 
exports.registerClient = async (req, res) => {
    const { email, password, username } = req.body;

    try {
        if (!email || !password || !username) {
            return res.status(400).json({ message: "Please provide all required information." });
        }

  
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            if (existingUser.isOtpVerified) {
                return res.status(400).json({ message: "Email is already registered and verified." });
            } else {
         
                const otp = generateOtp();
                existingUser.otp = otp;
                await existingUser.save();

                await sendEmail({
                    email: existingUser.email,
                    subject: "Verify Your Email",
                    message: `Your OTP for registration is: ${otp}`,
                });

                return res.status(200).json({ message: "OTP re-sent to your email." });
            }
        }

  
        const otp = generateOtp();
        const hashedPassword = bcrypt.hashSync(password, 10);

 
        await sendEmail({
            email,
            subject: "Verify Your Email",
            message: `Your OTP for registration is: ${otp}`,
        });


        const newUser = await User.create({
            userName: username,
            email,
            password: hashedPassword,
            role: "Client",
            otp,
        });

        res.status(200).json({ message: "Registration successful. Verify your email using the OTP sent to you." });
    } catch (error) {
        res.status(500).json({ message: "An error occurred during registration.", error: error.message });
    }
};



// Register Trainer
exports.registerTrainer = async (req, res) => {
    const { email, password, username, yearsOfExperience } = req.body;
    const resume = req.files?.resume?.[0]?.filename || null; // Handle resume upload
    const profilePicture = req.files?.profilePicture?.[0]?.filename || null; // Handle profile picture upload
  
    try {
      if (!email || !password || !username || !yearsOfExperience) {
        return res.status(400).json({ message: "Please provide all required information." });
      }
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already registered." });
      }
  
      const hashedPassword = bcrypt.hashSync(password, 10);
      const trainerUser = await User.create({
        userName: username,
        email,
        password: hashedPassword,
        role: "Trainer",
        profilePicture, 
      });
  
      await Trainer.create({
        user: trainerUser._id,
        yearsOfExperience,
        resume,
      });
  
      res.status(201).json({ message: "Trainer registered successfully." });
    } catch (error) {
      res.status(500).json({
        message: "An error occurred during trainer registration.",
        error: error.message,
      });
    }
  };


// Login User
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No user found with this email." });
        }


        if (user.role === "Client" && !user.isOtpVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in." });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password." });
        }

    
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.SECRET_KEY, { expiresIn: "30d" });

        res.status(200).json({ message: "Logged in successfully.", token });
    } catch (error) {
        res.status(500).json({ message: "Error logging in.", error: error.message });
    }
};


// Forgot Password (Request OTP)
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ message: "Please provide an email address." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No user found with this email." });
        }

        const otp = generateOtp();
        user.otp = otp;
        await user.save();

        await sendEmail({
            email: user.email,
            subject: "Password Reset OTP",
            message: `Your OTP is: ${otp}`,
        });

        res.status(200).json({ message: "OTP sent to your email." });
    } catch (error) {
        res.status(500).json({ message: "Error requesting password reset.", error: error.message });
    }
};

// Verify OTP for Registration and Generate Token
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({ message: "Please provide both email and OTP." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No user found with this email." });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP. Please try again." });
        }

       
        user.isOtpVerified = true;
        user.otp = null;
        await user.save();
      

      
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.SECRET_KEY,
            { expiresIn: "30d" }

        );

        res.status(200).json({
            message: "OTP verified successfully. You can now log in.",
            token, 
        });
    } catch (error) {
        res.status(500).json({ message: "Error verifying OTP.", error: error.message });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    const { email, newPassword, confirmPassword, otp } = req.body;

    try {
        if (!email || !newPassword || !confirmPassword || !otp) {
            return res.status(400).json({ message: "Please provide all required fields." });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No user found with this email." });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP. Please try again." });
        }

        user.password = bcrypt.hashSync(newPassword, 10);
        user.otp = null; 
        user.isOtpVerified = false; 
        await user.save();

        res.status(200).json({ message: "Password reset successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error resetting password.", error: error.message });
    }
};

// Resend OTP
exports.resendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ message: "Please provide an email address." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No user found with this email." });
        }

        if (user.isOtpVerified) {
            return res.status(400).json({ message: "This email is already verified." });
        }

       
        const otp = generateOtp();
        user.otp = otp;
        await user.save();

      
        await sendEmail({
            email: user.email,
            subject: "Resend OTP for Verification",
            message: `Your OTP for verification is: ${otp}`,
        });

        res.status(200).json({ message: "OTP has been resent to your email." });
    } catch (error) {
        res.status(500).json({ message: "Error resending OTP.", error: error.message });
    }
};