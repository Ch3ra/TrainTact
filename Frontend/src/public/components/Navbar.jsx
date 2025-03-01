import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Calendar, AlertTriangle } from "lucide-react";
import axios from 'axios';

const Navbar = () => {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem("token") !== null;
  const [profileData, setProfileData] = useState({ 
    profilePicture: "" 
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
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
      id: 1,
      type: "calendar",
      title: "Mr Sagar Basnet has edited a session",
      subtitle: "FYP External Supervision Class -Mr. Chintan Karki",
      date: "February 28, 2025 at 09:08 PM",
      read: false
    },
    {
      id: 1,
      type: "calendar",
      title: "Mr Sagar Basnet has edited a session",
      subtitle: "FYP External Supervision Class -Mr. Chintan Karki",
      date: "February 28, 2025 at 09:08 PM",
      read: true
    },
    {
      id: 1,
      type: "calendar",
      title: "Mr Sagar Basnet has edited a session",
      subtitle: "FYP External Supervision Class -Mr. Chintan Karki",
      date: "February 28, 2025 at 09:08 PM",
      read: false
    },
    // ... other notifications
  ]);

  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          const userId = decodedToken.id;
          const response = await axios.get(
            `http://localhost:3000/api/client/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.data?.user) {
            setProfileData(response.data.user);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };

    if (isLoggedIn) {
      fetchProfileData();
    }
  }, [isLoggedIn]);

  const navLinks = isLoggedIn
    ? [
        { name: "Home", path: "/clientDash" }, 
        { name: "Trainers", path: "/trainerExplore" },
        { name: "Exercise", path: "/exercise" },
      ]
    : [
        { name: "Home", path: "/" }, 
        { name: "About Us", path: "/aboutus" },
      ];

  const toggleProfileDropdown = () => {
    setShowProfileDropdown((prev) => !prev);
    if (showNotifications) setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    if (showProfileDropdown) setShowProfileDropdown(false);
    if (!showNotifications) setHasNotifications(false);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({...notif, read: true})))
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

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.href = "/authentication";
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex items-center">
        <span className="text-3xl font-bold text-[#CE0000] tracking-wide">
          Train
          <span className="text-black">Tact</span>
        </span>
      </div>

      <ul className="flex space-x-6 text-lg font-semibold">
        {navLinks.map((link) => (
          <li key={link.path}>
            <a
              href={link.path}
              className={`${
                location.pathname === link.path
                  ? "text-[#CE0000] underline"
                  : "text-black"
              } hover:text-[#CE0000] transition`}
            >
              {link.name}
            </a>
          </li>
        ))}
      </ul>

      <div className="relative flex items-center space-x-4">
        {isLoggedIn && (
          <div 
            className="relative cursor-pointer group"
            onClick={toggleNotifications}
          >
            <Bell 
              size={24} 
              className="text-gray-600 group-hover:text-[#CE0000] transition-colors duration-300 transform group-hover:scale-110"
            />
            {hasNotifications && unreadCount > 0 && (
              <span 
                className="absolute top-0 right-0 -mt-1 -mr-1 bg-[#CE0000] text-white rounded-full w-5 h-5 
                           flex items-center justify-center text-xs font-bold animate-pulse"
              >
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
        )}

        {isLoggedIn ? (
          <div className="cursor-pointer relative" onClick={toggleProfileDropdown}>
            <img
              alt="Profile"
              src={
                profileData.profilePicture
                  ? `${profileData.profilePicture}`
                  : "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1480&q=80"
              }
              className="h-10 w-10 rounded-full object-cover border border-gray-300"
            />
            {showProfileDropdown && (
              <ul
                className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg text-sm z-50"
                style={{ top: "calc(100% + 8px)" }}
              >
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <Link to='/userProfile'>
                    My Profile
                  </Link>
                </li>
                <li
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => alert("Navigate to Edit Profile")}
                >
                  Edit Profile
                </li>
                <li
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => alert("Check Inbox")}
                >
                  Inbox
                </li>
                <li
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => alert("Help")}
                >
                  Help
                </li>
                <hr className="my-1 border-gray-200" />
                <li
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500"
                  onClick={handleSignOut}
                >
                  Sign Out
                </li>
              </ul>
            )}
          </div>
        ) : (
          <div className="flex">
            <Link
              to="/authentication"
              className="text-black pl-4 hover:text-[#CE0000] flex items-center transition"
            >
              <button className="px-4 py-2 rounded-lg">Sign up</button>
            </Link>
            <Link
              to="/authentication"
              className="text-black hover:text-[#CE0000] flex items-center transition"
            >
              <button className="bg-[#CE0000] text-white px-4 py-2 rounded-3xl">
                Log in
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;