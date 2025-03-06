import React from 'react';

const EmptyState = () => (
  <div className="flex-1 flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="text-red-600 text-5xl mb-4">💬</div>
      <h3 className="text-xl font-medium mb-2">
        Select a conversation
      </h3>
      <p className="text-gray-500 max-w-md mx-auto">
        Choose a trainer from the list to view your conversation history
        and start messaging
      </p>
    </div>
  </div>
);

export default EmptyState;


