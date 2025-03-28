"use client"

import { createContext, useContext } from "react"

// Create the notification context
export const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  clearAllNotifications: () => {},
  fetchNotifications: () => {},
})

// Custom hook for using the notification context
export const useNotifications = () => useContext(NotificationContext)

