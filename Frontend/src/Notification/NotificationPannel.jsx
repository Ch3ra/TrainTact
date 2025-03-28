"use client"
import { Bell, Calendar, AlertTriangle, Trash2, CheckCircle, X } from 'lucide-react'
import { useNotifications } from "./NotificationContext"
import { useEffect } from "react"

const NotificationPanel = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications,
    fetchNotifications 
  } = useNotifications()

  // Refresh notifications when panel is opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  if (!isOpen) return null

  const getNotificationIcon = (type) => {
    switch (type) {
      case "schedule_request":
        return <Calendar size={20} className="text-blue-500" />
      case "schedule_accepted":
        return <CheckCircle size={20} className="text-green-500" />
      case "schedule_cancelled":
        return <AlertTriangle size={20} className="text-[#CE0000]" />
      case "system":
        return <Bell size={20} className="text-purple-500" />
      default:
        return <Bell size={20} className="text-gray-500" />
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
  }

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id)
    }

    // Handle navigation based on notification type
    if (notification.relatedSchedule) {
      // Navigate to the related schedule
      console.log("Navigate to schedule:", notification.relatedSchedule)
    }
  }

  return (
    <div className="absolute right-0 mt-4 w-96 bg-white border border-gray-200 rounded-lg shadow-lg text-sm z-50">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="font-semibold text-lg">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{unreadCount}</span>
          )}
        </h3>
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <button className="text-[#CE0000] hover:text-red-800 text-sm" onClick={markAllAsRead}>
              Mark all as read
            </button>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No notifications</div>
        ) : (
          <>
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 flex group ${
                  !notification.read ? "bg-gray-50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="mr-3 mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <p className={`font-medium ${!notification.read ? "text-black" : "text-gray-700"}`}>
                    {notification.title}
                  </p>
                  <p className="text-gray-700 mt-1">{notification.message}</p>
                  <p className="text-gray-500 text-xs mt-2">{formatDate(notification.createdAt)}</p>
                </div>
                <div className="flex flex-col justify-between items-end">
                  {!notification.read && <div className="h-3 w-3 bg-[#CE0000] rounded-full"></div>}
                  <button
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notification._id)
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <button
                  className="w-full text-center text-gray-500 hover:text-gray-700 text-sm"
                  onClick={clearAllNotifications}
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default NotificationPanel
