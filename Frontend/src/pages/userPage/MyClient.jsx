"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Link, useNavigate } from "react-router-dom"
import {
  Bell,
  Mail,
  ArrowLeft,
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle,
  User,
  Home,
  CreditCard,
  LogOut,
  Users,
  ChevronRight,
  Search,
} from "lucide-react"
import { useNotifications } from "../../Notification/NotificationContext"
import NotificationPanel from "../../Notification/NotificationPannel"
import TrainerLayout from "../../TrainerPage/TrainerLayout"

const MyClients = () => {
  const [trainerClients, setTrainerClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [profileData, setProfileData] = useState({
    userName: "",
    profilePicture: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()

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
    // Authentication check
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        // No token found, redirect to login
        console.log("No token found in MyClients")
        navigate("/authentication")
        return false
      }

      try {
        // Decode token to check role
        const decodedToken = JSON.parse(atob(token.split(".")[1]))

        // Debug: Log the token structure to see what fields are available
        console.log("Decoded token in MyClients:", decodedToken)

        // The role field might be named differently (like userType, accountType, etc.)
        // Check for common variations that might represent user role
        const userRole =
          decodedToken.role ||
          decodedToken.userRole ||
          decodedToken.userType ||
          decodedToken.type ||
          decodedToken.accountType

        console.log("Detected user role in MyClients:", userRole)

        // Check if user is a trainer - be more flexible with role naming
        if (userRole && userRole.toLowerCase() !== "trainer") {
          console.log("Access denied in MyClients: User is not a trainer")
          navigate("/authentication")
          return false
        }

        // User is a trainer, set userId and continue
        setUserId(decodedToken.id)
        fetchProfileData(decodedToken.id)
        fetchTrainerClients(decodedToken.id)
        return true
      } catch (error) {
        console.error("Failed to decode token in MyClients", error)
        console.error("Token content:", token)
        navigate("/authentication")
        return false
      }
    }

    // Run auth check
    checkAuth()
  }, [navigate])

  const fetchProfileData = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/trainer/${userId}`)
      if (response.data) {
        setProfileData({ ...response.data.user, ...response.data.trainerDetails })
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error)
    }
  }

  const fetchTrainerClients = async (trainerId) => {
    try {
      // Use the new API endpoint to get all clients for this trainer
      const response = await axios.get(`http://localhost:3000/api/availability/trainer/clients/${trainerId}`)

      setTrainerClients(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch trainer clients:", error)
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Format time to 12-hour format
  const formatTime = (timeString) => {
    if (!timeString) return "N/A"
    const [hours, minutes] = timeString.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const formattedHours = hours % 12 || 12
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/authentication")
  }

  // Filter clients based on search query
  const filteredClients = trainerClients.filter(
    (client) =>
      client.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.fitnessGoal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.location?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Get upcoming sessions
  const upcomingSessions = trainerClients
    .filter((client) => client.metrics?.nextSession)
    .map((client) => ({
      ...client.metrics.nextSession,
      clientName: client.userName,
      clientPhoto: client.profilePicture,
      clientId: client._id,
      clientGoal: client.fitnessGoal,
    }))
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

  return (
    <TrainerLayout className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
    

      <div className="flex flex-1">
        {/* Sidebar */}
     

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex items-center">
              <Link to="/trainerDash" className="mr-3">
                <ArrowLeft className="w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">My Clients</h1>
            </div>

            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search clients..."
                className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-red-100 p-3 rounded-full shadow-sm">
                      <Users className="w-6 h-6 text-red-600" />
                    </div>
                    <span className="text-xs font-medium text-red-500 bg-red-50 px-2.5 py-1 rounded-full">Total</span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Total Clients</h3>
                  <p className="text-3xl font-bold text-gray-800">{trainerClients.length}</p>
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                    {trainerClients.length > 0
                      ? `${Math.round((trainerClients.filter((c) => c.metrics?.activeSince).length / trainerClients.length) * 100)}% active this month`
                      : "No active clients"}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-green-100 p-3 rounded-full shadow-sm">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-xs font-medium text-green-500 bg-green-50 px-2.5 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Active Sessions</h3>
                  <p className="text-3xl font-bold text-gray-800">
                    {trainerClients.reduce((sum, client) => sum + (client.metrics?.ongoingSessions || 0), 0)}
                  </p>
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
                    {trainerClients.reduce((sum, client) => sum + (client.metrics?.completedSessions || 0), 0)}{" "}
                    completed sessions
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-100 p-3 rounded-full shadow-sm">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full">
                      Upcoming
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Upcoming Sessions</h3>
                  <p className="text-3xl font-bold text-gray-800">
                    {trainerClients.reduce((sum, client) => sum + (client.metrics?.upcomingSessions || 0), 0)}
                  </p>
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></div>
                    Next session in{" "}
                    <span className="font-medium ml-1 text-gray-700">
                      {upcomingSessions.length > 0
                        ? getTimeUntilNextSession(upcomingSessions[0]?.startDate, upcomingSessions[0]?.startTime)
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client List */}
              <div className="mb-10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-red-500" />
                    Client List
                    <span className="ml-2 text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {filteredClients.length}
                    </span>
                  </h2>
                 
                </div>

                {filteredClients.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                      <div
                        key={client._id}
                        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl hover:border-red-100 transition-all duration-300 transform hover:-translate-y-1"
                      >
                        <div className="relative">
                          <img
                            src={
                              client.profilePicture
                                ? client.profilePicture.includes("http")
                                  ? client.profilePicture
                                  : `http://localhost:3000/uploads/profilePictures/${client.profilePicture}`
                                : "/placeholder.svg?height=200&width=400"
                            }
                            alt={client.userName}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white font-bold text-xl">{client.userName}</h3>
                            <div className="flex items-center mt-1">
                              <p className="text-white/90 text-sm">{client.fitnessGoal || "No goal specified"}</p>
                              {client.metrics?.lastSessionDate && (
                                <span className="ml-auto bg-green-500/90 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-5">
                          {/* Client Details */}
                          <div className="mb-4 grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Fitness Level</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {client.fitnessLevel || "Not specified"}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Location</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {client.location || "Not specified"}
                              </p>
                            </div>
                          </div>

                       
                        

                          {/* Next Session */}
                          {client.metrics?.nextSession && (
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg mb-4 border border-blue-100">
                              <div className="flex items-center mb-2">
                                <Calendar size={16} className="text-blue-600 mr-2" />
                                <h4 className="font-semibold text-sm text-blue-800">Next Session</h4>
                              </div>
                              <p className="text-sm font-bold text-blue-900">
                                {formatDate(client.metrics.nextSession.startDate)}
                              </p>
                              <div className="flex items-center mt-1 text-sm text-blue-800">
                                <Clock size={14} className="mr-1" />
                                <span className="font-medium">
                                  {formatTime(client.metrics.nextSession.startTime)} (
                                  {client.metrics.nextSession.duration} min)
                                </span>
                              </div>
                              {client.metrics.nextSession.message && (
                                <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800 border border-blue-200">
                                  {client.metrics.nextSession.message}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex space-x-3 mt-5">
                            <Link
                              to="/chat"
                              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                              <MessageCircle size={16} />
                              Message
                            </Link>
                            <Link
                              to={`/clientDescription/${client._id}`}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                              <User size={16} />
                              Profile
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md">
                      <Users className="w-10 h-10 text-red-400" />
                    </div>
                    <p className="text-gray-700 text-lg font-medium mb-2">You don't have any clients yet.</p>
                    <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                      Start by setting up your availability and completing your profile to attract clients to your
                      training services.
                    </p>
                
                  </div>
                )}
              </div>

             
            </>
          )}
        </main>
      </div>
    </TrainerLayout>
  )
}

// Helper function to calculate time until next session
function getTimeUntilNextSession(dateString, timeString) {
  if (!dateString || !timeString) return "N/A"

  const now = new Date()
  const sessionDate = new Date(dateString)
  const [hours, minutes] = timeString.split(":").map(Number)

  sessionDate.setHours(hours, minutes, 0, 0)

  const diffMs = sessionDate - now
  if (diffMs < 0) return "past"

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""}`
  } else if (diffHrs > 0) {
    return `${diffHrs} hour${diffHrs > 1 ? "s" : ""}`
  } else {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""}`
  }
}

export default MyClients

