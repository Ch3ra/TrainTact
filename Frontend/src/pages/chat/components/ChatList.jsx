import React from "react";
import axios from "axios";
import { AlertCircle } from "lucide-react";

// Set base URL for Axios
const api = axios.create({
  baseURL: "http://localhost:3000/api/chat",
});

const ChatList = ({ error, chats, currentChat, onChatSelect }) => {

  console.log(chats)
  const handleChatSelect = async (chat) => {
    try {

      if (!chat.readStatus) {
        await api.put("/changeStatus", { conversationId: chat.id, userId: chat.userId});
      }
      onChatSelect(chat);
    } catch (error) { 
      console.error("Error updating read status:", error);
    }
  };

  if (error) {
    return (
      <div className="p-5 text-center">
        <AlertCircle className="h-10 w-10 text-red-600 mx-auto mb-2" />
        <p className="text-gray-700">{error}</p>
      </div>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <div className="p-5 text-center">
        <p className="text-gray-500">No conversations found.</p>
        <p className="text-sm mt-2">Connect with a trainer to start messaging!</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`p-4 hover:bg-gray-50 cursor-pointer transition duration-150 ${
            currentChat?.id === chat.id ? "bg-blue-50" : ""
          }`}
          onClick={() => handleChatSelect(chat)}
        >
          <div className="flex items-start space-x-3">
            <div className="relative">
              <img
                src={chat.profilePicture}
                alt={chat.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {chat.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
              )}
              {chat.unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {chat.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3
                  className={`font-medium truncate ${
                    currentChat?.id === chat.id ? "text-red-600" : ""
                  }`}
                >
                  {chat.name}
                </h3>
                <span className="text-xs text-gray-500">{chat.time}</span>
              </div>
              <p className="text-sm text-gray-500 truncate">{chat.email}</p>
              <p
                className={`text-sm truncate ${
                  !chat.readStatus ? "font-bold" : "font-normal"
                }`}
              >
                {chat.lastMessage}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(ChatList);
