import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ArrowLeft } from 'lucide-react';

const ClientProfileEdit = () => {
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState({
    userName: '',
    email: '',
    fitnessGoal: '',
    height: '',
    weight: '',
    fitnessLevel: '',
    description: '',
    location: ''
  });

  // Get token and userId from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setToken(token);
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      setUserId(decodedToken.id);
      console.log("Token:", token);
      console.log("Decoded User ID:", decodedToken.id);
    }
  }, []);

  // Fetch user data when userId is available
  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        try {
          const response = await fetch(`http://localhost:3000/api/client/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            // Map the nested API response to our form structure
            setUserData({
              userName: data.user.userName || '',
              email: data.user.email || '',
              fitnessGoal: data.user.fitnessGoal || '',
              height: data.clientDetails.height || '',
              weight: data.clientDetails.weight || '',
              fitnessLevel: data.clientDetails.fitnessLevel || '',
              description: data.clientDetails.description || '',
              location: data.user.location || '',
              profilePicture: data.user.profilePicture || ''
            });
            console.log("Mapped User Data:", data);
          } else {
            console.error("Failed to fetch user data");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [userId, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuillChange = (value) => {
    setUserData(prev => ({
      ...prev,
      description: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      console.error("No user ID available for update");
      return;
    }
  
    // Construct the API data based on your form state
    // const apiData = {
    //   user: {
    //     userName: userData.userName,
    //     email: userData.email,
    //     fitnessGoal: userData.fitnessGoal,
    //     location: userData.location
    //   },
    //   clientDetails: {
    //     height: userData.height,
    //     weight: userData.weight,
    //     fitnessLevel: userData.fitnessLevel,
    //     description: userData.description
    //   }
    // };
    const formData= new FormData();
    formData.append('profilePicture', userData.profilePicture)
    formData.append('userName', userData.userName)
    formData.append('email', userData.email)
    formData.append('fitnessGoal', userData.fitnessGoal)
    formData.append('fitnessLevel', userData.fitnessLevel)
    formData.append('description', userData.description)
    formData.append('location', userData.location)
    formData.append('height', userData.height)
    formData.append('weight', userData.weight)
    
    try {
      // Attempt to submit the data via PUT request
      const response = await fetch(`http://localhost:3000/api/client/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData, // Sending the formData object directly
      });
  
      if (response.ok) {
        console.log("Profile updated successfully");
        // Optionally, fetch the updated data to update the UI or inform the user
        const updatedData = await response.json();
        console.log("Updated data received:", updatedData);
      } else {
        console.error("Failed to update profile, Status:", response.status);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <button
        onClick={() => console.log('Go back')}
        className="absolute top-4 left-4 rounded-full bg-red-700 p-2 inline-flex items-center justify-center text-white"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Edit Profile Information</h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="flex items-center justify-center space-x-6 mb-5">
          <div className="shrink-0">
            <img
              className="h-16 w-16 object-cover rounded-full"
              src={userData.profilePicture || "https://static.vecteezy.com/system/resources/previews/047/305/447/non_2x/default-avatar-profile-icon-with-long-shadow-simple-user-sign-symbol-vector.jpg"}
              alt="Profile preview"
            />
          </div>
          <label className="block">
            <span className="sr-only">Choose profile photo</span>
            <input
              type="file"
              name="profilePicture"
              accept="image/*"
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-violet-50 file:text-[#CE0000]
                hover:file:bg-violet-100"
            />
          </label>
        </div>

        <div className="mb-6">
          <label htmlFor="userName" className="block text-lg font-medium text-gray-800 mb-1">User Name</label>
          <input
            type="text"
            id="userName"
            name="userName"
            value={userData.userName}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            placeholder="Enter user name"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="email" className="block text-lg font-medium text-gray-800 mb-1">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={userData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            placeholder="Enter email"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="fitnessGoal" className="block text-lg font-medium text-gray-800 mb-1">Fitness Goal</label>
          <input
            type="text"
            id="fitnessGoal"
            name="fitnessGoal"
            value={userData.fitnessGoal}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="height" className="block text-lg font-medium text-gray-800 mb-1">Height (cm)</label>
          <input
            type="number"
            id="height"
            name="height"
            value={userData.height}
            onChange={handleInputChange}
            placeholder="Height in CM"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="weight" className="block text-lg font-medium text-gray-800 mb-1">Weight (kg)</label>
          <input
            type="number"
            id="weight"
            name="weight"
            value={userData.weight}
            onChange={handleInputChange}
            placeholder="Weight in KG"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="fitnessLevel" className="block text-lg font-medium text-gray-800 mb-1">Fitness Level</label>
          <select
            id="fitnessLevel"
            name="fitnessLevel"
            value={userData.fitnessLevel}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
          >
            <option value="">Select Fitness Level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="block text-lg font-medium text-gray-800 mb-1">Description</label>
          <ReactQuill
            theme="snow"
            value={userData.description}
            onChange={handleQuillChange}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="location" className="block text-lg font-medium text-gray-800 mb-1">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={userData.location}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            placeholder="City, Country"
          />
        </div>

        <div className="flex justify-end mt-5">
          <button
            type="submit"
            className="px-6 py-2 bg-red-700 text-white font-semibold rounded-md hover:bg-red-800 focus:outline-none"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientProfileEdit;