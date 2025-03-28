const express = require("express")
const router = express.Router()
const notificationController = require("../controller/notification/NotificationController")


// Get all notifications for a user
router.get("/:userId", notificationController.getNotifications)

// Get unread notification count
router.get("/unread/:userId", notificationController.getUnreadCount)

// Mark a notification as read
router.put("/read/:notificationId",notificationController.markAsRead)

// Mark all notifications as read
router.put("/read-all/:userId",  notificationController.markAllAsRead)

// Delete a notification
router.delete("/:notificationId", notificationController.deleteNotification)

// Clear all notifications for a user
router.delete("/clear/:userId",  notificationController.clearAllNotifications)

module.exports = router

