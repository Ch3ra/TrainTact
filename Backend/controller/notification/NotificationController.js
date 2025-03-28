const Notification = require("../../model/NotificationModel")
const User = require("../../model/userModel")
const { io } = require("../../app") // Changed from app to server

// Enhanced socket user management
const getActiveUserSockets = (userId) => {
  // Find all sockets for a user (supports multiple devices)
  return Array.from(io.sockets.sockets.values())
    .filter((socket) => socket.handshake.query.userId === userId)
    .map((socket) => socket.id)
}

// Create a new notification
exports.createNotification = async (data) => {
  try {
    const { recipient, sender, type, title, message, relatedSchedule } = data

    console.log("Creating notification:", { recipient, sender, type, title })

    // Validate recipient and sender exist
    const [recipientExists, senderExists] = await Promise.all([User.findById(recipient), User.findById(sender)])

    if (!recipientExists || !senderExists) {
      console.error("Recipient or sender not found")
      return null
    }

    const notification = new Notification({
      recipient,
      sender,
      type,
      title,
      message,
      relatedSchedule,
      read: false,
    })

    const savedNotification = await notification.save()
    console.log("Notification saved successfully:", savedNotification._id)

    // Get all active sockets for this user
    const recipientSockets = getActiveUserSockets(recipient)

    if (recipientSockets.length > 0) {
      // Emit to all user's devices
      recipientSockets.forEach((socketId) => {
        console.log(`Emitting notification to socket: ${socketId}`)
        io.to(socketId).emit("newNotification", savedNotification)
        // Also emit with the other event name for backward compatibility
        io.to(socketId).emit("getNotification", savedNotification)
      })
      console.log(`Notification emitted to ${recipientSockets.length} devices`)
    } else {
      // If recipient is not connected, we'll just save the notification
      // They'll see it when they log in next time
      console.log(`User ${recipient} is not connected to socket`)
    }

    return savedNotification
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}

// Get notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.params.userId

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .populate("sender", "userName profilePicture")
      .populate("relatedSchedule")
      .limit(50)

    res.status(200).json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
}

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId

    const notification = await Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true })

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    res.status(200).json(notification)
  } catch (error) {
    console.error("Error marking notification as read:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
}

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.params.userId

    const result = await Notification.updateMany({ recipient: userId, read: false }, { read: true })

    res.status(200).json({
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
}

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.notificationId

    const notification = await Notification.findByIdAndDelete(notificationId)

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    res.status(200).json({ message: "Notification deleted successfully" })
  } catch (error) {
    console.error("Error deleting notification:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
}

// Clear all notifications for a user
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.params.userId

    const result = await Notification.deleteMany({ recipient: userId })

    res.status(200).json({
      message: `Deleted ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    console.error("Error clearing notifications:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
}

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.params.userId

    const count = await Notification.countDocuments({
      recipient: userId,
      read: false,
    })

    res.status(200).json({ count })
  } catch (error) {
    console.error("Error getting unread count:", error)
    res.status(500).json({ message: "Server error: " + error.message })
  }
}

