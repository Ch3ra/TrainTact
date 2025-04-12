"use client"

import { useState, useEffect } from "react"
import {
  MapPin,
  Target,
  Weight,
  Ruler,
  Activity,
  Calendar,
  Clock,
  CheckCircle,
  DollarSign,
  User,
  Pen,
  XCircle,
  Search,
  FileText,
  CreditCard,
  Loader2,
  AlertCircle,
  X,
  UserPlus,
} from "lucide-react"
import axios from "axios"
import { Link, useNavigate } from "react-router-dom"
import { useNotifications } from "../../Notification/NotificationContext"
import NotificationPanel from "../../Notification/NotificationPannel"
import Navbar from "../../public/components/Navbar"
import { toast } from "react-hot-toast"

const UserProfile = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const [clientId, setClientId] = useState(null) // Added clientId state
  const [userRole, setUserRole] = useState(null)
  const [activeTab, setActiveTab] = useState("upcoming")
  const [exerciseRoutines, setExerciseRoutines] = useState([])
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // New loading state for initial data
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [missingProfileFields, setMissingProfileFields] = useState([])

  // Add state for selected programs
  const [selectedPrograms, setSelectedPrograms] = useState([])
  const [loadingSelectedPrograms, setLoadingSelectedPrograms] = useState(false)
  const [removingProgramId, setRemovingProgramId] = useState(null)

  // Authentication check on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        console.log("No token found")
        navigate("/authentication")
        return false
      }

      try {
        // Decode token to check role
        const decodedToken = JSON.parse(atob(token.split(".")[1]))
        console.log("Decoded token:", decodedToken)

        // The role field might be named differently
        const userRole =
          decodedToken.role ||
          decodedToken.userRole ||
          decodedToken.userType ||
          decodedToken.type ||
          decodedToken.accountType

        console.log("Detected user role:", userRole)

        // Check if user is a client
        if (userRole && userRole.toLowerCase() !== "client") {
          console.log("Access denied: User is not a client")
          navigate("/authentication")
          return false
        }

        // User is a client, set userId and continue
        setUserId(decodedToken.id)
        setUserRole(userRole)

        // Fetch client ID based on user ID
        fetchClientId(decodedToken.id)

        return true
      } catch (error) {
        console.error("Failed to decode token", error)
        console.error("Token content:", token)
        navigate("/authentication")
        return false
      }
    }

    // Run auth check
    checkAuth()
  }, [navigate])

  // Function to fetch client ID based on user ID
  const fetchClientId = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/client/${userId}`)
      if (response.data && response.data.clientDetails && response.data.clientDetails._id) {
        setClientId(response.data.clientDetails._id)
        console.log("Client ID set:", response.data.clientDetails._id)
      }
    } catch (error) {
      console.error("Failed to fetch client ID:", error)
    }
  }

  const [profileData, setProfileData] = useState({
    userName: "",
    email: "",
    location: "",
    fitnessGoal: "",
    fitnessLevel: "",
    height: "",
    weight: "",
    age: "",
    description: "",
    profilePicture: null,
  })

  // Use the notification context
  const { notifications, unreadCount, fetchNotifications } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)

  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev)
    if (!showNotifications) {
      // Fetch latest notifications when opening the panel
      fetchNotifications()
    }
  }

  useEffect(() => {
    // Only fetch profile data if userId is set (after authentication)
    if (userId) {
      fetchProfileData(userId)
    }
  }, [userId])

  // Fixed fetchProfileData function to only show modal when fields are actually missing
  const fetchProfileData = async (userId) => {
    try {
      setIsLoading(true) // Start loading
      const response = await axios.get(`http://localhost:3000/api/client/${userId}`)
      if (response.data) {
        const profileData = { ...response.data.user, ...response.data.clientDetails }
        setProfileData(profileData)

        // Check for missing profile fields
        const missingFields = []
        if (!profileData.height) missingFields.push("height")
        if (!profileData.weight) missingFields.push("weight")
        if (!profileData.location) missingFields.push("location")
        if (!profileData.description) missingFields.push("description")

        console.log("Missing fields:", missingFields)
        setMissingProfileFields(missingFields)

        // Only show the modal if there are actually missing fields
        if (missingFields.length > 0) {
          setShowProfileModal(true)
        } else {
          setShowProfileModal(false)
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error)
    } finally {
      setIsLoading(false) // End loading regardless of outcome
    }
  }

  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [completedSessions, setCompletedSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [primaryTrainer, setPrimaryTrainer] = useState(null)

  useEffect(() => {
    // Only fetch bookings if userId is set (after authentication)
    if (userId) {
      if (activeTab === "upcoming") {
        fetchBookingsAndTrainer(userId)
      } else if (activeTab === "completed") {
        fetchCompletedSessions(userId)
      }
    }
  }, [userId, activeTab])

  const fetchCompletedSessions = async (userId) => {
    try {
      setLoading(true)
      const url = `http://localhost:3000/api/availability/client/completed/${userId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch completed bookings`)
      }

      const data = await response.json()
      setCompletedSessions(data)
    } catch (error) {
      console.error("Error fetching completed sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExerciseRoutines = async (userId) => {
    try {
      setLoadingExercises(true)
      // Replace with your actual API endpoint
      const url = `http://localhost:3000/api/exercises/client/${userId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch exercise routines`)
      }

      const data = await response.json()
      setExerciseRoutines(data)

      // Assuming the API returns a list of exercises, and the first one is the selected one
      if (data && data.length > 0) {
        setSelectedExercise(data[0]) // Select the first exercise as the program
      } else {
        setSelectedExercise(null) // No program available
      }
    } catch (error) {
      console.error("Error fetching exercise routines:", error)
      // Set some sample data for demonstration
      setExerciseRoutines([
        {
          _id: "ex1",
          name: "Push-ups",
          goal: "Build upper body strength",
          image:
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHVzaCUyMHVwc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60",
          sets: 3,
          reps: 15,
        },
        {
          _id: "ex2",
          name: "Squats",
          goal: "Strengthen legs and core",
          image:
            "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3F1YXR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60",
          sets: 4,
          reps: 12,
        },
        {
          _id: "ex3",
          name: "Plank",
          goal: "Core stability and endurance",
          image:
            "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGxhbmt8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60",
          sets: 3,
          duration: "45 seconds",
        },
      ])
    } finally {
      setLoadingExercises(false)
    }
  }

  const fetchBookingsAndTrainer = async (userId) => {
    try {
      setLoading(true)
      const url = `http://localhost:3000/api/availability/clientBookings/${userId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings`)
      }

      const data = await response.json()
      const verifiedBookings = data.filter((booking) => booking.isClientVerified === true)

      // Separate upcoming and completed sessions
      const currentDate = new Date()
      const upcoming = []
      const completed = []

      verifiedBookings.forEach((booking) => {
        const bookingEndDate = new Date(booking.endDate)
        if (bookingEndDate < currentDate) {
          completed.push(booking)
        } else {
          upcoming.push(booking)
        }
      })

      setUpcomingSessions(upcoming)
      //setCompletedSessions(completed)

      // Find the primary trainer (most recent booking's trainer)
      if (verifiedBookings.length > 0) {
        const trainersMap = new Map()

        verifiedBookings.forEach((booking) => {
          if (booking.trainerId && !trainersMap.has(booking.trainerId._id)) {
            trainersMap.set(booking.trainerId._id, booking.trainerId)
          }
        })

        // Get the first trainer as primary
        if (trainersMap.size > 0) {
          const trainer = Array.from(trainersMap.values())[0]

          // Fetch additional trainer details if needed
          if (trainer._id) {
            try {
              const trainerResponse = await axios.get(`http://localhost:3000/api/trainer/details/${trainer._id}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              })

              if (trainerResponse.status === 200) {
                setPrimaryTrainer({
                  ...trainer,
                  ...trainerResponse.data.trainer,
                })
              }
            } catch (error) {
              console.error("Failed to fetch detailed trainer info:", error)
              setPrimaryTrainer(trainer)
            }
          } else {
            setPrimaryTrainer(trainer)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Add function to fetch selected programs - UPDATED to use clientId instead of userId
  const fetchSelectedPrograms = async () => {
    try {
      setLoadingSelectedPrograms(true)
      const token = localStorage.getItem("token")

      // Check if clientId is available
      if (!clientId) {
        console.log("Client ID not available yet, waiting...")
        return
      }

      // Using the new API endpoint with clientId instead of userId
      const response = await axios.get(`http://localhost:3000/api/client-exercises/${clientId}?active=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success && response.data.data) {
        setSelectedPrograms(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching selected programs:", error)
      // Don't show error toast as this is not critical
    } finally {
      setLoadingSelectedPrograms(false)
    }
  }

  // Add useEffect to fetch selected programs when clientId is available
  useEffect(() => {
    if (clientId) {
      fetchSelectedPrograms()
    }
  }, [clientId])

  // Add function to remove selected program - UPDATED to use clientId instead of userId
  const removeSelectedProgram = async (exerciseId) => {
    try {
      setRemovingProgramId(exerciseId)
      const token = localStorage.getItem("token")

      // Check if clientId is available
      if (!clientId) {
        toast.error("Client information not found. Please try again later.")
        return
      }

      // Using the new API endpoint with clientId instead of userId
      const response = await axios.delete(`http://localhost:3000/api/client-exercises/${clientId}/${exerciseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success) {
        // Update the UI by filtering out the removed program
        setSelectedPrograms(selectedPrograms.filter((item) => item.exercise._id !== exerciseId))
        toast.success("Program removed successfully")
      } else {
        toast.error(response.data.message || "Failed to remove program")
      }
    } catch (error) {
      console.error("Error removing selected program:", error)
      toast.error("Failed to remove program. Please try again.")
    } finally {
      setRemovingProgramId(null)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchExerciseRoutines(userId)
    }
  }, [userId])

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/authentication")
  }

  const handleEditProfile = () => {
    // Store profile data in localStorage to access it in the edit form
    localStorage.setItem("profileDataForEdit", JSON.stringify(profileData))
    navigate("/editprofile")
  }

  // Function to handle messaging a trainer
  const handleMessageTrainer = () => {
    toast.error("You can only message trainers that you have booked. Please book a session first.", {
      duration: 5000,
      icon: "🔒",
    })
  }

  // New function to handle adding profile details - FIXED to use /addProfile instead of /editprofile
  const handleAddProfileDetails = () => {
    navigate("/addProfile")
    toast.success("Let's complete your profile details!", {
      duration: 3000,
      icon: "👤",
    })
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return ""
    const options = { weekday: "short", year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString("en-US", options)
  }

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return ""
    return timeString
  }

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-12 h-12 text-[#CE0000] animate-spin mb-4" />
      <p className="text-gray-500">Loading data...</p>
    </div>
  )

  const removeSelectedExercise = () => {
    setSelectedExercise(null)
  }

  const handleFillProfileNow = () => {
    setShowProfileModal(false)
    navigate("/addProfile") // FIXED: Changed from /editprofile to /addProfile
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Profile Completion Modal - Only shown when there are missing fields */}
      {showProfileModal && missingProfileFields.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Complete Your Profile</h3>
            </div>

            <p className="text-gray-600 mb-4">
              Your profile is incomplete. Adding these details will help trainers provide better personalized programs
              for you.
            </p>

            {missingProfileFields.length > 0 && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Missing information:</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  {missingProfileFields.map((field, index) => (
                    <li key={index}>{field.charAt(0).toUpperCase() + field.slice(1)}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleFillProfileNow}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Fill Now
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Panel */}
      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Profile Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Client Profile</h2>
                  <p className="text-gray-500">Personal information</p>
                </div>
                <div className="flex gap-2">
                  {/* Add Profile Button - Always visible and using the correct path */}
                  <Link to="/addProfile">
                    <button className="px-3 py-1.5 bg-[#CE0000] text-white rounded-md text-sm font-medium hover:bg-[#b00000] transition-colors flex items-center gap-1">
                      <UserPlus size={14} />
                      Add Profile
                    </button>
                  </Link>
                  <button
                    onClick={handleEditProfile}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
                  >
                    <Pen size={14} />
                    Edit Profile
                  </button>
                </div>
              </div>

              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-32 h-32 bg-gray-100 rounded-full mb-4 overflow-hidden">
                      <img
                        src={
                          profileData.profilePicture
                            ? ` ${profileData.profilePicture}`
                            : "https://randomuser.me/api/portraits/men/32.jpg"
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="mt-4 text-2xl font-bold text-gray-900">{profileData.userName || "Loading..."}</h3>
                    <p className="text-gray-500">{profileData.email || "Loading..."}</p>
                  </div>

                  <div className="space-y-4">
                    {profileData.age && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700">Age: {profileData.age} years</span>
                      </div>
                    )}

                    {profileData.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700">{profileData.location}</span>
                      </div>
                    )}

                    {profileData.fitnessGoal && (
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700">Goal: {profileData.fitnessGoal}</span>
                      </div>
                    )}

                    {profileData.weight && (
                      <div className="flex items-center gap-3">
                        <Weight className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700">Weight: {profileData.weight}</span>
                      </div>
                    )}

                    {profileData.height && (
                      <div className="flex items-center gap-3">
                        <Ruler className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700">Height: {profileData.height}</span>
                      </div>
                    )}

                    {profileData.fitnessLevel && (
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700">Fitness Level: {profileData.fitnessLevel}</span>
                      </div>
                    )}
                  </div>

                  {/* Missing Profile Fields Alert */}
                  {missingProfileFields.length > 0 && (
                    <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-800 mb-1">Complete your profile</h4>
                          <p className="text-sm text-red-700 mb-2">Your profile is missing some important details:</p>
                          <ul className="list-disc pl-5 text-sm text-red-700 space-y-0.5">
                            {missingProfileFields.map((field, index) => (
                              <li key={index}>{field.charAt(0).toUpperCase() + field.slice(1)}</li>
                            ))}
                          </ul>
                          <button
                            onClick={handleAddProfileDetails}
                            className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1 w-full justify-center"
                          >
                            <UserPlus size={14} />
                            Add Missing Details
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description Section */}
                  {profileData.description && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                      <div className="text-gray-600" dangerouslySetInnerHTML={{ __html: profileData.description }} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Trainer Information Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">My Trainer</h2>
                  <p className="text-gray-500">Current assigned trainer</p>
                </div>
                <Link to="/mytrainer">
                  <button className="px-4 py-2 bg-[#CE0000] hover:bg-[#b00000] text-white rounded-md text-sm font-medium transition-colors">
                    My Recent Trainers
                  </button>
                </Link>
              </div>

              {loading ? (
                <LoadingSpinner />
              ) : primaryTrainer ? (
                <>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={
                          primaryTrainer.profilePicture
                            ? `http://localhost:3000/uploads/profilePictures/${primaryTrainer.profilePicture}`
                            : "https://randomuser.me/api/portraits/women/44.jpg"
                        }
                        alt="Trainer profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{primaryTrainer.userName}</h3>
                      <p className="text-gray-600">
                        {primaryTrainer.description ||
                          primaryTrainer.bibliography ||
                          "Certified personal trainer" +
                            (primaryTrainer.fitnessGoal
                              ? ` with specialization in ${primaryTrainer.fitnessGoal.toLowerCase()}`
                              : "")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Experience</h4>
                      <p className="text-lg font-semibold">
                        {primaryTrainer.yearsOfExperience ? `${primaryTrainer.yearsOfExperience} years` : "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Rate</h4>
                      <p className="text-lg font-semibold">
                        {primaryTrainer.price ? `$${primaryTrainer.price}/hour` : "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Availability</h4>
                      <p className="text-lg font-semibold">
                        {primaryTrainer.startDay && primaryTrainer.endDay
                          ? `${primaryTrainer.startDay} - ${primaryTrainer.endDay}`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Preferred Hours</h4>
                      <p className="text-lg font-semibold">{primaryTrainer.availabilityHours || "N/A"}</p>
                    </div>
                  </div>

                  {/* Booking Process Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-[#CE0000]" />
                      Process to Book Me
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <div className="bg-[#CE0000] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                          1
                        </div>
                        <div className="flex items-center">
                          <Search className="w-5 h-5 text-gray-700 mr-2" />
                          <span>
                            Go to the <strong>Find Trainer</strong> section
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-[#CE0000] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                          2
                        </div>
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-700 mr-2" />
                          <span>
                            Search for <strong>{primaryTrainer.userName}</strong> and select
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-[#CE0000] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                          3
                        </div>
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-700 mr-2" />
                          <span>Open my form and fill in all required details</span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-[#CE0000] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                          4
                        </div>
                        <div className="flex items-center">
                          <CreditCard className="w-5 h-5 text-gray-700 mr-2" />
                          <span>Pay the amount or pay during the session</span>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleMessageTrainer}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Message Trainer
                    </button>
                    <Link to={`/trainer/${primaryTrainer._id}`} className="flex-1">
                      <button className="w-full px-4 py-2 bg-[#CE0000] hover:bg-[#b00000] text-white rounded-md text-sm font-medium transition-colors">
                        View Profile
                      </button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">You don't have any trainers assigned yet.</p>
                  <Link to="/trainerExplore">
                    <button className="px-4 py-2 bg-[#CE0000] hover:bg-[#b00000] text-white rounded-md text-sm font-medium transition-colors">
                      Find a Trainer
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exercise Routine Section - Updated to use the new API endpoints */}
        <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Exercise Routine</h2>
                <p className="text-gray-500">Your personalized workout plan</p>
              </div>
              <Link to="/exercises">
                <button className="px-4 py-2 bg-[#CE0000] hover:bg-[#b00000] text-white rounded-md text-sm font-medium transition-colors">
                  View All Exercises
                </button>
              </Link>
            </div>
          </div>

          <div className="p-6">
            {/* Selected Programs */}
            {loadingSelectedPrograms ? (
              <div className="mb-8">
                <LoadingSpinner />
              </div>
            ) : selectedPrograms.length > 0 ? (
              <div className="mb-8 border-b pb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Selected Programs</h3>
                </div>

                <div className="space-y-6">
                  {selectedPrograms.map((item) => (
                    <div key={item._id} className="bg-gray-50 rounded-lg overflow-hidden border">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/3">
                          <img
                            src={
                              item.exercise.cardPhoto
                                ? `http://localhost:3000/${item.exercise.cardPhoto}`
                                : "/placeholder.svg"
                            }
                            alt={item.exercise.exerciseGoal}
                            className="w-full h-48 md:h-full object-cover"
                            onError={(e) => {
                              e.target.src =
                                "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2069&auto=format&fit=crop"
                            }}
                          />
                        </div>
                        <div className="p-5 md:w-2/3">
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-bold text-gray-900 mb-2">{item.exercise.exerciseGoal}</h4>
                            <button
                              onClick={() => removeSelectedProgram(item.exercise._id)}
                              disabled={removingProgramId === item.exercise._id}
                              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                            >
                              {removingProgramId === item.exercise._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-[#CE0000]" />
                              <span className="text-gray-700">
                                {item.exercise.days ? `${item.exercise.days.length} days` : "7 days"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-[#CE0000]" />
                              <span className="text-gray-700">45-60 min/day</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-5 h-5 text-[#CE0000]" />
                              <span className="text-gray-700">
                                {item.exercise.trainer?.userName || item.exercise.trainer?.name || "Trainer"}
                              </span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h5 className="font-medium text-gray-800 mb-2">Program Overview:</h5>
                            <p className="text-gray-600">
                              This program is designed to help you achieve your{" "}
                              {item.exercise.exerciseGoal?.toLowerCase() || "fitness"} goals with daily structured
                              workouts.
                            </p>
                          </div>

                          <Link to={`/exercises/${item.exercise._id}`}>
                            <button className="px-4 py-2 bg-[#CE0000] hover:bg-[#b00000] text-white rounded-md text-sm font-medium transition-colors">
                              View Full Program
                            </button>
                          </Link>
                        </div>
                      </div>

                      {/* Preview of first day */}
                      {item.exercise.days && item.exercise.days.length > 0 && (
                        <div className="border-t p-5">
                          <h5 className="font-medium text-gray-800 mb-3">
                            Day {item.exercise.days[0].dayNumber} Preview:
                          </h5>
                          <p className="text-gray-600 line-clamp-3 whitespace-pre-line">
                            {item.exercise.days[0].activities}
                          </p>
                          <div className="mt-2">
                            <Link
                              to={`/exercises/${item.exercise._id}`}
                              className="text-[#CE0000] hover:text-[#b00000] text-sm font-medium"
                            >
                              See full workout plan →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No exercise programs selected yet.</p>
                <p className="text-gray-500">
                  Browse our exercise programs and select one to start your fitness journey.
                </p>
                <Link to="/exercises" className="mt-4 inline-block">
                  <button className="px-4 py-2 bg-[#CE0000] hover:bg-[#b00000] text-white rounded-md text-sm font-medium transition-colors">
                    Browse Exercise Programs
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sessions Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">Your Training Sessions</h2>
            <p className="text-gray-500">Manage your upcoming and past sessions</p>
          </div>

          <div className="w-full">
            <div className="px-6 pt-4">
              <div className="grid w-full grid-cols-2 mb-4 border rounded-md overflow-hidden">
                <button
                  className={`py-2 text-center transition-colors ${
                    activeTab === "upcoming"
                      ? "bg-[#CE0000] text-white font-medium"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveTab("upcoming")}
                >
                  Upcoming Sessions
                </button>
                <button
                  className={`py-2 text-center transition-colors ${
                    activeTab === "completed"
                      ? "bg-[#CE0000] text-white font-medium"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveTab("completed")}
                >
                  Completed Sessions
                </button>
              </div>
            </div>

            {activeTab === "upcoming" && (
              <div className="p-6 pt-2">
                {loading ? (
                  <LoadingSpinner />
                ) : upcomingSessions.length > 0 ? (
                  <div className="space-y-6">
                    {upcomingSessions.map((session, index) => (
                      <div
                        key={index}
                        className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="bg-gradient-to-r from-gray-50 to-white p-5">
                          <div className="flex flex-wrap items-center justify-between mb-4">
                            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                              <span className="bg-[#CE0000] text-white text-xs font-medium px-2.5 py-1 rounded">
                                Upcoming
                              </span>
                              <span className="text-gray-500 text-sm">BOOK-{session.bookingNumber || index + 1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-sm">Payment Status</span>
                              <div
                                className={`flex items-center gap-1 ${
                                  session.paymentStatus === "paid"
                                    ? "text-green-600 bg-green-50"
                                    : "text-yellow-600 bg-yellow-50"
                                } px-2 py-1 rounded-full`}
                              >
                                {session.paymentStatus === "paid" ? (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span className="font-medium text-sm">Paid</span>
                                  </>
                                ) : (
                                  <>
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span className="font-medium text-sm">Pending</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="hidden sm:block">
                              <div className="w-12 h-12 bg-[#CE0000] rounded-full flex items-center justify-center text-white">
                                <User className="w-6 h-6" />
                              </div>
                            </div>

                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {session.message || `Session with ${session?.trainerId?.userName || "Trainer"}`}
                              </h3>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100">
                                  <Calendar className="w-5 h-5 text-[#CE0000]" />
                                  <span className="text-gray-700">{formatDate(session.startDate)}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100">
                                  <Clock className="w-5 h-5 text-[#CE0000]" />
                                  <span className="text-gray-700">
                                    {formatTime(session.startTime)} ({session.duration || 60} min)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100">
                                  <DollarSign className="w-5 h-5 text-[#CE0000]" />
                                  <span className="text-gray-700">
                                    {session.amount || session.trainerId?.price || "N/A"}
                                  </span>
                                </div>
                              </div>

                              {session.message && (
                                <div className="bg-white p-4 rounded-lg mb-4 border border-gray-100">
                                  <h4 className="font-medium text-gray-700 mb-1">Session Notes:</h4>
                                  <p className="text-gray-600">{session.message}</p>
                                </div>
                              )}

                              <div className="flex justify-end">
                                <button className="px-4 py-2 bg-[#CE0000] hover:bg-[#b00000] text-white rounded-md text-sm font-medium transition-colors">
                                  Join Session
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No upcoming sessions found.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "completed" && (
              <div className="p-6 pt-2">
                {loading ? (
                  <LoadingSpinner />
                ) : completedSessions.length > 0 ? (
                  <div className="space-y-6">
                    {completedSessions.map((session, index) => (
                      <div
                        key={index}
                        className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="bg-gradient-to-r from-gray-50 to-white p-5">
                          <div className="flex flex-wrap items-center justify-between mb-4">
                            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                              <span className="bg-gray-500 text-white text-xs font-medium px-2.5 py-1 rounded">
                                Completed
                              </span>
                              <span className="text-gray-500 text-sm">BOOK-{session.bookingNumber || index + 1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-sm">Payment Status</span>
                              <div
                                className={`flex items-center gap-1 ${
                                  session.paymentStatus === "paid"
                                    ? "text-green-600 bg-green-50"
                                    : "text-red-600 bg-red-50"
                                } px-2 py-1 rounded-full`}
                              >
                                {session.paymentStatus === "paid" ? (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span className="font-medium text-sm">Paid</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span className="font-medium text-sm">Pending</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="hidden sm:block">
                              <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white">
                                <User className="w-6 h-6" />
                              </div>
                            </div>

                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {session.message || `Session with ${session?.trainerId?.userName || "Trainer"}`}
                              </h3>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100">
                                  <Calendar className="w-5 h-5 text-gray-500" />
                                  <span className="text-gray-700">{formatDate(session.startDate)}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100">
                                  <Clock className="w-5 h-5 text-gray-500" />
                                  <span className="text-gray-700">
                                    {formatTime(session.startTime)} ({session.duration || 60} min)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100">
                                  <DollarSign className="w-5 h-5 text-gray-500" />
                                  <span className="text-gray-700">
                                    {session.amount || session.trainerId?.price || "N/A"}
                                  </span>
                                </div>
                              </div>

                              {session.message && (
                                <div className="bg-white p-4 rounded-lg mb-4 border border-gray-100">
                                  <h4 className="font-medium text-gray-700 mb-1">Session Notes:</h4>
                                  <p className="text-gray-600">{session.message}</p>
                                </div>
                              )}

                              <div className="flex justify-end">
                                <button className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors">
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No completed sessions yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
