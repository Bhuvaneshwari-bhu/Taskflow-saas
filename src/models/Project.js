const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    description: { type: String },
    owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    orgId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
