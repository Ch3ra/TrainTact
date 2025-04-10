import { io } from "socket.io-client"

const SOCKET_URL = "http://localhost:3000"

class SocketService {
  constructor() {
    this.socket = null
    this.userId = null
    this.listeners = new Map()
    this.videoListeners = new Map()
    this.activeCallId = null
    this.notificationListeners = new Map()
    this.baseUrl = "http://localhost:3000" // Add base URL for consistent file paths
    this.pendingSignals = new Map() // Track pending signals to avoid duplicates
    this.signalTimeouts = new Map() // Track timeouts for signals
  }

  // ==================== Notification Methods ====================
  onNewNotification(callback) {
    this._addNotificationListener("newNotification", callback)
    // Also listen for the alternative event name
    this._addNotificationListener("getNotification", callback)
  }

  sendNotification(data) {
    if (!this.socket) return
    this.socket.emit("sendNotification", data)
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

      // Deduplicate answers - only process each answer once
      const signalId = `answer-${data.from}-${Date.now()}`
      if (this.pendingSignals.has(signalId)) {
        console.log("Ignoring duplicate answer signal")
        return
      }

      this.pendingSignals.set(signalId, true)

      // Clear the signal after processing
      setTimeout(() => {
        this.pendingSignals.delete(signalId)
      }, 5000)

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

  // Signaling transmission with debouncing and deduplication
  sendSignal(type, data) {
    if (!this.socket) return

    // Ensure from field is always included
    const payload = {
      ...data,
      callId: data.callId || this.activeCallId,
      from: data.from || this.userId,
    }

    // Create a unique ID for this signal to prevent duplicates
    const signalId = `${type}-${payload.to}-${Date.now()}`

    // Clear any existing timeout for this signal type
    if (this.signalTimeouts.has(type)) {
      clearTimeout(this.signalTimeouts.get(type))
    }

    // Set a new timeout to debounce rapid signals of the same type
    this.signalTimeouts.set(
      type,
      setTimeout(
        () => {
          console.log(`Sending ${type} signal to: ${data.to || "call room"}, from: ${payload.from}`)
          this.socket.emit(type, payload)
          this.signalTimeouts.delete(type)
        },
        type === "iceCandidate" ? 0 : 100,
      ),
    ) // No delay for ICE candidates, small delay for others
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
    this._addListener("getMessage", (data) => {
      // Ensure file URLs are properly formatted
      if (data.files && data.files.length > 0) {
        data.files = data.files.map((file) => {
          if (file.url && !file.url.startsWith("http")) {
            file.url = `${this.baseUrl}/${file.path || file.url.replace(/^\//, "")}`
          }
          return file
        })
      }
      callback(data)
    })
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

  _addNotificationListener(eventName, callback) {
    if (!this.socket) return
    // First remove any existing listener to prevent duplicates
    this.removeNotificationListener(eventName)

    const listener = (data) => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error handling notification event ${eventName}:`, error)
      }
    }
    this.socket.on(eventName, listener)
    this.notificationListeners.set(eventName, listener)
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

  removeNotificationListener(eventName) {
    if (this.socket && this.notificationListeners.has(eventName)) {
      this.socket.off(eventName, this.notificationListeners.get(eventName))
      this.notificationListeners.delete(eventName)
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
