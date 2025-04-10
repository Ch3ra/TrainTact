import React, { useEffect, useState } from 'react';
import Card from '../public/components/Card';
import axios from 'axios'; // Make sure axios is installed
import { useNavigate } from 'react-router-dom';

const TopRatedTrainer = () => {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopTrainers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3000/api/ratings/top-trainers?limit=3');
        setTrainers(response.data.trainers || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching top trainers:', err);
        setError('Failed to load top trainers');
        setLoading(false);
        // Set trainers to empty array on error to prevent undefined
        setTrainers([]);
      }
    };

    fetchTopTrainers();
  }, []);

  // Fallback data in case API fails or returns empty
  const fallbackTrainers = [
    {
      id: 1,
      name: "Alex Johnson",
      role: "Strength & Conditioning",
      image: "https://images.pexels.com/photos/258007/pexels-photo-258007.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      rating: 4.9
    },
    {
      id: 2,
      name: "Sarah Miller",
      role: "Yoga & Flexibility",
      image: "https://images.pexels.com/photos/258007/pexels-photo-258007.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      rating: 4.7
    },
    {
      id: 3,
      name: "Michael Chen",
      role: "Nutrition Coach",
      image: "https://images.pexels.com/photos/258007/pexels-photo-258007.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      rating: 4.8
    },
  ];

  // Use fallback data if API returns empty or fails
  // Make sure we have a valid array to work with
  const displayTrainers = trainers && trainers.length > 0 ? trainers : fallbackTrainers;

  return (
    <div className="w-full max-w-7xl bg-gray-200 mx-auto py-10 px-4">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">Top Rated Trainers</h1>
        <h2 className="text-2xl font-semibold text-red-600 mb-6">of TrainTact</h2>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Our highest-rated fitness professionals are ready to help you achieve your goals with
          personalized training plans and expert guidance.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center text-red-600 py-5">
          {error}
        </div>
      )}

      {/* Trainers Grid */}
      {!loading && (
        <div className="flex flex-wrap justify-center gap-6">
          {displayTrainers.map((trainer) => (
            <div key={trainer.id || trainer.trainerId || Math.random().toString()}>
              <Card 
               image={trainer.profilePicture ? `http://localhost:3000/uploads/profilePictures/${trainer.profilePicture}` : (trainer.image || "/placeholder-trainer.jpg")} 
                name={trainer.name}
                role={trainer.description || "Fitness Trainer"}
                rating={trainer.averageRating || trainer.rating}
              />
            </div>
          ))}
        </div>
      )}

      {/* View All Button */}
      <div className="text-center mt-12">
        
        <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full flex items-center mx-auto"onClick={() => navigate('/trainerExplore')}>
        
          View All Trainers 
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 ml-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M14 5l7 7m0 0l-7 7m7-7H3" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TopRatedTrainer;