"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import {
  Calendar,
  User,
  CheckCircle,
  XCircle,
  PlayCircle,
  Filter,
  Clock,
  CalendarDays,
  Timer,
  Award,
  List,
  Search,
  ChevronRight,
  BarChart,
} from "lucide-react"
import TrainerLayout from "./TrainerLayout"

const TrainerBooking = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [trainerId, setTrainerId] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
  })
  const [filter, setFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Decode token and get trainerId
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

  // Fetch trainer bookings
  useEffect(() => {
    if (!trainerId) return

    const fetchAllBookings = async () => {
      try {
        setLoading(true)

        // Fetch all bookings with their status from a single endpoint
        const response = await axios.get(`http://localhost:3000/api/availability/trainerBookings/${trainerId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        let allBookings = []

        if (response.data && Array.isArray(response.data)) {
          // Include all bookings regardless of verification status
          allBookings = response.data

          // Sort bookings by date (newest first)
          allBookings.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))

          // Set the first booking as selected if there are bookings
          if (allBookings.length > 0) {
            setSelectedBooking(allBookings[0])
          }

          // Calculate stats
          const total = allBookings.length
          const upcoming = allBookings.filter((booking) => booking.status === "upcoming").length
          const ongoing = allBookings.filter((booking) => booking.status === "ongoing").length
          const completed = allBookings.filter((booking) => booking.status === "completed").length
          const cancelled = allBookings.filter((booking) => booking.status === "cancelled").length

          setStats({
            total,
            upcoming,
            ongoing,
            completed,
            cancelled,
          })

          setBookings(allBookings)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching bookings:", err)
        setError(err.response?.data?.message || "Failed to fetch bookings")
        setLoading(false)
      }
    }

    fetchAllBookings()
  }, [trainerId])

  // Format date to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Format time to AM/PM
  const formatTime = (timeString) => {
    if (!timeString) return "N/A"
    const [hour, minute] = timeString.split(":")
    const hourNum = Number.parseInt(hour)
    const amPm = hourNum >= 12 ? "PM" : "AM"
    const hour12 = hourNum % 12 || 12
    return `${hour12}:${minute} ${amPm}`
  }

  // Filter bookings based on selected filter and search query
  const filteredBookings = bookings
    .filter((booking) => {
      if (filter === "all") return true
      return booking.status === filter
    })
    .filter((booking) => {
      if (!searchQuery) return true
      const clientName = booking.clientId?.userName?.toLowerCase() || ""
      return clientName.includes(searchQuery.toLowerCase())
    })

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setIsFilterMenuOpen(false)
  }

  // Toggle filter menu
  const toggleFilterMenu = () => {
    setIsFilterMenuOpen(!isFilterMenuOpen)
  }

  // Handle booking selection
  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking)
  }

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "upcoming":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200 font-medium">
            <Calendar className="w-3 h-3 mr-1" /> Upcoming
          </span>
        )
      case "ongoing":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200 font-medium">
            <PlayCircle className="w-3 h-3 mr-1" /> Ongoing
          </span>
        )
      case "completed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 border border-purple-200 font-medium">
            <CheckCircle className="w-3 h-3 mr-1" /> Completed
          </span>
        )
      
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 border border-gray-200 font-medium">
            Unknown
          </span>
        )
    }
  }

  // Get status color class
  const getStatusColorClass = (status) => {
    switch (status) {
      case "upcoming":
        return "border-blue-200 hover:bg-blue-50"
      case "ongoing":
        return "border-green-200 hover:bg-green-50"
      case "completed":
        return "border-purple-200 hover:bg-purple-50"
      case "cancelled":
        return "border-red-200 hover:bg-red-50"
      default:
        return "border-gray-200 hover:bg-gray-50"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#CE0000]"></div>
          <p className="mt-4 text-gray-600">Loading your sessions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto">
          <XCircle className="h-12 w-12 text-[#CE0000] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#CE0000] text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <TrainerLayout className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center">
              <div className="relative group mr-3">
                <div className="absolute inset-0 bg-[#CE0000] opacity-10 rounded-lg group-hover:opacity-20 transition-opacity"></div>
                <div className="relative p-2 rounded-lg">
                  <BarChart className="h-6 w-6 text-[#CE0000]" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Session Dashboard</h1>
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={toggleFilterMenu}
                className="group relative px-4 py-2 bg-white border border-gray-200 rounded-lg flex items-center hover:border-[#CE0000] transition-all duration-200 shadow-sm"
              >
                <div className="relative z-10">
                  <Filter className="w-4 h-4 mr-2 text-gray-500 group-hover:text-[#CE0000]" />
                </div>
                <span className="relative z-10 text-gray-700 group-hover:text-[#CE0000]">
                  {filter === "all"
                    ? "All Sessions"
                    : filter === "upcoming"
                      ? "Upcoming Sessions"
                      : filter === "ongoing"
                        ? "Ongoing Sessions"
                        : filter === "completed"
                          ? "Completed Sessions"
                          : "Cancelled Sessions"}
                </span>
                {/* Hexagonal background that appears on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gray-100 transition-opacity rounded-lg"></div>
              </button>

              {isFilterMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl z-10 overflow-hidden border border-gray-100 transition-all duration-200 animate-in fade-in slide-in-from-top-5">
                  <button
                    onClick={() => handleFilterChange("all")}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center border-b border-gray-100 ${filter === "all" ? "bg-gray-50 font-medium" : ""}`}
                  >
                    <Filter className={`w-4 h-4 mr-2 ${filter === "all" ? "text-gray-800" : "text-gray-600"}`} />
                    <span className="text-gray-800">All Sessions</span>
                    {filter === "all" && (
                      <span className="ml-auto text-xs font-medium bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                        {stats.total}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleFilterChange("upcoming")}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 flex items-center border-b border-gray-100 ${filter === "upcoming" ? "bg-blue-50 font-medium" : ""}`}
                  >
                    <Calendar className={`w-4 h-4 mr-2 ${filter === "upcoming" ? "text-blue-800" : "text-blue-600"}`} />
                    <span className="text-gray-800">Upcoming Sessions</span>
                    {filter === "upcoming" ? (
                      <span className="ml-auto text-xs font-medium bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                        {stats.upcoming}
                      </span>
                    ) : (
                      <span className="ml-auto text-xs text-blue-600">{stats.upcoming}</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleFilterChange("ongoing")}
                    className={`w-full px-4 py-3 text-left hover:bg-green-50 transition-colors duration-150 flex items-center border-b border-gray-100 ${filter === "ongoing" ? "bg-green-50 font-medium" : ""}`}
                  >
                    <PlayCircle
                      className={`w-4 h-4 mr-2 ${filter === "ongoing" ? "text-green-800" : "text-green-600"}`}
                    />
                    <span className="text-gray-800">Ongoing Sessions</span>
                    {filter === "ongoing" ? (
                      <span className="ml-auto text-xs font-medium bg-green-200 text-green-800 px-2 py-1 rounded-full">
                        {stats.ongoing}
                      </span>
                    ) : (
                      <span className="ml-auto text-xs text-green-600">{stats.ongoing}</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleFilterChange("completed")}
                    className={`w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors duration-150 flex items-center border-b border-gray-100 ${filter === "completed" ? "bg-purple-50 font-medium" : ""}`}
                  >
                    <CheckCircle
                      className={`w-4 h-4 mr-2 ${filter === "completed" ? "text-purple-800" : "text-purple-600"}`}
                    />
                    <span className="text-gray-800">Completed Sessions</span>
                    {filter === "completed" ? (
                      <span className="ml-auto text-xs font-medium bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                        {stats.completed}
                      </span>
                    ) : (
                      <span className="ml-auto text-xs text-purple-600">{stats.completed}</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleFilterChange("cancelled")}
                    className={`w-full px-4 py-3 text-left hover:bg-red-50 transition-colors duration-150 flex items-center ${filter === "cancelled" ? "bg-red-50 font-medium" : ""}`}
                  >
                    <XCircle className={`w-4 h-4 mr-2 ${filter === "cancelled" ? "text-red-800" : "text-red-600"}`} />
                    <span className="text-gray-800">Cancelled Sessions</span>
                    {filter === "cancelled" ? (
                      <span className="ml-auto text-xs font-medium bg-red-200 text-red-800 px-2 py-1 rounded-full">
                        {stats.cancelled}
                      </span>
                    ) : (
                      <span className="ml-auto text-xs text-red-600">{stats.cancelled}</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center relative group overflow-hidden border border-gray-200 hover:border-[#CE0000] transition-colors duration-200">
              <div className="absolute inset-0 bg-[#CE0000] opacity-0 group-hover:opacity-5 transition-opacity"></div>
              <div className="relative z-10">
                <div className="text-gray-500 text-sm font-medium mb-1">Total</div>
                <div className="text-3xl font-bold text-gray-800 group-hover:text-[#CE0000] transition-colors">
                  {stats.total}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center relative group overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors duration-200">
              <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
              <div className="relative z-10">
                <div className="text-blue-500 text-sm font-medium mb-1">Upcoming</div>
                <div className="text-3xl font-bold text-gray-800 group-hover:text-blue-500 transition-colors">
                  {stats.upcoming}
                </div>
                <div className="text-xs text-blue-400 mt-1">
                  {stats.total > 0 ? Math.round((stats.upcoming / stats.total) * 100) : 0}%
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center relative group overflow-hidden border border-gray-200 hover:border-green-400 transition-colors duration-200">
              <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
              <div className="relative z-10">
                <div className="text-green-500 text-sm font-medium mb-1">Ongoing</div>
                <div className="text-3xl font-bold text-gray-800 group-hover:text-green-500 transition-colors">
                  {stats.ongoing}
                </div>
                <div className="text-xs text-green-400 mt-1">
                  {stats.total > 0 ? Math.round((stats.ongoing / stats.total) * 100) : 0}%
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center relative group overflow-hidden border border-gray-200 hover:border-purple-400 transition-colors duration-200">
              <div className="absolute inset-0 bg-purple-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
              <div className="relative z-10">
                <div className="text-purple-500 text-sm font-medium mb-1">Completed</div>
                <div className="text-3xl font-bold text-gray-800 group-hover:text-purple-500 transition-colors">
                  {stats.completed}
                </div>
                <div className="text-xs text-purple-400 mt-1">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </div>
              </div>
            </div>
        
          </div>
        </div>

        {/* Main Content - Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Session List */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CE0000] focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-[600px] p-2">
                {filteredBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="bg-gray-100 p-6 rounded-full mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      No {filter !== "all" ? filter : ""} sessions found
                    </h3>
                    <p className="text-gray-600 max-w-md mb-6 text-sm">
                      {filter === "all"
                        ? "You don't have any sessions yet. Once clients book with you, they'll appear here."
                        : filter === "upcoming"
                          ? "You don't have any upcoming sessions. Check back later or view all sessions."
                          : filter === "ongoing"
                            ? "You don't have any ongoing sessions right now."
                            : filter === "completed"
                              ? "You don't have any completed sessions yet."
                              : "You don't have any cancelled sessions."}
                    </p>
                    {filter !== "all" && (
                      <button
                        onClick={() => handleFilterChange("all")}
                        className="group relative px-4 py-2 bg-white border border-gray-200 rounded-lg flex items-center hover:border-[#CE0000] transition-all duration-200 shadow-sm"
                      >
                        <div className="relative z-10">
                          <Filter className="w-4 h-4 mr-2 text-gray-500 group-hover:text-[#CE0000]" />
                        </div>
                        <span className="relative z-10 text-gray-700 group-hover:text-[#CE0000]">
                          View All Sessions
                        </span>
                        {/* Hexagonal background that appears on hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gray-100 transition-opacity rounded-lg"></div>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 group ${
                          selectedBooking?._id === booking._id
                            ? "bg-red-50 border-[#CE0000]"
                            : `border-gray-200 ${getStatusColorClass(booking.status)}`
                        }`}
                        onClick={() => handleSelectBooking(booking)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-800 group-hover:text-[#CE0000] transition-colors">
                            {booking.clientId?.userName || "Unknown Client"}
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          {formatDate(booking.startDate)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          {formatTime(booking.startTime)} • {booking.duration} min
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-xs text-gray-500">{booking.message ? "Has notes" : "No notes"}</div>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#CE0000] transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Session Details */}
          <div className="w-full lg:w-2/3">
            {selectedBooking ? (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                {/* Client Info */}
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                    <div className="relative group mr-2">
                      <div className="absolute inset-0 bg-[#CE0000] opacity-10 rounded-lg group-hover:opacity-20 transition-opacity"></div>
                      <div className="relative p-1 rounded-lg">
                        <User className="h-5 w-5 text-[#CE0000]" />
                      </div>
                    </div>
                    CLIENT INFORMATION
                  </h2>
                  <div className="flex items-center">
                    {selectedBooking?.clientId?.profilePicture ? (
                      <img
                        src={`${selectedBooking.clientId.profilePicture}`}
                        alt="Client"
                        className="h-16 w-16 rounded-full mr-6 object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mr-6 border-2 border-white shadow-md">
                        <User className="h-8 w-8 text-[#CE0000]" />
                      </div>
                    )}
                    <div>
                      <div className="text-xl font-semibold text-gray-800">
                        {selectedBooking?.clientId?.userName || "Unknown Client"}
                      </div>
                      <div className="text-gray-600">{selectedBooking?.clientId?.email || "No email"}</div>
                      {selectedBooking?.clientId?.fitnessGoal && (
                        <div className="text-sm text-gray-500 mt-1">Goal: {selectedBooking.clientId.fitnessGoal}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Session Details */}
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                    <div className="relative group mr-2">
                      <div className="absolute inset-0 bg-[#CE0000] opacity-10 rounded-lg group-hover:opacity-20 transition-opacity"></div>
                      <div className="relative p-1 rounded-lg">
                        <CalendarDays className="h-5 w-5 text-[#CE0000]" />
                      </div>
                    </div>
                    SESSION DETAILS
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4 flex items-start group hover:bg-red-50 transition-colors duration-200 border border-gray-200 hover:border-[#CE0000]">
                      <div className="bg-red-100 p-3 rounded-lg mr-4 group-hover:bg-red-200 transition-colors">
                        <Calendar className="h-6 w-6 text-[#CE0000]" />
                      </div>
                      <div>
                        <div className="text-gray-600 text-sm font-medium">Date</div>
                        <div className="font-medium text-gray-800">{formatDate(selectedBooking?.startDate)}</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 flex items-start group hover:bg-red-50 transition-colors duration-200 border border-gray-200 hover:border-[#CE0000]">
                      <div className="bg-red-100 p-3 rounded-lg mr-4 group-hover:bg-red-200 transition-colors">
                        <Clock className="h-6 w-6 text-[#CE0000]" />
                      </div>
                      <div>
                        <div className="text-gray-600 text-sm font-medium">Time</div>
                        <div className="font-medium text-gray-800">{formatTime(selectedBooking?.startTime)}</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 flex items-start group hover:bg-red-50 transition-colors duration-200 border border-gray-200 hover:border-[#CE0000]">
                      <div className="bg-red-100 p-3 rounded-lg mr-4 group-hover:bg-red-200 transition-colors">
                        <Timer className="h-6 w-6 text-[#CE0000]" />
                      </div>
                      <div>
                        <div className="text-gray-600 text-sm font-medium">Duration</div>
                        <div className="font-medium text-gray-800">{selectedBooking?.duration} minutes</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 flex items-start group hover:bg-red-50 transition-colors duration-200 border border-gray-200 hover:border-[#CE0000]">
                      <div className="bg-red-100 p-3 rounded-lg mr-4 group-hover:bg-red-200 transition-colors">
                        <Award className="h-6 w-6 text-[#CE0000]" />
                      </div>
                      <div>
                        <div className="text-gray-600 text-sm font-medium">Status</div>
                        <div className="font-medium">{getStatusBadge(selectedBooking?.status)}</div>
                      </div>
                    </div>
                  </div>
                  {selectedBooking?.status === "ongoing" && (
                    <div className="mt-6">
                      <button
                        onClick={() => window.open('/chat')}
                        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors duration-200 shadow-md"
                      >
                        <PlayCircle className="w-5 h-5 mr-2" />
                        Join Session Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Message/Notes */}
                {selectedBooking?.message && (
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                      <div className="relative group mr-2">
                        <div className="absolute inset-0 bg-[#CE0000] opacity-10 rounded-lg group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative p-1 rounded-lg">
                          <List className="h-5 w-5 text-[#CE0000]" />
                        </div>
                      </div>
                      SESSION NOTES
                    </h2>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#CE0000] transition-colors duration-200">
                      <p className="text-gray-700">{selectedBooking.message}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center text-center h-full border border-gray-100">
                <div className="relative group mb-4">
                  <div className="absolute inset-0 bg-[#CE0000] opacity-5 rounded-full group-hover:opacity-10 transition-opacity"></div>
                  <div className="relative p-6 bg-gray-100 rounded-full">
                    <Calendar className="h-10 w-10 text-[#CE0000]" />
                  </div>
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">No Session Selected</h3>
                <p className="text-gray-600 max-w-md">Select a session from the list to view its details.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {filter === "all" ? "all" : filter} sessions • Last updated {new Date().toLocaleTimeString()}
        </div>
      </div>
    </TrainerLayout>
  )
}

export default TrainerBooking

