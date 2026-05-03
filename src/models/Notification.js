const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: {
        type: String,
        enum: ['task_assigned', 'task_updated', 'member_added', 'comment_added'],
        required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
