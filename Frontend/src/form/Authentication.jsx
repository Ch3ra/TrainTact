import React, { useState } from 'react';
import './Authentication.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Authentication = () => {
  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsActive(!isActive);
  };

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', loginData);
      if (response.status === 200) {
        alert('Login successful!');
        // Save token or user data as needed
        localStorage.setItem('token', response.data.token); // Example of storing token
        navigate('/dashboard'); // Redirect to a dashboard or home page
      } else {
        alert('Login failed! Please check your credentials.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred during login. Please try again.');
    }
  };

  const [registerData, setRegisterData] = useState({
    email: '',
    username: '',
    password: ''
  });

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData({
      ...registerData,
      [name]: value
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/auth/register-client', registerData);
      if (response.status === 200) {
        alert('Registration successful!');
        navigate('/otpForm', { state: { email: registerData.email } }); // Pass email to OTP form
      } else {
        alert('Registration failed! Please try again.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('An error occurred during registration. Please try again.');
    }
  };
  
  return (
    <div className='main-container'>
      <div className={`container ${isActive ? 'active' : ''}`}>
        {/* Login Form */}
        <div className="form-box login">
          <form onSubmit={handleLoginSubmit}>
            <h1 className="text-2xl font-bold mb-4">LOGIN</h1>
            <div className="input-box relative mb-4">
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="Email"
                required
                className="w-full p-3 bg-gray-200 rounded border-none outline-none text-gray-700"
              />
              <i className="bx bxs-envelope absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
            </div>
            <div className="input-box relative mb-4">
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Password"
                required
                className="w-full p-3 bg-gray-200 rounded border-none outline-none text-gray-700"
              />
              <i className="bx bxs-lock-alt absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
            </div>
            <div className="forgot-link mb-4">
              <a href="#" className="text-blue-500">Forgot password?</a>
            </div>
            <button type="submit" className="btn bg-blue-500 text-white py-2 px-4 rounded">Login</button>
          </form>
        </div>

        {/* Register Form */}
        <div className="form-box register">
          <form onSubmit={handleRegisterSubmit}>
            <h1 className="text-2xl font-bold mb-4">CLIENT REGISTRATION</h1>
            <div className="input-box relative mb-4">
              <input
                type="text"
                placeholder="Email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                required
                className="w-full p-3 bg-gray-200 rounded border-none outline-none text-gray-700"
              />
              <i className="bx bxs-envelope absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
            </div>
            <div className="input-box relative mb-4">
              <input
                type="text"
                placeholder="Username"
                name="username"
                value={registerData.username}
                onChange={handleRegisterChange}
                required
                className="w-full p-3 bg-gray-200 rounded border-none outline-none text-gray-700"
              />
              <i className="bx bxs-user absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
            </div>
            <div className="input-box relative mb-4">
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                required
                className="w-full p-3 bg-gray-200 rounded border-none outline-none text-gray-700"
              />
              <i className="bx bxs-lock-alt absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
            </div>
            <button type="submit" className="btn bg-blue-500 text-white py-2 px-4 rounded">Register</button>
            <div className='mt-10'>
              <Link to='/registerTrainer' className="text-sm cursor-pointer">Register as Trainer?</Link>
            </div>
          </form>
        </div>

        {/* Toggle Box */}
        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1 className="text-2xl font-bold">Hello, Welcome!</h1>
            <p>Don't have an account?</p>
            <button
              className="btn register-btn bg-blue-500 text-white py-2 px-4 rounded"
              onClick={toggleForm}
            >
              Register
            </button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1 className="text-2xl font-bold">Welcome Back!</h1>
            <p>Already have an account?</p>
            <button
              className="btn login-btn bg-blue-500 text-white py-2 px-4 rounded"
              onClick={toggleForm}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Authentication;
