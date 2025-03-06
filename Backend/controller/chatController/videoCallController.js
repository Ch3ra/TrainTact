// controller/videoCallController/videoCallController.js
const VideoCall = require("../../model/videoCallModel");
const User = require("../../model/userModel");
const Conversation = require("../../model/conversationModel");

let io;
let activeVideoCalls = new Map(); // To track active video calls

// Initialize socket for video calls
const initializeVideoSocket = (socketIo) => {
    io = socketIo;
    
    io.on('connection', (socket) => {
      console.log('User connected to video service:', socket.id);
  
      // User joins a call room
      socket.on("joinVideoCall", ({ callId, userId }) => {
        socket.join(callId);
        console.log(`User ${userId} joined call room: ${callId}`);
        
        // Notify others in the room
        socket.to(callId).emit("userJoined", { userId, socketId: socket.id });
        
        // Add to active calls tracking
        if (!activeVideoCalls.has(callId)) {
          activeVideoCalls.set(callId, new Set());
        }
        activeVideoCalls.get(callId).add(userId);
        
        // Emit the current participants to the joining user
        socket.emit("callParticipants", {
          participants: Array.from(activeVideoCalls.get(callId))
        });
      });
  
      // Regular Video Call Signaling
      socket.on("offer", ({ callId, to, sdp }) => {
        socket.to(callId).emit("offer", {
          from: socket.id,
          sdp
        });
      });
  
      socket.on("answer", ({ callId, to, sdp }) => {
        socket.to(callId).emit("answer", {
          from: socket.id,
          sdp
        });
      });
  
      socket.on("iceCandidate", ({ callId, to, candidate }) => {
        socket.to(callId).emit("iceCandidate", {
          from: socket.id,
          candidate
        });
      });
  
      // Screen Sharing Signaling
      socket.on("screenOffer", ({ callId, to, sdp }) => {
        socket.to(callId).emit("screenOffer", {
          from: socket.id,
          sdp
        });
      });
  
      socket.on("screenAnswer", ({ callId, to, sdp }) => {
        socket.to(callId).emit("screenAnswer", {
          from: socket.id,
          sdp
        });
      });
  
      socket.on("screenIceCandidate", ({ callId, to, candidate }) => {
        socket.to(callId).emit("screenIceCandidate", {
          from: socket.id,
          candidate
        });
      });
  
      // Handle call ending
      socket.on("endCall", async ({ callId, userId }) => {
        try {
          const call = await VideoCall.findOne({ callId });
          if (call) {
            // Stop any active screen share
            if (call.screenShareActive) {
              call.screenShareActive = false;
              call.screenSharer = null;
              await call.save();
              io.to(callId).emit("screenShareStopped", { callId });
            }
  
            call.status = "completed";
            call.endTime = Date.now();
            
            // Calculate duration in seconds
            const durationMs = call.endTime - call.startTime;
            call.duration = Math.floor(durationMs / 1000);
            
            await call.save();
          }
          
          // Notify others in the room
          socket.to(callId).emit("callEnded", { 
            callId, 
            endedBy: userId 
          });
          
          // Remove from active calls
          if (activeVideoCalls.has(callId)) {
            activeVideoCalls.get(callId).delete(userId);
            if (activeVideoCalls.get(callId).size === 0) {
              activeVideoCalls.delete(callId);
            }
          }
          
          // Leave the room
          socket.leave(callId);
          console.log(`User ${userId} left call room: ${callId}`);
        } catch (err) {
          console.error("Error ending call:", err);
        }
      });
  
      // Handle declined call
      socket.on("declineCall", async ({ callId, userId }) => {
        try {
          const call = await VideoCall.findOne({ callId });
          if (call) {
            call.status = "rejected";
            await call.save();
          }
          
          // Notify the initiator
          socket.to(callId).emit("callDeclined", { 
            callId, 
            declinedBy: userId 
          });
        } catch (err) {
          console.error("Error declining call:", err);
        }
      });
  
      // Handle user disconnect
      socket.on("disconnect", () => {
        console.log("User disconnected from video service:", socket.id);
       
      });
    });
  };

// Controller Functions
const initiateVideoCall = async (req, res) => {
  try {
    const { initiatorId, receiverId, conversationId } = req.body;

    if (!initiatorId || !receiverId) {
      return res.status(400).json({ 
        message: "Both initiatorId and receiverId are required" 
      });
    }

    // Verify users exist
    const initiatorExists = await User.findById(initiatorId);
    const receiverExists = await User.findById(receiverId);

    if (!initiatorExists || !receiverExists) {
      return res.status(404).json({ 
        message: "One or both users not found" 
      });
    }

    // Check if there's an existing conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ 
          message: "Conversation not found" 
        });
      }
    } else {
      conversation = await Conversation.findOne({
        members: { $all: [initiatorId, receiverId] }
      });
      
      if (!conversation) {
        // Create new conversation if needed
        const newConversation = new Conversation({
          members: [initiatorId, receiverId]
        });
        conversation = await newConversation.save();
      }
    }

    // Create a unique call ID
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newCall = new VideoCall({
      callId,
      initiator: initiatorId,
      receiver: receiverId,
      status: "initiated"
    });

    const savedCall = await newCall.save();

    // Notify the receiver via socket
    const receiverSocketId = getUser(receiverId)?.socketId;
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", {
        callId,
        initiator: initiatorId,
        conversationId: conversation._id
      });
    }

    return res.status(201).json({
      message: "Video call initiated successfully",
      call: savedCall,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error("Error initiating video call:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCallHistory = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find calls where the user is either initiator or receiver
    const calls = await VideoCall.find({
      $or: [{ initiator: userId }, { receiver: userId }]
    })
    .populate("initiator", "userName email _id profilePicture")
    .populate("receiver", "userName email _id profilePicture")
    .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Call history retrieved successfully",
      calls
    });
  } catch (error) {
    console.error("Error fetching call history:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateCallStatus = async (req, res) => {
  try {
    const { callId, status } = req.body;

    if (!callId || !status) {
      return res.status(400).json({ 
        message: "Call ID and status are required" 
      });
    }

    if (!["ongoing", "completed", "missed", "rejected"].includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status value" 
      });
    }

    const call = await VideoCall.findOne({ callId });
    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }

    call.status = status;
    
    if (status === "completed" && !call.endTime) {
      call.endTime = Date.now();
      // Calculate duration
      const durationMs = call.endTime - call.startTime;
      call.duration = Math.floor(durationMs / 1000);
    }
    
    if (status === "ongoing" && call.status === "initiated") {
      // Reset the start time when the call actually begins
      call.startTime = Date.now();
    }

    await call.save();

    return res.status(200).json({
      message: "Call status updated successfully",
      call
    });
  } catch (error) {
    console.error("Error updating call status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const startScreenShare = async (req, res) => {
    try {
      const { callId, userId } = req.body;
      
      // Validate input
      if (!callId || !userId) {
        return res.status(400).json({ message: "Call ID and user ID are required" });
      }
  
      const call = await VideoCall.findOne({ callId });
      if (!call) {
        return res.status(404).json({ message: "Call not found" });
      }
  
      // Check if user is part of the call
      if (!call.initiator.equals(userId) && !call.receiver.equals(userId)) {
        return res.status(403).json({ message: "User not part of this call" });
      }
  
      // Update screen share status
      call.screenShareActive = true;
      call.screenSharer = userId;
      await call.save();
  
      // Notify all participants in the call
      io.to(callId).emit("screenShareStarted", { 
        sharerId: userId,
        callId
      });
  
      return res.status(200).json({
        message: "Screen sharing started",
        call
      });
    } catch (error) {
      console.error("Error starting screen share:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
  
  const stopScreenShare = async (req, res) => {
    try {
      const { callId } = req.body;
      
      const call = await VideoCall.findOne({ callId });
      if (!call) {
        return res.status(404).json({ message: "Call not found" });
      }
  
      // Reset screen share status
      call.screenShareActive = false;
      call.screenSharer = null;
      await call.save();
  
      // Notify all participants
      io.to(callId).emit("screenShareStopped", { callId });
  
      return res.status(200).json({
        message: "Screen sharing stopped",
        call
      });
    } catch (error) {
      console.error("Error stopping screen share:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };

// Helper function to get user by ID (using the chat controller's users array)
const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

// External users array from chat controller
let users = [];

module.exports = {
    initializeVideoSocket,
    initiateVideoCall,
    getCallHistory,
    updateCallStatus,
    startScreenShare,
    stopScreenShare
  };