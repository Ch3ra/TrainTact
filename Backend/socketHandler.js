// Handle incoming socket connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id)
  
  let userId = null
  let currentRoom = null
  
  // Track connected users
  const users = new Map()
  
  socket.on('register', (data) => {
    userId = data.userId
    users.set(userId, {
      socketId: socket.id,
      userId: userId
    })
    
    // Broadcast updated user list
    io.emit('users', Array.from(users.values()))
    console.log(`User ${userId} registered with socket ${socket.id}`)
  })

  // Handle joining a call room
  socket.on('joinCall', (data) => {
    const { callId } = data
    if (currentRoom) {
      socket.leave(currentRoom)
    }
    currentRoom = callId
    socket.join(callId)
    console.log(`User ${userId} joined call room ${callId}`)
  })

  // Handle leaving a call room
  socket.on('leaveCall', () => {
    if (currentRoom) {
      socket.leave(currentRoom)
      currentRoom = null
      console.log(`User ${userId} left their call room`)
    }
  })

  // Handle various WebRTC signaling events
  const signalTypes = ['offer', 'answer', 'iceCandidate']
  signalTypes.forEach(type => {
    socket.on(type, (data) => {
      console.log(`Received ${type} signal from ${data.from} to ${data.to || 'room'}`)
      
      // If we have a specific recipient, route directly to them
      if (data.to) {
        const targetSocket = Array.from(users.values())
          .find(u => u.userId === data.to)?.socketId
        if (targetSocket) {
          io.to(targetSocket).emit(type, data)
        }
      }
      
      // Also broadcast to the call room if specified
      if (data.callId) {
        socket.to(data.callId).emit(type, data)
      }
    })
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    if (userId) {
      users.delete(userId)
      io.emit('users', Array.from(users.values()))
    }
    console.log('Client disconnected:', socket.id)
  })
}) 