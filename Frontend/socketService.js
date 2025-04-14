import io from "socket.io-client"

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

  connect(userId) {
    if (!this.socket) {
      this.socket = io("http://localhost:3000", {
        query: { userId },
      })

      this.userId = userId

      this.socket.on("connect", () => {
        console.log("Socket connected")
        this.socket.emit("addUser", userId)
      })

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
      })
    }

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.userId = null
    }
  }

  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on("newNotification", callback)
      this.socket.on("getNotification", callback) // For backward compatibility
    }
  }

  removeNotificationListener(event) {
    if (this.socket) {
      this.socket.off(event)
    }
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

  // Improve the handleCallRejected method to ensure proper cleanup
  handleCallRejected(callback) {
    this._addVideoListener("callDeclined", (data) => {
      console.log("Call declined event received:", data)
      // Ensure we release media resources
      if (this.socket) {
        this.socket.emit("releaseMediaResources", { callId: data.callId || this.activeCallId })
      }
      callback(data)
    })
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

  // Add a method to explicitly handle call rejection
  declineCall(callId, userId) {
    if (!this.socket) return
    console.log(`Declining call: ${callId}`)

    // First, emit the declineCall event
    this.socket.emit("declineCall", { callId, userId: userId || this.userId })

    // Then explicitly emit callDeclined event locally to ensure immediate UI update
    if (this.socket._callbacks && this.socket._callbacks["$callDeclined"]) {
      console.log("Triggering local callDeclined event for immediate UI update")
      this.socket._callbacks["$callDeclined"][0]({ callId, declinedBy: userId || this.userId })
    }

    // Also emit endCall to ensure proper cleanup
    this.socket.emit("endCall", { callId, userId: userId || this.userId })

    // Clear active call ID
    this.activeCallId = null

    // Emit releaseMediaResources to ensure all media resources are released
    this.socket.emit("releaseMediaResources", { callId })
  }

  // Add a method to directly handle incoming call UI
  handleIncomingCallUI(callData, acceptCallback, declineCallback) {
    return {
      accept: () => {
        if (acceptCallback) acceptCallback(callData)
      },
      decline: () => {
        // Immediately trigger local UI update
        if (this.socket._callbacks && this.socket._callbacks["$callDeclined"]) {
          console.log("Triggering immediate local callDeclined event")
          this.socket._callbacks["$callDeclined"][0]({
            callId: callData.callId,
            declinedBy: this.userId,
          })
        }

        // Then send the decline event to server
        this.declineCall(callData.callId, this.userId)

        if (declineCallback) declineCallback(callData)
      },
    }
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

const socketService = new SocketService()
export default socketService
