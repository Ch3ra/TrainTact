// src/services/socketService.js
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";

class SocketService {
  socket = null;
  
  // Initialize socket connection
  connect(userId) {
    this.socket = io(SOCKET_URL);

    if (this.socket && userId) {
      // Connect and add user to online users
      this.socket.emit("addUser", userId);

      // Log connection status
      this.socket.on("connect", () => {
        console.log("Socket connected successfully");
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });
    }

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Send a message
  sendMessage(data) {
    if (this.socket) {
      this.socket.emit("sendMessage", data);
    }
  }

  // Start typing event
  startTyping(receiverId) {
    if (this.socket) {
      this.socket.emit("typing", { receiverId });
    }
  }

  // Stop typing event
  stopTyping(receiverId) {
    if (this.socket) {
      this.socket.emit("stopTyping", { receiverId });
    }
  }

  // Add message listener
  onMessage(callback) {
    if (this.socket) {
      this.socket.on("getMessage", callback);
    }
  }

  // Add typing listener
  onTyping(callback) {
    if (this.socket) {
      this.socket.on("typing", callback);
    }
  }

  // Add online users listener
  onUsersList(callback) {
    if (this.socket) {
      this.socket.on("getUsers", callback);
    }
  }

  // Remove specific listener
  removeListener(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // Check if socket is connected
  isConnected() {
    return this.socket?.connected || false;
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;