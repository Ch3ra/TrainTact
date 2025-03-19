import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, User, LogOut, Clock, Calendar, Flag, Target } from "lucide-react";
import TrainerNavbar from "./TrainerNavbar";

const ClientRequest = () => {
  const [bookingData, setBookingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setError("No token found");
        return;
      }
  
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        const userId = decodedToken.id;
  
        const response = await fetch(
          `http://localhost:3000/api/availability/trainerBookings/${userId}`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch bookings: Server responded with status ${response.status}`
          );
        }
  
        const data = await response.json();
        // Filter for unverified bookings only
        const unverifiedBookings = data.filter(booking => booking.isClientVerified === false);
        setBookingData(unverifiedBookings);
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setError(error.message);
        setLoading(false);
      }
    };
  
    fetchBookings();
  }, []);

  const handleAccept = async (bookingId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/availability/verify/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to verify client");
      }

      setBookingData((prevData) =>
        prevData.filter((booking) => booking._id !== bookingId)
      );
    } catch (error) {
      console.error("Error verifying client:", error);
    }
  };

  const handleDecline = async (bookingId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/availability/delete/${bookingId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete booking");
      }

      setBookingData((prevData) =>
        prevData.filter((booking) => booking._id !== bookingId)
      );
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <TrainerNavbar />
      <div className="flex">
        <aside className="w-64 bg-white min-h-screen p-4 shadow-sm">
          <nav className="space-y-2">
            <Link
              to="/trainerDash"
              className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg"
            >
              <User size={20} />
              <span className="font-medium">Profile</span>
            </Link>
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
              <User size={20} />
              <span>My clients</span>
            </div>
            <Link to="/clientRequest">
              <div className="flex items-center space-x-3 bg-blue-50 text-blue-600 rounded-lg p-3 cursor-pointer">
                <User size={20} />
                <span>Client Requests</span>
              </div>
            </Link>
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
              <User size={20} />
              <span>Payments</span>
            </div>
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
              <User size={20} />
              <span>Exercises</span>
            </div>
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer text-red-600">
              <LogOut size={20} />
              <span>Logout</span>
            </div>
          </nav>
        </aside>

        <div className="flex-1 p-8">
          <h3 className="text-2xl font-bold mb-6">Client Requests</h3>
          
          {bookingData.length > 0 ? (
            <div className="space-y-4">
              {bookingData.map((booking) => (
                <div key={booking._id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-start gap-4 mb-4 md:mb-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                        <img
                          src={
                            booking.clientId?.profilePicture 
                             
                          }
                          alt="Client profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-semibold">{booking.clientId?.userName || "Unknown Client"}</h4>
                        <div className="flex items-center space-x-1 mt-1">
                          <Mail className="h-4 w-4 text-red-500" />
                          <p className="text-gray-600 text-sm">{booking.clientId?.email || "No email provided"}</p>
                        </div>
                        
                        {/* Session Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-red-500" />
                            <span className="text-sm">
                              {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-red-500" />
                            <span className="text-sm">
                              {booking.startTime || "No time specified"} ({booking.duration} min)
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-red-500" />
                            <span className="text-sm">
                              Goal: {booking.clientId?.fitnessGoal || "Not specified"}
                            </span>
                          </div>
                          
                          {booking.message && (
                            <div className="col-span-2 mt-2 p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium text-gray-700">Message:</p>
                              <p className="text-gray-600">{booking.message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
  <button
    onClick={() => handleAccept(booking._id)}
    className="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
  >
    Accept
  </button>
  <button
    onClick={() => handleDecline(booking._id)}
    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
  >
    Decline
  </button>
</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-sm text-center">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <User size={32} className="text-gray-400" />
                </div>
                <p className="text-lg text-gray-600">No pending client requests.</p>
                <p className="text-sm text-gray-500 mt-2">When clients request to book sessions with you, they will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientRequest;