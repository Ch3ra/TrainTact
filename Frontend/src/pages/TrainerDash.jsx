import React, { useEffect, useState } from "react";
import {

  Mail,
  LogOut,
  Edit,
  ArrowLeft,
  User,
  MapPin,
  Clock,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import TrainerNavbar from "./trainerPage/TrainerNavbar";
import axios from 'axios'; 

const TrainerDash = () => {
  const [userId, setUserId] = useState(null);
  const [trainerDetails, setTrainerDetails] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [advancedNeeded, setAdvancedNeeded] = useState(false);
  // const [userId, setUserId] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      setUserId(decodedToken.id);
      fetchTrainerDetails(decodedToken.id);
    
    }
  }, []);


  const fetchTrainerDetails = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/trainer/details/${id}`);
      if (response.status === 200) {
        const trainerData = response.data.trainer;
        setTrainerDetails(trainerData);
        setAdvancedNeeded(trainerData.advancedNeeded); // Store advancedNeeded in state
        console.log("Trainer Data:", trainerData);
      }
    } catch (error) {
      console.error("Failed to fetch trainer details", error);
    }
  };


  useEffect(() => {
    if (userId) {
      const url = `http://localhost:3000/api/availability/trainerBookings/${userId}`;
      console.log("Making API call with User ID:", userId, "URL:", url);
      fetch(url)
        .then(response => {
          if (response.status !== 200) {
            throw new Error(`Failed to fetch bookings: Server responded with status ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log("Bookings data:", data);
          // Filter bookings where isClientVerified is true
          const verifiedBookings = data.filter(booking => booking.isClientVerified === true);
          setBookings(verifiedBookings);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error while fetching bookings:", err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [userId]);
  
  


  return (
   <div className="bg-gray-50 min-h-screen">
<TrainerNavbar />

<div className="flex">
  {/* Sidebar */}
  <aside className="w-[210px] bg-white min-h-screen p-4 shadow-sm">
    <nav className="space-y-2">
      <Link to="/trainerDash">
        <div className="flex items-center space-x-3 bg-blue-50 text-blue-600 rounded-lg p-3">
          <User size={20} />
          <span className="font-medium">Profile</span>
        </div>
      </Link>
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
        <span className="w-5 h-5">💪</span>
        <span>My clients</span>
      </div>
      <Link to="/clientRequest">
        <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
          <span className="w-5 h-5">💪</span>
          <span>client Request</span>
        </div>
      </Link>
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
        <span className="w-5 h-5">💰</span>
        <span>Payments</span>
      </div>
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
        <span className="w-5 h-5">🏋️</span>
        <span>Exercises</span>
      </div>
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer text-red-600">
        <LogOut size={20} />
        <span>Logout</span>
      </div>
    </nav>
  </aside>

  {/* Main Content */}
<main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Welcome back, {trainerDetails ? trainerDetails.userName : 'Trainer'}!</h2>
          <button className="w-10 h-10 border rounded-full flex items-center justify-center hover:bg-gray-50">
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-sm">
          {/* Cover Image */}
          <div className="h-64 bg-gray-900 rounded-t-2xl overflow-hidden">
  <img
    src={trainerDetails ? `http://localhost:3000/uploads/coverPhoto/${trainerDetails.coverPhoto}` : "https://timelinecovers.pro/facebook-cover/download/You-Are-A-Dreamer-HD-facebook-cover.jpg"}
    alt="cover"
    className="w-full h-full object-cover opacity-75"
  />
</div>


          {/* Profile Info */}
          <div className="relative px-8 pt-32 pb-8">
            <div className="absolute -top-[130px] left-8">
            <div className="relative">
            {advancedNeeded && (
  <span className="absolute top-52 ml-28 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg translate-x-1/2 -translate-y-1/2">
    Pre Advance
  </span>
)}

  <div className="w-[210px] h-[210px] rounded-full mt-4 border-4 border-white shadow-lg overflow-hidden relative">
    <img
      src={trainerDetails ? `http://localhost:3000/uploads/profilePictures/${trainerDetails.profilePicture}` : "https://timelinecovers.pro/facebook-cover/download/You-Are-A-Dreamer-HD-facebook-cover.jpg"}
      alt="cover"
      className="w-full h-full object-cover"
    />
   
     
  
  </div>
</div>

              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <User size={20} className="text-gray-500" />
                  <span className="font-medium">{trainerDetails ? trainerDetails.userName : 'Alish Ban'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin size={20} />
                  <span>{trainerDetails ? trainerDetails.location : 'Itahari-3, Bhetghat Chowk'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail size={20} />
                  <p className="font-medium">{trainerDetails ? trainerDetails.email : 'alishban@gmail.com'}</p>
                </div>
              </div>
            </div>
            {/* Profile Details Grid */}
            <div className="grid grid-cols-2 gap-8 mt-4">
              <div className="space-y-4"></div>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <label className="text-gray-500 text-sm">Price</label>
                  <p className="font-medium">{trainerDetails ? trainerDetails.price + ' NPR' : '4000 NPR'}</p>
                </div>
                <div className="flex space-x-2">
                  <label className="text-gray-500 text-sm">
                    Years of Experience
                  </label>
                  <p className="font-medium">{trainerDetails ? trainerDetails.yearsOfExperience + ' Years' : '5 Years'}</p>
                </div>
                <div className="flex space-x-2">
                  <label className="text-gray-500 text-sm">
                    Fitness Goal
                  </label>
                  <p className="font-medium">{trainerDetails ? trainerDetails.fitnessGoal : 'Weight Gain'}</p>
                </div>
              </div>
              <div className="w-[700px]">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <p className="text-gray-600 leading-relaxed">
                    {trainerDetails ? trainerDetails.description : 'Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.'}
                  </p>
                </div>
              </div>
            </div>






            {/* Availability Badge */}
            <div className="absolute top-6 ml-[440px] w-64">
              <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
                <div className="bg-red-50 px-4 py-3 flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-semibold text-red-600">
                    Available: {trainerDetails ? trainerDetails.availabilityHours : 'Evening'}
                  </p>
                </div>
                <div className="px-4 py-3 flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <p className="text-sm text-gray-600">{trainerDetails ? trainerDetails.startDay + ' - ' + trainerDetails.endDay : 'Sunday - Friday'}</p>
                </div>
              </div>
            </div>
            {/* Edit Profile Button */}
            
            <button className="absolute top-64 right-7 bg-red-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-red-700 transition-colors">
              <Edit size={16} />
              Edit Profile
            </button>

           
          </div>
        </div>
        {/* Upcoming Sessions */}
        <div className="mb-8">
  <h3 className="font-semibold mb-4">Upcoming Sessions</h3>
  {bookings.length > 0 ? bookings.map((session, index) => (
    <div key={index} className="bg-white rounded-lg shadow p-6 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
        <img 
  src={session.clientId?.profilePicture || "https://example.com/default-profile.jpg"} 
  alt="Client" 
  className="w-16 h-16 rounded-full object-cover" 
/>

          <div>
            <h4 className="font-semibold">{session.message || "Session with " + session.clientId?.userName}</h4>
            <div className='flex justify-start items-center gap-2 my-1'>
              <p className="text-gray-500 text-sm">Start Time: <span className="text-gray-700 font-medium">{session.startTime}</span></p>
              <p className="text-gray-500 text-sm">/ Duration: <span className="text-gray-700 font-medium">{session.duration} minutes</span></p>
            </div>
            <div className='flex justify-start items-center gap-2 my-1'>
              <p className="text-gray-500 text-sm">
                {new Date(session.startDate).toLocaleDateString()}
              </p>
              <p className="text-gray-500 text-sm">- {new Date(session.endDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <div className="space-x-2">
        <button className="px-4 py-2  text-red-700 border border-red-700 rounded-lg hover:bg-gray-200">
    Reschedule
  </button>
  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
    Join Video
  </button>
 
</div>

      </div>
    </div>
  )) : <p>No upcoming sessions found.</p>}
</div>

      </main>

      
</div>

</div>


  );
};

export default TrainerDash;



