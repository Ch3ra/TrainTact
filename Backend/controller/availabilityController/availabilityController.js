const WorkoutSchedule = require("../../model/AvailabilityModel")
const Conversation = require("../../model/conversationModel")
const User = require("../../model/userModel")
const cron = require("node-cron")
const notificationController = require("../notification/NotificationController")


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

    // Update 'ongoing' to 'completed' when end date has passed
    const ongoingResult = await WorkoutSchedule.updateMany(
      {
        status: "ongoing",
        endDate: { $lte: now },
      },
      { $set: { status: "completed" } },
    )

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
  const { clientId, trainerId, startTime, duration, startDate, endDate, message, paymentStatus } = req.body

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

    // Create new schedule if no conflicts
    const schedule = new WorkoutSchedule({
      clientId,
      trainerId,
      startTime,
      duration,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      message,
      paymentStatus,
      status: initialStatus,
    })

    await schedule.save()

    // Get client and trainer details for notification
    const [client, trainer] = await Promise.all([User.findById(clientId), User.findById(trainerId)])

    // Create notification for trainer
    if (client && trainer) {
      try {
        console.log("Attempting to create notification for trainer")
        const notificationData = {
          recipient: trainerId,
          sender: clientId,
          type: "schedule_request",
          title: "New Training Request",
          message: `You have a new training request from ${client.userName}! They're excited to train with you starting on ${new Date(startDate).toLocaleDateString()}.`,
          relatedSchedule: schedule._id,
        }

        const notification = await notificationController.createNotification(notificationData)
        console.log("Notification created successfully:", notification ? notification._id : "Failed")
      } catch (error) {
        console.error("Error creating notification:", error)
        // Continue with the response even if notification fails
      }
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

exports.verifyBooking = async (req, res) => {
  try {
    const booking = await WorkoutSchedule.findById(req.params.bookingId)
    if (!booking) return res.status(404).json({ message: "Booking not found." })

    booking.isClientVerified = true
    await booking.save()

    const { trainerId, clientId } = booking
    if (!trainerId || !clientId) {
      return res.status(400).json({ message: "Missing user IDs for conversation." })
    }

    const [trainer, client] = await Promise.all([User.findById(trainerId), User.findById(clientId)])

    if (!trainer || !client) {
      return res.status(404).json({ message: "One or both users not found." })
    }

    // Create notification for client that booking is accepted
    try {
      console.log("Attempting to create acceptance notification for client")
      const notificationData = {
        recipient: clientId,
        sender: trainerId,
        type: "schedule_accepted",
        title: "Training Request Accepted",
        message: `Great news! ${trainer.userName} has accepted your training request. Your session is confirmed and we're looking forward to helping you achieve your fitness goals!`,
        relatedSchedule: booking._id,
      }

      const notification = await notificationController.createNotification(notificationData)
      console.log("Acceptance notification created successfully:", notification ? notification._id : "Failed")
    } catch (error) {
      console.error("Error creating acceptance notification:", error)
      // Continue with the response even if notification fails
    }

    const existingConversation = await Conversation.findOne({
      members: { $all: [trainerId, clientId] },
    })

    if (existingConversation) {
      return res.status(200).json({
        message: "Conversation already exists",
        conversation: existingConversation,
      })
    }

    const newConversation = new Conversation({ members: [trainerId, clientId] })
    const savedConversation = await newConversation.save()

    return res.status(201).json({
      message: "Client verified and conversation created!",
      conversation: savedConversation,
    })
  } catch (error) {
    console.error("Error verifying client:", error)
    res.status(500).send("Server error: " + error.message)
  }
}

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await WorkoutSchedule.findById(req.params.bookingId)
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." })
    }

    // Get client and trainer details for notification
    const [client, trainer] = await Promise.all([User.findById(booking.clientId), User.findById(booking.trainerId)])

    // Create notification about booking deletion
    if (client && trainer) {
      // Determine who is deleting the booking based on the token
      const isClientDeleting = req.user && req.user.id === booking.clientId.toString()

      try {
        console.log("Attempting to create cancellation notification")
        if (isClientDeleting) {
          // Client is cancelling, notify trainer
          const notificationData = {
            recipient: booking.trainerId,
            sender: booking.clientId,
            type: "schedule_cancelled",
            title: "Training Session Cancelled",
            message: `${client.userName} has cancelled the training session scheduled for ${new Date(booking.startDate).toLocaleDateString()}. Please check your schedule for updates.`,
            relatedSchedule: booking._id,
          }

          await notificationController.createNotification(notificationData)
        } else {
          // Trainer is cancelling, notify client
          const notificationData = {
            recipient: booking.clientId,
            sender: booking.trainerId,
            type: "schedule_cancelled",
            title: "Training Session Cancelled",
            message: `${trainer.userName} has cancelled the training session scheduled for ${new Date(booking.startDate).toLocaleDateString()}. Please contact them for more information or to reschedule.`,
            relatedSchedule: booking._id,
          }

          await notificationController.createNotification(notificationData)
        }
        console.log("Cancellation notification created successfully")
      } catch (error) {
        console.error("Error creating cancellation notification:", error)
        // Continue with the response even if notification fails
      }
    }

    const deletedBooking = await WorkoutSchedule.findByIdAndDelete(req.params.bookingId)
    res.status(200).json({ message: "Booking deleted successfully!", deletedBooking })
  } catch (error) {
    console.error("Error deleting booking:", error)
    res.status(500).send("Server error: " + error.message)
  }
}

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

    // Get client and trainer details for notification
    const [client, trainer] = await Promise.all([User.findById(booking.clientId), User.findById(booking.trainerId)])

    // Create notification about booking cancellation
    if (client && trainer) {
      // Determine who is cancelling the booking based on the token
      const isClientCancelling = req.user && req.user.id === booking.clientId.toString()

      try {
        console.log("Attempting to create cancellation notification")
        if (isClientCancelling) {
          // Client is cancelling, notify trainer
          const notificationData = {
            recipient: booking.trainerId,
            sender: booking.clientId,
            type: "schedule_cancelled",
            title: "Training Session Cancelled",
            message: `${client.userName} has cancelled the training session scheduled for ${new Date(booking.startDate).toLocaleDateString()}. Please check your schedule for updates.`,
            relatedSchedule: booking._id,
          }

          await notificationController.createNotification(notificationData)
        } else {
          // Trainer is cancelling, notify client
          const notificationData = {
            recipient: booking.clientId,
            sender: booking.trainerId,
            type: "schedule_cancelled",
            title: "Training Session Cancelled",
            message: `${trainer.userName} has cancelled the training session scheduled for ${new Date(booking.startDate).toLocaleDateString()}. Please contact them for more information or to reschedule.`,
            relatedSchedule: booking._id,
          }

          await notificationController.createNotification(notificationData)
        }
        console.log("Cancellation notification created successfully")
      } catch (error) {
        console.error("Error creating cancellation notification:", error)
        // Continue with the response even if notification fails
      }
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





exports.getClientTrainers = async (req, res) => {
  try {
    const clientId = req.params.id;
    
 
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
    
   
    const trainersMap = new Map();
    
    bookings.forEach(booking => {
      if (booking.trainerId && !trainersMap.has(booking.trainerId._id.toString())) {
 
        const trainerBookings = bookings.filter(b => 
          b.trainerId && b.trainerId._id.toString() === booking.trainerId._id.toString()
        );
        
        const completedSessions = trainerBookings.filter(b => b.status === "completed").length;
        const upcomingSessions = trainerBookings.filter(b => b.status === "upcoming").length;
        const ongoingSessions = trainerBookings.filter(b => b.status === "ongoing").length;
        
     
        const completedBookings = trainerBookings.filter(b => b.status === "completed");
        const lastSessionDate = completedBookings.length > 0 
          ? Math.max(...completedBookings.map(b => new Date(b.endDate).getTime()))
          : null;
          
   
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

