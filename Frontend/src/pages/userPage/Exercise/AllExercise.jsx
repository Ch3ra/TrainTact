import React, { useState, useEffect } from "react";
import axios from "axios";
import { Loader2, Play, Search, Filter, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const AllExercise = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/exercises");
        setExercises(response.data.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch exercises");
        setLoading(false);
        console.error("Error fetching exercises:", err);
      }
    };

    fetchExercises();
  }, []);

  // Filter exercises based on search term and selected goal
  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch =
      searchTerm === "" ||
      (exercise.exerciseGoal && exercise.exerciseGoal.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGoal = selectedGoal === "" || (exercise.exerciseGoal && exercise.exerciseGoal === selectedGoal);

    return matchesSearch && matchesGoal;
  });

  // Extract unique exercise goals for filter dropdown
  const uniqueGoals = [...new Set(exercises.map((exercise) => exercise.exerciseGoal))].filter(Boolean);

  // Handle click on exercise card to navigate to details page
  const handleExerciseClick = (exercise) => {
    navigate(`/exercise/${exercise._id}`, { state: { exerciseData: exercise } });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <div className="text-xl font-medium text-gray-700">Loading your exercises...</div>
        <p className="text-gray-500 mt-2">Please wait while we prepare your fitness content</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 px-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg max-w-2xl w-full">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Exercise Library</h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            Discover exercises tailored to your fitness goals and level
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-10 max-w-4xl mx-auto">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search exercises..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg appearance-none focus:ring-primary focus:border-primary bg-white"
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

        {filteredExercises.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No exercises found</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              {searchTerm || selectedGoal
                ? "Try adjusting your search or filter criteria to find more exercises."
                : "There are no exercises available at the moment. Check back later for updates."}
            </p>
            {(searchTerm || selectedGoal) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedGoal("");
                }}
                className="mt-5 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise._id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                onClick={() => handleExerciseClick(exercise)}
              >
                {exercise.cardPhoto ? (
                  <div className="h-56 overflow-hidden relative">
                    <img
                      src={`http://localhost:3000/${exercise.cardPhoto}`}
                      alt={`Exercise: ${exercise.exerciseGoal || "Fitness training"}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=224&width=400";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {exercise.backgroundVideo && (
                      <a
                        href={`http://localhost:3000/${exercise.backgroundVideo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-4 right-4 bg-white/90 text-primary p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white"
                        aria-label="Watch video"
                        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking on video button
                      >
                        <Play className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="h-56 bg-gray-100 flex items-center justify-center">
                    <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center mb-4">
                    {exercise.trainer && exercise.trainer.user && (
                      <>
                        <div className="mr-3">
                          {exercise.trainer.user.profilePicture ? (
                            <img
                              src={`http://localhost:3000/uploads/profilePictures/${exercise.trainer.user.profilePicture}`}
                              alt={exercise.trainer.user.userName || "Trainer"}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg?height=40&width=40";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shadow-sm border-2 border-white">
                              {exercise.trainer.user.userName ? (
                                exercise.trainer.user.userName.charAt(0).toUpperCase()
                              ) : (
                                <User className="h-5 w-5" />
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Trainer</p>
                          <p className="font-medium text-gray-900">{exercise.trainer.user.userName || "Anonymous"}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    {exercise.exerciseGoal && (
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {exercise.exerciseGoal}
                        </span>
                      </div>
                    )}

                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {exercise.exerciseName || "Fitness Exercise"}
                    </h3>

                    <p className="text-gray-600 text-sm">
                      Click to view the complete 7-day exercise plan
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredExercises.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-gray-500">
              Showing {filteredExercises.length} of {exercises.length} exercises
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllExercise;