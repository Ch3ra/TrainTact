class SocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.activeCallId = null;
    this.pendingSignals = new Map();
    this.signalTimeouts = new Map();
  }

  // Initialize socket connection
  connect(userId) {
    if (this.socket) {
      console.log('Socket already connected');
      return;
    }

    this.userId = userId;
    console.log(`Connecting socket for user: ${userId}`);
    
    // Connect to the socket server
    this.socket = io(SOCKET_SERVER_URL);
    
    this.socket.on('connect', () => {
      console.log(`Socket connected, socket ID: ${this.socket.id}`);
      this.socket.emit('register', { userId });
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
    });

    this.socket.on('reconnect', () => {
      console.log('Socket reconnected');
    });
  }

  // Video call signaling methods
  sendSignal(type, data) {
    if (!this.socket) return;

    const payload = {
      ...data,
      callId: data.callId || this.activeCallId,
      from: data.from || this.userId
    };

    console.log(`Sending ${type} signal to: ${data.to || 'room'}, from: ${payload.from}`);
    this.socket.emit(type, payload);
  }

  // Call management
  joinCallRoom(callId) {
    if (!this.socket) return;
    console.log(`Joining video call room: ${callId} as user ${this.userId}`);
    this.socket.emit('joinCall', { callId, userId: this.userId });
    this.activeCallId = callId;
  }

  leaveCallRoom(callId) {
    if (!this.socket) return;
    console.log(`Leaving video call room: ${callId}`);
    this.socket.emit('leaveCall', { callId, userId: this.userId });
    this.activeCallId = null;
  }

  endCall(callId) {
    if (!this.socket) return;
    console.log(`Ending call: ${callId}`);
    this.socket.emit('endCall', { callId, userId: this.userId });
    this.leaveCallRoom(callId);
  }

  declineCall(callId) {
    if (!this.socket) return;
    console.log(`Declining call: ${callId}`);
    this.socket.emit('declineCall', { callId, userId: this.userId });
    this.socket.emit('endCall', { callId, userId: this.userId });
  }

  // Event handlers
  handleCallEnded(callback) {
    this._addVideoListener('callEnded', callback);
  }

  handleCallRejected(callback) {
    this._addVideoListener('callDeclined', callback);
  }

  _addVideoListener(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  removeVideoListener(event) {
    if (!this.socket) return;
    this.socket.off(event);
  }

  // Utility methods
  isConnected() {
    return this.socket?.connected || false;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.activeCallId = null;
    }
  }
} 