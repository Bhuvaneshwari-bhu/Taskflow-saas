const mongoose = require('mongoose');
const { getTask, getTaskById, createTask, getTasks, updateTask, assignTask, updateTaskDetails, deleteTask, addAttachment, deleteAttachment } = require('../services/taskService');
const { isProjectMember } = require('../services/projectService');
const { createActivity }    = require('../services/activityService');
const { createNotification } = require('../services/notificationService');
const { logActivity, ACTIONS } = require('../utils/logActivity');
const { getIO } = require('../socket');

const checkAccess = async (userId, projectId) => {
    return isProjectMember(userId, projectId);
};

const create = async(req, res) => {
    try {
        const { title, description, projectId } = req.body;

        if (!title || !projectId) {
            return res.status(400).json({ success: false, message: 'Title and projectId are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ success: false, message: 'Invalid projectId' });
        }

        if (!await checkAccess(req.user, projectId)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const task = await createTask({ title, description, projectId });

        createActivity({ projectId, user: req.user, action: 'created task', entity: 'task', entityId: task._id, meta: { title: task.title } }).catch(() => {});
        logActivity({ projectId, userId: req.user, action: ACTIONS.TASK_CREATED, entityType: 'task', entityId: task._id, metadata: { title: task.title } });
        getIO().to(projectId).emit('task:created', task);

        res.status(201).json({ success: true, task });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getAll = async(req, res) => {
    try {
        const { projectId } = req.query;

        if (!projectId) {
            return res.status(400).json({ success: false, message: 'projectId is required' });
        }

        if (!await checkAccess(req.user, projectId)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const tasks = await getTasks(projectId);

        res.status(200).json({ success: true, tasks });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const VALID_STATUSES = ['todo', 'in-progress', 'done'];

const update = async(req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid task id' });
        }

        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: 'Valid status is required' });
        }

        const existing = await getTask(id);

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        if (!await checkAccess(req.user, existing.project)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const task = await updateTask(id, status);

        createActivity({ projectId: existing.project, user: req.user, action: 'updated status', entity: 'task', entityId: task._id, meta: { status } }).catch(() => {});
        logActivity({ projectId: existing.project, userId: req.user, action: ACTIONS.TASK_MOVED, entityType: 'task', entityId: task._id, metadata: { title: existing.title, oldStatus: existing.status, newStatus: status } });
        getIO().to(existing.project.toString()).emit('task:updated', task);

        res.status(200).json({ success: true, task });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const assign = async(req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid task id' });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Valid userId is required' });
        }

        const existing = await getTask(id);

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        if (!await checkAccess(req.user, existing.project)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const task = await assignTask(id, userId);

        createActivity({ projectId: existing.project, user: req.user, action: 'assigned user', entity: 'task', entityId: task._id, meta: { assignedTo: userId } }).catch(() => {});
        logActivity({ projectId: existing.project, userId: req.user, action: ACTIONS.TASK_ASSIGNED, entityType: 'task', entityId: task._id, metadata: { title: existing.title, assignedTo: userId } });
        getIO().to(existing.project.toString()).emit('task:updated', task);

        if (userId !== req.user.toString()) {
            createNotification({
                user: userId,
                projectId: existing.project,
                type: 'task_assigned',
                message: `You have been assigned to task "${existing.title}"`,
            }).then((notification) => {
                getIO().to(userId).emit('notification:new', notification);
            }).catch(() => {});
        }

        res.status(200).json({ success: true, task });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const remove = async(req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid task id' });
        }

        const existing = await getTask(id);

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        if (!await checkAccess(req.user, existing.project)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        await deleteTask(id);

        createActivity({ projectId: existing.project, user: req.user, action: 'deleted task', entity: 'task', entityId: existing._id, meta: { title: existing.title } }).catch(() => {});
        logActivity({ projectId: existing.project, userId: req.user, action: ACTIONS.TASK_DELETED, entityType: 'task', entityId: existing._id, metadata: { title: existing.title } });
        getIO().to(existing.project.toString()).emit('task:deleted', { _id: existing._id });

        res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getOne = async(req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid task id' });
        }

        const task = await getTaskById(id);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        if (!await checkAccess(req.user, task.project)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.status(200).json({ success: true, task });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateDetails = async(req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid task id' });
        }

        if (!title && !description) {
            return res.status(400).json({ success: false, message: 'At least one of title or description is required' });
        }

        const existing = await getTask(id);

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        if (!await checkAccess(req.user, existing.project)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const fields = {};
        if (title) fields.title = title;
        if (description) fields.description = description;

        const task = await updateTaskDetails(id, fields);

        logActivity({ projectId: existing.project, userId: req.user, action: ACTIONS.TASK_UPDATED, entityType: 'task', entityId: task._id, metadata: { title: task.title } });

        res.status(200).json({ success: true, task });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const uploadAttachment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid task id' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file provided' });
        }

        const task = await addAttachment(id, req.file, req.user);
        res.status(200).json({ success: true, task });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
};

const removeAttachment = async (req, res) => {
    try {
        const { taskId, publicId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ success: false, message: 'Invalid task id' });
        }

        const task = await deleteAttachment(taskId, publicId, req.user);
        res.status(200).json({ success: true, task });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
};

module.exports = { create, getAll, getOne, update, updateDetails, assign, remove, uploadAttachment, removeAttachment };
