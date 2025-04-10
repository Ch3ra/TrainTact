"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Home, 
  Calendar, 
  Settings, 
  Bell, 
  CreditCard, 
  LogOut, 

  User, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Activity, 
  Dumbbell, 
  Edit, 
  X, 
  Upload, 
  Camera, 
  MessageSquare,
  UserPlus, // For client request
  Star // For rating and feedback
} from 'lucide-react'
import { Link, useLocation, useNavigate } from "react-router-dom"
import NotificationPanel from "../Notification/NotificationPannel"
import { useNotifications } from "../Notification/NotificationContext"
import axios from "axios"

// Simple utility function to replace cn from @/lib/utils
function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

// Navbar Component for trainer
const TrainerNavbar = ({ trainerData, onProfileUpdate }) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showProfileEditModal, setShowProfileEditModal] = useState(false)
  const profileDropdownRef = useRef(null)
  const { unreadCount, fetchNotifications } = useNotifications()
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Refresh notifications when the notification panel is opened
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications()
    }
  }, [showNotifications, fetchNotifications])

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev)
  }

  const toggleProfileDropdown = () => {
    setShowProfileDropdown((prev) => !prev)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/authentication')
  }

  return (
    <div className="sticky top-0 w-full bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="flex items-center justify-between px-4 py-2 h-16">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          
        </div>

        {/* Right side items */}
        <div className="flex items-center space-x-4">
          {/* Notification Button with Badge */}
          <div className="relative cursor-pointer group" onClick={toggleNotifications}>
            <button className="group relative p-1.5 text-gray-600 hover:text-[#CE0000] focus:outline-none">
              <span className="sr-only">View notifications</span>
              <div className="relative z-10">
                <Bell className="h-6 w-6" />
              </div>
              {/* Hexagonal background that appears on hover */}
              <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 bg-gray-100 transition-opacity"></div>
            </button>
            {/* Notification Badge */}
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-[#CE0000] text-white text-xs font-medium flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            
            {/* Notification Panel */}
            <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
          </div>
          
          {/* Message Button */}
          <div className="relative cursor-pointer group">
            <Link to="/chat">
              <button className="group relative p-1.5 text-gray-600 hover:text-[#CE0000] focus:outline-none">
                <span className="sr-only">Messages</span>
                <div className="relative z-10">
                  <MessageSquare className="h-6 w-6" />
                </div>
                {/* Hexagonal background that appears on hover */}
                <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 bg-gray-100 transition-opacity"></div>
              </button>
            </Link>
          </div>

          {/* Trainer User Profile with Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={toggleProfileDropdown}
            >
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-[#CE0000]">
                {trainerData && trainerData.profilePicture ? (
                  <img 
                    src={`http://localhost:3000/uploads/profilePictures/${trainerData.profilePicture}`} 
                    alt="Trainer" 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <User className="h-5 w-5 text-[#CE0000]" />
                )}
              </div>
              <div className="hidden md:block">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {trainerData ? trainerData.userName : "Trainer Name"}
                  </span>
                  <ChevronDown className={`ml-1 h-4 w-4 text-gray-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{trainerData?.userName || "Trainer Name"}</p>
                  <p className="text-xs text-gray-500 truncate">{trainerData?.email || "trainer@example.com"}</p>
                </div>
                <button
                  onClick={() => navigate("/trainerProfile")}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  Profile
                </button>
                <button
                  onClick={() => navigate("/editTrainerProfile")}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4 mr-2 text-gray-500" />
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4 mr-2 text-gray-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Sidebar component with improved dropdown functionality
export function TrainerSidebar({ trainerData }) {
  const [collapsed, setCollapsed] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  
  const navigate = useNavigate()

  // Using react-router's useLocation instead of next's usePathname
  const location = useLocation()
  const pathname = location.pathname

  // Check if we're on mobile and set sidebar to collapsed by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }

    // Set initial state
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Toggle dropdown
  const toggleDropdown = (label) => {
    if (openDropdown === label) {
      setOpenDropdown(null)
    } else {
      setOpenDropdown(label)
    }
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/authentication')
  }

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/trainerdash" },
    { icon: UserPlus, label: "Client Request", href: "/clientRequest" },
    { icon: Calendar, label: "My Session's", href: "/trainerBooking" },
    { icon: Dumbbell, label: "Exercise", href: "/myexercise" },
    { icon: User, label: "Clients", href: "/myclient" },
    { icon: MessageSquare, label: "Messages", href: "/chat" },
    { icon: CreditCard, label: "Payments", href: "/paymentTransaction" },
    { icon: Star, label: "Rating & Feedback", href: "/ratingfeedback" },
  ]

  return (
    <aside className="h-screen sticky top-0 left-0">
      <div
        className={cn(
          "bg-white text-gray-800 h-full transition-all duration-300 flex flex-col border-r border-gray-200 shadow-md",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-center h-16 border-b border-gray-200">
          {collapsed ? (
            <span className="text-2xl font-bold text-[#CE0000]">TT</span>
          ) : (
            <span className="text-xl font-bold text-[#CE0000]">TrainTact Trainer</span>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 overflow-y-auto">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.hasDropdown && item.dropdownItems && item.dropdownItems.some((subItem) => pathname === subItem.href))
              const isDropdownOpen = openDropdown === item.label

              return (
                <div key={item.label} className="relative group">
                  {item.hasDropdown ? (
                    <div>
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        className={cn(
                          "group relative w-full flex items-center px-3 py-3 rounded-md transition-all",
                          isActive ? "bg-red-50 text-[#CE0000] font-medium" : "text-gray-700 hover:text-[#CE0000]",
                          collapsed && "justify-center",
                        )}
                      >
                        {/* The icon with z-index to appear above the hex background */}
                        <div className="relative z-10">
                          <Icon
                            className={cn(
                              "h-5 w-5 shrink-0",
                              isActive ? "text-[#CE0000]" : "text-gray-500 group-hover:text-[#CE0000]",
                            )}
                          />
                        </div>

                        {/* Hexagonal background that appears on hover (except when active) */}
                        {!isActive && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gray-100 transition-opacity rounded-md"></div>
                        )}

                        {!collapsed && (
                          <>
                            <span className="ml-3 relative z-10 flex-1 text-left">{item.label}</span>
                            {isDropdownOpen ? (
                              <ChevronDown className="h-4 w-4 relative z-10" />
                            ) : (
                              <ChevronRight className="h-4 w-4 relative z-10" />
                            )}
                          </>
                        )}
                      </button>

                      {/* Dropdown menu for expanded sidebar */}
                      {isDropdownOpen && !collapsed && item.dropdownItems && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.dropdownItems.map((subItem) => {
                            const SubIcon = subItem.icon
                            const isSubActive = pathname === subItem.href

                            return (
                              <Link
                                key={subItem.href}
                                to={subItem.href}
                                className={cn(
                                  "flex items-center px-3 py-2 rounded-md text-sm transition-all",
                                  isSubActive
                                    ? "bg-red-50 text-[#CE0000] font-medium"
                                    : "text-gray-700 hover:text-[#CE0000] hover:bg-gray-100",
                                )}
                              >
                                <SubIcon className={cn(
                                  "h-4 w-4 mr-2 shrink-0",
                                  isSubActive ? "text-[#CE0000]" : "text-gray-500"
                                )} />
                                <span>{subItem.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}

                      {/* Dropdown menu for collapsed sidebar - always visible on hover */}
                      {collapsed && item.dropdownItems && (
                        <div className="absolute left-full ml-2 top-0 z-50 bg-white shadow-lg rounded-md p-2 w-48 hidden group-hover:block">
                          <div className="font-medium text-gray-900 mb-2 px-2 flex items-center">
                            <Icon className="h-4 w-4 mr-2 text-[#CE0000]" />
                            <span>{item.label}</span>
                          </div>
                          <div className="space-y-1">
                            {item.dropdownItems.map((subItem) => {
                              const SubIcon = subItem.icon
                              const isSubActive = pathname === subItem.href
                              
                              return (
                                <Link
                                  key={subItem.href}
                                  to={subItem.href}
                                  className={cn(
                                    "block px-2 py-2 text-sm rounded-md flex items-center",
                                    isSubActive 
                                      ? "bg-red-50 text-[#CE0000] font-medium" 
                                      : "text-gray-700 hover:bg-gray-100 hover:text-[#CE0000]"
                                  )}
                                >
                                  <SubIcon className={cn(
                                    "h-4 w-4 mr-2 shrink-0",
                                    isSubActive ? "text-[#CE0000]" : "text-gray-500"
                                  )} />
                                  <span>{subItem.label}</span>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      className={cn(
                        "group relative flex items-center px-3 py-3 rounded-md transition-all",
                        isActive ? "bg-red-50 text-[#CE0000] font-medium" : "text-gray-700 hover:text-[#CE0000]",
                        collapsed && "justify-center",
                      )}
                    >
                      {/* The icon with z-index to appear above the hex background */}
                      <div className="relative z-10">
                        <Icon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            isActive ? "text-[#CE0000]" : "text-gray-500 group-hover:text-[#CE0000]",
                          )}
                        />
                      </div>

                      {/* Hexagonal background that appears on hover (except when active) */}
                      {!isActive && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gray-100 transition-opacity rounded-md"></div>
                      )}

                      {!collapsed && <span className="ml-3 relative z-10">{item.label}</span>}
                      
                      {/* Tooltip for collapsed regular items */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 z-50 bg-white shadow-lg rounded-md py-1 px-2 hidden group-hover:block whitespace-nowrap">
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                      )}
                    </Link>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Toggle button */}
        <div className="px-4 py-2 border-t border-gray-200">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="relative group w-10 h-10 flex items-center justify-center bg-white text-gray-700 transition-all focus:outline-none border border-gray-300"
          >
            {collapsed ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="18" height="12" rx="1" stroke="#CE0000" strokeWidth="1.5" />
                <path d="M11 6V18" stroke="#CE0000" strokeWidth="1.5" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="18" height="12" rx="1" stroke="#CE0000" strokeWidth="1.5" />
                <path d="M11 6V18" stroke="#CE0000" strokeWidth="1.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Profile section */}
        <div className="p-4 border-t border-gray-200">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "space-x-3")}>
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-[#CE0000]">
              {trainerData && trainerData.profilePicture ? (
                <img 
                  src={`http://localhost:3000/uploads/profilePictures/${trainerData.profilePicture}`} 
                  alt="Trainer" 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <User className="h-6 w-6 text-[#CE0000]" />
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {trainerData ? trainerData.userName : "Trainer Name"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {trainerData ? trainerData.email : "trainer@example.com"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Logout button */}
        <div className="p-4 pt-0">
          <button
            onClick={handleLogout}
            className={cn(
              "relative group w-full flex items-center rounded-md px-4 py-2 bg-white text-gray-700 transition-all",
              collapsed && "justify-center",
            )}
          >
            {/* Icon with z-index */}
            <div className="relative z-10">
              <LogOut className="h-5 w-5 shrink-0 text-[#CE0000]" />
            </div>

            {/* Hover background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gray-100 transition-opacity rounded-md"></div>

            {!collapsed && <span className="ml-3 relative z-10">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}

// Complete Trainer Layout Component that includes both sidebar and main content area with navbar
export function TrainerLayout({ children }) {
  const [trainerData, setTrainerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Fetch trainer data from token and API
  useEffect(() => {
    const fetchTrainerData = async () => {
      try {
        setLoading(true)
        
        // Get token from localStorage
        const token = localStorage.getItem("token")
        if (!token) {
          console.log("No token found, redirecting to login")
          navigate('/authentication')
          return
        }
        
        // Decode the token to get trainer ID
        try {
          const decodedToken = JSON.parse(atob(token.split(".")[1]))
          
          // Check if user is a trainer - account for different field names
          const userRole = decodedToken.role || decodedToken.userRole || decodedToken.userType || 
                          decodedToken.type || decodedToken.accountType
          
          if (userRole && userRole.toLowerCase() !== 'trainer') {
            console.log("Access denied: User is not a trainer")
            navigate('/authentication')
            return
          }
          
          // Fetch trainer details using the ID from token
          const trainerId = decodedToken.id
          const response = await axios.get(`http://localhost:3000/api/trainer/details/${trainerId}`)
          
          if (response.status === 200) {
            setTrainerData(response.data.trainer)
          }
        } catch (error) {
          console.error("Error decoding token or fetching trainer data:", error)
          navigate('/authentication')
        }
      } catch (err) {
        console.error("Error fetching trainer data:", err)
        navigate('/authentication')
      } finally {
        setLoading(false)
      }
    }

    fetchTrainerData()
  }, [navigate])

  // Handle profile update
  const handleProfileUpdate = (updatedTrainer) => {
    setTrainerData(updatedTrainer)
  }
  
  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#CE0000] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trainer profile...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <TrainerSidebar trainerData={trainerData} />

      <div className="flex-1 flex flex-col">
        <TrainerNavbar trainerData={trainerData} onProfileUpdate={handleProfileUpdate} />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

export default TrainerLayout