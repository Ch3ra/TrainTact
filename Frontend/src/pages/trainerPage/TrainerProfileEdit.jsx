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
    availabilityHours: '',
    description: '',
    startDay: '',
    endDay: '',
    advancedNeeded:"",
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
        setTrainerData(data.trainer);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error fetching trainer information:", error);
    }
  };

  const handleBack = () => {
    console.log('Go back triggered');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Form Submitted', trainerData);

    const formData = new FormData();
    Object.entries(trainerData).forEach(([key, value]) => {
      if (value !== null && key !== 'profilePicture' && key !== 'coverPhoto') {
        formData.append(key, value);
      }
    });

    if (trainerData.profilePicture) {
      formData.append('profilePicture', trainerData.profilePicture);
    }

    if (trainerData.coverPhoto) {
      formData.append('coverPhoto', trainerData.coverPhoto);
    }

    try {
      const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;
      const response = await fetch(`http://localhost:3000/api/trainer/${userId}`, {
        method: 'PATCH',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();
      if (response.ok) {
        console.log('Update successful', result);
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
    const { name, value } = event.target;
    setTrainerData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFileChange = (event, fieldName) => {
    setTrainerData(prevState => ({ ...prevState, [fieldName]: event.target.files[0] }));
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
              id="preview_img"
              className="h-16 w-16 object-cover rounded-full"
              src={trainerData.profilePicture || "https://static.vecteezy.com/system/resources/previews/047/305/447/non_2x/default-avatar-profile-icon-with-long-shadow-simple-user-sign-symbol-vector.jpg"}
              alt="Profile preview"
            />
          </div>
          <label className="block">
            <span className="sr-only">Choose Cover photo</span>
            <input
              type="file"
              name="profilePicture"
              onChange={(e) => handleInputChange({ target: { name: 'profilePicture', value: e.target.files[0] } })}
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
        <label htmlFor="fitnessGoal" className="block text-lg font-medium text-gray-800 mb-1">
              Username
            </label>
            <input
              type="text"
              value={trainerData.userName}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              required
              name="username"
              />
        </div>
        <div className="flex gap-4">
  <div className="mb-6 flex-1">
    <label htmlFor="email" className="block text-lg font-medium text-gray-800 mb-1">
      Email
    </label>
    <input
      type="text"
      value={trainerData.email}
      id="email"
      name="email"
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
      value={trainerData.yearsOfExperience}
      name="yearsOfExperience"
      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
      required
      min="0"
    />
  </div>
</div>
<div className='flex gap-4 mb-5'>
<label htmlFor="yearsOfExperience" className="block text-lg font-medium text-gray-800 mb-1">
              Resume:
            </label>
            <input
              type="file"
              name="resume"
            
              className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-[#CE0000]
              hover:file:bg-violet-100"
              required
            />
          </div>

          

        <div className="mb-6">
          <label htmlFor="fitnessGoal" className="block text-lg font-medium text-gray-800 mb-1">
            Fitness Goal
          </label>
          <input
            type="text"
            value={trainerData.fitnessGoal}
            id="fitnessGoal"
            name="fitnessGoal"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="availableHours" className="block text-lg font-medium text-gray-800 mb-1">
            Available Hours
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <select
              id="availableHours"
              name="availableHours"
              value={trainerData.availabilityHours}
              className="block w-full pl-10 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition duration-150 ease-in-out appearance-none cursor-pointer"
              required
            >
              <option value="" disabled selected>Select available hours</option>
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
        <div className='flex gap-4 mb-5'>
<label htmlFor="yearsOfExperience" className="block text-lg font-medium  w-[175px]
 text-gray-800 mb-1">
              Cover Photo:
            </label>
            <input
              type="file"
              name="coverPhoto"
             
              className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-[#CE0000]
              hover:file:bg-violet-100"
              required
            />
          </div>

        <div className="mb-6 flex gap-6 max-w-3xl">
          <div className="flex-1">
            <label htmlFor="date-range-start" className="block text-lg font-medium text-gray-700 mb-2">
              Start Day
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="date-range-start"
                name="dateRangeStart"
                value={trainerData.startDay}
                className="block w-full pl-10 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition duration-150 ease-in-out appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Select start day</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex-1">
            <label htmlFor="date-range-end" className="block text-lg font-medium text-gray-700 mb-2">
              End Day
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="date-range-end"
                name="dateRangeEnd"
                className="block w-full pl-10 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition duration-150 ease-in-out appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Select end day</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="content" className="block text-lg font-medium text-gray-800 mb-1">
            Description
          </label>
          <ReactQuill
            theme="snow"
            value={trainerData.description}
            onChange={handleContentChange}
            name="content"
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
              value={trainerData.price}
              name="price"
              placeholder="Enter price"
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
              value={trainerData.location}
              id="location"
              name="location"
              placeholder="City, Country"
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
    onChange={(e) => handleInputChange({ target: { name: 'advancedNeeded', value: e.target.checked } })}
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
