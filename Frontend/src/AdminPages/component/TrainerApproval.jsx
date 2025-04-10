"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  Search,
  Filter,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  Calendar,
  Award,
  FileText,
  User,
  Mail,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import AdminLayout from "../component/AdminSidebar"

export default function TrainerRequestsPage() {
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTrainer, setSelectedTrainer] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState("submittedDate")
  const [sortDirection, setSortDirection] = useState("desc")
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [isResumePreviewOpen, setIsResumePreviewOpen] = useState(false)
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [pdfError, setPdfError] = useState(false)
  const [pdfUrl, setPdfUrl] = useState("")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Reset PDF state when modal opens
  useEffect(() => {
    if (isResumePreviewOpen && selectedTrainer) {
      setPdfLoaded(false)
      setPdfError(false)
      fetchPdfUrl(selectedTrainer.resume)
    }
  }, [isResumePreviewOpen, selectedTrainer])

  // Function to fetch PDF content or URL
  const fetchPdfUrl = async (resumeFileName) => {
    if (!resumeFileName) return

    try {
      // Try different possible URL patterns for the PDF
      const possibleUrls = [
        `http://localhost:3000/api/trainer/getResume/${resumeFileName}`,
        `http://localhost:3000/uploads/resumes/${resumeFileName}`,
        `http://localhost:3000/uploads/${resumeFileName}`,
        `http://localhost:3000/${resumeFileName}`,
        // Add more potential URLs if needed
      ]

      // Try each URL until one works
      for (const url of possibleUrls) {
        try {
          const response = await axios.get(url, {
            responseType: "blob",
          })

          if (response.status === 200) {
            // Create a blob URL from the response
            const blob = new Blob([response.data], { type: "application/pdf" })
            const blobUrl = URL.createObjectURL(blob)
            setPdfUrl(blobUrl)
            setPdfLoaded(true)
            return
          }
        } catch (error) {
          // Continue to the next URL if this one fails
          console.log(`Failed to fetch PDF from ${url}`)
        }
      }

      // If we get here, none of the URLs worked
      throw new Error("Could not find PDF at any expected location")
    } catch (error) {
      console.error("Error fetching PDF:", error)
      setPdfError(true)

      // Set a fallback URL for direct access attempt
      setPdfUrl(`http://localhost:3000/uploads/resumes/${resumeFileName}`)
    }
  }

  // Fetch trainer data from the backend
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/trainer/getAllTrainers")

        // Transform API data to match our component's expected format
        const formattedTrainers = response.data.data.map((trainer) => ({
          _id: trainer._id,
          user: trainer.user || {},
          specialty: trainer.specialty || "Not specified",
          experience: trainer.yearsOfExperience || "Not specified",
          bibliography: trainer.bibliography || "No bibliography provided",
          resume: trainer.resume, // Just store the filename
          submittedDate: trainer.createdAt || new Date().toISOString(),
          status: "pending", // Default status from API
          documents: trainer.resume
            ? [
                {
                  name: "Resume.pdf",
                  type: "resume",
                  size: "Unknown",
                },
              ]
            : [],
          bio: trainer.bio || "No biography provided.",
        }))

        setTrainers(formattedTrainers)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching trainers:", error)
        setLoading(false)
      }
    }

    fetchTrainers()
  }, [])

  // Filter and sort trainers
  const filteredTrainers = trainers
    .filter((trainer) => {
      // Filter by status
      if (filterStatus !== "all" && trainer.status !== filterStatus) return false

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          (trainer.user?.userName || "").toLowerCase().includes(query) ||
          trainer._id.toLowerCase().includes(query) ||
          (trainer.specialty || "").toLowerCase().includes(query) ||
          (trainer.user?.location || "").toLowerCase().includes(query)
        )
      }

      return true
    })
    .sort((a, b) => {
      // Handle sorting for nested properties
      if (sortField === "name") {
        const nameA = a.user?.userName || ""
        const nameB = b.user?.userName || ""
        return sortDirection === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
      }

      // Handle sorting for other fields
      const valueA = a[sortField] || ""
      const valueB = b[sortField] || ""

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
      return 0
    })

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredTrainers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredTrainers.length / itemsPerPage)

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

  // Handle trainer confirmation
  const handleApprove = async (userId) => {
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
        // Update the trainer status in our state
        setTrainers(
          trainers.map((trainer) => (trainer.user._id === userId ? { ...trainer, status: "approved" } : trainer)),
        )

        if (selectedTrainer?.user._id === userId) {
          setSelectedTrainer({ ...selectedTrainer, status: "approved" })
        }
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
  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to decline this trainer? This action cannot be undone.")) {
      return
    }

    setActionLoading(true)
    try {
      const response = await axios.delete(`http://localhost:3000/api/trainer/deleteTrainer/${id}`)

      if (response.data.success) {
        alert("Trainer declined successfully.")
        // Remove the declined trainer from the list
        setTrainers(trainers.filter((trainer) => trainer._id !== id))

        if (selectedTrainer?._id === id) {
          setIsDetailModalOpen(false)
        }
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

  // Open detail modal
  const openDetailModal = (trainer) => {
    setSelectedTrainer(trainer)
    setIsDetailModalOpen(true)
  }

  // Handle PDF load error
  const handlePdfError = () => {
    setPdfError(true)
    setPdfLoaded(false)
  }

  // Handle PDF load success
  const handlePdfLoad = () => {
    setPdfLoaded(true)
    setPdfError(false)
  }

  // Function to handle resume download
  const handleDownloadResume = async (resumeFileName, trainerName = "trainer") => {
    if (!resumeFileName) return

    try {
      // Try different possible URL patterns for the PDF
      const possibleUrls = [
        `http://localhost:3000/api/trainer/getResume/${resumeFileName}`,
        `http://localhost:3000/uploads/resumes/${resumeFileName}`,
        `http://localhost:3000/uploads/${resumeFileName}`,
        `http://localhost:3000/${resumeFileName}`,
      ]

      let pdfBlob = null

      // Try each URL until one works
      for (const url of possibleUrls) {
        try {
          const response = await axios.get(url, {
            responseType: "blob",
          })

          if (response.status === 200) {
            pdfBlob = new Blob([response.data], { type: "application/pdf" })
            break
          }
        } catch (error) {
          // Continue to the next URL if this one fails
          console.log(`Failed to fetch PDF from ${url}`)
        }
      }

      if (!pdfBlob) {
        // If direct fetching failed, try to get it from the getAllTrainers API
        try {
          // This assumes your getAllTrainers API might have the PDF data embedded
          const response = await axios.get(`http://localhost:3000/api/trainer/getTrainerById/${selectedTrainer._id}`)

          if (response.data.success && response.data.data.resumeData) {
            // If the API returns base64 data
            const base64Data = response.data.data.resumeData
            const binaryData = atob(base64Data)
            const array = new Uint8Array(binaryData.length)
            for (let i = 0; i < binaryData.length; i++) {
              array[i] = binaryData.charCodeAt(i)
            }
            pdfBlob = new Blob([array], { type: "application/pdf" })
          }
        } catch (error) {
          console.error("Error fetching PDF from trainer API:", error)
        }
      }

      if (!pdfBlob) {
        throw new Error("Could not download PDF from any source")
      }

      // Create a download link
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${trainerName}_resume.pdf`
      document.body.appendChild(a)
      a.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Failed to download the resume. Please try again later.")

      // Last resort: try to open the PDF in a new tab
      window.open(`http://localhost:3000/uploads/resumes/${resumeFileName}`, "_blank")
    }
  }

  // Stats for summary cards
  const stats = {
    total: trainers.length,
    pending: trainers.filter((t) => t.status === "pending").length,
    approved: trainers.filter((t) => t.status === "approved").length,
    rejected: trainers.filter((t) => t.status === "rejected").length,
  }

  return (
    <AdminLayout>
      <div className="w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Trainer Requests</h1>
          <p className="text-gray-500 mt-1">Review and manage trainer verification requests</p>
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
                  placeholder="Search trainers..."
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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 border-t pt-3 sm:border-t-0 sm:pt-0">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-medium">{Math.min(indexOfLastItem, filteredTrainers.length)}</span> of{" "}
              <span className="font-medium">{filteredTrainers.length}</span> requests
            </div>
          </div>
        </div>

        {/* Requests Table */}
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden sm:table-cell"
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                    onClick={() => handleSort("submittedDate")}
                  >
                    <div className="flex items-center">
                      Submitted
                      {sortField === "submittedDate" &&
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
                        <p className="text-lg font-medium">Loading trainers...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((trainer) => (
                    <tr key={trainer._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {trainer._id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            {trainer.user?.profilePicture ? (
                              <img
                                src={trainer.user.profilePicture || "/placeholder.svg"}
                                alt={trainer.user.userName}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {trainer.user?.userName || "Unknown Trainer"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {trainer.user?.location || "Location not specified"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trainer.specialty || "Not specified"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {trainer.experience || "Not specified"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {trainer.submittedDate ? new Date(trainer.submittedDate).toLocaleDateString() : "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            trainer.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : trainer.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {trainer.status.charAt(0).toUpperCase() + trainer.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => openDetailModal(trainer)}
                            className="text-[#CE0000] hover:text-[#A00000] transition-colors duration-200"
                            title="View details"
                            disabled={actionLoading}
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {trainer.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(trainer.user._id)}
                                className="text-green-600 hover:text-green-800 transition-colors duration-200"
                                title="Approve"
                                disabled={actionLoading}
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleReject(trainer._id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Reject"
                                disabled={actionLoading}
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center py-6">
                        <FileText className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-lg font-medium">No trainer requests found</p>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTrainers.length > 0 && (
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
                    <span className="font-medium">{Math.min(indexOfLastItem, filteredTrainers.length)}</span> of{" "}
                    <span className="font-medium">{filteredTrainers.length}</span> results
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
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scaleIn">
            <div className="flex justify-between items-center border-b p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Trainer Request Details</h3>
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
                      {selectedTrainer.user?.profilePicture ? (
                        <img
                          src={selectedTrainer.user.profilePicture || "/placeholder.svg"}
                          alt={selectedTrainer.user.userName}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">
                        {selectedTrainer.user?.userName || "Unknown Trainer"}
                      </h4>
                      <div className="flex items-center text-gray-500">
                        <Award className="h-4 w-4 mr-1 text-[#CE0000]" />
                        <span>
                          {selectedTrainer.specialty || "Specialty not specified"} •{" "}
                          {selectedTrainer.experience || "Experience not specified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-[#CE0000] mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                        <p className="text-gray-900">{selectedTrainer.user?.email || "Email not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-[#CE0000] mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Age</p>
                        <p className="text-gray-900">{selectedTrainer.user?.age || "Age not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-[#CE0000] mr-3 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Submitted Date</p>
                        <p className="text-gray-900">
                          {selectedTrainer.submittedDate
                            ? new Date(selectedTrainer.submittedDate).toLocaleDateString()
                            : "Unknown date"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Bibliography</h5>
                    <p className="text-gray-900 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200 leading-relaxed">
                      {selectedTrainer.bibliography || "No bibliography provided."}
                    </p>
                  </div>
                </div>

                {/* Right column - Documents */}
                <div className="md:w-1/2">
                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-3">Submitted Documents</h5>
                  <div className="space-y-3 mb-6">
                    {selectedTrainer.resume ? (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200">
                        <div
                          className="flex items-center cursor-pointer flex-grow"
                          onClick={() => setIsResumePreviewOpen(true)}
                        >
                          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Resume</p>
                            <p className="text-xs text-gray-500 mt-0.5 capitalize">Document</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadResume(selectedTrainer.resume, selectedTrainer.user?.userName)
                          }}
                          className="text-[#CE0000] hover:text-[#A00000] hover:bg-red-50 rounded-full p-2 transition-colors duration-200"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
                        No documents have been submitted
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <h5 className="text-xs font-medium text-gray-500 uppercase mb-3">Request Status</h5>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedTrainer.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : selectedTrainer.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedTrainer.status.charAt(0).toUpperCase() + selectedTrainer.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500 ml-3">
                        {selectedTrainer.status === "pending"
                          ? "Awaiting review"
                          : selectedTrainer.status === "approved"
                            ? "Trainer verified"
                            : "Request declined"}
                      </span>
                    </div>
                  </div>

                  {selectedTrainer.status === "pending" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          handleApprove(selectedTrainer.user._id)
                          setIsDetailModalOpen(false)
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-colors duration-200 shadow-sm"
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Check className="h-5 w-5 mr-2" />
                        )}
                        Approve Trainer
                      </button>
                      <button
                        onClick={() => {
                          handleReject(selectedTrainer._id)
                          setIsDetailModalOpen(false)
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-colors duration-200 shadow-sm"
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                          <X className="h-5 w-5 mr-2" />
                        )}
                        Reject Request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t p-4 flex justify-end bg-gray-50">
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

      {/* Resume Preview Modal */}
      {isResumePreviewOpen && selectedTrainer && selectedTrainer.resume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col animate-scaleIn">
            <div className="flex justify-between items-center border-b p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Resume Preview - {selectedTrainer.user?.userName || "Trainer"}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadResume(selectedTrainer.resume, selectedTrainer.user?.userName)}
                  className="text-[#CE0000] hover:text-[#A00000] flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setIsResumePreviewOpen(false)}
                  className="text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 p-1 transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-grow overflow-auto p-0 flex items-center justify-center bg-gray-100 relative">
              {/* PDF Viewer with fallback using embed and object tags */}
              <div className="w-full h-full flex flex-col">
                {!pdfError && pdfUrl ? (
                  <object
                    data={pdfUrl}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    className="w-full h-full"
                    onError={handlePdfError}
                    onLoad={handlePdfLoad}
                  >
                    {/* If object fails, try iframe with Google Docs Viewer */}
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
                      width="100%"
                      height="100%"
                      className="w-full h-full"
                      onError={handlePdfError}
                    >
                      <div className="text-center p-8">
                        <FileText className="h-16 w-16 text-[#CE0000] mx-auto mb-4" />
                        <h4 className="text-lg font-medium mb-2">Resume Preview</h4>
                        <p className="text-gray-500 mb-4">
                          Unable to display the PDF. Please try downloading it instead.
                        </p>
                      </div>
                    </iframe>
                  </object>
                ) : (
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 text-[#CE0000] mx-auto mb-4" />
                    <h4 className="text-lg font-medium mb-2">Resume Preview</h4>
                    <p className="text-gray-500 mb-4">
                      {pdfLoaded ? "Loading PDF..." : "We're unable to display the PDF directly here."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => handleDownloadResume(selectedTrainer.resume, selectedTrainer.user?.userName)}
                        className="bg-white hover:bg-gray-50 text-gray-800 py-2 px-4 rounded-lg font-medium border border-gray-300 flex items-center justify-center transition-colors duration-200 shadow-sm"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download Resume
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t p-4 flex justify-end bg-gray-50">
              <button
                onClick={() => setIsResumePreviewOpen(false)}
                className="bg-white hover:bg-gray-50 text-gray-800 py-2 px-4 rounded-lg font-medium border border-gray-300 transition-colors duration-200 shadow-sm"
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

