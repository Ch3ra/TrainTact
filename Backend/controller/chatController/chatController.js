const Conversation = require("../../model/conversationModel");
const User = require("../../model/userModel");
const Message = require("../../model/messageModel");

let io;

// Initialize socket
const initializeSocket = (socketIo) => {
  io = socketIo;
  
  // Set up socket event handlers
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Add user to online users
    socket.on("addUser", (userId) => {
      addUser(userId, socket.id);
      io.emit("getUsers", users);
    });

    // Send and get message
    socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
      try {
        const user = getUser(receiverId);
        if (user) {
          io.to(user.socketId).emit("getMessage", {
            senderId,
            text,
            createdAt: new Date(),
          });
        }
      } catch (err) {
        console.error("Socket message error:", err);
      }
    });

    // Handle typing status
    socket.on("typing", ({ receiverId }) => {
      const user = getUser(receiverId);
      if (user) {
        io.to(user.socketId).emit("typing", { 
          isTyping: true,
          userId: getReceiverFromSocketId(socket.id)
        });
      }
    });

    socket.on("stopTyping", ({ receiverId }) => {
      const user = getUser(receiverId);
      if (user) {
        io.to(user.socketId).emit("typing", { 
          isTyping: false,
          userId: getReceiverFromSocketId(socket.id)
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      removeUser(socket.id);
      io.emit("getUsers", users);
    });
  });
};

// User management
let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

const getReceiverFromSocketId = (socketId) => {
  const user = users.find(user => user.socketId === socketId);
  return user ? user.userId : null;
};

// Controller functions
const createConversation = async (req, res) => {
  try {
    const { trainerId, clientId } = req.body;

    if (!trainerId || !clientId) {
      return res
        .status(400)
        .json({ message: "Both trainerId and clientId are required" });
    }

    const trainerExists = await User.findById(trainerId);
    const clientExists = await User.findById(clientId);

    if (!trainerExists || !clientExists) {
      return res.status(404).json({ message: "One or both users not found" });
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

    const newConversation = new Conversation({
      members: [trainerId, clientId],
    });

    const savedConversation = await newConversation.save();

    // Notify both users about new conversation
    const trainerSocket = getUser(trainerId);
    const clientSocket = getUser(clientId);

    if (trainerSocket) {
      io.to(trainerSocket.socketId).emit("newConversation", savedConversation);
    }
    if (clientSocket) {
      io.to(clientSocket.socketId).emit("newConversation", savedConversation);
    }

    return res.status(201).json({
      message: "Conversation created successfully",
      conversation: savedConversation,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getConversations = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const userExists = await User.findById(id);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const conversations = await Conversation.find({
      members: id,
    }).populate("members", "userName email _id profilePicture");

    if (!conversations || conversations.length === 0) {
      return res
        .status(404)
        .json({ message: "No conversations found for this user" });
    }

    return res.status(200).json({
      message: "Conversations retrieved successfully",
      conversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body;

    if (!conversationId || !senderId || !text) {
      return res
        .status(400)
        .json({ message: "conversationId, senderId, and text are required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const newMessage = new Message({
      conversation: conversationId,
      sender: senderId,
      text,
    });

    const savedMessage = await newMessage.save();

    // Get receiver ID from conversation members
    const receiverId = conversation.members.find(
      (member) => member.toString() !== senderId
    );

    // Update conversation's lastMessage and set readStatus[receiverId] to false
    conversation.lastMessage = savedMessage._id;

    if (receiverId) {
      conversation.readStatus.set(receiverId.toString(), false);
    }

    await conversation.save();

    // Emit message to receiver through socket
    const receiver = getUser(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", {
        senderId,
        text,
        messageId: savedMessage._id,
        createdAt: savedMessage.createdAt,
      });
    }

    return res.status(201).json({
      message: "Message sent successfully",
      chat: savedMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const getMessages = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: id })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      message: "Messages retrieved successfully",
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    if (!conversationId || !userId) {
      return res.status(400).json({ message: "Conversation ID and User ID are required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Ensure the user is a part of the conversation
    if (!conversation.members.includes(userId)) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Mark all messages in the conversation as read, except messages sent by the user
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: userId }, read: { $ne: true } },
      { $set: { read: true } }
    );

    // Optionally, update the conversation's readBy status (if tracking per user)
    // const userIndex = conversation.readBy.indexOf(userId);
    // if (userIndex === -1) {
    //   conversation.readBy.push(userId);
    //   await conversation.save();
    // }

    return res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


module.exports = {
  initializeSocket,
  createConversation,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getConversations,
};