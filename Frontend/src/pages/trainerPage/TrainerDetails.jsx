"use client"

import { useEffect, useState } from "react"
import { Mail, Edit, ArrowLeft, User, MapPin, Clock, Calendar, Star, MessageCircle, ThumbsUp } from "lucide-react"
import { useNavigate } from "react-router-dom"
import TrainerNavbar from "../../pages/trainerPage/TrainerNavbar"
import axios from "axios"
import { useParams } from "react-router-dom"

const TrainerDetails = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const [trainerDetails, setTrainerDetails] = useState(null)
  const [advancedNeeded, setAdvancedNeeded] = useState(false)
  const [ratings, setRatings] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [showAllReviews, setShowAllReviews] = useState(false)

  const { id } = useParams()
  useEffect(() => {
    if (id) {
      try {
        fetchTrainerDetails(id)
        fetchTrainerRatings(id)
      } catch (error) {
        console.error("Error decoding token:", error)
      }
    }
  }, [id])

  const fetchTrainerDetails = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/trainer/details/${id}`)
      if (response.status === 200) {
        const trainerData = response.data.trainer
        setTrainerDetails(trainerData)
        setAdvancedNeeded(trainerData.advancedNeeded)
        console.log("Trainer Data:", trainerData)
      }
    } catch (error) {
      console.error("Failed to fetch trainer details", error)
    }
  }

  const fetchTrainerRatings = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/ratings/trainer/${id}`)
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

  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    startTime: "",
    duration: "",
    startDate: "",
    endDate: "",
    message: "",
  })
  const { id: trainerId } = useParams() // This is the trainerId from URL

  // Fetch client ID from local storage upon component mount
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]))
      setUserId(decodedToken.id) // Assuming 'id' is the field in your token containing the client ID
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    console.log(userId, trainerId)
    if (!userId || !trainerId) {
      console.error("Client ID or Trainer ID is missing.")
      return
    }
    // yo set garney local stora
    localStorage.setItem("data", {
      clientId: userId,
      trainerId: trainerId,
      ...formData,
    })

    try {
      const response = await axios.post("http://localhost:3000/api/availability/createSchedule", {
        clientId: userId,
        trainerId: trainerId,
        ...formData,
      })

      console.log("Response:", response.data)
      setModalOpen(false) // Close modal on successful submission
    } catch (error) {
      console.error("Failed to create schedule:", error.response ? error.response.data : error.message)
    }
  }

  //this is for khaltii
  const handleKhalti = async () => {
    const bookingDetails = {
      clientId: userId,
      trainerId: trainerId,
      price: trainerDetails.price,
      ...formData,
    }

    // Set the booking details in localStorage first
    try {
      localStorage.setItem("bookingDetails", JSON.stringify(bookingDetails))
      console.log("Successfully saved booking details to localStorage:", bookingDetails)
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }

    const response = await axios.post("http://localhost:3000/api/payment/khalti", {
      orderId: 123,
      amount: trainerDetails.price,
    })

    console.log("Khalti", response)

    var url = response.data
    window.location.href = url
  }

  // Format date for reviews
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Display limited reviews or all reviews based on state
  const displayedRatings = showAllReviews ? ratings : ratings.slice(0, 3)

  return (
    <div className="bg-gray-50 min-h-screen">
      <TrainerNavbar />

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">
              Welcome back, {trainerDetails ? trainerDetails.userName : "Trainer"}!
            </h2>
            <button className="w-10 h-10 border rounded-full flex items-center justify-center hover:bg-gray-50">
              <ArrowLeft size={20} />
            </button>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-2xl shadow-sm">
            {/* Cover Image */}
            <div className="h-64 bg-gray-900 rounded-t-2xl overflow-hidden">
              <img
                src={
                  trainerDetails
                    ? `http://localhost:3000/uploads/coverPhoto/${trainerDetails.coverPhoto}`
                    : "https://timelinecovers.pro/facebook-cover/download/You-Are-A-Dreamer-HD-facebook-cover.jpg"
                }
                alt="cover"
                className="w-full h-full object-cover opacity-75"
              />
            </div>

            {/* Profile Info */}
            <div className="relative px-8 pt-32 pb-8">
              <div className="absolute -top-[130px] left-8">
                <div className="relative">
                  {advancedNeeded && (
                    <span className="absolute top-52 ml-28 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg translate-x-1/2 -translate-y-1/2">
                      Pre Advance
                    </span>
                  )}

                  <div className="w-[210px] h-[210px] rounded-full mt-4 border-4 border-white shadow-lg overflow-hidden relative">
                    <img
                      src={
                        trainerDetails
                          ? `http://localhost:3000/uploads/profilePictures/${trainerDetails.profilePicture}`
                          : "https://timelinecovers.pro/facebook-cover/download/You-Are-A-Dreamer-HD-facebook-cover.jpg"
                      }
                      alt="cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <User size={20} className="text-gray-500" />
                    <span className="font-medium">{trainerDetails ? trainerDetails.userName : "Alish Ban"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin size={20} />
                    <span>{trainerDetails ? trainerDetails.location : "Itahari-3, Bhetghat Chowk"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Mail size={20} />
                    <p className="font-medium">{trainerDetails ? trainerDetails.email : "alishban@gmail.com"}</p>
                  </div>
                </div>
              </div>
              {/* Profile Details Grid */}
              <div className="grid grid-cols-2 gap-8 mt-4">
                <div className="space-y-4"></div>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <label className="text-gray-500 text-sm">Price</label>
                    <p className="font-medium">{trainerDetails ? trainerDetails.price + " NPR" : "4000 NPR"}</p>
                  </div>
                  <div className="flex space-x-2">
                    <label className="text-gray-500 text-sm">Years of Experience</label>
                    <p className="font-medium">
                      {trainerDetails ? trainerDetails.yearsOfExperience + " Years" : "5 Years"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <label className="text-gray-500 text-sm">Fitness Goal</label>
                    <p className="font-medium">{trainerDetails ? trainerDetails.fitnessGoal : "Weight Gain"}</p>
                  </div>
                </div>
                <div className="w-[700px]">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <p className="text-gray-600 leading-relaxed">
                      {trainerDetails
                        ? trainerDetails.description
                        : "Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."}
                    </p>
                  </div>
                </div>
              </div>
              {/* Availability Badge */}
              <div className="absolute top-6 ml-[440px] w-64">
                <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
                  <div className="bg-red-50 px-4 py-3 flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-red-600" />
                    <p className="text-sm font-semibold text-red-600">
                      Available: {trainerDetails ? trainerDetails.availabilityHours : "Evening"}
                    </p>
                  </div>
                  <div className="px-4 py-3 flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <p className="text-sm text-gray-600">
                      {trainerDetails ? trainerDetails.startDay + " - " + trainerDetails.endDay : "Sunday - Friday"}
                    </p>
                  </div>
                </div>
              </div>
              {/* Edit Profile Button */}

              <button
                className="absolute top-64 right-7 bg-red-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-red-700 transition-colors"
                onClick={() => setModalOpen(true)}
              >
                <Edit size={16} />
                Book Appoinment
              </button>

              {/* Rating Summary Card */}
              <div className="absolute top-6 ml-[440px] w-64 mt-32">
                <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden mt-4">
                  <div className="bg-yellow-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <p className="text-sm font-semibold text-gray-800">Trainer Rating</p>
                    </div>
                    <p className="text-lg font-bold text-gray-800">{averageRating.toFixed(1)}</p>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={`${
                            star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-500 ml-2">
                        ({totalRatings} {totalRatings === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

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
                          onClick={() => setModalOpen(false)}
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

                        {/* Action Buttons */}
                        <div className="space-y-4">
                          {/* Submit Button */}
                          <button
                            type="submit"
                            className="w-full bg-[#CE0000] hover:bg-[#A80000] text-white font-semibold py-3 px-5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg focus:ring-2 focus:ring-[#CE0000]/50 focus:ring-offset-2 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Book Appointment
                          </button>

                          {/* Payment Buttons */}
                          <div className="space-y-3">
                            {/* Khalti Button */}
                            <button
                              type="button"
                              onClick={handleKhalti}
                              className="w-full bg-white hover:bg-[#5C2D91] text-[#5C2D91] hover:text-white font-medium py-2.5 px-5 rounded-lg border border-gray-200 transition-colors duration-200 shadow-sm flex items-center justify-center gap-2"
                            >
                              <div className="w-6 h-6 flex items-center justify-center">
                                {/* Image placeholder for Khalti logo */}
                              </div>
                              Pay with Khalti
                            </button>

                            {/* Esewa Button */}
                            <button
                              type="button"
                              onClick={() => {
                                // First, save the booking details to localStorage
                                const bookingDetails = {
                                  clientId: userId,
                                  trainerId: trainerId,
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
                              }}
                              className="w-full bg-white hover:bg-[#60BB46] text-[#60BB46] hover:text-white font-medium py-2.5 px-5 rounded-lg border border-gray-200 transition-colors duration-200 shadow-sm flex items-center justify-center gap-2"
                            >
                              <div className="w-6 h-6 flex items-center justify-center"></div>
                              Pay with eSewa
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ratings and Reviews Section */}
          <div className="mt-8 bg-white rounded-2xl shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Ratings & Reviews</h3>
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      className={`${
                        star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-lg">{averageRating.toFixed(1)}</span>
                <span className="text-gray-500">
                  ({totalRatings} {totalRatings === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>

            {/* Rating Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  // Calculate how many ratings have this star value
                  const count = ratings.filter((r) => Math.round(r.rating) === star).length
                  // Calculate percentage
                  const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0

                  return (
                    <div key={star} className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 w-16">
                        <span>{star}</span>
                        <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-500 w-16">
                        {count} {count === 1 ? "review" : "reviews"}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold mb-3">Rating Breakdown</h4>
                <div className="space-y-4">
                  {/* Calculate these values based on your actual data */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Expertise</span>
                    <div className="flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={`${
                              star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm">{averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Communication</span>
                    <div className="flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={`${
                              star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm">{averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Punctuality</span>
                    <div className="flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={`${
                              star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm">{averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-6">
              <h4 className="font-semibold text-lg">Client Reviews</h4>

              {displayedRatings.length > 0 ? (
                <>
                  {displayedRatings.map((review, index) => (
                    <div key={index} className="border-b border-gray-100 pb-6 mb-6 last:border-0">
                      <div className="flex justify-between">
                        <div className="flex items-start space-x-4">
                          <img
                            src={
                              review.clientId?.profilePicture
                                ? `http://localhost:3000/uploads/profilePictures/${review.clientId.profilePicture}`
                                : "/placeholder.svg?height=48&width=48"
                            }
                            alt={review.clientId?.userName || "Client"}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h5 className="font-medium">{review.clientId?.userName || "Client"}</h5>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={16}
                                    className={`${
                                      star <= Math.round(review.rating)
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500 ml-2">{formatDate(review.createdAt)}</span>
                            </div>
                            <p className="mt-2 text-gray-700">{review.feedback}</p>
                            <div className="mt-3 flex items-center space-x-4">
                              <button className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                                <ThumbsUp size={14} className="mr-1" />
                                Helpful
                              </button>
                              <button className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                                <MessageCircle size={14} className="mr-1" />
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center bg-yellow-50 rounded-full h-10 w-10">
                          <span className="font-semibold text-yellow-600">{review.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Show more/less button */}
                  {ratings.length > 3 && (
                    <div className="text-center mt-4">
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                      >
                        {showAllReviews ? "Show Less Reviews" : `Show All ${ratings.length} Reviews`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No reviews yet for this trainer.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default TrainerDetails

