import React, { useState } from "react";
import "./Authentication.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Authentication = () => {
  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsActive(!isActive);
  };

  // Login state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value,
    });
    setLoginError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true); // Start loading spinner
    setLoginError(""); // Clear previous errors
    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        loginData,
        {
          headers: {
            "Content-Type": "application/json", // Set the correct headers
          },
        }
      );

      // Validate the response
      if (response.status === 200 && response.data.token) {
        console.log("Token from server:", response.data.token); // Log the received token
        localStorage.setItem("token", response.data.token); // Save the token in localStorage
        console.log(
          "Token saved in localStorage:",
          localStorage.getItem("token")
        );

        // Redirect to the appropriate dashboard
        if (response.data.redirectUrl) {
          navigate(response.data.redirectUrl); // Redirect based on backend-provided URL
        } else {
          navigate("/"); // Fallback redirect
        }
      } else {
        throw new Error("Token not received from server.");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setLoginError(error.response.data.message);
      } else {
        setLoginError("An unexpected error occurred. Please try again."); // Fallback error message
      }
    } finally {
      setLoginLoading(false); // Stop loading spinner
    }
  };

  // Register state
  const [registerData, setRegisterData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData({
      ...registerData,
      [name]: value,
    });
    setRegisterError(""); // Clear error on input
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/register-client",
        registerData
      );
      if (response.status === 200) {
        alert("Registration successful!");
        navigate("/otpForm", { state: { email: registerData.email } }); // Navigate to OTP form
      } else {
        setRegisterError("Registration failed! Please try again.");
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setRegisterError(error.response.data.message);
      } else {
        setRegisterError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="main-container">
      <div className={`container ${isActive ? "active" : ""}`}>
        {/* Login Form */}
        <div className="form-box login">
          <form onSubmit={handleLoginSubmit}>
            <h1 className="text-2xl font-bold mb-4">LOGIN</h1>
            {loginError && (
              <div className="text-red-500 mb-4 text-sm">{loginError}</div>
            )}
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
            </div>
            <div className="forgot-link mb-4">
              <Link to="/emailInput" className="text-blue-500">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              className="btn bg-blue-500 text-white py-2 px-4 rounded"
              disabled={loginLoading}
            >
              {loginLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>

        {/* Register Form */}
        <div className="form-box register">
          <form onSubmit={handleRegisterSubmit}>
            <h1 className="text-2xl font-bold mb-4">CLIENT REGISTRATION</h1>
            {registerError && (
              <div className="text-red-500 mb-4 text-sm">{registerError}</div>
            )}
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
            </div>
            <button
              type="submit"
              className="btn bg-blue-500 text-white py-2 px-4 rounded"
              disabled={registerLoading}
            >
              {registerLoading ? "Registering..." : "Register"}
            </button>
            <div className="mt-10">
              <Link to="/registerTrainer" className="text-sm cursor-pointer">
                Register as Trainer?
              </Link>
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
