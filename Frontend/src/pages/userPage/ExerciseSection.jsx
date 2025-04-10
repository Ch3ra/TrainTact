"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Calendar, Play, ChevronDown, ChevronUp, X, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import axios from "axios"
import Navbar from "../../public/components/Navbar"

const ExerciseSection = () => {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDays, setExpandedDays] = useState({})
  const [selectedGoal, setSelectedGoal] = useState("All Programs")
  const [sortBy, setSortBy] = useState("Newest First")
  const [selectedTrainers, setSelectedTrainers] = useState([])
  const [selectedLengths, setSelectedLengths] = useState([])
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [trainers, setTrainers] = useState([])
  const [allGoals, setAllGoals] = useState(["All Programs"])
  const [error, setError] = useState(null)

  // Toggle day expansion
  const toggleDayExpansion = (exerciseId, dayNumber) => {
    setExpandedDays((prev) => {
      const key = `${exerciseId}-${dayNumber}`
      return { ...prev, [key]: !prev[key] }
    })
  }

  // Toggle trainer selection
  const toggleTrainer = (trainer) => {
    setSelectedTrainers((prev) => {
      if (prev.includes(trainer)) {
        return prev.filter((t) => t !== trainer)
      } else {
        return [...prev, trainer]
      }
    })
  }

  // Toggle program length selection
  const toggleLength = (length) => {
    setSelectedLengths((prev) => {
      if (prev.includes(length)) {
        return prev.filter((l) => l !== length)
      } else {
        return [...prev, length]
      }
    })
  }

  // Fetch exercises from API
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch exercises from API
        const response = await axios.get("http://localhost:3000/api/exercises")

        // Check if the response has the expected structure
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          // Process the data to match our component structure
          const processedExercises = response.data.data.map((exercise) => {
            // Extract trainer data
            const trainerData = exercise.trainer || {}
            const userData = trainerData.user || {}

            // Format trainer data for display
            const formattedTrainer = {
              _id: trainerData._id || "",
              name: userData.userName || "Unknown Trainer",
              specialty: trainerData.description || "Fitness Trainer",
              photo: userData.profilePicture
                ? `http://localhost:3000/uploads/profilePictures/${userData.profilePicture}`
                : "https://randomuser.me/api/portraits/men/32.jpg",
              yearsOfExperience: trainerData.yearsOfExperience || 0,
              price: trainerData.price || 0,
              availabilityHours: trainerData.availabilityHours || "",
              startDay: trainerData.startDay || "",
              endDay: trainerData.endDay || "",
            }

            // Format image paths
            const cardPhoto = exercise.cardPhoto
              ? `http://localhost:3000/${exercise.cardPhoto}`
              : "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2069&auto=format&fit=crop"

            // Calculate program length
            const programLength = exercise.days && exercise.days.length > 0 ? `${exercise.days.length} days` : "7 days"

            return {
              ...exercise,
              trainer: formattedTrainer,
              cardPhoto,
              programLength,
            }
          })

          setExercises(processedExercises)

          // Extract unique trainers
          const uniqueTrainers = [...new Set(processedExercises.map((ex) => ex.trainer.name))]
          setTrainers(uniqueTrainers)

          // Extract unique goals
          const uniqueGoals = [...new Set(processedExercises.map((ex) => ex.exerciseGoal))]
          setAllGoals(["All Programs", ...uniqueGoals])
        } else {
          throw new Error("Invalid response format from API")
        }
      } catch (err) {
        console.error("Error fetching exercises:", err)
        setError("Failed to load exercises. Please try again later.")
        setExercises([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }

    fetchExercises()
  }, [])

  // Filter exercises based on selections
  const filteredExercises = exercises.filter((exercise) => {
    // Filter by search query
    if (
      searchQuery &&
      !exercise.exerciseGoal.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !exercise.trainer.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Filter by goal
    if (selectedGoal !== "All Programs" && exercise.exerciseGoal !== selectedGoal) {
      return false
    }

    // Filter by trainer
    if (selectedTrainers.length > 0 && !selectedTrainers.includes(exercise.trainer.name)) {
      return false
    }

    // Filter by program length
    if (selectedLengths.length > 0 && !selectedLengths.includes(exercise.programLength)) {
      return false
    }

    // Filter by active status
    if (showActiveOnly && !exercise.isActive) {
      return false
    }

    return true
  })

  // Sort exercises
  const sortedExercises = [...filteredExercises].sort((a, b) => {
    if (sortBy === "Newest First") {
      return new Date(b.createdAt) - new Date(a.createdAt)
    } else if (sortBy === "Oldest First") {
      return new Date(a.createdAt) - new Date(b.createdAt)
    } else if (sortBy === "Trainer Name") {
      return a.trainer.name.localeCompare(b.trainer.name)
    } else if (sortBy === "Goal") {
      return a.exerciseGoal.localeCompare(b.exerciseGoal)
    }
    return 0
  })

  // Program lengths
  const programLengths = [...new Set(exercises.map((ex) => ex.programLength))]

  // Reset filters
  const resetFilters = () => {
    setSelectedGoal("All Programs")
    setSelectedTrainers([])
    setSelectedLengths([])
    setShowActiveOnly(true)
    setSearchQuery("")
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section with Background Image */}
      <div className="relative">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-black"
          style={{
            backgroundImage:
              'url("https://images.pexels.com/photos/416747/pexels-photo-416747.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: "0.7",
            mixBlendMode: "multiply",
          }}
        ></div>

        {/* Content */}
        <div className="relative bg-gradient-to-r from-black/70 to-transparent py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Find Your Perfect Workout Plan</h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/90">
              Browse trainer-created workout programs designed to help you reach your fitness goals
            </p>

            <div className="mt-8 max-w-3xl mx-auto flex">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search by goal, trainer name, or keyword..."
                  className="w-full py-3 pl-10 pr-4 rounded-l-lg text-black focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <button
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-r-lg flex items-center text-white"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={20} />
                <span className="ml-2 hidden md:inline">Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-4/5 h-full overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Filters</h2>
              <button onClick={() => setShowFilters(false)}>
                <X size={24} />
              </button>
            </div>

            <h3 className="font-bold mb-3">Fitness Goals</h3>
            <ul className="space-y-2 mb-6">
              {allGoals.map((goal) => (
                <li key={goal}>
                  <button
                    className={`w-full text-left py-2 flex justify-between items-center ${
                      selectedGoal === goal ? "text-red-600 font-medium" : ""
                    }`}
                    onClick={() => setSelectedGoal(goal)}
                  >
                    <span>{goal}</span>
                    {goal === "All Programs" && (
                      <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full text-xs">
                        {exercises.length}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mb-6">
              <h3 className="font-bold mb-3">Trainers</h3>
              <div className="space-y-2">
                {trainers.map((trainer) => (
                  <label key={trainer} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4"
                      checked={selectedTrainers.includes(trainer)}
                      onChange={() => toggleTrainer(trainer)}
                    />
                    {trainer}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-3">Program Length</h3>
              <div className="space-y-2">
                {programLengths.map((length) => (
                  <label key={length} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4"
                      checked={selectedLengths.includes(length)}
                      onChange={() => toggleLength(length)}
                    />
                    {length}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-3">Status</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4"
                    checked={showActiveOnly}
                    onChange={() => setShowActiveOnly(true)}
                  />
                  Active Programs
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4"
                    checked={!showActiveOnly}
                    onChange={() => setShowActiveOnly(false)}
                  />
                  Archived Programs
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md" onClick={resetFilters}>
                Reset
              </button>
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md"
                onClick={() => setShowFilters(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
            <button className="underline ml-2" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block w-1/4 bg-gray-50 rounded-lg p-6 h-fit sticky top-4">
            <h2 className="text-xl font-bold mb-4">Fitness Goals</h2>
            <ul className="space-y-2">
              {allGoals.map((goal) => (
                <li key={goal}>
                  <button
                    className={`w-full text-left py-2 flex justify-between items-center ${
                      selectedGoal === goal ? "text-red-600 font-medium" : ""
                    }`}
                    onClick={() => setSelectedGoal(goal)}
                  >
                    <span>{goal}</span>
                    {goal === "All Programs" && (
                      <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full text-xs">
                        {exercises.length}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-bold mb-3">Trainers</h3>
              <div className="space-y-2">
                {trainers.map((trainer) => (
                  <label key={trainer} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4"
                      checked={selectedTrainers.includes(trainer)}
                      onChange={() => toggleTrainer(trainer)}
                    />
                    {trainer}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-bold mb-3">Program Length</h3>
              <div className="space-y-2">
                {programLengths.map((length) => (
                  <label key={length} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4"
                      checked={selectedLengths.includes(length)}
                      onChange={() => toggleLength(length)}
                    />
                    {length}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-bold mb-3">Status</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4"
                    checked={showActiveOnly}
                    onChange={() => setShowActiveOnly(true)}
                  />
                  Active Programs
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4"
                    checked={!showActiveOnly}
                    onChange={() => setShowActiveOnly(false)}
                  />
                  Archived Programs
                </label>
              </div>
            </div>

            <button
              className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>

          {/* Main Content */}
          <div className="w-full lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Workout Programs</h2>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 hidden sm:inline">Sort by:</span>
                <select
                  className="border rounded-md px-3 py-1"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option>Newest First</option>
                  <option>Oldest First</option>
                  <option>Trainer Name</option>
                  <option>Goal</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 text-red-600 animate-spin mb-4" />
                <p className="text-gray-500">Loading workout programs...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedExercises.length > 0 ? (
                  sortedExercises.map((exercise) => (
                    <div
                      key={exercise._id}
                      className="border rounded-lg overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Left side with image */}
                        <div className="md:w-2/5 h-64 md:h-auto relative">
                          <img
                            src={exercise.cardPhoto || "/placeholder.svg"}
                            alt={exercise.exerciseGoal}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src =
                                "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2069&auto=format&fit=crop"
                            }}
                          />
                          {!exercise.isActive && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <span className="bg-gray-800 text-white px-3 py-1 rounded">Archived</span>
                            </div>
                          )}
                          {exercise.backgroundVideo && (
                            <button className="absolute bottom-4 right-4 bg-red-600 text-white p-2 rounded-full">
                              <Play size={24} />
                            </button>
                          )}
                        </div>

                        {/* Right side with details */}
                        <div className="p-6 flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-2xl font-bold truncate" title={exercise.exerciseGoal}>
                                {exercise.exerciseGoal.length > 20
                                  ? `${exercise.exerciseGoal.substring(0, 20)}...`
                                  : exercise.exerciseGoal}
                              </h3>
                              <div className="flex items-center mt-2">
                                <img
                                  src={exercise.trainer.photo || "/placeholder.svg"}
                                  alt={exercise.trainer.name}
                                  className="w-8 h-8 rounded-full mr-2"
                                  onError={(e) => {
                                    e.target.src = "https://randomuser.me/api/portraits/men/32.jpg"
                                  }}
                                />
                                <span>
                                  {exercise.trainer.name} • {exercise.trainer.specialty}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                Created{" "}
                                {new Date(exercise.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              {exercise.isActive ? (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full inline-block mt-1">
                                  Active
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full inline-block mt-1">
                                  Archived
                                </span>
                              )}
                            </div>
                          </div>

                          <h4 className="font-bold mt-6 mb-3">{exercise.programLength} Program</h4>
                          <div className="space-y-2">
                            {exercise.days.slice(0, 3).map((day) => {
                              const isExpanded = expandedDays[`${exercise._id}-${day.dayNumber}`]
                              return (
                                <div key={day.dayNumber} className="border rounded-md overflow-hidden">
                                  <button
                                    className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 text-left"
                                    onClick={() => toggleDayExpansion(exercise._id, day.dayNumber)}
                                  >
                                    <div className="flex items-center">
                                      <Calendar className="mr-2 text-red-600" size={18} />
                                      <span>Day {day.dayNumber}</span>
                                    </div>
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </button>
                                  {isExpanded && (
                                    <div className="p-3 bg-white">
                                      <p className="text-gray-700">{day.activities}</p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            {exercise.days.length > 3 && (
                              <div className="text-center text-sm text-gray-500 mt-2">
                                + {exercise.days.length - 3} more days
                              </div>
                            )}
                          </div>

                          <div className="mt-6 flex justify-between">
                            <Link
                              to={`/exercises/${exercise._id}`}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              View Full Program
                            </Link>
                            <button
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                              onClick={() => setSelectedExercise(exercise)}
                            >
                              Select Program
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">No workout programs match your filters.</p>
                    <button className="mt-4 text-red-600 hover:text-red-700 font-medium" onClick={resetFilters}>
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {!loading && sortedExercises.length > 0 && (
              <div className="flex justify-center mt-8">
                <div className="flex">
                  <button className="w-10 h-10 flex items-center justify-center rounded-l bg-red-600 text-white">
                    1
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center border-t border-b border-r hover:bg-gray-100">
                    2
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-r border hover:bg-gray-100">
                    3
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold truncate" title={selectedExercise.exerciseGoal}>
                {selectedExercise.exerciseGoal}
              </h2>
              <button onClick={() => setSelectedExercise(null)} className="hover:bg-gray-100 p-1 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow overflow-auto">
              <div className="flex flex-col md:flex-row h-full">
                <div className="w-full md:w-1/2 h-96 md:h-auto relative">
                  <img
                    src={selectedExercise.cardPhoto || "/placeholder.svg"}
                    alt={selectedExercise.exerciseGoal}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2069&auto=format&fit=crop"
                    }}
                  />
                  {selectedExercise.backgroundVideo && (
                    <button className="absolute bottom-4 right-4 bg-red-600 text-white p-2 rounded-full">
                      <Play size={24} />
                    </button>
                  )}
                </div>

                <div className="p-6 flex-grow overflow-y-auto">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <img
                        src={selectedExercise.trainer.photo || "/placeholder.svg"}
                        alt={selectedExercise.trainer.name}
                        className="w-10 h-10 rounded-full mr-3"
                        onError={(e) => {
                          e.target.src = "https://randomuser.me/api/portraits/men/32.jpg"
                        }}
                      />
                      <div>
                        <div className="font-medium">{selectedExercise.trainer.name}</div>
                        <div className="text-sm text-gray-600">{selectedExercise.trainer.specialty}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Created{" "}
                        {new Date(selectedExercise.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      {selectedExercise.isActive ? (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Archived</span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold mb-3">{selectedExercise.programLength} Program</h3>
                  <div className="space-y-2 mb-6">
                    {selectedExercise.days.map((day) => {
                      const isExpanded = expandedDays[`${selectedExercise._id}-${day.dayNumber}`]
                      return (
                        <div key={day.dayNumber} className="border rounded-md overflow-hidden">
                          <button
                            className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 text-left"
                            onClick={() => toggleDayExpansion(selectedExercise._id, day.dayNumber)}
                          >
                            <div className="flex items-center">
                              <Calendar className="mr-2 text-red-600" size={18} />
                              <span className="font-medium">Day {day.dayNumber}</span>
                            </div>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                          {isExpanded && (
                            <div className="p-3 bg-white">
                              <p className="text-gray-700 whitespace-pre-line">{day.activities}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-between mt-6 ml-[350px]">
                    <Link
                      to={`/exercises/${selectedExercise._id}`}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      View Full Program
                    </Link>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExerciseSection
