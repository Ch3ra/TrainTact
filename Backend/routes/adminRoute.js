const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController/adminController");
const activityController = require("../controller/adminController/activityController");
const { upload } = require("../middleware/multerConfig");




// Trainer approval routes
router.get("/trainers/pending", adminController.getPendingTrainers);
router.post("/trainers/approve", adminController.approveTrainer);
// All routes require authentication and admin authorization
router.get('/activity/recent', activityController.getAllRecentActivity);
router.get('/bookings/recent', activityController.getRecentBookings);
router.get('/notifications/recent', activityController.getRecentNotifications);
router.get('/users/recent', activityController.getRecentUsers);
router.get('/trainers/recent', activityController.getRecentTrainers);
router.get('/ratings/recent', activityController.getRecentRatings);

// Get recent transactions (admin only)
router.get("/recentTransaction", activityController.getRecentTransactions)

// Get transactions for a specific user
router.get("/user/:userId/:role", activityController.getUserTransactions)

// Get transaction statistics (admin only)
router.get("/stats", activityController.getTransactionStats)
router.get("/recentSessions",  adminController.getRecentSessions)


router.get('/admin/info', adminController.getAdminInfo);


router.put(
  '/admin/profile', 

  upload.single('profilePicture'), 
  adminController.updateAdminProfile
);


module.exports = router;