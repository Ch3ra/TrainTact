"use client"

import { useState, useEffect } from "react"
import {
  Bell,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  Settings,
  Eye,
  EyeOff,
  X,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Info,
  MessageSquare,
  Calendar,
  CreditCard,
  BarChart2,
  List,
  LayoutDashboard,
  Star,
  PieChart,
} from "lucide-react"
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
import { Pie, Bar } from "react-chartjs-2"
import AdminLayout from "./AdminSidebar"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title)

// API base URL - adjust this to match your server
const API_BASE_URL =
  typeof window !== "undefined"
    ? window.ENV?.REACT_APP_API_BASE_URL || "http://localhost:3000/api"
    : "http://localhost:3000/api"

// Mock data for notifications (replace with actual API calls)
const mockNotifications = [
  {
    id: "notif-001",
    title: "New Booking Request",
    message: "You have a new booking request from John Doe for tomorrow at 2:00 PM.",
    type: "booking",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    priority: "high",
  },
  {
    id: "notif-002",
    title: "Payment Received",
    message: "Payment of $75.00 has been received for booking #BK-12345.",
    type: "payment",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    priority: "medium",
  },
  {
    id: "notif-003",
    title: "Booking Canceled",
    message: "Booking #BK-12346 has been canceled by the client.",
    type: "booking",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    priority: "medium",
  },
  {
    id: "notif-004",
    title: "System Maintenance",
    message: "The system will be undergoing maintenance on Sunday from 2:00 AM to 4:00 AM.",
    type: "system",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    priority: "low",
  },
  {
    id: "notif-005",
    title: "New Feature Available",
    message: "Check out our new calendar view for managing your bookings more efficiently.",
    type: "system",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    priority: "low",
  },
  {
    id: "notif-006",
    title: "Client Message",
    message: "You have a new message from Sarah regarding her upcoming appointment.",
    type: "message",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    priority: "high",
  },
  {
    id: "notif-007",
    title: "Payment Failed",
    message: "Payment for booking #BK-12347 has failed. Please contact the client.",
    type: "payment",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
    priority: "high",
  },
  {
    id: "notif-008",
    title: "Booking Reminder",
    message: "You have a booking with Michael tomorrow at 10:00 AM.",
    type: "booking",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    priority: "medium",
  },
  {
    id: "notif-009",
    title: "Account Update",
    message: "Your account details have been updated successfully.",
    type: "system",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), // 6 days ago
    priority: "low",
  },
  {
    id: "notif-010",
    title: "New Review",
    message: "You've received a 5-star review from Emma for your recent session.",
    type: "review",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    priority: "medium",
  },
]

// Mock notification stats
const mockNotificationStats = {
  totalNotifications: 125,
  unreadNotifications: 18,
  highPriorityNotifications: 7,
  notificationsByType: [
    { type: "booking", count: 45 },
    { type: "payment", count: 32 },
    { type: "system", count: 28 },
    { type: "message", count: 15 },
    { type: "review", count: 5 },
  ],
  notificationsByDay: [
    { day: "Mon", count: 12 },
    { day: "Tue", count: 19 },
    { day: "Wed", count: 15 },
    { day: "Thu", count: 22 },
    { day: "Fri", count: 18 },
    { day: "Sat", count: 8 },
    { day: "Sun", count: 5 },
  ],
}

export default function NotificationDashboard() {
  const [viewMode, setViewMode] = useState("dashboard") // "dashboard" or "list"
  const [filterType, setFilterType] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterRead, setFilterRead] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [showNotificationDetails, setShowNotificationDetails] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    bookingNotifications: true,
    paymentNotifications: true,
    systemNotifications: true,
    messageNotifications: true,
    reviewNotifications: true,
  })

  // State for notifications and stats
  const [notifications, setNotifications] = useState([])
  const [notificationStats, setNotificationStats] = useState({
    totalNotifications: 0,
    unreadNotifications: 0,
    highPriorityNotifications: 0,
    notificationsByType: [],
    notificationsByDay: [],
  })
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        // In a real app, you would fetch from your API
        // const response = await axios.get(`${API_BASE_URL}/notifications`, { params });

        // For now, we'll use mock data
        const filteredNotifications = mockNotifications.filter((notification) => {
          // Filter by type
          if (filterType !== "all" && notification.type !== filterType) {
            return false
          }

          // Filter by priority
          if (filterPriority !== "all" && notification.priority !== filterPriority) {
            return false
          }

          // Filter by read status
          if (filterRead === "read" && !notification.isRead) {
            return false
          }
          if (filterRead === "unread" && notification.isRead) {
            return false
          }

          // Filter by search query
          if (
            searchQuery &&
            !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !notification.message.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return false
          }

          return true
        })

        // Calculate pagination
        const total = filteredNotifications.length
        const totalPages = Math.ceil(total / perPage)
        const start = (currentPage - 1) * perPage
        const end = start + perPage
        const paginatedNotifications = filteredNotifications.slice(start, end)

        setNotifications(paginatedNotifications)
        setPagination({
          total,
          page: currentPage,
          perPage,
          totalPages,
        })

        // Set notification stats
        setNotificationStats(mockNotificationStats)

        setLoading(false)
      } catch (err) {
        console.error("Error fetching notifications:", err)
        setError("Failed to load notifications")
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [filterType, filterPriority, filterRead, searchQuery, currentPage, perPage])

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffMin < 1) {
      return "Just now"
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case "booking":
        return <Calendar className="h-5 w-5 text-blue-500" />
      case "payment":
        return <CreditCard className="h-5 w-5 text-green-500" />
      case "system":
        return <Info className="h-5 w-5 text-purple-500" />
      case "message":
        return <MessageSquare className="h-5 w-5 text-yellow-500" />
      case "review":
        return <Star className="h-5 w-5 text-orange-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  // Get priority badge color
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Handle pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return
    setCurrentPage(page)
  }

  // Handle mark as read/unread
  const handleMarkAsRead = async (id, isRead = true) => {
    try {
      // In a real app, you would call your API
      // await axios.put(`${API_BASE_URL}/notifications/${id}`, { isRead });

      // For now, we'll update the local state
      setNotifications(
        notifications.map((notification) => (notification.id === id ? { ...notification, isRead } : notification)),
      )

      // If the notification is currently selected, update it
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification({ ...selectedNotification, isRead })
      }

      // Update notification stats
      const diff = isRead ? 1 : -1
      setNotificationStats((prev) => ({
        ...prev,
        unreadNotifications: Math.max(0, prev.unreadNotifications - diff),
      }))
    } catch (err) {
      console.error("Error updating notification:", err)
      alert("Failed to update notification")
    }
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      // In a real app, you would call your API
      // await axios.put(`${API_BASE_URL}/notifications/mark-all-read`);

      // For now, we'll update the local state
      setNotifications(notifications.map((notification) => ({ ...notification, isRead: true })))

      // If a notification is currently selected, update it
      if (selectedNotification) {
        setSelectedNotification({ ...selectedNotification, isRead: true })
      }

      // Update notification stats
      setNotificationStats((prev) => ({
        ...prev,
        unreadNotifications: 0,
      }))
    } catch (err) {
      console.error("Error marking all as read:", err)
      alert("Failed to mark all as read")
    }
  }

  // Handle delete notification
  const handleDeleteNotification = async (id) => {
    try {
      // In a real app, you would call your API
      // await axios.delete(`${API_BASE_URL}/notifications/${id}`);

      // For now, we'll update the local state
      const notificationToDelete = notifications.find((n) => n.id === id)
      setNotifications(notifications.filter((notification) => notification.id !== id))

      // If the notification is currently selected, close the details view
      if (selectedNotification && selectedNotification.id === id) {
        setShowNotificationDetails(false)
      }

      // Update notification stats
      setNotificationStats((prev) => ({
        ...prev,
        totalNotifications: prev.totalNotifications - 1,
        unreadNotifications:
          notificationToDelete && !notificationToDelete.isRead
            ? prev.unreadNotifications - 1
            : prev.unreadNotifications,
        highPriorityNotifications:
          notificationToDelete && notificationToDelete.priority === "high"
            ? prev.highPriorityNotifications - 1
            : prev.highPriorityNotifications,
      }))
    } catch (err) {
      console.error("Error deleting notification:", err)
      alert("Failed to delete notification")
    }
  }

  // Handle view notification details
  const handleViewNotification = (notification) => {
    setSelectedNotification(notification)
    setShowNotificationDetails(true)

    // If the notification is unread, mark it as read
    if (!notification.isRead) {
      handleMarkAsRead(notification.id, true)
    }
  }

  // Handle save notification settings
  const handleSaveSettings = async () => {
    try {
      // In a real app, you would call your API
      // await axios.put(`${API_BASE_URL}/notifications/settings`, notificationSettings);

      // For now, we'll just close the settings modal
      setShowSettings(false)
      alert("Notification settings saved successfully")
    } catch (err) {
      console.error("Error saving notification settings:", err)
      alert("Failed to save notification settings")
    }
  }

  // Data for notification type pie chart
  const notificationTypeData = {
    labels: notificationStats.notificationsByType.map((item) => item.type.charAt(0).toUpperCase() + item.type.slice(1)),
    datasets: [
      {
        data: notificationStats.notificationsByType.map((item) => item.count),
        backgroundColor: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#f97316"],
        borderWidth: 1,
      },
    ],
  }

  // Data for notifications by day bar chart
  const notificationsByDayData = {
    labels: notificationStats.notificationsByDay.map((item) => item.day),
    datasets: [
      {
        label: "Notifications",
        data: notificationStats.notificationsByDay.map((item) => item.count),
        backgroundColor: "#CE0000",
        borderColor: "#A00000",
        borderWidth: 1,
        barThickness: 30,
        maxBarThickness: 40,
      },
    ],
  }

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 10,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  }

  // Loading state
  if (loading && !notifications.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CE0000] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !notifications.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Notifications</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#CE0000] text-white rounded-md hover:bg-[#A00000]"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Page Header with View Toggle */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Notification Center</h1>
          <p className="text-gray-500 mt-1">Manage and track all your notifications</p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setViewMode("dashboard")}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              viewMode === "dashboard" ? "bg-[#CE0000] text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard className="h-4 w-4 mr-1" />
            Dashboard
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              viewMode === "list" ? "bg-[#CE0000] text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <List className="h-4 w-4 mr-1" />
            All Notifications
          </button>
        </div>
      </div>

      {viewMode === "dashboard" ? (
        /* Dashboard View */
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Notifications</p>
                  <h3 className="text-2xl font-bold text-gray-900">{notificationStats.totalNotifications}</h3>
                  <div className="flex items-center mt-1 text-xs font-medium text-gray-600">
                    <span>Lifetime notifications</span>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Bell className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Unread Notifications</p>
                  <h3 className="text-2xl font-bold text-gray-900">{notificationStats.unreadNotifications}</h3>
                  <div className="flex items-center mt-1 text-xs font-medium text-blue-600">
                    <button
                      onClick={handleMarkAllAsRead}
                      className="hover:underline"
                      disabled={notificationStats.unreadNotifications === 0}
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">High Priority</p>
                  <h3 className="text-2xl font-bold text-gray-900">{notificationStats.highPriorityNotifications}</h3>
                  <div className="flex items-center mt-1 text-xs font-medium text-red-600">
                    <span>Require immediate attention</span>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-red-100 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Notification Types Pie Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notification Types</h3>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-64">
                <Pie
                  data={notificationTypeData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                          label: (context) => `${context.label}: ${context.raw} notifications`,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Notifications by Day Bar Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notifications by Day</h3>
                <BarChart2 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-64">
                <Bar
                  data={notificationsByDayData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("list")}
                  className="text-[#CE0000] hover:text-[#A00000] text-sm font-medium flex items-center"
                >
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-1 rounded-md hover:bg-gray-100"
                  title="Notification Settings"
                >
                  <Settings className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start p-4 rounded-lg border ${
                    notification.isRead ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex-shrink-0 mr-4">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{notification.title}</h4>
                      <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadgeClass(
                          notification.priority,
                        )}`}
                      >
                        {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                      </span>
                      <div className="flex items-center space-x-2">
                        {notification.isRead ? (
                          <button
                            onClick={() => handleMarkAsRead(notification.id, false)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Mark as Unread"
                          >
                            <EyeOff className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkAsRead(notification.id, true)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Mark as Read"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewNotification(notification)}
                          className="text-[#CE0000] hover:text-[#A00000]"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bell className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-lg font-medium">No notifications</p>
                  <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* List View */
        <>
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
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#CE0000] focus:border-[#CE0000] focus:outline-none w-full sm:w-64"
                  />
                </div>

                <div className="relative w-full sm:w-auto">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#CE0000] focus:border-[#CE0000] focus:outline-none appearance-none bg-white w-full"
                  >
                    <option value="all">All Types</option>
                    <option value="booking">Booking</option>
                    <option value="payment">Payment</option>
                    <option value="system">System</option>
                    <option value="message">Message</option>
                    <option value="review">Review</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="relative w-full sm:w-auto">
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#CE0000] focus:border-[#CE0000] focus:outline-none appearance-none bg-white w-full"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="relative w-full sm:w-auto">
                  <select
                    value={filterRead}
                    onChange={(e) => setFilterRead(e.target.value)}
                    className="pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#CE0000] focus:border-[#CE0000] focus:outline-none appearance-none bg-white w-full"
                  >
                    <option value="all">All Status</option>
                    <option value="read">Read</option>
                    <option value="unread">Unread</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Eye className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-md text-sm font-medium text-blue-700"
                  disabled={notificationStats.unreadNotifications === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark All Read
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="space-y-0 divide-y divide-gray-200">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start p-4 ${notification.isRead ? "bg-white" : "bg-blue-50"}`}
                  >
                    <div className="flex-shrink-0 mr-4">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{notification.title}</h4>
                        <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadgeClass(
                              notification.priority,
                            )}`}
                          >
                            {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">{notification.type}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {notification.isRead ? (
                            <button
                              onClick={() => handleMarkAsRead(notification.id, false)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Mark as Unread"
                            >
                              <EyeOff className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsRead(notification.id, true)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Mark as Read"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleViewNotification(notification)}
                            className="text-[#CE0000] hover:text-[#A00000]"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-lg font-medium">No notifications found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {notifications.length > 0 && (
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === pagination.totalPages
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
                      Showing <span className="font-medium">{(currentPage - 1) * perPage + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(currentPage * perPage, pagination.total)}</span> of{" "}
                      <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        // Logic to show pages around current page
                        let pageNum
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border ${
                              currentPage === pageNum
                                ? "z-10 bg-[#CE0000] text-white border-[#CE0000]"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            } text-sm font-medium`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 ${
                          currentPage === pagination.totalPages
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
        </>
      )}

      {/* Notification Details Modal */}
      {showNotificationDetails && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Notification Details</h3>
              <button
                onClick={() => setShowNotificationDetails(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 mr-4">{getNotificationIcon(selectedNotification.type)}</div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{selectedNotification.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(selectedNotification.createdAt)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-700">{selectedNotification.message}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{selectedNotification.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Priority</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClass(
                      selectedNotification.priority,
                    )}`}
                  >
                    {selectedNotification.priority.charAt(0).toUpperCase() + selectedNotification.priority.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedNotification.isRead ? "Read" : "Unread"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created At</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(selectedNotification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                {!selectedNotification.isRead ? (
                  <button
                    onClick={() => handleMarkAsRead(selectedNotification.id, true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Mark as Read
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkAsRead(selectedNotification.id, false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                  >
                    Mark as Unread
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDeleteNotification(selectedNotification.id)
                    setShowNotificationDetails(false)
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowNotificationDetails(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Delivery Methods</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="emailNotifications"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              emailNotifications: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-[#CE0000] focus:ring-[#CE0000] border-gray-300 rounded"
                        />
                        <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
                          Email Notifications
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="pushNotifications"
                          checked={notificationSettings.pushNotifications}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              pushNotifications: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-[#CE0000] focus:ring-[#CE0000] border-gray-300 rounded"
                        />
                        <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-700">
                          Push Notifications
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Notification Types</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="bookingNotifications"
                          checked={notificationSettings.bookingNotifications}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              bookingNotifications: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-[#CE0000] focus:ring-[#CE0000] border-gray-300 rounded"
                        />
                        <label htmlFor="bookingNotifications" className="ml-2 block text-sm text-gray-700">
                          Booking Notifications
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="paymentNotifications"
                          checked={notificationSettings.paymentNotifications}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              paymentNotifications: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-[#CE0000] focus:ring-[#CE0000] border-gray-300 rounded"
                        />
                        <label htmlFor="paymentNotifications" className="ml-2 block text-sm text-gray-700">
                          Payment Notifications
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="systemNotifications"
                          checked={notificationSettings.systemNotifications}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              systemNotifications: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-[#CE0000] focus:ring-[#CE0000] border-gray-300 rounded"
                        />
                        <label htmlFor="systemNotifications" className="ml-2 block text-sm text-gray-700">
                          System Notifications
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="messageNotifications"
                          checked={notificationSettings.messageNotifications}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              messageNotifications: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-[#CE0000] focus:ring-[#CE0000] border-gray-300 rounded"
                        />
                        <label htmlFor="messageNotifications" className="ml-2 block text-sm text-gray-700">
                          Message Notifications
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="reviewNotifications"
                          checked={notificationSettings.reviewNotifications}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              reviewNotifications: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-[#CE0000] focus:ring-[#CE0000] border-gray-300 rounded"
                        />
                        <label htmlFor="reviewNotifications" className="ml-2 block text-sm text-gray-700">
                          Review Notifications
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-[#CE0000] text-white rounded-md hover:bg-[#A00000] text-sm font-medium"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

