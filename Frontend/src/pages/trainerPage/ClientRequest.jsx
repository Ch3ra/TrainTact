import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, User, LogOut } from "lucide-react";
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
        const extractedData = unverifiedBookings.map(({ _id, isClientVerified, clientId }) => ({
          bookingId: _id,
          isClientVerified,
          clientId,
        }));
  
        setBookingData(extractedData);
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
        prevData.filter((booking) => booking.bookingId !== bookingId)
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
        prevData.filter((booking) => booking.bookingId !== bookingId)
      );
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <TrainerNavbar />
      <div className="flex">
        <aside className="w-64 bg-white min-h-screen p-4 shadow-sm">
          <nav className="space-y-2">
            <Link
              to="/trainerDash"
              className="flex items-center space-x-3 bg-blue-50 text-blue-600 rounded-lg p-3"
            >
              <User size={20} />
              <span className="font-medium">Profile</span>
            </Link>
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
              <User size={20} />
              <span>My clients</span>
            </div>
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
              <User size={20} />
              <span>Client Requests</span>
            </div>
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

        <div className="flex-1 p-8 space-y-3">
          <h3 className="text-xl font-semibold mb-4">Client Requests</h3>
          {bookingData.length > 0 ? (
            bookingData.map((booking, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img
                        src={
                          booking.clientId?.profilePicture ||
                          "https://example.com/default-profile.jpg"
                        }
                        alt="Client profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold">{booking.clientId?.userName}</h4>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4 text-gray-500 hover:text-red-600" />
                        <p className="text-gray-500">{booking.clientId?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(booking.bookingId)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(booking.bookingId)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No client requests.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientRequest;
