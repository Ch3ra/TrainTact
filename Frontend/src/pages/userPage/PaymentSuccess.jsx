import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const [bookingData, setBookingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const createSchedule = async () => {
      setIsLoading(true);
      try {
        // Get booking details from localStorage
        const storedData = localStorage.getItem("bookingDetails");
        if (!storedData) {
          throw new Error("No booking details found");
        }

        // Parse the stored data
        const bookingDetails = JSON.parse(storedData);
        setBookingData(bookingDetails);

        // Make the API call to create schedule
        const response = await axios.post(
          "http://localhost:3000/api/availability/createSchedule",
          {
            clientId: bookingDetails.clientId,
            trainerId: bookingDetails.trainerId,
            startTime: bookingDetails.startTime,
            duration: bookingDetails.duration,
            startDate: bookingDetails.startDate,
            endDate: bookingDetails.endDate,
            message: bookingDetails.message || "",
         
            amount : bookingDetails.price
          }
        );

        console.log("Schedule created successfully:", response.data);
        
        // Clear the booking details from localStorage after successful creation
        // localStorage.removeItem("bookingDetails");
        
        // You might want to show a success message or redirect after a delay
        // setTimeout(() => {
        //   navigate('/dashboard'); // Replace with your desired route
        // }, 3000);

      } catch (err) {
        console.error("Error creating schedule:", err);
        setError(err.message || "Failed to create schedule");
      } finally {
        setIsLoading(false);
      }
    };

    createSchedule();
  }, []); // Empty dependency array means this runs once when component mounts

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Processing your booking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/book')} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8 text-green-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Your booking has been confirmed and your trainer has been notified.
          </p>
          {bookingData && (
            <div className="text-left bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">Booking Details:</h3>
              <p>Start Date: {new Date(bookingData.startDate).toLocaleDateString()}</p>
              <p>Start Time: {bookingData.startTime}</p>
              <p>Duration: {bookingData.duration} minutes</p>
            </div>
          )}
          {/* <button 
            onClick={() => navigate('/dashboard')} 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;