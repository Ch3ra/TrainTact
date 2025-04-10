"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import socketService from "../../../socketService"
import ChatList from "./components/ChatList"
import ChatHeader from "./components/ChatHeader"
import MessageList from "./components/MessageList"
import MessageInput from "./components/MessageInput"
import EmptyState from "./components/EmptyState"
import VideoCall from "./VideoCall"

const API_BASE_URL = "http://localhost:3000/api"
const BASE_URL = "http://localhost:3000"

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [currentChat, setCurrentChat] = useState(null)
  const [chats, setChats] = useState([])
  const [userId, setUserId] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const messageEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Video call states
  const [callInProgress, setCallInProgress] = useState(false)
  const [currentCall, setCurrentCall] = useState(null)
  const [incomingCall, setIncomingCall] = useState(null)
  const [isCallInitiator, setIsCallInitiator] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]))
        setUserId(decodedToken.id)
        socketService.connect(decodedToken.id)
      } catch (error) {
        console.error("Error initializing chat:", error)
        setError("Authentication error. Please log in again.")
      }
    }

    return () => {
      socketService.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    socketService.onMessage((data) => {
      if (currentChat && data.senderId === currentChat.userId) {
        // Ensure file URLs are properly formatted
        const files = data.files
          ? data.files.map((file) => {
              if (file.url && !file.url.startsWith("http")) {
                file.url = `${BASE_URL}/${file.path || file.url.replace(/^\//, "")}`
              }
              return file
            })
          : []

        const newMsg = {
          id: data.messageId || Date.now(),
          sender: "other",
          text: data.text,
          files: files,
          timestamp: new Date(data.createdAt || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }
        setMessages((prev) => [...prev, newMsg])
        fetchConversations()
      } else {
        fetchConversations()
      }
    })

    socketService.onTyping(({ isTyping, userId: typingUserId }) => {
      if (currentChat && typingUserId === currentChat.userId) {
        setIsTyping(isTyping)
      }
    })

    socketService.onUsersList((users) => {
      setOnlineUsers(users)
    })

    // Video call handlers
    socketService.handleIncomingCall((data) => {
      setIncomingCall({
        callId: data.callId,
        initiatorId: data.initiator,
        conversationId: data.conversationId,
      })
    })

    socketService.handleCallEnded(() => {
      setCallInProgress(false)
      setCurrentCall(null)
      setIncomingCall(null)
    })

    fetchConversations()
  }, [userId, currentChat])

  useEffect(() => {
    socketService.handleVideoCallAccepted((data) => {
      if (data.callId === currentCall?.callId) {
        setCallInProgress(true)
      }
    })

    return () => {
      socketService.removeVideoListener("callAccepted")
    }
  }, [currentCall])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchConversations = async () => {
    if (!userId) return

    try {
      const response = await axios.get(`${API_BASE_URL}/chat/getConversation/${userId}`)

      if (response.data && response.data.conversations) {
        const processedChats = await Promise.all(
          response.data.conversations.map(async (conversation) => {
            const otherMember = conversation.members.find((member) => member._id !== userId)

            let lastMessagePreview = "Start a conversation..."
            let lastMessageTime = "Just now"

            if (conversation.lastMessage) {
              try {
                const msgResponse = await axios.get(`${API_BASE_URL}/chat/getMessage/${conversation._id}`)
                const messages = msgResponse.data.messages
                if (messages && messages.length > 0) {
                  const lastMsg = messages[messages.length - 1]
                  // Check if it's a file
                  if (lastMsg.file && lastMsg.file.length > 0 && (!lastMsg.text || lastMsg.text.trim() === "")) {
                    lastMessagePreview = "📎 Attachment"
                  } else {
                    lastMessagePreview = lastMsg.text.substring(0, 30) + (lastMsg.text.length > 30 ? "..." : "")
                  }
                  lastMessageTime = new Date(lastMsg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
              } catch (err) {
                console.error("Error fetching last message:", err)
              }
            }

            const isOnline = onlineUsers.some((user) => user.userId === otherMember._id)

            return {
              id: conversation._id,
              userId: otherMember._id,
              name: otherMember?.userName || "Unknown User",
              email: otherMember?.email || "",
              profilePicture: otherMember?.profilePicture
                ? `${otherMember.profilePicture}`
                : "https://via.placeholder.com/150?text=User",
              lastMessage: lastMessagePreview,
              time: lastMessageTime,
              isOnline,
              readStatus: conversation.readStatus[userId] !== false,
            }
          }),
        )

        setChats(processedChats)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
      setError("Failed to load conversations")
    }
  }

  const handleChatSelect = async (selectedChat) => {
    setCurrentChat(selectedChat)
    setIsTyping(false)
    setIsLoading(true)

    if (selectedChat?.id) {
      try {
        const response = await axios.get(`${API_BASE_URL}/chat/getMessage/${selectedChat.id}`)

        if (response.data && response.data.messages) {
          const formattedMessages = response.data.messages.map((msg) => ({
            id: msg._id,
            sender: msg.sender._id === userId ? "me" : "other",
            text: msg.text,
            files: msg.file,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }))
          setMessages(formattedMessages)
        }

        // Mark messages as read
        await axios.put(`${API_BASE_URL}/chat/changeStatus`, { conversationId: selectedChat.id, userId: userId })
      } catch (error) {
        console.error("Error fetching messages:", error)
        setError("Couldn't load messages")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSendMessage = async (messageText, files = []) => {
    if ((!messageText || messageText.trim() === "") && files.length === 0) return
    if (!currentChat?.id) return

    const now = new Date()
    const timestamp = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

    // Create a temporary message to display immediately
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender: "me",
      text: messageText || "",
      files: files.map((file) => ({
        filename: file.name,
        mimetype: file.type,
        // Create a local preview URL
        url: URL.createObjectURL(file),
      })),
      timestamp,
    }

    setMessages((prev) => [...prev, tempMessage])

    try {
      // Create FormData for the file upload
      const formData = new FormData()
      formData.append("conversationId", currentChat.id)
      formData.append("senderId", userId)
      formData.append("text", messageText || "")

      // Append files if any
      files.forEach((file) => {
        formData.append("files", file)
      })

      const response = await axios.post(`${API_BASE_URL}/chat/sendMessage`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.data?.chat) {
        // Revoke temporary URLs to prevent memory leaks
        if (tempMessage.files) {
          tempMessage.files.forEach((file) => {
            if (file.url) URL.revokeObjectURL(file.url)
          })
        }

        // Ensure file URLs are properly formatted in the response
        const responseFiles = response.data.chat.file
          ? response.data.chat.file.map((file) => {
              if (file.url && !file.url.startsWith("http")) {
                file.url = `${BASE_URL}/${file.path || file.url.replace(/^\//, "")}`
              } else if (!file.url && file.path) {
                file.url = `${BASE_URL}/${file.path.replace(/^\//, "")}`
              }
              return file
            })
          : []

        // Update the message with the real data from the server
        const updatedMessage = {
          id: response.data.chat._id,
          sender: "me",
          text: response.data.chat.text,
          files: responseFiles,
          timestamp,
        }

        setMessages((prev) => prev.map((msg) => (msg.id === tempMessage.id ? updatedMessage : msg)))

        // Notify the other user through socket
        socketService.sendMessage({
          senderId: userId,
          receiverId: currentChat.userId,
          text: response.data.chat.text,
          files: responseFiles,
          messageId: response.data.chat._id,
          createdAt: response.data.chat.createdAt,
        })

        fetchConversations()
      }
    } catch (error) {
      console.error("Error sending message:", error)

      // Remove the temporary message if there was an error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id))
      setError("Failed to send message")

      // Revoke temporary URLs
      if (tempMessage.files) {
        tempMessage.files.forEach((file) => {
          if (file.url) URL.revokeObjectURL(file.url)
        })
      }
    }
  }

  const handleTyping = (isTyping) => {
    if (currentChat?.userId) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      if (isTyping) {
        socketService.startTyping(currentChat.userId)
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(currentChat.userId)
      }, 1000)
    }
  }

  // Video Call Handlers
  const handleVideoCall = async () => {
    if (!currentChat) return

    try {
      const response = await axios.post(`${API_BASE_URL}/video-call/initiateCall`, {
        initiatorId: userId,
        receiverId: currentChat.userId,
        conversationId: currentChat.id,
      })

      const callId = response.data.call.callId

      setCurrentCall({
        callId: callId,
        otherUser: currentChat,
      })
      setIsCallInitiator(true)
      setCallInProgress(true)

      // Track active call in socket service
      socketService.setActiveCall(callId)

      // Join the call room immediately as initiator
      socketService.joinVideoCall(callId)
    } catch (error) {
      console.error("Error initiating video call:", error)
      setError("Failed to start video call")
    }
  }

  const handleAcceptCall = async () => {
    try {
      console.log("Accepting incoming call:", incomingCall)

      // Get call ID from the incoming call data
      const callId = incomingCall.callId

      // Find the chat/conversation with the caller
      const relatedChat = chats.find((c) => c.id === incomingCall.conversationId)

      if (!relatedChat) {
        console.error("Could not find chat related to incoming call")
        setError("Failed to find caller information")
        return
      }

      console.log("Setting up call with:", relatedChat)

      // Set current call information
      setCurrentCall({
        callId: callId,
        otherUser: relatedChat,
      })

      // Set as non-initiator (receiver)
      setIsCallInitiator(false)

      // Track active call in socket service - important for proper signaling
      socketService.setActiveCall(callId)

      // CRITICAL: First join the call room BEFORE setting callInProgress to true
      // This ensures the socket is ready to receive WebRTC signals
      console.log("Joining video call room:", callId)
      socketService.joinVideoCall(callId)

      // Short delay to ensure socket room join is processed
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Update call status to ongoing only after joining the room
      await axios.put(`${API_BASE_URL}/video-call/updateStatus`, {
        callId: callId,
        status: "ongoing",
      })

      // Let the initiator know we've accepted and joined
      socketService.acceptCall({
        callId: callId,
        userId: userId,
        acceptedBy: userId,
      })

      console.log("Call accepted and ready to establish connection")

      // Clear incoming call dialog
      setIncomingCall(null)

      // Now set the UI to show the call in progress - this will mount the VideoCall component
      setCallInProgress(true)
    } catch (error) {
      console.error("Error accepting call:", error)
      setError("Failed to accept call: " + error.message)
    }
  }

  const handleDeclineCall = async () => {
    try {
      await axios.put(`${API_BASE_URL}/video-call/updateStatus`, {
        callId: incomingCall.callId,
        status: "rejected",
      })
      setIncomingCall(null)
    } catch (error) {
      console.error("Error declining call:", error)
      setError("Failed to decline call")
    }
  }

  const handleEndCall = () => {
    socketService.endCall(currentCall.callId)
    setCallInProgress(false)
    setCurrentCall(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-80 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b flex items-center">
          <button className="mr-2 text-gray-500 hover:text-gray-700 transition" onClick={() => window.history.back()}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <h2 className="text-xl font-bold flex items-center">
            <span className="text-red-600">Train</span>
            <span>Tact</span>
            <span className="ml-2 text-sm text-gray-500 font-normal">Messages</span>
          </h2>
        </div>
        <ChatList error={error} chats={chats} currentChat={currentChat} onChatSelect={handleChatSelect} />
      </aside>

      <main className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            <div className="sticky top-0 z-10">
              <ChatHeader
                chat={currentChat}
                onlineUsers={onlineUsers}
                onBack={() => setCurrentChat(null)}
                onVideoCall={handleVideoCall}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-pulse text-gray-500">Loading messages...</div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto">
                  <MessageList
                    messages={messages}
                    currentChat={currentChat}
                    messageEndRef={messageEndRef}
                    isTyping={isTyping}
                  />
                </div>
              )}
            </div>

            <footer className="bg-white p-4 border-t">
              <MessageInput
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
              />
            </footer>
          </>
        ) : (
          <EmptyState />
        )}

        {/* Video Call Components */}
        {callInProgress && (
          <VideoCall
            callId={currentCall.callId}
            otherUser={currentCall.otherUser}
            onEndCall={handleEndCall}
            isInitiator={isCallInitiator}
          />
        )}

        {incomingCall && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg text-center">
              <h2 className="text-xl font-bold mb-4">Incoming Video Call</h2>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleAcceptCall}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Accept
                </button>
                <button
                  onClick={handleDeclineCall}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Chat
