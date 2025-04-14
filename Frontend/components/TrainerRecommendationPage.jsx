import React from 'react';
import TrainerRecommendation from './TrainerRecommendation';

const TrainerRecommendationPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Trainer Recommendation System</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our AI-powered recommendation system helps you find the perfect trainer based on your preferences.
            Enter your requirements below to get personalized trainer recommendations.
          </p>
        </div>
        
        <TrainerRecommendation />
        
        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-medium mb-2">Enter Your Preferences</h3>
              <p className="text-gray-600 text-sm">
                Specify your location, preferred specialization, and other criteria.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-medium mb-2">AI Analysis</h3>
              <p className="text-gray-600 text-sm">
                Our AI analyzes thousands of trainers to find the best matches for you.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-medium mb-2">Get Recommendations</h3>
              <p className="text-gray-600 text-sm">
                Receive a list of trainers that best match your preferences and requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerRecommendationPage; 