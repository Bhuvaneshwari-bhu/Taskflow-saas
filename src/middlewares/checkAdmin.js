const mongoose = require('mongoose');
const Organization = require('../models/Organization');

const checkAdmin = async (req, res, next) => {
    try {
        const orgId = req.params.orgId;

        if (!mongoose.Types.ObjectId.isValid(orgId)) {
            return res.status(400).json({ success: false, message: 'Invalid organization id' });
        }

        const org = await Organization.findById(orgId);

        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        const member = org.members.find(m => m.user.toString() === req.user.toString());

        if (!member || member.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        req.org = org;
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = checkAdmin;
