const express = require('express');
const router = express.Router();
const WorkoutSchedule = require('../model/AvailabilityModel'); 
const Conversation = require("../model/conversationModel");
const User = require('../model/userModel');// Adjust the path as necessary
const clientModel = require('../model/clientModel');

// Endpoint to create a new workout schedule
router.post('/createSchedule', async (req, res) => {
    const { clientId, trainerId, startTime, duration, startDate, endDate, message } = req.body;
    console.log("yo haii yoo", req.body);

    // Validate input
    if (!clientId || !trainerId || !startTime || !duration || !startDate || !endDate) {
        return res.status(400).send('Please provide all required fields.');
    }

    try {
        // Check if there is an existing booking with the same clientId and trainerId
        const existingBooking = await WorkoutSchedule.findOne({
            clientId,
            trainerId,
            startDate: { $lte: new Date(endDate) },  // Ensure there's no overlap based on dates
            endDate: { $gte: new Date(startDate) },  // Ensure there's no overlap based on dates
        });

        if (existingBooking) {
            return res.status(400).send('Booking already exists with this trainer for the selected time period.');
        }

        // Create a new workout schedule
        const schedule = new WorkoutSchedule({
            clientId,
            trainerId,
            startTime,
            duration,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            message
        });

        // Save the workout schedule to the database
        await schedule.save();

        res.status(201).send('Workout schedule created successfully.');
    } catch (error) {
        res.status(500).send('Server error: ' + error.message);
    }
});



router.get('/clientBookings/:id', async (req, res) => {
    const clientId = req.params.id;
    console.log("Fetching bookings for client ID:", clientId);

    try {
        const bookings = await WorkoutSchedule.find({ clientId: clientId })
            .populate({
                path: 'trainerId',
                select: 'userName email profilePicture fitnessGoal location', 
                model: 'User'
            })
            .select("startTime duration startDate endDate message clientId isClientVerified paymentStatus amount"); 

        console.log("Fetched bookings data:", bookings);

        if (bookings.length === 0) {
            return res.status(404).send('No bookings found.');
        }

        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching client bookings:", error);
        res.status(500).send('Server error: ' + error.message);
    }
});







router.get("/trainerBookings/:id", async (req, res) => {
    const trainerId = req.params.id;
    console.log("Fetching bookings for trainer ID:", trainerId);

    try {
        // Fetch bookings and populate client details, including isClientVerified directly from WorkoutSchedule
        const bookings = await WorkoutSchedule.find({ trainerId: trainerId })
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
});

//api is done now we should have to do fetch the client request through the params!

//client id through the token
router.put("/verify/:bookingId", async (req, res) => {
    const { bookingId } = req.params;

    try {
        // Find the booking to get trainerId and clientId
        const booking = await WorkoutSchedule.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        // Update the specific booking (verify client)
        booking.isClientVerified = true;
        await booking.save();

        // Now, create a conversation
        const trainerId = booking.trainerId;
        const clientId = booking.clientId;

        // Validate trainerId and clientId are present
        if (!trainerId || !clientId) {
            return res.status(400).json({ message: "Trainer ID and Client ID are required to create a conversation." });
        }

        // Check if both users exist
        const trainerExists = await User.findById(trainerId);
        const clientExists = await User.findById(clientId);

        if (!trainerExists || !clientExists) {
            return res.status(404).json({ message: "One or both users not found." });
        }

        // Check if a conversation already exists
        const existingConversation = await Conversation.findOne({
            members: { $all: [trainerId, clientId] },
        });

        if (existingConversation) {
            return res.status(200).json({
                message: "Conversation already exists",
                conversation: existingConversation,
            });
        }

        // Create a new conversation if not found
        const newConversation = new Conversation({
            members: [
                trainerId, clientId],
        });

        const savedConversation = await newConversation.save();

        return res.status(201).json({
            message: "Client verified and conversation created successfully!",
            conversation: savedConversation,
        });

    } catch (error) {
        console.error("Error verifying client and creating conversation:", error);
        res.status(500).send("Server error: " + error.message);
    }
});

router.delete("/delete/:bookingId", async (req, res) => {
    const { bookingId } = req.params;

    try {
        // Delete only the specific booking
        const deletedBooking = await WorkoutSchedule.findByIdAndDelete(bookingId);

        if (!deletedBooking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        res.status(200).json({ message: "Booking deleted successfully!", deletedBooking });
    } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).send("Server error: " + error.message);
    }
});











module.exports = router;
