const User = require("../../model/userModel")
const Trainer = require("../../model/trainerModel")
const WorkoutSchedule = require("../../model/AvailabilityModel")
const Rating = require("../../model/ratingModel")

// const Exercise = require("../../model/exerciseModel");

exports.getAllRecentActivity = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const type = req.query.type
    const search = req.query.search
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null

    // Build query filters
    let bookingQuery = {}
    let userQuery = { role: "Client" }
    let trainerQuery = {}
    let ratingQuery = {}

    // Apply date filter if provided
    if (startDate) {
      const dateFilter = { createdAt: { $gte: startDate } }
      bookingQuery = { ...bookingQuery, ...dateFilter }
      userQuery = { ...userQuery, ...dateFilter }
      trainerQuery = { ...trainerQuery, ...dateFilter }
      ratingQuery = { ...ratingQuery, ...dateFilter }
    }

    // Apply search filter if provided
    if (search) {
      // For bookings, search by client or trainer name
      bookingQuery = {
        ...bookingQuery,
        $or: [
          { "clientId.userName": { $regex: search, $options: "i" } },
          { "trainerId.userName": { $regex: search, $options: "i" } },
        ],
      }

      // For users, search by name or email
      userQuery = {
        ...userQuery,
        $or: [{ userName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }],
      }

      // For trainers, search by user name or email
      trainerQuery = {
        ...trainerQuery,
        $or: [
          { "user.userName": { $regex: search, $options: "i" } },
          { "user.email": { $regex: search, $options: "i" } },
        ],
      }

      // For ratings, search by client or trainer name
      ratingQuery = {
        ...ratingQuery,
        $or: [
          { "clientId.userName": { $regex: search, $options: "i" } },
          { "trainerId.userName": { $regex: search, $options: "i" } },
        ],
      }
    }

    // Determine which queries to run based on type filter
    const queries = []

    if (!type || type === "all" || type === "booking") {
      queries.push(
        WorkoutSchedule.find(bookingQuery)
          .sort({ createdAt: -1 })
          .populate("clientId", "userName profilePicture")
          .populate("trainerId", "userName profilePicture")
          .lean(),
      )
    } else {
      queries.push(Promise.resolve([]))
    }

    if (!type || type === "all" || type === "user_registration") {
      queries.push(User.find(userQuery).sort({ createdAt: -1 }).lean())
    } else {
      queries.push(Promise.resolve([]))
    }

    if (!type || type === "all" || type === "trainer_registration") {
      queries.push(
        Trainer.find(trainerQuery).sort({ createdAt: -1 }).populate("user", "userName profilePicture email").lean(),
      )
    } else {
      queries.push(Promise.resolve([]))
    }

    if (!type || type === "all" || type === "rating") {
      queries.push(
        Rating.find(ratingQuery)
          .sort({ createdAt: -1 })
          .populate("clientId", "userName profilePicture")
          .populate("trainerId", "userName profilePicture")
          .lean(),
      )
    } else {
      queries.push(Promise.resolve([]))
    }

    // Run all queries in parallel
    const [bookings, users, trainers, ratings] = await Promise.all(queries)

    // Transform and combine all activities
    let activities = []

    // Current timestamp for default date
    const defaultDate = new Date()

    // Only add bookings if they were queried
    if (!type || type === "all" || type === "booking") {
      activities = [
        ...activities,
        ...bookings.map((booking) => {
          // Log the booking object to debug date fields
          console.log(`Booking ${booking._id} date fields:`, {
            createdAt: booking.createdAt,
            bookingDate: booking.bookingDate,
            updatedAt: booking.updatedAt,
          })

          // Find the most appropriate date field
          const activityDate = booking.createdAt || booking.bookingDate || booking.updatedAt || defaultDate

          return {
            id: booking._id,
            type: "booking",
            title: `New Booking #${booking.bookingNumber || ""}`,
            description: `A workout session was scheduled between client and trainer`,
            date: activityDate,
            createdAt: activityDate,
            bookingDate: booking.bookingDate,
            entity: "workout",
            entityId: booking._id,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            amount: booking.amount,
            rawData: booking,
          }
        }),
      ]
    }

    // Only add users if they were queried
    if (!type || type === "all" || type === "user_registration") {
      activities = [
        ...activities,
        ...users.map((user) => {
          // Log the user object to debug date fields
          console.log(`User ${user._id} date fields:`, {
            createdAt: user.createdAt,
            registrationDate: user.registrationDate,
            updatedAt: user.updatedAt,
          })

          // Find the most appropriate date field
          const activityDate = user.createdAt || user.registrationDate || user.updatedAt || defaultDate

          return {
            id: user._id,
            type: "user_registration",
            title: "New Client Registration",
            description: `${user.userName || "A new client"} joined the platform`,
            date: activityDate,
            createdAt: activityDate,
            registrationDate: user.registrationDate,
            entity: "user",
            entityId: user._id,
            role: user.role,
            rawData: user,
          }
        }),
      ]
    }

    // Only add trainers if they were queried
    if (!type || type === "all" || type === "trainer_registration") {
      activities = [
        ...activities,
        ...trainers.map((trainer) => {
          // Log the trainer object to debug date fields
          console.log(`Trainer ${trainer._id} date fields:`, {
            createdAt: trainer.createdAt,
            registrationDate: trainer.registrationDate,
            updatedAt: trainer.updatedAt,
          })

          // Find the most appropriate date field
          const activityDate = trainer.createdAt || trainer.registrationDate || trainer.updatedAt || defaultDate

          return {
            id: trainer._id,
            type: "trainer_registration",
            title: "New Trainer Registration",
            description: `${trainer.user?.userName || "A new trainer"} registered as a trainer`,
            date: activityDate,
            createdAt: activityDate,
            registrationDate: trainer.registrationDate,
            entity: "trainer",
            entityId: trainer._id,
            rawData: trainer,
          }
        }),
      ]
    }

    // Only add ratings if they were queried
    if (!type || type === "all" || type === "rating") {
      activities = [
        ...activities,
        ...ratings.map((rating) => {
          // Log the rating object to debug date fields
          console.log(`Rating ${rating._id} date fields:`, {
            createdAt: rating.createdAt,
            ratingDate: rating.ratingDate,
            updatedAt: rating.updatedAt,
          })

          // Find the most appropriate date field
          const activityDate = rating.createdAt || rating.ratingDate || rating.updatedAt || defaultDate

          return {
            id: rating._id,
            type: "rating",
            title: "New Trainer Rating",
            description: `A trainer received a ${rating.rating}-star rating`,
            date: activityDate,
            createdAt: activityDate,
            ratingDate: rating.ratingDate,
            entity: "rating",
            entityId: rating._id,
            rating: rating.rating,
            rawData: rating,
          }
        }),
      ]
    }

    // Sort all activities by date (newest first)
    const sortedActivities = activities.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0)
      const dateB = b.date ? new Date(b.date) : new Date(0)
      return dateB - dateA // Newest first
    })

    // Apply pagination
    const totalCount = sortedActivities.length
    const paginatedActivities = sortedActivities.slice(skip, skip + limit)

    // Log the first few activities for debugging
    console.log(
      "Sample activities:",
      paginatedActivities.slice(0, 2).map((a) => ({
        id: a.id,
        type: a.type,
        date: a.date,
        createdAt: a.createdAt,
      })),
    )

    res.status(200).json({
      success: true,
      count: totalCount,
      data: paginatedActivities,
    })
  } catch (error) {
    console.error("Error in getAllRecentActivity:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching recent activity",
      error: error.message,
    })
  }
}

// Get recent bookings
exports.getRecentBookings = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 5
    const defaultDate = new Date()

    const bookings = await WorkoutSchedule.find({})
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .populate("clientId", "userName profilePicture")
      .populate("trainerId", "userName profilePicture")
      .lean()

    res.status(200).json({
      success: true,
      data: bookings.map((booking) => {
        const activityDate = booking.createdAt || booking.bookingDate || booking.updatedAt || defaultDate

        return {
          ...booking,
          date: activityDate,
          createdAt: activityDate,
        }
      }),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recent bookings",
      error: error.message,
    })
  }
}

// Get recent notifications
exports.getRecentNotifications = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 5
    const defaultDate = new Date()

    const notifications = await Notification.find({})
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .populate("sender", "userName profilePicture")
      .populate("recipient", "userName profilePicture")
      .lean()

    res.status(200).json({
      success: true,
      data: notifications.map((notification) => {
        const activityDate = notification.createdAt || notification.sentDate || notification.updatedAt || defaultDate

        return {
          ...notification,
          date: activityDate,
          createdAt: activityDate,
        }
      }),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recent notifications",
      error: error.message,
    })
  }
}

// Get recent user registrations
exports.getRecentUsers = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 5
    const defaultDate = new Date()

    const users = await User.find({ role: "Client" })
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .lean()

    res.status(200).json({
      success: true,
      data: users.map((user) => {
        const activityDate = user.createdAt || user.registrationDate || user.updatedAt || defaultDate

        return {
          ...user,
          date: activityDate,
          createdAt: activityDate,
        }
      }),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recent users",
      error: error.message,
    })
  }
}

// Get recent trainer registrations
exports.getRecentTrainers = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 5
    const defaultDate = new Date()

    const trainers = await Trainer.find({})
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .populate("user", "userName profilePicture email")
      .lean()

    res.status(200).json({
      success: true,
      data: trainers.map((trainer) => {
        const activityDate = trainer.createdAt || trainer.registrationDate || trainer.updatedAt || defaultDate

        return {
          ...trainer,
          date: activityDate,
          createdAt: activityDate,
        }
      }),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recent trainers",
      error: error.message,
    })
  }
}

// Get recent ratings
exports.getRecentRatings = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 5
    const defaultDate = new Date()

    const ratings = await Rating.find({})
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .populate("clientId", "userName profilePicture")
      .populate("trainerId", "userName profilePicture")
      .populate("workoutId")
      .lean()

    res.status(200).json({
      success: true,
      data: ratings.map((rating) => {
        const activityDate = rating.createdAt || rating.ratingDate || rating.updatedAt || defaultDate

        return {
          ...rating,
          date: activityDate,
          createdAt: activityDate,
        }
      }),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recent ratings",
      error: error.message,
    })
  }
}







exports.getRecentTransactions = async (req, res) => {
  try {
 
    const limit = Number.parseInt(req.query.limit) || 10
    const page = Number.parseInt(req.query.page) || 1
    const skip = (page - 1) * limit

    // Find workout schedules with payment information
    // Sort by most recent first
    const transactions = await WorkoutSchedule.find({
      // Only include records where payment has been processed
      paymentStatus: { $in: ["paid", "failed"] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("clientId", "userName profilePicture email")
      .populate("trainerId", "userName profilePicture email")
      .lean()

    // Get total count for pagination
    const totalCount = await WorkoutSchedule.countDocuments({
      paymentStatus: { $in: ["paid", "failed"] },
    })

    // Format the response data
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction._id,
      bookingNumber: transaction.bookingNumber,
      date: transaction.createdAt,
      client: {
        id: transaction.clientId._id,
        name: transaction.clientId.userName,
        profilePicture: transaction.clientId.profilePicture,
        email: transaction.clientId.email,
      },
      trainer: {
        id: transaction.trainerId._id,
        name: transaction.trainerId.userName,
        profilePicture: transaction.trainerId.profilePicture,
        email: transaction.trainerId.email,
      },
      amount: transaction.amount,
      status: transaction.paymentStatus,
      sessionDate: transaction.startDate,
      sessionTime: transaction.startTime,
      duration: transaction.duration,
    }))

    res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      },
    })
  } catch (error) {
    console.error("Error fetching recent transactions:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent transactions",
      error: error.message,
    })
  }
}

// Get transactions for a specific user (client or trainer)
exports.getUserTransactions = async (req, res) => {
  try {
    const { userId, role } = req.params
    const limit = Number.parseInt(req.query.limit) || 10
    const page = Number.parseInt(req.query.page) || 1
    const skip = (page - 1) * limit

    // Determine which field to query based on role
    const query = {}
    if (role.toLowerCase() === "client") {
      query.clientId = userId
    } else if (role.toLowerCase() === "trainer") {
      query.trainerId = userId
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Must be "client" or "trainer"',
      })
    }

    // Add payment status filter
    query.paymentStatus = { $in: ["paid", "failed"] }

    const transactions = await WorkoutSchedule.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("clientId", "userName profilePicture email")
      .populate("trainerId", "userName profilePicture email")
      .lean()

    const totalCount = await WorkoutSchedule.countDocuments(query)

    // Format the response data
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction._id,
      bookingNumber: transaction.bookingNumber,
      date: transaction.createdAt,
      client: {
        id: transaction.clientId._id,
        name: transaction.clientId.userName,
        profilePicture: transaction.clientId.profilePicture,
        email: transaction.clientId.email,
      },
      trainer: {
        id: transaction.trainerId._id,
        name: transaction.trainerId.userName,
        profilePicture: transaction.trainerId.profilePicture,
        email: transaction.trainerId.email,
      },
      amount: transaction.amount,
      status: transaction.paymentStatus,
      sessionDate: transaction.startDate,
      sessionTime: transaction.startTime,
      duration: transaction.duration,
    }))

    res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      },
    })
  } catch (error) {
    console.error("Error fetching user transactions:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch user transactions",
      error: error.message,
    })
  }
}

// Get transaction statistics
exports.getTransactionStats = async (req, res) => {
  try {
    // Get total revenue
    const revenueResult = await WorkoutSchedule.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ])

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0

    // Get count of successful transactions
    const successfulTransactions = await WorkoutSchedule.countDocuments({ paymentStatus: "paid" })

    // Get count of failed transactions
    const failedTransactions = await WorkoutSchedule.countDocuments({ paymentStatus: "failed" })

    // Get count of pending transactions
    const pendingTransactions = await WorkoutSchedule.countDocuments({ paymentStatus: "pending" })

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        successfulTransactions,
        failedTransactions,
        pendingTransactions,
        totalTransactions: successfulTransactions + failedTransactions + pendingTransactions,
      },
    })
  } catch (error) {
    console.error("Error fetching transaction statistics:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction statistics",
      error: error.message,
    })
  }
}


