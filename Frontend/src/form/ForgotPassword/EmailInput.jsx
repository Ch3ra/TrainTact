import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const EmailInput = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:3000/api/auth/forgotPassword", { email });

      if (response.status === 200) {
        setSuccessMessage(response.data.message);
        setTimeout(() => {
          // Navigate to OTP form with email passed as state for forgotPassword action
          navigate("/otpForm", { state: { email, action: "forgotPassword" } });
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
    <div id="content" role="main" className="w-full max-w-md mx-auto p-6 flex justify-center items-center mt-[80px]">
      <div className="mt-7 rounded-xl shadow-lg dark:border-gray-700 border-2 border-indigo-300">
        <div className="p-4 sm:p-7">
          <div className="text-center">
            <h1 className="block text-2xl font-bold text-gray-800">Forgot password?</h1>
            <p className="mt-2 text-sm">
              Remember your password?{" "}
              <button
                onClick={() => navigate("/authentication")}
                className="text-blue-600 decoration-2 hover:underline font-medium"
              >
                Login here
              </button>
            </p>
          </div>

          <div className="mt-5">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold ml-1 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="py-3 px-4 block w-full border-2 border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                      required
                      aria-describedby="email-error"
                    />
                  </div>
                  <p className="hidden text-xs text-red-600 mt-2" id="email-error">
                    Please include a valid email address so we can get back to you
                  </p>
                </div>
                {errorMessage && (
                  <div className="text-sm text-red-500 mt-2">{errorMessage}</div>
                )}
                {successMessage && (
                  <div className="text-sm text-green-500 mt-2">{successMessage}</div>
                )}
                <button
                  type="submit"
                  className="py-3 px-4 inline-flex justify-center items-center gap-2 rounded-md border border-transparent font-semibold bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Next"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailInput;
