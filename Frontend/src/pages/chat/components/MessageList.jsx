// src/pages/chat/components/MessageList.jsx
import React from 'react';
import { User } from 'lucide-react';

const Message = ({ message, currentChat }) => (

  <div
    className={`flex ${
      message.sender === "me" ? "justify-end" : "justify-start"
    }`}
  >
    {message.sender !== "me" && (
      <img
        src={currentChat.profilePicture}
        alt={currentChat.name}
        className="w-8 h-8 rounded-full mr-2 self-end"
      />
    )}
    <div
      className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
        message.sender === "me"
          ? "bg-red-600 text-white rounded-tr-none"
          : "bg-white text-gray-800 rounded-tl-none shadow-sm"
      }`}
    >
      <p>{message.text}</p>
      <span
        className={`text-xs block mt-1 ${
          message.sender === "me"
            ? "text-red-100"
            : "text-gray-500"
        }`}
      >
        {message.timestamp}
      </span>
    </div>
    {message.sender === "me" && (
      <div className="w-8 h-8 rounded-full ml-2 self-end flex items-center justify-center bg-gray-200">
        <User className="w-4 h-4 text-gray-500" />
      </div>
    )}
  </div>
);

const EmptyMessages = () => (
  <div className="text-center py-10">
    <p className="text-gray-500">No messages yet.</p>
    <p className="text-sm mt-2">Be the first to send a message!</p>
  </div>
);

const MessageList = ({ messages = [], currentChat, messageEndRef, isTyping }) => {
  if (!messages) return null;


  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <EmptyMessages />
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              currentChat={currentChat}
            />
          ))}
          {isTyping && (
            <div className="flex justify-start ml-12">
              <div className="bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-500">
                {currentChat.name} is typing...
              </div>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList;