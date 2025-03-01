import React, { useCallback } from 'react';
import { Paperclip, Image, Send } from 'lucide-react';

const MessageInput = ({ newMessage, setNewMessage, onSendMessage, onTyping }) => {
  const handleChange = useCallback((e) => {
    setNewMessage(e.target.value);
    onTyping(true);
  }, [setNewMessage, onTyping]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  }, [onSendMessage]);

  return (
    <div className="max-w-3xl mx-auto flex items-center space-x-2">
      <button className="p-2 rounded-full hover:bg-gray-100 transition">
        <Paperclip className="w-5 h-5 text-gray-600" />
      </button>
      <button className="p-2 rounded-full hover:bg-gray-100 transition">
        <Image className="w-5 h-5 text-gray-600" />
      </button>
      <input
        type="text"
        value={newMessage}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder="Type your message..."
        className="flex-1 py-2 px-4 bg-gray-100 rounded-full outline-none focus:ring-1 focus:ring-red-500"
      />
      <button
        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onSendMessage}
        disabled={!newMessage.trim()}
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MessageInput;


