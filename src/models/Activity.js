const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    action:    { type: String, required: true },
    entity:    { type: String, enum: ['task', 'comment', 'member'], required: true },
    entityId:  { type: mongoose.Schema.Types.ObjectId, required: true },
    meta:      { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
