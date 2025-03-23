import React, { useCallback, useState, useRef } from 'react';
import { Paperclip, Image, Send, X } from 'lucide-react';

const MessageInput = ({ newMessage, setNewMessage, onSendMessage, onTyping }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);

  const handleChange = useCallback((e) => {
    setNewMessage(e.target.value);
    onTyping(true);
  }, [setNewMessage, onTyping]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim() || selectedFiles.length > 0) {
        handleSend();
      }
    }
  }, [newMessage, selectedFiles]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setSelectedFiles(prev => [...prev, ...files]);
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => ({
      file: file,
      url: URL.createObjectURL(file)
    }));
    
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleRemoveFile = (index) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index].url);
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    onSendMessage(newMessage, selectedFiles);
    setNewMessage("");
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const triggerFileInput = (type) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : '*/*';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* File Previews */}
      {previewUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded bg-gray-50">
          {previewUrls.map((preview, index) => (
            <div key={index} className="relative inline-block">
              {preview.file.type.startsWith('image/') ? (
                <img 
                  src={preview.url} 
                  alt="Preview" 
                  className="h-20 w-20 object-cover rounded"
                />
              ) : (
                <div className="h-20 w-20 flex items-center justify-center bg-gray-200 rounded">
                  <span className="text-xs text-center p-1 truncate max-w-full">
                    {preview.file.name}
                  </span>
                </div>
              )}
              <button 
                onClick={() => handleRemoveFile(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />
        <button 
          className="p-2 rounded-full hover:bg-gray-100 transition"
          onClick={() => triggerFileInput('file')}
        >
          <Paperclip className="w-5 h-5 text-gray-600" />
        </button>
        <button 
          className="p-2 rounded-full hover:bg-gray-100 transition"
          onClick={() => triggerFileInput('image')}
        >
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
          onClick={handleSend}
          disabled={!newMessage.trim() && selectedFiles.length === 0}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;