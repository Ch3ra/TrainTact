"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import { Bell, Mail, ArrowLeft, Star, MessageCircle, Video, Calendar, Clock, CheckCircle, User } from "lucide-react"
import { useNotifications } from "../../Notification/NotificationContext"
import NotificationPanel from "../../Notification/NotificationPannel"

const MyClients = () => {
  const [trainerClients, setTrainerClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
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
        fetchTrainerClients(decodedToken.id)
      } catch (error) {
        console.error("Error decoding token:", error)
      }
    }
  }, [])

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
              src={
                profileData.profilePicture 
                  ? profileData.profilePicture.includes('http')
                    ? profileData.profilePicture
                    : `http://localhost:3000/uploads/profilePictures/${profileData.profilePicture}`
                  : "/placeholder.svg"
              }
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
            <Link to="/trainerDash">
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
              <div className="w-6 h-6">👥</div>
              <span>My Clients</span>
            </div>
            <div className="flex items-center cursor-pointer space-x-3 p-3">
              <div className="w-6 h-6">📅</div>
              <span>Schedule</span>
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
            <h1 className="text-2xl font-bold">My Clients</h1>
            <Link to="/trainerDash">
              <ArrowLeft className="w-6 h-6 cursor-pointer hover:bg-gray-100 rounded-full p-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-gray-500 text-sm font-medium mb-2">Total Clients</h3>
                  <p className="text-3xl font-bold">{trainerClients.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-gray-500 text-sm font-medium mb-2">Active Sessions</h3>
                  <p className="text-3xl font-bold">
                    {trainerClients.reduce((sum, client) => sum + (client.metrics?.ongoingSessions || 0), 0)}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-gray-500 text-sm font-medium mb-2">Upcoming Sessions</h3>
                  <p className="text-3xl font-bold">
                    {trainerClients.reduce((sum, client) => sum + (client.metrics?.upcomingSessions || 0), 0)}
                  </p>
                </div>
              </div>

              {/* Client List */}
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-6">Client List</h2>
                {trainerClients.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainerClients.map((client) => (
                      <div key={client._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="relative">
                          <img
                            src={
                              client.profilePicture
                                ? client.profilePicture.includes('http') 
                                  ? client.profilePicture 
                                  : `http://localhost:3000/uploads/profilePictures/${client.profilePicture}`
                                : "/placeholder.svg"
                            }
                            alt={client.userName}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                            <h3 className="text-white font-semibold text-lg">{client.userName}</h3>
                            <p className="text-white/80 text-sm">{client.fitnessGoal}</p>
                          </div>
                        </div>

                        <div className="p-4">
                          {/* Client Details */}
                          <div className="mb-4">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Fitness Level:</span> {client.fitnessLevel || "Not specified"}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Location:</span> {client.location || "Not specified"}
                            </p>
                          </div>

                          {/* Training Metrics */}
                          <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <h4 className="font-medium text-sm mb-2">Training Summary</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Total Sessions</p>
                                <p className="font-medium">{client.metrics?.totalSessions || 0}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Completed</p>
                                <p className="font-medium">{client.metrics?.completedSessions || 0}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Last Session</p>
                                <p className="font-medium">
                                  {client.metrics?.lastSessionDate ? formatDate(client.metrics.lastSessionDate) : "None"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Upcoming</p>
                                <p className="font-medium">{client.metrics?.upcomingSessions || 0}</p>
                              </div>
                            </div>
                          </div>

                          {/* Next Session */}
                          {client.metrics?.nextSession && (
                            <div className="bg-blue-50 p-3 rounded-lg mb-4">
                              <div className="flex items-center mb-2">
                                <Calendar size={16} className="text-blue-600 mr-2" />
                                <h4 className="font-medium text-sm">Next Session</h4>
                              </div>
                              <p className="text-sm">
                                {formatDate(client.metrics.nextSession.startDate)}
                              </p>
                              <div className="flex items-center mt-1 text-sm text-blue-800">
                                <Clock size={14} className="mr-1" />
                                <span>{client.metrics.nextSession.startTime} ({client.metrics.nextSession.duration} min)</span>
                              </div>
                              {client.metrics.nextSession.message && (
                                <p className="text-sm mt-2 text-gray-700">
                                  <span className="font-medium">Note:</span> {client.metrics.nextSession.message}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Link 
                              to={`/chat/${client._id}`} 
                              className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-md text-sm"
                            >
                              <MessageCircle size={16} />
                              Message
                            </Link>
                            <Link 
                              to={`/client-profile/${client._id}`}
                              className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm"
                            >
                              <User size={16} />
                              View Profile
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <p className="text-gray-500">You don't have any clients yet.</p>
                    <button className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md">
                      Set Up Availability
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Sessions */}
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-6">Upcoming Sessions</h2>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trainerClients.flatMap(client => 
                        client.metrics?.nextSession ? [
                          <tr key={client.metrics.nextSession.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img 
                                    className="h-10 w-10 rounded-full object-cover" 
                                    src={client.profilePicture 
                                      ? client.profilePicture.includes('http')
                                        ? client.profilePicture
                                        : `http://localhost:3000/uploads/profilePictures/${client.profilePicture}`
                                      : "/placeholder.svg"} 
                                    alt={client.userName} 
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{client.userName}</div>
                                  <div className="text-sm text-gray-500">{client.fitnessGoal}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(client.metrics.nextSession.startDate)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.metrics.nextSession.startTime}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {client.metrics.nextSession.duration} min
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                client.metrics.nextSession.status === "upcoming" 
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}>
                                {client.metrics.nextSession.status.charAt(0).toUpperCase() + 
                                  client.metrics.nextSession.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link to={`/session/${client.metrics.nextSession.id}`} className="text-red-600 hover:text-red-900 mr-4">
                                View
                              </Link>
                              <Link to={`/chat/${client._id}`} className="text-blue-600 hover:text-blue-900">
                                Message
                              </Link>
                            </td>
                          </tr>
                        ] : []
                      )}
                      {trainerClients.every(client => !client.metrics?.nextSession) && (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                            No upcoming sessions scheduled
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default MyClients