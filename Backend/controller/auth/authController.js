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
  
      // Send email notification
      try {
        await sendEmail({
          email: email,
          subject: "Your Registration is Under Review",
          message: `Dear ${username},
  
  Thank you for registering with us as a trainer. Your application is currently under review by our Admin team.
  
  You will receive an email notification once the review process is completed, indicating whether your registration has been accepted or declined.
  
  If you have any questions in the meantime, feel free to reach out to us.
  
  Best regards,
  Your App Name Team
  `,
        });
        console.log("Email sent successfully!");
      } catch (emailError) {
        console.error("Error sending email:", emailError.message);
      }
  
      // Continue existing logic
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

        // Deny access to any panel if OTP is not verified
        if (!user.isOtpVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in." });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password." });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.SECRET_KEY,
            { expiresIn: "30d" }
        );
     
        // Redirect based on role
        let redirectUrl;
        if (user.role === "Admin") {
            redirectUrl = "/adminDash";
        } else if (user.role === "Trainer") {
            redirectUrl = "/trainerDash";
        } else if (user.role === "Client") {
            redirectUrl = "/clientDash";
        } else {
            return res.status(400).json({ message: "Invalid user role." });
        }

        res.status(200).json({
            message: "Logged in successfully.",
            token,
            role: user.role,
            redirectUrl, 
        });
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

        // Check if OTP exists in the database
        if (!user.otp) {
            return res.status(400).json({ message: "OTP not generated or expired. Please request a new OTP." });
        }

        // Compare OTPs as strings
        if (user.otp !== otp.toString()) {
            return res.status(400).json({ message: "Invalid OTP. Please try again." });
        }

        // Mark OTP as verified and clear it
        user.isOtpVerified = true;
        user.otp = null; // Clear the OTP after successful verification
        await user.save();

        // Determine the redirect URL based on the user's role
        let redirectUrl;
        if (user.role === "Admin") {
            redirectUrl = "/adminDash";
        } else if (user.role === "Trainer") {
            redirectUrl = "/trainerDash";
        } else if (user.role === "Client") {
            redirectUrl = "/clientDash";
        } else {
            return res.status(400).json({ message: "Invalid user role." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.SECRET_KEY,
            { expiresIn: "30d" }
        );

        res.status(200).json({
            message: "OTP verified successfully.",
            token,
            redirectUrl, // Include redirect URL in the response
        });
    } catch (error) {
        res.status(500).json({ message: "Error verifying OTP.", error: error.message });
    }
};


// Reset Password
exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body; // Accept only email and newPassword

    try {
        // Check if required fields are provided
        if (!email || !newPassword) {
            return res.status(400).json({ message: "Please provide both email and newPassword." });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No user found with this email." });
        }

        // Reset the password
        user.password = bcrypt.hashSync(newPassword, 10); // Securely hash the new password
        user.otp = null; // Clear any residual OTPs
        await user.save();

        res.status(200).json({ message: "Password reset successfully." });
    } catch (error) {
        console.error("Error resetting password:", error);
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

    exports.googleLogin = async (req, res) => {
        try {
            console.log(req.body);
            const { name: userName, email } = req.body;
    
            const existingUser = await User.findOne({ email });
    console.log("existing yser", existingUser);
            if (!existingUser) {
                const newUser = await User.create({
                    userName,
                    email,
                    role: "Client",
                    isOtpVerified: true,
                    otp: true // You might want to generate or handle OTP verification differently
                });
    
                const token = jwt.sign(
                    { id: newUser._id, role: newUser.role },
                    process.env.SECRET_KEY,
                    { expiresIn: "30d" }
                );
    
              console.log("new user", newUser);
                
                res.status(200).json({
                    message: "Logged in successfully.",
                    token,
                    role: newUser.role,
                   
                });
            } else {
              
                const token = jwt.sign(
                    { id: existingUser._id, role: existingUser.role },
                    process.env.SECRET_KEY,
                    { expiresIn: "30d" }
                );
    
              
    
                res.status(200).json({
                    message: "User already exists. Logging in.",
                    token,
                    role: existingUser.role,
                  
                });
            }
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({
                message: "Failed to login due to server error."
            });
        }
    };
    