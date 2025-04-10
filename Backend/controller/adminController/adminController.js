const User = require("../../model/userModel");
const Trainer = require("../../model/trainerModel");
const notificationController = require("../notification/NotificationController");
const WorkoutSchedule = require("../../model/AvailabilityModel")

// Approve or reject a trainer
exports.approveTrainer = async (req, res) => {
  try {
    const { trainerId, approved } = req.body;
    const adminId = req.user._id; // Assuming you have authentication middleware
    
    // Find the trainer user
    const trainer = await Trainer.findOne({ user: trainerId });
    
    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }
    
    // Update trainer status
    trainer.status = approved ? "approved" : "rejected";
    await trainer.save();
    
    // Update user status if needed
    await User.findByIdAndUpdate(
      trainerId,
      { isActive: approved }
    );
    
    // Send notification to trainer
    await notificationController.notifyTrainerApprovalStatus(
      trainerId,
      approved,
      adminId
    );
    
    // Send email notification if needed
    // Your email sending logic here...
    
    res.status(200).json({
      success: true,
      message: `Trainer ${approved ? 'approved' : 'rejected'} successfully`,
      data: trainer
    });
  } catch (error) {
    console.error("Error approving/rejecting trainer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve/reject trainer",
      error: error.message
    });
  }
};

// Get all trainers pending approval
exports.getPendingTrainers = async (req, res) => {
  try {
    const pendingTrainers = await Trainer.find({ status: "pending" })
      .populate({
        path: "user",
        select: "userName email profilePicture age",
        model: "User"
      });
    
    res.status(200).json({
      success: true,
      count: pendingTrainers.length,
      data: pendingTrainers
    });
  } catch (error) {
    console.error("Error fetching pending trainers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending trainers",
      error: error.message
    });
  }
};

exports.getRecentSessions = async (req, res) => {
  try {
    // Get query parameters with defaults
    const limit = Number.parseInt(req.query.limit) || 3

    // Find recent workout schedules
    // Sort by startDate (upcoming first) and then by most recently created
    const sessions = await WorkoutSchedule.find({
      // You might want to filter by specific status if needed
      // status: { $in: ["completed", "upcoming", "cancelled"] },
    })
      .sort({ startDate: 1, createdAt: -1 })
      .limit(limit)
      .populate("clientId", "userName profilePicture email")
      .populate("trainerId", "userName profilePicture email")
      .lean()

    // Format the response data
    const formattedSessions = sessions.map((session) => {
      // Determine session status based on dates
      const now = new Date()
      const sessionDate = new Date(session.startDate)
      let status = "upcoming"

      if (session.status === "cancelled") {
        status = "cancelled"
      } else if (sessionDate < now) {
        status = "completed"
      }

      // Determine session type (video call or in-person)
      const sessionType = session.sessionType || "Video Call"

      return {
        id: session._id,
        bookingNumber: session.bookingNumber,
        date: session.startDate,
        client: {
          id: session.clientId._id,
          name: session.clientId.userName,
          profilePicture: session.clientId.profilePicture,
          email: session.clientId.email,
          initials: session.clientId.userName ? session.clientId.userName.substring(0, 2).toUpperCase() : "CL",
        },
        trainer: {
          id: session.trainerId._id,
          name: session.trainerId.userName,
          profilePicture: session.trainerId.profilePicture,
          email: session.trainerId.email,
          initials: session.trainerId.userName ? session.trainerId.userName.substring(0, 2).toUpperCase() : "TR",
        },
        duration: session.duration || 45,
        status: status,
        sessionType: sessionType,
        paymentStatus: session.paymentStatus,
      }
    })

    res.status(200).json({
      success: true,
      data: formattedSessions,
    })
  } catch (error) {
    console.error("Error fetching recent sessions:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent sessions",
      error: error.message,
    })
  }
}



exports.getAdminInfo = async (req, res) => {
  try {
    // Find the admin user - no auth check needed, anyone can access this endpoint
    const admin = await User.findOne({ email: "Alish@gmail.com" });
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }
    
    // Return the admin information (excluding sensitive data)
    return res.status(200).json({
      success: true,
      admin: {
        _id: admin._id,
        userName: admin.userName,
        email: admin.email,
        role: admin.role,
        isOtpVerified: admin.isOtpVerified,
        profilePicture: admin.profilePicture
      }
    });
  } catch (error) {
    console.error("Error fetching admin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Controller to update admin profile
exports.updateAdminProfile = async (req, res) => {
  try {
    const { userName } = req.body;
    
    // Create the update object
    const updateData = {
      userName: userName || "Ch3RaY"
    };
    
    // Add profile picture from file upload if present
    if (req.file && req.file.fieldname === "profilePicture") {
      // Use the proper path based on your server configuration
      updateData.profilePicture = `${req.protocol}://${req.get('host')}/uploads/profilePictures/${req.file.filename}`;
    }
    
    // Find and update the admin
    const updatedAdmin = await User.findOneAndUpdate(
      { email: "Alish@gmail.com", role: "Admin" },
      updateData,
      { new: true, select: '-password -otp' } // Exclude sensitive fields
    );
    
    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      admin: updatedAdmin
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
