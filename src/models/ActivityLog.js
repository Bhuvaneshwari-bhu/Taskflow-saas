const mongoose = require('mongoose');

const VALID_ACTIONS = [
    'TASK_CREATED',
    'TASK_UPDATED',
    'TASK_MOVED',
    'TASK_ASSIGNED',
    'TASK_DELETED',
    'PROJECT_CREATED',
    'MEMBER_ADDED',
];

const activityLogSchema = new mongoose.Schema({
    orgId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },
    action:     { type: String, enum: VALID_ACTIONS, required: true },
    entityType: { type: String, enum: ['task', 'project', 'org'], required: true },
    entityId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    metadata:   { type: Object, default: {} },
}, { timestamps: true });

// Primary query pattern: org logs sorted by time (paginated timeline)
activityLogSchema.index({ orgId: 1, createdAt: -1 });
// Secondary: filter by user within an org
activityLogSchema.index({ orgId: 1, userId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
module.exports.VALID_ACTIONS = VALID_ACTIONS;
