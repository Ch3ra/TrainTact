"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import AdminLayout from "./AdminSidebar"
import { Link } from "react-router-dom"

const ExerciseAdminDashboard = () => {
  // State management
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGoal, setSelectedGoal] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [sortField, setSortField] = useState("createdAt")
  const [sortDirection, setSortDirection] = useState("desc")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch exercises from API
  const fetchExercises = async () => {
    setLoading(true)
    try {
      const response = await axios.get("http://localhost:3000/api/exercises")
      setExercises(response.data.data)
      setTotalPages(Math.ceil(response.data.data.length / itemsPerPage))
      setLoading(false)
    } catch (err) {
      setError("Failed to fetch exercises: " + (err.response?.data?.message || err.message))
      setLoading(false)
      console.error("Error fetching exercises:", err)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchExercises()
  }, [])

  // Delete exercise
  const handleDelete = async () => {
    if (!selectedExercise) return

    setLoading(true)
    try {
      await axios.delete(`http://localhost:3000/api/exercises/${selectedExercise._id}`)

      // Remove from state
      setExercises(exercises.filter((ex) => ex._id !== selectedExercise._id))
      setShowDeleteModal(false)
      setSelectedExercise(null)
      setLoading(false)
    } catch (err) {
      setError("Failed to delete exercise: " + (err.response?.data?.message || err.message))
      setLoading(false)
      console.error("Error deleting exercise:", err)
      setShowDeleteModal(false)
    }
  }

  // Open delete confirmation modal
  const handleDeleteClick = (exercise) => {
    setSelectedExercise(exercise)
    setShowDeleteModal(true)
  }

  // Open view exercise modal
  const handleViewClick = (exercise) => {
    setSelectedExercise(exercise)
    setShowViewModal(true)
  }

  // Filter exercises based on search term and selected goal
  const filteredExercises = exercises
    .filter((exercise) => {
      const matchesSearch =
        searchTerm === "" ||
        (exercise.exerciseGoal && exercise.exerciseGoal.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesGoal = selectedGoal === "" || (exercise.exerciseGoal && exercise.exerciseGoal === selectedGoal)
      return matchesSearch && matchesGoal
    })
    .sort((a, b) => {
      // Handle sorting
      const valueA = a[sortField] || ""
      const valueB = b[sortField] || ""

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
      return 0
    })

  // Extract unique exercise goals for filter dropdown
  const uniqueGoals = [...new Set(exercises.map((exercise) => exercise.exerciseGoal))].filter(Boolean)

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredExercises.slice(indexOfFirstItem, indexOfLastItem)

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

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

  // Get exercise days description
  const getExerciseDaysDescription = (exercise) => {
    if (!exercise.days || exercise.days.length === 0) {
      return <p className="text-gray-500 italic">No exercise days defined</p>
    }

    return (
      <div className="space-y-4">
        {exercise.days.map((day, index) => (
          <div key={index} className="border-b border-gray-200 pb-3 last:border-0">
            <h4 className="font-medium text-gray-900 mb-1">Day {day.dayNumber}</h4>
            <p className="text-gray-700 whitespace-pre-line">{day.activities || "No activities defined"}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <AdminLayout className="bg-gray-50 min-h-screen pb-16">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-900">Exercise Management Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">View and manage all exercise programs</p>
            </div>
            <Link to="/exerciseForm">
              <button className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200">
                <span className="text-lg mr-1">+</span>
                Create New Exercise
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search exercises..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-red-500 focus:border-red-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <select
                className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg appearance-none focus:ring-red-500 focus:border-red-500 bg-white"
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
              >
                <option value="">All Goals</option>
                {uniqueGoals.map((goal) => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Loading exercises...</p>
          </div>
        ) : error && exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <svg
              className="h-12 w-12 text-red-500 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium text-gray-700 mb-2">Error Loading Data</p>
            <p className="text-gray-500 mb-4 text-center">{error}</p>
            <button
              onClick={fetchExercises}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200">
            <svg
              className="h-12 w-12 text-gray-400 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No exercises found</h3>
            <p className="text-gray-500 mb-4 text-center max-w-md">
              {searchTerm || selectedGoal
                ? "Try adjusting your search or filter criteria to find more exercises."
                : "There are no exercises available. Click 'Create New Exercise' to add one."}
            </p>
            {(searchTerm || selectedGoal) && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedGoal("")
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Exercise Table */}
            <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("exerciseGoal")}
                      >
                        <div className="flex items-center">
                          Exercise Goal
                          {sortField === "exerciseGoal" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Image
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Days
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center">
                          Created
                          {sortField === "createdAt" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              )}
                            </span>
                          )}
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
                    {currentItems.map((exercise) => (
                      <tr key={exercise._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {exercise.exerciseGoal || "No goal specified"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {exercise.cardPhoto ? (
                            <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100">
                              <img
                                className="h-full w-full object-cover"
                                src={`http://localhost:3000/${exercise.cardPhoto}`}
                                alt={exercise.exerciseGoal || "Exercise"}
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/40"
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                              <svg
                                className="h-6 w-6"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {exercise.days ? exercise.days.length : 0} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(exercise.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewClick(exercise)}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200 mr-4"
                            title="View Details"
                          >
                            <svg
                              className="h-5 w-5 inline"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(exercise)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-4 sm:mb-0">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-medium">{Math.min(indexOfLastItem, filteredExercises.length)}</span> of{" "}
                <span className="font-medium">{filteredExercises.length}</span> exercises
              </div>
              <div className="flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (num) => num === 1 || num === totalPages || (num >= currentPage - 1 && num <= currentPage + 1),
                    )
                    .map((number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === number
                            ? "z-10 bg-red-50 border-red-500 text-red-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {number}
                      </button>
                    ))}

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedExercise && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-red-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Exercise</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this exercise? This action cannot be undone.
                      </p>
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-900">{selectedExercise.exerciseGoal}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                  onClick={handleDelete}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Exercise Modal */}
      {showViewModal && selectedExercise && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Exercise Details</h3>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setShowViewModal(false)}
                  >
                    <span className="sr-only">Close</span>
                    <svg
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
                      {selectedExercise.cardPhoto ? (
                        <img
                          src={`http://localhost:3000/${selectedExercise.cardPhoto}`}
                          alt={selectedExercise.exerciseGoal || "Exercise"}
                          className="w-full h-full object-center object-cover"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300"
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg
                            className="h-16 w-16 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">Exercise Goal</h4>
                      <p className="mt-1 text-lg font-medium text-gray-900">
                        {selectedExercise.exerciseGoal || "No goal specified"}
                      </p>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">Created</h4>
                      <p className="mt-1 text-gray-900">{formatDate(selectedExercise.createdAt)}</p>
                    </div>

                    {selectedExercise.trainer && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500">Trainer</h4>
                        <p className="mt-1 text-gray-900">
                          {selectedExercise.trainer.user?.userName || "Unknown trainer"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Exercise Program</h4>
                    <div className="border rounded-md p-4 bg-gray-50 overflow-y-auto max-h-96">
                      {getExerciseDaysDescription(selectedExercise)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors duration-200"
                  onClick={() => setShowViewModal(false)}
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

export default ExerciseAdminDashboard

