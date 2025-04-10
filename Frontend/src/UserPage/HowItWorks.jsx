import React from 'react';

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      title: "Find Your Perfect Trainer",
      description: "Browse our marketplace of certified fitness professionals or let our AI match you with trainers who specialize in your goals.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: 2,
      title: "Book & Connect",
      description: "Schedule sessions that fit your calendar and connect with your trainer through chat and video calls for personalized guidance.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 3,
      title: "Access Custom Workouts",
      description: "Explore exercises added by your trainer and follow along with detailed instructions tailored to your training program.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 4,
      title: "Track Your Progress",
      description: "Monitor your fitness journey with detailed analytics and receive real-time feedback from your trainer to stay on track.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  // Feature boxes highlighting specific capabilities
  const features = [
    {
      id: 1,
      title: "AI-Powered Matching",
      description: "Our intelligent system analyzes your goals, preferences, and fitness level to recommend the most suitable trainers for you.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: 2,
      title: "Custom Exercise Library",
      description: "Your trainer creates personalized workout plans with detailed exercise demonstrations you can access anytime, anywhere.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      id: 3,
      title: "Secure Video Sessions",
      description: "Connect with your trainer through our integrated WebRTC video platform for face-to-face guidance without leaving home.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-red-600 tracking-wide uppercase">Our Process</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            How TrainTact Works
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            TrainTact connects you with professional trainers through a seamless, AI-powered platform.
          </p>
        </div>

        {/* Steps section */}
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center transform transition duration-500 hover:scale-105">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Exercise Library Highlight */}
        <div className="mt-20 bg-gradient-to-r from-red-600 to-red-800 rounded-xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-white">Custom Exercise Library</h3>
              <p className="mt-4 text-white text-opacity-90">
                Trainers create personalized exercise programs that you can access anytime through your dashboard. Each exercise includes:
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-red-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Video demonstrations on the Exercise.</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-red-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Detailed instructions and modification options will be provided by the Trainer's.</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-red-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Can feel the change Physically and Mentally.</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-red-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Ability to add the exercises in your profile.</span>
                </li>
              </ul>
              <button className="mt-8 bg-white text-red-600 font-medium rounded-lg px-6 py-3 inline-flex items-center hover:bg-gray-100 transition-colors">
                Learn More
                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            <div className="bg-red-700 p-6 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Barbell Squat</h4>
                    <p className="text-sm text-gray-500">Added by Alex Johnson</p>
                  </div>
                </div>
                <div className="h-40 bg-gray-200 rounded mb-4 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="mb-4">
                  <h5 className="font-medium mb-2">Instructions:</h5>
                  <p className="text-sm text-gray-600">Stand with feet shoulder-width apart, barbell across shoulders. Lower body by bending knees, keep chest up. Return to starting position.</p>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <div className="font-medium text-red-600">3</div>
                    <div className="text-xs text-gray-500">Sets</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-red-600">12</div>
                    <div className="text-xs text-gray-500">Reps</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-red-600">60s</div>
                    <div className="text-xs text-gray-500">Rest</div>
                  </div>
                </div>
                <button className="w-full bg-red-600 text-white text-sm font-medium py-2 rounded hover:bg-red-700 transition-colors">
                  Mark as Complete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features boxes */}
        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.id} className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-lg overflow-hidden">
              <div className="p-8">
                <div className="w-12 h-12 rounded-lg bg-red-800 bg-opacity-50 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white text-opacity-80">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;