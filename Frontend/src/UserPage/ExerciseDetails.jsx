"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  Calendar,
  Play,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Loader2,
  Clock,
  Award,
  CheckCircle,
  ExternalLink,
  Pause,
} from "lucide-react"
import axios from "axios"
import Navbar from "../public/components/Navbar"
import { toast } from "react-hot-toast"

const ExerciseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedDays, setExpandedDays] = useState({})
  const [error, setError] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isSelectingProgram, setIsSelectingProgram] = useState(false)
  const [clientId, setClientId] = useState(null) // Added clientId state
  const videoRef = useRef(null)

  // Fetch client ID on component mount
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        // Decode token to get user ID
        const decodedToken = JSON.parse(atob(token.split(".")[1]))
        const userId = decodedToken.id

        if (!userId) return

        // Fetch client details to get client ID
        const response = await axios.get(`http://localhost:3000/api/client/${userId}`)
        if (response.data && response.data.clientDetails && response.data.clientDetails._id) {
          setClientId(response.data.clientDetails._id)
          console.log("Client ID set:", response.data.clientDetails._id)
        }
      } catch (error) {
        console.error("Failed to fetch client ID:", error)
      }
    }

    fetchClientId()
  }, [])

  // Toggle day expansion
  const toggleDayExpansion = (dayNumber) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayNumber]: !prev[dayNumber],
    }))
    setSelectedDay(dayNumber)
  }

  // Toggle video playback
  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsVideoPlaying(!isVideoPlaying)
    }
  }

  const handleViewTrainerProfile = () => {
    if (!exercise || !exercise.trainer) {
      toast.error("Trainer information is not available")
      return
    }

    try {
      // Check if we have the original trainer data with user ID
      if (exercise.originalTrainerId) {
        navigate(`/trainerdetails/${exercise.originalTrainerId}`)
      } else {
        toast.error("Trainer user ID is not available")
      }
    } catch (err) {
      console.error("Error navigating to trainer profile:", err)
      toast.error("Failed to open trainer profile")
    }
  }

  // Handle select program - Updated to use clientId instead of userId
  const handleSelectProgram = async () => {
    if (!exercise) return

    try {
      setIsSelectingProgram(true)

      // Get user ID from localStorage or token
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("Please login to select a program")
        navigate("/authentication")
        return
      }

      // Check if we have the clientId
      if (!clientId) {
        toast.error("Client information not found. Please try again later.")
        return
      }

      const payload = {
        clientId: clientId, // Use clientId instead of userId
        exerciseId: exercise._id,
      }

      console.log("Sending request with payload:", payload)

      // Make API call to associate exercise with client
      const response = await axios({
        method: "post",
        url: "http://localhost:3000/api/client-exercises/select",
        data: payload,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Response:", response.data)

      if (response.data.success) {
        toast.success("Program selected successfully!")
        // Navigate to user profile
        navigate("/profile")
      } else {
        toast.error(response.data.message || "Failed to select program")
      }
    } catch (err) {
      console.error("Error selecting program:", err)
      const errorMessage = err.response?.data?.message || "Failed to select program. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsSelectingProgram(false)
    }
  }

  useEffect(() => {
    const fetchExerciseDetail = async () => {
      if (!id) return

      try {
        setLoading(true)
        setError(null)

        // Fetch exercise details
        const response = await axios.get(`http://localhost:3000/api/exercises/${id}`)

        // Check if the response has the expected structure
        if (response.data && response.data.success && response.data.data) {
          const exerciseData = response.data.data

          // Extract trainer data
          const trainerData = exerciseData.trainer || {}
          const userData = trainerData.user || {}

          // Save the original user ID for navigation
          const originalTrainerId = userData._id || ""

          // Format trainer data for display
          const formattedTrainer = {
            _id: trainerData._id || "",
            name: userData.userName || "Unknown Trainer",
            specialty: trainerData.description || "Fitness Trainer",
            photo: userData.profilePicture
              ? `http://localhost:3000/uploads/profilePictures/${userData.profilePicture}`
              : "https://randomuser.me/api/portraits/men/32.jpg",
            yearsOfExperience: trainerData.yearsOfExperience || 0,
            price: trainerData.price || 0,
            availabilityHours: trainerData.availabilityHours || "",
            startDay: trainerData.startDay || "",
            endDay: trainerData.endDay || "",
          }

          // Format image paths
          const cardPhoto = exerciseData.cardPhoto
            ? `http://localhost:3000/${exerciseData.cardPhoto}`
            : "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2069&auto=format&fit=crop"

          // Format video path if available
          const backgroundVideo = exerciseData.backgroundVideo
            ? `http://localhost:3000/${exerciseData.backgroundVideo}`
            : null

          // Calculate program length
          const programLength =
            exerciseData.days && exerciseData.days.length > 0 ? `${exerciseData.days.length} days` : "7 days"

          const processedExercise = {
            ...exerciseData,
            trainer: formattedTrainer,
            originalTrainerId, // Add the original user ID here
            cardPhoto,
            backgroundVideo,
            programLength,
          }

          setExercise(processedExercise)

          // Expand the first day by default
          if (processedExercise.days && processedExercise.days.length > 0) {
            setExpandedDays({ [processedExercise.days[0].dayNumber]: true })
            setSelectedDay(processedExercise.days[0].dayNumber)
          }
        } else {
          throw new Error("Invalid response format from API")
        }
      } catch (err) {
        console.error("Error fetching exercise details:", err)
        setError("Failed to load exercise details. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchExerciseDetail()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 text-red-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading workout program details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error || "Exercise not found"}</p>
            <Link to="/exercise" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md">
              Back to Exercises
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh]">
        {exercise.backgroundVideo ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              src={exercise.backgroundVideo}
              poster={exercise.cardPhoto}
              muted
              playsInline
              onEnded={() => setIsVideoPlaying(false)}
              onError={(e) => {
                console.error("Video error:", e)
                // Fallback to image if video fails
                e.target.style.display = "none"
                document.getElementById("fallback-image").style.display = "block"
              }}
            />
            <div
              id="fallback-image"
              className="absolute inset-0 bg-black hidden"
              style={{
                backgroundImage: `url(${exercise.cardPhoto})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                opacity: "0.8",
              }}
            ></div>
          </>
        ) : (
          <div
            className="absolute inset-0 bg-black"
            style={{
              backgroundImage: `url(${exercise.cardPhoto})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: "0.8",
            }}
            onError={(e) => {
              e.target.style.backgroundImage =
                "url('https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2069&auto=format&fit=crop')"
            }}
          ></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

        <div className="relative h-full flex flex-col justify-end p-6 md:p-10">
          <div className="max-w-7xl mx-auto w-full">
            <Link to="/exercise" className="inline-flex items-center text-white mb-4 hover:underline">
              <ArrowLeft className="mr-2" size={20} />
              Back to Exercises
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 truncate" title={exercise.exerciseGoal}>
              {exercise.exerciseGoal}
            </h1>
            <div className="flex items-center text-white/90">
              <img
                src={exercise.trainer.photo || "/placeholder.svg"}
                alt={exercise.trainer.name}
                className="w-10 h-10 rounded-full mr-3"
                onError={(e) => {
                  e.target.src = "https://randomuser.me/api/portraits/men/32.jpg"
                }}
              />
              <div>
                <div className="font-medium">{exercise.trainer.name}</div>
                <div className="text-sm opacity-80">{exercise.trainer.specialty}</div>
              </div>
            </div>
          </div>
        </div>

        {exercise.backgroundVideo && (
          <button
            className="absolute bottom-6 right-6 bg-red-600 text-white p-3 rounded-full z-10"
            onClick={toggleVideo}
          >
            {isVideoPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Program Details */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6">Program Overview</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                  <Calendar className="text-red-600 mr-3" size={24} />
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-medium">{exercise.programLength}</div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                  <Clock className="text-red-600 mr-3" size={24} />
                  <div>
                    <div className="text-sm text-gray-500">Time Commitment</div>
                    <div className="font-medium">45-60 min/day</div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                  <Award className="text-red-600 mr-3" size={24} />
                  <div>
                    <div className="text-sm text-gray-500">Difficulty</div>
                    <div className="font-medium">Intermediate</div>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4">Daily Workout Plan</h3>

              <div className="flex mb-6 overflow-x-auto pb-2">
                {exercise.days &&
                  exercise.days.map((day) => (
                    <button
                      key={day.dayNumber}
                      className={`flex-shrink-0 px-4 py-2 mr-2 rounded-md ${
                        selectedDay === day.dayNumber
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                      }`}
                      onClick={() => toggleDayExpansion(day.dayNumber)}
                    >
                      Day {day.dayNumber}
                    </button>
                  ))}
              </div>

              <div className="space-y-4">
                {exercise.days &&
                  exercise.days.map((day) => {
                    const isExpanded = expandedDays[day.dayNumber]
                    return (
                      <div
                        key={day.dayNumber}
                        className={`border rounded-lg overflow-hidden ${
                          selectedDay === day.dayNumber ? "ring-2 ring-red-600" : ""
                        }`}
                      >
                        <button
                          className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 text-left"
                          onClick={() => toggleDayExpansion(day.dayNumber)}
                        >
                          <div className="flex items-center">
                            <Calendar className="mr-3 text-red-600" size={20} />
                            <span className="font-medium">Day {day.dayNumber}</span>
                          </div>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        {isExpanded && (
                          <div className="p-4 bg-white">
                            <p className="text-gray-700 whitespace-pre-line">{day.activities}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>

              <div className="mt-8 pt-6 border-t">
                <h3 className="text-xl font-bold mb-4">Tips for Success</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span>Warm up properly before each workout session</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span>Stay hydrated throughout your workouts</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span>Focus on proper form rather than lifting heavier weights</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span>Get adequate rest between workout days</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span>Adjust weights and repetitions based on your fitness level</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Trainer Info & Actions */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">About the Trainer</h3>

              <div className="flex items-center mb-4">
                <img
                  src={exercise.trainer.photo || "/placeholder.svg"}
                  alt={exercise.trainer.name}
                  className="w-16 h-16 rounded-full mr-4"
                  onError={(e) => {
                    e.target.src = "https://randomuser.me/api/portraits/men/32.jpg"
                  }}
                />
                <div>
                  <div className="font-bold text-lg">{exercise.trainer.name}</div>
                  <div className="text-gray-600">{exercise.trainer.specialty}</div>
                </div>
              </div>

              <p className="text-gray-700 mb-4">
                {exercise.trainer.description ||
                  `${exercise.trainer.name} is a certified fitness professional with ${exercise.trainer.yearsOfExperience || 5}+ years of experience specializing in ${exercise.exerciseGoal.toLowerCase()} programs.`}
              </p>

              <button
                onClick={handleViewTrainerProfile}
                className="text-red-600 hover:text-red-700 font-medium inline-flex items-center"
              >
                View Full Profile
                <ExternalLink className="ml-1" size={16} />
              </button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-xl font-bold mb-4">Start This Program</h3>
              <p className="text-gray-700 mb-6">
                Ready to begin your fitness journey with this program? Click below to add it to your workout schedule.
              </p>

              <button
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-medium mb-3 flex items-center justify-center"
                onClick={handleSelectProgram}
                disabled={isSelectingProgram}
              >
                {isSelectingProgram ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Processing...
                  </>
                ) : (
                  "Select Program"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExerciseDetail
