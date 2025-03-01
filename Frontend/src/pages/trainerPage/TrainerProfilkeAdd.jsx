import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Calendar, ArrowLeft, ChevronDown, Clock } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import axios from 'axios'; // Ensure axios is installed

const TrainerProfileAdd = () => {
  const [userId, setUserId] = useState('');
  const [content, setContent] = useState("");
  const [previewImg, setPreviewImg] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      setUserId(decodedToken.id); // Setting userId in state
    }
  }, []);

  const handleContentChange = (value) => {
    setContent(value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImg(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('price', e.target.price.value);
    formData.append('availabilityHours', e.target.availableHours.value);
    formData.append('description', content);
    formData.append('fitnessGoal', e.target.fitnessGoal.value);
    formData.append('location', e.target.location.value);
    formData.append('startDay', e.target.dateRangeStart.value);
    formData.append('endDay', e.target.dateRangeEnd.value);
    formData.append('coverPhoto', e.target.coverphoto.files[0]);
    formData.append('advancedNeeded', e.target.advancedNeeded.checked);

    try {
      const response = await axios.post(`http://localhost:3000/api/trainer/add/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming your backend uses Bearer token
        }
      });
      console.log(response.data);
      
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleBack = () => {
    navigate(-1);
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
        Add Trainer Profile Information
      </h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="flex items-center justify-center space-x-6 mb-5">
          <div className="shrink-0"> 
            <img
              id="preview_img"
              className="h-16 w-16 object-cover rounded-full"
              src={previewImg || "https://static.vecteezy.com/system/resources/previews/047/305/447/non_2x/default-avatar-profile-icon-with-long-shadow-simple-user-sign-symbol-vector.jpg"}
              alt="Profile preview"
            />
          </div>
          <label className="block">
            <span className="sr-only">Choose Cover photo</span>
            <input
              type="file"
              name="coverphoto"
              onChange={handleFileChange}
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
          <label
            htmlFor="fitnessGoal"
            className="block text-lg font-medium text-gray-800 mb-1"
          >
            Fitness Goal
          </label>
          <input
            type="text"
            id="fitnessGoal"
            name="fitnessGoal"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="mb-6">
  <label
    htmlFor="availableHours"
    className="block text-lg font-medium text-gray-800 mb-1"
  >
    Available Hours
  </label>
  <div className="relative">
    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
      <Clock className="h-5 w-5 text-gray-400" /> {/* Assuming Clock icon is available in your icons package */}
    </div>
    <select
      id="availableHours"
      name="availableHours"
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
      <ChevronDown className="h-5 w-5 text-gray-400" /> {/* Ensure ChevronDown icon is correctly imported */}
    </div>
  </div>
</div>

        <div className="mb-6 flex gap-6 max-w-3xl">
          <div className="flex-1">
            <label 
              htmlFor="date-range-start" 
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              Start Day
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="date-range-start"
                name="dateRangeStart"
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
            <label 
              htmlFor="date-range-end" 
              className="block text-lg font-medium text-gray-700 mb-2"
            >
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
          <label
            htmlFor="content"
            className="block text-lg font-medium text-gray-800 mb-1"
          >
            Description
          </label>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleContentChange}
            name="content"
          />
        </div>

        <div className="mb-6 flex space-x-4">
          <div className="w-1/2">
            <label
              htmlFor="price"
              className="block text-lg font-medium text-gray-800 mb-1"
            >
              Price
            </label>
            <input
              type="number"
              id="price"
              name="price"
              placeholder="Enter price"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="w-1/2">
            <label
              htmlFor="location"
              className="block text-lg font-medium text-gray-800 mb-1"
            >
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              placeholder="City, Country"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>


        <div className="mb-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              id="advancedNeeded"
              name="advancedNeeded"
              className="form-checkbox h-5 w-5 text-red-700 rounded border-gray-300 focus:ring-red-700 cursor-pointer"
            />
            <span className="text-lg font-medium text-gray-800">Advanced Needed</span>
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

export default TrainerProfileAdd;
