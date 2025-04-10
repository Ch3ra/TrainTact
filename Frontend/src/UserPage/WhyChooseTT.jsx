import React from 'react';

const WhyChooseTrainTact = () => {
  return (
    <div className="max-w-7xl mx-auto px-4   sm:px-6 lg:px-8 my-12">
      <div className="bg-white rounded-xl border border-2 shadow-lg flex flex-col md:flex-row items-center justify-between p-6 md:p-8 lg:p-12 gap-8">
        <div className="md:max-w-xs">
          <h2 className="text-3xl md:text-4xl font-bold text-center md:text-left">Why Choose</h2>
          <h2 className="text-3xl md:text-4xl font-bold text-red-600 text-center md:text-left">TrainTact</h2>
        </div>
        
        <div className="text-center flex flex-col items-center gap-4">
          <div className="text-red-600 text-4xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664z"/>
            </svg>
          </div>
          <h3 className="font-semibold text-xl">AI-Powered Matching</h3>
          <p className="text-gray-600 max-w-xs text-center">Our intelligent system recommends trainers based on your goals, preferences, and fitness level</p>
        </div>
        
        <div className="text-center flex flex-col items-center gap-4">
          <div className="text-red-600 text-4xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
            </svg>
          </div>
          <h3 className="font-semibold text-xl">Flexible Scheduling</h3>
          <p className="text-gray-600 max-w-xs text-center">Book sessions that fit your schedule with real-time availability and instant confirmation</p>
        </div>
        
        <div className="text-center flex flex-col items-center gap-4">
          <div className="text-red-600 text-4xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              <path d="M4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z"/>
              <path d="M8 4.5a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
            </svg>
          </div>
          <h3 className="font-semibold text-xl">Personalized Workouts</h3>
          <p className="text-gray-600 max-w-xs text-center">Get customized exercise plans designed specifically for your fitness journey</p>
        </div>
      </div>
    </div>
  );
};

export default WhyChooseTrainTact;