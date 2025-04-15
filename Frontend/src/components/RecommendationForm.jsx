import React, { useState } from 'react';
import axios from 'axios';

import TrainerCard from './TrainerCard';

const RecommendationForm = () => {
  const [formData, setFormData] = useState({
    height: '',
    age: '',
    bodyweight: '',
    goal: 'decrease'
  });
  
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'age' || name === 'height' || name === 'bodyweight' ? parseInt(value) || '' : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:5000/api/recommend', formData);
      setRecommendation(response.data);
    } catch (err) {
      setError('Failed to get recommendation. Please try again.');
      console.error('Error fetching recommendation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recommendation-container">
      <form onSubmit={handleSubmit} className="recommendation-form">
        <h2>Enter Your Information</h2>
        
        <div className="form-group">
          <label htmlFor="height">Height (cm)</label>
          <input
            type="number"
            id="height"
            name="height"
            value={formData.height}
            onChange={handleChange}
            required
            min="100"
            max="250"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="age">Age</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
            min="18"
            max="100"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="bodyweight">Body Weight (kg)</label>
          <input
            type="number"
            id="bodyweight"
            name="bodyweight"
            value={formData.bodyweight}
            onChange={handleChange}
            required
            min="30"
            max="300"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="goal">Goal</label>
          <select
            id="goal"
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            required
          >
            <option value="decrease">Decrease Weight</option>
            <option value="increase">Increase Weight</option>
          </select>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Getting Recommendation...' : 'Get Recommendation'}
        </button>
        
        {error && <p className="error-message">{error}</p>}
      </form>
      
      {recommendation && (
        <div className="recommendation-result">
          <h2>Your Recommended Trainer</h2>
          <p>{recommendation.message}</p>
          <TrainerCard trainer={recommendation.trainer} />
        </div>
      )}
    </div>
  );
};

export default RecommendationForm;