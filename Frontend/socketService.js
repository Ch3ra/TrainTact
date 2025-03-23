import { io } from "socket.io-client"

const SOCKET_URL = "http://localhost:3000"

class SocketService {
  constructor() {
    this.socket = null
    this.userId = null
    this.listeners = new Map()
    this.videoListeners = new Map()
    this.activeCallId = null
  }

  // ==================== Video Call Methods ====================
  initiateVideoCall(data) {
    if (!this.socket) return
    this.socket.emit("initiateVideoCall", data)
  }

  handleVideoCallAccepted(callback) {
    this._addVideoListener("callAccepted", callback)
  }

  acceptCall(data) {
    if (!this.socket) return
    this.socket.emit("acceptCall", data)
  }

  joinVideoCall(callId) {
    if (!this.socket) return
    console.log(`Joining video call room: ${callId} as user ${this.userId}`)
    this.socket.emit("joinVideoCall", { callId, userId: this.userId })
  }

  // Signaling handlers
  handleVideoOffer(callback) {
    this._addVideoListener("offer", (data) => {
      console.log("Received offer signal:", data.from)
      callback(data)
    })
  }

  handleVideoAnswer(callback) {
    this._addVideoListener("answer", (data) => {
      console.log("Received answer signal:", data.from)
      callback(data)
    })
  }

  handleIceCandidate(callback) {
    this._addVideoListener("iceCandidate", (data) => {
      console.log("Received ICE candidate from:", data.from)
      callback(data)
    })
  }

  handleIncomingCall(callback) {
    this._addVideoListener("incomingCall", (data) => {
      console.log("Incoming call from:", data.initiator._id)
      callback(data)
    })
  }

  handleCallRejected(callback) {
    this._addVideoListener("callDeclined", callback)
  }

  handleCallEnded(callback) {
    this._addVideoListener("callEnded", callback)
  }

  // Signaling transmission
  sendSignal(type, data) {
    if (!this.socket) return

    // Ensure from field is always included
    const payload = {
      ...data,
      callId: data.callId || this.activeCallId,
      from: data.from || this.userId,
    }

    console.log(`Sending ${type} signal to: ${data.to || 'call room'}, from: ${payload.from}`)
    this.socket.emit(type, payload)
  }

  endCall(callId) {
    if (!this.socket) return
    console.log(`Ending call: ${callId}`)
    this.socket.emit("endCall", { callId, userId: this.userId })
    this.activeCallId = null
  }

  // ==================== Connection Management ====================
  handleReconnection() {
    if (!this.socket) return

    this.socket.io.on("reconnect", () => {
      console.log("Socket reconnected")
      // Re-register the user
      this.socket.emit("addUser", this.userId)

      // Notify any active calls about the reconnection
      if (this.activeCallId) {
        console.log(`Attempting to reconnect to call: ${this.activeCallId}`)
        this.socket.emit("reconnectCall", {
          callId: this.activeCallId,
          userId: this.userId,
        })
      }
    })
  }

  connect(userId) {
    if (!this.socket) {
      console.log(`Connecting socket for user: ${userId}`)
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
        query: { userId },
        transports: ["websocket"],
      })

      this.userId = userId

      // Core connection events
      this.socket.on("connect", () => {
        console.log("Socket connected, socket ID:", this.socket.id)
        this.socket.emit("addUser", userId)
      })

      this.socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason)
      })

      this.socket.on("connect_error", (err) => {
        console.error("Connection error:", err.message)
      })

      // Add reconnection handling
      this.handleReconnection()
    }
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
      this.userId = null
    }
  }

  // ==================== Message Handling ====================
  sendMessage(messageData) {
    if (!this.socket) return
    this.socket.emit("sendMessage", {
      ...messageData,
      senderId: this.userId,
    })
  }

  onMessage(callback) {
    this._addListener("getMessage", callback)
  }

  // ==================== Typing Indicators ====================
  startTyping(receiverId) {
    if (!this.socket) return
    this.socket.emit("typing", { receiverId })
  }

  stopTyping(receiverId) {
    if (!this.socket) return
    this.socket.emit("stopTyping", { receiverId })
  }

  onTyping(callback) {
    this._addListener("typing", callback)
  }

  // ==================== User Management ====================
  onUsersList(callback) {
    this._addListener("getUsers", callback)
  }

  onNewConversation(callback) {
    this._addListener("newConversation", callback)
  }

  // ==================== Utility Methods ====================
  _addListener(eventName, callback) {
    if (!this.socket) return
    // First remove any existing listener to prevent duplicates
    this.removeListener(eventName)
    
    const listener = (data) => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error handling ${eventName}:`, error)
      }
    }
    this.socket.on(eventName, listener)
    this.listeners.set(eventName, listener)
  }

  _addVideoListener(eventName, callback) {
    if (!this.socket) return
    // First remove any existing listener to prevent duplicates
    this.removeVideoListener(eventName)
    
    const listener = (data) => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error handling video event ${eventName}:`, error)
      }
    }
    this.socket.on(eventName, listener)
    this.videoListeners.set(eventName, listener)
  }

  removeListener(eventName) {
    if (this.socket && this.listeners.has(eventName)) {
      this.socket.off(eventName, this.listeners.get(eventName))
      this.listeners.delete(eventName)
    }
  }

  removeVideoListener(eventName) {
    if (this.socket && this.videoListeners.has(eventName)) {
      this.socket.off(eventName, this.videoListeners.get(eventName))
      this.videoListeners.delete(eventName)
    }
  }

  isConnected() {
    return this.socket?.connected || false
  }

  getSocket() {
    return this.socket
  }

  getUserId() {
    return this.userId
  }

  setActiveCall(callId) {
    console.log(`Setting active call ID to: ${callId}`)
    this.activeCallId = callId
  }
}

// Singleton instance
const socketService = new SocketService()
export default socketService