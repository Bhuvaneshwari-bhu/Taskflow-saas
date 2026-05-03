const mongoose = require('mongoose');
const { createComment, getComments, getComment, deleteComment } = require('../services/commentService');
const { getTask } = require('../services/taskService');
const { isProjectMember } = require('../services/projectService');
const { createNotification } = require('../services/notificationService');
const { getIO } = require('../socket');

const create = async (req, res) => {
    try {
        const { text, taskId } = req.body;

        if (!text || !taskId) {
            return res.status(400).json({ success: false, message: 'text and taskId are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ success: false, message: 'Invalid taskId' });
        }

        const task = await getTask(taskId);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const allowed = await isProjectMember(req.user, task.project);

        if (!allowed) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const comment = await createComment({ text, taskId, userId: req.user });

        getIO().to(task.project.toString()).emit('comment:created', comment);

        if (task.assignedTo && task.assignedTo.toString() !== req.user.toString()) {
            createNotification({
                user: task.assignedTo,
                projectId: task.project,
                type: 'comment_added',
                message: `A comment was added to your task "${task.title}"`,
            }).then((notification) => {
                getIO().to(task.assignedTo.toString()).emit('notification:new', notification);
            }).catch(() => {});
        }

        res.status(201).json({ success: true, comment });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getAll = async (req, res) => {
    try {
        const { taskId } = req.query;

        if (!taskId) {
            return res.status(400).json({ success: false, message: 'taskId is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ success: false, message: 'Invalid taskId' });
        }

        const task = await getTask(taskId);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const allowed = await isProjectMember(req.user, task.project);

        if (!allowed) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const comments = await getComments(taskId);

        res.status(200).json({ success: true, comments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid comment id' });
        }

        const comment = await getComment(id);

        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        if (comment.user.toString() !== req.user.toString()) {
            return res.status(403).json({ success: false, message: 'Only comment owner can delete' });
        }

        await deleteComment(id);

        res.status(200).json({ success: true, message: 'Comment deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { create, getAll, remove };
