import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, ChevronDown, Clock } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TrainerProfileEdit = () => {
  const [trainerData, setTrainerData] = useState({
    userName: '',
    email: '',
    profilePicture: null,
    fitnessGoal: '',
    location: '',
    yearsOfExperience: 0,
    price: 0,
    availabilityTime: '',
    description: '',
    startDay: '',
    endDay: '',
    advancedNeeded: false,
    coverPhoto: null
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      fetchTrainerData(decodedToken.id);
    }
  }, []);

  const fetchTrainerData = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/trainer/details/${userId}`);
      const data = await response.json();
      if (response.ok) {
        setTrainerData({
          ...data.trainer,
          advancedNeeded: data.trainer.advancedNeeded || false
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error fetching trainer information:", error);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    const { startDay, endDay, ...restData } = trainerData;

    // Append all fields except files
    Object.entries(restData).forEach(([key, value]) => {
      if (value !== null) {
        formData.append(key, value);
      }
    });

    // Handle combined days
    if (startDay && endDay) {
      formData.append('availableDays', `${startDay}-${endDay}`);
    }

    // Append files
    if (trainerData.profilePicture instanceof File) {
      formData.append('profilePicture', trainerData.profilePicture);
    }
    if (trainerData.coverPhoto instanceof File) {
      formData.append('coverPhoto', trainerData.coverPhoto);
    }

    try {
      const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;
      const response = await fetch(`http://localhost:3000/api/trainer/trainer/${userId}`, {
        method: 'PATCH',
        body: formData,
        headers: {  
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();
      if (response.ok) {
        alert('Profile updated successfully!');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error updating trainer profile:', error);
      alert('Failed to update profile: ' + error.message);
    }
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setTrainerData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (event, fieldName) => {
    const file = event.target.files[0];
    if (file) {
      setTrainerData(prevState => ({
        ...prevState,
        [fieldName]: file
      }));
    }
  };

  const handleContentChange = (value) => {
    setTrainerData(prevState => ({ ...prevState, description: value }));
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 rounded-full bg-red-700 p-2 inline-flex items-center justify-center text-white"
        style={{ boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-6 border-b pb-3 border-gray-200">
        Edit Trainer Profile Information
      </h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="flex items-center justify-center space-x-6 mb-5">
          <div className="shrink-0">
            <img
              className="h-16 w-16 object-cover rounded-full"
              src={
                trainerData.profilePicture instanceof File 
                  ? URL.createObjectURL(trainerData.profilePicture)
                  : trainerData.profilePicture || "https://static.vecteezy.com/system/resources/previews/047/305/447/non_2x/default-avatar-profile-icon-with-long-shadow-simple-user-sign-symbol-vector.jpg"
              }
              alt="Profile preview"
            />
          </div>
          <label className="block">
            <span className="sr-only">Choose profile picture</span>
            <input
  type="file"
  name="profilePicture"
  onChange={(e) => handleFileChange(e, 'profilePicture')}
  className="block w-full text-sm text-slate-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-violet-50 file:text-[#CE0000]
                     hover:file:bg-violet-100"
/>
            {/* <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'profilePicture')}
              className="block w-full text-sm text-slate-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-violet-50 file:text-[#CE0000]
                     hover:file:bg-violet-100"
            /> */}
          </label>
        </div>

        <div className="mb-6">
          <label htmlFor="userName" className="block text-lg font-medium text-gray-800 mb-1">
            Username
          </label>
          <input
            type="text"
            id="userName"
            name="userName"
            value={trainerData.userName}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        <div className="flex gap-4">
          <div className="mb-6 flex-1">
            <label htmlFor="email" className="block text-lg font-medium text-gray-800 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={trainerData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="mb-6 flex-1">
            <label htmlFor="yearsOfExperience" className="block text-lg font-medium text-gray-800 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              id="yearsOfExperience"
              name="yearsOfExperience"
              value={trainerData.yearsOfExperience}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              min="0"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="fitnessGoal" className="block text-lg font-medium text-gray-800 mb-1">
            Fitness Goal
          </label>
          <input
            type="text"
            id="fitnessGoal"
            name="fitnessGoal"
            value={trainerData.fitnessGoal}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="availabilityTime" className="block text-lg font-medium text-gray-800 mb-1">
            Available Hours
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <select
              id="availabilityTime"
              name="availabilityTime"
              value={trainerData.availabilityTime}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition duration-150 ease-in-out appearance-none cursor-pointer"
              required
            >
              <option value="" disabled>Select available hours</option>
              <option value="morning">Morning</option>
              <option value="mid_day">Mid-Day</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-lg font-medium text-gray-800 mb-1">
            Cover Photo
          </label>

          <input
  type="file"
  name="coverPhoto"
  onChange={(e) => handleFileChange(e, 'coverPhoto')}
  className="block w-full text-sm text-slate-500
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-violet-50 file:text-[#CE0000]
                   hover:file:bg-violet-100"
/>
          {/* <input
            type="file"
            name="coverPhoto"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'coverPhoto')}
            className="block w-full text-sm text-slate-500
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-violet-50 file:text-[#CE0000]
                   hover:file:bg-violet-100"
          /> */}
        </div>

        <div className="mb-6 flex gap-6">
          <div className="flex-1">
            <label htmlFor="startDay" className="block text-lg font-medium text-gray-700 mb-2">
              Start Day
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="startDay"
                name="startDay"
                value={trainerData.startDay}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition duration-150 ease-in-out appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Select start day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>
          </div>

          <div className="flex-1">
            <label htmlFor="endDay" className="block text-lg font-medium text-gray-700 mb-2">
              End Day
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="endDay"
                name="endDay"
                value={trainerData.endDay}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition duration-150 ease-in-out appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Select end day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="block text-lg font-medium text-gray-800 mb-1">
            Description
          </label>
          <ReactQuill
            theme="snow"
            value={trainerData.description}
            onChange={handleContentChange}
            className="h-48 mb-12"
          />
        </div>

        <div className="mb-6 flex space-x-4">
          <div className="w-1/2">
            <label htmlFor="price" className="block text-lg font-medium text-gray-800 mb-1">
              Price
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={trainerData.price}
              onChange={handleInputChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="w-1/2">
            <label htmlFor="location" className="block text-lg font-medium text-gray-800 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={trainerData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mb-6 flex items-center space-x-3">
          <input
            type="checkbox"
            id="advancedNeeded"
            name="advancedNeeded"
            checked={trainerData.advancedNeeded}
            onChange={handleInputChange}
            className="h-5 w-5 text-indigo-600 border-gray-300 rounded"
          />
          <label htmlFor="advancedNeeded" className="text-lg font-medium text-gray-800">
            Advanced needed?
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-red-700 text-white font-semibold rounded-md hover:bg-red-800 focus:outline-none"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrainerProfileEdit;