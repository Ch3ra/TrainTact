const Notification = require('../../model/NotificationModel');
const WorkoutSchedule = require("../../model/AvailabilityModel")
const mongoose = require('mongoose');

// Get all notifications for a user with pagination, filtering and sorting
exports.getNotifications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      read, 
      search,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;
    
    const userId = req.user._id; // Assuming user is attached to request via auth middleware
    
    // Build query
    const query = { recipient: userId };
    
    // Add filters if provided
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (read === 'read') {
      query.read = true;
    } else if (read === 'unread') {
      query.read = false;
    }
    
    // Add search if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add priority filter if provided (we'll need to add this field to your schema)
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Create sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const notifications = await Notification.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'firstName lastName profileImage')
      .populate('relatedSchedule');
    
    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    
    // Return response
    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: parseInt(page),
          perPage: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user is attached to request via auth middleware
    
    // Get total notifications count
    const totalNotifications = await Notification.countDocuments({ recipient: userId });
    
    // Get unread notifications count
    const unreadNotifications = await Notification.countDocuments({ 
      recipient: userId,
      read: false
    });
    
    // Get high priority notifications count (assuming we add priority field)
    const highPriorityNotifications = await Notification.countDocuments({
      recipient: userId,
      priority: 'high',
      read: false
    });
    
    // Get notifications by type
    const notificationsByType = await Notification.aggregate([
      { $match: { recipient: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Get notifications by day (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    
    const notificationsByDay = await Notification.aggregate([
      { 
        $match: { 
          recipient: mongoose.Types.ObjectId(userId),
          createdAt: { $gte: sevenDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Format the days of week
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedNotificationsByDay = [];
    
    // Create an array for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = daysOfWeek[date.getDay()];
      
      // Find if we have data for this day
      const dayData = notificationsByDay.find(item => item._id === dateString);
      
      formattedNotificationsByDay.push({
        day: dayOfWeek,
        count: dayData ? dayData.count : 0
      });
    }
    
    // Return response
    res.status(200).json({
      success: true,
      data: {
        totalNotifications,
        unreadNotifications,
        highPriorityNotifications,
        notificationsByType,
        notificationsByDay: formattedNotificationsByDay
      }
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find and update the notification
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or you do not have permission to update it'
      });
    }
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark notification as unread
exports.markAsUnread = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find and update the notification
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { read: false },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or you do not have permission to update it'
      });
    }
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as unread',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Update all unread notifications for this user
    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );
    
    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find and delete the notification
    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or you do not have permission to delete it'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Create a notification (utility function for other controllers)
exports.createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Update notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const settings = req.body;
    
    // In a real app, you would update the user's notification settings
    // For example:
    // await User.findByIdAndUpdate(userId, { notificationSettings: settings });
    
    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error.message
    });
  }
};
