import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MyExercise = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user ID from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        setUserId(decodedToken.id);

        // Fetch exercises created by this user
        fetchUserExercises(decodedToken.id);
      } catch (error) {
        console.error("Error decoding token:", error);
        setError("Authentication error. Please log in again.");
        setLoading(false);
      }
    } else {
      setError("Please log in to view your exercises");
      setLoading(false);
    }
  }, []);

  const fetchUserExercises = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:3000/api/exercises?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setExercises(response.data.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch your exercises");
      setLoading(false);
      console.error("Error fetching exercises:", err);
    }
  };

  const handleEditExercise = (exerciseId) => {
    navigate('/exerciseEditForm', { state: { exerciseId } });
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (window.confirm("Are you sure you want to delete this exercise program?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:3000/api/exercises/${exerciseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Remove from state
        setExercises(exercises.filter(exercise => exercise._id !== exerciseId));
        toast.success("Exercise program deleted successfully");
      } catch (error) {
        console.error("Error deleting exercise:", error);
        toast.error("Failed to delete exercise program");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <div className="text-xl font-medium text-gray-700">Loading your exercises...</div>
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
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Exercise Programs</h1>
        <Link
          to="/exerciseForm"
          className="inline-flex items-center px-5 py-2.5 bg-[#CE0000] text-white rounded-lg font-medium hover:bg-[#AE0000] transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Exercise
        </Link>
      </div>

      {exercises.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No exercise programs yet</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            You haven't created any exercise programs yet. Click the "Add Exercise" button to create your first program.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((exercise) => (
            <div
              key={exercise._id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {exercise.cardPhoto ? (
                <div className="h-48 overflow-hidden">
                  <img
                    src={`http://localhost:3000/${exercise.cardPhoto}`}
                    alt={`Exercise: ${exercise.exerciseGoal || "Fitness training"}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=192&width=384";
                    }}
                  />
                </div>
              ) : (
                <div className="h-48 bg-gray-100 flex items-center justify-center">
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

              <div className="p-5">
                <div className="mb-2">
                  {exercise.exerciseGoal && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {exercise.exerciseGoal}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Exercise Program
                </h3>

                <p className="text-gray-600 text-sm mb-4">
                  A 7-day exercise program with {exercise.days ? exercise.days.length : 0} active days
                </p>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-500">
                    Created {new Date(exercise.createdAt).toLocaleDateString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditExercise(exercise._id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteExercise(exercise._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyExercise;