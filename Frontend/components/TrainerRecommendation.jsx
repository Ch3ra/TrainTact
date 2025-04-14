import React, { useState, useEffect } from 'react';
import { getTrainerRecommendations } from '../services/trainerRecommendationService';

const TrainerRecommendation = () => {
  const [formData, setFormData] = useState({
    location: '',
    specialization: '',
    minRating: 0,
    minExperience: 0,
    topN: 5
  });
  
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Specialization options based on the AI overview
  const specializationOptions = [
    'Zumba', 'Weight Loss', 'Yoga', 'CrossFit', 'Pilates', 
    'Strength Training', 'Cardio', 'HIIT', 'Dance', 'Sports'
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await getTrainerRecommendations(formData);
      if (result.success) {
        setRecommendations(result.data);
      } else {
        setError('Failed to get recommendations');
      }
    } catch (err) {
      setError('Error: ' + (err.message || 'Failed to get recommendations'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Find Your Perfect Trainer</h2>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter city or area"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
            <select
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select specialization</option>
              {specializationOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
            <input
              type="number"
              name="minRating"
              value={formData.minRating}
              onChange={handleChange}
              min="0"
              max="5"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Experience (years)</label>
            <input
              type="number"
              name="minExperience"
              value={formData.minExperience}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Results</label>
            <input
              type="number"
              name="topN"
              value={formData.topN}
              onChange={handleChange}
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-center">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? 'Finding Trainers...' : 'Find Trainers'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Recommended Trainers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((trainer, index) => (
              <div key={index} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xl font-bold text-gray-600">
                      {trainer.name ? trainer.name.charAt(0) : 'T'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{trainer.name || 'Trainer'}</h4>
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span>{trainer.rating || 'N/A'}</span>
                      <span className="text-gray-500 text-sm ml-1">
                        ({trainer.total_reviews || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <p><span className="font-medium">Location:</span> {trainer.location || 'N/A'}</p>
                  <p><span className="font-medium">Specialization:</span> {trainer.specialization || 'N/A'}</p>
                  <p><span className="font-medium">Experience:</span> {trainer.experience_years || 0} years</p>
                </div>
                
                <button className="w-full mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!loading && recommendations.length === 0 && !error && (
        <div className="text-center text-gray-500 py-8">
          Enter your preferences and click "Find Trainers" to get recommendations
        </div>
      )}
    </div>
  );
};

export default TrainerRecommendation; 