"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { 
  Bell, 
  ChevronDown, 
  UserCircle, 
  Edit, 
  MessageCircle, 
  LogOut 
} from "lucide-react"
import axios from "axios"
import NotificationPanel from "../../Notification/NotificationPannel"
import { useNotifications } from "../../Notification/NotificationContext"

const Navbar = () => {
  const location = useLocation()
  const isLoggedIn = localStorage.getItem("token") !== null
  const [profileData, setProfileData] = useState({
    profilePicture: "",
  })
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { unreadCount, fetchNotifications } = useNotifications()

  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const decodedToken = JSON.parse(atob(token.split(".")[1]))
          const userId = decodedToken.id
          const response = await axios.get(`http://localhost:3000/api/client/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (response.data?.user) {
            setProfileData(response.data.user)
          }
        } catch (error) {
          console.error("Error fetching profile:", error)
        }
      }
    }

    if (isLoggedIn) {
      fetchProfileData()
    }
  }, [isLoggedIn])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest(".profile-dropdown-container")) {
        setShowProfileDropdown(false)
      }
      if (showNotifications && !event.target.closest(".notification-container")) {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showProfileDropdown, showNotifications])

  // Refresh notifications when the notification panel is opened
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications()
    }
  }, [showNotifications, fetchNotifications])

  // Updated navigation links as requested
  const navLinks = isLoggedIn
    ? [
        { name: "Home", path: "/home" },
        { name: "Find Trainer's", path: "/trainerExplore" },
        { name: "Find Exercise's", path: "/exercise" },
        { name: "Recommend Trainer's", path: "/trainerRecommendation" },
        { name: "Recommend Exercise", path: "/exerciseRecommendation" },
      ]
    : [
        { name: "Home", path: "/" },
        { name: "About Us", path: "/aboutus" },
      ]

  const toggleProfileDropdown = () => {
    setShowProfileDropdown((prev) => !prev)
    if (showNotifications) setShowNotifications(false)
  }

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev)
    if (showProfileDropdown) setShowProfileDropdown(false)
  }

  const handleSignOut = () => {
    localStorage.removeItem("token")
    window.location.href = "/authentication"
  }

  return (
    <nav className="bg-white shadow-lg px-6 py-4 sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <span className="text-3xl font-bold tracking-tight">
            <span className="text-[#CE0000]">Train</span>
            <span className="text-black">Tact</span>
          </span>
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex space-x-8 text-base font-medium">
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`${
                  location.pathname === link.path 
                    ? "text-[#CE0000] font-semibold border-b-2 border-[#CE0000] pb-1" 
                    : "text-gray-700"
                } hover:text-[#CE0000] transition-colors duration-200`}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side - Notifications & Profile */}
        <div className="relative flex items-center space-x-6">
          {isLoggedIn && (
            <div 
              className="relative cursor-pointer group notification-container" 
              onClick={toggleNotifications}
            >
              <div className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                <Bell
                  size={22}
                  className="text-gray-600 group-hover:text-[#CE0000] transition-colors duration-200"
                />
              </div>
              
              {unreadCount > 0 && (
                <span
                  className="absolute top-0 right-0 bg-[#CE0000] text-white rounded-full w-5 h-5 
                           flex items-center justify-center text-xs font-bold"
                >
                  {unreadCount}
                </span>
              )}

              <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
            </div>
          )}

          {isLoggedIn ? (
            <div 
              className="cursor-pointer relative profile-dropdown-container flex items-center"
              onClick={toggleProfileDropdown}
            >
              <div className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200">
                <img
                  alt="Profile"
                  src={
                    profileData.profilePicture
                      ? `${profileData.profilePicture}`
                      : "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1480&q=80"
                  }
                  className="h-10 w-10 rounded-full object-cover border border-gray-200 shadow-sm"
                />
                <ChevronDown 
                  size={16} 
                  className={`text-gray-600 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : 'rotate-0'}`} 
                />
              </div>

              {showProfileDropdown && (
                <ul
                  className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-xl text-sm z-50 overflow-hidden transition-all duration-200 ease-in-out"
                  style={{ top: "calc(100% + 4px)" }}
                >
                  <li className="hover:bg-gray-50 transition-colors duration-150">
                    <Link to="/userProfile" className="px-4 py-3 flex items-center space-x-3 text-gray-700 hover:text-[#CE0000]">
                      <UserCircle size={18} />
                      <span>Profile</span>
                    </Link>
                  </li>
                  <li className="hover:bg-gray-50 transition-colors duration-150">
                    <Link to="/editProfile" className="px-4 py-3 flex items-center space-x-3 text-gray-700 hover:text-[#CE0000]">
                      <Edit size={18} />
                      <span>Edit Profile</span>
                    </Link>
                  </li>
                  <li className="hover:bg-gray-50 transition-colors duration-150">
                    <Link to="/chat" className="px-4 py-3 flex items-center space-x-3 text-gray-700 hover:text-[#CE0000]">
                      <MessageCircle size={18} />
                      <span>Messages</span>
                    </Link>
                  </li>
                  <hr className="border-gray-100 my-1" />
                  <li 
                    className="hover:bg-red-50 transition-colors duration-150 cursor-pointer" 
                    onClick={handleSignOut}
                  >
                    <div className="px-4 py-3 flex items-center space-x-3 text-[#CE0000]">
                      <LogOut size={18} />
                      <span>Logout</span>
                    </div>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/authentication" className="text-gray-700 hover:text-[#CE0000] transition-colors duration-200">
                <button className="px-4 py-2 rounded-lg font-medium hover:bg-gray-50">Sign up</button>
              </Link>
              <Link to="/authentication">
                <button className="bg-[#CE0000] text-white px-5 py-2 rounded-full font-medium hover:bg-[#b00000] transition-colors duration-200 shadow-sm">
                  Log in
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu button - You might want to implement this later */}
      {/* <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
        </svg>
      </button> */}
    </nav>
  )
}

export default Navbar