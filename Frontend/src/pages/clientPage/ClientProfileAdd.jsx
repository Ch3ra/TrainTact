import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ArrowLeft } from 'lucide-react';
import { useNavigate} from 'react-router-dom';


const ClientProfileAdd = () => {
  
  const [previewImg, setPreviewImg] = useState(null);
  const [userId, setUserId] = useState(null);
  const [description, setDescription] = useState(""); // State to store the user ID
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      setUserId(decodedToken.id); // Setting userId in state
    }
  }, []);

  const handleDescriptionChange = (value) => {
    setDescription(value);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setPreviewImg(URL.createObjectURL(e.target.files[0])); // Set the preview image
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!userId) {
      console.error("User ID is not set.");
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', e.target.profilePicture.files[0]); // Directly accessing the file from the input
    formData.append('fitnessGoal', e.target.fitnessGoal.value);
    formData.append('height', e.target.height.value);
    formData.append('weight', e.target.weight.value);
    formData.append('fitnessLevel', e.target.fitnessLevel.value);
    formData.append('location', e.target.location.value);
    formData.append('description',description);

    fetch(`http://localhost:3000/api/client/${userId}`, {
      method: 'POST',
      body: formData,
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      navigate('/profile'); // Redirect or handle response
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 rounded-full bg-red-700 p-2 inline-flex items-center justify-center text-white"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
        Add Profile Information
      </h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="flex items-center justify-center space-x-6 mb-5">
          <div className="shrink-0">
            <img
              id="preview_img"
              className="h-16 w-16 object-cover rounded-full"
              src={
                previewImg ||
                "https://static.vecteezy.com/system/resources/previews/047/305/447/non_2x/default-avatar-profile-icon-with-long-shadow-simple-user-sign-symbol-vector.jpg"
              }
              alt="Profile preview"
            />
          </div>
          <label className="block">
            <span className="sr-only">Choose profile photo</span>
            <input
              type="file"
              name="profilePicture"
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
        
        <div className="mb-6 flex space-x-4">
          <div className="w-1/2">
            <label htmlFor="fitnessLevel" className="block text-lg font-medium text-gray-800 mb-1">
              Fitness Level
            </label>
            <select 
              id="fitnessLevel" 
              name="fitnessLevel" 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 appearance-none bg-white bg-clip-padding bg-no-repeat"
              style={{ 
                backgroundPosition: 'right 0.5rem center', 
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 20 20\' fill=\'%236b7280\'%3e%3cpath fill-rule=\'evenodd\' d=\'M10 3a1 1 0 01.707.293l4 4a1 1 0 01-1.414 1.414L11 6.414V15a1 1 0 11-2 0V6.414L6.707 8.707a1 1 0 01-1.414-1.414l4-4A1 1 0 0110 3zm0 12a1 1 0 100 2 1 1 0 000-2z\' clip-rule=\'evenodd\'/%3e%3c/svg%3e")', 
                backgroundSize: '1.25em 1.25em'
              }}
              required
            >
              <option value="">Select Fitness Level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div className="w-1/2">
            <label htmlFor="height" className="block text-lg font-medium text-gray-800 mb-1">
              Height
            </label>
            <input 
              type="number" 
              id="height" 
              name="height" 
              placeholder="Height in CM"
              min="0" 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500" 
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500" 
          />
        </div>

        <div className="mb-6">
          <label htmlFor="content" className="block text-lg font-medium text-gray-800 mb-1">
            Description
          </label>
          <ReactQuill 
            theme="snow" 
            value={description} 
            onChange={handleDescriptionChange} 
            name="content"
          />
        </div>

        <div className="mb-6 flex space-x-4">
          <div className="w-1/2">
            <label htmlFor="weight" className="block text-lg font-medium text-gray-800 mb-1">
              Weight
            </label>
            <input 
              type="number" 
              id="weight" 
              name="weight" 
              placeholder="Weight in KG"
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
              placeholder="City, Country"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500" 
            />
          </div>
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

export default ClientProfileAdd;





