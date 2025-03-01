import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Mail, ArrowLeft, Pen, Calendar, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserProfile = () => {
  const recommendedTrainers = [
    {
      name: "Hari Bhattarai",
      specialty: "Weight Training Specialist",
      image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1000&auto=format&fit=crop"
    },
    {
      name: "Hari Bhattarai",
      specialty: "Weight Training Specialist",
      image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1000&auto=format&fit=crop"
    },
    {
      name: "Hari Bhattarai",
      specialty: "Weight Training Specialist",
      image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1000&auto=format&fit=crop"
    }
  ];
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    address: "",
    fitnessGoal: "",
    fitnessLevel: "",
    height: "",
    weight: "",
    profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop",
    trainerImage: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop"
  });

  // Add notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "calendar",
      title: "Mr Sagar Basnet has edited a session",
      subtitle: "FYP External Supervision Class -Mr. Chintan Karki",
      date: "February 28, 2025 at 09:08 PM",
      read: false
    },
    {
      id: 2,
      type: "calendar",
      title: "Mr Sagar Basnet has edited a session",
      subtitle: "FYP External Supervision Class -Mr. Chintan Karki",
      date: "February 28, 2025 at 09:08 PM",
      read: false
    },
    {
      id: 3,
      type: "calendar",
      title: "Mr Sagar Basnet has edited a session",
      subtitle: "FYP External Supervision Class -Mr. Chintan Karki",
      date: "February 28, 2025 at 09:08 PM",
      read: true
    },
    {
      id: 4,
      type: "deadline",
      title: "Mr Sagar Basnet has edited a session",
      subtitle: "FYP External Supervision Class -Mr. Chintan Karki",
      date: "February 28, 2025 at 09:08 PM",
      read: false
    }
  ]);

  // Add notification functions
  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications) setHasNotifications(false);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({...notif, read: true})));
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case "calendar":
        return <Calendar size={20} className="text-[#CE0000]" />;
      case "deadline":
        return <AlertTriangle size={20} className="text-[#CE0000]" />;
      default:
        return <Calendar size={20} className="text-[#CE0000]" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        fetchProfileData(decodedToken.id);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  const fetchProfileData = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/client/${userId}`);
      if (response.data) {
        setProfileData({ ...response.data.user, ...response.data.clientDetails }); // Assuming data is split as user and clientDetails
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    }
  };

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientTrainers, setClientTrainers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        const userId = decodedToken.id;

        const url = `http://localhost:3000/api/availability/clientBookings/${userId}`;
        
        fetch(url)
          .then(response => {
            if (!response.ok) throw new Error(`Failed to fetch bookings`);
            return response.json();
          })
          .then(data => {
            const verifiedBookings = data.filter(booking => booking.isClientVerified === true);
            setBookings(verifiedBookings);
            
            // Extract unique trainers
            const trainersMap = new Map();
            verifiedBookings.forEach(booking => {
              if (booking.trainerId && !trainersMap.has(booking.trainerId._id)) {
                trainersMap.set(booking.trainerId._id, booking.trainerId);
              }
            });
            setClientTrainers(Array.from(trainersMap.values()));
            
            setLoading(false);
          })
          .catch(error => {
            console.error("Error:", error);
            setLoading(false);
          });
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 flex items-center justify-between border-b">
        <div className="flex items-center space-x-2">
          <span className="text-red-600 font-bold text-xl">Train</span>
          <span className="font-bold text-xl">Tact</span>
        </div>
        <div className="flex items-center space-x-6">
          <div 
            className="relative group cursor-pointer"
            onClick={toggleNotifications}
          >
            <Bell className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors duration-200" />
            {hasNotifications && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
            
            {showNotifications && (
              <div className="absolute right-0 mt-4 w-96 bg-white border border-gray-200 rounded-lg shadow-lg text-sm z-50">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-lg">Notifications 
                    <span className="ml-2 text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  </h3>
                  <button 
                    className="text-[#CE0000] hover:text-red-800 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className="p-4 border-b border-gray-100 hover:bg-gray-50 flex"
                    >
                      <div className="mr-3 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-gray-700 mt-1">{notification.subtitle}</p>
                        <p className="text-gray-500 text-xs mt-2">{notification.date}</p>
                      </div>
                      {!notification.read && (
                        <div className="ml-2 mt-1">
                          <div className="h-3 w-3 bg-[#CE0000] rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative group cursor-pointer">
          <Link to='/chat'><Mail className="h-6 w-6 hover:text-red-600 cursor-pointer" /></Link>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">2</span>
          </div>
          <div className="relative cursor-pointer">
            <img src={profileData.profilePicture} alt="Profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 hover:ring-gray-200 transition-all duration-200" />
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className="w-52 bg-white h-screen p-4 border-r">
          <nav className="space-y-4">
            <div className="flex items-center space-x-3 cursor-pointer bg-blue-50 p-3 rounded-lg text-red-600">
              <div className="w-6 h-6">👤</div>
              <span>Profile</span>
            </div>
            <div className="flex items-center cursor-pointer space-x-3 p-3">
              <div className="w-6 h-6">💪</div>
              <span>My Trainers</span>
            </div>
            <div className="flex items-center cursor-pointer space-x-3 p-3">
              <div className="w-6 h-6">💳</div>
              <span>Payments</span>
            </div>
            <div className="flex items-center cursor-pointer space-x-3 p-3">
              <div className="w-6 h-6">🚪</div>
              <span>Logout</span>
            </div>
          </nav>
        </aside>
        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold relative overflow-hidden">Welcome back, {profileData.userName}!</h1>
            <ArrowLeft className="w-6 h-6 cursor-pointer hover:bg-gray-100 rounded-full p-1" />
          </div>
          <div className="grid grid-cols-12 gap-8 mb-8">
            <div className="col-span-4 bg-white rounded-lg shadow p-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img src={profileData.profilePicture} alt="Profile" className="w-28 h-28 rounded-full object-cover" />
                  <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">{profileData.fitnessLevel}</span>
                </div>
                <h2 className="mt-4 text-xl font-semibold">{profileData.userName}</h2>
                <p className="text-gray-500 text-sm text-center">{profileData.location}</p>
              </div>
            </div>
            <div className="col-span-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium">{profileData.userName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fitness Goal</p>
                  <p className="font-medium">{profileData.fitnessGoal}</p>
                </div>
                <div>
                  <p className="text-gray-500">Height</p>
                  <p className="font-medium">{profileData.height}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{profileData.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Weight</p>
                  <p className="font-medium">{profileData.weight}</p>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2">
                  <Pen size={16} />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="font-semibold mb-4">Description</h3>
            <p className="text-gray-500">{profileData.description}</p>
          </div>
          <div className="mb-8">
            <h3 className="font-semibold mb-4">Upcoming Sessions</h3>
            {bookings.length > 0 ? bookings.map((session, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={session?.trainerId?.profilePicture ? 
                        `http://localhost:3000/uploads/profilePictures/${session.trainerId.profilePicture}` : 
                        "https://example.com/default-profile.jpg"} 
                      alt="Trainer" 
                      className="w-16 h-16 rounded-full object-cover" 
                    />
                    <div>
                      <h4 className="font-semibold">{session.message || `Session with ${session?.trainerId?.userName}`}</h4>
                      
                      {/* Payment Status */}
                      <div className='flex justify-start items-center gap-2 my-1'>
                        <p className="text-gray-500 text-sm">Payment:</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.paymentStatus 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {session.paymentStatus ? "Paid" : "Not Paid"}
                        </span>
                      </div>

                      {/* Other session details */}
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Join Video
                  </button>
                </div>
              </div>
            )) : <p>No upcoming sessions found.</p>}
          </div>

          <div className="mb-8">
            <h3 className="font-semibold mb-4">My Trainers ({clientTrainers.length})</h3>
            <div className="grid grid-cols-3 gap-6">
              {clientTrainers.length > 0 ? clientTrainers.map((trainer, index) => (
                <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                  <img 
                    src={trainer.profilePicture ? 
                      `http://localhost:3000/uploads/profilePictures/${trainer.profilePicture}` : 
                      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop"
                    } 
                    alt={trainer.userName} 
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-semibold">{trainer.userName}</h4>
                    <p className="text-gray-500 text-sm">{trainer.fitnessGoal}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {trainer.location}
                      </span>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-gray-500">No trainers found. Book sessions to see your trainers here!</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Recommended Trainers</h3>
            <div className="grid grid-cols-3 gap-6">
              {recommendedTrainers.map((trainer, index) => (
                <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                  <img 
                    src={trainer.image} 
                    alt={trainer.name} 
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-semibold">{trainer.name}</h4>
                    <p className="text-gray-500 text-sm">{trainer.specialty}</p>
                    <button className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;