"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Bell } from 'lucide-react'
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

  // Refresh notifications when the notification panel is opened
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications()
    }
  }, [showNotifications, fetchNotifications])

  const navLinks = isLoggedIn
    ? [
        { name: "Home", path: "/clientDash" },
        { name: "Trainers", path: "/trainerExplore" },
        { name: "Exercise", path: "/exercise" },
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
                location.pathname === link.path ? "text-[#CE0000] underline" : "text-black"
              } hover:text-[#CE0000] transition`}
            >
              {link.name}
            </a>
          </li>
        ))}
      </ul>

      <div className="relative flex items-center space-x-4">
        {isLoggedIn && (
          <div className="relative cursor-pointer group" onClick={toggleNotifications}>
            <Bell
              size={24}
              className="text-gray-600 group-hover:text-[#CE0000] transition-colors duration-300 transform group-hover:scale-110"
            />
            {unreadCount > 0 && (
              <span
                className="absolute top-0 right-0 -mt-1 -mr-1 bg-[#CE0000] text-white rounded-full w-5 h-5 
                           flex items-center justify-center text-xs font-bold animate-pulse"
              >
                {unreadCount}
              </span>
            )}

            <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
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
                  <Link to="/userProfile">My Profile</Link>
                </li>
                <li
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => alert("Navigate to Edit Profile")}
                >
                  Edit Profile
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <Link to="/chat">Inbox</Link>
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => alert("Help")}>
                  Help
                </li>
                <hr className="my-1 border-gray-200" />
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500" onClick={handleSignOut}>
                  Sign Out
                </li>
              </ul>
            )}
          </div>
        ) : (
          <div className="flex">
            <Link to="/authentication" className="text-black pl-4 hover:text-[#CE0000] flex items-center transition">
              <button className="px-4 py-2 rounded-lg">Sign up</button>
            </Link>
            <Link to="/authentication" className="text-black hover:text-[#CE0000] flex items-center transition">
              <button className="bg-[#CE0000] text-white px-4 py-2 rounded-3xl">Log in</button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
