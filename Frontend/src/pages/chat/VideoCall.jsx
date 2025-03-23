"use client"

import { useEffect, useRef, useState } from "react"
import socketService from "../../../socketService"

const VideoCall = ({ callId, otherUser, onEndCall, isInitiator }) => {
  const userId = socketService.getUserId()
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("connecting")
  const [iceGatheringState, setIceGatheringState] = useState("new")
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnection = useRef(null)
  const screenTrack = useRef(null)
  const [iceCandidates, setIceCandidates] = useState([])
  const [iceErrors, setIceErrors] = useState([])
  const [error, setError] = useState(null)
  const offerOptions = useRef({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
    iceRestart: true,
  })

  // Store received ICE candidates before peer connection is ready
  const pendingIceCandidates = useRef([])
  const isRemoteDescriptionSet = useRef(false)
  const mediaEstablished = useRef(false)
  const callSetupComplete = useRef(false)

  // Enhanced WebRTC Configuration with STUN servers
  const webRTCConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun.stunprotocol.org:3478" },
      { urls: "stun:stun.voiparound.com" },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
  }

  // Log available media devices
  const logDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("Available media devices:", devices.map(d => ({
        kind: d.kind,
        label: d.label,
        deviceId: d.deviceId.substring(0, 8) + '...'
      })));
    } catch (err) {
      console.error("Could not enumerate devices:", err);
    }
  };

  // Initialize peer connection with proper error handling
  const initPeerConnection = async () => {
    try {
      if (peerConnection.current) {
        peerConnection.current.close()
      }

      peerConnection.current = new RTCPeerConnection(webRTCConfig)
      isRemoteDescriptionSet.current = false
      setConnectionStatus("connecting")
      console.log("PeerConnection initialized with config:", webRTCConfig)

      // ICE Event Handlers
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("New ICE Candidate:", event.candidate)
          setIceCandidates((prev) => [...prev, event.candidate])

          // Send each ICE candidate as it's generated
          socketService.sendSignal("iceCandidate", {
            callId,
            to: otherUser.id,
            candidate: event.candidate.toJSON(),
            from: userId, // Make sure to include the from field
          })
        } else {
          console.log("ICE Gathering Complete")
          setIceGatheringState("complete")
        }
      }

      peerConnection.current.oniceconnectionstatechange = () => {
        const state = peerConnection.current.iceConnectionState
        console.log("ICE Connection State:", state)
        setConnectionStatus(state)

        if (state === "failed") {
          console.log("ICE Connection failed - attempting restart")
          // Restart ICE by creating a new offer with iceRestart: true
          if (isInitiator && peerConnection.current.signalingState !== "closed") {
            restartIceConnection()
          }
          setError("Connection failed - attempting ICE restart")
        }
      }

      peerConnection.current.onicegatheringstatechange = () => {
        const state = peerConnection.current.iceGatheringState
        console.log("ICE Gathering State:", state)
        setIceGatheringState(state)
      }

      peerConnection.current.onicecandidateerror = (error) => {
        console.error("ICE Candidate Error:", error)
        setIceErrors((prev) => [...prev, error])
        setError(`Network configuration error: ${error.errorText || "Unknown error"}`)
      }

      // Connection state monitoring
      peerConnection.current.onconnectionstatechange = () => {
        const state = peerConnection.current.connectionState
        console.log("Connection State:", state)

        if (state === "connected") {
          console.log("WebRTC connection established successfully!")
          callSetupComplete.current = true
          setError(null) // Clear any previous errors
        } else if (state === "failed" || state === "disconnected") {
          console.log("Connection state:", state, "- attempting recovery")
          setError(`Connection ${state}. Trying to recover...`)
        }
      }

      // Media Handlers
      peerConnection.current.ontrack = (event) => {
        console.log("Remote track received:", event.streams[0])
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0])
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0]
          }
        }
      }

      return peerConnection.current
    } catch (error) {
      console.error("Peer Connection Initialization Error:", error)
      setConnectionStatus("failed")
      setError(`Failed to initialize connection: ${error.message}`)
      throw error
    }
  }

  // Apply stored ICE candidates once remote description is set
  const addPendingIceCandidates = async () => {
    if (pendingIceCandidates.current.length > 0 && peerConnection.current) {
      console.log(`Adding ${pendingIceCandidates.current.length} pending ICE candidates`)

      for (const candidate of pendingIceCandidates.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
          console.log("Added pending ICE candidate successfully")
        } catch (error) {
          console.error("Error adding pending ICE candidate:", error)
        }
      }

      pendingIceCandidates.current = []
    }
  }

  // Restart ICE connection when it fails
  const restartIceConnection = async () => {
    try {
      if (!peerConnection.current || peerConnection.current.signalingState === "closed") {
        console.log("Cannot restart ICE - connection closed")
        return
      }

      console.log("Restarting ICE connection...")

      // Create a new offer with iceRestart: true
      const offer = await peerConnection.current.createOffer({
        iceRestart: true,
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })

      await peerConnection.current.setLocalDescription(offer)
      console.log("New local description set with ICE restart")

      // Send the new offer
      socketService.sendSignal("offer", {
        callId,
        to: otherUser.id,
        sdp: offer,
        from: userId,
      })
      console.log("New offer with ICE restart sent")
    } catch (error) {
      console.error("Error restarting ICE connection:", error)
      setError(`Failed to restart connection: ${error.message}`)
    }
  }

  // Set up local media streams with improved error handling and fallbacks
  const setupMedia = async () => {
    try {
      console.log("Setting up local media...");
      
      // Log available devices to help with debugging
      await logDevices();

      // First, release any existing media streams
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
          console.log("Stopped existing track:", track.kind);
        });
        setLocalStream(null);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }

      // Add a small delay to ensure resources are released
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log("Attempting to access media devices...");
      
      // Try with lower quality first to increase chances of success
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { max: 30 }
        },
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true 
        }
      }).catch(async (err) => {
        console.error("Initial media access error:", err.name, err.message);
        
        if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          // Try audio only as fallback
          console.log("Camera in use, trying audio only...");
          setIsVideoOn(false);
          return await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          }).catch(audioErr => {
            console.error("Audio-only fallback failed:", audioErr);
            throw new Error("Camera is in use by another application and audio fallback failed. Please close other video applications and try again.");
          });
        } else if (err.name === 'NotAllowedError') {
          throw new Error("Camera/microphone access denied. Please allow access in your browser settings.");
        } else if (err.name === 'NotFoundError') {
          // Try audio only if no camera found
          console.log("No camera found, trying audio only...");
          setIsVideoOn(false);
          return await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          }).catch(audioErr => {
            console.error("Audio-only fallback failed:", audioErr);
            throw new Error("No camera detected and audio fallback failed. Please connect a device and try again.");
          });
        } else {
          throw err;
        }
      });

      console.log("Media access successful:", stream.getTracks().map(t => `${t.kind}:${t.label}`).join(", "));
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to connection if peer connection exists
      if (peerConnection.current) {
        console.log("Adding local tracks to peer connection");
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });
        mediaEstablished.current = true;
      } else {
        console.error("Cannot add tracks - peer connection not initialized");
      }

      return stream;
    } catch (error) {
      console.error("Media setup error:", error);
      
      // Show a more user-friendly error message
      if (error.name === 'NotReadableError' || error.name === 'TrackStartError' || 
          error.message.includes("Camera is in use")) {
        setError("Your camera is currently being used by another application. Please close other video applications and try again.");
      } else if (error.name === 'NotFoundError') {
        setError("No camera or microphone found. Please connect a device and try again.");
      } else if (error.name === 'NotAllowedError') {
        setError("Camera/microphone access denied. Please allow access in your browser settings.");
      } else {
        setError(`Failed to access camera or microphone: ${error.message}`);
      }
      
      throw error;
    }
  };

  // Create and send initial offer (for initiator)
  const createInitialOffer = async () => {
    try {
      if (!peerConnection.current) {
        console.error("Cannot create offer - peer connection not initialized")
        return
      }

      console.log("Creating initial offer...")

      const offer = await peerConnection.current.createOffer(offerOptions.current)
      await peerConnection.current.setLocalDescription(offer)
      console.log("Local description set (offer)")

      // Send the offer
      socketService.sendSignal("offer", {
        callId,
        to: otherUser.id,
        sdp: offer,
        from: userId,
      })
      console.log("Initial offer sent to:", otherUser.id)
    } catch (error) {
      console.error("Error creating offer:", error)
      setError(`Failed to create offer: ${error.message}`)
    }
  }

  // Clean up resources
  const cleanupCall = () => {
    console.log("Cleaning up call resources...")

    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }

    if (screenTrack.current) {
      screenTrack.current.stop()
      screenTrack.current = null
    }
  }

  // Setup call when component mounts - FIXED to ensure proper initialization order
  useEffect(() => {
    const setupCall = async () => {
      try {
        console.log(`Setting up call as ${isInitiator ? "INITIATOR" : "RECEIVER"} for call ID: ${callId}`);
        
        // Step 1: Initialize peer connection first
        await initPeerConnection();
        
        // Step 2: Set up local media stream with more aggressive permission handling
        console.log(`${isInitiator ? "INITIATOR" : "RECEIVER"}: Requesting camera permissions`);
        
        // Try to explicitly request camera permissions to ensure the prompt appears
        try {
          console.log("Checking camera permissions...");
          const permissionStatus = await navigator.permissions.query({ name: 'camera' });
          console.log(`Camera permission status: ${permissionStatus.state}`);
          
          if (permissionStatus.state === 'denied') {
            setError("Camera permission denied. Please check your browser settings.");
          }
        } catch (permErr) {
          console.log("Permission API not supported, proceeding with direct media request");
        }
        
        // Now actually set up the media
        console.log(`${isInitiator ? "INITIATOR" : "RECEIVER"}: Requesting media streams...`);
        const stream = await setupMedia();
        
        if (stream) {
          console.log(`${isInitiator ? "INITIATOR" : "RECEIVER"}: Media setup complete with tracks:`, 
            stream.getTracks().map(t => `${t.kind}:${t.enabled}`).join(", "));
          
          // Force active video display by ensuring tracks are enabled
          stream.getVideoTracks().forEach(track => {
            console.log(`Video track before force: ${track.label}, enabled: ${track.enabled}`);
            track.enabled = true;
            console.log(`Video track after force: ${track.label}, enabled: ${track.enabled}`);
          });
          
          // Wait longer to ensure browser has initialized camera fully
          await new Promise(resolve => setTimeout(resolve, 800));
        } else {
          console.warn(`${isInitiator ? "INITIATOR" : "RECEIVER"}: No media stream acquired!`);
        }
        
        // Extra check to make sure media is properly set up
        if (!localStream || localStream.getTracks().length === 0) {
          console.warn("Media setup may not be complete - no tracks found. Proceeding anyway...");
        } else {
          console.log("Media setup confirmed with tracks:", 
            localStream.getTracks().map(t => `${t.kind}:${t.enabled}`).join(", "));
        }
        
        // Step 3: Ensure tracks are properly added to peer connection
        if (peerConnection.current && localStream) {
          const senders = peerConnection.current.getSenders();
          console.log("Current peer connection senders:", senders.length);
          
          if (senders.length === 0) {
            console.log("No senders yet, explicitly adding all tracks to peer connection");
            localStream.getTracks().forEach(track => {
              console.log(`Adding ${track.kind} track to peer connection`);
              peerConnection.current.addTrack(track, localStream);
            });
          }
        }
        
        // Step 4: If initiator, create and send offer AFTER media is set up
        if (isInitiator) {
          console.log("INITIATOR: Preparing to create and send offer");
          // Longer delay to ensure everything is ready
          await new Promise(resolve => setTimeout(resolve, 1000));
          await createInitialOffer();
          console.log("INITIATOR: Initial offer sent");
        } else {
          console.log("RECEIVER: Setup complete, waiting for offer");
        }
      } catch (error) {
        console.error("Call setup error:", error);
        setError(`Call setup failed: ${error.message}`);
      }
    }

    // Start the call setup process
    setupCall();

    // Cleanup when component unmounts
    return () => {
      cleanupCall();
    }
  }, [callId, otherUser?.id, isInitiator]);

  // Handle incoming offers with improved error handling - FIXED to ensure proper order of operations
  useEffect(() => {
    // Handle incoming offers more robustly
    socketService.handleVideoOffer(async ({ from, sdp }) => {
      console.log("Received offer from:", from);
      try {
        // Force sequential execution to prevent race conditions
        
        // Step 1: Ensure we have a clean peer connection
        if (!peerConnection.current || peerConnection.current.signalingState === "closed") {
          console.log("Initializing peer connection for offer handling");
          await initPeerConnection();
        }
        
        // Step 2: Explicitly force camera permissions for the receiver
        console.log("RECEIVER: Requesting camera/mic permissions explicitly");
        try {
          const permissionResult = await navigator.permissions.query({ name: 'camera' });
          console.log("Camera permission status:", permissionResult.state);
          if (permissionResult.state === 'denied') {
            setError("Camera permission denied. Please enable camera access in your browser settings.");
          }
        } catch (permErr) {
          console.log("Permission check not supported, proceeding with getUserMedia directly");
        }
        
        // Step 3: Ensure local media is set up BEFORE handling the offer
        // CRITICAL FOR RECEIVER: Make sure we get access to camera/mic BEFORE continuing
        console.log("RECEIVER: Setting up local media stream");
        if (!mediaEstablished.current || !localStream) {
          console.log("Setting up local media before processing offer");
          const stream = await setupMedia();
          
          // Extra verification that we have a valid stream with tracks
          if (stream && (stream.getVideoTracks().length > 0 || stream.getAudioTracks().length > 0)) {
            console.log("RECEIVER: Successfully acquired local media with tracks:", 
              stream.getTracks().map(t => `${t.kind}:${t.label}:${t.enabled}`).join(", "));
              
            // Explicitly log if video tracks are enabled
            stream.getVideoTracks().forEach(track => {
              console.log(`Video track ${track.label} enabled: ${track.enabled}`);
              // Force enable the track
              track.enabled = true;
            });
            
            // Wait a bit longer to ensure media is fully initialized
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            console.warn("RECEIVER: Local media stream appears to have no tracks!");
          }
        } else {
          console.log("RECEIVER: Local media already established");
        }
        
        // Step 4: Explicitly verify tracks are added to the peer connection
        if (localStream && peerConnection.current) {
          console.log("RECEIVER: Verifying tracks are added to peer connection");
          // Remove any existing senders to prevent duplicate tracks
          const senders = peerConnection.current.getSenders();
          if (senders.length === 0) {
            console.log("RECEIVER: No existing senders, adding all tracks fresh");
            localStream.getTracks().forEach(track => {
              console.log(`RECEIVER: Adding ${track.kind} track to peer connection`);
              peerConnection.current.addTrack(track, localStream);
            });
          } else {
            console.log("RECEIVER: Existing senders found:", senders.length);
          }
        }
        
        // Step 5: Set remote description (the offer)
        console.log("Setting remote description (offer)");
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
        isRemoteDescriptionSet.current = true;
        
        // Step 6: Apply any pending ICE candidates
        await addPendingIceCandidates();
        
        // Step 7: Create and set local description (the answer)
        console.log("Creating answer");
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        
        // Step 8: Send the answer
        console.log("RECEIVER: Sending answer to:", from);
        socketService.sendSignal("answer", {
          callId,
          to: from,
          sdp: answer,
          from: userId,
        });
        
        // Step 9: Log connection state for debugging
        console.log("RECEIVER: Call setup complete, connection state:", 
          peerConnection.current.connectionState,
          "signaling state:", peerConnection.current.signalingState);
      } catch (error) {
        console.error("Error handling offer:", error);
        setError(`Failed to process offer: ${error.message}`);
      }
    });

    // Handle incoming answers
    socketService.handleVideoAnswer(async ({ from, sdp }) => {
      console.log("Received answer from:", from);
      try {
        if (!peerConnection.current || peerConnection.current.signalingState === "closed") {
          console.error("PeerConnection not ready for answer");
          return;
        }

        // Set remote description (the answer)
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
        isRemoteDescriptionSet.current = true;
        console.log("Remote description set successfully (answer)");

        // Apply any pending ICE candidates
        await addPendingIceCandidates();
      } catch (error) {
        console.error("Error handling answer:", error);
        setError(`Failed to process answer: ${error.message}`);
      }
    });

    // Handle incoming IC
    // Handle incoming ICE candidates with improved processing logic
    socketService.handleIceCandidate(async ({ from, candidate }) => {
      try {
        console.log("Received ICE candidate from:", from);

        if (!candidate) {
          console.log("Received empty ICE candidate, ignoring");
          return;
        }

        // If peer connection doesn't exist yet or remote description is not set, store candidates for later
        if (!peerConnection.current || !isRemoteDescriptionSet.current) {
          console.log("Storing ICE candidate for later application");
          pendingIceCandidates.current.push(candidate);
          return;
        }

        // Add the ICE candidate if connection is ready
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => {
          console.error("Error adding ICE candidate:", err);
          // Store for retry if failed
          pendingIceCandidates.current.push(candidate);
        });
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    });

    // Clean up event listeners when component unmounts
    return () => {
      socketService.removeVideoListener("offer");
      socketService.removeVideoListener("answer");
      socketService.removeVideoListener("iceCandidate");
    }
  }, [callId, userId]);

  // Media Control Functions
  const toggleMedia = (type) => {
    if (!localStream) return

    const trackType = type === "audio" ? "getAudioTracks" : "getVideoTracks"
    localStream[trackType]().forEach((track) => {
      track.enabled = !track.enabled
    })

    type === "audio" ? setIsMuted(!isMuted) : setIsVideoOn(!isVideoOn)
  }

  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        console.log("Starting screen sharing...")

        // First, check if we have a working peer connection
        if (!peerConnection.current || peerConnection.current.connectionState !== "connected") {
          setError("Cannot share screen: No active connection. Try reconnecting first.");
          return;
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            cursor: "always",
            // Lower resolution for better compatibility
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { max: 30 }
          },
          audio: false,
        }).catch(err => {
          console.error("Screen sharing permission error:", err);
          setError(`Screen sharing permission denied: ${err.message}`);
          throw err;
        });

        screenTrack.current = screenStream.getVideoTracks()[0];

        if (!screenTrack.current) {
          throw new Error("No video track available in screen share");
        }

        // Listen for when user stops sharing via browser UI
        screenTrack.current.onended = () => {
          console.log("Screen sharing stopped via browser UI");
          handleScreenShare();
        };

        // Explicitly log all senders before replacement
        const senders = peerConnection.current.getSenders();
        console.log("Current senders before screen share:", 
          senders.map(s => s.track ? `${s.track.kind}:${s.track.label}` : "no track").join(", "));

        // Replace video track with screen track
        const videoSender = senders.find((s) => s.track?.kind === "video");

        if (videoSender) {
          console.log("Found video sender, replacing track with screen share");
          await videoSender.replaceTrack(screenTrack.current);
          setIsScreenSharing(true);
          
          // Notify peer about screen sharing
          socketService.sendSignal("screenOffer", {
            callId,
            to: otherUser.id,
            sdp: await peerConnection.current.createOffer(),
            from: userId,
          });
          
          console.log("Screen sharing started and signaled to peer");
        } else {
          console.error("No video sender found to replace with screen share");
          // If no video sender exists, try to add as a new track
          try {
            console.log("Attempting to add screen share as a new track");
            peerConnection.current.addTrack(screenTrack.current, screenStream);
            setIsScreenSharing(true);
            
            // Create and send a new offer with the screen track
            const newOffer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(newOffer);
            
            socketService.sendSignal("offer", {
              callId,
              to: otherUser.id,
              sdp: newOffer,
              from: userId,
            });
            
            console.log("Added screen share as new track and sent new offer");
          } catch (addTrackError) {
            console.error("Failed to add screen track:", addTrackError);
            screenTrack.current.stop();
            throw new Error("Could not add screen sharing track to the call");
          }
        }
      } else {
        console.log("Stopping screen sharing...");

        if (!peerConnection.current) {
          setError("Connection lost, cannot revert screen sharing");
          return;
        }

        // Get a new video track from camera
        const userVideo = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
          }
        }).catch(err => {
          console.error("Camera access error when reverting from screen share:", err);
          setError(`Could not access camera: ${err.message}`);
          throw err;
        });

        const videoTrack = userVideo.getVideoTracks()[0];

        // Replace screen track with camera track
        const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === "video");

        if (sender) {
          console.log("Replacing screen share with camera video");
          await sender.replaceTrack(videoTrack);

          // Stop old tracks
          if (screenTrack.current) {
            screenTrack.current.stop();
            screenTrack.current = null;
          }

          // Stop unused tracks from temporary stream
          userVideo.getTracks().forEach((track) => {
            if (track !== videoTrack) track.stop();
          });

          setIsScreenSharing(false);
          
          // Create and send a new offer with the camera track
          const newOffer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(newOffer);
          
          socketService.sendSignal("offer", {
            callId,
            to: otherUser.id,
            sdp: newOffer,
            from: userId,
          });
          
          console.log("Screen sharing stopped, camera video restored and signaled");
        } else {
          console.error("No video sender found when trying to revert screen share");
          setIsScreenSharing(false);
          
          // Stop tracks anyway
          if (screenTrack.current) {
            screenTrack.current.stop();
            screenTrack.current = null;
          }
          userVideo.getTracks().forEach(track => track.stop());
        }
      }
    } catch (error) {
      console.error("Screen Share Error:", error);
      setError(`Screen sharing failed: ${error.message}`);

      // Reset state if error occurs
      setIsScreenSharing(false);
      if (screenTrack.current) {
        screenTrack.current.stop();
        screenTrack.current = null;
      }
    }
  }

  const handleReconnect = async () => {
    console.log("Attempting to reconnect...")
    setConnectionStatus("connecting")
    setIceCandidates([])
    setIceErrors([])
    setError(null)

    cleanupCall()

    try {
      await initPeerConnection()
      await setupMedia()

      if (isInitiator) {
        await createInitialOffer()
      }
    } catch (error) {
      console.error("Reconnection failed:", error)
      setError(`Reconnection failed: ${error.message}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1 flex items-center justify-center">
        {/* Remote video (large) */}
        <div className="w-full h-full relative">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover ${connectionStatus !== "connected" ? "opacity-0" : "opacity-100"}`}
          />
          
          {/* Local video (small overlay) */}
          <div className="absolute bottom-4 right-4 w-1/4 max-w-[200px] aspect-video rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            {!isVideoOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <span className="text-white text-sm">Camera Off</span>
              </div>
            )}
          </div>
        </div>

        {/* Connection status overlays */}
        {connectionStatus === "connecting" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-medium mb-2">Connecting... ({iceGatheringState})</p>
            <p className="text-sm mb-4">Generated {iceCandidates.length} ICE candidates</p>
            {error && <p className="text-red-400 max-w-md text-center px-4 py-2 bg-red-900/30 rounded-lg">{error}</p>}
          </div>
        )}
        
        {connectionStatus === "failed" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
            <div className="bg-red-900/50 p-6 rounded-xl max-w-md">
              <h3 className="text-xl font-bold mb-4 text-center">Connection Failed</h3>
              <p className="mb-2">ICE Candidates: {iceCandidates.length}</p>
              <p className="mb-4">Errors: {iceErrors.length}</p>
              {error && <p className="text-red-300 mb-6 p-3 bg-red-950/50 rounded">{error}</p>}
              <div className="flex justify-center gap-4">
                <button 
                  onClick={handleReconnect}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  Retry Connection
                </button>
                <button 
                  onClick={onEndCall}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                >
                  End Call
                </button>
              </div>
            </div>
          </div>
        )}
        
        {connectionStatus === "disconnected" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
            <div className="bg-yellow-900/50 p-6 rounded-xl max-w-md">
              <h3 className="text-xl font-bold mb-4 text-center">Connection Lost</h3>
              <p className="mb-4">Attempting to reconnect automatically...</p>
              {error && <p className="text-yellow-300 mb-6 p-3 bg-yellow-950/50 rounded">{error}</p>}
              <div className="flex justify-center">
                <button 
                  onClick={handleReconnect}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  Retry Manually
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media controls */}
      <div className="bg-gray-900 p-4 flex items-center justify-center space-x-4">
        <button 
          onClick={() => toggleMedia("audio")}
          className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} transition`}
        >
          {isMuted ? "🔇 Unmute" : "🎤 Mute"}
        </button>
        <button 
          onClick={() => toggleMedia("video")}
          className={`p-3 rounded-full ${!isVideoOn ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} transition`}
        >
          {isVideoOn ? "📷 Stop Video" : "📹 Start Video"}
        </button>
        <button 
          onClick={handleScreenShare}
          className={`p-3 rounded-full ${isScreenSharing ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'} transition`}
        >
          {isScreenSharing ? "🖥 Stop Share" : "🖥 Share Screen"}
        </button>
        <button 
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition"
          onClick={onEndCall}
        >
          🚫 End Call
        </button>
      </div>

      {/* Debug panel - can be hidden in production */}
      <div className="bg-gray-900 border-t border-gray-800 p-2 text-xs text-gray-400">
        <div className="flex flex-wrap gap-4">
          <div>
            <strong>Status:</strong> {connectionStatus}
          </div>
          <div>
            <strong>ICE Gathering:</strong> {iceGatheringState}
          </div>
          <div>
            <strong>Signaling:</strong> {peerConnection.current?.signalingState || "N/A"}
          </div>
          <div>
            <strong>ICE Candidates:</strong> {iceCandidates.length}
          </div>
          <div>
            <strong>Errors:</strong> {iceErrors.length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoCall