import React from 'react';
import { ArrowLeft, Phone, Video } from 'lucide-react';

const ChatHeader = ({ chat, onBack }) => (
  <header className="bg-white p-4 border-b flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <button className="md:hidden" onClick={onBack}>
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="relative">
        <img
          src={chat.profilePicture}
          alt={chat.name}
          className="w-10 h-10 rounded-full object-cover"
          
        />
        {chat.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
        )}
      </div>
      <div>
        <h3 className="font-medium">{chat.name}</h3>
        <p className="text-sm text-gray-500">{chat.isOnline ? 'Online' : 'Offline'}</p>
      </div>
    </div>
    <div className="flex items-center space-x-4">
      <button className="p-2 rounded-full hover:bg-gray-100 transition">
        <Phone className="w-5 h-5 text-gray-600" />
      </button>
      <button className="p-2 rounded-full hover:bg-gray-100 transition">
        <Video className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  </header>
);

export default ChatHeader;