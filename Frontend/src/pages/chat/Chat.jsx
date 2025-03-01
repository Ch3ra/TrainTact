import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import socketService from "../../../socketService";
import ChatList from "./components/ChatList";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import EmptyState from "./components/EmptyState";

const API_BASE_URL = "http://localhost:3000/api";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [userId, setUserId] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [error, setError] = useState(null);
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        setUserId(decodedToken.id);
        socketService.connect(decodedToken.id);
      } catch (error) {
        console.error("Error initializing chat:", error);
        setError("Authentication error. Please log in again.");
      }
    }

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    socketService.onMessage((data) => {
      if (currentChat && data.senderId === currentChat.userId) {
        const newMsg = {
          id: data.messageId || Date.now(),
          sender: "other",
          text: data.text,
          timestamp: new Date(data.createdAt || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages(prev => [...prev, newMsg]);
        fetchConversations();
      } else {
        fetchConversations();
      }
    });

    socketService.onTyping(({ isTyping, userId: typingUserId }) => {
      if (currentChat && typingUserId === currentChat.userId) {
        setIsTyping(isTyping);
      }
    });

    socketService.onUsersList((users) => {
      setOnlineUsers(users);
    });

    fetchConversations();
  }, [userId, currentChat]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    if (!userId) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/chat/getConversation/${userId}`
      );
      
      if (response.data && response.data.conversations) {
        const processedChats = await Promise.all(
          response.data.conversations.map(async (conversation) => {
            const otherMember = conversation.members.find(
              member => member._id !== userId
            );
            
            let lastMessagePreview = "Start a conversation...";
            let lastMessageTime = "Just now";
            
            if (conversation.lastMessage) {
              try {
                const msgResponse = await axios.get(
                  `${API_BASE_URL}/chat/getMessage/${conversation._id}`
                );
                const messages = msgResponse.data.messages;
                if (messages && messages.length > 0) {
                  const lastMsg = messages[messages.length - 1];
                  lastMessagePreview = lastMsg.text.substring(0, 30) + 
                    (lastMsg.text.length > 30 ? '...' : '');
                  lastMessageTime = new Date(lastMsg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }
              } catch (err) {
                console.error("Error fetching last message:", err);
              }
            }

            const isOnline = onlineUsers.some(user => user.userId === otherMember._id);
            
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
              readStatus: conversation.readStatus[userId] !== false
            };
          })
        );
        
        setChats(processedChats);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setError("Failed to load conversations");
    }
  };

  const handleChatSelect = async (selectedChat) => {
    setCurrentChat(selectedChat);
    setIsTyping(false);
    
    if (selectedChat?.id) {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/chat/getMessage/${selectedChat.id}`
        );
        
        if (response.data && response.data.messages) {
          const formattedMessages = response.data.messages.map((msg) => ({
            id: msg._id,
            sender: msg.sender._id === userId ? "me" : "other",
            text: msg.text,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError("Couldn't load messages");
      }
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !currentChat?.id) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    const tempMessage = {
      id: Date.now().toString(),
      sender: "me",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/chat/sendMessage`,
        {
          conversationId: currentChat.id,
          senderId: userId,
          text: messageText,
        }
      );
      
      if (response.data?.chat) {
        socketService.sendMessage({
          senderId: userId,
          receiverId: currentChat.userId,
          text: messageText,
          messageId: response.data.chat._id,
          createdAt: response.data.chat.createdAt
        });
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id 
              ? { ...msg, id: response.data.chat._id }
              : msg
          )
        );
        
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setError("Failed to send message");
    }
  };

  const handleTyping = (isTyping) => {
    if (currentChat?.userId) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTyping) {
        socketService.startTyping(currentChat.userId);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(currentChat.userId);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-80 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold flex items-center">
            <span className="text-red-600">Train</span>
            <span>Tact</span>
            <span className="ml-2 text-sm text-gray-500 font-normal">
              Messages
            </span>
          </h2>
        </div>
        
        <ChatList
          error={error}
          chats={chats}
          currentChat={currentChat}
          onChatSelect={handleChatSelect}
        />
      </aside>

      <main className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            <ChatHeader 
              chat={currentChat}
              onBack={() => setCurrentChat(null)}
            />

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="max-w-3xl mx-auto">
                <MessageList
                  messages={messages}
                  currentChat={currentChat}
                  messageEndRef={messageEndRef}
                  isTyping={isTyping}
                />
              </div>
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
      </main>
    </div>
  );
};

export default Chat;