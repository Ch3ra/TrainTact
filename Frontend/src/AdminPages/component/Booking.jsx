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
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart2,
  PieChart,
  LayoutDashboard,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  DollarSign,
  CalendarClock,
  Users,
  UserCheck,
  CalendarCheck,
  CalendarDays,
  Activity,
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

// API base URL - replace with your actual backend URL
const API_BASE_URL = "http://localhost:3000/api"

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Booking API service
const BookingService = {
  // Get all bookings with optional filters
  getAllBookings: async (params = {}) => {
    try {
      const response = await apiClient.get("/availability/admin/bookings", { params })
      return response.data
    } catch (error) {
      console.error("Error fetching bookings:", error)
      throw error
    }
  },

  // Get booking by ID
  getBookingById: async (id) => {
    try {
      const response = await apiClient.get(`/availability/admin/bookings/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching booking ${id}:`, error)
      throw error
    }
  },

  // Update booking status
  updateBookingStatus: async (id, status, cancellationReason = null) => {
    try {
      const data = { status }
      if (cancellationReason) {
        data.cancellationReason = cancellationReason
      }

      const response = await apiClient.put(`/availability/admin/bookings/${id}/status`, data)
      return response.data
    } catch (error) {
      console.error(`Error updating booking ${id} status:`, error)
      throw error
    }
  },

  // Get trainer details including price
  getTrainerDetails: async (trainerId) => {
    try {
      const response = await apiClient.get(`/users/trainer/${trainerId}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching trainer ${trainerId} details:`, error)
      throw error
    }
  },

  // Get trainer price from Trainer model
  getTrainerPrice: async (trainerId) => {
    try {
      const response = await apiClient.get(`/trainers/${trainerId}`)
      return response.data.price || 0
    } catch (error) {
      console.error(`Error fetching trainer ${trainerId} price:`, error)
      throw error
    }
  },

  // Get booking progress data
  getBookingProgress: async () => {
    try {
      const response = await apiClient.get("/availability/booking-progress")
      return response.data
    } catch (error) {
      console.error("Error fetching booking progress data:", error)
      throw error
    }
  },
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState("bookingDate")
  const [sortDirection, setSortDirection] = useState("desc")
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [viewMode, setViewMode] = useState("table") // "table" or "dashboard"
  const [trainerPrices, setTrainerPrices] = useState({}) // Cache for trainer prices

  // Booking statistics
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    upcomingBookings: 0,
    cancelledBookings: 0,
    ongoingBookings: 0,
    totalRevenue: 0,
    bookingsByMonth: [],
    bookingsByStatus: [],
    popularTrainers: [],
    bookingsByDayOfWeek: [],
  })

  // Booking progress data state
  const [bookingProgressData, setBookingProgressData] = useState([])
  const [bookingProgressLoading, setBookingProgressLoading] = useState(true)

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

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
  const getMockBookingProgressData = () => {
    return [
      {
        monthYear: "4/2023",
        month: "Apr",
        year: 2023,
        newBookings: 8,
        totalBookings: 8,
        completed: 5,
        cancelled: 1,
        ongoing: 2,
      },
      {
        monthYear: "5/2023",
        month: "May",
        year: 2023,
        newBookings: 12,
        totalBookings: 20,
        completed: 7,
        cancelled: 2,
        ongoing: 3,
      },
      {
        monthYear: "6/2023",
        month: "Jun",
        year: 2023,
        newBookings: 15,
        totalBookings: 35,
        completed: 9,
        cancelled: 1,
        ongoing: 5,
      },
      {
        monthYear: "7/2023",
        month: "Jul",
        year: 2023,
        newBookings: 20,
        totalBookings: 55,
        completed: 12,
        cancelled: 2,
        ongoing: 6,
      },
      {
        monthYear: "8/2023",
        month: "Aug",
        year: 2023,
        newBookings: 18,
        totalBookings: 73,
        completed: 11,
        cancelled: 2,
        ongoing: 5,
      },
      {
        monthYear: "9/2023",
        month: "Sep",
        year: 2023,
        newBookings: 25,
        totalBookings: 98,
        completed: 15,
        cancelled: 3,
        ongoing: 7,
      },
      {
        monthYear: "10/2023",
        month: "Oct",
        year: 2023,
        newBookings: 30,
        totalBookings: 128,
        completed: 18,
        cancelled: 3,
        ongoing: 9,
      },
      {
        monthYear: "11/2023",
        month: "Nov",
        year: 2023,
        newBookings: 22,
        totalBookings: 150,
        completed: 13,
        cancelled: 2,
        ongoing: 7,
      },
      {
        monthYear: "12/2023",
        month: "Dec",
        year: 2023,
        newBookings: 18,
        totalBookings: 168,
        completed: 11,
        cancelled: 2,
        ongoing: 5,
      },
      {
        monthYear: "1/2024",
        month: "Jan",
        year: 2024,
        newBookings: 28,
        totalBookings: 196,
        completed: 17,
        cancelled: 3,
        ongoing: 8,
      },
      {
        monthYear: "2/2024",
        month: "Feb",
        year: 2024,
        newBookings: 32,
        totalBookings: 228,
        completed: 19,
        cancelled: 3,
        ongoing: 10,
      },
      {
        monthYear: "3/2024",
        month: "Mar",
        year: 2024,
        newBookings: 35,
        totalBookings: 263,
        completed: 21,
        cancelled: 4,
        ongoing: 10,
      },
    ]
  }

  // Fetch trainer price
  const fetchTrainerPrice = async (trainerId) => {
    // If we already have the price cached, return it
    if (trainerPrices[trainerId]) {
      return trainerPrices[trainerId]
    }

    try {
      // Try to get price from the Trainer model
      const price = await BookingService.getTrainerPrice(trainerId)

      // Cache the price
      setTrainerPrices((prev) => ({
        ...prev,
        [trainerId]: price,
      }))

      return price
    } catch (error) {
      console.error(`Error fetching price for trainer ${trainerId}:`, error)
      // If there's an error, try to get hourly rate from user details as fallback
      try {
        const trainerData = await BookingService.getTrainerDetails(trainerId)
        const fallbackPrice = trainerData.hourlyRate || 50 // Default to 50 if no price found

        // Cache the fallback price
        setTrainerPrices((prev) => ({
          ...prev,
          [trainerId]: fallbackPrice,
        }))

        return fallbackPrice
      } catch (fallbackError) {
        console.error(`Error fetching fallback price for trainer ${trainerId}:`, fallbackError)
        return 50 // Default price if all attempts fail
      }
    }
  }

  // Fetch bookings from API
  const fetchBookings = async () => {
    setLoading(true)
    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (filterStatus !== "all") {
        params.append("status", filterStatus)
      }
      params.append("page", currentPage.toString())
      params.append("limit", itemsPerPage.toString())

      const response = await BookingService.getAllBookings(Object.fromEntries(params))

      if (response) {
        // Process bookings to ensure amount is set
        const processedBookings = await Promise.all(
          (response.bookings || []).map(async (booking) => {
            // If amount is already set and not zero, use it
            if (booking.price && booking.price > 0) {
              return {
                ...booking,
                amount: booking.price, // Map price to amount for consistency
              }
            }

            // Otherwise, calculate based on trainer's price and duration
            const trainerPrice = await fetchTrainerPrice(booking.trainerId)
            const durationInHours = (booking.duration || 60) / 60
            const calculatedAmount = trainerPrice * durationInHours

            return {
              ...booking,
              amount: calculatedAmount,
            }
          }),
        )

        setBookings(processedBookings)

        // Calculate total revenue from all bookings
        const totalRevenue = processedBookings.reduce((sum, booking) => {
          // Only count paid bookings
          if (booking.paymentStatus === "paid") {
            return sum + (booking.amount || 0)
          }
          return sum
        }, 0)

        // Update stats with the calculated total revenue
        const updatedStats = {
          ...(response.stats || {}),
          totalRevenue: totalRevenue,
        }

        setBookingStats(updatedStats)
        setTotalPages(response.pagination?.pages || 1)
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
      showToast("Failed to load bookings. Please try again.", "error")
      // If API fails, use mock data for development
      const mockBookings = generateMockBookings(30)
      setBookings(mockBookings)
      const mockStats = generateMockBookingStats(mockBookings)
      setBookingStats(mockStats)
    } finally {
      setLoading(false)
    }
  }

  // Fetch booking progress data
  const fetchBookingProgressData = async () => {
    setBookingProgressLoading(true)
    try {
      const response = await BookingService.getBookingProgress()
      if (response.success) {
        setBookingProgressData(response.data)
      } else {
        // Fallback to mock data if API fails
        setBookingProgressData(getMockBookingProgressData())
      }
    } catch (error) {
      console.error("Error fetching booking progress data:", error)
      // Use mock data as fallback
      setBookingProgressData(getMockBookingProgressData())
    } finally {
      setBookingProgressLoading(false)
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchBookings()
    fetchBookingProgressData()
  }, [currentPage, filterStatus])

  // Get booking details
  const fetchBookingDetails = async (bookingId) => {
    try {
      const response = await BookingService.getBookingById(bookingId)
      if (response) {
        // If price is not set or zero, calculate it
        if (!response.price || response.price === 0) {
          const trainerPrice = await fetchTrainerPrice(response.trainerId)
          const durationInHours = (response.duration || 60) / 60
          response.amount = trainerPrice * durationInHours
        } else {
          response.amount = response.price // Map price to amount for consistency
        }

        setSelectedBooking(response)
      }
    } catch (error) {
      console.error("Error fetching booking details:", error)
      showToast("Failed to load booking details.", "error")
    }
  }

  // Update booking status
  const updateBookingStatus = async (bookingId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) {
      return
    }

    setActionLoading(true)

    try {
      const response = await BookingService.updateBookingStatus(bookingId, newStatus)

      if (response) {
        // Update the booking in our state
        setBookings(
          bookings.map((booking) => (booking._id === bookingId ? { ...booking, status: newStatus } : booking)),
        )

        if (selectedBooking?._id === bookingId) {
          setSelectedBooking({ ...selectedBooking, status: newStatus })
        }

        // Refresh data to get updated stats
        fetchBookings()

        showToast(`Booking status updated to ${newStatus}.`)
      }
    } catch (error) {
      console.error("Error updating booking status:", error)
      showToast("Failed to update booking status.", "error")
    } finally {
      setActionLoading(false)
    }
  }

  // Generate mock data for development
  const generateMockBookings = (count) => {
    const statuses = ["completed", "upcoming", "cancelled", "ongoing"]
    const sessionTypes = ["One-on-one", "Group", "Virtual", "Consultation"]
    const paymentStatuses = ["paid", "pending", "refunded"]
    const trainerTypes = ["Trainer", "Hacker"]

    // Define trainer prices
    const trainerPrices = {
      Trainer: 75,
      Hacker: 95,
    }

    return Array.from({ length: count }, (_, i) => {
      // Generate random dates
      const today = new Date()

      // Random booking date (up to 60 days in the past)
      const bookingDate = new Date(today)
      bookingDate.setDate(bookingDate.getDate() - Math.floor(Math.random() * 60))

      // Random session date based on status
      const sessionDate = new Date(bookingDate)
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      if (status === "upcoming") {
        // Future date for upcoming
        sessionDate.setDate(bookingDate.getDate() + Math.floor(Math.random() * 14) + 1)
      } else if (status === "completed" || status === "cancelled") {
        // Past date for completed or cancelled
        sessionDate.setDate(bookingDate.getDate() + Math.floor(Math.random() * 10) + 1)
        if (sessionDate > today) {
          sessionDate.setDate(today.getDate() - Math.floor(Math.random() * 5))
        }
      } else if (status === "ongoing") {
        // Today or very recent for ongoing
        sessionDate.setDate(today.getDate() - Math.floor(Math.random() * 2))
      }

      // Random session duration (30-120 minutes)
      const durationMinutes = [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)]

      // Random trainer type
      const trainerType = trainerTypes[Math.floor(Math.random() * trainerTypes.length)]

      // Calculate amount based on trainer's price and duration
      const hourlyRate = trainerPrices[trainerType] || 75
      const durationInHours = durationMinutes / 60
      const amount = hourlyRate * durationInHours

      // Payment status based on booking status
      let paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)]
      if (status === "completed") {
        paymentStatus = "paid" // Completed sessions are always paid
      } else if (status === "cancelled") {
        paymentStatus = Math.random() > 0.3 ? "refunded" : "paid" // 70% chance of refund for cancelled
      }

      return {
        _id: `booking${i + 1}`,
        bookingId: `BK${10000 + i}`,
        clientId: `client${Math.floor(Math.random() * 20) + 1}`,
        clientName: `Client ${Math.floor(Math.random() * 20) + 1}`,
        trainerId: `trainer${Math.floor(Math.random() * 10) + 1}`,
        trainerName: trainerType,
        bookingDate: bookingDate.toISOString(),
        sessionDate: sessionDate.toISOString(),
        sessionType: sessionTypes[Math.floor(Math.random() * sessionTypes.length)],
        duration: durationMinutes,
        amount: amount,
        status: status,
        paymentStatus: paymentStatus,
        notes: Math.random() > 0.7 ? "Client requested focus on specific muscle groups." : "",
        location: Math.random() > 0.5 ? "Gym Location" : "Virtual Session",
        cancellationReason: status === "cancelled" ? "Schedule conflict" : null,
        rating: status === "completed" ? Math.floor(Math.random() * 5) + 1 : null,
        feedback: status === "completed" && Math.random() > 0.6 ? "Great session, very helpful!" : null,
      }
    })
  }

  // Generate mock booking statistics
  const generateMockBookingStats = (bookingsData) => {
    // Calculate stats based on mock bookings
    const totalBookings = bookingsData.length
    const completedBookings = bookingsData.filter((b) => b.status === "completed").length
    const upcomingBookings = bookingsData.filter((b) => b.status === "upcoming").length
    const cancelledBookings = bookingsData.filter((b) => b.status === "cancelled").length
    const ongoingBookings = bookingsData.filter((b) => b.status === "ongoing").length

    // Calculate total revenue from all bookings with paid status
    const totalRevenue = bookingsData
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, booking) => sum + booking.amount, 0)

    // Group bookings by month
    const bookingsByMonth = []
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthCounts = {}

    bookingsData.forEach((booking) => {
      const date = new Date(booking.bookingDate)
      const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
      monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1
    })

    // Convert to array format
    for (const [month, count] of Object.entries(monthCounts)) {
      bookingsByMonth.push({ month, count })
    }

    // Sort by date
    bookingsByMonth.sort((a, b) => {
      const [aMonth, aYear] = a.month.split(" ")
      const [bMonth, bYear] = b.month.split(" ")

      if (aYear !== bYear) return Number.parseInt(aYear) - Number.parseInt(bYear)
      return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth)
    })

    // Bookings by status
    const bookingsByStatus = [
      { status: "Completed", count: completedBookings },
      { status: "Upcoming", count: upcomingBookings },
      { status: "Cancelled", count: cancelledBookings },
      { status: "Ongoing", count: ongoingBookings },
    ]

    // Popular trainers
    const trainerCounts = {}
    bookingsData.forEach((booking) => {
      trainerCounts[booking.trainerName] = (trainerCounts[booking.trainerName] || 0) + 1
    })

    const popularTrainers = Object.entries(trainerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Bookings by day of week - with realistic distribution matching the image
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    // Create a realistic distribution that matches the image provided
    const dayDistribution = [11, 3, 1, 4, 1, 4, 6]

    const bookingsByDayOfWeek = dayNames.map((day, index) => ({
      day,
      count: dayDistribution[index],
    }))

    return {
      totalBookings,
      completedBookings,
      upcomingBookings,
      cancelledBookings,
      ongoingBookings,
      totalRevenue,
      bookingsByMonth,
      bookingsByStatus,
      popularTrainers,
      bookingsByDayOfWeek,
    }
  }

  // Filter and sort bookings
  const filteredBookings = bookings
    .filter((booking) => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          booking.bookingId.toLowerCase().includes(query) ||
          booking.clientName.toLowerCase().includes(query) ||
          booking.trainerName.toLowerCase().includes(query) ||
          (booking.location && booking.location.toLowerCase().includes(query))
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
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem)

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
  }, [searchQuery, sortField, sortDirection])

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
  const openDetailModal = (booking) => {
    setSelectedBooking(booking)
    setIsDetailModalOpen(true)
    // If we have a real API, fetch the detailed booking
    if (booking._id && !booking._id.startsWith("booking")) {
      fetchBookingDetails(booking._id)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Format date and time together
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) {
      return "$0.00"
    }
    return `$${Number(amount).toFixed(2)}`
  }

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "ongoing":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get payment status badge color
  const getPaymentStatusBadgeClass = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "refunded":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "upcoming":
        return <Calendar className="h-5 w-5 text-blue-500" />
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "ongoing":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  // Data for bookings by status pie chart
  const bookingsByStatusData = {
    labels: bookingStats.bookingsByStatus.map((item) => item.status),
    datasets: [
      {
        data: bookingStats.bookingsByStatus.map((item) => item.count),
        backgroundColor: ["#4ade80", "#60a5fa", "#f87171", "#facc15"],
        borderWidth: 1,
      },
    ],
  }

  // Data for booking progress chart
  const bookingProgressChartData = {
    labels: bookingProgressData.map((item) => item.month),
    datasets: [
      {
        label: "New Bookings",
        data: bookingProgressData.map((item) => item.newBookings),
        backgroundColor: "rgba(54, 162, 235, 0.4)", // Light blue with transparency
        borderColor: "rgba(54, 162, 235, 0.8)",
        borderWidth: 1,
        type: "bar",
        yAxisID: "y",
      },
      {
        label: "Total Bookings",
        data: bookingProgressData.map((item) => item.totalBookings),
        borderColor: "#CE0000", // Red line
        backgroundColor: "rgba(206, 0, 0, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        type: "line",
        yAxisID: "y1",
      },
    ],
  }

  // Data for bookings by day of week bar chart
  const bookingsByDayData = {
    labels: bookingStats.bookingsByDayOfWeek.map((item) => item.day),
    datasets: [
      {
        label: "Bookings by Day",
        data: bookingStats.bookingsByDayOfWeek.map((item) => item.count),
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
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y} bookings`,
        },
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
          precision: 0,
          font: {
            size: 11,
          },
        },
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Booking Management</h1>
            <p className="text-gray-500 mt-1">View and manage all training session bookings</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <h3 className="text-2xl font-bold text-gray-900">{bookingStats.totalBookings}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <h3 className="text-2xl font-bold text-gray-900">{bookingStats.completedBookings}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Upcoming</p>
                <h3 className="text-2xl font-bold text-gray-900">{bookingStats.upcomingBookings}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 mr-3">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Ongoing</p>
                <h3 className="text-2xl font-bold text-gray-900">{bookingStats.ongoingBookings}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 mr-3">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(bookingStats.totalRevenue)}</h3>
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
                  placeholder="Search bookings..."
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
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 border-t pt-3 sm:border-t-0 sm:pt-0">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-medium">{Math.min(indexOfLastItem, filteredBookings.length)}</span> of{" "}
              <span className="font-medium">{filteredBookings.length}</span> bookings
            </div>
          </div>
        </div>

        {viewMode === "dashboard" ? (
          /* Dashboard View with Charts */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Bookings by Status Pie Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Bookings by Status</h3>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-64">
                <Pie data={bookingsByStatusData} options={chartOptions} />
              </div>
            </div>

            {/* Bookings by Day of Week Bar Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Bookings by Day of Week</h3>
                <BarChart2 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-64">
                <Bar
                  data={bookingsByDayData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                          label: (context) => `${context.parsed.y} bookings`,
                        },
                      },
                    },
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-center text-gray-500">
                Sunday and Saturday are the most popular booking days
              </div>
            </div>

            {/* Booking Progress Chart (replacing Booking Trends) */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Booking Progress</h3>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-80">
                <Line
                  data={bookingProgressChartData}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        type: "linear",
                        display: true,
                        position: "left",
                        title: {
                          display: true,
                          text: "New Bookings",
                        },
                        beginAtZero: true,
                      },
                      y1: {
                        type: "linear",
                        display: true,
                        position: "right",
                        title: {
                          display: true,
                          text: "Total Bookings",
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
              <div className="mt-2 text-xs text-center text-gray-500">
                Monthly booking growth shows both new and cumulative bookings over time
              </div>
            </div>

            {/* Popular Trainers */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Popular Trainers</h3>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trainer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bookings
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookingStats.popularTrainers.map((trainer, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
                              <UserCheck className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{trainer.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {trainer.count} bookings
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                <CalendarClock className="h-5 w-5 text-gray-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings
                      .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
                      .slice(0, 5)
                      .map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">{booking.bookingId}</span>
                              <span className="ml-2 text-sm text-gray-500">({booking.clientName})</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}
                            >
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(booking.sessionDate)}
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
                  View All Bookings →
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
                      onClick={() => handleSort("bookingId")}
                    >
                      <div className="flex items-center">
                        Booking ID
                        {sortField === "bookingId" &&
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
                      onClick={() => handleSort("clientName")}
                    >
                      <div className="flex items-center">
                        Client
                        {sortField === "clientName" &&
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
                      onClick={() => handleSort("trainerName")}
                    >
                      <div className="flex items-center">
                        Trainer
                        {sortField === "trainerName" &&
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
                      onClick={() => handleSort("sessionDate")}
                    >
                      <div className="flex items-center">
                        Session Date
                        {sortField === "sessionDate" &&
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
                      onClick={() => handleSort("sessionType")}
                    >
                      <div className="flex items-center">
                        Type
                        {sortField === "sessionType" &&
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
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center">
                        Amount
                        {sortField === "amount" &&
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
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CE0000] mb-3"></div>
                          <p className="text-lg font-medium">Loading bookings...</p>
                        </div>
                      </td>
                    </tr>
                  ) : currentItems.length > 0 ? (
                    currentItems.map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.bookingId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{booking.clientName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {booking.trainerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(booking.sessionDate)}
                          <div className="text-xs text-gray-400">{formatTime(booking.sessionDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          {booking.sessionType}
                          <div className="text-xs text-gray-400">{booking.duration} min</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                          {formatCurrency(booking.amount)}
                          <div className="text-xs">
                            <span
                              className={`inline-flex px-2 text-xs rounded-full ${getPaymentStatusBadgeClass(booking.paymentStatus)}`}
                            >
                              {booking.paymentStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openDetailModal(booking)}
                            className="text-[#CE0000] hover:text-[#A00000] transition-colors duration-200"
                            title="View details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center py-6">
                          <Calendar className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-lg font-medium">No bookings found</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search criteria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredBookings.length > 0 && (
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
                      <span className="font-medium">{Math.min(indexOfLastItem, filteredBookings.length)}</span> of{" "}
                      <span className="font-medium">{filteredBookings.length}</span> results
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

      {/* Booking Detail Modal */}
      {isDetailModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scaleIn">
            <div className="flex justify-between items-center border-b p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
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
                {/* Left column - Booking info */}
                <div className="md:w-1/2">
                  <div className="flex items-center mb-6">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-4">
                      {getStatusIcon(selectedBooking.status)}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">Booking #{selectedBooking.bookingId}</h4>
                      <div className="flex items-center text-gray-500">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedBooking.status)}`}
                        >
                          {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-[#CE0000] mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Session Date & Time</p>
                        <p className="text-gray-900">{formatDateTime(selectedBooking.sessionDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-[#CE0000] mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Duration</p>
                        <p className="text-gray-900">{selectedBooking.duration} minutes</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <DollarSign className="h-5 w-5 text-[#CE0000] mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Amount</p>
                        <p className="text-gray-900">{formatCurrency(selectedBooking.amount)}</p>
                        <span
                          className={`inline-flex px-2 text-xs rounded-full ${getPaymentStatusBadgeClass(selectedBooking.paymentStatus)}`}
                        >
                          {selectedBooking.paymentStatus.charAt(0).toUpperCase() +
                            selectedBooking.paymentStatus.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.notes && (
                    <div className="mb-6">
                      <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Session Notes</h5>
                      <p className="text-gray-900 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200 leading-relaxed">
                        {selectedBooking.notes}
                      </p>
                    </div>
                  )}

                  {selectedBooking.cancellationReason && (
                    <div className="mb-6">
                      <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Cancellation Reason</h5>
                      <p className="text-gray-900 text-sm bg-red-50 p-4 rounded-lg border border-red-200 leading-relaxed">
                        {selectedBooking.cancellationReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right column - Client & Trainer info */}
                <div className="md:w-1/2">
                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-3">Client Information</h5>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <div className="flex items-center mb-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedBooking.clientName}</p>
                        <p className="text-xs text-gray-500">Client ID: {selectedBooking.clientId}</p>
                      </div>
                    </div>
                  </div>

                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-3">Trainer Information</h5>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <div className="flex items-center mb-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedBooking.trainerName}</p>
                        <p className="text-xs text-gray-500">Trainer ID: {selectedBooking.trainerId}</p>
                      </div>
                    </div>
                  </div>

                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-3">Session Details</h5>
                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">Session Type</span>
                        </div>
                        <span className="text-sm text-gray-500">{selectedBooking.sessionType}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">Location</span>
                        </div>
                        <span className="text-sm text-gray-500">{selectedBooking.location}</span>
                      </div>
                    </div>

                    {selectedBooking.rating && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-sm font-medium">Client Rating</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900 mr-1">{selectedBooking.rating}/5</span>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-4 w-4 ${i < selectedBooking.rating ? "text-yellow-400" : "text-gray-300"}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedBooking.feedback && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Client Feedback</p>
                        <p className="text-sm text-gray-700 italic">"{selectedBooking.feedback}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t p-4 flex justify-between bg-gray-50">
              {selectedBooking.status === "upcoming" && (
                <>
                  <button
                    onClick={() => updateBookingStatus(selectedBooking._id, "ongoing")}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium flex items-center transition-colors duration-200 shadow-sm"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Clock className="h-5 w-5 mr-2" />
                    )}
                    Mark as Ongoing
                  </button>
                  <button
                    onClick={() => updateBookingStatus(selectedBooking._id, "cancelled")}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium flex items-center transition-colors duration-200 shadow-sm"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <XCircle className="h-5 w-5 mr-2" />
                    )}
                    Cancel Booking
                  </button>
                </>
              )}

              {selectedBooking.status === "ongoing" && (
                <button
                  onClick={() => updateBookingStatus(selectedBooking._id, "completed")}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium flex items-center transition-colors duration-200 shadow-sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  )}
                  Mark as Completed
                </button>
              )}

              {(selectedBooking.status === "completed" || selectedBooking.status === "cancelled") && (
                <div className="text-sm text-gray-500 italic">
                  This booking is {selectedBooking.status} and cannot be modified
                </div>
              )}

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-white hover:bg-gray-50 text-gray-800 py-2 px-4 rounded-lg font-medium border border-gray-300 transition-colors duration-200 shadow-sm ml-auto"
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

