import React from 'react';

function ExerciseDescription() {
  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-150 ease-in-out flex items-center">
          <span className="mr-2">&#x2190;</span> 
          Back
        </button>
        <h1 className="text-2xl font-bold text-center flex-grow">Weight Gain</h1>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <h2 className="text-lg font-semibold">Day {i + 1}</h2>
            <p>Pectorals, Triceps, Abdominals</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExerciseDescription;
