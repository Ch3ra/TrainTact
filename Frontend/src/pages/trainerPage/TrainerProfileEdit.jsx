"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock,
  User,
  MapPin,
  DollarSign,
  FileText,
  BookOpen,
  Briefcase,
} from "lucide-react"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"

const TrainerProfileEdit = () => {
  const [trainerData, setTrainerData] = useState({
    userName: "",
    email: "",
    profilePicture: null,
    fitnessGoal: "",
    location: "",
    yearsOfExperience: 0,
    bibliography: "", // Added bibliography field
    resume: null, // Added resume field
    age: 0, // Added age field
    price: 0,
    availabilityHours: "", // Note: Changed from availabilityTime to match backend field
    description: "",
    startDay: "",
    endDay: "",
    advancedNeeded: false,
    coverPhoto: null,
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Authentication check
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        // No token found, redirect to login
        console.log("No token found in TrainerProfileEdit")
        toast.error("Please log in to access this page")
        navigate("/authentication")
        return false
      }

      try {
        // Decode token to check role
        const decodedToken = JSON.parse(atob(token.split(".")[1]))

        // Debug: Log the token structure to see what fields are available
        console.log("Decoded token in TrainerProfileEdit:", decodedToken)

        // The role field might be named differently (like userType, accountType, etc.)
        // Check for common variations that might represent user role
        const userRole =
          decodedToken.role ||
          decodedToken.userRole ||
          decodedToken.userType ||
          decodedToken.type ||
          decodedToken.accountType

        console.log("Detected user role in TrainerProfileEdit:", userRole)

        // Check if user is a trainer - be more flexible with role naming
        if (userRole && userRole.toLowerCase() !== "trainer") {
          console.log("Access denied in TrainerProfileEdit: User is not a trainer")
          toast.error("Only trainers can edit trainer profiles")
          navigate("/authentication")
          return false
        }

        // User is a trainer, fetch trainer data
        fetchTrainerData(decodedToken.id)
        return true
      } catch (error) {
        console.error("Failed to decode token in TrainerProfileEdit", error)
        console.error("Token content:", token)
        toast.error("Authentication error. Please log in again.")
        navigate("/authentication")
        return false
      }
    }

    // Run auth check
    checkAuth()
  }, [navigate])

  const fetchTrainerData = async (userId) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:3000/api/trainer/details/${userId}`)
      const data = await response.json()

      if (response.ok) {
        // Set trainer data from API response
        const trainerDetails = data.trainer
        console.log("Fetched trainer data:", trainerDetails)

        setTrainerData({
          userName: trainerDetails.userName || "",
          email: trainerDetails.email || "",
          profilePicture: trainerDetails.profilePicture || null,
          fitnessGoal: trainerDetails.fitnessGoal || "",
          location: trainerDetails.location || "",
          yearsOfExperience: trainerDetails.yearsOfExperience || 0,
          bibliography: trainerDetails.bibliography || "",
          resume: trainerDetails.resume || null,
          age: trainerDetails.age || 0,
          price: trainerDetails.price || 0,
          availabilityHours: trainerDetails.availabilityHours || "",
          description: trainerDetails.description || "",
          startDay: trainerDetails.startDay || "",
          endDay: trainerDetails.endDay || "",
          advancedNeeded: trainerDetails.advancedNeeded || false,
          coverPhoto: trainerDetails.coverPhoto || null,
        })
      } else {
        throw new Error(data.message || "Failed to fetch trainer data")
      }
    } catch (error) {
      console.error("Error fetching trainer information:", error)
      toast.error("Failed to fetch your profile information")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate("/trainerDash")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setLoading(true)

      const formData = new FormData()

      // Append all non-file fields
      Object.entries(trainerData).forEach(([key, value]) => {
        if (value !== null && key !== "profilePicture" && key !== "coverPhoto" && key !== "resume") {
          formData.append(key, value)
        }
      })

      // Append file fields only if they are actual File objects
      if (trainerData.profilePicture instanceof File) {
        formData.append("profilePicture", trainerData.profilePicture)
      }

      if (trainerData.coverPhoto instanceof File) {
        formData.append("coverPhoto", trainerData.coverPhoto)
      }

      if (trainerData.resume instanceof File) {
        formData.append("resume", trainerData.resume)
      }

      const userId = JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id
      const response = await fetch(`http://localhost:3000/api/trainer/trainer/${userId}`, {
        method: "PATCH", // Using PATCH to match the router endpoint
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      const result = await response.json()
      if (response.ok) {
        toast.success("Profile updated successfully!")
        navigate("/trainerDash")
      } else {
        throw new Error(result.message || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating trainer profile:", error)
      toast.error("Failed to update profile: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target
    setTrainerData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleFileChange = (event, fieldName) => {
    const file = event.target.files[0]
    if (file) {
      setTrainerData((prevState) => ({
        ...prevState,
        [fieldName]: file,
      }))
    }
  }

  const handleContentChange = (value) => {
    setTrainerData((prevState) => ({ ...prevState, description: value }))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mb-6"></div>
        <p className="text-xl font-semibold text-gray-700">Loading your profile information...</p>
        <p className="text-gray-500 mt-2">Please wait while we fetch your data</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6">
      <button
        onClick={handleBack}
        className="fixed top-6 left-6 z-10 rounded-full bg-red-600 p-3 inline-flex items-center justify-center text-white shadow-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-105"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-800 px-6 py-8 text-white">
          <h1 className="text-3xl font-bold text-center">Edit Trainer Profile</h1>
          <p className="text-center mt-2 text-red-100">Update your professional information</p>
        </div>

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="p-6 md:p-8">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative group mb-4">
              <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:shadow-xl transition-all duration-200">
                <img
                  className="h-full w-full object-cover"
                  src={
                    trainerData.profilePicture instanceof File
                      ? URL.createObjectURL(trainerData.profilePicture)
                      : trainerData.profilePicture
                        ? `http://localhost:3000/uploads/profilePictures/${trainerData.profilePicture}`
                        : "https://static.vecteezy.com/system/resources/previews/047/305/447/non_2x/default-avatar-profile-icon-with-long-shadow-simple-user-sign-symbol-vector.jpg"
                  }
                  alt="Profile preview"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <label className="bg-black bg-opacity-50 text-white rounded-full p-2 cursor-pointer hover:bg-opacity-70 transition-all">
                  <User className="h-6 w-6" />
                  <input
                    type="file"
                    name="profilePicture"
                    onChange={(e) => handleFileChange(e, "profilePicture")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <p className="text-sm text-gray-500">Click to change profile picture</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={trainerData.userName}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={trainerData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={trainerData.age}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                min="18"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  value={trainerData.yearsOfExperience}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-red-600" />
                Professional Information
              </h2>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="bibliography" className="block text-sm font-medium text-gray-700">
                    Bibliography
                  </label>
                  <textarea
                    id="bibliography"
                    name="bibliography"
                    value={trainerData.bibliography}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                    rows="4"
                    placeholder="Share your professional background and achievements..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Resume</label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="flex items-center justify-center w-full px-4 py-3 bg-white border border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">
                          {trainerData.resume instanceof File
                            ? trainerData.resume.name
                            : trainerData.resume
                              ? "Current: " + trainerData.resume
                              : "Upload your resume (PDF or DOC)"}
                        </span>
                        <input
                          type="file"
                          name="resume"
                          onChange={(e) => handleFileChange(e, "resume")}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Training Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="fitnessGoal" className="block text-sm font-medium text-gray-700">
                    Fitness Goal
                  </label>
                  <input
                    type="text"
                    id="fitnessGoal"
                    name="fitnessGoal"
                    value={trainerData.fitnessGoal}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                    placeholder="e.g. Weight Loss, Muscle Building, etc."
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="availabilityHours" className="block text-sm font-medium text-gray-700">
                    Available Hours
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="availabilityHours"
                      name="availabilityHours"
                      value={trainerData.availabilityHours}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled>
                        Select available hours
                      </option>
                      <option value="morning">Morning</option>
                      <option value="mid_day">Mid-Day</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="night">Night</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="startDay" className="block text-sm font-medium text-gray-700">
                    Start Day
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="startDay"
                      name="startDay"
                      value={trainerData.startDay}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled>
                        Select start day
                      </option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="endDay" className="block text-sm font-medium text-gray-700">
                    End Day
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="endDay"
                      name="endDay"
                      value={trainerData.endDay}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled>
                        Select end day
                      </option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Location & Pricing</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={trainerData.location}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                      placeholder="City, State or Gym location"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price per Session
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={trainerData.price}
                      onChange={handleInputChange}
                      min="0"
                      className="pl-10 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Description</h2>

              <div className="space-y-1.5">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  About Your Training
                </label>
                <ReactQuill
                  theme="snow"
                  value={trainerData.description}
                  onChange={handleContentChange}
                  className="bg-white rounded-lg"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link"],
                      ["clean"],
                    ],
                  }}
                  placeholder="Describe your training style, specialties, and what clients can expect..."
                />
                <div className="h-12"></div> {/* Spacer for Quill editor */}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Cover Photo</h2>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Upload a cover photo for your profile</label>
                <input
                  type="file"
                  name="coverPhoto"
                  onChange={(e) => handleFileChange(e, "coverPhoto")}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                />

                <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                  {/* Show current cover photo */}
                  {trainerData.coverPhoto && typeof trainerData.coverPhoto === "string" && (
                    <img
                      src={`http://localhost:3000/uploads/coverPhoto/${trainerData.coverPhoto}`}
                      alt="Cover preview"
                      className="w-full h-48 object-cover"
                    />
                  )}

                  {/* Show new cover photo preview */}
                  {trainerData.coverPhoto instanceof File && (
                    <img
                      src={URL.createObjectURL(trainerData.coverPhoto) || "/placeholder.svg"}
                      alt="Cover preview"
                      className="w-full h-48 object-cover"
                    />
                  )}

                  {/* Show placeholder if no cover photo */}
                  {!trainerData.coverPhoto && (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <p className="text-gray-500">No cover photo selected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="advancedNeeded"
                name="advancedNeeded"
                checked={trainerData.advancedNeeded}
                onChange={handleInputChange}
                className="h-5 w-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="advancedNeeded" className="ml-3 text-sm font-medium text-gray-700">
                Advanced training certification needed
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg shadow-md hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  "Update Profile"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TrainerProfileEdit

