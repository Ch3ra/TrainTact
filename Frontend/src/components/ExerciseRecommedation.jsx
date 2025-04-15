import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API URL - change this to match your Flask backend
const API_URL = 'http://localhost:5000';

const WorkoutForm = () => {
  // Form state
  const [formData, setFormData] = useState({
    available_time: 30,
    fitness_goal: 'strength',
    fitness_level: 'beginner',
    equipment: 'none',
    body_part: 'full'
  });

  // Options for dropdowns
  const [options, setOptions] = useState({
    fitnessGoals: [
      {value: 'strength', label: 'Strength'}, 
      {value: 'cardio', label: 'Cardio'},
      {value: 'weight_loss', label: 'Weight Loss'},
      {value: 'flexibility', label: 'Flexibility'},
      {value: 'muscle_growth', label: 'Muscle Growth'},
      {value: 'endurance', label: 'Endurance'}
    ],
    equipment: [
      {value: 'none', label: 'None'}, 
      {value: 'minimal', label: 'Minimal'},
      {value: 'gym', label: 'Gym'},
      {value: 'machine', label: 'Machine'},
      {value: 'dumbbell', label: 'Dumbbell'},
      {value: 'kettlebell', label: 'Kettlebell'},
      {value: 'resistance bands', label: 'Resistance Bands'}
    ],
    fitnessLevels: [
      {value: 'beginner', label: 'Beginner'},
      {value: 'intermediate', label: 'Intermediate'},
      {value: 'advanced', label: 'Advanced'}
    ],
    bodyParts: [
      {value: 'full', label: 'Full Body'},
      {value: 'upper', label: 'Upper Body'},
      {value: 'lower', label: 'Lower Body'},
      {value: 'core', label: 'Core'},
      {value: 'arms', label: 'Arms'},
      {value: 'legs', label: 'Legs'},
      {value: 'chest', label: 'Chest'},
      {value: 'back', label: 'Back'},
      {value: 'shoulders', label: 'Shoulders'}
    ],
    availableTimes: [
      {value: 15, label: '15 minutes'},
      {value: 20, label: '20 minutes'},
      {value: 30, label: '30 minutes'},
      {value: 45, label: '45 minutes'},
      {value: 60, label: '60 minutes'},
      {value: 90, label: '90 minutes'}
    ]
  });

  // Results state
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'available_time' ? parseInt(value) : value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWorkout(null);

    try {
      // Changed to use the same endpoint as trainer recommendation
      const response = await axios.post(`${API_URL}/api/recommend/workout`, formData);
      setLoading(false);
      
      if (response.data.success) {
        // Format the response to match our workout state structure
        const exercises = response.data.exercises || [];
        
        setWorkout({
          title: `${formData.available_time}-minute ${formData.fitness_goal.replace('_', ' ')} Workout`,
          exercises: exercises.map((ex, idx) => ({
            id: idx + 1,
            name: ex.name,
            time: ex.time,
            bodyPart: ex.body_part,
            difficulty: ex.difficulty
          })),
          totalTime: exercises.reduce((total, ex) => total + ex.time, 0),
          totalExercises: exercises.length,
          bodyPartFocus: formData.body_part,
          equipment: formData.equipment
        });
      } else {
        setError(response.data.message || 'Failed to generate workout');
      }
    } catch (err) {
      setLoading(false);
      setError('Error generating workout: ' + err.message);
    }
  };

  return (
    <div className="workout-container">
      <h1>Personalized Workout Generator</h1>
      
      <div className="workout-form-container">
        <form onSubmit={handleSubmit} className="workout-form">
          <div className="form-group">
            <label htmlFor="available_time">Available Time (minutes):</label>
            <select 
              id="available_time" 
              name="available_time" 
              value={formData.available_time} 
              onChange={handleChange}
            >
              {options.availableTimes.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="fitness_goal">Fitness Goal:</label>
            <select 
              id="fitness_goal" 
              name="fitness_goal" 
              value={formData.fitness_goal} 
              onChange={handleChange}
            >
              {options.fitnessGoals.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="fitness_level">Fitness Level:</label>
            <select 
              id="fitness_level" 
              name="fitness_level" 
              value={formData.fitness_level} 
              onChange={handleChange}
            >
              {options.fitnessLevels.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="equipment">Available Equipment:</label>
            <select 
              id="equipment" 
              name="equipment" 
              value={formData.equipment} 
              onChange={handleChange}
            >
              {options.equipment.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="body_part">Body Part Focus:</label>
            <select 
              id="body_part" 
              name="body_part" 
              value={formData.body_part} 
              onChange={handleChange}
            >
              {options.bodyParts.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="generate-btn" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Workout'}
          </button>
        </form>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {workout && (
        <div className="workout-results">
          <h2>{workout.title}</h2>
          <div className="workout-summary">
            <p><strong>Total Time:</strong> {workout.totalTime} minutes</p>
            <p><strong>Exercises:</strong> {workout.totalExercises}</p>
            <p><strong>Focus:</strong> {workout.bodyPartFocus}</p>
            <p><strong>Equipment:</strong> {workout.equipment}</p>
          </div>

          <h3>Exercise Plan</h3>
          <table className="exercise-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Exercise</th>
                <th>Time (min)</th>
                <th>Body Part</th>
                <th>Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {workout.exercises.map((exercise) => (
                <tr key={exercise.id}>
                  <td>{exercise.id}</td>
                  <td>{exercise.name}</td>
                  <td>{exercise.time}</td>
                  <td>{exercise.bodyPart}</td>
                  <td>{exercise.difficulty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorkoutForm;