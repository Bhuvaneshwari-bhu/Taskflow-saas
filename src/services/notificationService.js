const Notification = require('../models/Notification');

const createNotification = ({ user, projectId, type, message }) => {
    return Notification.create({ user, projectId, type, message });
};

const getNotifications = (userId) => {
    return Notification.find({ user: userId }).sort({ createdAt: -1 });
};

const markAsRead = (notificationId) => {
    return Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
};

module.exports = { createNotification, getNotifications, markAsRead };
