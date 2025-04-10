"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import TrainerLayout from "./TrainerLayout"

const RatingFeedback = () => {
  const [ratings, setRatings] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [trainerId, setTrainerId] = useState(null)
  const [activeRating, setActiveRating] = useState(null)

  // Get trainerId from localStorage token
  useEffect(() => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        const decodedToken = jwtDecode(token)
        setTrainerId(decodedToken.id)
      } else {
        setError("No authentication token found")
        setLoading(false)
      }
    } catch (err) {
      console.error("Error decoding token:", err)
      setError("Authentication error")
      setLoading(false)
    }
  }, [])

  // Fetch ratings using the trainerId from the token
  useEffect(() => {
    const fetchTrainerRatings = async () => {
      if (!trainerId) return

      try {
        const response = await axios.get(`http://localhost:3000/api/ratings/trainer/${trainerId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (response.data && response.data.ratings) {
          setRatings(response.data.ratings)
          setAverageRating(response.data.averageRating || 0)
        } else {
          console.error("Unexpected API response format:", response.data)
          setError("Received invalid data from server")
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching trainer ratings:", err)
        setError(`Failed to fetch ratings: ${err.response?.data?.message || err.message}`)
        setLoading(false)
      }
    }

    fetchTrainerRatings()
  }, [trainerId])

  // Function to render stars based on rating value
  const renderStars = (rating, size = "regular") => {
    const stars = []
    const sizeClass = size === "large" ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`${sizeClass} ${
            i <= rating
              ? "text-amber-400 drop-shadow-sm transition-all duration-300 transform hover:scale-110 hover:text-amber-500"
              : "text-gray-300"
          }`}
        >
          ★
        </span>,
      )
    }
    return stars
  }

  // Format date to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date"
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Calculate time ago
  const timeAgo = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)

    let interval = Math.floor(seconds / 31536000)
    if (interval >= 1) {
      return interval === 1 ? "1 year ago" : `${interval} years ago`
    }

    interval = Math.floor(seconds / 2592000)
    if (interval >= 1) {
      return interval === 1 ? "1 month ago" : `${interval} months ago`
    }

    interval = Math.floor(seconds / 86400)
    if (interval >= 1) {
      return interval === 1 ? "1 day ago" : `${interval} days ago`
    }

    interval = Math.floor(seconds / 3600)
    if (interval >= 1) {
      return interval === 1 ? "1 hour ago" : `${interval} hours ago`
    }

    interval = Math.floor(seconds / 60)
    if (interval >= 1) {
      return interval === 1 ? "1 minute ago" : `${interval} minutes ago`
    }

    return "Just now"
  }

  if (loading) {
    return (
      <TrainerLayout>
        <div className="flex justify-center items-center py-16">
          <div className="animate-pulse flex flex-col items-center w-full max-w-3xl">
            <div className="h-10 w-48 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-32 w-full bg-gray-200 rounded-xl mb-8"></div>
            <div className="h-8 w-40 bg-gray-200 rounded-lg mb-6 self-start"></div>
            <div className="space-y-6 w-full">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 w-full bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </TrainerLayout>
    )
  }

  if (error) {
    return (
      <TrainerLayout>
        <div className="text-center py-12 px-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm max-w-2xl mx-auto">
            <h3 className="text-red-800 font-semibold text-lg mb-2">Error Loading Ratings</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </TrainerLayout>
    )
  }

  if (!ratings || ratings.length === 0) {
    return (
      <TrainerLayout>
        <div className="text-center py-12 px-4">
          <div className="bg-blue-50 border border-blue-100 p-8 rounded-xl shadow-sm max-w-2xl mx-auto">
            <div className="text-blue-500 text-5xl mb-4">★</div>
            <h3 className="text-blue-800 font-bold text-xl mb-2">No Ratings Yet</h3>
            <p className="text-blue-700 mb-4">No ratings available for this trainer yet.</p>
            <p className="text-blue-600 text-sm">Ratings will appear here once clients provide feedback.</p>
          </div>
        </div>
      </TrainerLayout>
    )
  }

  return (
    <TrainerLayout>
      <div className="rating-feedback-container max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="average-rating mb-10 p-8 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md border border-gray-100">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800 flex items-center">
            <span className="text-amber-400 mr-2">★</span>
            Overall Rating
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center">
              <span className="text-4xl font-bold text-gray-800 mr-3">{averageRating.toFixed(1)}</span>
              <div className="flex space-x-1">{renderStars(Math.round(averageRating), "large")}</div>
            </div>
            <span className="text-gray-500 text-lg px-4 py-1 bg-gray-100 rounded-full border border-gray-200">
              {ratings.length} {ratings.length === 1 ? "review" : "reviews"}
            </span>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratings.filter((r) => Math.round(r.rating) === star).length
                const percentage = (count / ratings.length) * 100

                return (
                  <div key={star} className="flex flex-col items-center">
                    <div className="flex items-center mb-1">
                      <span className="text-amber-400 mr-1">★</span>
                      <span className="font-medium">{star}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-500">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 border-b pb-3 flex items-center">
          <span className="text-amber-400 mr-2">✓</span>
          Client Feedback
        </h2>

        <div className="ratings-list space-y-8">
          {ratings.map((rating, index) => (
            <div
              key={rating._id}
              className={`rating-item p-6 border border-gray-200 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md bg-white ${activeRating === rating._id ? "ring-2 ring-amber-300 ring-offset-2" : ""}`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => setActiveRating(activeRating === rating._id ? null : rating._id)}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 gap-3">
                <div className="client-info flex items-center">
                  {rating.clientId?.profilePicture ? (
                    <img
                      src={rating.clientId.profilePicture || "/placeholder.svg"}
                      alt={`${rating.clientId.userName}'s profile`}
                      className="w-14 h-14 rounded-full mr-4 border-2 border-amber-100 object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 mr-4 flex items-center justify-center text-white font-bold shadow-sm">
                      {(rating.clientId?.userName || "A")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-lg text-gray-800 block">
                      {rating.clientId?.userName || "Anonymous Client"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {timeAgo(rating.workoutId?.endDate || rating.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                  {rating.workoutId ? formatDate(rating.workoutId.endDate) : formatDate(rating.createdAt)}
                </div>
              </div>

              <div className="rating-stars flex mb-4 space-x-1">{renderStars(rating.rating)}</div>

              <div className="rating-feedback text-gray-700 bg-gradient-to-r from-amber-50 to-gray-50 p-5 rounded-xl border-l-4 border-amber-400 shadow-inner">
                {rating.feedback ? (
                  <>
                    <span className="text-amber-500 text-lg mr-2">"</span>
                    {rating.feedback}
                    <span className="text-amber-500 text-lg ml-2">"</span>
                  </>
                ) : (
                  <span className="text-gray-500 italic">No written feedback provided.</span>
                )}
              </div>

              {rating.workoutId && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500">
                  <span className="font-medium">Workout:</span> {rating.workoutId.title || "Unnamed workout"}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .rating-item {
          animation: fadeIn 0.6s ease-in-out forwards;
          opacity: 0;
          cursor: pointer;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (prefers-reduced-motion) {
          .rating-item {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </TrainerLayout>
  )
}

export default RatingFeedback

