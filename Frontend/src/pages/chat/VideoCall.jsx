"use client"

import { useEffect, useRef, useState } from "react"
import styles from "./VideoCall.module.css"
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorSmartphone, StopCircle, Loader2 } from "lucide-react"
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
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false)
  const offerOptions = useRef({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
    iceRestart: true,
  })
  const virtualCanvasRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Critical: Global state to prevent any concurrent camera operations
  const mediaOperationInProgress = useRef(false)
  const cameraAccessAttempts = useRef(0)
  const maxCameraAccessAttempts = 3
  const cameraResetAttempts = useRef(0)
  const maxCameraResetAttempts = 5
  const cameraDevices = useRef([])
  const currentCameraIndex = useRef(0)

  // Store received ICE candidates before peer connection is ready
  const pendingIceCandidates = useRef([])
  const isRemoteDescriptionSet = useRef(false)
  const mediaEstablished = useRef(false)
  const callSetupComplete = useRef(false)
  const setupInProgress = useRef(false)
  const offerReceived = useRef(false)
  const answerSent = useRef(false)
  const lastReceivedOffer = useRef(null)
  const cameraReleaseTimer = useRef(null)
  const ignoreIncomingOffers = useRef(false)
  const ignoreIncomingAnswers = useRef(false)

  // NEW: Track signaling state to prevent race conditions
  const signalingInProgress = useRef(false)
  const pendingSignalingOperations = useRef([])
  const negotiationNeeded = useRef(false)
  const politeMode = useRef(!isInitiator) // Receiver is "polite" and will roll back if needed
  const answerProcessed = useRef(false)
  const lastProcessedAnswerId = useRef(null)

  // Enhanced WebRTC Configuration with reliable STUN servers
  const webRTCConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
    iceTransportPolicy: "all",
    sdpSemantics: "unified-plan",
  }

  // Helper function to retry operations with exponential backoff
  const retryWithBackoff = async (operation, maxRetries = 3, initialDelay = 800) => {
    let retries = 0
    let delay = initialDelay

    while (retries < maxRetries) {
      try {
        return await operation()
      } catch (error) {
        retries++
        if (retries >= maxRetries) throw error

        console.log(`Operation failed, retrying in ${delay}ms... (${retries}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
      }
    }
  }

  // Helper function to wait until media operations are complete
  const waitForMediaOperations = async () => {
    if (mediaOperationInProgress.current) {
      console.log("Waiting for ongoing media operation to complete...")
      let waitTime = 0
      const maxWaitTime = 5000 // Maximum wait time of 5 seconds

      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!mediaOperationInProgress.current) {
            clearInterval(checkInterval)
            resolve()
          } else {
            waitTime += 200
            if (waitTime >= maxWaitTime) {
              clearInterval(checkInterval)
              mediaOperationInProgress.current = false // Force reset the flag
              console.warn("Media operation wait timeout - resetting flag")
              resolve()
            }
          }
        }, 200)
      })
    }
  }

  // NEW: Helper function to wait until signaling operations are complete
  const waitForSignalingOperations = async () => {
    if (signalingInProgress.current) {
      console.log("Waiting for ongoing signaling operation to complete...")
      let waitTime = 0
      const maxWaitTime = 5000 // Maximum wait time of 5 seconds

      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!signalingInProgress.current) {
            clearInterval(checkInterval)
            resolve()
          } else {
            waitTime += 200
            if (waitTime >= maxWaitTime) {
              clearInterval(checkInterval)
              signalingInProgress.current = false // Force reset the flag
              console.warn("Signaling operation wait timeout - resetting flag")
              resolve()
            }
          }
        }, 200)
      })
    }
  }

  // NEW: Queue signaling operations to prevent race conditions
  const queueSignalingOperation = async (operation) => {
    // Wait for any ongoing signaling operations
    await waitForSignalingOperations()

    signalingInProgress.current = true

    try {
      await operation()
    } catch (error) {
      console.error("Signaling operation failed:", error)
      throw error
    } finally {
      signalingInProgress.current = false

      // Process any pending operations
      if (pendingSignalingOperations.current.length > 0) {
        const nextOperation = pendingSignalingOperations.current.shift()
        queueSignalingOperation(nextOperation)
      }
    }
  }

  // Log available media devices and store camera devices
  const logAndStoreCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      console.log("Available media devices:", devices)

      // Store video input devices
      const videoDevices = devices.filter((device) => device.kind === "videoinput")
      cameraDevices.current = videoDevices

      return devices
    } catch (err) {
      console.error("Could not enumerate devices:", err)
      return []
    }
  }

  // Try to get a camera by cycling through available devices
  const tryNextCamera = async () => {
    if (cameraDevices.current.length === 0) {
      await logAndStoreCameraDevices()
    }

    if (cameraDevices.current.length === 0) {
      console.log("No camera devices found")
      return null
    }

    // Move to next camera
    currentCameraIndex.current = (currentCameraIndex.current + 1) % cameraDevices.current.length
    const device = cameraDevices.current[currentCameraIndex.current]

    console.log(`Trying camera ${currentCameraIndex.current + 1}/${cameraDevices.current.length}: ${device.label}`)

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: device.deviceId },
          width: { ideal: 320, max: 640 },
          height: { ideal: 240, max: 480 },
          frameRate: { max: 15 },
        },
        audio: true,
      })
    } catch (error) {
      console.error(`Failed to access camera ${device.label}:`, error)
      return null
    }
  }

  // Force camera reset by accessing a 1x1 video stream and immediately closing it
  const forceResetCamera = async () => {
    try {
      // If we've tried too many times, just give up
      if (cameraResetAttempts.current >= maxCameraResetAttempts) {
        console.log("Maximum camera reset attempts reached, giving up")
        return false
      }

      cameraResetAttempts.current++
      console.log(`Forcing camera reset (attempt ${cameraResetAttempts.current}/${maxCameraResetAttempts})...`)

      // First, ensure any existing camera streams are fully stopped
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          if (track.kind === "video") {
            track.stop()
            console.log(`Stopped existing video track: ${track.label}`)
          }
        })
      }

      // Clear any existing release timer
      if (cameraReleaseTimer.current) {
        clearTimeout(cameraReleaseTimer.current)
      }

      // Try to get a minimal stream to reset the camera
      const dummyStream = await navigator.mediaDevices
        .getUserMedia({
          video: { width: 1, height: 1 },
          audio: false,
        })
        .catch((error) => {
          console.error("Camera reset failed:", error)
          return null
        })

      if (!dummyStream) return false

      // Immediately stop all tracks to release the camera
      dummyStream.getTracks().forEach((track) => {
        track.stop()
        console.log(`Stopped dummy ${track.kind} track: ${track.label}`)
      })

      // Wait for the camera to be fully released
      await new Promise((resolve) => setTimeout(resolve, 1500))
      console.log("Camera reset complete")

      // Set a timer to ensure camera is fully released
      return new Promise((resolve) => {
        cameraReleaseTimer.current = setTimeout(() => {
          console.log("Camera release timer completed")
          resolve(true)
        }, 1000)
      })
    } catch (error) {
      console.error("Camera reset failed:", error)
      return false
    }
  }

  // Initialize peer connection with proper error handling
  const initPeerConnection = async () => {
    try {
      if (peerConnection.current) {
        console.log("Closing existing peer connection")
        peerConnection.current.close()
      }

      console.log("Initializing new peer connection")
      peerConnection.current = new RTCPeerConnection(webRTCConfig)
      isRemoteDescriptionSet.current = false
      offerReceived.current = false
      answerSent.current = false
      answerProcessed.current = false
      lastProcessedAnswerId.current = null
      ignoreIncomingOffers.current = false
      ignoreIncomingAnswers.current = false
      setConnectionStatus("connecting")
      console.log("PeerConnection initialized with config:", webRTCConfig)

      // ICE Event Handlers
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("New ICE Candidate:", event.candidate.type || "unknown type")
          setIceCandidates((prev) => [...prev, event.candidate])

          // Send each ICE candidate as it's generated with correct receiver ID
          socketService.sendSignal("iceCandidate", {
            callId,
            to: otherUser._id,
            candidate: event.candidate.toJSON(),
            from: userId,
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
          if (isInitiator && peerConnection.current.signalingState !== "closed") {
            restartIceConnection()
          }
          setError("Connection failed - attempting ICE restart")
        } else if (state === "connected" || state === "completed") {
          setError(null)
        }
      }

      peerConnection.current.onicegatheringstatechange = () => {
        const state = peerConnection.current.iceGatheringState
        console.log("ICE Gathering State:", state)
        setIceGatheringState(state)
      }

      peerConnection.current.onicecandidateerror = (error) => {
        // Only log serious errors
        if (error.errorCode !== 701) {
          console.error("ICE Candidate Error:", error)
          setIceErrors((prev) => [...prev, error])

          if (error.errorCode >= 500) {
            setError(`Network configuration error: ${error.errorText || "Unknown error"}`)
          }
        }
      }

      // Connection state monitoring
      peerConnection.current.onconnectionstatechange = () => {
        const state = peerConnection.current.connectionState
        console.log("Connection State:", state)

        if (state === "connected") {
          console.log("WebRTC connection established successfully!")
          callSetupComplete.current = true
          setError(null)
        } else if (state === "failed" || state === "disconnected") {
          console.log("Connection state:", state, "- attempting recovery")
          setError(`Connection ${state}. Trying to recover...`)
        }
      }

      // NEW: Handle negotiation needed event properly
      peerConnection.current.onnegotiationneeded = () => {
        console.log("Negotiation needed event triggered")
        negotiationNeeded.current = true

        // Only the initiator should respond to negotiationneeded
        if (isInitiator && !signalingInProgress.current) {
          console.log("Initiator responding to negotiation needed")
          handleNegotiationNeeded()
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

      // NEW: Log signaling state changes
      peerConnection.current.onsignalingstatechange = () => {
        console.log("Signaling state changed:", peerConnection.current.signalingState)

        // Reset flags when we return to stable state
        if (peerConnection.current.signalingState === "stable") {
          ignoreIncomingOffers.current = false
          ignoreIncomingAnswers.current = false
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

  // NEW: Handle negotiation needed properly
  const handleNegotiationNeeded = async () => {
    if (!negotiationNeeded.current || signalingInProgress.current) return

    negotiationNeeded.current = false

    // Queue this operation to prevent race conditions
    queueSignalingOperation(async () => {
      try {
        console.log("Creating offer due to negotiation needed")

        // Check if we're in a valid state to create an offer
        if (peerConnection.current.signalingState !== "stable") {
          console.log("Cannot create offer - connection not in stable state")
          return
        }

        const offer = await peerConnection.current.createOffer(offerOptions.current)

        // Double-check signaling state before setting local description
        if (peerConnection.current.signalingState !== "stable") {
          console.log("Signaling state changed during offer creation, aborting")
          return
        }

        await peerConnection.current.setLocalDescription(offer)
        console.log("Local description set (offer from negotiation)")

        // Send the offer
        socketService.sendSignal("offer", {
          callId,
          to: otherUser.id,
          sdp: offer,
          from: userId,
        })
      } catch (error) {
        console.error("Error during negotiation:", error)
      }
    })
  }

  // Apply stored ICE candidates once remote description is set
  const addPendingIceCandidates = async () => {
    if (pendingIceCandidates.current.length > 0 && peerConnection.current) {
      console.log(`Adding ${pendingIceCandidates.current.length} pending ICE candidates`)

      // Create a copy and clear original to avoid duplicate processing
      const candidates = [...pendingIceCandidates.current]
      pendingIceCandidates.current = []

      // Process candidates in batches with small delays
      const processBatch = async (candidates, batchSize = 5) => {
        for (let i = 0; i < candidates.length; i += batchSize) {
          const batch = candidates.slice(i, i + batchSize)

          for (const candidate of batch) {
            try {
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
              console.log("Added pending ICE candidate successfully")
            } catch (error) {
              console.error("Error adding pending ICE candidate:", error)
            }
          }

          // Small delay between batches
          if (i + batchSize < candidates.length) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }
      }

      await processBatch(candidates)
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

      // Queue this operation to prevent race conditions
      queueSignalingOperation(async () => {
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
      })
    } catch (error) {
      console.error("Error restarting ICE connection:", error)
      setError(`Failed to restart connection: ${error.message}`)
    }
  }

  // Create a virtual camera with animated background
  const createVirtualCamera = async (existingStream = null) => {
    console.log("Creating virtual camera")

    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Create a canvas for the virtual camera
    const canvas = document.createElement("canvas")
    canvas.width = 640
    canvas.height = 480
    virtualCanvasRef.current = canvas

    // Generate a stream from the canvas
    const canvasStream = canvas.captureStream(30) // 30 FPS
    const videoTrack = canvasStream.getVideoTracks()[0]

    if (!videoTrack) {
      console.error("Failed to create virtual camera video track")
      return existingStream || new MediaStream()
    }

    // Create a combined stream with audio from the existing stream (if any)
    let combinedStream

    if (existingStream && existingStream.getAudioTracks().length > 0) {
      combinedStream = new MediaStream()

      // Add the video track from canvas
      combinedStream.addTrack(videoTrack)

      // Add audio tracks from the existing stream
      existingStream.getAudioTracks().forEach((audioTrack) => {
        combinedStream.addTrack(audioTrack)
      })

      // Stop video tracks from the existing stream (but keep audio)
      existingStream.getVideoTracks().forEach((track) => track.stop())
    } else {
      // Just use the canvas stream if no audio
      combinedStream = canvasStream

      // Try to get audio-only stream if we don't have audio
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        })

        if (audioStream && audioStream.getAudioTracks().length > 0) {
          audioStream.getAudioTracks().forEach((track) => {
            combinedStream.addTrack(track)
          })
        }
      } catch (error) {
        console.error("Could not add audio to virtual camera:", error)
      }
    }

    // Start the animation for the virtual camera
    startVirtualCameraAnimation()

    return combinedStream
  }

  // Helper function to animate the virtual camera
  const startVirtualCameraAnimation = () => {
    if (!virtualCanvasRef.current) return

    let hue = 120 // Start with green

    const drawAnimatedBackground = () => {
      if (!virtualCanvasRef.current) return

      const ctx = virtualCanvasRef.current.getContext("2d")
      const width = virtualCanvasRef.current.width
      const height = virtualCanvasRef.current.height

      // Create a gradient background that slowly changes color
      hue = (hue + 0.5) % 360
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, `hsl(${hue}, 70%, 30%)`)
      gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 70%, 40%)`)

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Draw a pulsing circle
      const time = Date.now() / 1000
      const radius = 50 + Math.sin(time * 2) * 10

      ctx.beginPath()
      ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
      ctx.fill()

      // Add text
      ctx.font = "bold 24px Arial"
      ctx.fillStyle = "white"
      ctx.textAlign = "center"
      ctx.fillText("Camera Unavailable", width / 2, height / 2 - 60)

      ctx.font = "18px Arial"
      ctx.fillText("Using virtual camera", width / 2, height / 2 - 30)

      // Add user identifier
      ctx.font = "16px Arial"
      ctx.fillText(`User: ${userId.substring(0, 8)}...`, width / 2, height - 30)

      // Continue the animation
      animationFrameRef.current = requestAnimationFrame(drawAnimatedBackground)
    }

    // Start the animation
    drawAnimatedBackground()

    // Set error message
    setError("Using virtual camera. Your camera is in use by another application.")
  }

  // Helper function to create audio-only stream
  const createAudioOnlyStream = async () => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
    } catch (audioError) {
      console.error("Audio stream creation failed:", audioError)
      // Return empty stream if even audio fails
      return new MediaStream()
    }
  }

  // IMPROVED: Enhanced setupMedia function with better camera access and resource management
  const setupMedia = async (forceVirtual = false) => {
    // Wait for any ongoing media operations
    await waitForMediaOperations()

    // Set the media operation flag to prevent concurrent operations
    mediaOperationInProgress.current = true

    try {
      console.log("Setting up local media...")

      // Log and store available devices to help with debugging
      await logAndStoreCameraDevices()

      // Hard reset: Properly release ALL existing media resources
      if (localStream) {
        console.log("Stopping ALL existing tracks before requesting new ones")
        localStream.getTracks().forEach((track) => {
          track.stop()
          console.log(`Stopped ${track.kind} track: ${track.label}`)
        })
        setLocalStream(null)
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
        console.log("Cleared local video element source")
      }

      // CRITICAL: Long delay to fully release camera resources
      console.log("Waiting for camera resources to be fully released...")
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Force reset the camera using a dummy stream
      const resetSuccess = await forceResetCamera()
      if (!resetSuccess) {
        console.log("Camera reset failed, likely already in use")
      }

      // If we've tried multiple times without success, or if forceVirtual is true,
      // go straight to virtual camera
      if (forceVirtual || cameraAccessAttempts.current >= maxCameraAccessAttempts || cameraPermissionDenied) {
        console.log("Skipping real camera attempt, using virtual camera directly")
        const audioStream = await createAudioOnlyStream()
        const virtualStream = await createVirtualCamera(audioStream)

        // Set local stream
        setLocalStream(virtualStream)

        // Update video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = virtualStream
        }

        // Add tracks to peer connection
        if (peerConnection.current && virtualStream.getTracks().length > 0) {
          virtualStream.getTracks().forEach((track) => {
            console.log(`Adding ${track.kind} track to peer connection`)
            peerConnection.current.addTrack(track, virtualStream)
          })
          mediaEstablished.current = true
        }

        setIsVideoOn(true)
        return virtualStream
      }

      cameraAccessAttempts.current++

      // Try to get real media (with multiple approaches)
      let stream = null

      // APPROACH 1: Try with very basic constraints
      try {
        stream = await navigator.mediaDevices
          .getUserMedia({
            video: {
              width: { ideal: 320, max: 640 },
              height: { ideal: 240, max: 480 },
              frameRate: { max: 15 },
            },
            audio: true,
          })
          .catch((error) => {
            console.warn("Basic camera access failed:", error)
            return null
          })
      } catch (error) {
        console.warn("First camera attempt failed:", error)
      }

      // APPROACH 2: If first attempt failed, try with minimal constraints
      if (!stream) {
        try {
          stream = await navigator.mediaDevices
            .getUserMedia({
              video: {
                width: 160,
                height: 120,
                frameRate: 10,
              },
              audio: true,
            })
            .catch((error) => {
              console.warn("Minimal camera access failed:", error)
              return null
            })
        } catch (error) {
          console.warn("Second camera attempt failed:", error)
        }
      }

      // APPROACH 3: Try cycling through available cameras
      if (!stream) {
        stream = await tryNextCamera()
      }

      // APPROACH 4: If all camera attempts failed, try audio-only
      if (!stream) {
        console.error("All camera access attempts failed")

        try {
          console.log("Falling back to audio-only")
          stream = await createAudioOnlyStream()
          setIsVideoOn(false)
        } catch (audioError) {
          console.error("Even audio-only failed:", audioError)
          // Create an empty stream as last resort
          stream = new MediaStream()
          setIsVideoOn(false)
        }
      }

      // Check if we got a working stream with video
      const hasVideo = stream && stream.getVideoTracks().length > 0

      if (!hasVideo) {
        console.log("No video tracks in the acquired stream, using virtual camera")
        stream = await createVirtualCamera(stream)
        setIsVideoOn(true)
      } else {
        setIsVideoOn(true)
        console.log(
          "Successfully got video stream:",
          stream
            .getTracks()
            .map((t) => `${t.kind}:${t.label}`)
            .join(", "),
        )

        // Force enable video tracks
        stream.getVideoTracks().forEach((track) => {
          track.enabled = true
        })
      }

      // Update state with the new stream
      setLocalStream(stream)

      // Update video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Add tracks to peer connection if it exists
      if (peerConnection.current) {
        console.log("Adding tracks to peer connection")

        // Get existing senders
        const senders = peerConnection.current.getSenders()

        // Add/replace each track type
        stream.getTracks().forEach((track) => {
          const existingSender = senders.find((s) => s.track && s.track.kind === track.kind)

          if (existingSender) {
            console.log(`Replacing existing ${track.kind} track in connection`)
            existingSender.replaceTrack(track)
          } else {
            console.log(`Adding new ${track.kind} track to connection`)
            peerConnection.current.addTrack(track, stream)
          }
        })

        mediaEstablished.current = true
      }

      return stream
    } catch (error) {
      console.error("Media setup error:", error)
      setError(`Media setup issue: ${error.message}`)

      // Fall back to virtual camera as a last resort
      try {
        const audioStream = await createAudioOnlyStream()
        const virtualStream = await createVirtualCamera(audioStream)
        setLocalStream(virtualStream)

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = virtualStream
        }

        setIsVideoOn(true)
        return virtualStream
      } catch (fallbackError) {
        console.error("Even fallback to virtual camera failed:", fallbackError)
        throw error
      }
    } finally {
      // Always reset the flag when done
      mediaOperationInProgress.current = false
    }
  }

  // Create initial offer with correct receiver ID
  const createInitialOffer = async () => {
    try {
      if (!peerConnection.current) {
        console.error("Cannot create offer - peer connection not initialized")
        return
      }

      console.log("Creating initial offer for receiver:", otherUser._id)

      // Queue this operation to prevent race conditions
      await queueSignalingOperation(async () => {
        // Set flag to ignore incoming offers while we're creating our own
        ignoreIncomingOffers.current = true

        const offer = await peerConnection.current.createOffer(offerOptions.current)
        await peerConnection.current.setLocalDescription(offer)
        console.log("Local description set (offer)")

        // Add a small delay before sending the offer to ensure everything is ready
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Send the offer with correct receiver ID
        socketService.sendSignal("offer", {
          callId,
          to: otherUser._id,
          sdp: offer,
          from: userId,
        })
        console.log("Initial offer sent to:", otherUser._id)
      })
    } catch (error) {
      console.error("Error creating offer:", error)
      setError(`Failed to create offer: ${error.message}`)
    }
  }

  // Clean up resources
  const cleanupCall = () => {
    console.log("Cleaning up call resources...")

    if (peerConnection.current) {
      // Close all senders and receivers first
      const senders = peerConnection.current.getSenders()
      senders.forEach((sender) => {
        if (sender.track) {
          sender.track.stop()
          console.log(`Stopped sender track: ${sender.track.kind}`)
        }
      })

      peerConnection.current.close()
      peerConnection.current = null
    }

    // Ensure all local stream tracks are stopped
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop()
        console.log(`Stopped local track: ${track.kind} - ${track.label}`)
      })
      setLocalStream(null)
    }

    // Ensure remote stream tracks are stopped too
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => {
        track.stop()
        console.log(`Stopped remote track: ${track.kind} - ${track.label}`)
      })
      setRemoteStream(null)
    }

    if (screenTrack.current) {
      screenTrack.current.stop()
      screenTrack.current = null
    }

    // Cancel any animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Clear any timers
    if (cameraReleaseTimer.current) {
      clearTimeout(cameraReleaseTimer.current)
      cameraReleaseTimer.current = null
    }

    // Reset state variables
    isRemoteDescriptionSet.current = false
    mediaEstablished.current = false
    callSetupComplete.current = false
    setupInProgress.current = false
    offerReceived.current = false
    answerSent.current = false
    pendingIceCandidates.current = []
    mediaOperationInProgress.current = false
    cameraAccessAttempts.current = 0
    cameraResetAttempts.current = 0
    currentCameraIndex.current = 0
    signalingInProgress.current = false
    pendingSignalingOperations.current = []
    negotiationNeeded.current = false
    ignoreIncomingOffers.current = false
    ignoreIncomingAnswers.current = false
    answerProcessed.current = false
    lastProcessedAnswerId.current = null
  }

  // Add call decline handler
  useEffect(() => {
    const handleCallDeclinedOriginal = (data) => {
      console.log("Call declined event received", data)

      // Use the comprehensive cleanup function
      cleanupCall()

      // Additional UI state resets
      setConnectionStatus("disconnected")
      setError(null)
      setIceGatheringState("new")
      setIceCandidates([])
      setIceErrors([])

      // Notify parent component to close the call UI
      onEndCall()
    }

    // Handle both direct decline and broadcast events
    socketService.getSocket()?.on("callDeclined", handleCallDeclinedOriginal)
    socketService.getSocket()?.on("broadcastCallDeclined", handleCallDeclinedOriginal)
    socketService.getSocket()?.on("releaseMediaResources", (data) => {
      console.log("Release media resources event received", data)
      if (data.callId === callId) {
        handleCallDeclinedOriginal(data)
      }
    })

    // Set up broadcast handler
    socketService.handleCallDeclineBroadcast((data) => {
      if (data.callId === callId) {
        console.log("Call decline broadcast received, cleaning up...")
        handleCallDeclinedOriginal(data)
      }
    })

    return () => {
      socketService.getSocket()?.off("callDeclined", handleCallDeclinedOriginal)
      socketService.getSocket()?.off("broadcastCallDeclined", handleCallDeclinedOriginal)
      socketService.getSocket()?.off("releaseMediaResources")
      // Remove broadcast handler
      socketService.removeVideoListener("broadcastCallDeclined")
    }
  }, [callId, onEndCall])

  // IMPROVED: Better setup call function with more reliable camera access
  useEffect(() => {
    const setupCall = async () => {
      try {
        // Prevent multiple simultaneous setup attempts
        if (setupInProgress.current) {
          console.log("Setup already in progress, skipping")
          return
        }

        setupInProgress.current = true
        console.log(`Setting up call as ${isInitiator ? "INITIATOR" : "RECEIVER"} for call ID: ${callId}`)

        // Step 1: Initialize peer connection first
        await initPeerConnection()

        // Step 2: Set up local media stream
        console.log(`${isInitiator ? "INITIATOR" : "RECEIVER"}: Requesting media streams...`)

        // IMPROVED: More aggressive camera release before attempting access
        // First, ensure any existing camera resources are fully released
        if (localStream) {
          localStream.getTracks().forEach((track) => {
            track.stop()
            console.log(`Stopped existing ${track.kind} track: ${track.label}`)
          })
          setLocalStream(null)
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null
        }

        // Force camera reset with multiple attempts if needed
        let resetSuccess = false
        for (let i = 0; i < 3; i++) {
          resetSuccess = await forceResetCamera()
          if (resetSuccess) break
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        // Try to set up media with multiple approaches
        let stream = null

        // First try with standard constraints
        try {
          stream = await navigator.mediaDevices
            .getUserMedia({
              video: {
                width: { ideal: 320, max: 640 },
                height: { ideal: 240, max: 480 },
                frameRate: { max: 15 },
              },
              audio: true,
            })
            .catch((error) => {
              console.warn("Standard camera access failed:", error)
              return null
            })
        } catch (error) {
          console.warn("First camera attempt failed:", error)
        }

        // If first attempt failed, try with minimal constraints
        if (!stream) {
          try {
            stream = await navigator.mediaDevices
              .getUserMedia({
                video: {
                  width: 160,
                  height: 120,
                  frameRate: 10,
                },
                audio: true,
              })
              .catch((error) => {
                console.warn("Minimal camera access failed:", error)
                return null
              })
          } catch (error) {
            console.warn("Second camera attempt failed:", error)
          }
        }

        // Try cycling through available cameras
        if (!stream) {
          stream = await tryNextCamera()
        }

        // If all camera attempts failed, use virtual camera
        if (!stream) {
          console.error("All camera access attempts failed, using virtual camera")
          const audioStream = await createAudioOnlyStream()
          stream = await createVirtualCamera(audioStream)
        }

        if (stream) {
          // Set local stream
          setLocalStream(stream)

          // Update video element
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
          }

          // Add tracks to peer connection
          if (peerConnection.current && stream.getTracks().length > 0) {
            stream.getTracks().forEach((track) => {
              console.log(`Adding ${track.kind} track to peer connection`)
              peerConnection.current.addTrack(track, stream)
            })
            mediaEstablished.current = true
          }

          console.log(
            `${isInitiator ? "INITIATOR" : "RECEIVER"}: Media setup complete with tracks:`,
            stream
              .getTracks()
              .map((t) => `${t.kind}:${t.enabled}`)
              .join(", "),
          )

          // Force active video display by ensuring tracks are enabled
          stream.getVideoTracks().forEach((track) => {
            console.log(`Video track before force: ${track.label}, enabled: ${track.enabled}`)
            track.enabled = true
            console.log(`Video track after force: ${track.label}, enabled: ${track.enabled}`)
          })

          // Set video state based on tracks
          setIsVideoOn(stream.getVideoTracks().length > 0)
        } else {
          console.warn(`${isInitiator ? "INITIATOR" : "RECEIVER"}: No media stream acquired!`)
        }

        // Step 3: If initiator, create and send offer AFTER media is set up
        if (isInitiator) {
          console.log("INITIATOR: Creating and sending offer")
          await createInitialOffer()
          console.log("INITIATOR: Initial offer sent")
        } else {
          console.log("RECEIVER: Setup complete, waiting for offer")

          // For receiver, explicitly check if we already have an offer waiting
          if (offerReceived.current && !answerSent.current && lastReceivedOffer.current) {
            console.log("RECEIVER: Found pending offer, processing now")
            // Process the stored offer
            try {
              const { from, sdp } = lastReceivedOffer.current

              await queueSignalingOperation(async () => {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp))
                isRemoteDescriptionSet.current = true

                await addPendingIceCandidates()

                const answer = await peerConnection.current.createAnswer()
                await peerConnection.current.setLocalDescription(answer)

                socketService.sendSignal("answer", {
                  callId,
                  to: from,
                  sdp: answer,
                  from: userId,
                })

                answerSent.current = true
              })
            } catch (error) {
              console.error("Error processing stored offer:", error)
            }
          }
        }

        setupInProgress.current = false
      } catch (error) {
        console.error("Call setup error:", error)
        setError(`Call setup failed: ${error.message}`)
        setupInProgress.current = false
      }
    }

    // Start the call setup process
    setupCall()

    // Cleanup when component unmounts
    return () => {
      console.log("Component unmounting - releasing all media resources")

      // Stop all tracks from local stream
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop()
          console.log(`Unmount: Stopped local ${track.kind} track: ${track.label}`)
        })
      }

      // Stop all tracks from remote stream
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => {
          track.stop()
          console.log(`Unmount: Stopped remote ${track.kind} track: ${track.label}`)
        })
      }

      // Clear video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }

      cleanupCall()
    }
  }, [callId, otherUser?.id, isInitiator])

  // Handle signaling
  useEffect(() => {
    // Define handlers outside of the useEffect to avoid hook-related issues
    const handleVideoOffer = async ({ from, sdp }) => {
      console.log("Received offer from:", from)

      // Ignore offers if we're in the process of creating our own offer
      if (ignoreIncomingOffers.current) {
        console.log("Ignoring incoming offer as we're creating our own")
        return
      }

      // Store the offer for later processing if we're not ready
      lastReceivedOffer.current = { from, sdp }
      offerReceived.current = true

      try {
        // If setup is in progress, wait for it to complete
        if (setupInProgress.current) {
          console.log("Setup in progress, waiting before processing offer")
          await new Promise((resolve) => setTimeout(resolve, 1500))
        }

        // If we still don't have a peer connection, initialize one
        if (!peerConnection.current || peerConnection.current.signalingState === "closed") {
          console.log("Initializing peer connection for offer handling")
          await initPeerConnection()

          // If we don't have media yet, set it up
          if (!mediaEstablished.current) {
            console.log("Setting up media for offer handling")

            try {
              // Try with minimal constraints for better success rate
              const mediaStream = await navigator.mediaDevices
                .getUserMedia({
                  video: { width: 320, height: 240, frameRate: 15 },
                  audio: true,
                })
                .catch((err) => {
                  // If camera access fails, try audio only
                  console.warn("Camera access failed during offer handling:", err)
                  return navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true,
                  })
                })

              if (mediaStream) {
                setLocalStream(mediaStream)
                if (localVideoRef.current) {
                  localVideoRef.current.srcObject = mediaStream
                }

                // Add tracks to the peer connection
                mediaStream.getTracks().forEach((track) => {
                  peerConnection.current.addTrack(track, mediaStream)
                })

                // Update video state
                setIsVideoOn(mediaStream.getVideoTracks().length > 0)
                mediaEstablished.current = true
              }
            } catch (mediaError) {
              console.error("Failed to get media during offer handling:", mediaError)
              // Fall back to virtual camera
              const audioStream = await createAudioOnlyStream()
              const virtualStream = await createVirtualCamera(audioStream)

              if (virtualStream) {
                setLocalStream(virtualStream)
                if (localVideoRef.current) {
                  localVideoRef.current.srcObject = virtualStream
                }

                // Add tracks to the peer connection
                virtualStream.getTracks().forEach((track) => {
                  peerConnection.current.addTrack(track, virtualStream)
                })

                setIsVideoOn(true)
                mediaEstablished.current = true
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 500))
          }
        }

        // Now process the offer using the perfect negotiation pattern
        await queueSignalingOperation(async () => {
          console.log("Processing offer, current signaling state:", peerConnection.current.signalingState)

          // NEW: Implement perfect negotiation pattern
          const offerCollision = peerConnection.current.signalingState !== "stable" && !politeMode.current

          // If we're impolite and there's a collision, ignore this offer
          if (offerCollision) {
            console.log("Ignoring offer due to collision (impolite peer)")
            return
          }

          // If we're polite and there's a collision, roll back local description
          const rollback = peerConnection.current.signalingState !== "stable" && politeMode.current

          if (rollback) {
            console.log("Rolling back local description (polite peer)")
            await peerConnection.current.setLocalDescription({ type: "rollback" })
          }

          // Set remote description (the offer)
          console.log("Setting remote description (offer)")
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp))
          isRemoteDescriptionSet.current = true

          // Apply any pending ICE candidates
          await addPendingIceCandidates()

          // Create and set local description (the answer)
          console.log("Creating answer")
          const answer = await peerConnection.current.createAnswer()
          await peerConnection.current.setLocalDescription(answer)

          // Send the answer
          console.log("RECEIVER: Sending answer to:", from)
          socketService.sendSignal("answer", {
            callId,
            to: from,
            sdp: answer,
            from: userId,
          })

          answerSent.current = true

          // Log connection state for debugging
          console.log(
            "RECEIVER: Call setup complete, connection state:",
            peerConnection.current.connectionState,
            "signaling state:",
            peerConnection.current.signalingState,
          )
        })
      } catch (error) {
        console.error("Error handling offer:", error)
        setError(`Failed to process offer: ${error.message}`)

        // Try to recover by restarting the setup process
        if (!answerSent.current) {
          console.log("Attempting recovery by restarting setup")
          setupInProgress.current = false
          setTimeout(() => {
            initPeerConnection().then(() => {
              setupMedia(true).then(() => {
                // Force virtual camera for recovery
                if (lastReceivedOffer.current) {
                  // Process the stored offer again
                  const { from, sdp } = lastReceivedOffer.current

                  queueSignalingOperation(async () => {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp))
                    isRemoteDescriptionSet.current = true

                    await addPendingIceCandidates()

                    const answer = await peerConnection.current.createAnswer()
                    await peerConnection.current.setLocalDescription(answer)

                    socketService.sendSignal("answer", {
                      callId,
                      to: from,
                      sdp: answer,
                      from: userId,
                    })

                    answerSent.current = true
                  }).catch((err) => {
                    console.error("Recovery attempt failed:", err)
                  })
                }
              })
            })
          }, 2000)
        }
      }
    }

    const handleVideoAnswer = async ({ from, sdp }) => {
      console.log("Received answer from:", from)

      // Ignore duplicate answers or if we're not expecting an answer
      if (ignoreIncomingAnswers.current || (lastProcessedAnswerId.current === from && answerProcessed.current)) {
        console.log("Ignoring duplicate answer or not in a state to process answers")
        return
      }

      await queueSignalingOperation(async () => {
        try {
          if (!peerConnection.current || peerConnection.current.signalingState === "closed") {
            console.error("PeerConnection not ready for answer")
            return
          }

          // Check if we're in a valid state to set remote description
          if (peerConnection.current.signalingState !== "have-local-offer") {
            console.error(
              "Cannot set remote answer - not in have-local-offer state, current state:",
              peerConnection.current.signalingState,
            )
            return
          }

          // Set remote description (the answer)
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp))
          isRemoteDescriptionSet.current = true
          answerProcessed.current = true
          lastProcessedAnswerId.current = from
          console.log("Remote description set successfully (answer)")

          // Apply any pending ICE candidates
          await addPendingIceCandidates()
        } catch (error) {
          console.error("Error handling answer:", error)
          setError(`Failed to process answer: ${error.message}`)
        }
      })
    }

    const handleIceCandidate = async ({ from, candidate }) => {
      try {
        console.log("Received ICE candidate from:", from)

        if (!candidate) {
          console.log("Received empty ICE candidate, ignoring")
          return
        }

        // If peer connection doesn't exist yet or remote description is not set, store candidates for later
        if (!peerConnection.current || !isRemoteDescriptionSet.current) {
          console.log("Storing ICE candidate for later application")
          pendingIceCandidates.current.push(candidate)
          return
        }

        // Add the ICE candidate if connection is ready
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
          console.log("Added ICE candidate successfully")
        } catch (err) {
          console.error("Error adding ICE candidate:", err)
          // Store for retry if failed
          pendingIceCandidates.current.push(candidate)
        }
      } catch (error) {
        console.error("Error handling ICE candidate:", error)
      }
    }

    socketService.handleCallRejected = function (callback) {
      this._addVideoListener("callDeclined", callback)
    }

    socketService.handleVideoOffer(handleVideoOffer)
    socketService.handleVideoAnswer(handleVideoAnswer)
    socketService.handleIceCandidate(handleIceCandidate)

    socketService.handleCallRejected(() => {
      console.log("Call was declined by the other user")
      handleCallDeclined()
    })

    // Clean up event listeners when component unmounts
    return () => {
      socketService.removeVideoListener("offer")
      socketService.removeVideoListener("answer")
      socketService.removeVideoListener("iceCandidate")
      socketService.removeVideoListener("callDeclined")
    }
  }, [callId, userId])

  // Media Control Functions
  const toggleMedia = (type) => {
    if (!localStream) return

    const trackType = type === "audio" ? "getAudioTracks" : "getVideoTracks"
    localStream[trackType]().forEach((track) => {
      track.enabled = !track.enabled
    })

    type === "audio" ? setIsMuted(!isMuted) : setIsVideoOn(!isVideoOn)
  }

  // Enhanced startVideo function with better camera error handling
  const startVideo = async () => {
    // Don't do anything if video is already on or an operation is in progress
    if (isVideoOn || mediaOperationInProgress.current) return

    // Set the flag to prevent concurrent operations
    mediaOperationInProgress.current = true

    try {
      console.log("Attempting to start video...")

      // SOLUTION 1: Check if we already have video tracks that are just disabled
      if (localStream) {
        const existingVideoTracks = localStream.getVideoTracks()

        if (existingVideoTracks.length > 0) {
          console.log("Found existing video tracks, enabling them")
          // Just enable the existing tracks
          existingVideoTracks.forEach((track) => {
            track.enabled = true
          })

          setIsVideoOn(true)
          mediaOperationInProgress.current = false
          return
        }
      }

      // SOLUTION 2: Try to get camera access first with multiple approaches
      try {
        // Force camera reset to release any existing usage
        await forceResetCamera()

        // Try with progressively lower constraints
        const videoStream = await retryWithBackoff(
          async () => {
            try {
              // First try: Basic constraints
              return await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 320 }, height: { ideal: 240 } },
                audio: false,
              })
            } catch (err) {
              if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                console.log("Camera in use, trying with minimal constraints")

                // Second try: Absolute minimal constraints
                return await navigator.mediaDevices.getUserMedia({
                  video: { width: 160, height: 120, frameRate: 10 },
                  audio: false,
                })
              }
              throw err
            }
          },
          3,
          1000,
        )

        if (videoStream && videoStream.getVideoTracks().length > 0) {
          // We got a video stream!
          const videoTrack = videoStream.getVideoTracks()[0]

          // Add the video track to the existing stream
          if (localStream) {
            // Remove any existing video tracks first
            const oldVideoTracks = localStream.getVideoTracks()
            oldVideoTracks.forEach((track) => {
              localStream.removeTrack(track)
              track.stop()
            })

            // Add the new video track
            localStream.addTrack(videoTrack)

            // Update local video display
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStream
            }

            // Add the track to the peer connection
            if (peerConnection.current) {
              const senders = peerConnection.current.getSenders()
              const videoSender = senders.find((s) => s.track?.kind === "video")

              if (videoSender) {
                console.log("Replacing existing video track")
                await videoSender.replaceTrack(videoTrack)
              } else {
                console.log("Adding new video track to peer connection")
                peerConnection.current.addTrack(videoTrack, localStream)
              }

              // Create and send a new offer to update remote peer
              queueSignalingOperation(async () => {
                const offer = await peerConnection.current.createOffer()
                await peerConnection.current.setLocalDescription(offer)

                socketService.sendSignal("offer", {
                  callId,
                  to: otherUser.id,
                  sdp: offer,
                  from: userId,
                })
              })
            }

            setIsVideoOn(true)
            setError(null)
          }
        }
      } catch (cameraError) {
        console.error("All camera access attempts failed:", cameraError)

        // SOLUTION 3: Fall back to virtual camera
        console.log("Creating virtual camera fallback")

        // Create a virtual camera stream
        const audioStream = await createAudioOnlyStream()
        const stream = await createVirtualCamera(audioStream)

        if (stream && stream.getVideoTracks().length > 0) {
          // Update local stream with the virtual camera
          setLocalStream(stream)

          // Update local video display
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
          }

          // Add the track to the peer connection
          if (peerConnection.current) {
            const senders = peerConnection.current.getSenders()
            const videoSender = senders.find((s) => s.track?.kind === "video")

            if (videoSender) {
              console.log("Replacing existing video track with virtual camera")
              await videoSender.replaceTrack(stream.getVideoTracks()[0])
            } else {
              console.log("Adding virtual camera track to peer connection")
              peerConnection.current.addTrack(stream.getVideoTracks()[0], stream)
            }

            // Create and send a new offer to update remote peer
            queueSignalingOperation(async () => {
              const offer = await peerConnection.current.createOffer()
              await peerConnection.current.setLocalDescription(offer)

              socketService.sendSignal("offer", {
                callId,
                to: otherUser.id,
                sdp: offer,
                from: userId,
              })
            })
          }

          setIsVideoOn(true)
          setError("Using virtual camera. Your camera is in use by another application.")
        }
      }
    } catch (error) {
      console.error("Failed to start video:", error)
      setError(`Could not start video: ${error.message}`)
    } finally {
      // Always reset the flag when we're done
      mediaOperationInProgress.current = false
    }
  }

  // Improved screen sharing implementation
  const handleScreenShare = async () => {
    // Don't allow if another media operation is in progress
    if (mediaOperationInProgress.current) {
      console.log("Media operation in progress, cannot reconnect")
      return
    }

    mediaOperationInProgress.current = true

    try {
      if (!isScreenSharing) {
        console.log("Starting screen sharing...")

        // First, check if we have a working peer connection
        if (!peerConnection.current || peerConnection.current.connectionState !== "connected") {
          setError("Cannot share screen: No active connection. Try reconnecting first.")
          return
        }

        const screenStream = await navigator.mediaDevices
          .getDisplayMedia({
            video: {
              cursor: "always",
              // Lower resolution for better compatibility
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { max: 30 },
            },
            audio: false,
          })
          .catch((err) => {
            console.error("Screen sharing permission error:", err)
            setError(`Screen sharing permission denied: ${err.message}`)
            throw err
          })

        screenTrack.current = screenStream.getVideoTracks()[0]

        if (!screenTrack.current) {
          throw new Error("No video track available in screen share")
        }

        // Listen for when user stops sharing via browser UI
        screenTrack.current.onended = () => {
          console.log("Screen sharing stopped via browser UI")
          handleScreenShare()
        }

        // Find video sender to replace track
        const videoSender = peerConnection.current.getSenders().find((s) => s.track?.kind === "video")

        if (videoSender) {
          console.log("Found video sender, replacing track with screen share")
          await videoSender.replaceTrack(screenTrack.current)
          setIsScreenSharing(true)

          // Create a new offer to signal the track change
          queueSignalingOperation(async () => {
            const newOffer = await peerConnection.current.createOffer()
            await peerConnection.current.setLocalDescription(newOffer)

            // Send the new offer
            socketService.sendSignal("offer", {
              callId,
              to: otherUser.id,
              sdp: newOffer,
              from: userId,
            })
          })

          console.log("Screen sharing started and signaled to peer")
        } else {
          console.error("No video sender found to replace with screen share")
          // If no video sender exists, try to add as a new track
          try {
            console.log("Attempting to add screen share as a new track")
            peerConnection.current.addTrack(screenTrack.current, screenStream)
            setIsScreenSharing(true)

            // Create and send a new offer with the screen track
            queueSignalingOperation(async () => {
              const newOffer = await peerConnection.current.createOffer()
              await peerConnection.current.setLocalDescription(newOffer)

              socketService.sendSignal("offer", {
                callId,
                to: otherUser.id,
                sdp: newOffer,
                from: userId,
              })
            })

            console.log("Added screen share as new track and sent new offer")
          } catch (addTrackError) {
            console.error("Failed to add screen track:", addTrackError)
            screenTrack.current.stop()
            throw new Error("Could not add screen sharing track to the call")
          }
        }
      } else {
        console.log("Stopping screen sharing...")

        if (!peerConnection.current) {
          setError("Connection lost, cannot revert screen sharing")
          return
        }

        // When stopping screen share, try to go back to camera
        if (screenTrack.current) {
          screenTrack.current.stop()
          screenTrack.current = null
        }

        setIsScreenSharing(false)

        // Try to get camera back
        try {
          // Force reset camera first
          await forceResetCamera()

          // Try to get camera with minimal constraints
          const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240 },
            audio: false,
          })

          if (cameraStream && cameraStream.getVideoTracks().length > 0) {
            const videoTrack = cameraStream.getVideoTracks()[0]

            // Find video sender
            const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === "video")

            if (sender) {
              console.log("Replacing screen share with camera video")
              await sender.replaceTrack(videoTrack)

              // Update local stream
              if (localStream) {
                // Remove any existing video tracks
                localStream.getVideoTracks().forEach((track) => {
                  localStream.removeTrack(track)
                  track.stop()
                })

                // Add the new camera track
                localStream.addTrack(videoTrack)

                // Update video element
                if (localVideoRef.current) {
                  localVideoRef.current.srcObject = localStream
                }
              }

              // Create and send a new offer
              queueSignalingOperation(async () => {
                const newOffer = await peerConnection.current.createOffer()
                await peerConnection.current.setLocalDescription(newOffer)

                socketService.sendSignal("offer", {
                  callId,
                  to: otherUser.id,
                  sdp: newOffer,
                  from: userId,
                })
              })

              console.log("Screen sharing stopped, camera video restored")
              setError(null)
            }
          }
        } catch (cameraError) {
          console.error("Failed to restore camera after screen sharing:", cameraError)
          // Fall back to virtual camera
          await startVideo()
        }
      }
    } catch (error) {
      console.error("Screen Share Error:", error)
      setError(`Screen sharing failed: ${error.message}`)

      // Reset state if error occurs
      setIsScreenSharing(false)
      if (screenTrack.current) {
        screenTrack.current.stop()
        screenTrack.current = null
      }
    } finally {
      mediaOperationInProgress.current = false
    }
  }

  // Improved reconnection logic
  const handleReconnect = async () => {
    if (mediaOperationInProgress.current) {
      console.log("Media operation in progress, cannot reconnect")
      return
    }

    mediaOperationInProgress.current = true

    console.log("Attempting to reconnect...")
    setConnectionStatus("connecting")
    setIceCandidates([])
    setIceErrors([])
    setError(null)

    // Clean up existing resources
    cleanupCall()

    // Wait a moment before recreating everything
    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      // Reinitialize everything in the correct order
      await initPeerConnection()

      // Try to restore camera with minimal constraints
      try {
        await forceResetCamera()

        const mediaStream = await navigator.mediaDevices
          .getUserMedia({
            video: { width: 320, height: 240 },
            audio: true,
          })
          .catch((err) => {
            console.warn("Camera access failed during reconnect:", err)
            return navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            })
          })

        if (mediaStream) {
          setLocalStream(mediaStream)

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStream
          }

          // Add tracks to peer connection
          mediaStream.getTracks().forEach((track) => {
            peerConnection.current.addTrack(track, mediaStream)
          })

          setIsVideoOn(mediaStream.getVideoTracks().length > 0)
          mediaEstablished.current = true
        }
      } catch (mediaError) {
        console.error("Failed to restore media during reconnect:", mediaError)
        // Fall back to virtual camera
        await setupMedia(true)
      }

      // If we're the initiator, create a new offer
      if (isInitiator) {
        // Wait a moment to ensure media is properly set up
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await createInitialOffer()
      }
    } catch (error) {
      console.error("Reconnection failed:", error)
      setError(`Reconnection failed: ${error.message}`)
    } finally {
      mediaOperationInProgress.current = false
    }
  }

  const handleEndCall = () => {
    console.log("Ending call...")

    // Explicitly stop all tracks from local stream before cleaning up
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop()
        console.log(`Stopped local ${track.kind} track: ${track.label}`)
      })
      setLocalStream(null)
    }

    // Clear video elements to release references
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }

    // Then proceed with the rest of the cleanup
    cleanupCall()
    onEndCall()
  }

  // Add a handler for the new releaseMediaResources event
  useEffect(() => {
    const handleReleaseMediaResources = ({ callId }) => {
      console.log("Received explicit command to release media resources")

      // Stop all media tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop()
          console.log(`Stopped local ${track.kind} track: ${track.label}`)
        })
        setLocalStream(null)
      }

      // Clear video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
    }

    socketService.getSocket()?.on("releaseMediaResources", handleReleaseMediaResources)

    return () => {
      socketService.getSocket()?.off("releaseMediaResources", handleReleaseMediaResources)
    }
  }, [localStream])

  return (
    <div className={styles.videoCallContainer}>
      <div className={styles.videoGrid}>
        {/* Remote video */}
        <div className={`${styles.videoWrapper} ${styles.remoteVideo}`}>
          <video ref={remoteVideoRef} autoPlay playsInline className={styles.videoElement} />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Waiting for {otherUser.name} to join...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local video */}
        <div className={`${styles.videoWrapper} ${styles.localVideo}`}>
          <video ref={localVideoRef} autoPlay playsInline muted className={styles.videoElement} />
          {!isVideoOn && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center text-white">
              <span>Camera Off</span>
            </div>
          )}
          <div className={styles.controlsBar}>
            <button
              onClick={() => toggleMedia("audio")}
              className={`${styles.controlButton} ${isMuted ? styles.danger : ""}`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={() => toggleMedia("video")}
              className={`${styles.controlButton} ${!isVideoOn ? styles.danger : ""}`}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={handleScreenShare}
              className={`${styles.controlButton} ${isScreenSharing ? styles.danger : ""}`}
            >
              {isScreenSharing ? <StopCircle className="w-5 h-5" /> : <MonitorSmartphone className="w-5 h-5" />}
            </button>
            <button onClick={handleEndCall} className={`${styles.controlButton} ${styles.danger}`}>
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Connection status overlays */}
      {connectionStatus === "connecting" && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-[#CE0000] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium mb-2">Connecting...</p>
          {error && <p className="text-red-400 max-w-md text-center px-4 py-2 bg-red-900/30 rounded-lg">{error}</p>}
        </div>
      )}

      {connectionStatus === "failed" && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
          <div className="bg-white/10 p-6 rounded-xl max-w-md backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4 text-center">Connection Failed</h3>
            {error && <p className="text-red-300 mb-6 p-3 bg-red-950/50 rounded">{error}</p>}
            <div className="flex justify-center gap-4">
              <button onClick={handleReconnect} className={styles.acceptButton}>
                Retry Connection
              </button>
              <button onClick={onEndCall} className={styles.declineButton}>
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug info - hidden in production */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/50 p-2 text-xs text-gray-400 backdrop-blur-sm">
        <div className="flex flex-wrap gap-4 justify-center">
          <div>Status: {connectionStatus}</div>
          <div>ICE: {iceGatheringState}</div>
          <div>Candidates: {iceCandidates.length}</div>
          <div>Errors: {iceErrors.length}</div>
        </div>
      </div>
    </div>
  )
}

export default VideoCall
