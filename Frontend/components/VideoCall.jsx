import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSocketService } from '../services/SocketService';

const VideoCall = ({ onCallEnded, onCallRejected, onCallCancelled }) => {
  const socketService = useSocketService();
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callStatus, setCallStatus] = useState('idle');
  const [callId, setCallId] = useState(null);

  // Cleanup function for media resources
  const cleanupCallResources = useCallback(() => {
    console.log('Cleaning up call resources...');
    
    try {
      // Stop all tracks on the peer connection
      if (peerConnection.current) {
        const senders = peerConnection.current.getSenders();
        senders.forEach(sender => {
          if (sender.track) {
            console.log(`Stopping sender track: ${sender.track.kind}`);
            sender.track.stop();
          }
        });

        // Close peer connection
        peerConnection.current.close();
        peerConnection.current = null;
      }

      // Stop local media tracks
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => {
          console.log(`Stopping local track: ${track.kind} - ${track.label}`);
          track.stop();
        });
        localStream.current = null;
      }

      // Stop remote media tracks
      if (remoteStream.current) {
        remoteStream.current.getTracks().forEach(track => {
          console.log(`Stopping remote track: ${track.kind} - ${track.label}`);
          track.stop();
        });
        remoteStream.current = null;
      }

      // Reset all state
      setIsConnected(false);
      setIsConnecting(false);
      setCallStatus('ended');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, []);

  // Handle call ending
  const handleEndCall = useCallback(() => {
    console.log('Ending call...');
    if (socketService && callId) {
      cleanupCallResources();
      socketService.endCall(callId);
      onCallEnded?.();
    }
  }, [callId, socketService, cleanupCallResources, onCallEnded]);

  // Handle call rejection
  const handleDeclineCall = useCallback(() => {
    console.log('Declining call...');
    if (socketService && callId) {
      cleanupCallResources();
      socketService.declineCall(callId);
      onCallRejected?.();
    }
  }, [callId, socketService, cleanupCallResources, onCallRejected]);

  // Handle call cancellation
  const handleCancelCall = useCallback(() => {
    console.log('Cancelling call...');
    if (socketService && callId) {
      cleanupCallResources();
      socketService.declineCall(callId);
      onCallCancelled?.();
    }
  }, [callId, socketService, cleanupCallResources, onCallCancelled]);

  // Listen for call events
  useEffect(() => {
    if (!socketService) return;

    const handleCallEnded = (data) => {
      console.log('Call ended event received:', data);
      cleanupCallResources();
      onCallEnded?.();
    };

    const handleCallRejected = (data) => {
      console.log('Call rejected event received:', data);
      cleanupCallResources();
      onCallRejected?.();
    };

    // Add event listeners
    socketService.handleCallEnded(handleCallEnded);
    socketService.handleCallRejected(handleCallRejected);

    // Cleanup function
    return () => {
      socketService.removeVideoListener('callEnded');
      socketService.removeVideoListener('callDeclined');
      
      // If we still have an active call, end it
      if (callId) {
        socketService.endCall(callId);
        cleanupCallResources();
      }
    };
  }, [socketService, callId, cleanupCallResources, onCallEnded, onCallRejected]);

  // Handle component unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting - releasing all media resources');
      cleanupCallResources();
    };
  }, [cleanupCallResources]);

  return (
    <div>
      {/* Your video call UI components */}
    </div>
  );
};

export default VideoCall; 