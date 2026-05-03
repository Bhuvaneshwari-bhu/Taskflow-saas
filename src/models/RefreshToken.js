const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token:     { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

// MongoDB TTL index — automatically deletes expired documents (no cron needed)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Fast single-token lookup (used on every refresh and logout)
refreshTokenSchema.index({ token: 1 });

// Fast user-wide scan (used on logout-all and reuse-detection wipe)
refreshTokenSchema.index({ userId: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
