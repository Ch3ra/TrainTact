"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Calendar,
  Star,
  MessageSquare,
  CreditCard,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react"
import axios from "axios"
import AdminLayout from "../component/AdminSidebar"

const Activity = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [activityType, setActivityType] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const itemsPerPage = 10

  // Format date - Fixed to handle null/undefined dates better
  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A"

    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) return "N/A"

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Date formatting error:", error, "for date:", dateString)
      return "N/A"
    }
  }

  // Format time ago - Fixed to handle null/undefined dates better
  const formatTimeAgo = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A"

    try {
      const now = new Date()
      const date = new Date(dateString)

      // Check if date is valid
      if (isNaN(date.getTime())) return "N/A"

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
    } catch (error) {
      console.error("Time ago formatting error:", error)
      return "N/A"
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
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  // Get activity type label
  const getActivityTypeLabel = (type) => {
    switch (type) {
      case "booking":
        return "Booking"
      case "user_registration":
        return "User Registration"
      case "trainer_registration":
        return "Trainer Registration"
      case "rating":
        return "Rating"
      case "payment":
        return "Payment"
      case "notification":
        return "Notification"
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")
    }
  }

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "ongoing":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Format raw data for display
  const formatRawDataForDisplay = (data, type) => {
    if (!data) return null

    // Create a formatted version of the data with only relevant fields
    let formattedData = {}

    switch (type) {
      case "booking":
        formattedData = {
          bookingId: data._id || data.id,
          bookingNumber: data.bookingNumber,
          createdAt: formatDate(data.createdAt),
          bookingDate: formatDate(data.bookingDate),
          startTime: data.startTime,
          endTime: data.endTime,
          status: data.status,
          paymentStatus: data.paymentStatus,
          amount: data.amount,
        }
        break
      case "user_registration":
        formattedData = {
          userId: data._id || data.id,
          name: data.userName,
          email: data.email,
          role: data.role,
          registeredOn: formatDate(data.createdAt),
        }
        break
      case "trainer_registration":
        formattedData = {
          trainerId: data._id || data.id,
          name: data.user?.userName,
          email: data.user?.email,
          specialty: data.specialty,
          experience: data.yearsOfExperience + " years",
          registeredOn: formatDate(data.createdAt),
        }
        break
      case "rating":
        formattedData = {
          ratingId: data._id || data.id,
          rating: data.rating,
          feedback: data.feedback,
          submittedOn: formatDate(data.createdAt),
        }
        break
      default:
        // For other types, include all data but format dates
        formattedData = { ...data }
        // Format any date fields
        Object.keys(formattedData).forEach((key) => {
          if (key.toLowerCase().includes("date") || key === "createdAt" || key === "updatedAt") {
            formattedData[key] = formatDate(formattedData[key])
          }
        })
    }

    return formattedData
  }

  // Fetch activities
  const fetchActivities = async (page = 1) => {
    setLoading(true)
    try {
      // Calculate date range filter
      let startDate = null
      if (dateRange === "today") {
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
      } else if (dateRange === "week") {
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
      } else if (dateRange === "month") {
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 1)
      }

      // Build query parameters
      const params = {
        page,
        limit: itemsPerPage,
        type: activityType !== "all" ? activityType : undefined,
        startDate: startDate ? startDate.toISOString() : undefined,
        search: searchQuery || undefined,
      }

      console.log("Fetching activities with params:", params)
      const response = await axios.get("http://localhost:3000/api/admin/activity/recent", { params })

      if (response.data.success) {
        // Log the first few activities to check date fields
        console.log(
          "Sample activities from API:",
          response.data.data.slice(0, 2).map((a) => ({
            id: a.id,
            type: a.type,
            date: a.date,
            createdAt: a.createdAt,
          })),
        )

        // Ensure all activities have a date field
        const processedActivities = response.data.data.map((activity) => {
          // Set a default date if both date and createdAt are undefined
          if (!activity.date && !activity.createdAt) {
            const defaultDate = new Date()
            activity.date = defaultDate
            activity.createdAt = defaultDate

            console.log(`Added default date for activity ${activity.id} (${activity.type})`)
          }
          // Always use createdAt as the primary date field if available
          else if (activity.createdAt) {
            activity.date = activity.createdAt
          }
          // If date is still missing, try to use other date fields
          else if (!activity.date) {
            activity.date =
              activity.rawData?.createdAt ||
              activity.rawData?.bookingDate ||
              activity.rawData?.registrationDate ||
              new Date().toISOString()
          }

          return activity
        })

        setActivities(processedActivities)
        setTotalPages(Math.ceil(response.data.count / itemsPerPage) || 1)
      } else {
        throw new Error("Failed to fetch activities")
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching activities:", error)
      setError("Failed to load activities. Please try again.")
      setLoading(false)
    }
  }

  // Refresh data
  const refreshData = () => {
    setIsRefreshing(true)
    fetchActivities(currentPage).finally(() => {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 500)
    })
  }

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchActivities(1)
  }

  // Handle filter change
  const handleFilterChange = (filter, value) => {
    if (filter === "type") {
      setActivityType(value)
    } else if (filter === "date") {
      setDateRange(value)
    }
    setCurrentPage(1)
    fetchActivities(1)
  }

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchActivities(page)
  }

  // View activity details
  const viewActivityDetails = (activity) => {
    setSelectedActivity(activity)
    setShowDetailModal(true)
  }

  // Initial fetch
  useEffect(() => {
    fetchActivities()
  }, [])

  // Get the best available date from an activity
  const getBestDate = (activity) => {
    // For specific activity types, use their specific date fields if available
    if (activity.type === "booking" && activity.bookingDate) {
      return activity.bookingDate
    }
    if (activity.type === "user_registration" && activity.registrationDate) {
      return activity.registrationDate
    }
    if (activity.type === "rating" && activity.ratingDate) {
      return activity.ratingDate
    }

    // Otherwise use the standard date fields
    return (
      activity.createdAt ||
      activity.date ||
      activity.rawData?.createdAt ||
      activity.rawData?.bookingDate ||
      activity.rawData?.registrationDate ||
      activity.rawData?.updatedAt ||
      new Date().toISOString()
    )
  }

  // Get activity date label based on type
  const getActivityDateLabel = (activity) => {
    switch (activity.type) {
      case "booking":
        return "Booking Created"
      case "user_registration":
        return "User Registered"
      case "trainer_registration":
        return "Trainer Registered"
      case "rating":
        return "Rating Submitted"
      default:
        return "Created"
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Activity Monitor</h1>
        <p className="text-gray-500">Track all activities across the TrainTact platform</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          {/* Activity Type Filter */}
          <div className="w-full sm:w-auto">
            <label htmlFor="activity-type" className="block text-sm font-medium text-gray-700 mb-1">
              Activity Type
            </label>
            <div className="relative">
              <select
                id="activity-type"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-[#CE0000] focus:outline-none focus:ring-1 focus:ring-[#CE0000]"
                value={activityType}
                onChange={(e) => handleFilterChange("type", e.target.value)}
              >
                <option value="all">All Activities</option>
                <option value="booking">Bookings</option>
                <option value="user_registration">User Registrations</option>
                <option value="trainer_registration">Trainer Registrations</option>
                <option value="rating">Ratings</option>
                <option value="notification">Notifications</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <Filter className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="w-full sm:w-auto">
            <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="relative">
              <select
                id="date-range"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-[#CE0000] focus:outline-none focus:ring-1 focus:ring-[#CE0000]"
                value={dateRange}
                onChange={(e) => handleFilterChange("date", e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="w-full md:w-auto md:min-w-[300px]">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              id="search"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-[#CE0000] focus:outline-none focus:ring-1 focus:ring-[#CE0000]"
              placeholder="Search by name, ID, etc."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-[#CE0000]"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Refresh Button */}
        <div className="flex items-end">
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#CE0000] focus:ring-offset-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        {loading ? (
          // Loading state
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CE0000] mb-4"></div>
            <p className="text-gray-500">Loading activities...</p>
          </div>
        ) : error ? (
          // Error state
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Error loading activities</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button onClick={refreshData} className="px-4 py-2 bg-[#CE0000] text-white rounded-md hover:bg-red-700">
              Try Again
            </button>
          </div>
        ) : activities.length === 0 ? (
          // Empty state
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No activities found</h3>
            <p className="text-gray-500">
              {activityType !== "all" || dateRange !== "all" || searchQuery
                ? "Try changing your filters or search query"
                : "There are no activities to display at this time"}
            </p>
          </div>
        ) : (
          // Activity list
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
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
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{getActivityTypeLabel(activity.type)}</div>
                          <div className="text-xs text-gray-500">
                            ID: {activity.id ? activity.id.substring(0, 8) + "..." : "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {activity.type === "booking" && activity.rawData?.clientId?.userName}
                        {activity.type === "user_registration" && activity.rawData?.userName}
                        {activity.type === "trainer_registration" && activity.rawData?.user?.userName}
                        {activity.type === "rating" && activity.rawData?.clientId?.userName}
                        {activity.type === "notification" && activity.rawData?.sender?.userName}
                        {!activity.rawData?.clientId?.userName &&
                          !activity.rawData?.userName &&
                          !activity.rawData?.user?.userName &&
                          "Unknown User"}
                      </div>
                      {activity.type === "booking" && (
                        <div className="text-xs text-gray-500">
                          Trainer: {activity.rawData?.trainerId?.userName || "Unknown"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {activity.description || "No description available"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activity.status && (
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(activity.status)}`}
                        >
                          {activity.status}
                        </span>
                      )}
                      {activity.paymentStatus && (
                        <span
                          className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(activity.paymentStatus)}`}
                        >
                          {activity.paymentStatus}
                        </span>
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(getBestDate(activity))}</div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">{getActivityDateLabel(activity)}:</span>{" "}
                        {formatTimeAgo(getBestDate(activity))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => viewActivityDetails(activity)}
                        className="text-[#CE0000] hover:text-red-800 flex items-center justify-end"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && activities.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{activities.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {/* Page numbers */}
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1
                    const isCurrentPage = pageNumber === currentPage

                    // Show limited page numbers for better UI
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isCurrentPage
                              ? "z-10 bg-[#CE0000] border-[#CE0000] text-white"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    }

                    // Show ellipsis for skipped pages
                    if (
                      (pageNumber === 2 && currentPage > 3) ||
                      (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span
                          key={pageNumber}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      )
                    }

                    return null
                  })}

                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Activity Detail Modal */}
      {showDetailModal && selectedActivity && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowDetailModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10">
                    {getActivityIcon(selectedActivity.type)}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {selectedActivity.title || getActivityTypeLabel(selectedActivity.type)}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">{getActivityDateLabel(selectedActivity)}:</span>{" "}
                        {formatDate(getBestDate(selectedActivity))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Description</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedActivity.description || "No description available"}
                      </p>
                    </div>

                    {selectedActivity.status && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Status</h4>
                        <span
                          className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(selectedActivity.status)}`}
                        >
                          {selectedActivity.status}
                        </span>
                      </div>
                    )}

                    {selectedActivity.paymentStatus && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Payment Status</h4>
                        <span
                          className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(selectedActivity.paymentStatus)}`}
                        >
                          {selectedActivity.paymentStatus}
                        </span>
                      </div>
                    )}

                    {selectedActivity.amount && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Amount</h4>
                        <p className="mt-1 text-sm text-gray-900">${selectedActivity.amount.toFixed(2)}</p>
                      </div>
                    )}

                    {selectedActivity.type === "rating" && selectedActivity.rating && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Rating</h4>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < selectedActivity.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-900">{selectedActivity.rating} out of 5</span>
                        </div>
                      </div>
                    )}

                    {/* User Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">User Information</h4>
                      <div className="mt-1 text-sm text-gray-900">
                        {selectedActivity.type === "booking" && (
                          <div className="space-y-1">
                            <p>
                              <span className="font-medium">Client:</span>{" "}
                              {selectedActivity.rawData?.clientId?.userName || "Unknown"}
                            </p>
                            <p>
                              <span className="font-medium">Trainer:</span>{" "}
                              {selectedActivity.rawData?.trainerId?.userName || "Unknown"}
                            </p>
                            {selectedActivity.rawData?.bookingNumber && (
                              <p>
                                <span className="font-medium">Booking #:</span> {selectedActivity.rawData.bookingNumber}
                              </p>
                            )}
                          </div>
                        )}
                        {selectedActivity.type === "user_registration" && (
                          <div className="space-y-1">
                            <p>
                              <span className="font-medium">Name:</span>{" "}
                              {selectedActivity.rawData?.userName || "Unknown"}
                            </p>
                            <p>
                              <span className="font-medium">Email:</span> {selectedActivity.rawData?.email || "Unknown"}
                            </p>
                            <p>
                              <span className="font-medium">Role:</span> {selectedActivity.rawData?.role || "Client"}
                            </p>
                          </div>
                        )}
                        {selectedActivity.type === "trainer_registration" && (
                          <div className="space-y-1">
                            <p>
                              <span className="font-medium">Name:</span>{" "}
                              {selectedActivity.rawData?.user?.userName || "Unknown"}
                            </p>
                            <p>
                              <span className="font-medium">Email:</span>{" "}
                              {selectedActivity.rawData?.user?.email || "Unknown"}
                            </p>
                            <p>
                              <span className="font-medium">Experience:</span>{" "}
                              {selectedActivity.rawData?.yearsOfExperience || 0} years
                            </p>
                          </div>
                        )}
                        {selectedActivity.type === "rating" && (
                          <div className="space-y-1">
                            <p>
                              <span className="font-medium">Client:</span>{" "}
                              {selectedActivity.rawData?.clientId?.userName || "Unknown"}
                            </p>
                            <p>
                              <span className="font-medium">Trainer:</span>{" "}
                              {selectedActivity.rawData?.trainerId?.userName || "Unknown"}
                            </p>
                            <p>
                              <span className="font-medium">Feedback:</span>{" "}
                              {selectedActivity.rawData?.feedback || "No feedback provided"}
                            </p>
                          </div>
                        )}
                        {selectedActivity.type === "notification" && (
                          <div className="space-y-1">
                            <p>
                              <span className="font-medium">From:</span>{" "}
                              {selectedActivity.rawData?.sender?.userName || "System"}
                            </p>
                            <p>
                              <span className="font-medium">To:</span>{" "}
                              {selectedActivity.rawData?.recipient?.userName || "Unknown"}
                            </p>
                            <p>
                              <span className="font-medium">Priority:</span>{" "}
                              {selectedActivity.rawData?.priority || "Normal"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Details - Formatted nicely instead of raw JSON */}
                    {selectedActivity.rawData && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Additional Details</h4>
                        <div className="mt-1 text-sm text-gray-900 max-h-60 overflow-y-auto">
                          <div className="bg-gray-50 p-3 rounded-md">
                            {Object.entries(
                              formatRawDataForDisplay(selectedActivity.rawData, selectedActivity.type) || {},
                            ).map(([key, value]) => (
                              <div key={key} className="flex py-1 border-b border-gray-100 last:border-0">
                                <span className="w-1/3 font-medium capitalize">
                                  {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                                </span>
                                <span className="w-2/3 break-words">
                                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#CE0000] text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CE0000] sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default Activity

