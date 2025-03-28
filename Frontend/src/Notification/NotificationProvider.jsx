"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { NotificationContext } from "./NotificationContext"
import socketService from "../../socketService"

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userId, setUserId] = useState(null)

  // Extract user ID from token
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]))
        setUserId(decodedToken.id)
      } catch (error) {
        console.error("Error decoding token:", error)
      }
    }
  }, [])

  // Connect to socket and listen for notifications
  useEffect(() => {
    if (!userId) return

    // Connect to socket
    const socket = socketService.connect(userId)

    if (socket) {
      console.log("Setting up notification listener for user:", userId)

      // Set up notification listener using the socketService method
      socketService.onNewNotification((notification) => {
        console.log("New notification received via socket:", notification)
        
        // Add the notification to the state if it's not already there
        setNotifications((prev) => {
          // Check if notification already exists to prevent duplicates
          const exists = prev.some(n => n._id === notification._id)
          if (exists) return prev
          return [notification, ...prev]
        })
        
        // Increment unread count
        if (!notification.read) {
          setUnreadCount((prev) => prev + 1)
        }

        // Show browser notification if supported
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("TrainTact", {
            body: notification.message,
            icon: "/favicon.ico",
          })
        }
      })

      // Clean up function
      return () => {
        socketService.removeNotificationListener("newNotification")
        socketService.removeNotificationListener("getNotification")
      }
    }
  }, [userId])

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission()
    }
  }, [])

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:3000/api/notifications/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Fetched notifications:", response.data)
      setNotifications(response.data)

      // Get unread count
      const unreadCountResponse = await axios.get(`http://localhost:3000/api/notifications/unread/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setUnreadCount(unreadCountResponse.data.count)
    } catch (err) {
      console.error("Error fetching notifications:", err)
      setError("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Fetch notifications on mount and when userId changes
  useEffect(() => {
    if (userId) {
      fetchNotifications()
    }
  }, [userId, fetchNotifications])

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    if (!userId) return

    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:3000/api/notifications/read/${notificationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId ? { ...notification, read: true } : notification,
        ),
      )

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Error marking notification as read:", err)
      setError("Failed to mark notification as read")
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId) return

    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:3000/api/notifications/read-all/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Update local state
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))

      // Reset unread count
      setUnreadCount(0)
    } catch (err) {
      console.error("Error marking all notifications as read:", err)
      setError("Failed to mark all notifications as read")
    }
  }

  // Delete a notification
  const deleteNotification = async (notificationId) => {
    if (!userId) return

    try {
      const token = localStorage.getItem("token")
      await axios.delete(`http://localhost:3000/api/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Update local state
      const deletedNotification = notifications.find((n) => n._id === notificationId)
      setNotifications((prev) => prev.filter((notification) => notification._id !== notificationId))

      // Update unread count if needed
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error("Error deleting notification:", err)
      setError("Failed to delete notification")
    }
  }

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!userId) return

    try {
      const token = localStorage.getItem("token")
      await axios.delete(`http://localhost:3000/api/notifications/clear/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Update local state
      setNotifications([])
      setUnreadCount(0)
    } catch (err) {
      console.error("Error clearing notifications:", err)
      setError("Failed to clear notifications")
    }
  }

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    fetchNotifications,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export default NotificationProvider
