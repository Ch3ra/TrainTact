"use client"
import { ArrowLeft, Phone, Video, Check } from "lucide-react"
import { useEffect, useState } from "react"

const ChatHeader = ({ chat, onBack, onVideoCall, onlineUsers }) => {
  const [isOnline, setIsOnline] = useState(false)

  // Real-time status updates using onlineUsers prop
  useEffect(() => {
    if (chat?.userId && onlineUsers) {
      const online = onlineUsers.some(user => user.userId === chat.userId)
      setIsOnline(online)
    }
  }, [onlineUsers, chat?.userId])

  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return "/default-avatar.png"
    
    try {
      if (profilePicture.startsWith("http")) return profilePicture
      return `http://localhost:3000/uploads/profilePictures/${profilePicture}`
    } catch (error) {
      console.error("Error processing profile picture URL:", error)
      return "/default-avatar.png"
    }
  }

  return (
    <header className="bg-gray-200 p-4 border-b flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <button className="md:hidden" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative">
          <img
            src={getProfilePictureUrl(chat?.profilePicture)}
            alt={chat?.name || "Chat user"}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              e.target.src = "/default-avatar.png"
            }}
          />
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white transition-opacity duration-300 ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
          ></span>
        </div>
        <div>
          <h3 className="font-medium">{chat?.name || "Unknown User"}</h3>
          <div className="flex items-center space-x-1">
            {isOnline ? (
              <>
                <span className="text-sm text-green-600">Online</span>
                
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Offline{chat?.lastSeen && ` • Last seen ${chat.lastSeen}`}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-gray-100 transition">
          <Phone className="w-5 h-5 text-gray-600" />
        </button>
        <button 
          className="p-2 rounded-full hover:bg-gray-100 transition" 
          onClick={onVideoCall}
        >
          <Video className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </header>
  )
}

export default ChatHeader