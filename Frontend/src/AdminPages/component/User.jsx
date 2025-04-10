"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  User,
  Mail,
  Calendar,
  MapPin,
  Clock,
  Activity,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Dumbbell,
  Heart,
  X,
  BarChart,
  PieChart,
  Users,
  LayoutDashboard,
  List,
  TrendingUp,
} from "lucide-react"
import AdminLayout from "../component/AdminSidebar"
import Toast from "../component/Toast"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from "chart.js"
import { Pie, Bar, Line } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title)

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState("createdAt")
  const [sortDirection, setSortDirection] = useState("desc")
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [viewMode, setViewMode] = useState("table") // "table" or "dashboard"
  const [clientDetails, setClientDetails] = useState({})
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    fitnessGoals: [],
    fitnessLevels: [],
    userRegistrations: [],
    bookingStats: {},
  })
  // Toast state
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Client registration progress data state
  const [registrationProgressData, setRegistrationProgressData] = useState([])
  const [registrationProgressLoading, setRegistrationProgressLoading] = useState(true)

  // Show toast message function
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type })
    // Auto hide after 3 seconds
    setTimeout(() => {
      setToast({ ...toast, visible: false })
    }, 3000)
  }

  // Hide toast message function
  const hideToast = () => {
    setToast({ ...toast, visible: false })
  }

  // Mock data function for fallback
  const getMockRegistrationProgressData = () => {
    return [
      { monthYear: "4/2023", month: "Apr", year: 2023, newClients: 5, totalClients: 5 },
      { monthYear: "5/2023", month: "May", year: 2023, newClients: 8, totalClients: 13 },
      { monthYear: "6/2023", month: "Jun", year: 2023, newClients: 12, totalClients: 25 },
      { monthYear: "7/2023", month: "Jul", year: 2023, newClients: 15, totalClients: 40 },
      { monthYear: "8/2023", month: "Aug", year: 2023, newClients: 10, totalClients: 50 },
      { monthYear: "9/2023", month: "Sep", year: 2023, newClients: 18, totalClients: 68 },
      { monthYear: "10/2023", month: "Oct", year: 2023, newClients: 22, totalClients: 90 },
      { monthYear: "11/2023", month: "Nov", year: 2023, newClients: 17, totalClients: 107 },
      { monthYear: "12/2023", month: "Dec", year: 2023, newClients: 14, totalClients: 121 },
      { monthYear: "1/2024", month: "Jan", year: 2024, newClients: 20, totalClients: 141 },
      { monthYear: "2/2024", month: "Feb", year: 2024, newClients: 25, totalClients: 166 },
      { monthYear: "3/2024", month: "Mar", year: 2024, newClients: 30, totalClients: 196 },
    ]
  }

  // Fetch client users data from the backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch all client users - the API now returns booking data
        const response = await axios.get("http://localhost:3000/api/client/getAllUsers")

        // Transform API data to match our component's expected format
        const formattedUsers = await Promise.all(
          response.data.data.map(async (user) => {
            // For each user, try to fetch client details
            let clientData = null
            let clientResponse = null
            try {
              clientResponse = await axios.get(`http://localhost:3000/api/client/${user._id}`)
              if (clientResponse.data.clientDetails) {
                clientData = clientResponse.data.clientDetails
                // Store client details in our state for later use
                setClientDetails((prev) => ({
                  ...prev,
                  [user._id]: clientData,
                }))
              }
            } catch (error) {
              console.error(`Error fetching client details for user ${user._id}:`, error)
            }

            return {
              _id: user._id,
              userName: user.userName || "Anonymous User",
              email: user.email || "No email provided",
              profilePicture: user.profilePicture || null,
              phone: user.phone || "Not provided",
              location: user.location || "Not specified",
              age: user.age || "Not specified",
              role: user.role || "Client",
              fitnessGoal: user.fitnessGoal || "Not specified",
              isOtpVerified: user.isOtpVerified || false,
              createdAt: user.createdAt || new Date().toISOString(),
              lastActive: user.lastActive || null,
              // Use the actual status from the API
              status: user.status || "inactive",
              // Client specific data
              height: clientData?.height || "Not specified",
              weight: clientData?.weight || "Not specified",
              fitnessLevel: clientData?.fitnessLevel || "Not specified",
              description: clientData?.description || "No description provided",
              // Use the actual bookings count from the API
              bookingsCount: user.bookingsCount || 0,
              // If we have detailed booking stats from the client details API
              completedSessions: clientResponse?.data?.bookingStats?.completedSessions || 0,
              upcomingSessions: clientResponse?.data?.bookingStats?.upcomingSessions || 0,
              ongoingSessions: clientResponse?.data?.bookingStats?.ongoingSessions || 0,
              hasActiveSessions: user.hasActiveSessions || false,
            }
          }),
        )

        setUsers(formattedUsers)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching client users:", error)
        // If API fails, use mock data for development
        const mockUsers = generateMockUsers(25)
        setUsers(mockUsers)
        setLoading(false)
        showToast("Failed to fetch client data. Using mock data instead.", "error")
      }
    }

    // Fetch client statistics for dashboard
    const fetchUserStats = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/client/stats")
        if (response.data.success) {
          setUserStats(response.data.data)
        }
      } catch (error) {
        console.error("Error fetching client statistics:", error)
        showToast("Failed to fetch client statistics.", "error")
      }
    }

    // Fetch client registration progress data
    const fetchRegistrationProgressData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/client/registration-progress")
        if (response.data.success) {
          setRegistrationProgressData(response.data.data)
        } else {
          // Fallback to mock data if API fails
          setRegistrationProgressData(getMockRegistrationProgressData())
        }
      } catch (error) {
        console.error("Error fetching registration progress data:", error)
        // Use mock data as fallback
        setRegistrationProgressData(getMockRegistrationProgressData())
      } finally {
        setRegistrationProgressLoading(false)
      }
    }

    fetchUsers()
    fetchUserStats()
    fetchRegistrationProgressData()
  }, [])

  // Generate mock data for development
  const generateMockUsers = (count) => {
    const statuses = ["active", "inactive"]
    const goals = ["Weight Loss", "Muscle Gain", "Flexibility", "Endurance", "General Fitness"]
    const levels = ["Beginner", "Intermediate", "Advanced"]
    const genders = ["Male", "Female", "Other", "Prefer not to say"]
    const locations = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia"]

    return Array.from({ length: count }, (_, i) => {
      const randomDate = new Date()
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 365))

      const randomLastActive = new Date()
      randomLastActive.setDate(randomLastActive.getDate() - Math.floor(Math.random() * 30))

      // Generate random booking counts
      const bookingsCount = Math.floor(Math.random() * 20)
      const completedSessions = Math.floor(Math.random() * bookingsCount)
      const upcomingSessions = Math.floor(Math.random() * (bookingsCount - completedSessions))
      const ongoingSessions = bookingsCount - completedSessions - upcomingSessions
      const hasActiveSessions = upcomingSessions > 0 || ongoingSessions > 0

      // Determine status based on active sessions
      const status = hasActiveSessions ? "active" : "inactive"

      // Randomly determine if user is OTP verified (separate from status)
      const isOtpVerified = Math.random() > 0.3 // 70% chance of being verified

      return {
        _id: `user${i + 1}`,
        userName: `Client ${i + 1}`,
        email: `client${i + 1}@example.com`,
        profilePicture: null,
        phone: `+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        location: locations[Math.floor(Math.random() * locations.length)],
        age: Math.floor(Math.random() * 40) + 18,
        gender: genders[Math.floor(Math.random() * genders.length)],
        fitnessGoal: goals[Math.floor(Math.random() * goals.length)],
        fitnessLevel: levels[Math.floor(Math.random() * levels.length)],
        height: Math.floor(Math.random() * 50) + 150, // 150-200 cm
        weight: Math.floor(Math.random() * 50) + 50, // 50-100 kg
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        createdAt: randomDate.toISOString(),
        lastActive: randomLastActive.toISOString(),
        status: status,
        bookingsCount: bookingsCount,
        completedSessions: completedSessions,
        upcomingSessions: upcomingSessions,
        ongoingSessions: ongoingSessions,
        hasActiveSessions: hasActiveSessions,
        isOtpVerified: isOtpVerified,
        role: "Client", // Ensure all mock users are clients
      }
    })
  }

  // Filter and sort users
  const filteredUsers = users
    .filter((user) => {
      // Filter by status
      if (filterStatus !== "all" && user.status !== filterStatus) return false

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          user.userName.toLowerCase().includes(query) ||
          user._id.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.location && user.location.toLowerCase().includes(query))
        )
      }

      return true
    })
    .sort((a, b) => {
      // Handle sorting
      const valueA = a[sortField] || ""
      const valueB = b[sortField] || ""

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
      return 0
    })

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, searchQuery, sortField, sortDirection])

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Open detail modal
  const openDetailModal = (user) => {
    setSelectedUser(user)
    setIsDetailModalOpen(true)
  }

  // Handle user access control (OTP verification toggle)
  const toggleUserStatus = async (userId, isCurrentlyVerified) => {
    const newVerificationStatus = !isCurrentlyVerified
    const confirmMessage = newVerificationStatus
      ? "Are you sure you want to grant this client access to the platform?"
      : "Are you sure you want to restrict this client from accessing the platform?"

    if (!window.confirm(confirmMessage)) {
      return
    }

    setActionLoading(true)
    try {
      // Update user's OTP verification status - using isVerified as required by the API
      const response = await axios.patch(`http://localhost:3000/api/client/updateOtpVerification/${userId}`, {
        isVerified: newVerificationStatus, // This is the key change - using isVerified instead of isOtpVerified
      })

      if (response.data.success) {
        // Show toast message
        showToast(
          response.data.message ||
            (newVerificationStatus
              ? "Client access has been granted successfully."
              : "Client access has been restricted successfully."),
        )

        // Update the user's isOtpVerified status in our state
        setUsers(users.map((user) => (user._id === userId ? { ...user, isOtpVerified: newVerificationStatus } : user)))

        if (selectedUser?._id === userId) {
          setSelectedUser({ ...selectedUser, isOtpVerified: newVerificationStatus })
        }
      } else {
        showToast(`Failed to ${newVerificationStatus ? "grant" : "restrict"} client access`, "error")
      }
    } catch (error) {
      console.error(`Error ${newVerificationStatus ? "granting" : "restricting"} client access:`, error)

      // For development without API, update the state directly
      setUsers(users.map((user) => (user._id === userId ? { ...user, isOtpVerified: newVerificationStatus } : user)))

      if (selectedUser?._id === userId) {
        setSelectedUser({ ...selectedUser, isOtpVerified: newVerificationStatus })
      }

      showToast(
        newVerificationStatus
          ? "Client access has been granted. They can now log in to the platform."
          : "Client access has been restricted. They can no longer log in to the platform.",
      )
    } finally {
      setActionLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  // Format time ago for last active
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Never"

    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
    return `${Math.floor(diffInSeconds / 31536000)} years ago`
  }

  // Stats for summary cards
  const stats = {
    total: userStats.totalUsers || users.length,
    active: userStats.activeUsers || users.filter((u) => u.status === "active").length,
    inactive: userStats.inactiveUsers || users.filter((u) => u.status === "inactive").length,
    verified: userStats.verifiedUsers || users.filter((u) => u.isOtpVerified).length,
    unverified: userStats.unverifiedUsers || users.filter((u) => !u.isOtpVerified).length,
  }

  // Data for fitness goals pie chart
  const fitnessGoalsData = () => {
    // Use API data if available
    if (userStats.fitnessGoals && userStats.fitnessGoals.length > 0) {
      return {
        labels: userStats.fitnessGoals.map((goal) => goal.name),
        datasets: [
          {
            data: userStats.fitnessGoals.map((goal) => goal.count),
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"],
            borderWidth: 1,
          },
        ],
      }
    }

    // Fallback to client-side calculation
    const goals = {}
    users.forEach((user) => {
      if (user.fitnessGoal && user.fitnessGoal !== "Not specified") {
        goals[user.fitnessGoal] = (goals[user.fitnessGoal] || 0) + 1
      }
    })

    return {
      labels: Object.keys(goals),
      datasets: [
        {
          data: Object.values(goals),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"],
          borderWidth: 1,
        },
      ],
    }
  }

  // Data for fitness levels bar chart
  const fitnessLevelsData = () => {
    // Use API data if available
    if (userStats.fitnessLevels && userStats.fitnessLevels.length > 0) {
      return {
        labels: userStats.fitnessLevels.map((level) => level.name),
        datasets: [
          {
            label: "Clients by Fitness Level",
            data: userStats.fitnessLevels.map((level) => level.count),
            backgroundColor: "#CE0000",
            borderColor: "#A00000",
            borderWidth: 1,
          },
        ],
      }
    }

    // Fallback to client-side calculation
    const levels = {
      Beginner: 0,
      Intermediate: 0,
      Advanced: 0,
      "Not specified": 0,
    }

    users.forEach((user) => {
      if (user.fitnessLevel && user.fitnessLevel !== "Not specified") {
        levels[user.fitnessLevel] = (levels[user.fitnessLevel] || 0) + 1
      } else {
        levels["Not specified"]++
      }
    })

    return {
      labels: Object.keys(levels),
      datasets: [
        {
          label: "Clients by Fitness Level",
          data: Object.values(levels),
          backgroundColor: "#CE0000",
          borderColor: "#A00000",
          borderWidth: 1,
        },
      ],
    }
  }

  // Data for client registration progress chart
  const clientRegistrationProgressData = () => {
    return {
      labels: registrationProgressData.map((item) => item.month),
      datasets: [
        {
          label: "New Clients",
          data: registrationProgressData.map((item) => item.newClients),
          borderColor: "#CE0000",
          backgroundColor: "rgba(206, 0, 0, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y",
          type: "bar",
        },
        {
          label: "Total Clients",
          data: registrationProgressData.map((item) => item.totalClients),
          borderColor: "#36A2EB",
          backgroundColor: "rgba(54, 162, 235, 0.1)",
          tension: 0.4,
          fill: false,
          yAxisID: "y1",
          type: "line",
        },
      ],
    }
  }

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  }

  return (
    <AdminLayout>
      {/* Toast Notification */}
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="w-full">
        {/* Page Header with View Toggle */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Client Management</h1>
            <p className="text-gray-500 mt-1">View and manage client accounts on the platform</p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                viewMode === "table" ? "bg-[#CE0000] text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <List className="h-4 w-4 mr-1" />
              Table View
            </button>
            <button
              onClick={() => setViewMode("dashboard")}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                viewMode === "dashboard" ? "bg-[#CE0000] text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 mr-1" />
              Dashboard View
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Clients</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active Clients</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.active}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-red-100 text-red-600 mr-3">
                <UserX className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Inactive Clients</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.inactive}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#CE0000] focus:border-[#CE0000] focus:outline-none w-full sm:w-64"
                />
              </div>

              <div className="relative w-full sm:w-auto">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#CE0000] focus:border-[#CE0000] focus:outline-none appearance-none bg-white w-full"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 border-t pt-3 sm:border-t-0 sm:pt-0">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-medium">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of{" "}
              <span className="font-medium">{filteredUsers.length}</span> clients
            </div>
          </div>
        </div>

        {viewMode === "dashboard" ? (
          /* Dashboard View with Charts */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Fitness Goals Pie Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Fitness Goals Distribution</h3>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-64">
                <Pie data={fitnessGoalsData()} options={chartOptions} />
              </div>
            </div>

            {/* Fitness Levels Bar Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Clients by Fitness Level</h3>
                <BarChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-64">
                <Bar data={fitnessLevelsData()} options={chartOptions} />
              </div>
            </div>

            {/* Client Registration Progress Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Client Registration Progress</h3>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-80">
                <Line
                  data={clientRegistrationProgressData()}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        type: "linear",
                        display: true,
                        position: "left",
                        title: {
                          display: true,
                          text: "New Clients",
                        },
                        beginAtZero: true,
                      },
                      y1: {
                        type: "linear",
                        display: true,
                        position: "right",
                        title: {
                          display: true,
                          text: "Total Clients",
                        },
                        grid: {
                          drawOnChartArea: false,
                        },
                        beginAtZero: true,
                      },
                      x: {
                        title: {
                          display: true,
                          text: "Month",
                        },
                      },
                    },
                    interaction: {
                      mode: "index",
                      intersect: false,
                    },
                  }}
                />
              </div>
            </div>

            {/* Recent Users List */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recently Joined Clients</h3>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Client
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Joined
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 5)
                      .map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                {user.profilePicture ? (
                                  <img
                                    src={user.profilePicture || "/placeholder.svg"}
                                    alt={user.userName}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="h-5 w-5" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                                <div className="text-sm text-gray-500">{user.location || "Location not specified"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openDetailModal(user)}
                              className="text-[#CE0000] hover:text-[#A00000] transition-colors duration-200"
                              title="View details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-right">
                <button
                  onClick={() => setViewMode("table")}
                  className="text-[#CE0000] hover:text-[#A00000] text-sm font-medium"
                >
                  View All Clients →
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("_id")}
                    >
                      <div className="flex items-center">
                        ID
                        {sortField === "_id" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 ml-1" />
                          ))}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("userName")}
                    >
                      <div className="flex items-center">
                        Client
                        {sortField === "userName" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 ml-1" />
                          ))}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center">
                        Email
                        {sortField === "email" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 ml-1" />
                          ))}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden lg:table-cell"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center">
                        Joined
                        {sortField === "createdAt" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 ml-1" />
                          ))}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden sm:table-cell"
                      onClick={() => handleSort("bookingsCount")}
                    >
                      <div className="flex items-center">
                        Bookings
                        {sortField === "bookingsCount" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 ml-1" />
                          ))}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        Status
                        {sortField === "status" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 ml-1" />
                          ))}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CE0000] mb-3"></div>
                          <p className="text-lg font-medium">Loading clients...</p>
                        </div>
                      </td>
                    </tr>
                  ) : currentItems.length > 0 ? (
                    currentItems.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user._id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture || "/placeholder.svg"}
                                  alt={user.userName}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-5 w-5" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                              <div className="text-sm text-gray-500">{user.location || "Location not specified"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                          {user.bookingsCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              onClick={() => openDetailModal(user)}
                              className="text-[#CE0000] hover:text-[#A00000] transition-colors duration-200"
                              title="View details"
                              disabled={actionLoading}
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            {user.isOtpVerified ? (
                              <button
                                onClick={() => toggleUserStatus(user._id, user.isOtpVerified)}
                                className="text-green-600 hover:text-green-800 transition-colors duration-200"
                                title="Client has access (click to restrict)"
                                disabled={actionLoading}
                              >
                                <Unlock className="h-5 w-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleUserStatus(user._id, user.isOtpVerified)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Client restricted (click to grant access)"
                                disabled={actionLoading}
                              >
                                <Lock className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center py-6">
                          <User className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-lg font-medium">No clients found</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search criteria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredUsers.length > 0 && (
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of{" "}
                      <span className="font-medium">{filteredUsers.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => {
                        // Show limited page numbers with ellipsis for better UX
                        if (
                          number === 1 ||
                          number === totalPages ||
                          (number >= currentPage - 1 && number <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={number}
                              onClick={() => paginate(number)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === number
                                  ? "z-10 bg-[#CE0000] text-white border-[#CE0000]"
                                  : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300"
                              }`}
                            >
                              {number}
                            </button>
                          )
                        } else if (
                          (number === currentPage - 2 && currentPage > 3) ||
                          (number === currentPage + 2 && currentPage < totalPages - 2)
                        ) {
                          return (
                            <span
                              key={number}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                            >
                              ...
                            </span>
                          )
                        }
                        return null
                      })}

                      <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                          currentPage === totalPages
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Client Detail Modal */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scaleIn">
            <div className="flex justify-between items-center border-b p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Client Details</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 p-1 transition-colors duration-200"
                disabled={actionLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 max-h-[calc(90vh-8rem)]">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left column - Personal info */}
                <div className="md:w-1/2">
                  <div className="flex items-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-4 border-2 border-white shadow">
                      {selectedUser.profilePicture ? (
                        <img
                          src={selectedUser.profilePicture || "/placeholder.svg"}
                          alt={selectedUser.userName}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{selectedUser.userName}</h4>
                      <div className="flex items-center text-gray-500">
                        <Mail className="h-4 w-4 mr-1 text-[#CE0000]" />
                        <span>{selectedUser.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-[#CE0000] mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Location</p>
                        <p className="text-gray-900">{selectedUser.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-[#CE0000] mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Age</p>
                        <p className="text-gray-900">{selectedUser.age}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-[#CE0000] mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Joined Date</p>
                        <p className="text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Fitness Goal</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.fitnessGoal ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedUser.fitnessGoal}
                        </span>
                      ) : (
                        <p className="text-gray-500 text-sm">No fitness goal specified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right column - Activity & Stats */}
                <div className="md:w-1/2">
                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-3">Account Status</h5>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            selectedUser.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500 ml-3">
                          {selectedUser.status === "active"
                            ? "Client has active sessions"
                            : "Client has no active sessions"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-3">Access Control</h5>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            selectedUser.isOtpVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {selectedUser.isOtpVerified ? "Has Access" : "No Access"}
                        </span>
                        <span className="text-sm text-gray-500 ml-3">
                          {selectedUser.isOtpVerified
                            ? "Client can access the platform"
                            : "Client cannot access the platform"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-3">Fitness Details</h5>
                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Heart className="h-5 w-5 text-[#CE0000] mr-2" />
                          <span className="text-sm font-medium">Fitness Level</span>
                        </div>
                        <span className="text-sm text-gray-500">{selectedUser.fitnessLevel}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Activity className="h-5 w-5 text-[#CE0000] mr-2" />
                          <span className="text-sm font-medium">Height</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {selectedUser.height !== "Not specified" ? `${selectedUser.height} cm` : "Not specified"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Dumbbell className="h-5 w-5 text-[#CE0000] mr-2" />
                          <span className="text-sm font-medium">Weight</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {selectedUser.weight !== "Not specified" ? `${selectedUser.weight} kg` : "Not specified"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-[#CE0000] mr-2" />
                          <span className="text-sm font-medium">Total Bookings</span>
                        </div>
                        <span className="text-sm text-gray-500">{selectedUser.bookingsCount}</span>
                      </div>
                    </div>
                  </div>

                  {selectedUser.description && (
                    <div className="mb-6">
                      <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Description</h5>
                      <p className="text-gray-900 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200 leading-relaxed">
                        {selectedUser.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t p-4 flex justify-between bg-gray-50">
              <button
                onClick={() => toggleUserStatus(selectedUser._id, selectedUser.isOtpVerified)}
                className={`py-2 px-4 rounded-lg font-medium flex items-center transition-colors duration-200 shadow-sm ${
                  selectedUser.isOtpVerified
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : selectedUser.isOtpVerified ? (
                  <Lock className="h-5 w-5 mr-2" />
                ) : (
                  <Unlock className="h-5 w-5 mr-2" />
                )}
                {selectedUser.isOtpVerified ? "Restrict Client Access" : "Grant Client Access"}
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-white hover:bg-gray-50 text-gray-800 py-2 px-4 rounded-lg font-medium border border-gray-300 transition-colors duration-200 shadow-sm"
                disabled={actionLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

