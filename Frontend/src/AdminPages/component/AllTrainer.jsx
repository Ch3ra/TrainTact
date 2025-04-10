"use client"

import { useState, useEffect } from "react"
import { Search, Filter, ChevronDown, ChevronUp, Eye, User, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import AdminLayout from "../component/AdminSidebar"
import axios from "axios"

export default function TrainersPage() {
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState("joinedDate")
  const [sortDirection, setSortDirection] = useState("desc")
  // Pagination state - Updated to show 10 items per page
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10  // Changed from 5 to 10
  const navigate = useNavigate()

  // Fetch trainers data
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("Fetching trainers data...")
        
        // Fetch verified trainers with dynamic status
        const response = await axios.get("http://localhost:3000/api/trainer/getVerifiedTrainers")
        
        console.log("API Response:", response.data)
        
        if (response.data.success) {
          // Transform API data to match our component's expected format
          // Filter to only include trainers with isOtpVerified = true
          const formattedTrainers = response.data.data
            .filter(trainer => trainer.user?.isOtpVerified === true) // Only include verified trainers
            .map((trainer) => ({
              id: trainer._id,
              userId: trainer.user?._id, // Store the user ID for correct redirection
              name: trainer.user?.userName || "Unknown Trainer",
              email: trainer.user?.email || "No email",
              location: trainer.user?.location || "No location",
              age: trainer.user?.age || "Not specified",
              specialty: trainer.specialty || "Not specified",
              experience: trainer.yearsOfExperience ? `${trainer.yearsOfExperience} years` : "Not specified",
              bibliography: trainer.bibliography || "No bibliography",
              joinedDate: trainer.createdAt || new Date().toISOString(),
              status: trainer.status || "inactive", // This now comes dynamically from backend
              clients: trainer.sessionCounts?.total || 0, // Use session count as client count
              sessionsInfo: trainer.sessionCounts || { 
                upcoming: 0, ongoing: 0, completed: 0, cancelled: 0, total: 0 
              },
              rating: trainer.rating || 0,
              avatar: trainer.user?.profilePicture || null,
            }))
          
          console.log("Formatted trainers:", formattedTrainers)
          setTrainers(formattedTrainers)
        } else {
          console.error("Failed to fetch trainers:", response.data.message)
          setError("Failed to fetch trainers: " + response.data.message)
        }
      } catch (error) {
        console.error("Error fetching trainers:", error)
        setError("Error fetching trainers: " + (error.response?.data?.message || error.message))
      } finally {
        setLoading(false)
      }
    }

    fetchTrainers()
  }, [])

  // Handle trainer detail view
  const handleViewTrainerDetails = (trainerId) => {
    navigate(`/trainerDetails/${trainerId}`)
  }

  // Filter and sort trainers
  const filteredTrainers = trainers
    .filter((trainer) => {
      // Filter by status
      if (filterStatus !== "all" && trainer.status !== filterStatus) return false

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          (trainer.name || "").toLowerCase().includes(query) ||
          (trainer.id || "").toString().toLowerCase().includes(query) ||
          (trainer.specialty || "").toLowerCase().includes(query) ||
          (trainer.location || "").toLowerCase().includes(query)
        )
      }

      return true
    })
    .sort((a, b) => {
      // Sort by selected field
      const valueA = a[sortField] || ""
      const valueB = b[sortField] || ""
      
      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
      return 0
    })

  // Pagination logic - updated for 10 items per page
  const totalPages = Math.ceil(filteredTrainers.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentTrainers = filteredTrainers.slice(indexOfFirstItem, indexOfLastItem)

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  // Truncate ID function
  const truncateId = (id) => {
    if (!id) return "N/A"
    return typeof id === 'string' ? `${id.substring(0, 8)}...` : id
  }

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (error) {
      return "Invalid date"
    }
  }

  // Wrap the content with AdminLayout component
  return (
    <AdminLayout>
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Trainers</h1>
            <p className="text-gray-500 mt-1">Manage all verified trainers on the platform</p>
          </div>
          <Link
            to="/request"
            className="mt-4 md:mt-0 inline-flex items-center justify-center px-6 py-3 bg-[#CE0000] text-white rounded-md hover:bg-[#A00000] transition-colors duration-200 font-medium text-sm"
          >
            View Trainer Requests
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search trainers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#CE0000] focus:border-[#CE0000] focus:outline-none w-full md:w-64"
              />
            </div>

            <div className="relative">
              <div className="flex items-center">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#CE0000] focus:border-[#CE0000] focus:outline-none appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="absolute right-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500 w-full md:w-auto text-right">
            Showing {filteredTrainers.length} of {trainers.length} trainers
          </div>
        </div>

        {/* Trainers Table */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left">
                <tr className="border-b border-gray-200">
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center">
                      ID
                      {sortField === "id" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        ))}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Trainer
                      {sortField === "name" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        ))}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("specialty")}
                  >
                    <div className="flex items-center">
                      Specialty
                      {sortField === "specialty" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        ))}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("experience")}
                  >
                    <div className="flex items-center">
                      Experience
                      {sortField === "experience" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        ))}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("clients")}
                  >
                    <div className="flex items-center">
                      Sessions
                      {sortField === "clients" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        ))}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
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
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CE0000] mb-3"></div>
                        <p className="text-lg font-medium">Loading trainers...</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-red-500">
                      <div className="flex flex-col items-center justify-center py-6">
                        <p className="text-lg font-medium">Error loading trainers</p>
                        <p className="text-sm mt-1">{error}</p>
                      </div>
                    </td>
                  </tr>
                ) : trainers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center py-6">
                        <p className="text-lg font-medium">No verified trainers found in the system.</p>
                        <p className="text-sm text-gray-500 mt-1">
                          All approved trainers with verified accounts will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : currentTrainers.length > 0 ? (
                  currentTrainers.map((trainer) => (
                    <tr key={trainer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {truncateId(trainer.id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            {trainer.avatar ? (
                              <img
                                src={trainer.avatar || "/placeholder.svg"}
                                alt={trainer.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{trainer.name}</div>
                            <div className="text-sm text-gray-500">{trainer.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{trainer.specialty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{trainer.experience}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700">{trainer.clients} total</span>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span className="mr-2 text-green-600">{trainer.sessionsInfo?.upcoming || 0} upcoming</span>
                            <span className="text-blue-600">{trainer.sessionsInfo?.ongoing || 0} ongoing</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            trainer.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {trainer.status.charAt(0).toUpperCase() + trainer.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleViewTrainerDetails(trainer.userId)} 
                          className="text-[#CE0000] hover:text-[#A00000]"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center py-6">
                        <p className="text-lg font-medium">No trainers found matching your filters.</p>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination - Only show if we have trainers */}
          {filteredTrainers.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{Math.min(filteredTrainers.length, 1 + indexOfFirstItem)}</span> to{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredTrainers.length)}
                </span>{" "}
                of <span className="font-medium">{filteredTrainers.length}</span> trainers
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center justify-center w-8 h-8 rounded border ${
                    currentPage === 1 ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {/* Page number buttons - show limited number of pages */}
                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  // Calculate which page numbers to show
                  let pageNum;
                  if (totalPages <= 5) {
                    // Show all pages if 5 or less
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    // Show 1-5 if current page is near start
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    // Show last 5 pages if current page is near end
                    pageNum = totalPages - 4 + idx;
                  } else {
                    // Show 2 before and 2 after current page
                    pageNum = currentPage - 2 + idx;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`relative inline-flex items-center justify-center w-8 h-8 text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-[#CE0000] border-[#CE0000] text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center justify-center w-8 h-8 rounded border ${
                    currentPage === totalPages || totalPages === 0 ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}