import React from 'react';
import Message from './Message';

const EmptyMessages = () => (
  <div className="text-center py-10">
    <p className="text-gray-500">No messages yet.</p>
    <p className="text-sm mt-2">Be the first to send a message!</p>
  </div>
);

const MessageList = ({ messages = [], currentChat, messageEndRef, isTyping }) => {
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