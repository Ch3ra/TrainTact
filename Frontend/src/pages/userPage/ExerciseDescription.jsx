"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useParams, useLocation } from "react-router-dom"
import { Loader2, ArrowLeft, Volume2, VolumeX, Calendar, User, Clock, Award } from "lucide-react"
import { Link } from "react-router-dom"

const ExerciseDescription = () => {
  const [exercise, setExercise] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [muted, setMuted] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const videoRef = useRef(null)
  const { id } = useParams() // Get the exercise ID from URL
  const location = useLocation()
  const exerciseData = location.state?.exerciseData // Get any passed exercise data

  useEffect(() => {
    const fetchExerciseDetails = async () => {
      try {
        // If we already have the exercise data from navigation state, use it
        if (exerciseData) {
          setExercise(exerciseData)
          setLoading(false)
          return
        }

        // Otherwise fetch it from the API
        const response = await axios.get(`http://localhost:3000/api/exercises/${id}`)
        setExercise(response.data.data)
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch exercise details")
        setLoading(false)
        console.error("Error fetching exercise details:", err)
      }
    }

    fetchExerciseDetails()
  }, [id, exerciseData])

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted
      setMuted(!muted)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <div className="text-xl font-medium text-gray-700">Loading exercise details...</div>
      </div>
    )
  }

  if (error || !exercise) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg max-w-2xl w-full">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
              <p className="text-red-700 mt-1">{error || "Exercise not found"}</p>
              <Link
                to="/exercises"
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Back to exercises
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/myexercise" className="inline-flex items-center text-gray-600 hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to all exercises
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Exercise Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="md:flex">
            {/* Exercise Image */}
            <div className="md:flex-shrink-0 md:w-1/3">
              {exercise.cardPhoto ? (
                <img
                  src={`http://localhost:3000/${exercise.cardPhoto}`}
                  alt={`Exercise: ${exercise.exerciseGoal || "Fitness training"}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=300&width=400"
                  }}
                />
              ) : (
                <div className="h-full w-full bg-gray-100 flex items-center justify-center p-8">
                  <svg className="h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Exercise Info */}
            <div className="p-8 md:w-2/3">
              {exercise.exerciseGoal && (
                <div className="mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                    {exercise.exerciseGoal}
                  </span>
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {exercise.exerciseName || "7-Day Exercise Plan"}
              </h1>
              <p className="text-gray-600 mb-6">
                {exercise.description || "Follow this 7-day exercise plan to achieve your fitness goals."}
              </p>

              {/* Trainer Quick Info */}
              {exercise.trainer && exercise.trainer.user && (
                <div className="flex items-center">
                  <div className="mr-4">
                    {exercise.trainer.user.profilePicture ? (
                      <img
                        src={`http://localhost:3000/uploads/profilePictures/${exercise.trainer.user.profilePicture}`}
                        alt={exercise.trainer.user.userName || "Trainer"}
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-semibold border-2 border-primary/20">
                        {exercise.trainer.user.userName ? exercise.trainer.user.userName.charAt(0).toUpperCase() : "T"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created by</p>
                    <p className="font-semibold text-gray-900">{exercise.trainer.user.userName || "Anonymous"}</p>
                  </div>
                  {exercise.trainer.yearsOfExperience && (
                    <div className="ml-6 pl-6 border-l border-gray-200">
                      <p className="text-sm text-gray-500">Experience</p>
                      <p className="font-semibold text-gray-900">{exercise.trainer.yearsOfExperience} years</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Calendar className="inline-block h-5 w-5 mr-2" />
              Exercise Plan
            </button>
            <button
              onClick={() => setActiveTab("trainer")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "trainer"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <User className="inline-block h-5 w-5 mr-2" />
              Trainer Details
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "video"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <svg
                className="inline-block h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Video Demonstration
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Exercise Plan Tab */}
          {activeTab === "overview" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-6 w-6 mr-2 text-primary" />
                Exercise Plan
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {exercise.days && exercise.days.length > 0 ? (
                  exercise.days.map((day) => (
                    <div
                      key={day._id}
                      className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold mr-3">
                          {day.dayNumber}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Day {day.dayNumber}</h3>
                      </div>
                      <p className="text-gray-600">{day.activities}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">No daily exercise plan available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trainer Details Tab */}
          {activeTab === "trainer" && exercise.trainer && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <User className="h-6 w-6 mr-2 text-primary" />
                About the Trainer
              </h2>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Trainer Image and Basic Info */}
                <div className="md:w-1/3">
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm text-center">
                    {exercise.trainer.user && exercise.trainer.user.profilePicture ? (
                      <img
                        src={`http://localhost:3000/uploads/profilePictures/${exercise.trainer.user.profilePicture}`}
                        alt={exercise.trainer.user.userName || "Trainer"}
                        className="w-40 h-40 rounded-full object-cover mx-auto border-4 border-white shadow-md"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=160&width=160"
                        }}
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-full bg-primary text-white flex items-center justify-center text-4xl font-bold mx-auto border-4 border-white shadow-md">
                        {exercise.trainer.user && exercise.trainer.user.userName
                          ? exercise.trainer.user.userName.charAt(0).toUpperCase()
                          : "T"}
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-800 mt-4">
                      {exercise.trainer.user ? exercise.trainer.user.userName : "Anonymous Trainer"}
                    </h3>

                    <div className="mt-4 flex justify-center space-x-4">
                      {exercise.trainer.yearsOfExperience && (
                        <div className="flex flex-col items-center">
                          <Clock className="h-5 w-5 text-primary mb-1" />
                          <span className="text-sm text-gray-500">Experience</span>
                          <span className="font-semibold">{exercise.trainer.yearsOfExperience} years</span>
                        </div>
                      )}

                      {exercise.trainer.availabilityHours && (
                        <div className="flex flex-col items-center">
                          <Award className="h-5 w-5 text-primary mb-1" />
                          <span className="text-sm text-gray-500">Availability</span>
                          <span className="font-semibold capitalize">{exercise.trainer.availabilityHours}</span>
                        </div>
                      )}
                    </div>

                    {exercise.trainer.startDay && exercise.trainer.endDay && (
                      <div className="mt-4 bg-primary/10 rounded-lg p-3 text-sm">
                        <p className="text-primary font-medium">
                          Available from <span className="capitalize">{exercise.trainer.startDay}</span> to{" "}
                          <span className="capitalize">{exercise.trainer.endDay}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trainer Description */}
                <div className="md:w-2/3">
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm h-full">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Trainer Bio</h3>
                    {exercise.trainer.description ? (
                      <div
                        className="prose prose-sm max-w-none text-gray-600"
                        dangerouslySetInnerHTML={{ __html: exercise.trainer.description }}
                      />
                    ) : (
                      <p className="text-gray-500 italic">No trainer description available.</p>
                    )}

                    {exercise.trainer.price && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Pricing</h4>
                        <div className="bg-white rounded-lg p-4 inline-block">
                          <span className="text-2xl font-bold text-primary">${exercise.trainer.price}</span>
                         
                        </div>
                      </div>
                    )}

                    {/* Contact Button - You can add functionality to this later */}
                    <div className="mt-6">
                      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        Contact Trainer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Tab */}
          {activeTab === "video" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg
                  className="h-6 w-6 mr-2 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Video Demonstration
              </h2>

              {exercise.backgroundVideo ? (
                <div className="relative rounded-xl overflow-hidden aspect-video shadow-lg">
                  <video
                    ref={videoRef}
                    controls
                    className="w-full h-full object-cover"
                    src={`http://localhost:3000/${exercise.backgroundVideo}`}
                    onError={(e) => {
                      console.error("Video failed to load:", e)
                      e.target.parentElement.innerHTML =
                        '<div class="flex items-center justify-center h-full bg-gray-100"><p class="text-gray-500">Video failed to load</p></div>'
                    }}
                  />

                  <button
                    onClick={toggleMute}
                    className="absolute bottom-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all"
                  >
                    {muted ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <svg
                    className="h-16 w-16 text-gray-300 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-500">No video demonstration available for this exercise program.</p>
                </div>
              )}

              <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Video Instructions</h3>
                <p className="text-gray-600">
                  Watch the video demonstration to understand the proper form and technique for each exercise in this
                  program. Follow along with the trainer to ensure you're performing the exercises correctly and safely.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExerciseDescription

