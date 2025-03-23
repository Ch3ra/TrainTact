const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// Middleware and route imports
const authRoutes = require("./routes/authRoute");
const availabilityRoutes = require("./routes/availabilityRoute");
const trainerRoutes = require("./routes/trainerRoute");
const clientRoutes = require("./routes/clientRoute");
const paymentRoutes = require("./routes/paymentRoute");
const chatRoutes = require("./routes/chatRoute");

// Ensure upload folders exist
const paths = ["./uploads/profilePictures", "./uploads/resumes", "./uploads/chat"];
paths.forEach((uploadPath) => {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`Created folder: ${uploadPath}`);
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cors = require("cors");
app.use(cors());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Centralized user management for sockets
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

// Import controllers
const chatController = require("./controller/chatController/chatController");
const videoCallController = require("./controller/chatController/videoCallController");

// Initialize sockets with shared user management
chatController.initializeSocket(io);

// Initialize video call socket with shared user management
videoCallController.initializeVideoSocket(io, users);

// Main Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Take userId and socketId from user
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    // Update socket references in both controllers
    videoCallController.setUsers(users);
    
    io.emit("getUsers", users);
  });

  // User disconnects
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    removeUser(socket.id);
    // Update socket references in both controllers
    videoCallController.setUsers(users);
    
    io.emit("getUsers", users);
  });
});

// Test API to check if server is live or not
app.get("/", (req, res) => {
  res.status(200).json({
    message: "I am alive",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/trainer", trainerRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/video-call", require("./routes/videoCallRoute"));

// Database connection
const { connectDatabase } = require("./database/database");
connectDatabase();

// Start server with Socket.IO
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export io instance for use in other files
module.exports = { io, users };