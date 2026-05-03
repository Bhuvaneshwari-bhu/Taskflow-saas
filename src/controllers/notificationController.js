const mongoose = require('mongoose');
const { getNotifications, markAsRead } = require('../services/notificationService');

const getAll = async (req, res) => {
    try {
        const notifications = await getNotifications(req.user);
        res.status(200).json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const markRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid notification id' });
        }

        const notification = await markAsRead(id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, notification });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAll, markRead };
