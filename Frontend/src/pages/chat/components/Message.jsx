import React from 'react';
import { User, FileText, Download } from 'lucide-react';

const Message = ({ message, currentChat }) => {
  const isImage = (mimetype) => mimetype && mimetype.startsWith('image/');
  
  // Add the profile picture URL handler
  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return "/default-avatar.png"; // Fallback image
    
    try {
      // If the profile picture already has the complete URL, return it as is
      if (profilePicture.startsWith("http")) {
        return profilePicture;
      }
      
      // Otherwise, add the base URL
      return `http://localhost:3000/uploads/profilePictures/${profilePicture}`;
    } catch (error) {
      console.error("Error processing profile picture URL:", error);
      return profilePicture;
    }
  };
  
  return (
    <div className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
      {message.sender !== "me" && (
        <img
          src={getProfilePictureUrl(currentChat.profilePicture)}
          alt={currentChat.name}
          className="w-8 h-8 rounded-full mr-2 self-end"
        />
      )}
      <div
        className={`max-w-xs md:max-w-md rounded-2xl ${
          message.sender === "me"
            ? "bg-red-600 text-white rounded-tr-none"
            : "bg-white text-gray-800 rounded-tl-none shadow-sm"
        }`}
      >
        {/* File Attachments */}
        {message.files && message.files.length > 0 && (
          <div className={`${message.text ? 'mb-2' : ''}`}>
            {message.files.map((file, index) => (
              <div key={index} className="mb-2">
                {isImage(file.mimetype) ? (
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={file.url}
                      alt={file.filename || "Attached image"}
                      className="max-w-full rounded-lg max-h-60 object-contain"
                    />
                  </a>
                ) : (
                  <a
                    href={file.url}
                    download={file.filename}
                    className={`flex items-center gap-2 p-2 rounded ${
                      message.sender === "me" ? "bg-red-700" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm truncate">{file.filename}</span>
                    <Download className="w-4 h-4 ml-auto" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Message Text */}
        {message.text && (
          <div className="px-4 py-2">
            <p>{message.text}</p>
            <span
              className={`text-xs block mt-1 ${
                message.sender === "me" ? "text-red-100" : "text-gray-500"
              }`}
            >
              {message.timestamp}
            </span>
          </div>
        )}
      </div>
      
      {message.sender === "me" && (
        <div className="w-8 h-8 rounded-full ml-2 self-end flex items-center justify-center bg-gray-200">
          <User className="w-4 h-4 text-gray-500" />
        </div>
      )}
    </div>
  );
};

export default Message;