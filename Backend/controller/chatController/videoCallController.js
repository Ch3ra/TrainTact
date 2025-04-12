// videoCallController.js
const VideoCall = require("../../model/videoCallModel")
const User = require("../../model/userModel")
const Conversation = require("../../model/conversationModel")
const { v4: uuidv4 } = require("uuid")

let io
const activeVideoCalls = new Map()

// Import users array from central user management
let users = []
const setUsers = (updatedUsers) => {
  users = updatedUsers
}

const initializeVideoSocket = (socketIo, sharedUsers) => {
  io = socketIo
  // Set initial users
  users = sharedUsers || []

  io.on("connection", (socket) => {
    console.log("User connected to video service:", socket.id)

    // User joins a call room
    socket.on("joinVideoCall", ({ callId, userId }) => {
      const userIdStr = userId.toString()
      socket.join(callId)
      console.log(`User ${userIdStr} joined call room: ${callId}`)

      // Store userId in socket for later reference
      socket.userId = userIdStr

      // Update active calls tracking
      if (!activeVideoCalls.has(callId)) {
        activeVideoCalls.set(callId, new Set())
      }
      activeVideoCalls.get(callId).add(userIdStr)

      // Notify others in the room
      socket.to(callId).emit("userJoined", {
        userId: userIdStr,
        socketId: socket.id,
      })

      // Send current participants to the joining user
      socket.emit("callParticipants", {
        participants: Array.from(activeVideoCalls.get(callId)),
      })
    })

    // Regular Video Call Signaling - FIXED to include 'from' in all events
    socket.on("offer", ({ callId, to, sdp, from }) => {
      console.log(`Relaying offer from ${from || socket.id} to call room ${callId}`, {
        offerSDP: sdp.type,
        toRoom: callId,
        participants: activeVideoCalls.get(callId)?.size || 0,
      })
      socket.to(callId).emit("offer", {
        from: from || socket.id,
        sdp,
      })
    })

    socket.on("answer", ({ callId, to, sdp, from }) => {
      console.log(`Relaying answer from ${from || socket.id} to call room ${callId}`, {
        answerSDP: sdp.type,
        toRoom: callId,
        participants: activeVideoCalls.get(callId)?.size || 0,
      })
      socket.to(callId).emit("answer", {
        from: from || socket.id,
        sdp,
      })
    })

    socket.on("iceCandidate", ({ callId, to, candidate, from }) => {
      console.log(`Relaying ICE candidate from ${from || socket.id} to call room ${callId}`)
      socket.to(callId).emit("iceCandidate", {
        from: from || socket.id,
        candidate,
      })
    })

    // Screen Sharing Signaling - FIXED to include 'from' in all events
    socket.on("screenOffer", ({ callId, to, sdp, from }) => {
      console.log(`Relaying screen offer from ${from || socket.id} to call room ${callId}`)
      socket.to(callId).emit("screenOffer", {
        from: from || socket.id,
        sdp,
      })
    })

    socket.on("screenAnswer", ({ callId, to, sdp, from }) => {
      console.log(`Relaying screen answer from ${from || socket.id} to call room ${callId}`)
      socket.to(callId).emit("screenAnswer", {
        from: from || socket.id,
        sdp,
      })
    })

    socket.on("screenIceCandidate", ({ callId, to, candidate, from }) => {
      console.log(`Relaying screen ICE candidate from ${from || socket.id} to call room ${callId}`)
      socket.to(callId).emit("screenIceCandidate", {
        from: from || socket.id,
        candidate,
      })
    })

    // Handle reconnection attempts
    socket.on("reconnectCall", ({ callId, userId }) => {
      console.log(`User ${userId} attempting to reconnect to call ${callId}`)
      // Notify others in the room about reconnection attempt
      socket.to(callId).emit("peerReconnecting", {
        userId: userId.toString(),
        socketId: socket.id,
      })
    })

    // Improve the declineCall handler to ensure proper cleanup on both sides
    socket.on("declineCall", async ({ callId, userId }) => {
      try {
        console.log(`User ${userId} declined call ${callId}`)

        const call = await VideoCall.findOne({ callId })
        if (call) {
          call.status = "rejected"
          call.endTime = Date.now()
          const durationMs = call.endTime - call.startTime
          call.duration = Math.floor(durationMs / 1000)
          await call.save()

          // IMPORTANT: Broadcast to ALL clients, including the sender
          io.emit("callDeclined", {
            callId,
            declinedBy: userId,
          })

          // Also send to the specific call room
          io.to(callId).emit("callDeclined", {
            callId,
            declinedBy: userId,
          })

          // Also send releaseMediaResources command
          io.emit("releaseMediaResources", {
            callId,
          })

          // Find and notify the initiator directly
          const initiatorId = call.initiator.toString()
          const initiatorSocket = users.find((u) => u.userId === initiatorId)?.socketId

          if (initiatorSocket) {
            console.log(`Sending direct callDeclined event to initiator socket: ${initiatorSocket}`)
            io.to(initiatorSocket).emit("callDeclined", {
              callId,
              declinedBy: userId,
            })

            // Also send a direct releaseMediaResources command to the initiator
            io.to(initiatorSocket).emit("releaseMediaResources", {
              callId,
            })

            // Send broadcast event to ensure initiator receives it
            io.to(initiatorSocket).emit("broadcastCallDeclined", {
              callId,
              declinedBy: userId,
            })

            // Force the initiator to leave the call room
            io.to(initiatorSocket).emit("forceLeaveCall", {
              callId,
            })
          }

          // Find and notify the receiver directly
          const receiverId = call.receiver.toString()
          const receiverSocket = users.find((u) => u.userId === receiverId)?.socketId

          if (receiverSocket) {
            console.log(`Sending direct callDeclined event to receiver socket: ${receiverSocket}`)
            io.to(receiverSocket).emit("callDeclined", {
              callId,
              declinedBy: userId,
            })

            // Also send a direct releaseMediaResources command to the receiver
            io.to(receiverSocket).emit("releaseMediaResources", {
              callId,
            })

            // Send broadcast event to ensure receiver receives it
            io.to(receiverSocket).emit("broadcastCallDeclined", {
              callId,
              declinedBy: userId,
            })

            // Force the receiver to leave the call room
            io.to(receiverSocket).emit("forceLeaveCall", {
              callId,
            })
          }

          // Block any new incoming calls with the same ID
          activeVideoCalls.delete(callId)

          // Broadcast to all connected clients to ensure everyone gets notified
          io.emit("broadcastCallDeclined", {
            callId,
            declinedBy: userId,
          })

          // Remove all sockets from the call room
          const room = io.sockets.adapter.rooms.get(callId)
          if (room) {
            for (const socketId of room) {
              io.sockets.sockets.get(socketId)?.leave(callId)
            }
          }
        }
      } catch (err) {
        console.error("Error handling call decline:", err)
      }
    })

    // Add handler for explicit call room leave
    socket.on("leaveCall", ({ callId, userId }) => {
      console.log(`User ${userId} leaving call room: ${callId}`)
      socket.leave(callId)
    })

    // Improve the endCall handler to ensure proper cleanup
    socket.on("endCall", async ({ callId, userId }) => {
      try {
        const call = await VideoCall.findOne({ callId })
        if (call) {
          // Stop any active screen share
          if (call.screenShareActive) {
            call.screenShareActive = false
            call.screenSharer = null
            await call.save()
            io.to(callId).emit("screenShareStopped", { callId })
          }

          // Update call status - check if it's a decline or normal end
          const isDeclined = call.status === "ringing"
          call.status = isDeclined ? "rejected" : "completed"
          call.endTime = Date.now()

          // Calculate duration in seconds
          const durationMs = call.endTime - call.startTime
          call.duration = Math.floor(durationMs / 1000)

          await call.save()

          // If call was declined, send specific event to EVERYONE, not just the room
          if (isDeclined) {
            // Broadcast to all connected clients to ensure initiator gets it
            io.emit("callDeclined", {
              callId,
              declinedBy: userId,
            })

            // Find the initiator's socket to send a direct message
            const initiatorId = call.initiator.toString()
            const initiatorSocket = users.find((u) => u.userId === initiatorId)?.socketId

            if (initiatorSocket) {
              console.log(`Sending direct callDeclined event to initiator socket: ${initiatorSocket}`)
              io.to(initiatorSocket).emit("callDeclined", {
                callId,
                declinedBy: userId,
              })

              // Also send a direct releaseMediaResources command
              io.to(initiatorSocket).emit("releaseMediaResources", {
                callId,
              })
            }

            // Find the receiver's socket to send a direct message
            const receiverId = call.receiver.toString()
            const receiverSocket = users.find((u) => u.userId === receiverId)?.socketId

            if (receiverSocket) {
              console.log(`Sending direct callDeclined event to receiver socket: ${receiverSocket}`)
              io.to(receiverSocket).emit("callDeclined", {
                callId,
                declinedBy: userId,
              })

              // Also send a direct releaseMediaResources command to the receiver
              io.to(receiverSocket).emit("releaseMediaResources", {
                callId,
              })
            }
          } else {
            // Regular call end - broadcast to everyone
            io.emit("callEnded", {
              callId,
              endedBy: userId,
            })

            // Also send to the specific room
            io.to(callId).emit("callEnded", {
              callId,
              endedBy: userId,
            })
          }

          // Block any new incoming calls with the same ID by removing it from active calls
          activeVideoCalls.delete(callId)
        }

        // Send an explicit command to all clients to release media resources
        io.emit("releaseMediaResources", {
          callId,
        })

        // Remove from active calls
        if (activeVideoCalls.has(callId)) {
          activeVideoCalls.get(callId).delete(userId.toString())
          if (activeVideoCalls.get(callId).size === 0) {
            activeVideoCalls.delete(callId)
          }
        }

        // Leave the room
        socket.leave(callId)
        console.log(`User ${userId} left call room: ${callId}`)
      } catch (err) {
        console.error("Error ending call:", err)
      }
    })

    // Add a new handler for the disconnect event to ensure cleanup
    socket.on("disconnect", async () => {
      console.log("User disconnected from video service:", socket.id)

      // Find all calls this user is part of
      for (const [callId, participants] of activeVideoCalls.entries()) {
        if (socket.userId && participants.has(socket.userId)) {
          // Notify others in the room about disconnection
          socket.to(callId).emit("peerDisconnected", {
            userId: socket.userId,
            socketId: socket.id,
          })

          // Send an explicit command to release media resources
          socket.to(callId).emit("releaseMediaResources", {
            callId,
            userId: socket.userId,
          })

          // Don't remove from participants yet to allow for reconnection
          // Instead, set a timeout to remove if they don't reconnect
          setTimeout(async () => {
            const stillActive = Array.from(io.sockets.adapter.rooms.get(callId) || []).some((sid) => {
              const s = io.sockets.sockets.get(sid)
              return s && s.userId === socket.userId
            })

            if (!stillActive) {
              // User didn't reconnect, remove from participants
              participants.delete(socket.userId)
              if (participants.size === 0) {
                activeVideoCalls.delete(callId)

                // Update call record
                try {
                  const call = await VideoCall.findOne({ callId })
                  if (call && call.status === "ongoing") {
                    call.status = "completed"
                    call.endTime = Date.now()
                    const durationMs = call.endTime - call.startTime
                    call.duration = Math.floor(durationMs / 1000)
                    await call.save()
                  }
                } catch (err) {
                  console.error("Error updating call on disconnect:", err)
                }
              }
            }
          }, 30000) // 30 seconds to reconnect
        }
      }
    })
  })
}

// Add a function to check if a call is active before allowing a new one
const initiateVideoCall = async (req, res) => {
  try {
    const { initiatorId, receiverId, conversationId } = req.body

    // Validate input
    if (!initiatorId || !receiverId) {
      return res.status(400).json({
        message: "Both initiatorId and receiverId are required",
      })
    }

    if (initiatorId === receiverId) {
      return res.status(400).json({
        message: "Cannot start call with yourself",
      })
    }

    // Check if either user is already in an active call
    const initiatorInCall = Array.from(activeVideoCalls.values()).some((participants) =>
      participants.has(initiatorId.toString()),
    )

    const receiverInCall = Array.from(activeVideoCalls.values()).some((participants) =>
      participants.has(receiverId.toString()),
    )

    if (initiatorInCall) {
      return res.status(400).json({
        message: "You are already in an active call",
      })
    }

    if (receiverInCall) {
      return res.status(400).json({
        message: "Receiver is already in an active call",
      })
    }

    // Verify users exist
    const [initiator, receiver] = await Promise.all([
      User.findById(initiatorId).select("userName profilePicture"),
      User.findById(receiverId),
    ])

    if (!initiator || !receiver) {
      return res.status(404).json({
        message: "One or both users not found",
      })
    }

    // Find or create conversation
    let conversation
    if (conversationId) {
      conversation = await Conversation.findById(conversationId)
      if (!conversation || !conversation.members.includes(receiverId)) {
        return res.status(403).json({
          message: "Invalid conversation for these users",
        })
      }
    } else {
      conversation = await Conversation.findOne({
        members: { $all: [initiatorId, receiverId] },
      })

      if (!conversation) {
        conversation = await Conversation.create({
          members: [initiatorId, receiverId],
          lastMessage: "Video call started",
        })
      }
    }

    // Generate unique call ID
    const callId = `vidcall_${uuidv4()}`

    // Create call record
    const newCall = new VideoCall({
      callId,
      initiator: initiatorId,
      receiver: receiverId,
      status: "ringing",
      startTime: Date.now(),
    })

    const savedCall = await newCall.save()

    // Check receiver online status using connected users array
    const receiverIdStr = receiverId.toString()
    const isReceiverOnline = users.some((user) => user.userId === receiverIdStr)

    if (!isReceiverOnline) {
      await VideoCall.findByIdAndUpdate(savedCall._id, {
        status: "missed",
        endTime: Date.now(),
      })
      return res.status(200).json({
        message: "Receiver is offline",
        call: savedCall,
      })
    }

    // Find receiver's socket ID from connected users
    const receiverUser = users.find((user) => user.userId === receiverIdStr)
    const receiverSocketId = receiverUser?.socketId

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", {
        callId,
        initiator: {
          _id: initiator._id,
          name: initiator.userName,
          profilePicture: initiator.profilePicture,
        },
        conversationId: conversation._id,
        timestamp: Date.now(),
      })
    }

    return res.status(201).json({
      message: "Call initiated successfully",
      call: {
        ...savedCall.toObject(),
        initiatorDetails: {
          name: initiator.userName,
          profilePicture: initiator.profilePicture,
        },
      },
      conversationId: conversation._id,
    })
  } catch (error) {
    console.error("Error initiating video call:", error)
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    })
  }
}

const getCallHistory = async (req, res) => {
  try {
    const userId = req.params.id

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" })
    }

    // Find calls where the user is either initiator or receiver
    const calls = await VideoCall.find({
      $or: [{ initiator: userId }, { receiver: userId }],
    })
      .populate("initiator", "userName email _id profilePicture")
      .populate("receiver", "userName email _id profilePicture")
      .sort({ createdAt: -1 })

    return res.status(200).json({
      message: "Call history retrieved successfully",
      calls,
    })
  } catch (error) {
    console.error("Error fetching call history:", error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}

const updateCallStatus = async (req, res) => {
  try {
    const { callId, status } = req.body

    if (!callId || !status) {
      return res.status(400).json({
        message: "Call ID and status are required",
      })
    }

    if (!["ongoing", "completed", "missed", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
      })
    }

    const call = await VideoCall.findOne({ callId })
    if (!call) {
      return res.status(404).json({ message: "Call not found" })
    }

    call.status = status

    if (status === "completed" && !call.endTime) {
      call.endTime = Date.now()
      // Calculate duration
      const durationMs = call.endTime - call.startTime
      call.duration = Math.floor(durationMs / 1000)
    }

    if (status === "ongoing" && call.status === "ringing") {
      // Reset the start time when the call actually begins
      call.startTime = Date.now()
    }

    await call.save()

    return res.status(200).json({
      message: "Call status updated successfully",
      call,
    })
  } catch (error) {
    console.error("Error updating call status:", error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}

const startScreenShare = async (req, res) => {
  try {
    const { callId, userId } = req.body

    // Validate input
    if (!callId || !userId) {
      return res.status(400).json({ message: "Call ID and user ID are required" })
    }

    const call = await VideoCall.findOne({ callId })
    if (!call) {
      return res.status(404).json({ message: "Call not found" })
    }

    // Check if user is part of the call
    if (!call.initiator.equals(userId) && !call.receiver.equals(userId)) {
      return res.status(403).json({ message: "User not part of this call" })
    }

    // Update screen share status
    call.screenShareActive = true
    call.screenSharer = userId
    await call.save()

    // Notify all participants in the call
    io.to(callId).emit("screenShareStarted", {
      sharerId: userId,
      callId,
    })

    return res.status(200).json({
      message: "Screen sharing started",
      call,
    })
  } catch (error) {
    console.error("Error starting screen share:", error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}

const stopScreenShare = async (req, res) => {
  try {
    const { callId } = req.body

    const call = await VideoCall.findOne({ callId })
    if (!call) {
      return res.status(404).json({ message: "Call not found" })
    }

    // Reset screen share status
    call.screenShareActive = false
    call.screenSharer = null
    await call.save()

    io.to(callId).emit("screenShareStopped", { callId })

    return res.status(200).json({
      message: "Screen sharing stopped",
      call,
    })
  } catch (error) {
    console.error("Error stopping screen share:", error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}

const getUser = (userId) => {
  return users.find((user) => user.userId === userId)
}

module.exports = {
  initializeVideoSocket,
  initiateVideoCall,
  getCallHistory,
  updateCallStatus,
  startScreenShare,
  stopScreenShare,
  setUsers,
}
