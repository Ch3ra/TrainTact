"use client"

import { useState, useEffect, useRef } from "react"
import { Users, Home, Calendar, Settings, Bell, CreditCard, LogOut, BarChart2, User, Search, ChevronDown, ChevronRight, Activity, Dumbbell, Edit, X, Upload, Camera } from 'lucide-react'
import { Link, useLocation, useNavigate } from "react-router-dom"
import NotificationPanel from "../../Notification/NotificationPannel"
import { useNotifications } from "../../Notification/NotificationContext"
import axios from "axios"

// Simple utility function to replace cn from @/lib/utils
function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

// Profile Edit Modal Component
const ProfileEditModal = ({ isOpen, onClose, adminData, onSave }) => {
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [profilePicture, setProfilePicture] = useState(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (adminData) {
      setUserName(adminData.userName || "")
      setEmail(adminData.email || "")
      setPreviewUrl(adminData.profilePicture || "")
    }
  }, [adminData])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePicture(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("userName", userName)
      
      // Only append profile picture if a new one was selected
      if (profilePicture) {
        formData.append("profilePicture", profilePicture)
      }

      const response = await axios.put("http://localhost:3000/api/admin/admin/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.data.success) {
        onSave(response.data.admin)
        onClose()
      } else {
        setError(response.data.message || "Failed to update profile")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError(err.response?.data?.message || "An error occurred while updating profile")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-[#CE0000]">
                {previewUrl ? (
                  <img src={previewUrl || "/placeholder.svg"} alt="Profile Preview" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-[#CE0000]" />
                )}
              </div>
              <div 
                className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                onClick={triggerFileInput}
              >
                <Camera className="h-8 w-8 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <button 
              type="button"
              onClick={triggerFileInput}
              className="mt-2 text-sm text-[#CE0000] hover:text-red-700 font-medium"
            >
              Change Photo
            </button>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#CE0000] focus:border-transparent"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#CE0000] focus:border-transparent bg-gray-100"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CE0000]"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#CE0000] border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CE0000]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Navbar Component embedded in the layout
const AdminNavbar = ({ adminData, onProfileUpdate }) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showProfileEditModal, setShowProfileEditModal] = useState(false)
  const { unreadCount, fetchNotifications } = useNotifications()
  const profileDropdownRef = useRef(null)
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
    localStorage.removeItem('authToken')
    navigate('/authentication')
  }

  const handleEditProfile = () => {
    setShowProfileDropdown(false)
    setShowProfileEditModal(true)
  }

  const handleProfileSave = (updatedAdmin) => {
    onProfileUpdate(updatedAdmin)
  }

  return (
    <div className="sticky top-0 w-full bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="flex items-center justify-between px-4 py-2 h-16">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#CE0000] focus:border-transparent"
              placeholder="Search users, trainers..."
            />
          </div>
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

          {/* Admin User Profile with Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={toggleProfileDropdown}
            >
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-[#CE0000]">
                {/* Show admin profile picture if available, otherwise show icon */}
                {adminData && adminData.profilePicture ? (
                  <img 
                    src={adminData.profilePicture.startsWith('http') 
                      ? adminData.profilePicture 
                      : `http://localhost:3000/uploads/profilePictures/${adminData.profilePicture}`} 
                    alt="Admin" 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <User className="h-5 w-5 text-[#CE0000]" />
                )}
              </div>
              <div className="hidden md:block">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {adminData ? adminData.userName : "Admin User"}
                  </span>
                  <ChevronDown className={`ml-1 h-4 w-4 text-gray-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{adminData?.userName}</p>
                  <p className="text-xs text-gray-500 truncate">{adminData?.email}</p>
                </div>
                <button
                  onClick={handleEditProfile}
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

      {/* Profile Edit Modal */}
      <ProfileEditModal 
        isOpen={showProfileEditModal}
        onClose={() => setShowProfileEditModal(false)}
        adminData={adminData}
        onSave={handleProfileSave}
      />
    </div>
  )
}

// Sidebar component with improved dropdown functionality
export function AdminSidebar({ adminData }) {
  const [collapsed, setCollapsed] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [loading, setLoading] = useState(false)
  
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
    localStorage.removeItem('authToken')
    navigate('/authentication')
  }

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/admin" },
    {
      icon: Users,
      label: "Trainers",
      href: "/admin/trainers",
      hasDropdown: true,
      dropdownItems: [
        { icon: Users, label: "All Trainers", href: "/alltrainer" },
        { icon: User, label: "Trainer Requests", href: "/request" },
      ],
    },
    { icon: Users, label: "Users", href: "/user" },
    { icon: Calendar, label: "Bookings", href: "/booking" },
    { icon: CreditCard, label: "Payments", href: "/paymentdashboard" },
    { icon: Activity, label: "Activity", href: "/recent" },
    { icon: Dumbbell, label: "Exercise", href: "/exerciseDashboard" }
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
            <span className="text-xl font-bold text-[#CE0000]">TrainTact Admin</span>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 overflow-y-auto">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.hasDropdown && item.dropdownItems.some((subItem) => pathname === subItem.href))
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
                      {isDropdownOpen && !collapsed && (
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
                      {collapsed && (
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

        {/* Profile section with fetched admin data */}
        <div className="p-4 border-t border-gray-200">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "space-x-3")}>
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-[#CE0000]">
              {/* Show admin profile picture if available */}
              {adminData && adminData.profilePicture ? (
                <img 
                  src={adminData.profilePicture.startsWith('http') 
                    ? adminData.profilePicture 
                    : `http://localhost:3000/uploads/profilePictures/${adminData.profilePicture}`} 
                  alt="Admin" 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <User className="h-6 w-6 text-[#CE0000]" />
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {loading ? "Loading..." : adminData ? adminData.userName : "Admin User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {loading ? "Loading..." : adminData ? adminData.email : "admin@traintact.com"}
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

// Complete Admin Layout Component that includes both sidebar and main content area with navbar
export function AdminLayout({ children }) {
  const [adminData, setAdminData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Fetch admin data
  const fetchAdminData = async () => {
    try {
      setLoading(true)
      // Use the correct endpoint as per your router configuration
      const response = await axios.get('http://localhost:3000/api/admin/admin/info')

      if (response.data.success) {
        setAdminData(response.data.admin)
      }
    } catch (err) {
      console.error("Error fetching admin data:", err)
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchAdminData()
  }, [])

  // Handle profile update
  const handleProfileUpdate = (updatedAdmin) => {
    setAdminData(updatedAdmin)
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar adminData={adminData} />

      <div className="flex-1 flex flex-col">
        <AdminNavbar adminData={adminData} onProfileUpdate={handleProfileUpdate} />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout