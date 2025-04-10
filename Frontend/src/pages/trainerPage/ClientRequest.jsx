"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, User, LogOut, Clock, Calendar, Target } from "lucide-react"
import TrainerNavbar from "./TrainerNavbar"
import { toast } from "react-hot-toast" // Import toast if you're using react-hot-toast
import TrainerLayout from "../../TrainerPage/TrainerLayout"

const ClientRequest = () => {
  const [bookingData, setBookingData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    // Authentication check
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        // No token found, redirect to login
        console.log("No token found in ClientRequest")
        setError("Authentication required. Please log in.")
        setLoading(false)
        navigate("/authentication")
        return false
      }

      try {
        // Decode token to check role
        const decodedToken = JSON.parse(atob(token.split(".")[1]))

        // Debug: Log the token structure to see what fields are available
        console.log("Decoded token in ClientRequest:", decodedToken)

        // The role field might be named differently (like userType, accountType, etc.)
        // Check for common variations that might represent user role
        const userRole =
          decodedToken.role ||
          decodedToken.userRole ||
          decodedToken.userType ||
          decodedToken.type ||
          decodedToken.accountType

        console.log("Detected user role in ClientRequest:", userRole)

        // Check if user is a trainer - be more flexible with role naming
        if (userRole && userRole.toLowerCase() !== "trainer") {
          console.log("Access denied in ClientRequest: User is not a trainer")
          setError("Access denied. Only trainers can view client requests.")
          setLoading(false)
          navigate("/authentication")
          return false
        }

        // User is a trainer, fetch booking data
        fetchBookings(decodedToken.id)
        return true
      } catch (error) {
        console.error("Failed to decode token in ClientRequest", error)
        console.error("Token content:", token)
        setError("Authentication error. Please log in again.")
        setLoading(false)
        navigate("/authentication")
        return false
      }
    }

    // Run auth check
    checkAuth()
  }, [navigate])

  const fetchBookings = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/availability/trainerBookings/${userId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: Server responded with status ${response.status}`)
      }

      const data = await response.json()
      // Filter for unverified bookings only
      const unverifiedBookings = data.filter((booking) => booking.isClientVerified === false)
      setBookingData(unverifiedBookings)
      setLoading(false)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      setLoading(false)
    }
  }

  const handleAccept = async (bookingId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/availability/verify/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to verify client")
      }

      toast?.success("Client request accepted successfully")
      setBookingData((prevData) => prevData.filter((booking) => booking._id !== bookingId))
    } catch (error) {
      console.error("Error verifying client:", error)
      toast?.error("Failed to accept client request")
    }
  }

  const handleDecline = async (bookingId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/availability/delete/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete booking")
      }

      toast?.success("Client request declined")
      setBookingData((prevData) => prevData.filter((booking) => booking._id !== bookingId))
    } catch (error) {
      console.error("Error deleting booking:", error)
      toast?.error("Failed to decline client request")
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/authentication")
  }

  // Default placeholder avatar - base64 encoded small image
  const defaultAvatar =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBmaWxsPSIjZTVlN2ViIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlYiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI0MCIgZmlsbD0iI2QxZDVkYiIvPjxwYXRoIGQ9Ik0xNzUsMTcyYzAsMC01MC01MC0xNTAsMGMwLDAsMCwwLDAsMGgyMDBDMjI1LDE3MiwyMjUsMTcyLDE3NSwxNzJ6IiBmaWxsPSIjZDFkNWRiIi8+PC9zdmc+"

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )

  if (error)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      </div>
    )

  return (
    <TrainerLayout className="bg-gray-50 min-h-screen">
     
      <div className="flex">
      

        <div className="flex-1 p-8">
          <h3 className="text-2xl font-bold mb-6">Client Requests</h3>

          {bookingData.length > 0 ? (
            <div className="space-y-4">
              {bookingData.map((booking) => (
                <div
                  key={booking._id}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-start gap-4 mb-4 md:mb-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                        <img
                          src={
                            booking.clientId?.profilePicture
                              ? `${booking.clientId.profilePicture}`
                              : defaultAvatar
                          }
                          alt="Client profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = defaultAvatar
                          }}
                        />
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold">{booking.clientId?.userName || "Unknown Client"}</h4>
                        <div className="flex items-center space-x-1 mt-1">
                          <Mail className="h-4 w-4 text-red-500" />
                          <p className="text-gray-600 text-sm">{booking.clientId?.email || "No email provided"}</p>
                        </div>

                        {/* Session Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-red-500" />
                            <span className="text-sm">
                              {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-red-500" />
                            <span className="text-sm">
                              {booking.startTime || "No time specified"} ({booking.duration} min)
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-red-500" />
                            <span className="text-sm">Goal: {booking.clientId?.fitnessGoal || "Not specified"}</span>
                          </div>

                          {booking.message && (
                            <div className="col-span-2 mt-2 p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium text-gray-700">Message:</p>
                              <p className="text-gray-600">{booking.message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAccept(booking._id)}
                        className="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(booking._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-sm text-center">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <User size={32} className="text-gray-400" />
                </div>
                <p className="text-lg text-gray-600">No pending client requests.</p>
                <p className="text-sm text-gray-500 mt-2">
                  When clients request to book sessions with you, they will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TrainerLayout>
  )
}

export default ClientRequest

