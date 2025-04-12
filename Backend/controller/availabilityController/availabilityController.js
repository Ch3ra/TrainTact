const WorkoutSchedule = require("../../model/AvailabilityModel")
const Conversation = require("../../model/conversationModel")
const User = require("../../model/userModel")
const cron = require("node-cron")
const notificationController = require("../notification/NotificationController")
const chatController = require("../chatController/chatController")

const updateWorkoutStatuses = async () => {
  const now = new Date()
  console.log("Running status update job at:", now.toISOString())

  try {
    // Update 'upcoming' to 'ongoing' when start date has passed
    const upcomingResult = await WorkoutSchedule.updateMany(
      {
        status: "upcoming",
        startDate: { $lte: now },
      },
      { $set: { status: "ongoing" } },
    )

    // Find ongoing workouts that should be completed
    const ongoingWorkouts = await WorkoutSchedule.find({
      status: "ongoing",
      endDate: { $lte: now },
    });

    console.log(`Found ${ongoingWorkouts.length} workouts to mark as completed`);

    // Update status to completed
    const ongoingResult = await WorkoutSchedule.updateMany(
      {
        status: "ongoing",
        endDate: { $lte: now },
      },
      { $set: { status: "completed" } },
    )

    // Handle conversation cleanup for completed workouts
    for (const workout of ongoingWorkouts) {
      console.log(`Processing completed workout: ${workout._id}`);
      console.log(`Client: ${workout.clientId}, Trainer: ${workout.trainerId}`);
      await chatController.handleWorkoutCompletion(workout._id);
    }

    console.log("Workout statuses updated successfully")
    console.log(`Updated ${upcomingResult.modifiedCount} upcoming schedules to ongoing`)
    console.log(`Updated ${ongoingResult.modifiedCount} ongoing schedules to completed`)
  } catch (error) {
    console.error("Error updating workout statuses:", error)
  }
}

exports.initStatusUpdateJob = () => {
  console.log("Initializing workout status update job")
  cron.schedule("0 * * * *", () => {
    console.log("Running scheduled status update job...")
    updateWorkoutStatuses()
  })

  // Run once at startup to update any statuses that might have changed while the server was down
  console.log("Running initial status update...")
  updateWorkoutStatuses()
}

const convertTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
}

exports.createSchedule = async (req, res) => {
  const { clientId, trainerId, startTime, duration, startDate, endDate, message, paymentStatus, amount } = req.body

  if (!clientId || !trainerId || !startTime || !duration || !startDate || !endDate) {
    return res.status(400).send("Please provide all required fields.")
  }

  try {
    // Debug: Check server's current date
    console.log("Current server date:", new Date().toISOString())

    // Validate that booking dates are not in the past
    const now = new Date()
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)

    // Set time to beginning of the day for more accurate comparison
    const todayStart = new Date(now.setHours(0, 0, 0, 0))

    // Check if start date is in the past
    if (startDateObj < todayStart) {
      return res.status(400).send("Cannot book sessions with a start date in the past.")
    }

    // Check if end date is in the past
    if (endDateObj < todayStart) {
      return res.status(400).send("Cannot book sessions with an end date in the past.")
    }

    // Convert new booking's time to minutes
    const newStartMinutes = convertTimeToMinutes(startTime)
    const newEndMinutes = newStartMinutes + Number.parseInt(duration, 10)

    // Find all existing bookings for the trainer with overlapping dates
    const existingBookings = await WorkoutSchedule.find({
      trainerId: trainerId,
      $and: [{ startDate: { $lte: new Date(endDate) } }, { endDate: { $gte: new Date(startDate) } }],
    })

    // Check each existing booking for time overlap
    for (const existing of existingBookings) {
      const existingStartMinutes = convertTimeToMinutes(existing.startTime)
      const existingEndMinutes = existingStartMinutes + existing.duration

      if (newStartMinutes < existingEndMinutes && existingStartMinutes < newEndMinutes) {
        return res.status(400).send("Trainer is already booked for this time slot.")
      }
    }

    // Determine initial status based on dates
    let initialStatus = "upcoming"

    console.log("Current date:", now.toISOString())
    console.log("Start date:", startDateObj.toISOString())
    console.log("End date:", endDateObj.toISOString())
    console.log("now timestamp:", now.getTime())
    console.log("startDate timestamp:", startDateObj.getTime())
    console.log("endDate timestamp:", endDateObj.getTime())

    // Note: With the new validation above, the status should always be 'upcoming',
    // but keeping the logic for completeness and potential future changes
    if (endDateObj.getTime() < now.getTime()) {
      initialStatus = "completed"
    } else if (startDateObj.getTime() <= now.getTime()) {
      initialStatus = "ongoing"
    } else {
      initialStatus = "upcoming"
    }

    console.log("Setting initial status to:", initialStatus)

    // Generate a unique booking number
    const bookingCount = await WorkoutSchedule.countDocuments()
    const bookingNumber = `BOOK-${String(bookingCount + 1).padStart(5, '0')}`

    // Create new schedule if no conflicts
    const schedule = new WorkoutSchedule({
      clientId,
      trainerId,
      startTime,
      duration,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      message,
      paymentStatus: paymentStatus || "pending",
      status: initialStatus,
      amount: amount || 0, // Set the amount from the request or default to 0
      bookingNumber, // Add the booking number
      isClientVerified: false, // Default to false until payment is verified
    })

    await schedule.save()

    // Send notifications for the new booking
    try {
      await notificationController.notifyNewBooking(
        schedule._id,
        clientId,
        trainerId
      )
      console.log("Booking notifications sent successfully")
    } catch (notificationError) {
      console.error("Error sending booking notifications:", notificationError)
      // Continue with the response even if notification fails
    }

    res.status(201).json({
      message: "Workout schedule created successfully.",
      schedule: schedule,
    })
  } catch (error) {
    console.error("Error creating schedule:", error)
    res.status(500).send("Server error: " + error.message)
  }
}

exports.getClientBookings = async (req, res) => {
  try {
    // Modified query to exclude bookings with 'completed' status
    const bookings = await WorkoutSchedule.find({
      clientId: req.params.id,
      status: { $ne: "completed" }, // Exclude completed bookings
    })
      .populate({
        path: "trainerId",
        select: "userName email profilePicture fitnessGoal location",
        model: "User",
      })
      .select("startTime duration startDate endDate message clientId isClientVerified paymentStatus amount status")

    if (bookings.length === 0) {
      return res.status(404).send("No active bookings found.")
    }

    // Update statuses before returning
    const now = new Date()
    for (const booking of bookings) {
      const startDate = new Date(booking.startDate)
      const endDate = new Date(booking.endDate)

      if (booking.status === "upcoming" && startDate <= now) {
        booking.status = "ongoing"
        await booking.save()
      } else if (booking.status === "ongoing" && endDate <= now) {
        booking.status = "completed"
        await booking.save()
      }
    }

    // Filter out any bookings that might have just been marked as completed
    // during the status update above
    const activeBookings = bookings.filter((booking) => booking.status !== "completed")

    res.status(200).json(activeBookings)
  } catch (error) {
    console.error("Error fetching client bookings:", error)
    res.status(500).send("Server error: " + error.message)
  }
}

exports.getTrainerBookings = async (req, res) => {
  try {
    // Modified query to exclude bookings with 'completed' status
    const bookings = await WorkoutSchedule.find({
      trainerId: req.params.id,
      status: { $ne: "completed" }, // Exclude completed bookings
    })
      .populate({
        path: "clientId",
        select: "userName email profilePicture fitnessGoal location",
        model: "User",
      })
      .select("startTime duration startDate endDate message clientId isClientVerified status")

    if (bookings.length === 0) {
      return res.status(404).send("No active bookings found.")
    }

    // Update statuses before returning
    const now = new Date()
    for (const booking of bookings) {
      const startDate = new Date(booking.startDate)
      const endDate = new Date(booking.endDate)

      if (booking.status === "upcoming" && startDate <= now) {
        booking.status = "ongoing"
        await booking.save()
      } else if (booking.status === "ongoing" && endDate <= now) {
        booking.status = "completed"
        await booking.save()
      }
    }

    // Filter out any bookings that might have just been marked as completed
    // during the status update above
    const activeBookings = bookings.filter((booking) => booking.status !== "completed")

    res.status(200).json(activeBookings)
  } catch (error) {
    console.error("Error fetching trainer bookings:", error)
    res.status(500).send("Server error: " + error.message)
  }
}
// For the verifyBooking function (acceptance endpoint)
exports.verifyBooking = async (req, res) => {
  try {
    const booking = await WorkoutSchedule.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    
    // Mark as verified for acceptance
    booking.isClientVerified = true;
    await booking.save();
    
    const { trainerId, clientId } = booking;
    if (!trainerId || !clientId) {
      return res.status(400).json({ message: "Missing user IDs for conversation." });
    }

    // Send notification that booking is accepted
    try {
      await notificationController.notifyBookingResponse(
        booking._id.toString(),
        clientId,
        trainerId,
        true // isAccepted = true
      );
      console.log("Booking acceptance notification sent successfully");
    } catch (notificationError) {
      console.error("Error sending booking acceptance notification:", notificationError);
      // Continue with the response even if notification fails
    }

    const existingConversation = await Conversation.findOne({
      members: { $all: [trainerId, clientId] },
    });

    if (existingConversation) {
      return res.status(200).json({
        message: "Conversation already exists",
        conversation: existingConversation,
      });
    }

    const newConversation = new Conversation({ members: [trainerId, clientId] });
    const savedConversation = await newConversation.save();

    return res.status(201).json({
      message: "Client verified and conversation created!",
      conversation: savedConversation,
    });
  } catch (error) {
    console.error("Error verifying client:", error);
    res.status(500).send("Server error: " + error.message);
  }
};

// For the deleteBooking function (decline endpoint)
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await WorkoutSchedule.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    
    // Store the necessary information before deleting
    const bookingId = booking._id.toString();
    const trainerId = booking.trainerId;
    const clientId = booking.clientId;
    
    if (!trainerId || !clientId) {
      return res.status(400).json({ message: "Missing user IDs for notification." });
    }
    
    // Send decline notification first
    try {
      await notificationController.notifyBookingResponse(
        bookingId,
        clientId,
        trainerId,
        false // isAccepted = false
      );
      console.log("Booking decline notification sent successfully");
    } catch (notificationError) {
      console.error("Error sending booking decline notification:", notificationError);
      // Continue with deletion even if notification fails
    }
    
    // Delete the booking
    await WorkoutSchedule.findByIdAndDelete(bookingId);
    
    return res.status(200).json({
      message: "Booking declined successfully",
    });
  } catch (error) {
    console.error("Error declining booking:", error);
    res.status(500).send("Server error: " + error.message);
  }
};

exports.getWorkoutStatus = async (req, res) => {
  try {
    const { workoutId } = req.params

    const workout = await WorkoutSchedule.findById(workoutId)
    if (!workout) {
      return res.status(404).send("Workout schedule not found.")
    }

    // Double-check status is up-to-date before returning
    const now = new Date()
    const startDate = new Date(workout.startDate)
    const endDate = new Date(workout.endDate)
    let currentStatus = workout.status

    if (currentStatus === "upcoming" && startDate.getTime() <= now.getTime()) {
      currentStatus = "ongoing"
      workout.status = currentStatus
      await workout.save()
    } else if (currentStatus === "ongoing" && endDate.getTime() <= now.getTime()) {
      currentStatus = "completed"
      workout.status = currentStatus
      await workout.save()
    }

    res.status(200).json({
      status: currentStatus,
      workout: workout,
    })
  } catch (error) {
    console.error("Error getting workout status:", error)
    res.status(500).send("Server error: " + error.message)
  }
}

exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params
    const booking = await WorkoutSchedule.findById(bookingId)

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." })
    }

    // Only allow cancellation of upcoming or ongoing bookings
    if (booking.status === "completed") {
      return res.status(400).json({ message: "Cannot cancel a completed booking." })
    }

    // Determine who is cancelling the booking based on the token
    const userId = req.user._id
    const isClientCancelling = userId.toString() === booking.clientId.toString()
    const otherUserId = isClientCancelling ? booking.trainerId : booking.clientId

    // Send notification about booking cancellation
    try {
      await notificationController.notifyBookingCancellation(
        booking._id,
        userId,
        otherUserId
      )
      console.log("Booking cancellation notification sent successfully")
    } catch (notificationError) {
      console.error("Error sending booking cancellation notification:", notificationError)
      // Continue with the response even if notification fails
    }

    booking.status = "cancelled"
    await booking.save()

    res.status(200).json({
      message: "Booking cancelled successfully.",
      booking: booking,
    })
  } catch (error) {
    console.error("Error cancelling booking:", error)
    res.status(500).send("Server error: " + error.message)
  }
}

exports.getClientCompletedBookings = async (req, res) => {
  try {
    const bookings = await WorkoutSchedule.find({
      clientId: req.params.id,
      status: "completed"
    })
      .populate({
        path: "trainerId",
        select: "userName email profilePicture fitnessGoal location",
        model: "User",
      })
      .select("startTime duration startDate endDate message clientId isClientVerified paymentStatus amount status")
      .sort({ endDate: -1 });

    if (bookings.length === 0) {
      return res.status(404).send("No completed bookings found.");
    }

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching client completed bookings:", error);
    res.status(500).send("Server error: " + error.message);
  }
};

// Add this new function to your existing controller file
exports.getAllBookings = async (req, res) => {
  try {
    // Get query parameters for filtering
    const { status, startDate, endDate, trainerId, clientId, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Add filters if provided
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (trainerId) {
      filter.trainerId = trainerId;
    }
    
    if (clientId) {
      filter.clientId = clientId;
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) {
        filter.startDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.endDate = filter.endDate || {};
        filter.endDate.$lte = new Date(endDate);
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const totalCount = await WorkoutSchedule.countDocuments(filter);
    
    // Fetch bookings with pagination
    const bookings = await WorkoutSchedule.find(filter)
      .populate({
        path: 'clientId',
        select: 'userName email profilePicture',
        model: 'User'
      })
      .populate({
        path: 'trainerId',
        select: 'userName email profilePicture',
        model: 'User'
      })
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Calculate booking statistics
    const stats = await calculateBookingStats();
    
    // Format bookings for frontend
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      bookingId: `BK${booking._id.toString().slice(-5)}`,
      clientId: booking.clientId._id,
      clientName: booking.clientId.userName,
      trainerId: booking.trainerId._id,
      trainerName: booking.trainerId.userName,
      bookingDate: booking.createdAt,
      sessionDate: booking.startDate,
      sessionType: booking.sessionType || "One-on-one", // Default if not specified
      duration: booking.duration,
      price: booking.amount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      notes: booking.message,
      location: booking.location || "Gym Location", // Default if not specified
      cancellationReason: booking.cancellationReason,
      isClientVerified: booking.isClientVerified
    }));
    
    res.status(200).json({
      bookings: formattedBookings,
      stats: stats,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).send("Server error: " + error.message);
  }
};

// Helper function to calculate booking statistics
const calculateBookingStats = async () => {
  try {
    // Get current date
    const now = new Date();
    
    // Get counts by status
    const [totalCount, completedCount, upcomingCount, cancelledCount, ongoingCount] = await Promise.all([
      WorkoutSchedule.countDocuments({}),
      WorkoutSchedule.countDocuments({ status: 'completed' }),
      WorkoutSchedule.countDocuments({ status: 'upcoming' }),
      WorkoutSchedule.countDocuments({ status: 'cancelled' }),
      WorkoutSchedule.countDocuments({ status: 'ongoing' })
    ]);
    
    // Calculate total revenue from completed bookings
    const completedBookings = await WorkoutSchedule.find({ 
      status: 'completed',
      paymentStatus: 'paid'
    });
    
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
    
    // Get bookings by month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const bookingsByMonth = await WorkoutSchedule.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { 
            month: { $month: "$createdAt" }, 
            year: { $year: "$createdAt" } 
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);
    
    // Format bookings by month
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedBookingsByMonth = bookingsByMonth.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      count: item.count
    }));
    
    // Get bookings by day of week
    const bookingsByDayOfWeek = await WorkoutSchedule.aggregate([
      {
        $group: {
          _id: { $dayOfWeek: "$startDate" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);
    
    // Format bookings by day of week (MongoDB $dayOfWeek returns 1 for Sunday, 2 for Monday, etc.)
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const formattedBookingsByDayOfWeek = dayNames.map((day, index) => {
      const dayData = bookingsByDayOfWeek.find(item => item._id === index + 1);
      return {
        day,
        count: dayData ? dayData.count : 0
      };
    });
    
    // Get popular trainers
    const popularTrainers = await WorkoutSchedule.aggregate([
      {
        $group: {
          _id: "$trainerId",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "trainerInfo"
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          name: { $arrayElemAt: ["$trainerInfo.userName", 0] }
        }
      }
    ]);
    
    return {
      totalBookings: totalCount,
      completedBookings: completedCount,
      upcomingBookings: upcomingCount,
      cancelledBookings: cancelledCount,
      ongoingBookings: ongoingCount,
      totalRevenue: totalRevenue,
      bookingsByMonth: formattedBookingsByMonth,
      bookingsByStatus: [
        { status: "Completed", count: completedCount },
        { status: "Upcoming", count: upcomingCount },
        { status: "Cancelled", count: cancelledCount },
        { status: "Ongoing", count: ongoingCount }
      ],
      popularTrainers: popularTrainers.map(trainer => ({
        name: trainer.name || `Trainer ${trainer._id}`,
        count: trainer.count
      })),
      bookingsByDayOfWeek: formattedBookingsByDayOfWeek
    };
  } catch (error) {
    console.error("Error calculating booking stats:", error);
    return {
      totalBookings: 0,
      completedBookings: 0,
      upcomingBookings: 0,
      cancelledBookings: 0,
      ongoingBookings: 0,
      totalRevenue: 0,
      bookingsByMonth: [],
      bookingsByStatus: [],
      popularTrainers: [],
      bookingsByDayOfWeek: []
    };
  }
};

// Add this function to get a single booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await WorkoutSchedule.findById(req.params.id)
      .populate({
        path: 'clientId',
        select: 'userName email profilePicture',
        model: 'User'
      })
      .populate({
        path: 'trainerId',
        select: 'userName email profilePicture',
        model: 'User'
      });
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Format booking for frontend
    const formattedBooking = {
      _id: booking._id,
      bookingId: `BK${booking._id.toString().slice(-5)}`,
      clientId: booking.clientId._id,
      clientName: booking.clientId.userName,
      trainerId: booking.trainerId._id,
      trainerName: booking.trainerId.userName,
      bookingDate: booking.createdAt,
      sessionDate: booking.startDate,
      sessionType: booking.sessionType || "One-on-one",
      duration: booking.duration,
      price: booking.amount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      notes: booking.message,
      location: booking.location || "Gym Location",
      cancellationReason: booking.cancellationReason,
      isClientVerified: booking.isClientVerified,
      rating: booking.rating,
      feedback: booking.feedback
    };
    
    res.status(200).json(formattedBooking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).send("Server error: " + error.message);
  }
};

// Add this function to update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    
    const booking = await WorkoutSchedule.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Get the old status for notification purposes
    const oldStatus = booking.status;
    
    booking.status = status;
    
    // If cancelling, optionally add cancellation reason
    if (status === 'cancelled' && req.body.cancellationReason) {
      booking.cancellationReason = req.body.cancellationReason;
    }
    
    await booking.save();
    
    // Handle conversation cleanup if status is changed to completed
    if (oldStatus !== 'completed' && status === 'completed') {
      await chatController.handleWorkoutCompletion(booking._id);
    }
    
    // Send notifications based on status change
    if (oldStatus !== status) {
      try {
        if (status === 'cancelled') {
          // Admin is cancelling the booking, notify both client and trainer
          await notificationController.notifyBookingCancellation(
            booking._id,
            req.user._id, // Admin ID
            booking.clientId // Notify client
          );
          
          await notificationController.notifyBookingCancellation(
            booking._id,
            req.user._id, // Admin ID
            booking.trainerId // Notify trainer
          );
        } else if (status === 'upcoming' || status === 'ongoing') {
          // Status changed to active, notify both parties
          const message = `Your booking status has been updated to ${status}`;
          
          // Create custom notifications for both client and trainer
          await notificationController.createNotification({
            recipient: booking.clientId,
            sender: req.user._id,
            type: 'system',
            title: 'Booking Status Updated',
            message,
            relatedSchedule: booking._id
          });
          
          await notificationController.createNotification({
            recipient: booking.trainerId,
            sender: req.user._id,
            type: 'system',
            title: 'Booking Status Updated',
            message,
            relatedSchedule: booking._id
          });
        }
      } catch (notificationError) {
        console.error("Error sending status update notifications:", notificationError);
        // Continue with the response even if notification fails
      }
    }
    
    res.status(200).json({
      message: `Booking status updated to ${status}`,
      booking
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

exports.getClientTrainers = async (req, res) => {
  try {
    const clientId = req.params.id;
    
    // Get bookings for the client with verified trainers
    const bookings = await WorkoutSchedule.find({
      clientId: clientId,
      isClientVerified: true
    }).populate({
      path: "trainerId",
      select: "userName email profilePicture fitnessGoal location description fitnessLevel rating",
      model: "User",
    });
    
    if (bookings.length === 0) {
      return res.status(404).json({ message: "No trainers found for this client." });
    }
    
    // Create a map to store unique trainers
    const trainersMap = new Map();
    
    bookings.forEach(booking => {
      if (booking.trainerId && !trainersMap.has(booking.trainerId._id.toString())) {
        // Filter bookings for this specific trainer with the current client
        const trainerBookings = bookings.filter(b => 
          b.trainerId && b.trainerId._id.toString() === booking.trainerId._id.toString()
        );
        
        const completedSessions = trainerBookings.filter(b => b.status === "completed").length;
        const upcomingSessions = trainerBookings.filter(b => b.status === "upcoming").length;
        const ongoingSessions = trainerBookings.filter(b => b.status === "ongoing").length;
        
        // Get the last session date
        const completedBookings = trainerBookings.filter(b => b.status === "completed");
        const lastSessionDate = completedBookings.length > 0 
          ? Math.max(...completedBookings.map(b => new Date(b.endDate).getTime()))
          : null;
          
        // Get the next session
        const upcomingBookings = trainerBookings.filter(b => b.status === "upcoming" || b.status === "ongoing");
        let nextSession = null;
        
        if (upcomingBookings.length > 0) {
          nextSession = upcomingBookings.sort((a, b) => 
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          )[0];
        }
        
        trainersMap.set(booking.trainerId._id.toString(), {
          ...booking.trainerId._doc,
          metrics: {
            totalSessions: trainerBookings.length,
            completedSessions,
            upcomingSessions,
            ongoingSessions,
            lastSessionDate: lastSessionDate ? new Date(lastSessionDate) : null,
            nextSession: nextSession ? {
              id: nextSession._id,
              startDate: nextSession.startDate,
              endDate: nextSession.endDate,
              startTime: nextSession.startTime,
              duration: nextSession.duration,
              message: nextSession.message,
              status: nextSession.status
            } : null
          }
        });
      }
    });
    
    // Convert the map to an array
    const clientTrainers = Array.from(trainersMap.values());
    
    res.status(200).json(clientTrainers);
  } catch (error) {
    console.error("Error fetching client trainers:", error);
    res.status(500).send("Server error: " + error.message);
  }
};

exports.getTrainerClients = async (req, res) => {
  try {
    const trainerId = req.params.id;
    
    // Get bookings for the trainer with verified clients
    const bookings = await WorkoutSchedule.find({
      trainerId: trainerId,
      isClientVerified: true
    }).populate({
      path: "clientId",
      select: "userName email profilePicture fitnessGoal location description fitnessLevel",
      model: "User",
    });
    
    if (bookings.length === 0) {
      return res.status(404).json({ message: "No clients found for this trainer." });
    }
    
    // Create a map to store unique clients
    const clientsMap = new Map();
    
    bookings.forEach(booking => {
      if (booking.clientId && !clientsMap.has(booking.clientId._id.toString())) {
        // Filter bookings for this specific client with the current trainer
        const clientBookings = bookings.filter(b => 
          b.clientId && b.clientId._id.toString() === booking.clientId._id.toString()
        );
        
        // Count sessions by status
        const completedSessions = clientBookings.filter(b => b.status === "completed").length;
        const upcomingSessions = clientBookings.filter(b => b.status === "upcoming").length;
        const ongoingSessions = clientBookings.filter(b => b.status === "ongoing").length;
        
        // Get the last session date
        const completedBookings = clientBookings.filter(b => b.status === "completed");
        const lastSessionDate = completedBookings.length > 0 
          ? Math.max(...completedBookings.map(b => new Date(b.endDate).getTime()))
          : null;
          
        // Get the next session
        const upcomingBookings = clientBookings.filter(b => b.status === "upcoming" || b.status === "ongoing");
        let nextSession = null;
        
        if (upcomingBookings.length > 0) {
          nextSession = upcomingBookings.sort((a, b) => 
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          )[0];
        }
        
        clientsMap.set(booking.clientId._id.toString(), {
          ...booking.clientId._doc,
          metrics: {
            totalSessions: clientBookings.length,
            completedSessions,
            upcomingSessions,
            ongoingSessions,
            lastSessionDate: lastSessionDate ? new Date(lastSessionDate) : null,
            nextSession: nextSession ? {
              id: nextSession._id,
              startDate: nextSession.startDate,
              endDate: nextSession.endDate,
              startTime: nextSession.startTime,
              duration: nextSession.duration,
              message: nextSession.message,
              status: nextSession.status
            } : null
          }
        });
      }
    });
    
    // Convert the map to an array
    const trainerClients = Array.from(clientsMap.values());
    
    res.status(200).json(trainerClients);
  } catch (error) {
    console.error("Error fetching trainer clients:", error);
    res.status(500).send("Server error: " + error.message);
  }
};

exports.getBookingProgress = async (req, res) => {
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

    // Get bookings by month
    const monthlyBookings = await WorkoutSchedule.aggregate([
      { 
        $match: { 
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
          // Calculate new bookings (will be updated later)
          newBookings: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ])

    // Create a map for easy lookup
    const bookingsMap = {}
    monthlyBookings.forEach(item => {
      const key = `${item._id.month}/${item._id.year}`
      bookingsMap[key] = {
        newBookings: item.count
      }
    })

    // Calculate cumulative bookings
    let cumulativeCount = 0
    // Get count of bookings created before our start date
    const priorBookingsCount = await WorkoutSchedule.countDocuments({
      createdAt: { $lt: startDate }
    })
    cumulativeCount = priorBookingsCount

    // Combine all data into a consistent format with all months
    const progressData = monthsRange.map(monthData => {
      const key = monthData.key
      const monthStats = bookingsMap[key] || { newBookings: 0 }
      
      // Add this month's new bookings to the cumulative count
      cumulativeCount += monthStats.newBookings

      // Format month name for display
      const date = new Date(monthData.year, monthData.month - 1, 1)
      const monthName = date.toLocaleString('default', { month: 'short' })
      
      return {
        monthYear: key,
        month: monthName,
        year: monthData.year,
        newBookings: monthStats.newBookings,
        totalBookings: cumulativeCount,
        // Add status breakdown if needed
        completed: Math.floor(monthStats.newBookings * 0.6), // Example calculation
        cancelled: Math.floor(monthStats.newBookings * 0.1), // Example calculation
        ongoing: Math.floor(monthStats.newBookings * 0.3)  // Example calculation
      }
    })

    res.status(200).json({
      success: true,
      data: progressData
    })
  } catch (error) {
    console.error("Error fetching booking progress data:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    })
  }
}

// Add this new function to clean up conversations for completed sessions
exports.cleanupCompletedSessions = async (req, res) => {
  try {
    console.log("Starting manual cleanup of completed sessions");
    
    // Find all completed sessions
    const completedSessions = await WorkoutSchedule.find({
      status: "completed"
    });

    console.log(`Found ${completedSessions.length} completed sessions`);

    let cleanedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const session of completedSessions) {
      try {
        console.log(`Processing session ${session._id} for client ${session.clientId} and trainer ${session.trainerId}`);
        const result = await chatController.cleanupConversation(session.clientId, session.trainerId);
        
        if (result) {
          console.log(`Successfully cleaned up conversation for session ${session._id}`);
          cleanedCount++;
        } else {
          console.log(`No cleanup needed for session ${session._id} (likely has active sessions)`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error processing session ${session._id}:`, error);
        errorCount++;
      }
    }

    res.status(200).json({
      message: "Cleanup process completed",
      summary: {
        totalSessions: completedSessions.length,
        cleaned: cleanedCount,
        skipped: skippedCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error("Error in cleanup process:", error);
    res.status(500).json({ 
      message: "Error during cleanup process",
      error: error.message 
    });
  }
};
