/**
 * Notification Helper Utility
 * Contains helper functions for notification-related operations
 */

const User = require("../model/userModel");
const WorkoutSchedule = require("../model/AvailabilityModel");

/**
 * Get user details for notification
 * @param {string} userId - The user ID to get details for
 * @returns {Promise<Object>} - User details object
 */
exports.getUserDetailsForNotification = async (userId) => {
  try {
    const user = await User.findById(userId).select("userName email userType profilePicture");
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    return user;
  } catch (error) {
    console.error("Error getting user details for notification:", error);
    throw error;
  }
};

/**
 * Get booking details for notification
 * @param {string} bookingId - The booking ID to get details for
 * @returns {Promise<Object>} - Booking details object
 */
exports.getBookingDetailsForNotification = async (bookingId) => {
  try {
    const booking = await WorkoutSchedule.findById(bookingId)
      .populate({
        path: "clientId",
        select: "userName email profilePicture",
        model: "User",
      })
      .populate({
        path: "trainerId",
        select: "userName email profilePicture",
        model: "User",
      });

    if (!booking) {
      throw new Error(`Booking not found with ID: ${bookingId}`);
    }

    return {
      id: booking._id,
      bookingNumber: booking.bookingNumber || `BK${booking._id.toString().slice(-5)}`,
      clientName: booking.clientId.userName,
      trainerName: booking.trainerId.userName,
      startDate: booking.startDate,
      startTime: booking.startTime,
      duration: booking.duration,
      status: booking.status,
      amount: booking.amount
    };
  } catch (error) {
    console.error("Error getting booking details for notification:", error);
    throw error;
  }
};

/**
 * Format date for notification
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
exports.formatDateForNotification = (date) => {
  if (!date) return "N/A";
  
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Date(date).toLocaleDateString('en-US', options);
};

/**
 * Generate notification message for new booking
 * @param {Object} bookingDetails - The booking details
 * @param {string} recipientType - The type of recipient (client, trainer, admin)
 * @returns {string} - Formatted notification message
 */
exports.generateNewBookingMessage = (bookingDetails, recipientType) => {
  const { clientName, trainerName, startDate, startTime, duration } = bookingDetails;
  const formattedDate = exports.formatDateForNotification(startDate);
  
  switch (recipientType) {
    case "client":
      return `Your booking with ${trainerName} has been created successfully. The session is scheduled for ${formattedDate} at ${startTime} for ${duration} minutes.`;
    
    case "trainer":
      return `New booking request from ${clientName}. The session is scheduled for ${formattedDate} at ${startTime} for ${duration} minutes.`;
    
    case "admin":
      return `New booking created: ${clientName} has booked a session with ${trainerName} for ${formattedDate} at ${startTime}.`;
    
    default:
      return `New booking created for ${formattedDate} at ${startTime}.`;
  }
};

/**
 * Generate notification message for booking response
 * @param {Object} bookingDetails - The booking details
 * @param {boolean} isAccepted - Whether the booking was accepted
 * @returns {string} - Formatted notification message
 */
exports.generateBookingResponseMessage = (bookingDetails, isAccepted) => {
  const { trainerName, startDate, startTime } = bookingDetails;
  const formattedDate = exports.formatDateForNotification(startDate);
  
  if (isAccepted) {
    return `Your booking with ${trainerName} for ${formattedDate} at ${startTime} has been accepted. You can now chat with your trainer.`;
  } else {
    return `Your booking with ${trainerName} for ${formattedDate} at ${startTime} has been declined.`;
  }
};

/**
 * Generate notification message for booking cancellation
 * @param {Object} bookingDetails - The booking details
 * @param {Object} canceller - The user who cancelled the booking
 * @param {string} recipientType - The type of recipient (client, trainer, admin)
 * @returns {string} - Formatted notification message
 */
exports.generateCancellationMessage = (bookingDetails, canceller, recipientType) => {
  const { clientName, trainerName, startDate, startTime } = bookingDetails;
  const formattedDate = exports.formatDateForNotification(startDate);
  const cancellationReason = bookingDetails.cancellationReason || "No reason provided";
  
  // Determine who cancelled
  const cancellerName = canceller.userName;
  const isClient = canceller.userType === "client";
  const isTrainer = canceller.userType === "trainer";
  const isAdmin = canceller.userType === "admin";
  
  switch (recipientType) {
    case "client":
      if (isTrainer) {
        return `Your booking for ${formattedDate} at ${startTime} has been cancelled by ${trainerName}. Reason: ${cancellationReason}`;
      } else if (isAdmin) {
        return `Your booking for ${formattedDate} at ${startTime} has been cancelled by the admin. Reason: ${cancellationReason}`;
      } else {
        return `Your booking for ${formattedDate} at ${startTime} has been cancelled.`;
      }
    
    case "trainer":
      if (isClient) {
        return `The booking with ${clientName} for ${formattedDate} at ${startTime} has been cancelled by the client. Reason: ${cancellationReason}`;
      } else if (isAdmin) {
        return `The booking with ${clientName} for ${formattedDate} at ${startTime} has been cancelled by the admin. Reason: ${cancellationReason}`;
      } else {
        return `Your booking with ${clientName} for ${formattedDate} at ${startTime} has been cancelled.`;
      }
    
    case "admin":
      if (isClient) {
        return `Booking cancelled by client ${clientName} for session with ${trainerName} on ${formattedDate} at ${startTime}. Reason: ${cancellationReason}`;
      } else if (isTrainer) {
        return `Booking cancelled by trainer ${trainerName} for session with ${clientName} on ${formattedDate} at ${startTime}. Reason: ${cancellationReason}`;
      } else {
        return `Booking between ${clientName} and ${trainerName} for ${formattedDate} at ${startTime} has been cancelled.`;
      }
    
    default:
      return `Booking for ${formattedDate} at ${startTime} has been cancelled by ${cancellerName}.`;
  }
};

/**
 * Generate notification message for trainer approval
 * @param {Object} trainerDetails - The trainer details
 * @param {boolean} isApproved - Whether the trainer was approved
 * @returns {string} - Formatted notification message
 */
exports.generateTrainerApprovalMessage = (trainerDetails, isApproved) => {
  const { userName } = trainerDetails;
  
  if (isApproved) {
    return `Your trainer account has been approved. You can now receive booking requests from clients.`;
  } else {
    return `Your trainer account application has been declined. Please contact support for more information.`;
  }
};

/**
 * Generate notification message for new trainer request
 * @param {Object} trainerDetails - The trainer details
 * @returns {string} - Formatted notification message
 */
exports.generateNewTrainerRequestMessage = (trainerDetails) => {
  const { userName } = trainerDetails;
  
  return `New trainer approval request from ${userName}. Please review their application.`;
};

/**
 * Generate notification title based on notification type
 * @param {string} type - The notification type
 * @param {Object} details - Additional details for context
 * @returns {string} - Formatted notification title
 */
exports.generateNotificationTitle = (type, details = {}) => {
  switch (type) {
    case "new_booking":
      return "New Booking Request";
    
    case "booking_accepted":
      return "Booking Accepted";
    
    case "booking_declined":
      return "Booking Declined";
    
    case "booking_cancelled":
      return "Booking Cancelled";
    
    case "trainer_approved":
      return "Trainer Account Approved";
    
    case "trainer_declined":
      return "Trainer Account Declined";
    
    case "new_trainer_request":
      return "New Trainer Approval Request";
    
    case "payment_received":
      return "Payment Received";
    
    case "payment_failed":
      return "Payment Failed";
    
    case "session_reminder":
      return "Upcoming Session Reminder";
    
    case "system":
      return details.title || "System Notification";
    
    default:
      return "Notification";
  }
};

/**
 * Get admin users for notifications
 * @returns {Promise<Array>} - Array of admin user IDs
 */
exports.getAdminUsersForNotifications = async () => {
  try {
    const admins = await User.find({ userType: "admin" }).select("_id");
    return admins.map(admin => admin._id);
  } catch (error) {
    console.error("Error getting admin users for notifications:", error);
    return [];
  }
};

/**
 * Determine if a notification should be sent as an email
 * @param {string} type - The notification type
 * @returns {boolean} - Whether to send as email
 */
exports.shouldSendAsEmail = (type) => {
  // List of notification types that should also be sent as emails
  const emailNotificationTypes = [
    "booking_accepted",
    "booking_declined",
    "booking_cancelled",
    "trainer_approved",
    "trainer_declined",
    "payment_received",
    "payment_failed"
  ];
  
  return emailNotificationTypes.includes(type);
};

/**
 * Format notification data for frontend
 * @param {Object} notification - The notification object
 * @returns {Object} - Formatted notification
 */
exports.formatNotificationForFrontend = (notification) => {
  return {
    id: notification._id,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt,
    type: notification.type,
    relatedSchedule: notification.relatedSchedule,
    sender: notification.sender,
    actionUrl: notification.actionUrl || null
  };
};