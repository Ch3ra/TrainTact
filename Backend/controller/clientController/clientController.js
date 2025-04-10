const Client = require("../../model/clientModel")
const User = require("../../model/userModel")
const WorkoutSchedule = require("../../model/AvailabilityModel")

exports.getAllClientUsers = async (req, res) => {
  try {
    // Find all users with role "Client"
    const clientUsers = await User.find({ role: "Client" }).sort({ createdAt: -1 })

    // Get booking information for each client
    const clientsWithBookings = await Promise.all(
      clientUsers.map(async (user) => {
        // Count total bookings for this client
        const bookingsCount = await WorkoutSchedule.countDocuments({ clientId: user._id })

        // Check if client has any upcoming or ongoing sessions
        const activeSessionsCount = await WorkoutSchedule.countDocuments({
          clientId: user._id,
          status: { $in: ["upcoming", "ongoing"] },
        })

        // Determine client status based on active sessions
        // Client is active only if they have active sessions
        const hasActiveSessions = activeSessionsCount > 0
        const status = hasActiveSessions ? "active" : "inactive"

        return {
          ...user._doc,
          bookingsCount,
          hasActiveSessions,
          status,
          isOtpVerified: user.isOtpVerified, // Include isOtpVerified for the frontend
        }
      }),
    )

    res.status(200).json({
      success: true,
      data: clientsWithBookings,
    })
  } catch (error) {
    console.error("Error fetching client users:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

// Get client statistics
exports.getClientStats = async (req, res) => {
  try {
    // Count total client users
    const totalUsers = await User.countDocuments({ role: "Client" })

    // Get all client IDs
    const clientIds = await User.find({ role: "Client" }).select("_id")
    const clientIdList = clientIds.map((client) => client._id)

    // Count clients with active sessions (upcoming or ongoing)
    const clientsWithActiveSessions = await WorkoutSchedule.aggregate([
      {
        $match: {
          clientId: { $in: clientIdList },
          status: { $in: ["upcoming", "ongoing"] },
        },
      },
      { $group: { _id: "$clientId" } },
      { $count: "count" },
    ])

    // Count active client users (those with active sessions)
    const activeClientsWithSessions = await WorkoutSchedule.aggregate([
      {
        $match: {
          clientId: { $in: clientIdList },
          status: { $in: ["upcoming", "ongoing"] },
        },
      },
      { $group: { _id: "$clientId" } },
    ])

    const activeClientIds = activeClientsWithSessions.map((item) => item._id)

    const activeUsers = await User.countDocuments({
      _id: { $in: activeClientIds },
      role: "Client",
    })

    // Count inactive client users (no active sessions)
    const inactiveUsers = totalUsers - activeUsers

    // Count verified and unverified users (can access website or not)
    const verifiedUsers = await User.countDocuments({
      role: "Client",
      isOtpVerified: true,
    })

    const unverifiedUsers = await User.countDocuments({
      role: "Client",
      isOtpVerified: false,
    })

    // Get fitness goals distribution for clients
    const fitnessGoals = await User.aggregate([
      { $match: { role: "Client", fitnessGoal: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: "$fitnessGoal", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    // Get fitness levels distribution from Client model
    const fitnessLevels = await Client.aggregate([
      { $group: { _id: "$fitnessLevel", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    // Get client registrations by month
    const userRegistrations = await User.aggregate([
      { $match: { role: "Client" } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])

    // Get booking statistics
    const bookingStats = await WorkoutSchedule.aggregate([
      { $match: { clientId: { $in: clientIdList } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        verifiedUsers,
        unverifiedUsers,
        clientsWithActiveSessions: clientsWithActiveSessions[0]?.count || 0,
        fitnessGoals: fitnessGoals.map((goal) => ({ name: goal._id, count: goal.count })),
        fitnessLevels: fitnessLevels.map((level) => ({ name: level._id || "Not specified", count: level.count })),
        userRegistrations: userRegistrations.map((item) => ({
          month: item._id.month,
          year: item._id.year,
          count: item.count,
        })),
        bookingStats: bookingStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count
          return acc
        }, {}),
      },
    })
  } catch (error) {
    console.error("Error fetching client statistics:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}


exports.getClientDetails = async (req, res) => {
  try {
    const { userId } = req.params
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.role === "Client") {
      const clientDetails = await Client.findOne({ user: userId })
      if (!clientDetails) {
        return res.status(404).json({ message: "Client details not found" })
      }

      // Get booking statistics for this client
      const bookingsCount = await WorkoutSchedule.countDocuments({ clientId: userId })
      const completedSessions = await WorkoutSchedule.countDocuments({
        clientId: userId,
        status: "completed",
      })
      const upcomingSessions = await WorkoutSchedule.countDocuments({
        clientId: userId,
        status: "upcoming",
      })
      const ongoingSessions = await WorkoutSchedule.countDocuments({
        clientId: userId,
        status: "ongoing",
      })

      // Determine if client has active sessions
      const hasActiveSessions = upcomingSessions > 0 || ongoingSessions > 0

      // Determine client status based on active sessions
      const status = hasActiveSessions ? "active" : "inactive"

      return res.status(200).json({
        user: {
          ...user._doc,
          status,
          hasActiveSessions,
        },
        clientDetails,
        bookingStats: {
          bookingsCount,
          completedSessions,
          upcomingSessions,
          ongoingSessions,
          hasActiveSessions,
        },
      })
    }

    res.status(200).json({ user })
  } catch (error) {
    console.error("Error fetching user/client information:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

exports.createOrUpdateClientProfile = async (req, res) => {
  try {
    const { userId } = req.params
    const { fitnessGoal, height, weight, fitnessLevel, location, description } = req.body
    const profilePicture = req.files?.profilePicture?.[0]?.filename || null

    if (!fitnessGoal || !height || !weight || !fitnessLevel || !location) {
      return res.status(400).json({ message: "All fields are required." })
    }

    const validFitnessLevels = ["Beginner", "Intermediate", "Advanced"]
    if (!validFitnessLevels.includes(fitnessLevel)) {
      return res.status(400).json({
        message: "Invalid fitness level. Choose Beginner, Intermediate, or Advanced.",
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    if (profilePicture) {
      user.profilePicture = `${process.env.IMAGE_URL}uploads/profilePictures/${profilePicture}`
    }
    user.fitnessGoal = fitnessGoal
    user.location = location
    await user.save()

    if (user.role === "Client") {
      const client = await Client.findOne({ user: userId })
      if (client) {
        client.height = height
        client.weight = weight
        client.fitnessLevel = fitnessLevel
        client.description = description
        await client.save()
      } else {
        await Client.create({
          user: userId,
          height,
          weight,
          fitnessLevel,
          description,
        })
      }

      // Check if client has any active sessions after profile update
      const activeSessionsCount = await WorkoutSchedule.countDocuments({
        clientId: userId,
        status: { $in: ["upcoming", "ongoing"] },
      })

      // Update status based on active sessions
      const hasActiveSessions = activeSessionsCount > 0
      const status = hasActiveSessions ? "active" : "inactive"

      return res.status(200).json({
        message: "Profile updated successfully.",
        user: {
          ...user._doc,
          status,
          hasActiveSessions,
        },
      })
    }

    res.status(200).json({
      message: "Profile updated successfully.",
      user,
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    res.status(500).json({ message: "Internal server error.", error: error.message })
  }
}

exports.updateClientProfile = async (req, res) => {
  try {
    const { userId } = req.params
    const { userName, email, fitnessGoal, location, description, height, weight, fitnessLevel } = req.body
    const profilePicture = req.files?.profilePicture?.[0]?.filename || null

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    if (userName) user.userName = userName
    if (email) user.email = email
    if (fitnessGoal) user.fitnessGoal = fitnessGoal
    if (location) user.location = location
    if (profilePicture) {
      user.profilePicture = `${process.env.IMAGE_URL}uploads/profilePictures/${profilePicture}`
    }
    await user.save()

    let clientDetails
    if (user.role === "Client") {
      const client = await Client.findOne({ user: userId })
      if (client) {
        if (height) client.height = height
        if (weight) client.weight = weight
        if (fitnessLevel) client.fitnessLevel = fitnessLevel
        if (description) client.description = description
        await client.save()
        clientDetails = client
      } else {
        clientDetails = await Client.create({
          user: userId,
          height: height || 0,
          weight: weight || 0,
          fitnessLevel: fitnessLevel || "Beginner",
          description: description || "",
        })
      }

      // Check if client has any active sessions after profile update
      const activeSessionsCount = await WorkoutSchedule.countDocuments({
        clientId: userId,
        status: { $in: ["upcoming", "ongoing"] },
      })

      // Update status based on active sessions
      const hasActiveSessions = activeSessionsCount > 0
      const status = hasActiveSessions ? "active" : "inactive"

      return res.status(200).json({
        message: "Profile updated successfully.",
        userData: {
          userName: user.userName,
          email: user.email,
          fitnessGoal: user.fitnessGoal,
          location: user.location,
          profilePicture: user.profilePicture,
          isOtpVerified: user.isOtpVerified,
          status,
          hasActiveSessions,
          clientDetails: {
            height: clientDetails.height,
            weight: clientDetails.weight,
            fitnessLevel: clientDetails.fitnessLevel,
            description: clientDetails.description,
          },
        },
      })
    }

    res.status(200).json({
      message: "Profile updated successfully.",
      userData: {
        userName: user.userName,
        email: user.email,
        fitnessGoal: user.fitnessGoal,
        location: user.location,
        profilePicture: user.profilePicture,
        isOtpVerified: user.isOtpVerified,
      },
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}

exports.updateOtpVerification = async (req, res) => {
  try {
    const { userId } = req.params
    const { isVerified } = req.body

    if (isVerified === undefined) {
      return res.status(400).json({
        success: false,
        message: "isVerified field is required",
      })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Update the OTP verification status
    user.isOtpVerified = isVerified
    await user.save()

    // Check if client has any active sessions
    const activeSessionsCount = await WorkoutSchedule.countDocuments({
      clientId: userId,
      status: { $in: ["upcoming", "ongoing"] },
    })

    // Determine status based on active sessions
    const hasActiveSessions = activeSessionsCount > 0
    const status = hasActiveSessions ? "active" : "inactive"

    res.status(200).json({
      success: true,
      message: isVerified
        ? "Client access has been granted. They can now log in to the platform."
        : "Client access has been restricted. They can no longer log in to the platform.",
      user: {
        ...user._doc,
        status,
        hasActiveSessions,
      },
    })
  } catch (error) {
    console.error("Error updating OTP verification status:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

exports.getClientRegistrationProgress = async (req, res) => {
  try {
    // Get the last 12 months for our data range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 11) // Last 12 months

    // Create an array of all months in our range for consistent data points
    const monthsRange = []
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate)
      date.setMonth(date.getMonth() + i)
      monthsRange.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        key: `${date.getMonth() + 1}/${date.getFullYear()}`
      })
    }

    // Get client registrations by month
    const monthlyRegistrations = await User.aggregate([
      { 
        $match: { 
          role: "Client",
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          count: { $sum: 1 },
          // Calculate cumulative count (will be updated later)
          newClients: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ])

    // Create a map for easy lookup
    const registrationsMap = {}
    monthlyRegistrations.forEach(item => {
      const key = `${item._id.month}/${item._id.year}`
      registrationsMap[key] = {
        newClients: item.count
      }
    })

    // Calculate cumulative registrations
    let cumulativeCount = 0
    // Get count of clients registered before our start date
    const priorClientsCount = await User.countDocuments({
      role: "Client",
      createdAt: { $lt: startDate }
    })
    cumulativeCount = priorClientsCount

    // Combine all data into a consistent format with all months
    const progressData = monthsRange.map(monthData => {
      const key = monthData.key
      const monthStats = registrationsMap[key] || { newClients: 0 }
      
      // Add this month's new clients to the cumulative count
      cumulativeCount += monthStats.newClients

      // Format month name for display
      const date = new Date(monthData.year, monthData.month - 1, 1)
      const monthName = date.toLocaleString('default', { month: 'short' })
      
      return {
        monthYear: key,
        month: monthName,
        year: monthData.year,
        newClients: monthStats.newClients,
        totalClients: cumulativeCount
      }
    })

    res.status(200).json({
      success: true,
      data: progressData
    })
  } catch (error) {
    console.error("Error fetching client registration progress data:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    })
  }
}
