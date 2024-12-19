import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const OtpForm = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false); 
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email; 

  const BASE_API_URL = "http://localhost:3000/api/auth";

  const handleInputChange = (e, index) => {
    const { value } = e.target;
    if (value.length === 1 && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    const otp = inputsRef.current.map((input) => input.value).join("");
    if (otp.length !== 4) {
      setErrorMessage("Please enter a valid 4-digit OTP.");
      setLoading(false);
      return;
    }

    try {
      if (!email) {
        throw new Error("Email is required to verify OTP.");
      }

      const response = await axios.post(`${BASE_API_URL}/verifyOtp`, { otp, email });

      if (response.data?.message) {
        setSuccessMessage(response.data.message);
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      setErrorMessage(
        serverMessage || "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setResending(true);

    try {
      if (!email) {
        throw new Error("Email is required to resend OTP.");
      }

      const response = await axios.post(`${BASE_API_URL}/resendOtp`, { email });

      if (response.data?.message) {
        setSuccessMessage(response.data.message);
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      setErrorMessage(
        serverMessage || "An unexpected error occurred while resending OTP."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative font-inter antialiased">
      <main className="relative min-h-screen flex flex-col justify-center bg-slate-50 overflow-hidden">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-24">
          <div className="flex justify-center">
            <div className="max-w-md mx-auto text-center bg-white px-4 sm:px-8 py-10 rounded-xl shadow">
              <header className="mb-8">
                <h1 className="text-2xl font-bold mb-1">Mobile Phone Verification</h1>
                <p className="text-[15px] text-slate-500">
                  Enter the 4-digit verification code that was sent to your email address.
                </p>
              </header>
              <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-center gap-3">
                  {[...Array(4)].map((_, index) => (
                    <input
                      key={index}
                      type="text"
                      className="w-14 h-14 text-center text-2xl font-extrabold text-slate-900 bg-slate-100 border border-transparent hover:border-slate-200 appearance-none rounded p-4 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      maxLength="1"
                      ref={(el) => (inputsRef.current[index] = el)}
                      onChange={(e) => handleInputChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      inputMode="numeric"
                    />
                  ))}
                </div>
                {errorMessage && (
                  <div className="text-sm text-red-500 mt-2">{errorMessage}</div>
                )}
                {successMessage && (
                  <div className="text-sm text-green-500 mt-2">{successMessage}</div>
                )}
                <div className="max-w-[260px] mx-auto mt-4">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center whitespace-nowrap rounded-lg bg-indigo-500 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-950/10 hover:bg-indigo-600 focus:outline-none focus:ring focus:ring-indigo-300 transition-colors duration-150"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify Account"}
                  </button>
                </div>
              </form>
              <div className="text-sm text-slate-500 mt-4">
                Didn't receive code?{" "}
                <button
                  onClick={handleResendOtp}
                  className="font-medium text-indigo-500 hover:text-indigo-600"
                  disabled={resending}
                >
                  {resending ? "Resending..." : "Resend"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OtpForm;
