const Conversation = require("../../model/conversationModel")
const User = require("../../model/userModel")
const Message = require("../../model/messageModel")
const fs = require("fs")
const path = require("path")
const WorkoutSchedule = require("../../model/AvailabilityModel")

let io

// Initialize socket
const initializeSocket = (socketIo) => {
  io = socketIo

  // Set up socket event handlers
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    // Add user to online users
    socket.on("addUser", (userId) => {
      addUser(userId, socket.id)
      io.emit("getUsers", users)
    })

    // Send and get message
    socket.on("sendMessage", async ({ senderId, receiverId, text, files }) => {
      try {
        const user = getUser(receiverId)
        if (user) {
          // Transform files to include full URLs before sending through socket
          const filesWithUrls = files
            ? files.map((file) => {
                // Ensure URL is absolute
                if (file.url && !file.url.startsWith("http")) {
                  const baseUrl = `${socket.request.headers["x-forwarded-proto"] || "http"}://${socket.request.headers.host}`
                  return {
                    ...file,
                    url: `${baseUrl}/${file.path || file.url.replace(/^\//, "")}`,
                  }
                }
                return file
              })
            : []

          io.to(user.socketId).emit("getMessage", {
            senderId,
            text,
            files: filesWithUrls,
            createdAt: new Date(),
          })
        }
      } catch (err) {
        console.error("Socket message error:", err)
      }
    })

    // Handle typing status
    socket.on("typing", ({ receiverId }) => {
      const user = getUser(receiverId)
      if (user) {
        io.to(user.socketId).emit("typing", {
          isTyping: true,
          userId: getReceiverFromSocketId(socket.id),
        })
      }
    })

    socket.on("stopTyping", ({ receiverId }) => {
      const user = getUser(receiverId)
      if (user) {
        io.to(user.socketId).emit("typing", {
          isTyping: false,
          userId: getReceiverFromSocketId(socket.id),
        })
      }
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id)
      removeUser(socket.id)
      io.emit("getUsers", users)
    })
  })
}

// User management
let users = []

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) && users.push({ userId, socketId })
}

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId)
}

const getUser = (userId) => {
  return users.find((user) => user.userId === userId)
}

const getReceiverFromSocketId = (socketId) => {
  const user = users.find((user) => user.socketId === socketId)
  return user ? user.userId : null
}

// Controller functions
const createConversation = async (req, res) => {
  try {
    const { trainerId, clientId } = req.body

    if (!trainerId || !clientId) {
      return res.status(400).json({ message: "Both trainerId and clientId are required" })
    }

    const trainerExists = await User.findById(trainerId)
    const clientExists = await User.findById(clientId)

    if (!trainerExists || !clientExists) {
      return res.status(404).json({ message: "One or both users not found" })
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

    const newConversation = new Conversation({
      members: [trainerId, clientId],
    })

    const savedConversation = await newConversation.save()

    // Notify both users about new conversation
    const trainerSocket = getUser(trainerId)
    const clientSocket = getUser(clientId)

    if (trainerSocket) {
      io.to(trainerSocket.socketId).emit("newConversation", savedConversation)
    }
    if (clientSocket) {
      io.to(clientSocket.socketId).emit("newConversation", savedConversation)
    }

    return res.status(201).json({
      message: "Conversation created successfully",
      conversation: savedConversation,
    })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}

const getConversations = async (req, res) => {
  try {
    const id = req.params.id

    if (!id) {
      return res.status(400).json({ message: "User ID is required" })
    }

    const userExists = await User.findById(id)
    if (!userExists) {
      return res.status(404).json({ message: "User not found" })
    }

    const conversations = await Conversation.find({
      members: id,
    })
      .populate("members", "userName email _id profilePicture")
      .populate("lastMessage")

    if (!conversations || conversations.length === 0) {
      return res.status(404).json({ message: "No conversations found for this user" })
    }

    return res.status(200).json({
      message: "Conversations retrieved successfully",
      conversations,
    })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}

const sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body
    const files = req.files || []

    // Validate either text or files must be present
    if ((!text || text.trim() === "") && files.length === 0) {
      return res.status(400).json({
        message: "Either text or file is required",
      })
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" })
    }

    // Handle file attachments with normalized paths
    const fileAttachments = files.map((file) => ({
      filename: file.originalname,
      path: file.path.replace(/\\/g, "/"), // Normalize path (replace Windows backslashes)
      mimetype: file.mimetype,
    }))

    const newMessage = new Message({
      conversation: conversationId,
      sender: senderId,
      text: text || "",
      file: fileAttachments,
    })

    const savedMessage = await newMessage.save()

    // Update conversation
    conversation.lastMessage = savedMessage._id
    const receiverId = conversation.members.find((member) => member.toString() !== senderId)

    if (receiverId) {
      conversation.readStatus.set(receiverId.toString(), false)
    }
    await conversation.save()

    // Prepare files with full URLs for response and socket
    const baseUrl = `${req.protocol}://${req.get("host")}`
    const filesWithUrls = savedMessage.file.map((file) => ({
      ...file.toObject(),
      url: `${baseUrl}/${file.path}`,
    }))

    // Emit message with file info
    const receiver = getUser(receiverId)
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", {
        senderId,
        text: text || "",
        files: filesWithUrls,
        messageId: savedMessage._id,
        createdAt: savedMessage.createdAt,
      })
    }

    // Transform response to include URLs
    const responseMessage = savedMessage.toObject()
    responseMessage.file = filesWithUrls

    return res.status(201).json({
      message: "Message sent successfully",
      chat: responseMessage,
    })
  } catch (error) {
    console.error("Error sending message:", error)

    // Clean up any uploaded files if message creation fails
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting file:", err)
        })
      })
    }

    return res.status(500).json({ message: "Internal Server Error" })
  }
}

const getMessages = async (req, res) => {
  try {
    const id = req.params.id

    if (!id) {
      return res.status(400).json({ message: "Conversation ID is required" })
    }

    const conversation = await Conversation.findById(id)
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" })
    }

    const messages = await Message.find({ conversation: id })
      .populate("sender", "name email profilePicture")
      .sort({ createdAt: 1 })

    // Transform messages to include full URLs for files
    const baseUrl = `${req.protocol}://${req.get("host")}`
    const messagesWithUrls = messages.map((message) => {
      const msg = message.toObject()
      if (msg.file && msg.file.length > 0) {
        msg.file = msg.file.map((file) => ({
          ...file,
          url: `${baseUrl}/${file.path}`,
        }))
      }
      return msg
    })

    return res.status(200).json({
      message: "Messages retrieved successfully",
      messages: messagesWithUrls,
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}

const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId, userId } = req.body

    if (!conversationId || !userId) {
      return res.status(400).json({ message: "Conversation ID and User ID are required" })
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" })
    }

    // Ensure the user is a part of the conversation
    if (!conversation.members.some((member) => member.toString() === userId)) {
      return res.status(403).json({ message: "Unauthorized access" })
    }

    // Mark all messages in the conversation as read, except messages sent by the user
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: userId }, read: { $ne: true } },
      { $set: { read: true } },
    )

    // Update conversation read status
    conversation.readStatus.set(userId, true)
    await conversation.save()

    return res.status(200).json({ message: "Messages marked as read" })
  } catch (error) {
    console.error("Error marking messages as read:", error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}

// Delete message function (optional)
const deleteMessage = async (req, res) => {
  try {
    const { messageId, userId } = req.params

    const message = await Message.findById(messageId)
    if (!message) {
      return res.status(404).json({ message: "Message not found" })
    }

    // Check if user is the sender of the message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized: Not the sender of this message" })
    }

    // Delete associated files if they exist
    if (message.file && message.file.length > 0) {
      message.file.forEach((fileObj) => {
        fs.unlink(fileObj.path, (err) => {
          if (err) console.error("Error deleting file:", err)
        })
      })
    }

    await Message.findByIdAndDelete(messageId)

    return res.status(200).json({ message: "Message deleted successfully" })
  } catch (error) {
    console.error("Error deleting message:", error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}

// Function to handle workout completion and conversation cleanup
const handleWorkoutCompletion = async (workoutId) => {
  try {
    const workout = await WorkoutSchedule.findById(workoutId);
    if (!workout) {
      console.log(`Workout ${workoutId} not found`);
      return false;
    }

    if (workout.status === 'completed') {
      const result = await cleanupConversation(workout.clientId, workout.trainerId);
      return result;
    }
    return false;
  } catch (error) {
    console.error("Error handling workout completion:", error);
    return false;
  }
};

// Function to check if there are any active sessions between client and trainer
const hasActiveSessions = async (clientId, trainerId) => {
  try {
    console.log(`Checking active sessions for client ${clientId} and trainer ${trainerId}`);
    
    const activeSessions = await WorkoutSchedule.find({
      clientId,
      trainerId,
      status: { $in: ['upcoming', 'ongoing'] }
    });

    console.log(`Found ${activeSessions.length} active sessions`);
    if (activeSessions.length > 0) {
      console.log('Active sessions:', activeSessions.map(s => ({
        id: s._id,
        status: s.status,
        startDate: s.startDate,
        endDate: s.endDate
      })));
    }

    return activeSessions.length > 0;
  } catch (error) {
    console.error("Error checking active sessions:", error);
    return false;
  }
};

// Function to remove conversation if no active sessions exist
const cleanupConversation = async (clientId, trainerId) => {
  try {
    console.log(`Attempting to cleanup conversation for client ${clientId} and trainer ${trainerId}`);
    
    const hasActive = await hasActiveSessions(clientId, trainerId);
    console.log(`Has active sessions: ${hasActive}`);

    if (!hasActive) {
      // Find and delete the conversation
      const conversation = await Conversation.findOne({
        members: { $all: [clientId, trainerId] }
      });

      if (conversation) {
        console.log(`Found conversation to delete: ${conversation._id}`);
        
        // Delete all messages in the conversation
        const messageResult = await Message.deleteMany({ conversation: conversation._id });
        console.log(`Deleted ${messageResult.deletedCount} messages`);
        
        // Delete the conversation
        await Conversation.findByIdAndDelete(conversation._id);
        console.log(`Conversation ${conversation._id} removed successfully`);
        return true;
      } else {
        console.log('No conversation found to delete');
      }
    }
    return false;
  } catch (error) {
    console.error("Error cleaning up conversation:", error);
    return false;
  }
};

module.exports = {
  initializeSocket,
  createConversation,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getConversations,
  deleteMessage,
  handleWorkoutCompletion,
}
