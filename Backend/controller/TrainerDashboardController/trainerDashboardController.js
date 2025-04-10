const mongoose = require("mongoose")
const WorkoutSchedule = require("../../model/AvailabilityModel")
const User = require("../../model/userModel")
const Client = require("../../model/clientModel")
const Rating = require("../../model/ratingModel")
const Notification = require("../../model/NotificationModel")

// Import Notification model with error handling
// let Notification
// try {
//   Notification = require("../../model/notificationModel")
//   console.log("Notification model loaded successfully")
// } catch (error) {
//   console.error("Error loading Notification model:", error.message)
//   // Create a fallback notification function to prevent crashes
//   Notification = () => {
//     console.warn("Using fallback Notification - real model failed to load")
//     return {
//       save: () => Promise.resolve({ _id: "fallback-notification" }),
//     }
//   }
// }

/**
 * Get dashboard overview statistics for a trainer
 * @param {Object} req - Request object containing trainerId in params
 * @param {Object} res - Response object
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const trainerId = req.params.trainerId

    if (!mongoose.Types.ObjectId.isValid(trainerId)) {
      return res.status(400).json({ success: false, message: "Invalid trainer ID" })
    }

    // Get current date and start of month
    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    // Get counts for different session statuses
    const upcomingSessions = await WorkoutSchedule.countDocuments({
      trainerId: trainerId, // Use string ID directly
      status: "upcoming",
    })

    const completedSessions = await WorkoutSchedule.countDocuments({
      trainerId: trainerId, // Use string ID directly
      status: "completed",
    })

    const cancelledSessions = await WorkoutSchedule.countDocuments({
      trainerId: trainerId, // Use string ID directly
      status: "cancelled",
    })

    // Get total clients (unique clients from workout schedules)
    const totalClients = await WorkoutSchedule.distinct("clientId", {
      trainerId: trainerId, // Use string ID directly
    }).then((clients) => clients.length)

    // Get average rating
    const averageRating = await Rating.aggregate([
      { $match: { trainerId: new mongoose.Types.ObjectId(trainerId) } }, // Use new keyword
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]).then((result) => (result.length > 0 ? Number.parseFloat(result[0].avgRating.toFixed(1)) : 0))

    // Return the dashboard overview data
    res.status(200).json({
      success: true,
      data: {
        upcomingSessions,
        completedSessions,
        cancelledSessions,
        totalClients,
        averageRating,
      },
    })
  } catch (error) {
    console.error("Error in getDashboardOverview:", error)
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching dashboard overview",
      error: error.message,
    })
  }
}

/**
 * Get earnings overview for a trainer
 * @param {Object} req - Request object containing trainerId in params
 * @param {Object} res - Response object
 */
exports.getEarningsOverview = async (req, res) => {
  try {
    const trainerId = req.params.trainerId

    if (!mongoose.Types.ObjectId.isValid(trainerId)) {
      return res.status(400).json({ success: false, message: "Invalid trainer ID" })
    }

    // Get current date and start of year
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()

    // Calculate total collections (paid amount)
    const totalCollections = await WorkoutSchedule.aggregate([
      {
        $match: {
          trainerId: new mongoose.Types.ObjectId(trainerId), // Use new keyword
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]).then((result) => (result.length > 0 ? result[0].total : 0))

    // Calculate pending collections
    const pendingCollections = await WorkoutSchedule.aggregate([
      {
        $match: {
          trainerId: new mongoose.Types.ObjectId(trainerId), // Use new keyword
          paymentStatus: "pending",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]).then((result) => (result.length > 0 ? result[0].total : 0))

    // Get monthly earnings for the current year (both paid and pending)
    const monthlyPaidEarnings = await WorkoutSchedule.aggregate([
      {
        $match: {
          trainerId: new mongoose.Types.ObjectId(trainerId),
          paymentStatus: "paid",
          startDate: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$startDate" } },
          earnings: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id.month": 1 },
      },
    ])

    const monthlyPendingEarnings = await WorkoutSchedule.aggregate([
      {
        $match: {
          trainerId: new mongoose.Types.ObjectId(trainerId),
          paymentStatus: "pending",
          startDate: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$startDate" } },
          pending: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id.month": 1 },
      },
    ])

    // Format monthly earnings for chart
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const paidChartData = Array(12).fill(0)
    const pendingChartData = Array(12).fill(0)

    monthlyPaidEarnings.forEach((item) => {
      paidChartData[item._id.month - 1] = item.earnings
    })

    monthlyPendingEarnings.forEach((item) => {
      pendingChartData[item._id.month - 1] = item.pending
    })

    const formattedChartData = months.map((month, index) => ({
      month,
      earnings: paidChartData[index],
      pending: pendingChartData[index],
    }))

    // Return the earnings overview data
    res.status(200).json({
      success: true,
      data: {
        totalCollections,
        pendingCollections,
        totalEarnings: totalCollections + pendingCollections,
        monthlyEarnings: formattedChartData,
      },
    })
  } catch (error) {
    console.error("Error in getEarningsOverview:", error)
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching earnings overview",
      error: error.message,
    })
  }
}

/**
 * Get session types distribution based on client fitness goals
 * @param {Object} req - Request object containing trainerId in params
 * @param {Object} res - Response object
 */
exports.getSessionTypes = async (req, res) => {
  try {
    const trainerId = req.params.trainerId

    if (!mongoose.Types.ObjectId.isValid(trainerId)) {
      return res.status(400).json({ success: false, message: "Invalid trainer ID" })
    }

    // Get all clients who have had sessions with this trainer
    const clientIds = await WorkoutSchedule.distinct("clientId", {
      trainerId: trainerId, // Use string ID directly
    })

    // Find all these clients to get their fitness levels
    const clients = await Client.find({
      user: { $in: clientIds },
    }).select("user fitnessLevel")

    // Map client userId to their fitness level
    const fitnessLevelMap = {}
    clients.forEach((client) => {
      fitnessLevelMap[client.user.toString()] = client.fitnessLevel
    })

    // Count sessions by fitness level
    const sessionsData = await WorkoutSchedule.aggregate([
      {
        $match: {
          trainerId: new mongoose.Types.ObjectId(trainerId), // Use new keyword
          clientId: { $in: clientIds.map((id) => new mongoose.Types.ObjectId(id)) }, // Use new keyword
        },
      },
      {
        $group: {
          _id: "$clientId",
          sessionCount: { $sum: 1 },
        },
      },
    ])

    // Categorize sessions by fitness level
    const fitnessCounts = {
      Beginner: 0,
      Intermediate: 0,
      Advanced: 0,
    }

    for (const session of sessionsData) {
      const clientId = session._id.toString()
      const fitnessLevel = fitnessLevelMap[clientId]

      if (fitnessLevel) {
        fitnessCounts[fitnessLevel] += session.sessionCount
      }
    }

    // Format the data for chart
    const chartData = Object.keys(fitnessCounts).map((level) => ({
      name: level,
      value: fitnessCounts[level],
    }))

    // Return the session types data
    res.status(200).json({
      success: true,
      data: chartData,
    })
  } catch (error) {
    console.error("Error in getSessionTypes:", error)
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching session types",
      error: error.message,
    })
  }
}

/**
 * Get recent sessions for a trainer
 * @param {Object} req - Request object containing trainerId in params
 * @param {Object} res - Response object
 */
exports.getRecentSessions = async (req, res) => {
  try {
    const trainerId = req.params.trainerId
    const limit = Number.parseInt(req.query.limit) || 5

    if (!mongoose.Types.ObjectId.isValid(trainerId)) {
      return res.status(400).json({ success: false, message: "Invalid trainer ID" })
    }

    // Get recent sessions with client details
    const recentSessions = await WorkoutSchedule.find({
      trainerId: trainerId, // Use string ID directly
    })
      .sort({ startDate: -1 })
      .limit(limit)
      .populate({
        path: "clientId",
        select: "userName profilePicture",
      })

    // Format the session data
    const formattedSessions = recentSessions.map((session) => ({
      sessionId: session._id,
      bookingNumber: session.bookingNumber,
      clientName: session.clientId.userName,
      clientPhoto: session.clientId.profilePicture,
      date: session.startDate,
      startTime: session.startTime,
      duration: session.duration,
      status: session.status,
      amount: session.amount,
      paymentStatus: session.paymentStatus,
    }))

    // Return the recent sessions data
    res.status(200).json({
      success: true,
      data: formattedSessions,
    })
  } catch (error) {
    console.error("Error in getRecentSessions:", error)
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching recent sessions",
      error: error.message,
    })
  }
}

/**
 * Get booking statistics for a trainer
 * @param {Object} req - Request object containing trainerId in params
 * @param {Object} res - Response object
 */
exports.getBookingStats = async (req, res) => {
  try {
    const trainerId = req.params.trainerId

    if (!mongoose.Types.ObjectId.isValid(trainerId)) {
      return res.status(400).json({ success: false, message: "Invalid trainer ID" })
    }

    // Get current date for time range calculations
    const currentDate = new Date()
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    // Get daily stats for the current week
    const dailyStats = await WorkoutSchedule.aggregate([
      {
        $match: {
          trainerId: new mongoose.Types.ObjectId(trainerId), // Use new keyword
          startDate: {
            $gte: startOfWeek,
            $lte: endOfWeek,
          },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$startDate" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    // Format daily stats for chart (1 = Sunday, 7 = Saturday)
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const weeklyData = Array(7).fill(0)

    dailyStats.forEach((day) => {
      weeklyData[day._id - 1] = day.count
    })

    const formattedWeeklyData = daysOfWeek.map((day, index) => ({
      day,
      bookings: weeklyData[index],
    }))

    // Return the booking stats data
    res.status(200).json({
      success: true,
      data: {
        weeklyBookings: formattedWeeklyData,
        totalWeeklyBookings: weeklyData.reduce((sum, count) => sum + count, 0),
      },
    })
  } catch (error) {
    console.error("Error in getBookingStats:", error)
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching booking stats",
      error: error.message,
    })
  }
}

/**
 * Get payment transactions for a trainer
 * @param {Object} req - Request object containing trainerId in params
 * @param {Object} res - Response object
 */
exports.getPaymentTransactions = async (req, res) => {
  try {
    const trainerId = req.params.trainerId
    const { page = 1, limit = 10, status } = req.query

    if (!mongoose.Types.ObjectId.isValid(trainerId)) {
      return res.status(400).json({ success: false, message: "Invalid trainer ID" })
    }

    // Build query based on filters
    const query = {
      trainerId: new mongoose.Types.ObjectId(trainerId),
    }

    // Add payment status filter if provided
    if (status && ["pending", "paid", "failed"].includes(status)) {
      query.paymentStatus = status
    }

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get transactions with client details
    const transactions = await WorkoutSchedule.find(query)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))
      .populate({
        path: "clientId",
        select: "userName profilePicture email",
      })

    // Get total count for pagination
    const totalTransactions = await WorkoutSchedule.countDocuments(query)

    // Format the transaction data
    const formattedTransactions = transactions.map((transaction) => ({
      transactionId: transaction._id,
      bookingNumber: transaction.bookingNumber,
      clientName: transaction.clientId.userName,
      clientEmail: transaction.clientId.email,
      clientPhoto: transaction.clientId.profilePicture,
      date: transaction.startDate,
      startTime: transaction.startTime,
      duration: transaction.duration,
      amount: transaction.amount,
      paymentStatus: transaction.paymentStatus,
      createdAt: transaction.createdAt,
    }))

    // Return the transactions data with pagination info
    res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          total: totalTransactions,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(totalTransactions / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    console.error("Error in getPaymentTransactions:", error)
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching payment transactions",
      error: error.message,
    })
  }
}

/**
 * Get details of a specific transaction
 * @param {Object} req - Request object containing transactionId in params
 * @param {Object} res - Response object
 */
exports.getTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ success: false, message: "Invalid transaction ID" })
    }

    // Get transaction with client details
    const transaction = await WorkoutSchedule.findById(transactionId)
      .populate({
        path: "clientId",
        select: "userName profilePicture email age location",
      })
      .populate({
        path: "trainerId",
        select: "userName profilePicture email",
      })

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" })
    }

    // Get client fitness level if available
    let clientFitnessLevel = null
    if (transaction.clientId) {
      const clientInfo = await Client.findOne({ user: transaction.clientId._id }).select("fitnessLevel")
      if (clientInfo) {
        clientFitnessLevel = clientInfo.fitnessLevel
      }
    }

    // Format the transaction data with detailed information
    const formattedTransaction = {
      transactionId: transaction._id,
      bookingNumber: transaction.bookingNumber,
      client: {
        id: transaction.clientId._id,
        name: transaction.clientId.userName,
        email: transaction.clientId.email,
        photo: transaction.clientId.profilePicture,
        age: transaction.clientId.age,
        location: transaction.clientId.location,
        fitnessLevel: clientFitnessLevel,
      },
      trainer: {
        id: transaction.trainerId._id,
        name: transaction.trainerId.userName,
        email: transaction.trainerId.email,
        photo: transaction.trainerId.profilePicture,
      },
      session: {
        date: transaction.startDate,
        startTime: transaction.startTime,
        duration: transaction.duration,
        message: transaction.message,
        status: transaction.status,
      },
      payment: {
        amount: transaction.amount,
        status: transaction.paymentStatus,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    }

    // Return the detailed transaction data
    res.status(200).json({
      success: true,
      data: formattedTransaction,
    })
  } catch (error) {
    console.error("Error in getTransactionDetails:", error)
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching transaction details",
      error: error.message,
    })
  }
}

/**
 * Update payment status from pending to paid
 * @param {Object} req - Request object containing transactionId in params
 * @param {Object} res - Response object
 */
exports.updatePaymentStatus = async (req, res) => {
  try {
    console.log("updatePaymentStatus called with params:", req.params)
    const { transactionId } = req.params

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ success: false, message: "Invalid transaction ID" })
    }

    // Find the transaction
    const transaction = await WorkoutSchedule.findById(transactionId)
      .populate({
        path: "clientId",
        select: "userName",
      })
      .populate({
        path: "trainerId",
        select: "userName",
      })

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" })
    }

    // Check if the transaction is already paid
    if (transaction.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Transaction is already marked as paid" })
    }

    // Update the payment status to paid
    transaction.paymentStatus = "paid"
    await transaction.save()

    // Create a notification for the client with error handling
    try {
      console.log("Creating notification with:", {
        recipient: transaction.clientId._id,
        sender: transaction.trainerId._id,
        type: "payment",
      })

      const notification = new Notification({
        recipient: transaction.clientId._id,
        sender: transaction.trainerId._id,
        type: "payment",
        title: "Payment Confirmed",
        message: `Your payment for booking ${transaction.bookingNumber} has been confirmed.`,
        priority: "medium",
        relatedSchedule: transaction._id,
        read: false,
      })

      await notification.save()
      console.log("Notification saved successfully")
    } catch (notificationError) {
      // Log the error but don't fail the transaction update
      console.error("Error creating notification:", notificationError)
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: "Payment status updated to paid successfully",
      data: {
        transactionId: transaction._id,
        bookingNumber: transaction.bookingNumber,
        clientName: transaction.clientId.userName,
        amount: transaction.amount,
        paymentStatus: transaction.paymentStatus,
        updatedAt: transaction.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error in updatePaymentStatus:", error)
    res.status(500).json({
      success: false,
      message: "An error occurred while updating payment status",
      error: error.message,
      stack: error.stack,
    })
  }
}



