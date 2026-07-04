import Notification from "../models/Notification.models.js";
import mongoose from "mongoose";

// Get all notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isRead, type, limit = 50, skip = 0 } = req.query;

    const query = { userId: new mongoose.Types.ObjectId(userId) };
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (type) query.type = type;

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

    const unreadCount = await Notification.countDocuments({ 
        userId: new mongoose.Types.ObjectId(userId), 
        isRead: false 
    });

    res.status(200).json(
        { success: true, message: "Notifications fetched successfully", data: { notifications, unreadCount } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json(
        { success: true, message: "Notification marked as read", data: notification }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await Notification.updateMany(
        { userId: new mongoose.Types.ObjectId(userId), isRead: false },
        { isRead: true }
    );

    res.status(200).json(
        { success: true, message: "All notifications marked as read", data: {} }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json(
        { success: true, message: "Notification deleted successfully", data: {} }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Clear all notifications for a user
export const clearAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    await Notification.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });

    res.status(200).json(
        { success: true, message: "All notifications cleared", data: {} }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Get notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await Notification.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: "$type",
                count: { $sum: 1 },
                unreadCount: {
                    $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] }
                }
            }
        }
    ]);

    const totalCount = await Notification.countDocuments({ 
        userId: new mongoose.Types.ObjectId(userId) 
    });
    const unreadCount = await Notification.countDocuments({ 
        userId: new mongoose.Types.ObjectId(userId), 
        isRead: false 
    });

    res.status(200).json(
        { success: true, message: "Notification statistics fetched successfully", data: {
            total: totalCount,
            unread: unreadCount,
            byType: stats
        } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};