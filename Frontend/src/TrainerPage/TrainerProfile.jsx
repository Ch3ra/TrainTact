"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import {
  Calendar,
  MapPin,
  Clock,
  Award,
  Target,
  FileText,
  Download,
  Star,
  Mail,
  Cake,
  Edit,
  Camera,
  Share2,
  ChevronLeft,
  Phone,
  Users,
  XCircle,
  MessageCircle,
  ThumbsUp,
  Eye,
  X,
  AlertCircle,
} from "lucide-react"
import TrainerLayout from "./TrainerLayout"

// Helper function to ensure IDs are properly formatted
const formatId = (id) => {
  if (!id) return null
  return typeof id === "object" ? id.toString() : id
}

const TrainerProfile = () => {
  const [trainer, setTrainer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("about")
  const [ratings, setRatings] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const navigate = useNavigate()

  // Resume state
  const [isResumePreviewOpen, setIsResumePreviewOpen] = useState(false)
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [pdfError, setPdfError] = useState(false)
  const [pdfUrl, setPdfUrl] = useState("")
  const [resumeLoading, setResumeLoading] = useState(true)
  const [trainerResume, setTrainerResume] = useState(null)

  // Format date for reviews
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Navigate to edit profile page
  const handleEditProfile = () => {
    navigate("/editTrainerProfile")
  }

  // Function to fetch PDF content or URL
  const fetchPdfUrl = async (resumeFileName) => {
    if (!resumeFileName) return

    setResumeLoading(true)
    console.log("Fetching PDF for:", resumeFileName)

    try {
      // Try different possible URL patterns for the PDF
      const possibleUrls = [
        `http://localhost:3000/api/trainer/getResume/${resumeFileName}`,
        `http://localhost:3000/uploads/resumes/${resumeFileName}`,
        `http://localhost:3000/uploads/${resumeFileName}`,
        `http://localhost:3000/${resumeFileName}`,
      ]

      // Try each URL until one works
      for (const url of possibleUrls) {
        try {
          console.log("Trying URL:", url)
          const response = await axios.get(url, {
            responseType: "blob",
          })

          if (response.status === 200) {
            // Create a blob URL from the response
            const blob = new Blob([response.data], { type: "application/pdf" })
            const blobUrl = URL.createObjectURL(blob)
            setPdfUrl(blobUrl)
            setPdfLoaded(true)
            setResumeLoading(false)
            console.log("PDF loaded successfully from:", url)
            return
          }
        } catch (error) {
          // Continue to the next URL if this one fails
          console.log(`Failed to fetch PDF from ${url}`)
        }
      }

      // If direct fetching failed, try to get it from the API
      try {
        const token = localStorage.getItem("token")
        const decodedToken = jwtDecode(token)
        const trainerId = decodedToken.id
        const formattedTrainerId = formatId(trainerId)

        console.log("Trying to fetch from trainer API")
        // Use the correct endpoint: details/:userId instead of getTrainerById
        const response = await axios.get(`http://localhost:3000/api/trainer/details/${formattedTrainerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.data && response.data.trainer && response.data.trainer.resume) {
          // If the API returns resume data
          setTrainerResume({
            fileName: response.data.trainer.resume,
          })

          // Try to fetch the resume file
          const resumeFileName = response.data.trainer.resume
          for (const url of possibleUrls) {
            try {
              const resumeResponse = await axios.get(url.replace("${resumeFileName}", resumeFileName), {
                responseType: "blob",
              })

              if (resumeResponse.status === 200) {
                const blob = new Blob([resumeResponse.data], { type: "application/pdf" })
                const blobUrl = URL.createObjectURL(blob)
                setPdfUrl(blobUrl)
                setPdfLoaded(true)
                setResumeLoading(false)
                console.log("PDF loaded successfully from:", url)
                return
              }
            } catch (error) {
              console.log(`Failed to fetch PDF from ${url}`)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching PDF from trainer API:", error)
      }

      // If we get here, none of the URLs worked
      throw new Error("Could not find PDF at any expected location")
    } catch (error) {
      console.error("Error fetching PDF:", error)
      setPdfError(true)
      setResumeLoading(false)

      // Set a fallback URL for direct access attempt
      setPdfUrl(`http://localhost:3000/uploads/resumes/${resumeFileName}`)
    }
  }

  // Handle PDF load error
  const handlePdfError = () => {
    setPdfError(true)
    setPdfLoaded(false)
  }

  // Handle PDF load success
  const handlePdfLoad = () => {
    setPdfLoaded(true)
    setPdfError(false)
  }

  // Function to handle resume download
  const handleDownloadResume = async (resumeFileName, trainerName = "trainer") => {
    if (!resumeFileName) return

    try {
      // Try different possible URL patterns for the PDF
      const possibleUrls = [
        `http://localhost:3000/api/trainer/getResume/${resumeFileName}`,
        `http://localhost:3000/uploads/resumes/${resumeFileName}`,
        `http://localhost:3000/uploads/${resumeFileName}`,
        `http://localhost:3000/${resumeFileName}`,
      ]

      let pdfBlob = null

      // Try each URL until one works
      for (const url of possibleUrls) {
        try {
          const response = await axios.get(url, {
            responseType: "blob",
          })

          if (response.status === 200) {
            pdfBlob = new Blob([response.data], { type: "application/pdf" })
            break
          }
        } catch (error) {
          // Continue to the next URL if this one fails
          console.log(`Failed to fetch PDF from ${url}`)
        }
      }

      if (!pdfBlob) {
        // If direct fetching failed, try to get it from the API
        try {
          const token = localStorage.getItem("token")
          const decodedToken = jwtDecode(token)
          const trainerId = decodedToken.id
          const formattedTrainerId = formatId(trainerId)

          // Use the correct endpoint: details/:userId instead of getTrainerById
          const response = await axios.get(`http://localhost:3000/api/trainer/details/${formattedTrainerId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.data && response.data.trainer && response.data.trainer.resume) {
            // Try to fetch the resume file
            const resumeFileName = response.data.trainer.resume
            for (const url of possibleUrls) {
              try {
                const resumeResponse = await axios.get(url.replace("${resumeFileName}", resumeFileName), {
                  responseType: "blob",
                })

                if (resumeResponse.status === 200) {
                  pdfBlob = new Blob([resumeResponse.data], { type: "application/pdf" })
                  break
                }
              } catch (error) {
                console.log(`Failed to fetch PDF from ${url}`)
              }
            }
          }
        } catch (error) {
          console.error("Error fetching PDF from trainer API:", error)
        }
      }

      if (!pdfBlob) {
        throw new Error("Could not download PDF from any source")
      }

      // Create a download link
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${trainerName}_resume.pdf`
      document.body.appendChild(a)
      a.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Failed to download the resume. Please try again later.")

      // Last resort: try to open the PDF in a new tab
      window.open(`http://localhost:3000/uploads/resumes/${resumeFileName}`, "_blank")
    }
  }

  // Fetch trainer data
  useEffect(() => {
    const fetchTrainerData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")

        if (!token) {
          setError("Authentication required")
          setLoading(false)
          return
        }

        const decodedToken = jwtDecode(token)
        const trainerId = decodedToken.id
        const formattedTrainerId = formatId(trainerId)

        if (!formattedTrainerId) {
          setError("Invalid trainer ID")
          setLoading(false)
          return
        }

        // Fetch trainer profile using the correct endpoint
        const response = await axios.get(`http://localhost:3000/api/trainer/details/${formattedTrainerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.data && response.data.trainer) {
          setTrainer(response.data.trainer)
          console.log("Trainer data:", response.data.trainer)

          // Check if resume exists in trainer data
          if (response.data.trainer.resume) {
            setTrainerResume({
              fileName: response.data.trainer.resume,
            })
            fetchPdfUrl(response.data.trainer.resume)
          } else {
            setResumeLoading(false)
          }

          // Fetch ratings for this trainer using the ratings API endpoint
          try {
            const ratingsResponse = await axios.get(`http://localhost:3000/api/ratings/trainer/${formattedTrainerId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (ratingsResponse.data) {
              setRatings(ratingsResponse.data.ratings || [])
              setAverageRating(ratingsResponse.data.averageRating || 0)
              setTotalRatings(ratingsResponse.data.count || 0)
            }
          } catch (reviewErr) {
            console.error("Error fetching ratings:", reviewErr)
          }
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching trainer data:", err)
        setError(err.response?.data?.message || "Failed to load profile")
        setLoading(false)
      }
    }

    fetchTrainerData()
  }, [])

  // Format availability days
  const formatAvailabilityDays = (availability) => {
    if (!availability) return "Not specified"

    const days = {
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
      sunday: "Sun",
    }

    const availableDays = Object.entries(availability)
      .filter(([_, isAvailable]) => isAvailable)
      .map(([day]) => days[day.toLowerCase()])

    if (availableDays.length === 0) return "Not available"
    if (availableDays.length === 7) return "Every day"

    return availableDays.join(", ")
  }

  // Format time range
  const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return "Not specified"
    return `${startTime} - ${endTime}`
  }

  // Display limited reviews or all reviews based on state
  const displayedRatings = showAllReviews ? ratings : ratings.slice(0, 3)

  if (loading) {
    return (
      <TrainerLayout>
        <div className="flex justify-center items-center h-full py-20">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#CE0000]"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </TrainerLayout>
    )
  }

  if (error) {
    return (
      <TrainerLayout>
        <div className="flex justify-center items-center h-full py-20">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto">
            <div className="bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-[#CE0000]" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Profile</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#CE0000] text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </TrainerLayout>
    )
  }

  return (
    <TrainerLayout>
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="group relative mb-4 flex items-center text-gray-600 hover:text-[#CE0000] transition-colors"
        >
          <div className="relative z-10">
            <ChevronLeft className="h-5 w-5 mr-1" />
          </div>
          <span className="relative z-10">Back</span>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gray-100 transition-opacity rounded-md w-20 h-8"></div>
        </button>

        {/* Cover Photo */}
        <div className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300 mb-20 shadow-md">
          {trainer?.coverPhoto ? (
            <img
              src={`http://localhost:3000/uploads/coverPhoto/${trainer.coverPhoto}`}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">No cover photo</span>
            </div>
          )}

          {/* Edit cover button */}
          <button className="absolute top-4 right-4 bg-white bg-opacity-80 p-2 rounded-full hover:bg-opacity-100 transition-all shadow-md">
            <Camera className="h-5 w-5 text-gray-700" />
          </button>

          {/* Profile picture - Fixed positioning to ensure full circle is visible */}
          <div className="absolute bottom-0 left-8 transform translate-y-1/2 h-32 w-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden z-10">
            {trainer?.profilePicture ? (
              <img
                src={`http://localhost:3000/uploads/profilePictures/${trainer.profilePicture}`}
                alt={trainer.userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-4xl font-bold">
                  {trainer?.userName?.charAt(0).toUpperCase() || "T"}
                </span>
              </div>
            )}

            {/* Edit profile picture button */}
            <button className="absolute bottom-0 right-0 bg-[#CE0000] p-1.5 rounded-full hover:bg-red-700 transition-all shadow-md">
              <Camera className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Quick stats */}
          <div className="absolute -bottom-16 right-8 flex space-x-4">
            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center min-w-24">
              <span className="text-2xl font-bold text-[#CE0000]">{totalRatings}</span>
              <span className="text-xs text-gray-500">Reviews</span>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center min-w-24">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-[#CE0000] mr-1">{averageRating.toFixed(1)}</span>
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              </div>
              <span className="text-xs text-gray-500">Rating</span>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center min-w-24">
              <span className="text-2xl font-bold text-[#CE0000]">{trainer?.yearsOfExperience || 0}</span>
              <span className="text-xs text-gray-500">Years Exp.</span>
            </div>
          </div>
        </div>

        {/* Profile content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left column - Basic info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              {/* Name and basic info */}
              <div className="p-6 border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gray-800">{trainer?.userName || "Trainer Name"}</h1>
                <p className="text-gray-500 flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1 text-[#CE0000]" />
                  {trainer?.location || "Location not specified"}
                </p>

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={handleEditProfile}
                    className="flex-1 bg-[#CE0000] text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                  <button className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Contact info */}
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                  <div className="relative group mr-2">
                    <div className="absolute inset-0 bg-[#CE0000] opacity-10 rounded-lg group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative p-1 rounded-lg">
                      <Phone className="h-5 w-5 text-[#CE0000]" />
                    </div>
                  </div>
                  CONTACT INFO
                </h2>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-800">{trainer?.email || "email@example.com"}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-800">{trainer?.phone || "(+977) 9811223344"}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Cake className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="text-gray-800">{trainer?.age || "Not specified"} years</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                  <div className="relative group mr-2">
                    <div className="absolute inset-0 bg-[#CE0000] opacity-10 rounded-lg group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative p-1 rounded-lg">
                      <Calendar className="h-5 w-5 text-[#CE0000]" />
                    </div>
                  </div>
                  AVAILABILITY
                </h2>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Days</p>
                      <p className="text-gray-800">
                        {trainer?.startDay && trainer?.endDay
                          ? `${trainer.startDay} - ${trainer.endDay}`
                          : formatAvailabilityDays(trainer?.availability)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Hours</p>
                      <p className="text-gray-800">
                        {trainer?.availabilityHours || formatTimeRange(trainer?.startTime, trainer?.endTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Tabs content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("about")}
                  className={`flex-1 py-4 px-6 text-center font-medium ${
                    activeTab === "about"
                      ? "text-[#CE0000] border-b-2 border-[#CE0000]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  About
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`flex-1 py-4 px-6 text-center font-medium ${
                    activeTab === "reviews"
                      ? "text-[#CE0000] border-b-2 border-[#CE0000]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Reviews ({totalRatings})
                </button>
              </div>

              {/* Tab content */}
              <div className="p-6">
                {/* About tab */}
                {activeTab === "about" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">About Me</h2>
                    <div
                      className="prose max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: trainer?.description || "No description provided." }}
                    ></div>

                    {/* Bibliography Section */}
                    {trainer?.bibliography && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold mb-2">Bibliography</h3>
                        <p className="text-gray-700">{trainer.bibliography}</p>
                      </div>
                    )}

                    {/* Experience and Payment Requirements in a grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      {/* Experience */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Experience</h3>
                        <div className="flex items-center mb-4">
                          <div className="bg-red-100 p-3 rounded-lg mr-4">
                            <Award className="h-6 w-6 text-[#CE0000]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {trainer?.yearsOfExperience || 0} Years of Experience
                            </p>
                            <p className="text-gray-600 text-sm">Professional fitness training</p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Requirements */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Payment Requirements</h3>
                        <div className="flex items-start">
                          <div
                            className={`p-2 rounded-full mr-3 ${trainer?.advancedNeeded ? "bg-yellow-100" : "bg-green-100"}`}
                          >
                            <AlertCircle
                              className={`h-5 w-5 ${trainer?.advancedNeeded ? "text-yellow-600" : "text-green-600"}`}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {trainer?.advancedNeeded ? "Advance Payment Required" : "Pay When Session Starts"}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {trainer?.advancedNeeded
                                ? "This trainer requires advance payment before the session starts."
                                : "You can pay when the session starts. No advance payment needed."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fitness Goals and Pricing in a grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      {/* Fitness Goals */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Fitness Goals I Can Help With</h3>
                        {trainer?.fitnessGoal ? (
                          <div className="flex items-start">
                            <div className="bg-red-100 p-2 rounded-lg mr-3">
                              <Target className="h-5 w-5 text-[#CE0000]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{trainer.fitnessGoal}</p>
                            </div>
                          </div>
                        ) : trainer?.fitnessGoals?.length > 0 ? (
                          trainer.fitnessGoals.map((goal, index) => (
                            <div key={index} className="flex items-start mb-3">
                              <div className="bg-red-100 p-2 rounded-lg mr-3">
                                <Target className="h-5 w-5 text-[#CE0000]" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{goal}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No fitness goals specified</p>
                        )}
                      </div>

                      {/* Pricing */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Pricing</h3>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Session Rate</span>
                            <span className="text-xl font-bold text-[#CE0000]">
                              {trainer?.price
                                ? `$${trainer.price}`
                                : trainer?.hourlyRate
                                  ? `$${trainer.hourlyRate}`
                                  : "Not specified"}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            Package discounts available for multiple sessions
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resume Section */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Resume</h3>
                      <div className="space-y-4">
                        {/* Resume in Certifications Section */}
                        {trainer?.resume ? (
                          <div className="flex items-start">
                            <div className="bg-red-100 p-2 rounded-lg mr-3">
                              <FileText className="h-5 w-5 text-[#CE0000]" />
                            </div>
                            <div className="flex-grow">
                              <div className="flex justify-between items-center">
                                <p className="font-medium text-gray-800">Professional Resume</p>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setIsResumePreviewOpen(true)}
                                    className="text-gray-600 hover:text-[#CE0000] flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors text-sm"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownloadResume(trainer.resume, trainer.userName)}
                                    className="text-gray-600 hover:text-[#CE0000] flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors text-sm"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Download</span>
                                  </button>
                                </div>
                              </div>
                              <p className="text-gray-600 text-sm mt-1">{trainer.resume}</p>

                              {/* Resume Preview Thumbnail */}
                              {pdfLoaded && (
                                <div
                                  className="mt-3 border border-gray-200 rounded-md overflow-hidden h-32 cursor-pointer"
                                  onClick={() => setIsResumePreviewOpen(true)}
                                >
                                  <iframe src={pdfUrl} className="w-full h-full" title="Resume Preview Thumbnail" />
                                </div>
                              )}

                              {resumeLoading && !pdfLoaded && (
                                <div className="mt-3 flex items-center text-sm text-gray-500">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#CE0000] mr-2"></div>
                                  Loading resume...
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500">No resume uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews tab */}
                {activeTab === "reviews" && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">Client Reviews</h2>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-gray-700 font-medium">{averageRating.toFixed(1)}/5</span>
                        <span className="ml-1 text-gray-500">({totalRatings} reviews)</span>
                      </div>
                    </div>

                    {/* Rating Stats */}
                    <div className="mb-8">
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
                                <div
                                  className="h-full bg-yellow-400 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-500 w-16">
                                {count} {count === 1 ? "review" : "reviews"}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Individual Reviews */}
                    {ratings.length > 0 ? (
                      <div className="space-y-6">
                        {displayedRatings.map((review, index) => (
                          <div key={index} className="border border-gray-200 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                                  {review.clientId?.profilePicture ? (
                                    <img
                                      src={`${review.clientId.profilePicture}`}
                                      alt={review.clientId.userName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Users className="h-5 w-5 text-gray-500" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-800">
                                    {review.clientId?.userName || "Anonymous Client"}
                                  </h4>
                                  <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                                </div>
                              </div>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-700">{review.feedback}</p>
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
                      </div>
                    ) : (
                      <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                        <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-700 mb-1">No Reviews Yet</h3>
                        <p className="text-gray-500">You haven't received any client reviews yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Preview Modal */}
      {isResumePreviewOpen && trainer?.resume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col animate-scaleIn">
            <div className="flex justify-between items-center border-b p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Resume Preview - {trainer.userName || "Trainer"}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadResume(trainer.resume, trainer.userName)}
                  className="text-[#CE0000] hover:text-[#A00000] flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setIsResumePreviewOpen(false)}
                  className="text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 p-1 transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-grow overflow-auto p-0 flex items-center justify-center bg-gray-100 relative">
              {/* PDF Viewer with fallback using embed and object tags */}
              <div className="w-full h-full flex flex-col">
                {!pdfError && pdfUrl ? (
                  <object
                    data={pdfUrl}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    className="w-full h-full"
                    onError={handlePdfError}
                    onLoad={handlePdfLoad}
                  >
                    {/* If object fails, try iframe with Google Docs Viewer */}
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
                      width="100%"
                      height="100%"
                      className="w-full h-full"
                      onError={handlePdfError}
                    >
                      <div className="text-center p-8">
                        <FileText className="h-16 w-16 text-[#CE0000] mx-auto mb-4" />
                        <h4 className="text-lg font-medium mb-2">Resume Preview</h4>
                        <p className="text-gray-500 mb-4">
                          Unable to display the PDF. Please try downloading it instead.
                        </p>
                      </div>
                    </iframe>
                  </object>
                ) : (
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 text-[#CE0000] mx-auto mb-4" />
                    <h4 className="text-lg font-medium mb-2">Resume Preview</h4>
                    <p className="text-gray-500 mb-4">
                      {pdfLoaded ? "Loading PDF..." : "We're unable to display the PDF directly here."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => handleDownloadResume(trainer.resume, trainer.userName)}
                        className="bg-white hover:bg-gray-50 text-gray-800 py-2 px-4 rounded-lg font-medium border border-gray-300 flex items-center justify-center transition-colors duration-200 shadow-sm"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download Resume
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t p-4 flex justify-end bg-gray-50">
              <button
                onClick={() => setIsResumePreviewOpen(false)}
                className="bg-white hover:bg-gray-50 text-gray-800 py-2 px-4 rounded-lg font-medium border border-gray-300 transition-colors duration-200 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </TrainerLayout>
  )
}

export default TrainerProfile

