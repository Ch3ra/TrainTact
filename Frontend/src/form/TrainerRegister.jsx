import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/images/Logo.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RegistrationForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  const [data, setData] = useState({
    email: "",
    username: "",
    password: "",
    yearsOfExperience: "",
    resume: null,
    profilePicture: null, // Initialize for profile picture
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePicture") {
      const file = files[0];
      setPreviewImg(URL.createObjectURL(file)); // Update the preview image
    }
    setData((prevData) => ({
      ...prevData,
      [name]: files ? files[0] : value,
    }));
  };

  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      for (const key in data) {
        formData.append(key, data[key]);
      }

      const response = await axios.post(
        "http://localhost:3000/api/auth/register-trainer",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        nav("/authentication");
      } else {
        alert("Problem occurred!");
      }
    } catch (error) {
      console.error(error);
      alert("Error during registration!");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen">
      <div className="absolute top-5 left-5">
        <img src={logo} alt="Logo" className="h-8" />
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-lg mt-10">
        <div className="flex justify-center space-x-2">
          <h1 className="text-[28px] font-semibold text-center text-[#CE0000] mb-6">
            Sign Up
          </h1>
          <h1 className="text-[28px] font-medium text-center mb-6">
            As Trainer
          </h1>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
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
                onChange={handleChange}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-violet-50 file:text-[#CE0000]
                  hover:file:bg-violet-100"
              />
            </label>
          </div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              className="border rounded-md p-2 w-full h-8 text-sm"
              required
              name="username"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="border rounded-md p-2 w-full h-8 text-sm"
              name="email"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Years of experience
            </label>
            <input
              type="number"
              name="yearsOfExperience"
              onChange={handleChange}
              className="border rounded-md p-2 w-full h-8 text-sm"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Resume
            </label>
            <input
              type="file"
              name="resume"
              onChange={handleChange}
              className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-violet-50 file:text-[#CE0000]
                  hover:file:bg-violet-100"
              required
            />
          </div>

          

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                onChange={handleChange}
                type={showPassword ? "text" : "password"}
                className="border rounded-md p-2 w-full h-8 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? "👁" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="w-[150px] bg-[#CE0000] text-white py-2 rounded-full transition text-sm"
            >
              Create Account
            </button>
          </div>
        </form>

        <div className="text-center mt-4 text-xs">
          <span className="text-gray-600">Here to hire Trainer?</span>{" "}
          <Link to="/Authentication" className="text-blue-500 hover:underline">
            Join as a Client
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
