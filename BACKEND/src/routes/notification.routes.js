import express from 'express';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationStats
} from '../controllers/notification.controllers.js';

const router = express.Router();

router.get('/:userId', getUserNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/:userId/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/:userId/clear-all', clearAllNotifications);
router.get('/:userId/stats', getNotificationStats);

export default router;