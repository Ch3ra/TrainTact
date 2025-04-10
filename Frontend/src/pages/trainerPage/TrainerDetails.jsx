"use client"

import { useEffect, useState } from "react"
import {
  Clock,
  DollarSign,
  Award,
  Star,
  StarHalf,
  MessageCircle,
  ThumbsUp,
  Share2,
  ChevronDown,
  ChevronUp,
  User,
  ArrowLeft,
  Mail,
  MapPin,
  FileText,
  CalendarIcon,
  Loader2,
} from "lucide-react"
import axios from "axios"
import { useNavigate, useParams } from "react-router-dom"

import { toast, Toaster } from "react-hot-toast" // Import both toast and Toaster
import Navbar from "../../public/components/Navbar"

// Helper function to ensure IDs are properly formatted
const formatId = (id) => {
  if (!id) return null
  return typeof id === "object" ? id.toString() : id
}

const TrainerDetails = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [trainerDetails, setTrainerDetails] = useState(null)
  const [advancedNeeded, setAdvancedNeeded] = useState(false)
  const [ratings, setRatings] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bookingNumber, setBookingNumber] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    startTime: "",
    duration: "",
    startDate: "",
    endDate: "",
    message: "",
  })

  const { id } = useParams()

  useEffect(() => {
    // Check for token and user role
    const token = localStorage.getItem("token")
    if (!token) {
      // Redirect to login page if no token exists
      navigate("/authentication")
      return
    }

    try {
      // Decode token to get user ID and role
      const decodedToken = JSON.parse(atob(token.split(".")[1]))
      setUserId(decodedToken.id)
      setUserRole(decodedToken.role)

      // Allow both clients and admins to view trainer profiles
      if (decodedToken.role !== "Client" && decodedToken.role !== "Admin") {
        // If not a client or admin, redirect to unauthorized page or dashboard
        navigate("/authentication", {
          state: { message: "Only clients and administrators can view trainer profiles." },
        })
        return
      }

      // Continue with normal flow if token exists and user is a client
      const trainerId = id || localStorage.getItem("selectedTrainerId")

      if (trainerId) {
        fetchTrainerDetails(trainerId)
        fetchTrainerRatings(trainerId)
      } else {
        setIsLoading(false)
        toast.error("Trainer ID not found")
      }
    } catch (error) {
      console.error("Error decoding token:", error)
      // If token is invalid, redirect to login
      navigate("/authentication")
    }
  }, [id, navigate])

  const fetchTrainerDetails = async (trainerId) => {
    try {
      setIsLoading(true)
      const response = await axios.get(`http://localhost:3000/api/trainer/details/${trainerId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.status === 200) {
        const trainerData = response.data.trainer
        setTrainerDetails(trainerData)
        setAdvancedNeeded(trainerData.advancedNeeded)
        console.log("Trainer Data:", trainerData)
      }
    } catch (error) {
      console.error("Failed to fetch trainer details", error)
      toast.error("Failed to load trainer details")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTrainerRatings = async (trainerId) => {
    try {
      const formattedId = formatId(trainerId)
      if (!formattedId) {
        console.error("Invalid trainer ID for fetching ratings")
        return
      }

      const response = await axios.get(`http://localhost:3000/api/ratings/trainer/${formattedId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.status === 200) {
        setRatings(response.data.ratings || [])
        setAverageRating(response.data.averageRating || 0)
        setTotalRatings(response.data.count || 0)
        console.log("Trainer Ratings:", response.data)
      }
    } catch (error) {
      console.error("Failed to fetch trainer ratings", error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  // Function to handle messaging a trainer
  const handleMessageTrainer = () => {
    toast.error("You can only message trainers that you have booked. Please book a session first.", {
      duration: 5000,
      icon: "🔒",
    })
  }

  // Modified to store the booking number for payment and show success toast
  const handleSubmit = async (e) => {
    e.preventDefault()

    const formattedClientId = formatId(userId)
    const formattedTrainerId = formatId(id || localStorage.getItem("selectedTrainerId"))

    if (!formattedClientId || !formattedTrainerId) {
      console.error("Client ID or Trainer ID is missing or invalid.")
      toast.error("Missing client or trainer information")
      return
    }

    try {
      setIsLoading(true)

      // Include the trainer's price in the booking data
      const bookingData = {
        clientId: formattedClientId,
        trainerId: formattedTrainerId,
        amount: trainerDetails?.price || 0, // Set the amount from trainer details
        ...formData,
      }

      const response = await axios.post("http://localhost:3000/api/availability/createSchedule", bookingData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      console.log("Response:", response.data)

      // Store the booking number for payment processing
      if (response.data && response.data.schedule && response.data.schedule.bookingNumber) {
        setBookingNumber(response.data.schedule.bookingNumber)

        // Store booking details in localStorage
        const bookingDetails = {
          ...bookingData,
          bookingNumber: response.data.schedule.bookingNumber,
          price: trainerDetails?.price || 0,
        }
        localStorage.setItem("bookingDetails", JSON.stringify(bookingDetails))

        // Show success toast message
        toast.success("Booking request sent successfully!", {
          icon: "✅",
        })
      }

      setModalOpen(false) // Close modal on successful submission
    } catch (error) {
      console.error("Failed to create schedule:", error.response ? error.response.data : error.message)
      toast.error("Failed to create booking. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Modified Khalti payment function
  const handleKhalti = async () => {
    try {
      setIsLoading(true)
      setPaymentError(null)

      // Ensure trainerId is a string
      const formattedClientId = formatId(userId)
      const formattedTrainerId = formatId(id || localStorage.getItem("selectedTrainerId"))

      if (!formattedClientId || !formattedTrainerId) {
        setPaymentError("Invalid client or trainer ID")
        console.error("Client ID or Trainer ID is missing or invalid.")
        return
      }

      if (!trainerDetails || !trainerDetails.price) {
        setPaymentError("Price information is missing")
        console.error("Price information is missing")
        return
      }

      // First create the booking if it doesn't exist yet
      let currentBookingNumber = bookingNumber

      if (!currentBookingNumber) {
        try {
          // Create a booking first
          const bookingData = {
            clientId: formattedClientId,
            trainerId: formattedTrainerId,
            amount: trainerDetails.price, // Set the amount from trainer details
            ...formData,
          }

          const bookingResponse = await axios.post(
            "http://localhost:3000/api/availability/createSchedule",
            bookingData,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          )

          if (bookingResponse.data && bookingResponse.data.schedule && bookingResponse.data.schedule.bookingNumber) {
            currentBookingNumber = bookingResponse.data.schedule.bookingNumber
            console.log("Created booking with number:", currentBookingNumber)

            // Show success toast message for booking creation
            toast.success("Booking request sent successfully!", {
              icon: "✅",
            })
          } else {
            setPaymentError("Failed to create booking")
            console.error("Failed to get booking number from response")
            setIsLoading(false)
            return
          }
        } catch (error) {
          setPaymentError("Failed to create booking")
          console.error("Error creating booking:", error)
          setIsLoading(false)
          return
        }
      }

      // Generate a unique order ID
      const uniqueOrderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      // Now initiate the payment with the booking number
      const response = await axios.post(
        "http://localhost:3000/api/payment/khalti",
        {
          orderId: uniqueOrderId,
          amount: trainerDetails.price,
          bookingId: currentBookingNumber, // Use the booking number we have
          trainerId: formattedTrainerId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      console.log("Khalti response:", response.data)

      // Check if the response contains a payment_url
      if (response.data && response.data.payment_url) {
        window.location.href = response.data.payment_url
      } else if (response.data && response.data.success && response.data.pidx) {
        // If the response has a pidx but no direct URL
        window.location.href = `https://a.khalti.com/api/v2/epayment/initiate/${response.data.pidx}`
      } else if (typeof response.data === "string" && response.data.includes("http")) {
        // If the response is just the URL string
        window.location.href = response.data
      } else {
        setPaymentError("Invalid response from payment gateway")
        console.error("Invalid response from Khalti payment initiation", response.data)
      }
    } catch (error) {
      console.error("Error initiating Khalti payment:", error)
      setPaymentError(error.response?.data?.message || "Failed to initiate payment. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Format date for reviews
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Function to render star ratings
  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-yellow-400 text-yellow-400 w-5 h-5" />)
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="fill-yellow-400 text-yellow-400 w-5 h-5" />)
    }

    const emptyStars = 5 - stars.length
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-gray-300 w-5 h-5" />)
    }

    return stars
  }

  // Format availability days
  const formatDayRange = () => {
    if (!trainerDetails) return "Loading..."

    const days = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    }

    return `${days[trainerDetails.startDay?.toLowerCase()] || trainerDetails.startDay} - ${days[trainerDetails.endDay?.toLowerCase()] || trainerDetails.endDay}`
  }

  // Format availability hours
  const formatAvailabilityHours = () => {
    if (!trainerDetails) return "Loading..."

    const hours = {
      morning: "Morning (6 AM - 12 PM)",
      "mid-day": "Mid-day (12 PM - 3 PM)",
      afternoon: "Afternoon (3 PM - 6 PM)",
      evening: "Evening (6 PM - 9 PM)",
      night: "Night (9 PM - 12 AM)",
    }

    return hours[trainerDetails.availabilityHours?.toLowerCase()] || trainerDetails.availabilityHours
  }

  // Display limited reviews or all reviews based on state
  const displayedRatings = showAllReviews ? ratings : ratings.slice(0, 3)

  // If still checking permissions, show loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mb-4" />
          <p className="text-gray-500">Loading trainer details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Toast container */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={12}
        toastOptions={{
          // Default options for all toasts
          duration: 5000,
          style: {
            background: "#ffffff",
            color: "#333333",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            border: "1px solid #f0f0f0",
            fontSize: "14px",
            fontWeight: "500",
            maxWidth: "350px",
            display: "flex",
            alignItems: "center",
          },
          // Styling for success toasts
          success: {
            style: {
              background: "#f0fdf4",
              borderLeft: "4px solid #22c55e",
              color: "#166534",
            },
            iconTheme: {
              primary: "#16a34a",
              secondary: "#ffffff",
            },
          },
          // Styling for error toasts
          error: {
            style: {
              background: "#fef2f2",
              borderLeft: "4px solid #ef4444",
              color: "#991b1b",
            },
            iconTheme: {
              primary: "#dc2626",
              secondary: "#ffffff",
            },
          },
        }}
      />

      <Navbar />

      <div className="max-w-6xl mt-10 mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Cover Photo with Profile Picture */}
        <div className="relative h-64 md:h-80 w-full">
          <img
            src={
              trainerDetails && trainerDetails.coverPhoto
                ? `http://localhost:3000/uploads/coverPhoto/${trainerDetails.coverPhoto}`
                : "https://timelinecovers.pro/facebook-cover/download/You-Are-A-Dreamer-HD-facebook-cover.jpg"
            }
            alt={`${trainerDetails?.userName || "Trainer"} cover`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src =
                "https://timelinecovers.pro/facebook-cover/download/You-Are-A-Dreamer-HD-facebook-cover.jpg"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

          {/* Profile Picture */}
          <div className="absolute -bottom-16 left-6 md:left-8">
            <div className="relative">
              <img
                src={
                  trainerDetails && trainerDetails.profilePicture
                    ? `http://localhost:3000/uploads/profilePictures/${trainerDetails.profilePicture}`
                    : "https://randomuser.me/api/portraits/men/32.jpg"
                }
                alt={`${trainerDetails?.userName || "Trainer"}`}
                className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                onError={(e) => {
                  e.target.src = "https://randomuser.me/api/portraits/men/32.jpg"
                }}
              />
              {advancedNeeded && (
                <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                  Pre Advance
                </span>
              )}
            </div>
          </div>

          {/* Trainer Name and Rating */}
          <div className="absolute bottom-0 left-44 md:left-48 p-6 text-white">
            <h1 className="text-3xl font-bold">{trainerDetails ? trainerDetails.userName : "Loading..."}</h1>
            <div className="flex items-center mt-2">
              {renderStars(averageRating)}
              <span className="ml-2 text-white font-medium">{averageRating.toFixed(1)}</span>
              <span className="ml-2 text-white/80">({totalRatings} reviews)</span>
            </div>
          </div>

          {/* Back Button */}
          <button
            className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 mt-16">
          {/* Left Column - Trainer Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg flex flex-col items-center justify-center">
                <Award className="text-[#CE0000] mb-2" />
                <p className="text-sm text-gray-500">Experience</p>
                <p className="font-semibold">
                  {trainerDetails ? trainerDetails.yearsOfExperience + " Years" : "Loading..."}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg flex flex-col items-center justify-center">
                <DollarSign className="text-[#CE0000] mb-2" />
                <p className="text-sm text-gray-500">Session Price</p>
                <p className="font-semibold">{trainerDetails ? trainerDetails.price + " NPR" : "Loading..."}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg flex flex-col items-center justify-center col-span-2 md:col-span-1">
                <Clock className="text-[#CE0000] mb-2" />
                <p className="text-sm text-gray-500">Availability</p>
                <p className="font-semibold">{formatAvailabilityHours()}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <User size={20} className="text-gray-500" />
                <p className="font-medium">{trainerDetails ? trainerDetails.userName : "Loading..."}</p>
                {trainerDetails?.age && <span className="text-gray-500 ml-1">({trainerDetails.age} years old)</span>}
              </div>
              <div className="flex items-center gap-2">
                <Mail size={20} className="text-gray-500" />
                <p className="font-medium">{trainerDetails ? trainerDetails.email : "Loading..."}</p>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin size={20} />
                <span>{trainerDetails ? trainerDetails.location : "Loading..."}</span>
              </div>
            </div>

            {/* About Section */}
            <div>
              <h2 className="text-xl font-bold mb-3 text-gray-800">About</h2>
              <p className="text-gray-700 leading-relaxed">
                {trainerDetails ? trainerDetails.description : "Loading trainer description..."}
              </p>
            </div>

            {/* Bibliography Section */}
            {trainerDetails?.bibliography && (
              <div>
                <h2 className="text-xl font-bold mb-3 text-gray-800">Bibliography</h2>
                <p className="text-gray-700 leading-relaxed">{trainerDetails.bibliography}</p>
              </div>
            )}

            {/* Specialties */}
            <div>
              <h2 className="text-xl font-bold mb-3 text-gray-800">Fitness Goal</h2>
              <div className="flex flex-wrap gap-2">
                <span className="bg-red-50 text-[#CE0000] px-3 py-1 rounded-full text-sm">
                  {trainerDetails ? trainerDetails.fitnessGoal : "Loading..."}
                </span>
              </div>
            </div>

            {/* Weekly Schedule */}
            <div>
              <h2 className="text-xl font-bold mb-3 text-gray-800">Weekly Schedule</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <CalendarIcon className="text-[#CE0000] mt-1 flex-shrink-0" size={18} />
                    <div>
                      <p className="font-medium">Days</p>
                      <div className="text-sm text-gray-600">
                        <p>{formatDayRange()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="text-[#CE0000] mt-1 flex-shrink-0" size={18} />
                    <div>
                      <p className="font-medium">Hours</p>
                      <div className="text-sm text-gray-600">
                        <p>{trainerDetails ? trainerDetails.availabilityHours : "Loading..."}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resume Section */}
            {trainerDetails?.resume && (
              <div>
                <h2 className="text-xl font-bold mb-3 text-gray-800">Credentials</h2>
                <div className="flex items-center">
                  <FileText className="text-[#CE0000] mr-2" size={18} />
                  <a
                    href={`http://localhost:3000/uploads/resumes/${trainerDetails.resume}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#CE0000] hover:text-red-700 font-medium"
                  >
                    View Resume
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Reviews and Booking */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Book a Session</h2>
              <p className="text-gray-700 mb-4">Available {formatDayRange()}</p>
              <p className="text-2xl font-bold text-gray-900 mb-4">
                {trainerDetails ? trainerDetails.price : "0"} NPR{" "}
                <span className="text-sm font-normal text-gray-500">/ hour</span>
              </p>
              <button
                className="w-full bg-[#CE0000] hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
                onClick={() => setModalOpen(true)}
                disabled={isLoading}
              >
                Book Now
              </button>
              <button
                className="w-full mt-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                onClick={handleMessageTrainer}
              >
                <MessageCircle className="mr-2" size={18} />
                Message Trainer
              </button>
            </div>

            {/* Reviews Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Reviews</h2>
                <div className="flex items-center">
                  {renderStars(averageRating)}
                  <span className="ml-2 font-medium">{averageRating.toFixed(1)}</span>
                </div>
              </div>

              <div className="space-y-4">
                {displayedRatings.length > 0 ? (
                  displayedRatings.map((review, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                          {review.clientId?.profilePicture ? (
                            <img
                              src={`${review.clientId.profilePicture}`}
                              alt={review.clientId?.userName || "Client"}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src = "https://randomuser.me/api/portraits/men/32.jpg"
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="text-gray-500" size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{review.clientId?.userName || "Client"}</h4>
                            <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                          </div>
                          <div className="flex items-center my-1">{renderStars(review.rating)}</div>
                          <p className="text-gray-700 text-sm mt-1">{review.feedback}</p>
                          <div className="flex items-center mt-2">
                            <button className="flex items-center text-sm text-gray-500 hover:text-[#CE0000]">
                              <ThumbsUp size={14} className="mr-1" />
                              Helpful
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No reviews yet for this trainer.</p>
                  </div>
                )}

                {ratings.length > 3 && (
                  <button
                    className="text-[#CE0000] hover:text-red-700 font-medium flex items-center"
                    onClick={() => setShowAllReviews(!showAllReviews)}
                  >
                    {showAllReviews ? (
                      <>
                        Show Less <ChevronUp size={16} className="ml-1" />
                      </>
                    ) : (
                      <>
                        View All {totalRatings} Reviews <ChevronDown size={16} className="ml-1" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Share Profile */}
            <div className="flex justify-center">
              <button className="text-gray-600 hover:text-[#CE0000] flex items-center text-sm font-medium">
                <Share2 size={16} className="mr-1" />
                Share Trainer Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {modalOpen && (
        <div
          id="crud-modal"
          tabIndex="-1"
          className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full flex bg-black/40 backdrop-blur-sm"
        >
          <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative bg-white/90 backdrop-filter backdrop-blur-md rounded-xl shadow-2xl border border-gray-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-200">
                <h3 className="text-xl font-bold text-[#CE0000]">Choose Workout Schedule</h3>
                <button
                  onClick={() => {
                    setModalOpen(false)
                    setPaymentError(null)
                  }}
                  type="button"
                  className="text-gray-400 hover:text-[#CE0000] bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center transition-colors duration-200"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-4 md:p-5">
                <div className="grid gap-4 mb-4 grid-cols-2">
                  {/* Start Time */}
                  <div className="col-span-2">
                    <label htmlFor="startTime" className="block mb-2 text-sm font-medium text-gray-700">
                      Start Time
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      id="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#CE0000] focus:border-[#CE0000] block w-full p-2.5"
                      required
                    />
                  </div>

                  {/* Duration */}
                  <div className="col-span-2 sm:col-span-1 relative">
                    <label htmlFor="duration" className="block mb-2 text-sm font-medium text-gray-700">
                      Duration
                    </label>
                    <select
                      name="duration"
                      id="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#CE0000] focus:border-[#CE0000] block w-full p-2.5 pr-8"
                      required
                    >
                      <option value="">Select Duration</option>
                      <option value="45">45 min</option>
                      <option value="90">1.30 hrs</option>
                      <option value="120">2 hrs</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 pt-5 text-gray-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="startDate" className="block mb-2 text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      id="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#CE0000] focus:border-[#CE0000] block w-full p-2.5"
                      required
                    />
                  </div>

                  {/* End Date */}
                  <div className="col-span-2">
                    <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      id="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#CE0000] focus:border-[#CE0000] block w-full p-2.5"
                      required
                    />
                  </div>
                </div>

                {/* Display payment error if any */}
                {paymentError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{paymentError}</div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4">
                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#CE0000] hover:bg-[#A80000] text-white font-semibold py-3 px-5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg focus:ring-2 focus:ring-[#CE0000]/50 focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Book Appointment
                      </>
                    )}
                  </button>

                  {/* Payment Buttons */}
                  <div className="space-y-3">
                    {/* Khalti Button */}
                    <button
                      type="button"
                      onClick={handleKhalti}
                      disabled={isLoading}
                      className="w-full bg-white hover:bg-[#5C2D91] text-[#5C2D91] hover:text-white font-medium py-2.5 px-5 rounded-lg border border-gray-200 transition-colors duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      <div className="w-6 h-6 flex items-center justify-center">
                        {/* Image placeholder for Khalti logo */}
                      </div>
                      {isLoading ? "Processing..." : "Pay with Khalti"}
                    </button>

                    {/* Esewa Button */}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        try {
                          // Ensure IDs are properly formatted
                          const formattedClientId = formatId(userId)
                          const formattedTrainerId = formatId(id || localStorage.getItem("selectedTrainerId"))

                          if (!formattedClientId || !formattedTrainerId) {
                            console.error("Client ID or Trainer ID is missing or invalid.")
                            return
                          }

                          // First, save the booking details to localStorage
                          const bookingDetails = {
                            clientId: formattedClientId,
                            trainerId: formattedTrainerId,
                            trainerName: trainerDetails?.userName || "Trainer",
                            price: trainerDetails?.price || 0,
                            ...formData,
                          }
                          localStorage.setItem("bookingDetails", JSON.stringify(bookingDetails))

                          // Then navigate to payment page with required data
                          navigate("/payment", {
                            state: {
                              totalAmount: trainerDetails ? trainerDetails.price : 0,
                              trainerName: trainerDetails ? trainerDetails.userName : "Trainer",
                            },
                          })
                        } catch (error) {
                          console.error("Error preparing eSewa payment:", error)
                        }
                      }}
                      className="w-full bg-white hover:bg-[#60BB46] text-[#60BB46] hover:text-white font-medium py-2.5 px-5 rounded-lg border border-gray-200 transition-colors duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      <div className="w-6 h-6 flex items-center justify-center"></div>
                      {isLoading ? "Processing..." : "Pay with eSewa"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrainerDetails
