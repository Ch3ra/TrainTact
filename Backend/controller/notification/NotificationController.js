const Notification = require("../../model/NotificationModel")
const User = require("../../model/userModel")
const { io } = require("../../app")

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

    // Validate recipient exists
    const recipientExists = await User.findById(recipient)
    if (!recipientExists) {
      console.error("Recipient not found")
      return null
    }

    // Sender can be null for system notifications
    let senderExists = true
    if (sender) {
      senderExists = await User.findById(sender)
      if (!senderExists) {
        console.error("Sender not found")
        return null
      }
    }

    const notification = new Notification({
      recipient,
      sender: sender || null, // Allow null sender for system notifications
      type,
      title,
      message,
      relatedSchedule,
      read: false,
    })

    const savedNotification = await notification.save()
    console.log("Notification saved successfully:", savedNotification._id)

    // Get all active sockets for this user
    const recipientSockets = getActiveUserSockets(recipient.toString())

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

// Send notification to all admins
exports.notifyAdmins = async (data) => {
  try {
    const { title, message, type, sender, relatedSchedule } = data

    // Find all admin users
    const admins = await User.find({ role: "Admin" })

    if (!admins || admins.length === 0) {
      console.log("No admin users found")
      return []
    }

    console.log(`Found ${admins.length} admin users to notify`)

    // Create notifications for each admin
    const notifications = []

    for (const admin of admins) {
      const notificationData = {
        recipient: admin._id,
        sender: sender || null,
        type: type || "system",
        title,
        message,
        relatedSchedule: relatedSchedule || null,
      }

      const notification = await exports.createNotification(notificationData)
      if (notification) {
        notifications.push(notification)
      }
    }

    return notifications
  } catch (error) {
    console.error("Error notifying admins:", error)
    return []
  }
}

// Notification for new trainer registration
exports.notifyNewTrainerRegistration = async (trainerId, trainerName) => {
  try {
    // Get trainer details if needed
    const trainer = await User.findById(trainerId).select("userName email profilePicture")

    // Create a detailed message with trainer information
    const message = `${trainerName || trainer.userName} has registered as a trainer and is awaiting approval. Please review their application in the trainer requests section.`

    // Create a notification for all admins
    const notifications = await exports.notifyAdmins({
      title: "New Trainer Registration",
      message: message,
      type: "trainer_request",
      sender: trainerId,
      // Add actionUrl if you have a specific page for trainer approvals
      actionUrl: "/admin/trainer-requests",
    })

    console.log(`Sent ${notifications.length} notifications to admins about new trainer registration`)
    return notifications
  } catch (error) {
    console.error("Error notifying about new trainer:", error)
    return []
  }
}

// Notification for trainer approval/rejection
exports.notifyTrainerApprovalStatus = async (trainerId, isApproved, adminId) => {
  try {
    const trainer = await User.findById(trainerId)
    if (!trainer) {
      console.error("Trainer not found")
      return null
    }

    const status = isApproved ? "approved" : "rejected"

    return await exports.createNotification({
      recipient: trainerId,
      sender: adminId,
      type: "system",
      title: `Registration ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: isApproved
        ? "Congratulations! Your trainer registration has been approved. You can now start accepting bookings."
        : "Your trainer registration has been rejected. Please contact support for more information.",
    })
  } catch (error) {
    console.error("Error notifying trainer about approval status:", error)
    return null
  }
}

// Notification for client booking a trainer
exports.notifyNewBooking = async (bookingId, clientId, trainerId) => {
  try {
    const [client, trainer] = await Promise.all([User.findById(clientId), User.findById(trainerId)])

    if (!client || !trainer) {
      console.error("Client or trainer not found")
      return null
    }

    // 1. Notify trainer about new booking
    const trainerNotification = await exports.createNotification({
      recipient: trainerId,
      sender: clientId,
      type: "schedule_request",
      title: "New Training Request",
      message: `${client.userName} has requested to book a training session with you.`,
      relatedSchedule: bookingId,
    })

    // 2. Notify admins about new booking
    await exports.notifyAdmins({
      title: "New Booking Created",
      message: `${client.userName} has booked a session with trainer ${trainer.userName}.`,
      type: "system",
      sender: clientId,
      relatedSchedule: bookingId,
    })

    return trainerNotification
  } catch (error) {
    console.error("Error notifying about new booking:", error)
    return null
  }
}

// Notification for trainer accepting/rejecting a booking
exports.notifyBookingResponse = async (bookingId, clientId, trainerId, isAccepted) => {
  try {
    const [client, trainer] = await Promise.all([User.findById(clientId), User.findById(trainerId)])

    if (!client || !trainer) {
      console.error("Client or trainer not found")
      return null
    }

    const status = isAccepted ? "accepted" : "rejected"
    const type = isAccepted ? "schedule_accepted" : "schedule_cancelled"

    // 1. Notify client about booking response
    const clientNotification = await exports.createNotification({
      recipient: clientId,
      sender: trainerId,
      type: type,
      title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: isAccepted
        ? `${trainer.userName} has accepted your training request. Your session is confirmed!`
        : `${trainer.userName} has declined your training request. Please try booking with another trainer.`,
      relatedSchedule: bookingId,
    })

    // 2. Notify admins about booking response
    await exports.notifyAdmins({
      title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Trainer ${trainer.userName} has ${status} a booking from ${client.userName}.`,
      type: "system",
      sender: trainerId,
      relatedSchedule: bookingId,
    })

    return clientNotification
  } catch (error) {
    console.error("Error notifying about booking response:", error)
    return null
  }
}

// Notification for booking cancellation
exports.notifyBookingCancellation = async (bookingId, cancelledBy, otherUserId) => {
  try {
    const [canceller, otherUser] = await Promise.all([User.findById(cancelledBy), User.findById(otherUserId)])

    if (!canceller || !otherUser) {
      console.error("Users not found")
      return null
    }

    // Determine roles
    const isCancellerClient = canceller.role === "Client"
    const recipientRole = isCancellerClient ? "trainer" : "client"

    // 1. Notify the other party about cancellation
    const notification = await exports.createNotification({
      recipient: otherUserId,
      sender: cancelledBy,
      type: "schedule_cancelled",
      title: "Booking Cancelled",
      message: `${canceller.userName} has cancelled the training session.`,
      relatedSchedule: bookingId,
    })

    // 2. Notify admins about cancellation
    await exports.notifyAdmins({
      title: "Booking Cancelled",
      message: `${canceller.role} ${canceller.userName} has cancelled a booking with ${recipientRole} ${otherUser.userName}.`,
      type: "system",
      sender: cancelledBy,
      relatedSchedule: bookingId,
    })

    return notification
  } catch (error) {
    console.error("Error notifying about booking cancellation:", error)
    return null
  }
}

// Notification for new rating
exports.notifyNewRating = async (clientId, trainerId, rating, comment) => {
  try {
    const [client, trainer] = await Promise.all([User.findById(clientId), User.findById(trainerId)])

    if (!client || !trainer) {
      console.error("Client or trainer not found")
      return null
    }

    // Notify trainer about new rating
    return await exports.createNotification({
      recipient: trainerId,
      sender: clientId,
      type: "new_rating",
      title: "New Rating Received",
      message: `${client.userName} has given you a ${rating}-star rating${comment ? ": " + comment : ""}.`,
    })
  } catch (error) {
    console.error("Error notifying about new rating:", error)
    return null
  }
}

