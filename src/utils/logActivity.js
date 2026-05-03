const ActivityLog = require('../models/ActivityLog');
const Project     = require('../models/Project');
const { getIO }   = require('../socket');

const ACTIONS = {
    TASK_CREATED:    'TASK_CREATED',
    TASK_UPDATED:    'TASK_UPDATED',
    TASK_MOVED:      'TASK_MOVED',
    TASK_ASSIGNED:   'TASK_ASSIGNED',
    TASK_DELETED:    'TASK_DELETED',
    PROJECT_CREATED: 'PROJECT_CREATED',
    MEMBER_ADDED:    'MEMBER_ADDED',
};

/**
 * Fire-and-forget activity logger.
 * Resolves orgId from projectId when not directly supplied.
 * Emits `activity:new` to the org socket room.
 * Never throws — safe to call without .catch().
 */
const logActivity = async ({ orgId, projectId, userId, action, entityType, entityId, metadata = {} }) => {
    try {
        if (!orgId && projectId) {
            const project = await Project.findById(projectId).select('orgId').lean();
            orgId = project?.orgId;
        }

        if (!orgId) return; // No org context (legacy project without orgId) — skip silently

        const log = await ActivityLog.create({ orgId, userId, action, entityType, entityId, metadata });

        // Populate before emitting so clients receive a complete object
        await log.populate('userId', 'name email');

        try {
            getIO().to(`org:${orgId.toString()}`).emit('activity:new', log.toObject());
        } catch {} // Socket not ready in test environments

    } catch {} // Never surface logging errors to callers
};

module.exports = { logActivity, ACTIONS };
