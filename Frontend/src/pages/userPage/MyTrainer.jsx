"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import { Bell, Mail, ArrowLeft, Star, MessageCircle, Video, Calendar, Clock, CheckCircle } from "lucide-react"
import { useNotifications } from "../../Notification/NotificationContext"
import NotificationPanel from "../../Notification/NotificationPannel"

const MyTrainer = () => {
  const [clientTrainers, setClientTrainers] = useState([])
  const [completedWorkouts, setCompletedWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [profileData, setProfileData] = useState({
    userName: "",
    profilePicture: "",
  })

  // Use the notification context
  const { notifications, unreadCount, fetchNotifications } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)

  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev)
    if (!showNotifications) {
      fetchNotifications()
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]))
        setUserId(decodedToken.id)
        fetchProfileData(decodedToken.id)
        fetchClientTrainers(decodedToken.id)
        fetchCompletedWorkouts(decodedToken.id)
      } catch (error) {
        console.error("Error decoding token:", error)
      }
    }
  }, [])

  const fetchProfileData = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/client/${userId}`)
      if (response.data) {
        setProfileData({ ...response.data.user, ...response.data.clientDetails })
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error)
    }
  }

  const fetchClientTrainers = async (userId) => {
    try {
      // Use the new API endpoint to get all trainers for this client
      const response = await axios.get(`http://localhost:3000/api/availability/client/trainers/${userId}`)
      
      // Get trainer ratings
      const trainersWithRatings = await Promise.all(
        response.data.map(async (trainer) => {
          try {
            const ratingResponse = await axios.get(`http://localhost:3000/api/ratings/trainer/${trainer._id}`)
            return {
              ...trainer,
              averageRating: ratingResponse.data.averageRating || 0,
              totalRatings: ratingResponse.data.count || 0,
            }
          } catch (error) {
            console.error(`Failed to fetch ratings for trainer ${trainer._id}:`, error)
            return {
              ...trainer,
              averageRating: 0,
              totalRatings: 0,
            }
          }
        }),
      )

      setClientTrainers(trainersWithRatings)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch client trainers:", error)
      setLoading(false)
    }
  }

  const fetchCompletedWorkouts = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/availability/client/completed/${userId}`)

      // Get rating status for each workout
      const workoutsWithRatingStatus = await Promise.all(
        response.data.map(async (workout) => {
          try {
            const ratingResponse = await axios.get(`http://localhost:3000/api/ratings/check/${workout._id}`)
            return {
              ...workout,
              isRated: ratingResponse.data.isRated,
              rating: ratingResponse.data.rating,
            }
          } catch (error) {
            console.error(`Failed to check rating for workout ${workout._id}:`, error)
            return {
              ...workout,
              isRated: false,
            }
          }
        }),
      )

      setCompletedWorkouts(workoutsWithRatingStatus)
    } catch (error) {
      console.error("Failed to fetch completed workouts:", error)
    }
  }

  const handleRateWorkout = (workout) => {
    setSelectedWorkout(workout)
    setShowRatingModal(true)
  }

  const submitRating = async () => {
    if (!selectedWorkout) return

    setSubmitting(true)

    try {
      await axios.post("http://localhost:3000/api/ratings/submit", {
        workoutId: selectedWorkout._id,
        rating,
        feedback,
        clientId: userId,
      })

      // Refresh data after rating
      fetchCompletedWorkouts(userId)
      fetchClientTrainers(userId)

      // Close modal and reset form
      setShowRatingModal(false)
      setSelectedWorkout(null)
      setRating(5)
      setFeedback("")
    } catch (error) {
      console.error("Failed to submit rating:", error)
      alert("Failed to submit rating. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white p-4 flex items-center justify-between border-b">
        <div className="flex items-center space-x-2">
          <span className="text-red-600 font-bold text-xl">Train</span>
          <span className="font-bold text-xl">Tact</span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="relative group cursor-pointer" onClick={toggleNotifications}>
            <Bell className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors duration-200" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
            <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
          </div>
          <div className="relative group cursor-pointer">
            <Link to="/chat">
              <Mail className="h-6 w-6 hover:text-red-600 cursor-pointer" />
            </Link>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
              2
            </span>
          </div>
          <div className="relative cursor-pointer">
            <img
              src={profileData.profilePicture || "/placeholder.svg"}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 hover:ring-gray-200 transition-all duration-200"
            />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-52 bg-white h-screen p-4 border-r">
          <nav className="space-y-4">
            <Link to="/clientDash">
              <div className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg">
                <span>Home</span>
              </div>
            </Link>
            <Link to="/profile">
              <div className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg">
                <div className="w-6 h-6">👤</div>
                <span>Profile</span>
              </div>
            </Link>
            <div className="flex items-center cursor-pointer space-x-3 p-3 bg-blue-50 rounded-lg text-red-600">
              <div className="w-6 h-6">💪</div>
              <span>My Trainers</span>
            </div>
            <div className="flex items-center cursor-pointer space-x-3 p-3">
              <div className="w-6 h-6">💳</div>
              <span>Payments</span>
            </div>
            <div className="flex items-center cursor-pointer space-x-3 p-3">
              <div className="w-6 h-6">🚪</div>
              <span>Logout</span>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">My Trainers</h1>
            <Link to="/clientDash">
              <ArrowLeft className="w-6 h-6 cursor-pointer hover:bg-gray-100 rounded-full p-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              {/* Current Trainers */}
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-6">My Current Trainers</h2>
                {clientTrainers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clientTrainers.map((trainer) => (
                      <div key={trainer._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="relative">
                          <img
                            src={
                              trainer.profilePicture
                                ? `http://localhost:3000/uploads/profilePictures/${trainer.profilePicture}`
                                : "/placeholder.svg"
                            }
                            alt={trainer.userName}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                            <h3 className="text-white font-semibold text-lg">{trainer.userName}</h3>
                            <p className="text-white/80 text-sm">{trainer.fitnessGoal}</p>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="flex items-center mb-3">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={16}
                                  className={`${
                                    star <= Math.round(trainer.averageRating)
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 ml-2">
                              {trainer.averageRating.toFixed(1)} ({trainer.totalRatings} reviews)
                            </span>
                          </div>

                          {/* Training Metrics */}
                          <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <h4 className="font-medium text-sm mb-2">Training Summary</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Total Sessions</p>
                                <p className="font-medium">{trainer.metrics?.totalSessions || 0}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Completed</p>
                                <p className="font-medium">{trainer.metrics?.completedSessions || 0}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Location</p>
                                <p className="font-medium">{trainer.location || "Not specified"}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Upcoming</p>
                                <p className="font-medium">{trainer.metrics?.upcomingSessions || 0}</p>
                              </div>
                            </div>
                          </div>

                          {/* Next Session */}
                          {trainer.metrics?.nextSession && (
                            <div className="bg-blue-50 p-3 rounded-lg mb-4">
                              <div className="flex items-center mb-2">
                                <Calendar size={16} className="text-blue-600 mr-2" />
                                <h4 className="font-medium text-sm">Next Session</h4>
                              </div>
                              <p className="text-sm">
                                {formatDate(trainer.metrics.nextSession.startDate)}
                              </p>
                              <div className="flex items-center mt-1 text-sm text-blue-800">
                                <Clock size={14} className="mr-1" />
                                <span>{trainer.metrics.nextSession.startTime} ({trainer.metrics.nextSession.duration} min)</span>
                              </div>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Link 
                              to={`/chat/${trainer._id}`} 
                              className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-md text-sm"
                            >
                              <MessageCircle size={16} />
                              Message
                            </Link>
                            <Link 
                              to={`/book/${trainer._id}`}
                              className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm"
                            >
                              Book Session
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <p className="text-gray-500">You don't have any trainers yet.</p>
                    <Link to="/trainers">
                      <button className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md">
                        Find Trainers
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Completed Workouts for Rating */}
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-6">Rate Your Completed Sessions</h2>
                {completedWorkouts.length > 0 ? (
                  <div className="space-y-4">
                    {completedWorkouts.map((workout) => (
                      <div key={workout._id} className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img
                              src={
                                workout.trainerId?.profilePicture
                                  ? `http://localhost:3000/uploads/profilePictures/${workout.trainerId.profilePicture}`
                                  : "/placeholder.svg"
                              }
                              alt={workout.trainerId?.userName}
                              className="w-14 h-14 rounded-full object-cover"
                            />
                            <div>
                              <h3 className="font-medium">{workout.trainerId?.userName}</h3>
                              <p className="text-sm text-gray-500">
                                {formatDate(workout.startDate)} • {workout.startTime} ({workout.duration} min)
                              </p>
                              <div className="flex items-center mt-1">
                                <CheckCircle size={14} className="text-green-600 mr-1" />
                                <span className="text-xs text-green-600">Completed</span>
                              </div>
                            </div>
                          </div>

                          {workout.isRated ? (
                            <div className="flex items-center">
                              <div className="flex items-center mr-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={16}
                                    className={`${
                                      star <= workout.rating?.rating
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">Rated</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRateWorkout(workout)}
                              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm"
                            >
                              Rate Session
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <p className="text-gray-500">You don't have any completed sessions to rate.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Rating Modal */}
      {showRatingModal && selectedWorkout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Rate Your Session</h2>
            <p className="mb-4">
              Trainer: <span className="font-medium">{selectedWorkout.trainerId?.userName}</span>
            </p>
            <p className="mb-6 text-sm text-gray-500">
              {formatDate(selectedWorkout.startDate)} • {selectedWorkout.startTime}
            </p>

            <div className="mb-6">
              <p className="mb-2 font-medium">Rating:</p>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={24}
                    onClick={() => setRating(star)}
                    className={`cursor-pointer ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="feedback" className="block mb-2 font-medium">
                Feedback:
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 h-32"
                placeholder="Share your experience with this trainer..."
                required
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRatingModal(false)
                  setSelectedWorkout(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-red-400"
                disabled={submitting || !feedback.trim()}
              >
                {submitting ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyTrainer