"use client"

import { useEffect, useState } from "react"
import { Calendar, Star, Users, DollarSign, ChevronRight, AlertCircle, X } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { TrainerLayout } from "../TrainerPage/TrainerLayout"

const TrainerDashboard = () => {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const [trainerDetails, setTrainerDetails] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [advancedNeeded, setAdvancedNeeded] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("week")
  const [chartType, setChartType] = useState("area")
  const [selectedSession, setSelectedSession] = useState(null)
  const [missingProfileDetails, setMissingProfileDetails] = useState([])

  // Dashboard data states
  const [dashboardOverview, setDashboardOverview] = useState({
    upcomingSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    totalClients: 0,
    averageRating: 0,
  })
  const [earningsOverview, setEarningsOverview] = useState({
    totalCollections: 0,
    pendingCollections: 0,
    totalEarnings: 0,
    monthlyEarnings: [],
  })
  const [sessionTypes, setSessionTypes] = useState([])
  const [recentSessions, setRecentSessions] = useState([])
  const [bookingStats, setBookingStats] = useState({
    weeklyBookings: [],
    totalWeeklyBookings: 0,
  })

  // Loading states for each data section
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingEarnings, setLoadingEarnings] = useState(true)
  const [loadingSessionTypes, setLoadingSessionTypes] = useState(true)
  const [loadingRecentSessions, setLoadingRecentSessions] = useState(true)
  const [loadingBookingStats, setLoadingBookingStats] = useState(true)

  // Colors for charts
  const SESSION_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316"]
  const RATING_COLORS = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"]

  useEffect(() => {
    // Authentication check
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        console.log("No token found")
        navigate("/authentication")
        return false
      }

      try {
        // Decode token to check role
        const decodedToken = JSON.parse(atob(token.split(".")[1]))
        console.log("Decoded token:", decodedToken)

        // The role field might be named differently
        const userRole =
          decodedToken.role ||
          decodedToken.userRole ||
          decodedToken.userType ||
          decodedToken.type ||
          decodedToken.accountType

        console.log("Detected user role:", userRole)

        // Check if user is a trainer
        if (userRole && userRole.toLowerCase() !== "trainer") {
          console.log("Access denied: User is not a trainer")
          navigate("/authentication")
          return false
        }

        // User is a trainer, set userId and continue
        setUserId(decodedToken.id)
        return true
      } catch (error) {
        console.error("Failed to decode token", error)
        console.error("Token content:", token)
        navigate("/authentication")
        return false
      }
    }

    // Run auth check and fetch trainer details if authorized
    if (checkAuth()) {
      const token = localStorage.getItem("token")
      const decodedToken = JSON.parse(atob(token.split(".")[1]))
      fetchTrainerDetails(decodedToken.id)
    }
  }, [navigate])

  // Fetch trainer details
  const fetchTrainerDetails = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/trainer/details/${id}`)
      if (response.status === 200) {
        const trainerData = response.data.trainer
        setTrainerDetails(trainerData)
        setAdvancedNeeded(trainerData.advancedNeeded)

        // Check if required fields are empty and track missing fields
        const missingFields = []

        if (!trainerData.description) missingFields.push("description")
        if (!trainerData.price) missingFields.push("pricing")
        if (!trainerData.startDay || !trainerData.endDay) missingFields.push("availability days")
        if (!trainerData.availabilityHours) missingFields.push("availability hours")

        setMissingProfileDetails(missingFields)

        // Show profile modal if any required fields are missing
        if (missingFields.length > 0) {
          setShowProfileModal(true)
        }

        console.log("Trainer Data:", trainerData)

        // Fetch dashboard data once we have the trainer ID
        fetchDashboardData(id)
      }
    } catch (error) {
      console.error("Failed to fetch trainer details", error)
    }
  }

  // Handle "Fill Now" button click
  const handleFillNow = () => {
    navigate("/addTrainerProfile")
  }

  // Fetch all dashboard data
  const fetchDashboardData = (trainerId) => {
    fetchDashboardOverview(trainerId)
    fetchEarningsOverview(trainerId)
    fetchSessionTypes(trainerId)
    fetchRecentSessions(trainerId)
    fetchBookingStats(trainerId)
    fetchBookings(trainerId)
  }

  // Fetch dashboard overview
  const fetchDashboardOverview = async (trainerId) => {
    setLoadingOverview(true)
    try {
      // Using string ID directly as in the trainer details API
      const response = await axios.get(`http://localhost:3000/api/trainer-dashboard/${trainerId}/overview`)
      if (response.data.success) {
        setDashboardOverview(response.data.data)
      } else {
        console.error("Error in response:", response.data.message)
        setError(response.data.message)
      }
    } catch (error) {
      console.error("Error fetching dashboard overview:", error.response?.data || error.message)
      setError(error.response?.data?.message || error.message)
    } finally {
      setLoadingOverview(false)
    }
  }

  // Fetch earnings overview
  const fetchEarningsOverview = async (trainerId) => {
    setLoadingEarnings(true)
    try {
      const response = await axios.get(`http://localhost:3000/api/trainer-dashboard/${trainerId}/earnings`)
      if (response.data.success) {
        setEarningsOverview(response.data.data)
      } else {
        console.error("Error in response:", response.data.message)
      }
    } catch (error) {
      console.error("Error fetching earnings overview:", error.response?.data || error.message)
    } finally {
      setLoadingEarnings(false)
    }
  }

  // Fetch session types
  const fetchSessionTypes = async (trainerId) => {
    setLoadingSessionTypes(true)
    try {
      const response = await axios.get(`http://localhost:3000/api/trainer-dashboard/${trainerId}/session-types`)
      if (response.data.success) {
        setSessionTypes(response.data.data)
      } else {
        console.error("Error in response:", response.data.message)
      }
    } catch (error) {
      console.error("Error fetching session types:", error.response?.data || error.message)
    } finally {
      setLoadingSessionTypes(false)
    }
  }

  // Fetch recent sessions
  const fetchRecentSessions = async (trainerId) => {
    setLoadingRecentSessions(true)
    try {
      const response = await axios.get(`http://localhost:3000/api/trainer-dashboard/${trainerId}/recent-sessions`)
      if (response.data.success) {
        setRecentSessions(response.data.data)
      } else {
        console.error("Error in response:", response.data.message)
      }
    } catch (error) {
      console.error("Error fetching recent sessions:", error.response?.data || error.message)
    } finally {
      setLoadingRecentSessions(false)
    }
  }

  // Fetch booking stats
  const fetchBookingStats = async (trainerId) => {
    setLoadingBookingStats(true)
    try {
      const response = await axios.get(`http://localhost:3000/api/trainer-dashboard/${trainerId}/booking-stats`)
      if (response.data.success) {
        setBookingStats(response.data.data)
      } else {
        console.error("Error in response:", response.data.message)
      }
    } catch (error) {
      console.error("Error fetching booking stats:", error.response?.data || error.message)
    } finally {
      setLoadingBookingStats(false)
    }
  }

  // Fetch bookings (for today's sessions)
  const fetchBookings = async (trainerId) => {
    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:3000/api/availability/trainerBookings/${trainerId}`)
      if (response.status === 200) {
        // Filter bookings where isClientVerified is true
        const verifiedBookings = response.data.filter((booking) => booking.isClientVerified === true)
        setBookings(verifiedBookings)
      }
    } catch (error) {
      console.error("Error while fetching bookings:", error.response?.data || error.message)
      setError(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  // Format date to display in a readable format
  const formatDate = (dateString) => {
    const options = { weekday: "short", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString("en-US", options)
  }

  // Check if a session is today
  const isToday = (dateString) => {
    const today = new Date()
    const sessionDate = new Date(dateString)
    return today.toDateString() === sessionDate.toDateString()
  }

  // Get time remaining until session
  const getTimeRemaining = (dateString, startTime) => {
    const now = new Date()
    const sessionDate = new Date(dateString)

    // Parse the start time (assuming format like "14:00")
    const [hours, minutes] = startTime.split(":").map(Number)
    sessionDate.setHours(hours, minutes, 0, 0)

    const diffMs = sessionDate - now

    if (diffMs < 0) return "Started"

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHrs > 24) {
      const days = Math.floor(diffHrs / 24)
      return `${days} day${days > 1 ? "s" : ""} left`
    }

    if (diffHrs > 0) {
      return `${diffHrs}h ${diffMins}m left`
    }

    return `${diffMins}m left`
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Sample data for when API fails
  const sampleData = {
    dashboardOverview: {
      upcomingSessions: 5,
      completedSessions: 42,
      cancelledSessions: 3,
      totalClients: 12,
      averageRating: 4.8,
    },
    earningsOverview: {
      totalCollections: 90000,
      pendingCollections: 15000,
      totalEarnings: 105000,
      monthlyEarnings: [
        { month: "Jan", earnings: 10000, pending: 1500 },
        { month: "Feb", earnings: 15000, pending: 2000 },
        { month: "Mar", earnings: 18000, pending: 1800 },
        { month: "Apr", earnings: 25000, pending: 2000 },
        { month: "May", earnings: 30000, pending: 1500 },
        { month: "Jun", earnings: 35000, pending: 2500 },
        { month: "Jul", earnings: 42000, pending: 3000 },
        { month: "Aug", earnings: 38000, pending: 2800 },
        { month: "Sep", earnings: 45000, pending: 3500 },
        { month: "Oct", earnings: 50000, pending: 4000 },
        { month: "Nov", earnings: 48000, pending: 3800 },
        { month: "Dec", earnings: 55000, pending: 4500 },
      ],
    },
    sessionTypes: [
      { name: "Beginner", value: 45 },
      { name: "Intermediate", value: 30 },
      { name: "Advanced", value: 25 },
    ],
    bookingStats: {
      weeklyBookings: [
        { day: "Sun", bookings: 2 },
        { day: "Mon", bookings: 3 },
        { day: "Tue", bookings: 5 },
        { day: "Wed", bookings: 4 },
        { day: "Thu", bookings: 6 },
        { day: "Fri", bookings: 8 },
        { day: "Sat", bookings: 7 },
      ],
      totalWeeklyBookings: 35,
    },
  }

  // Use sample data if API fails
  const displayOverview = error ? sampleData.dashboardOverview : dashboardOverview
  const displayEarnings = loadingEarnings ? sampleData.earningsOverview : earningsOverview
  const displaySessionTypes = loadingSessionTypes ? sampleData.sessionTypes : sessionTypes
  const displayBookingStats = loadingBookingStats ? sampleData.bookingStats : bookingStats

  return (
    <TrainerLayout>
      {/* Profile Completion Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Complete Your Profile</h3>
            </div>

            <p className="text-gray-600 mb-4">
              Your profile is incomplete. Until you provide your full details, you will not be able to train clients
              effectively.
            </p>

            {missingProfileDetails.length > 0 && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Missing information:</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  {missingProfileDetails.map((field, index) => (
                    <li key={index}>{field.charAt(0).toUpperCase() + field.slice(1)}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleFillNow}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Fill Now
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div>
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Welcome back, {trainerDetails ? trainerDetails.userName : "Trainer"}!</h2>
        </div>

        {/* Dashboard Overview */}
        {activeTab === "overview" && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-red-200 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-red-600" />
                  </div>
                  <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">Active</span>
                </div>
                <h3 className="text-gray-500 text-sm mb-1">Total Clients</h3>
                <div className="text-2xl font-bold">
                  {loadingOverview ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    displayOverview.totalClients
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">
                    Upcoming
                  </span>
                </div>
                <h3 className="text-gray-500 text-sm mb-1">Upcoming Sessions</h3>
                <div className="text-2xl font-bold">
                  {loadingOverview ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    displayOverview.upcomingSessions
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-purple-200 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">
                    Earnings
                  </span>
                </div>
                <h3 className="text-gray-500 text-sm mb-1">Total Earnings</h3>
                <div className="text-2xl font-bold">
                  {loadingEarnings ? (
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    formatCurrency(displayEarnings.totalEarnings)
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-yellow-200 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">Rating</span>
                </div>
                <h3 className="text-gray-500 text-sm mb-1">Average Rating</h3>
                <div className="text-2xl font-bold">
                  {loadingOverview ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    displayOverview.averageRating
                  )}
                </div>
              </div>
            </div>

            {/* Earnings Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Earnings Overview</h3>
                  <p className="text-sm text-gray-500 mt-1">Track your revenue and financial performance</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setChartType("area")}
                      className={`px-3 py-2 text-sm ${chartType === "area" ? "bg-red-50 text-red-600" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                    >
                      Area
                    </button>
                    <button
                      onClick={() => setChartType("bar")}
                      className={`px-3 py-2 text-sm ${chartType === "bar" ? "bg-red-50 text-red-600" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                    >
                      Bar
                    </button>
                    <button
                      onClick={() => setChartType("line")}
                      className={`px-3 py-2 text-sm ${chartType === "line" ? "bg-red-50 text-red-600" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                    >
                      Line
                    </button>
                  </div>
                  <select
                    className="text-sm text-gray-500 border border-gray-200 rounded-md px-3 py-2 bg-white"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                    <option value="quarter">Last 3 months</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Collections</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {loadingEarnings ? (
                      <div className="h-8 w-24 bg-red-200/50 animate-pulse rounded"></div>
                    ) : (
                      formatCurrency(displayEarnings.totalCollections)
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Pending Collections</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {loadingEarnings ? (
                      <div className="h-8 w-24 bg-blue-200/50 animate-pulse rounded"></div>
                    ) : (
                      formatCurrency(displayEarnings.pendingCollections)
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center mb-4 gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-500 text-sm">Total Collections</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-500 text-sm">Pending Collections</span>
                </div>
              </div>

              <div className="h-80">
                {loadingEarnings ? (
                  <div className="h-full w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "area" && (
                      <AreaChart
                        data={displayEarnings.monthlyEarnings}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <defs>
                          <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          padding={{ left: 10, right: 10 }}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => (value === 0 ? "0" : `${value / 1000}k`)}
                          padding={{ top: 10, bottom: 10 }}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            const label = name === "earnings" ? "Total Collections" : "Pending Collections"
                            return [`$${value.toLocaleString()}`, label]
                          }}
                          labelFormatter={(label) => `Month: ${label}`}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="earnings"
                          stroke="#ef4444"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#totalGradient)"
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="pending"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fillOpacity={0}
                          fill="url(#pendingGradient)"
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    )}

                    {chartType === "bar" && (
                      <BarChart
                        data={displayEarnings.monthlyEarnings}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          padding={{ left: 10, right: 10 }}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => (value === 0 ? "0" : `${value / 1000}k`)}
                          padding={{ top: 10, bottom: 10 }}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            const label = name === "earnings" ? "Total Collections" : "Pending Collections"
                            return [`$${value.toLocaleString()}`, label]
                          }}
                          labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Bar dataKey="earnings" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pending" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}

                    {chartType === "line" && (
                      <LineChart
                        data={displayEarnings.monthlyEarnings}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          padding={{ left: 10, right: 10 }}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => (value === 0 ? "0" : `${value / 1000}k`)}
                          padding={{ top: 10, bottom: 10 }}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            const label = name === "earnings" ? "Total Collections" : "Pending Collections"
                            return [`$${value.toLocaleString()}`, label]
                          }}
                          labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="earnings"
                          stroke="#ef4444"
                          strokeWidth={3}
                          dot={{ fill: "#ef4444", r: 4 }}
                          activeDot={{ r: 6, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="pending"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: "#3b82f6", r: 4 }}
                          activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Booking Stats & Upcoming Sessions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Booking Stats */}
              <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Bookings</h3>
                {loadingBookingStats ? (
                  <div className="h-60 w-full bg-gray-100 animate-pulse rounded-lg"></div>
                ) : (
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={displayBookingStats.weeklyBookings}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="bookingGrowth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="bookings"
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#bookingGrowth)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Total Bookings</div>
                    <div className="text-xl font-bold">
                      {loadingBookingStats ? (
                        <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        displayBookingStats.totalWeeklyBookings
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Today's Sessions</h3>
                    <p className="text-sm text-gray-500 mt-1">Your upcoming training appointments</p>
                  </div>
                  <Link to="/trainerBooking">
                    <button className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
                      View All <ChevronRight size={16} />
                    </button>
                  </Link>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-500">Error: {error}</p>
                  </div>
                ) : bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.slice(0, 3).map((session, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 hover:border-red-200"
                      >
                        <div className="relative">
                          <img
                            src={session.clientId?.profilePicture || "/placeholder.svg?height=48&width=48"}
                            alt="Client"
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                          />
                          {isToday(session.startDate) && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{session.clientId?.userName || "Client"}</h4>
                            <div className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                              {getTimeRemaining(session.startDate, session.startTime)}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {formatDate(session.startDate)} • {session.startTime} • {session.duration} min
                          </div>
                        </div>

                        <button className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">
                          Join
                        </button>
                      </div>
                    ))}

                    {bookings.length > 3 && (
                      <div className="text-center pt-2">
                        <button
                          onClick={() => setActiveTab("sessions")}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          +{bookings.length - 3} more sessions
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No sessions scheduled for today</p>
                    <button className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">
                      Schedule New Session
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Client Ratings & Session Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Session Types */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Session Types</h3>
                {loadingSessionTypes ? (
                  <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={displaySessionTypes}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {displaySessionTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={SESSION_COLORS[index % SESSION_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}`, "Sessions"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {!loadingSessionTypes &&
                    displaySessionTypes.map((type, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: SESSION_COLORS[index % SESSION_COLORS.length] }}
                        ></div>
                        <span className="text-sm text-gray-600">
                          {type.name}: {type.value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Sessions</h3>
                {loadingRecentSessions ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-5 w-24 bg-gray-200 animate-pulse rounded mb-2"></div>
                          <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {recentSessions.map((session, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                      >
                        <div className="relative">
                          <img
                            src={session.clientPhoto || "/placeholder.svg?height=48&width=48"}
                            alt={session.clientName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{session.clientName}</h4>
                            <div
                              className={`text-xs font-medium px-2 py-1 rounded-full ${
                                session.status === "completed"
                                  ? "bg-green-50 text-green-600"
                                  : session.status === "cancelled"
                                    ? "bg-red-50 text-red-600"
                                    : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {formatDate(session.date)} • {session.startTime} • {session.duration} min
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </TrainerLayout>
  )
}

export default TrainerDashboard
