const mongoose  = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const { VALID_ACTIONS } = require('../models/ActivityLog');
const { isOrgMember }   = require('../services/orgService');

const getLogs = async (req, res) => {
    try {
        const { orgId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orgId)) {
            return res.status(400).json({ success: false, message: 'Invalid orgId' });
        }

        const member = await isOrgMember(req.user, orgId);
        if (!member) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip  = (page - 1) * limit;

        const filter = { orgId };

        if (req.query.action && VALID_ACTIONS.includes(req.query.action)) {
            filter.action = req.query.action;
        }

        if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) {
            filter.userId = req.query.userId;
        }

        const [activities, total] = await Promise.all([
            ActivityLog.find(filter)
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ActivityLog.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            activities,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getLogs };
