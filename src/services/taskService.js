const Task = require('../models/Task');
const mongoose = require('mongoose');
const { getCache, setCache, deleteCache, KEYS, TTL } = require('../utils/cache');
const { notificationQueue } = require('../queue/queues');
const cloudinary = require('../config/cloudinary');
const { isProjectMember } = require('./projectService');

const getTask = async (taskId) => {
    return Task.findById(taskId);
};

const createTask = async({ title, description, projectId }) => {
    const task = await Task.create({ title, description, project: projectId });

    await deleteCache(KEYS.projectTasks(projectId));

    return task;
};

/**
 * Cache-aside: check Redis → on miss, query DB and populate cache.
 */
const getTasks = async(projectId) => {
    if (!mongoose.Types.ObjectId.isValid(projectId)) return [];

    const key    = KEYS.projectTasks(projectId);
    const cached = await getCache(key);
    if (cached) return cached;

    const tasks = await Task.find({ project: projectId })
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .lean();

    await setCache(key, tasks, TTL.TASKS);
    return tasks;
};

const updateTask = async(taskId, status) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) return null;

    const task = await Task.findByIdAndUpdate(taskId, { status }, { new: true })
        .populate('assignedTo', 'name email');

    if (task) {
        await deleteCache(KEYS.projectTasks(task.project.toString()));

        // Notify the assigned user when a task they own changes status
        if (task.assignedTo) {
            notificationQueue.add('taskUpdated', {
                userId:    task.assignedTo.toString(),
                taskId:    task._id.toString(),
                taskTitle: task.title,
                newStatus: status,
            }).then((job) => {
                console.log(`[queue:notification] job ${job.id} added — taskUpdated for user ${task.assignedTo}`);
            }).catch((err) => {
                console.error('[queue:notification] failed to enqueue taskUpdated:', err.message);
            });
        }
    }

    return task;
};

const assignTask = async(taskId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(taskId) ||
        !mongoose.Types.ObjectId.isValid(userId)
    ) return null;

    const task = await Task.findByIdAndUpdate(taskId, { assignedTo: userId }, { new: true })
        .populate('assignedTo', 'name email');

    if (task) {
        await deleteCache(KEYS.projectTasks(task.project.toString()));

        notificationQueue.add('taskAssigned', {
            userId:    userId,
            taskId:    task._id.toString(),
            taskTitle: task.title,
        }).then((job) => {
            console.log(`[queue:notification] job ${job.id} added — taskAssigned for user ${userId}`);
        }).catch((err) => {
            console.error('[queue:notification] failed to enqueue taskAssigned:', err.message);
        });
    }

    return task;
};

const updateTaskDetails = async(taskId, fields) => {
    const task = await Task.findByIdAndUpdate(taskId, { $set: fields }, { new: true });

    if (task) {
        await deleteCache(KEYS.projectTasks(task.project.toString()));

        if (task.assignedTo) {
            notificationQueue.add('taskUpdated', {
                userId:    task.assignedTo.toString(),
                taskId:    task._id.toString(),
                taskTitle: task.title,
                newStatus: null,
            }).then((job) => {
                console.log(`[queue:notification] job ${job.id} added — taskUpdated for user ${task.assignedTo}`);
            }).catch((err) => {
                console.error('[queue:notification] failed to enqueue taskUpdated:', err.message);
            });
        }
    }

    return task;
};

const deleteTask = async(taskId) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) return null;

    const task = await Task.findByIdAndDelete(taskId);

    if (task) await deleteCache(KEYS.projectTasks(task.project.toString()));

    return task;
};

// ── Attachments ────────────────────────────────────────────────────────────────

const err = (msg, status) => Object.assign(new Error(msg), { status });

/**
 * Uploads a file buffer to Cloudinary and pushes the attachment record to the task.
 * Access: project members only.
 */
const addAttachment = async (taskId, file, userId) => {
    const task = await Task.findById(taskId);
    if (!task) throw err('Task not found', 404);

    if (!await isProjectMember(userId, task.project)) throw err('Access denied', 403);

    // Convert buffer to base64 data URI — no extra streaming dependency needed
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    let result;
    try {
        result = await cloudinary.uploader.upload(dataUri, { resource_type: 'auto' });
    } catch (uploadErr) {
        throw err(`Cloudinary upload failed: ${uploadErr.message}`, 502);
    }

    const updated = await Task.findByIdAndUpdate(
        taskId,
        {
            $push: {
                attachments: {
                    url:        result.secure_url,
                    public_id:  result.public_id,
                    filename:   file.originalname,
                    uploadedBy: userId,
                },
            },
        },
        { new: true }
    );

    await deleteCache(KEYS.projectTasks(task.project.toString()));
    return updated;
};

/**
 * Deletes an attachment from Cloudinary and removes it from the task document.
 * Access: project members only.
 * For stricter enforcement (uploader-only delete), compare attachment.uploadedBy === userId.
 */
const deleteAttachment = async (taskId, publicId, userId) => {
    const task = await Task.findById(taskId);
    if (!task) throw err('Task not found', 404);

    if (!await isProjectMember(userId, task.project)) throw err('Access denied', 403);

    const attachment = task.attachments.find((a) => a.public_id === publicId);
    if (!attachment) throw err('Attachment not found', 404);

    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
    } catch (destroyErr) {
        throw err(`Cloudinary delete failed: ${destroyErr.message}`, 502);
    }

    const updated = await Task.findByIdAndUpdate(
        taskId,
        { $pull: { attachments: { public_id: publicId } } },
        { new: true }
    );

    await deleteCache(KEYS.projectTasks(task.project.toString()));
    return updated;
};

module.exports = {
    getTask,
    getTaskById: getTask,
    createTask,
    getTasks,
    updateTask,
    assignTask,
    updateTaskDetails,
    deleteTask,
    addAttachment,
    deleteAttachment,
};
