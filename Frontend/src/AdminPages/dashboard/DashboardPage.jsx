"use client"

import { useState, useEffect } from "react"
import { Users, CreditCard, Calendar, TrendingUp, Check, X, MoreHorizontal, UserCheck, DollarSign, ChevronRight, Star, MessageSquare, Search } from 'lucide-react'
import axios from "axios"
import AdminLayout from "../component/AdminSidebar"
import { useNavigate } from "react-router-dom"

// Exercise Preferences Component
function ExercisePreferences() {
  const [exerciseGoals, setExerciseGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExerciseGoals = async () => {
      setLoading(true);
      try {
        // Use the correct endpoint based on your router configuration
        const response = await axios.get("http://localhost:3000/api/exercises");
        
        if (response.data.success) {
          // Group exercises by exerciseGoal
          const exercises = response.data.data;
          const goalCounts = {};
          
          // Count exercises by goal
          exercises.forEach(exercise => {
            if (exercise.exerciseGoal) {
              if (!goalCounts[exercise.exerciseGoal]) {
                goalCounts[exercise.exerciseGoal] = 0;
              }
              goalCounts[exercise.exerciseGoal]++;
            }
          });
          
          // Convert to array and calculate percentages
          const totalExercises = exercises.length;
          const goalsArray = Object.entries(goalCounts).map(([name, count]) => {
            return {
              name,
              users: count,
              percentage: Math.round((count / totalExercises) * 100) || 0
            };
          });
          
          // Sort by count (descending)
          goalsArray.sort((a, b) => b.users - a.users);
          
          setExerciseGoals(goalsArray);
        } else {
          throw new Error(response.data.message || "Failed to fetch exercise data");
        }
      } catch (error) {
        console.error("Error fetching exercise goals:", error);
        setError("Failed to load exercise preferences data");
        
        // Fallback to sample data if API fails
        setExerciseGoals([
          { name: "Strength Training", users: 1245, percentage: 42 },
          { name: "Cardio", users: 876, percentage: 30 },
          { name: "Yoga", users: 543, percentage: 18 },
          { name: "Pilates", users: 298, percentage: 10 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchExerciseGoals();
  }, []);

  return (
    <div className="rounded-lg border bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
      <div className="border-b p-5 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Exercise Preferences</h3>
        <p className="text-sm text-gray-500">Most popular exercise types</p>
      </div>
      <div className="p-5 space-y-6">
        {loading ? (
          // Loading state
          [...Array(4)].map((_, index) => (
            <div key={index} className="space-y-2 animate-pulse">
              <div className="flex justify-between">
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                <div className="h-5 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200"></div>
              </div>
              <div className="text-right">
                <div className="h-4 w-16 bg-gray-200 rounded ml-auto"></div>
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center justify-center py-6">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-900">Error loading data</h4>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#CE0000] text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : exerciseGoals.length > 0 ? (
          // Exercise goals data
          exerciseGoals.map((goal, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">{goal.name}</span>
                <span className="text-gray-600">{goal.users} users</span>
              </div>
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${goal.percentage}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#CE0000]"
                  ></div>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">{goal.percentage}% of users</div>
            </div>
          ))
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center py-10">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900">No exercise data</h4>
            <p className="text-sm text-gray-500 mt-1">There are no exercise preferences to display yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeTrainers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    userGrowth: 0,
    trainerGrowth: 0,
    bookingGrowth: 0,
    revenueGrowth: 0,
  })
  const [pendingTrainers, setPendingTrainers] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [recentSessions, setRecentSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activityError, setActivityError] = useState(null)
  const [sessionError, setSessionError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [activityType, setActivityType] = useState("all")

  // Transaction state
  const [transactions, setTransactions] = useState([])
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  const [transactionError, setTransactionError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 5,
    pages: 1,
  })

  // Format currency
  const formatCurrency = (amount) => {
    return `$${Number(amount || 0).toFixed(2)}`
  }

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "N/A"

    const now = new Date()
    const date = new Date(dateString)
    const seconds = Math.floor((now - date) / 1000)

    if (seconds < 60) return `${seconds} seconds ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`

    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`

    const months = Math.floor(days / 30)
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`

    const years = Math.floor(months / 12)
    return `${years} year${years !== 1 ? "s" : ""} ago`
  }

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "paid":
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      case "refunded":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get session type icon
  const getSessionTypeIcon = (type) => {
    if (type.toLowerCase().includes("video")) {
      return "📹"
    } else if (type.toLowerCase().includes("in-person")) {
      return "👥"
    } else {
      return "📅"
    }
  }

  // Fetch dashboard metrics
  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      setLoading(true)
      try {
        // 1. Get client/user data
        const clientResponse = await axios.get("http://localhost:3000/api/client/stats")
        const userData = clientResponse.data.success ? clientResponse.data.data : {}

        // 2. Get trainer data
        const trainerResponse = await axios.get("http://localhost:3000/api/trainer/getVerifiedTrainers")
        const trainerData = trainerResponse.data.success ? trainerResponse.data.data : []

        // 3. Get booking data
        const bookingResponse = await axios.get("http://localhost:3000/api/availability/admin/bookings")
        const bookingData = bookingResponse.data.stats || {}

        // 4. Get revenue data
        const paymentResponse = await axios.get("http://localhost:3000/api/payment/stats")
        const revenueData = paymentResponse.data || {}

        // Calculate active trainers
        const activeTrainers = trainerData
          .filter((trainer) => trainer.user?.isOtpVerified === true)
          .filter((trainer) => trainer.status === "active").length

        // Set all metrics
        setMetrics({
          totalUsers: userData.totalUsers || 0,
          activeTrainers: activeTrainers,
          totalBookings: bookingData.totalBookings || 0,
          totalRevenue: revenueData.totalRevenue || 0,
          userGrowth: userData.userGrowth || 12, // Use API value or fallback
          trainerGrowth: 8, // Fallback value if not available from API
          bookingGrowth: bookingData.bookingGrowth || 18, // Use API value or fallback
          revenueGrowth: revenueData.revenueGrowth || 14, // Use API value or fallback
        })

        setLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard metrics:", error)
        setError("Failed to load dashboard data. Please try again later.")

        // Fall back to default data if API fails
        setMetrics({
          totalUsers: 1248,
          activeTrainers: 324,
          totalBookings: 3782,
          totalRevenue: 24389,
          userGrowth: 12,
          trainerGrowth: 8,
          bookingGrowth: 18,
          revenueGrowth: 14,
        })

        setLoading(false)
      }
    }

    fetchDashboardMetrics()
  }, [])

  // Fetch pending trainer verification requests
  useEffect(() => {
    const fetchPendingRequests = async () => {
      setRequestsLoading(true)
      try {
        const response = await axios.get("http://localhost:3000/api/trainer/getAllTrainers")

        // Filter for pending trainers if needed (this depends on your API)
        // If the API returns all trainers, we need to filter for pending ones
        // If it only returns pending trainers, we can skip this step
        const formattedTrainers = response.data.data
          .map((trainer) => ({
            _id: trainer._id,
            user: trainer.user || {},
            userName: trainer.user?.userName || "Unknown Trainer",
            specialty: trainer.specialty || "Not specified",
            experience: trainer.yearsOfExperience ? `${trainer.yearsOfExperience} years` : "Not specified",
            bibliography: trainer.bibliography || "No bibliography provided",
            resume: trainer.resume,
            submittedDate: trainer.createdAt || new Date().toISOString(),
            status: "pending", // Default status for this view
            documentsCount: trainer.resume ? 1 : 0, // Basic count of documents
            bio: trainer.bio || "No biography provided.",
          }))
          // Show at most 3 items for the dashboard widget
          .slice(0, 3)

        setPendingTrainers(formattedTrainers)
        setRequestsLoading(false)
      } catch (error) {
        console.error("Error fetching pending trainers:", error)
        // Set empty array if API fails
        setPendingTrainers([])
        setRequestsLoading(false)
      }
    }

    fetchPendingRequests()
  }, [])

  // Fetch recent activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      setActivitiesLoading(true)
      try {
        // Use the new activity endpoint we created
        const response = await axios.get("http://localhost:3000/api/admin/activity/recent", {
          params: {
            limit: 10, // Fetch 10 recent activities
            responseLimit: 5, // Limit to 5 in the response
          },
        })

        if (response.data.success) {
          setRecentActivities(response.data.data)
        } else {
          throw new Error("Failed to fetch recent activities")
        }

        setActivitiesLoading(false)
      } catch (error) {
        console.error("Error fetching recent activities:", error)
        setActivityError("Failed to load recent activities")
        setActivitiesLoading(false)
      }
    }

    fetchRecentActivities()
  }, [])

  // Fetch recent sessions
  useEffect(() => {
    const fetchRecentSessions = async () => {
      setSessionsLoading(true)
      try {
        const response = await axios.get("http://localhost:3000/api/admin/recentSessions")

        if (response.data.success) {
          setRecentSessions(response.data.data)
        } else {
          throw new Error(response.data.message || "Failed to fetch recent sessions")
        }

        setSessionsLoading(false)
      } catch (error) {
        console.error("Error fetching recent sessions:", error)
        setSessionError("Failed to load recent sessions")
        setSessionsLoading(false)

        // Fallback to empty array
        setRecentSessions([])
      }
    }

    fetchRecentSessions()
  }, [])

  // Fetch recent transactions
  const fetchRecentTransactions = async () => {
    setTransactionsLoading(true)
    try {
      const response = await axios.get("http://localhost:3000/api/admin/recentTransaction", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm || undefined,
        },
      })

      if (response.data.success) {
        setTransactions(response.data.data.transactions)
        setPagination(response.data.data.pagination)
      } else {
        throw new Error(response.data.message || "Failed to fetch transactions")
      }

      setTransactionsLoading(false)
    } catch (error) {
      console.error("Error fetching recent transactions:", error)
      setTransactionError("Failed to load recent transactions")
      setTransactionsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentTransactions()
  }, [pagination.page, pagination.limit, searchTerm])

  // Handle page change for transactions
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage })
    }
  }

  // Handle search for transactions
  const handleSearch = (e) => {
    e.preventDefault()
    // Reset to page 1 when searching
    setPagination({ ...pagination, page: 1 })
    fetchRecentTransactions()
  }

  // Handle trainer confirmation
  const handleApprove = async (userId, trainerId) => {
    if (!window.confirm("Are you sure you want to confirm this trainer?")) {
      return
    }

    setActionLoading(true)
    try {
      const response = await axios.patch(`http://localhost:3000/api/trainer/updateOtpVerification/${userId}`, {
        isVerified: true,
      })

      if (response.data.success) {
        alert("Trainer confirmed successfully!")
        // Update trainer list by removing the approved trainer
        setPendingTrainers(pendingTrainers.filter((trainer) => trainer._id !== trainerId))
      } else {
        alert("Failed to confirm trainer")
      }
    } catch (error) {
      console.error("Error confirming trainer:", error)
      alert("An error occurred while confirming the trainer")
    } finally {
      setActionLoading(false)
    }
  }

  // Handle trainer deletion
  const handleReject = async (trainerId) => {
    if (!window.confirm("Are you sure you want to decline this trainer? This action cannot be undone.")) {
      return
    }

    setActionLoading(true)
    try {
      const response = await axios.delete(`http://localhost:3000/api/trainer/deleteTrainer/${trainerId}`)

      if (response.data.success) {
        alert("Trainer declined successfully.")
        // Remove the declined trainer from the list
        setPendingTrainers(pendingTrainers.filter((trainer) => trainer._id !== trainerId))
      } else {
        alert("Failed to decline trainer")
      }
    } catch (error) {
      console.error("Error declining trainer:", error)
      alert("An error occurred while declining the trainer")
    } finally {
      setActionLoading(false)
    }
  }

  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case "booking":
        return <Calendar className="h-5 w-5 text-blue-500" />
      case "user_registration":
        return <Users className="h-5 w-5 text-gray-500" />
      case "trainer_registration":
        return <Users className="h-5 w-5 text-[#CE0000]" />
      case "rating":
        return <Star className="h-5 w-5 text-yellow-500" />
      case "payment":
        return <CreditCard className="h-5 w-5 text-purple-500" />
      case "notification":
        return <MessageSquare className="h-5 w-5 text-green-500" />
      default:
        return <MoreHorizontal className="h-5 w-5 text-gray-500" />
    }
  }

  // Filter activities based on selected type
  const filteredActivities =
    activityType === "all" ? recentActivities : recentActivities.filter((activity) => activity.type === activityType)

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Overview of your TrainTact platform</p>
      </div>

      {loading ? (
        // Loading state with skeleton cards
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="flex animate-pulse justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-7 w-20 bg-gray-200 rounded"></div>
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Error state
        <div className="rounded-lg border bg-red-50 p-6 shadow-sm">
          <div className="flex items-center text-red-600 mb-2">
            <X className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Error</h3>
          </div>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : (
        // Dashboard cards with data
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 - Total Users */}
          <div className="rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-row items-center justify-between">
              <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
              <Users className="h-5 w-5 text-[#CE0000]" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalUsers)}</div>
              <p className="text-xs font-medium text-green-600">+{metrics.userGrowth}% from last month</p>
            </div>
          </div>

          {/* Card 2 - Active Trainers */}
          <div className="rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-row items-center justify-between">
              <h3 className="text-sm font-medium text-gray-600">Active Trainers</h3>
              <UserCheck className="h-5 w-5 text-[#CE0000]" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900">{formatNumber(metrics.activeTrainers)}</div>
              <p className="text-xs font-medium text-green-600">+{metrics.trainerGrowth}% from last month</p>
            </div>
          </div>

          {/* Card 3 - Total Bookings */}
          <div className="rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-row items-center justify-between">
              <h3 className="text-sm font-medium text-gray-600">Total Bookings</h3>
              <Calendar className="h-5 w-5 text-[#CE0000]" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalBookings)}</div>
              <p className="text-xs font-medium text-green-600">+{metrics.bookingGrowth}% from last month</p>
            </div>
          </div>

          {/* Card 4 - Revenue */}
          <div className="rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-row items-center justify-between">
              <h3 className="text-sm font-medium text-gray-600">Revenue</h3>
              <DollarSign className="h-5 w-5 text-[#CE0000]" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</div>
              <p className="text-xs font-medium text-green-600">+{metrics.revenueGrowth}% from last month</p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Verification Requests Section */}
      <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="rounded-lg border bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
          <div className="border-b p-5 flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pending Verification</h3>
              <p className="text-sm text-gray-500">Trainer verification requests</p>
            </div>
            <div className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm font-medium shadow-sm">
              {pendingTrainers.length} pending
            </div>
          </div>

          <div className="p-5">
            {requestsLoading ? (
              // Loading state for requests
              <div className="flex flex-col items-center justify-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#CE0000] mb-3"></div>
                <p className="text-gray-500">Loading trainer requests...</p>
              </div>
            ) : pendingTrainers.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {pendingTrainers.map((trainer) => (
                  <div
                    key={trainer._id}
                    className="rounded-lg border p-4 hover:shadow-sm transition-all duration-200 bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          {trainer.user?.profilePicture ? (
                            <img
                              src={trainer.user.profilePicture || "/placeholder.svg"}
                              alt={trainer.userName}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{trainer.userName}</h4>
                          <div className="flex items-center text-sm text-gray-600">
                            <span>
                              {trainer.specialty} • {trainer.experience}
                            </span>
                          </div>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <div className="flex items-center">
                              <span className="mr-2">
                                {trainer.documentsCount || 0} document{trainer.documentsCount !== 1 ? "s" : ""}{" "}
                                submitted
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 items-end">
                        <span className="text-sm text-gray-500">Submitted: {formatDate(trainer.submittedDate)}</span>
                        <div className="flex space-x-2">
                          <button
                            className="rounded-md border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 flex items-center transition-colors duration-200"
                            onClick={() => handleApprove(trainer.user._id, trainer._id)}
                            disabled={actionLoading}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </button>
                          <button
                            className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center transition-colors duration-200"
                            onClick={() => handleReject(trainer._id)}
                            disabled={actionLoading}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Empty state
              <div className="flex flex-col items-center justify-center py-10">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">No pending requests</h4>
                <p className="text-sm text-gray-500 mt-1">All trainer verification requests have been processed</p>
              </div>
            )}

            <div className="mt-5 flex justify-center border-t pt-4">
              <button
                className="text-sm text-gray-600 hover:text-[#CE0000] font-medium transition-colors duration-200 flex items-center"
                onClick={() => navigate("/request")}
              >
                View All Requests
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="rounded-lg border bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
          <div className="border-b p-5 flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-500">Latest actions on the platform</p>
            </div>
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-[#CE0000] focus:outline-none focus:ring-1 focus:ring-[#CE0000]"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
            >
              <option value="all">All Activity</option>
              <option value="booking">Bookings</option>
              <option value="user_registration">User Registrations</option>
              <option value="trainer_registration">Trainer Registrations</option>
              <option value="rating">Ratings</option>
              <option value="notification">Notifications</option>
            </select>
          </div>
          <div className="p-5">
            {activitiesLoading ? (
              // Loading state for activities
              <div className="flex flex-col items-center justify-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#CE0000] mb-3"></div>
                <p className="text-gray-500">Loading recent activities...</p>
              </div>
            ) : activityError ? (
              // Error state
              <div className="flex flex-col items-center justify-center py-6">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <X className="h-8 w-8 text-red-500" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Error loading activities</h4>
                <p className="text-sm text-gray-500 mt-1">{activityError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-[#CE0000] text-white rounded-md hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : filteredActivities.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-900">
                          {activity.type === "booking" && activity.rawData?.clientId?.userName}
                          {activity.type === "user_registration" && activity.rawData?.userName}
                          {activity.type === "trainer_registration" && activity.rawData?.user?.userName}
                          {activity.type === "rating" && activity.rawData?.clientId?.userName}
                          {activity.type === "notification" && activity.rawData?.sender?.userName}
                          {!activity.rawData?.clientId?.userName &&
                            !activity.rawData?.userName &&
                            !activity.rawData?.user?.userName &&
                            activity.title}
                        </h4>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-400">
                            {new Date(activity.date).toLocaleDateString()}{" "}
                            {new Date(activity.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      {activity.type === "booking" && (
                        <div className="mt-1">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              activity.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : activity.status === "upcoming"
                                  ? "bg-blue-100 text-blue-800"
                                  : activity.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {activity.status}
                          </span>
                          {activity.paymentStatus && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full ml-2 ${
                                activity.paymentStatus === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : activity.paymentStatus === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {activity.paymentStatus}
                            </span>
                          )}
                        </div>
                      )}
                      {activity.type === "rating" && (
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < activity.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Empty state
              <div className="flex flex-col items-center justify-center py-10">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">No recent activity</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {activityType === "all"
                    ? "There is no recent activity to display"
                    : `No ${activityType.replace("_", " ")} activity found`}
                </p>
              </div>
            )}
            <div className="mt-5 flex justify-center border-t pt-4">
              <button
                className="text-sm text-gray-600 hover:text-[#CE0000] font-medium transition-colors duration-200 flex items-center"
                onClick={() => navigate("/recent")}
              >
                View All Activity
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="mt-6 rounded-lg border bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-5 flex justify-between items-center border-2 bg-gray-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <p className="text-sm text-gray-500">Latest financial activities on the platform</p>
          </div>
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="search"
                placeholder="Search transactions..."
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 placeholder-gray-500 shadow-sm focus:border-[#CE0000] focus:outline-none focus:ring-1 focus:ring-[#CE0000] w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#CE0000]"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
            <button
              onClick={() => navigate("/transactions")}
              className="rounded-md border border-gray-300 bg-white p-2 text-gray-600 hover:text-[#CE0000] hover:border-[#CE0000] transition-colors duration-200"
            >
              <TrendingUp className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-sm font-medium text-gray-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-medium uppercase tracking-wider">Transaction ID</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium uppercase tracking-wider">Client</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium uppercase tracking-wider">Trainer</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium uppercase tracking-wider">Amount</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium uppercase tracking-wider">Status</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium uppercase tracking-wider">Date</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {transactionsLoading ? (
                // Loading state for transactions
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-20 bg-gray-200 rounded-full"></div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="h-4 w-4 bg-gray-200 rounded-full ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : transactionError ? (
                // Error state
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <X className="h-8 w-8 text-red-500" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900">Error loading transactions</h4>
                      <p className="text-sm text-gray-500 mt-1">{transactionError}</p>
                      <button
                        onClick={() => {
                          setTransactionsLoading(true)
                          setTransactionError(null)
                          fetchRecentTransactions()
                        }}
                        className="mt-4 px-4 py-2 bg-[#CE0000] text-white rounded-md hover:bg-red-700"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <CreditCard className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900">No transactions found</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {searchTerm ? "Try adjusting your search criteria" : "There are no transactions to display yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Transaction data
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      {transaction.bookingNumber || transaction.id.substring(0, 8)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {transaction.client.profilePicture ? (
                            <img
                              src={
                                transaction.client.profilePicture.startsWith("http")
                                  ? transaction.client.profilePicture
                                  : `${transaction.client.profilePicture}`
                              }
                              alt={transaction.client.name}
                              className="h-8 w-8 object-cover"
                            />
                          ) : (
                            <Users className="h-4 w-4 text-[#CE0000]" />
                          )}
                        </div>
                        <span className="text-gray-900 font-medium">{transaction.client.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {transaction.trainer.profilePicture ? (
                            <img
                              src={
                                transaction.trainer.profilePicture.startsWith("http")
                                  ? transaction.trainer.profilePicture
                                  : `http://localhost:3000/uploads/profilePictures/${transaction.trainer.profilePicture}`
                              }
                              alt={transaction.trainer.name}
                              className="h-8 w-8 object-cover"
                            />
                          ) : (
                            <Users className="h-4 w-4 text-[#CE0000]" />
                          )}
                        </div>
                        <span>{transaction.trainer.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(transaction.status)}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{formatDate(transaction.date)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button className="rounded-md p-1 text-gray-500 hover:text-[#CE0000] transition-colors duration-200">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 bg-gray-50">
          <button
            className={`rounded-md border ${pagination.page === 1 ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"} px-3 py-2 text-sm font-medium shadow-sm transition-colors duration-200`}
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || transactionsLoading}
          >
            Previous
          </button>
          <div className="flex gap-1">
            {[...Array(Math.min(3, pagination.pages))].map((_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  className={`rounded-md border ${pagination.page === pageNum ? "border-[#CE0000] bg-[#CE0000] text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"} px-3 py-2 text-sm font-medium shadow-sm transition-colors duration-200`}
                  onClick={() => handlePageChange(pageNum)}
                  disabled={transactionsLoading}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          <button
            className={`rounded-md border ${pagination.page === pagination.pages || pagination.pages === 0 ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"} px-3 py-2 text-sm font-medium shadow-sm transition-colors duration-200`}
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages || pagination.pages === 0 || transactionsLoading}
          >
            Next
          </button>
        </div>
        <div className="border-t border-gray-200 px-4 py-3 flex justify-center">
          <button
            className="text-sm text-gray-600 hover:text-[#CE0000] font-medium transition-colors duration-200 flex items-center"
            onClick={() => navigate("/paymentDashboard")}
          >
            View All Transactions
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Sessions Card */}
        <div className="rounded-lg border bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
          <div className="border-b p-5 flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
              <p className="text-sm text-gray-500">Latest training sessions</p>
            </div>
            <button
              className="text-sm text-gray-600 hover:text-[#CE0000] font-medium transition-colors duration-200"
              onClick={() => navigate("/booking")}
            >
              View All
            </button>
          </div>
          <div className="p-5 space-y-4">
            {sessionsLoading ? (
              // Loading state for sessions
              <div className="flex flex-col items-center justify-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#CE0000] mb-3"></div>
                <p className="text-gray-500">Loading recent sessions...</p>
              </div>
            ) : sessionError ? (
              // Error state
              <div className="flex flex-col items-center justify-center py-6">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <X className="h-8 w-8 text-red-500" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Error loading sessions</h4>
                <p className="text-sm text-gray-500 mt-1">{sessionError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-[#CE0000] text-white rounded-md hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : recentSessions.length > 0 ? (
              // Sessions data
              recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border p-4 hover:shadow-sm transition-all duration-200 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex -space-x-2">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                          {session.client.profilePicture ? (
                            <img
                              src={
                                session.client.profilePicture.startsWith("http")
                                  ? session.client.profilePicture
                                  : `${session.client.profilePicture}`
                              }
                              alt={session.client.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            session.client.initials
                          )}
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                          {session.trainer.profilePicture ? (
                            <img
                              src={
                                session.trainer.profilePicture.startsWith("http")
                                  ? session.trainer.profilePicture
                                  : `http://localhost:3000/uploads/profilePictures/${session.trainer.profilePicture}`
                              }
                              alt={session.trainer.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            session.trainer.initials
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {session.client.name} & {session.trainer.name}
                        </h4>
                        <div className="flex items-center text-sm text-gray-600">
                          <span>
                            {getSessionTypeIcon(session.sessionType)} {session.sessionType} • {session.duration} minutes
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(session.status)}`}
                      >
                        {session.status}
                      </span>
                      <span className="text-sm text-gray-500 mt-1">{formatDate(session.date)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Empty state
              <div className="flex flex-col items-center justify-center py-10">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">No recent sessions</h4>
                <p className="text-sm text-gray-500 mt-1">There are no training sessions to display yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Exercise Preferences Card - DYNAMIC COMPONENT */}
        <ExercisePreferences />
      </div>
    </AdminLayout>
  )
}