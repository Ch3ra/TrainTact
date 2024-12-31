import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email; // Get email from navigation state
  const otp = location.state?.otp; // Get OTP from navigation state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    // Validate that password and confirmPassword match in the frontend
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      // Send email, otp, and newPassword to the backend
      const response = await axios.post("http://localhost:3000/api/auth/resetPassword", {
        email,
        otp,
        newPassword: password, // Only send the new password
      });

      if (response.status === 200) {
        setSuccessMessage(response.data.message);
        setTimeout(() => {
          navigate("/authentication"); // Redirect to login page after success
        }, 2000);
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      setErrorMessage(serverMessage || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative mx-auto w-full max-w-md bg-white px-6 pt-10 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:rounded-xl sm:px-10 mt-[60px]"
    >
      <div className="w-full">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-900">Change Password</h1>
          <p className="mt-2 text-gray-500">
            Your new password must be different from previously used passwords.
          </p>
        </div>
        <div className="mt-5">
          <form onSubmit={handleSubmit}>
            <div className="relative mt-6">
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Password"
                className="peer mt-1 w-full border-b-2 border-gray-300 px-0 py-1 placeholder:text-transparent focus:border-gray-500 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label
                htmlFor="password"
                className="pointer-events-none absolute top-0 left-0 origin-left -translate-y-1/2 transform text-sm text-gray-800 opacity-75 transition-all duration-100 ease-in-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-0 peer-focus:pl-0 peer-focus:text-sm peer-focus:text-gray-800"
              >
                Password
              </label>
            </div>
            <div className="relative mt-6">
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                placeholder="Confirm Password"
                className="peer mt-1 w-full border-b-2 border-gray-300 px-0 py-1 placeholder:text-transparent focus:border-gray-500 focus:outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <label
                htmlFor="confirmPassword"
                className="pointer-events-none absolute top-0 left-0 origin-left -translate-y-1/2 transform text-sm text-gray-800 opacity-75 transition-all duration-100 ease-in-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-0 peer-focus:pl-0 peer-focus:text-sm peer-focus:text-gray-800"
              >
                Confirm Password
              </label>
            </div>
            {errorMessage && (
              <div className="text-sm text-red-500 mt-2">{errorMessage}</div>
            )}
            {successMessage && (
              <div className="text-sm text-green-500 mt-2">{successMessage}</div>
            )}
            <div className="my-6">
              <button
                type="submit"
                className="w-full rounded-md bg-black px-3 py-4 text-white focus:bg-gray-600 focus:outline-none"
                disabled={loading}
              >
                {loading ? "Changing..." : "Change"}
              </button>
            </div>
            <p className="text-center text-sm text-gray-500">
              Do you want to Login?{" "}
              <a
                href="/authentication"
                className="font-semibold text-gray-600 hover:underline focus:text-gray-800 focus:outline-none"
              >
                Login Here!
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
