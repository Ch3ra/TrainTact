const WorkoutSchedule = require('../../model/AvailabilityModel');
const Conversation = require("../../model/conversationModel");
const User = require('../../model/userModel');

const convertTimeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

exports.createSchedule = async (req, res) => {
    const { clientId, trainerId, startTime, duration, startDate, endDate, message, paymentStatus } = req.body;

    if (!clientId || !trainerId || !startTime || !duration || !startDate || !endDate) {
        return res.status(400).send('Please provide all required fields.');
    }

    try {
        // Convert new booking's time to minutes
        const newStartMinutes = convertTimeToMinutes(startTime);
        const newEndMinutes = newStartMinutes + parseInt(duration, 10);

        // Find all existing bookings for the trainer with overlapping dates
        const existingBookings = await WorkoutSchedule.find({
            trainerId: trainerId,
            $and: [
                { startDate: { $lte: new Date(endDate) } },
                { endDate: { $gte: new Date(startDate) } }
            ]
        });

        // Check each existing booking for time overlap
        for (const existing of existingBookings) {
            const existingStartMinutes = convertTimeToMinutes(existing.startTime);
            const existingEndMinutes = existingStartMinutes + existing.duration;

            if (newStartMinutes < existingEndMinutes && existingStartMinutes < newEndMinutes) {
                return res.status(400).send('Trainer is already booked for this time slot.');
            }
        }

        // Create new schedule if no conflicts
        const schedule = new WorkoutSchedule({
            clientId,
            trainerId,
            startTime,
            duration,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            message,
            paymentStatus 
            
        });

        await schedule.save();
        res.status(201).send('Workout schedule created successfully.');
    } catch (error) {
        res.status(500).send('Server error: ' + error.message);
    }
};

// Get client bookings
exports.getClientBookings = async (req, res) => {
    try {
        const bookings = await WorkoutSchedule.find({ clientId: req.params.id })
            .populate({
                path: 'trainerId',
                select: 'userName email profilePicture fitnessGoal location',
                model: 'User'
            })
            .select("startTime duration startDate endDate message clientId isClientVerified paymentStatus amount");

        if (bookings.length === 0) {
            return res.status(404).send('No bookings found.');
        }
        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching client bookings:", error);
        res.status(500).send('Server error: ' + error.message);
    }
};

// Get trainer bookings
exports.getTrainerBookings = async (req, res) => {
    try {
        const bookings = await WorkoutSchedule.find({ trainerId: req.params.id })
            .populate({
                path: "clientId",
                select: "userName email profilePicture fitnessGoal location",
                model: "User"
            })
            .select("startTime duration startDate endDate message clientId isClientVerified");

        if (bookings.length === 0) {
            return res.status(404).send("No bookings found.");
        }
        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching trainer bookings:", error);
        res.status(500).send("Server error: " + error.message);
    }
};

// Verify booking and create conversation
exports.verifyBooking = async (req, res) => {
    try {
        const booking = await WorkoutSchedule.findById(req.params.bookingId);
        if (!booking) return res.status(404).json({ message: "Booking not found." });

        booking.isClientVerified = true;
        await booking.save();

        const { trainerId, clientId } = booking;
        if (!trainerId || !clientId) {
            return res.status(400).json({ message: "Missing user IDs for conversation." });
        }

        const [trainerExists, clientExists] = await Promise.all([
            User.findById(trainerId),
            User.findById(clientId)
        ]);

        if (!trainerExists || !clientExists) {
            return res.status(404).json({ message: "One or both users not found." });
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

// Delete booking
exports.deleteBooking = async (req, res) => {
    try {
        const deletedBooking = await WorkoutSchedule.findByIdAndDelete(req.params.bookingId);
        if (!deletedBooking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        res.status(200).json({ message: "Booking deleted successfully!", deletedBooking });
    } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).send("Server error: " + error.message);
    }
};