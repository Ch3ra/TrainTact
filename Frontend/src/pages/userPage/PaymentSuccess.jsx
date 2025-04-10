import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Calendar, Clock, Clock3, ArrowLeft } from 'lucide-react';

const PaymentSuccess = () => {
  const [bookingData, setBookingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processStage, setProcessStage] = useState('processing'); // 'processing', 'success', 'error'
  const navigate = useNavigate();

  useEffect(() => {
    const createSchedule = async () => {
      setIsLoading(true);
      try {
        // Get booking details from localStorage
        const storedData = localStorage.getItem("bookingDetails");
        if (!storedData) {
          throw new Error("No booking details found. Please try booking again.");
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
            amount: bookingDetails.price,
            paymentStatus: 'paid' 
          }
        );

        console.log("Schedule created successfully:", response.data);
        setProcessStage('success');
        
        // Clear the booking details from localStorage after successful creation
        // We're keeping this commented out in case you need to access this data elsewhere
        // localStorage.removeItem("bookingDetails");

      } catch (err) {
        console.error("Error creating schedule:", err);
        setError(err.message || "Failed to create schedule. Please try again or contact support.");
        setProcessStage('error');
      } finally {
        setIsLoading(false);
      }
    };

    createSchedule();
  }, []);

  // Format date nicely
  const formatDate = (dateString) => {
    try {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  };

  // Format time in 12-hour format
  const formatTime = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };

  // Calculate end time
  const calculateEndTime = (startTime, durationMinutes) => {
    try {
      const [hours, minutes] = startTime.split(':').map(num => parseInt(num, 10));
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0);
      
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      const endHours = endDate.getHours();
      const endMinutes = endDate.getMinutes();
      
      const formattedHours = endHours % 12 || 12;
      const formattedMinutes = endMinutes.toString().padStart(2, '0');
      const ampm = endHours >= 12 ? 'PM' : 'AM';
      
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    } catch (e) {
      return "After session";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-800">Processing your booking...</p>
          <p className="mt-2 text-sm text-gray-500">This may take a few moments. Please don't close this page.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (processStage === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Go back
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your booking has been confirmed and your trainer has been notified.
          </p>
          
          {bookingData && (
            <div className="text-left bg-gray-50 p-6 rounded-lg mb-6 border border-gray-100">
              <h3 className="font-semibold text-lg mb-4 text-red-600">Booking Details</h3>
              
              <div className="space-y-4">
                {bookingData.trainerName && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-gray-500"><Calendar size={18} /></div>
                    <div>
                      <p className="font-medium text-gray-900">Trainer</p>
                      <p className="text-gray-700">{bookingData.trainerName}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-500"><Calendar size={18} /></div>
                  <div>
                    <p className="font-medium text-gray-900">Session Date</p>
                    <p className="text-gray-700">{formatDate(bookingData.startDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-500"><Clock size={18} /></div>
                  <div>
                    <p className="font-medium text-gray-900">Session Time</p>
                    <p className="text-gray-700">
                      {formatTime(bookingData.startTime)} - {calculateEndTime(bookingData.startTime, bookingData.duration)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-500"><Clock3 size={18} /></div>
                  <div>
                    <p className="font-medium text-gray-900">Duration</p>
                    <p className="text-gray-700">{bookingData.duration} minutes</p>
                  </div>
                </div>
                
                {bookingData.price && (
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Amount Paid:</span>
                      <span className="font-semibold text-red-600">NPR {bookingData.price}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate('/trainers')} 
              className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex-1"
            >
              Browse More Trainers
            </button>
            <button 
              onClick={() => navigate('/clientDash')} 
              className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-1"
            >
              Go to Dashboard
            </button>
          </div>
          
          <p className="mt-6 text-sm text-gray-500">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;