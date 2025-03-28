import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';
import { Loader2, Play, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ExerciseDescription = () => {
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams(); // Get the exercise ID from URL
  const location = useLocation();
  const exerciseData = location.state?.exerciseData; // Get any passed exercise data
  
  useEffect(() => {
    const fetchExerciseDetails = async () => {
      try {
        // If we already have the exercise data from navigation state, use it
        if (exerciseData) {
          setExercise(exerciseData);
          setLoading(false);
          return;
        }
        
        // Otherwise fetch it from the API
        const response = await axios.get(`http://localhost:3000/api/exercises/${id}`);
        setExercise(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch exercise details');
        setLoading(false);
        console.error('Error fetching exercise details:', err);
      }
    };

    fetchExerciseDetails();
  }, [id, exerciseData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <div className="text-xl font-medium text-gray-700">Loading exercise details...</div>
      </div>
    );
  }

  if (error || !exercise) {
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
              <p className="text-red-700 mt-1">{error || "Exercise not found"}</p>
              <Link
                to="/exercises"
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Back to exercises
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/exercises" className="inline-flex items-center text-gray-600 hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to all exercises
        </Link>

        <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
          {/* Hero section */}
          <div className="relative">
            {exercise.cardPhoto ? (
              <div className="h-64 sm:h-80 md:h-96 w-full relative">
                <img
                  src={`http://localhost:3000/${exercise.cardPhoto}`}
                  alt={`Exercise: ${exercise.exerciseGoal || "Fitness training"}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=384&width=768";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              </div>
            ) : (
              <div className="h-64 sm:h-80 md:h-96 bg-gray-100 flex items-center justify-center">
                <svg className="h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            {/* Video button */}
            {exercise.backgroundVideo && (
              <a
                href={`http://localhost:3000/${exercise.backgroundVideo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-6 right-6 inline-flex items-center px-4 py-2 bg-white text-primary rounded-full shadow-lg hover:bg-gray-50 transition-colors"
              >
                <Play className="h-5 w-5 mr-2" />
                Watch Video
              </a>
            )}

            {/* Trainer info */}
            {exercise.trainer && exercise.trainer.user && (
              <div className="absolute bottom-6 left-6 flex items-center">
                <div className="mr-3">
                  {exercise.trainer.user.profilePicture ? (
                    <img
                      src={`http://localhost:3000/uploads/profilePictures/${exercise.trainer.user.profilePicture}`}
                      alt={exercise.trainer.user.userName || "Trainer"}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=48&width=48";
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-semibold border-2 border-white shadow-sm">
                      {exercise.trainer.user.userName ? exercise.trainer.user.userName.charAt(0).toUpperCase() : "T"}
                    </div>
                  )}
                </div>
                <div className="text-white">
                  <p className="text-sm opacity-90">Trainer</p>
                  <p className="font-semibold text-white">{exercise.trainer.user.userName || "Anonymous"}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-8">
              {exercise.exerciseGoal && (
                <div className="mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                    {exercise.exerciseGoal}
                  </span>
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {exercise.exerciseName || "7-Day Exercise Plan"}
              </h1>
              <p className="mt-2 text-gray-600">
                {exercise.description || "Follow this 7-day exercise plan to achieve your fitness goals."}
              </p>
            </div>

            {/* 7-Day Plan Section */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">7-Day Exercise Plan</h2>
              <div className="space-y-4">
                {exercise.days && exercise.days.length > 0 ? (
                  exercise.days.map((day) => (
                    <div key={day._id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Day {day.dayNumber}</h3>
                      <p className="text-gray-600">{day.activities}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No daily exercise plan available</p>
                )}
              </div>
            </div>

            {/* Trainer Details Section */}
            {exercise.trainer && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">About the Trainer</h2>
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:mr-6 mb-4 sm:mb-0">
                    {exercise.trainer.user && exercise.trainer.user.profilePicture ? (
                      <img
                        src={`http://localhost:3000/uploads/profilePictures/${exercise.trainer.user.profilePicture}`}
                        alt={exercise.trainer.user.userName || "Trainer"}
                        className="w-20 h-20 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=80&width=80";
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-primary text-white flex items-center justify-center font-semibold">
                        {exercise.trainer.user && exercise.trainer.user.userName
                          ? exercise.trainer.user.userName.charAt(0).toUpperCase()
                          : "T"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">
                      {exercise.trainer.user ? exercise.trainer.user.userName : "Anonymous Trainer"}
                    </h3>
                    {exercise.trainer.yearsOfExperience && (
                      <p className="text-gray-600 mt-1">
                        <span className="font-medium">Experience:</span> {exercise.trainer.yearsOfExperience} years
                      </p>
                    )}
                    {exercise.trainer.description && (
                      <div
                        className="mt-2 text-gray-600 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: exercise.trainer.description }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDescription;