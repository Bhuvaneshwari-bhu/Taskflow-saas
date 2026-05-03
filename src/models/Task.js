const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    url:        { type: String, required: true },
    public_id:  { type: String, required: true },
    filename:   { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const taskSchema = new mongoose.Schema({
    title:       { type: String, required: true },
    description: { type: String },
    status:      { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attachments: { type: [attachmentSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
