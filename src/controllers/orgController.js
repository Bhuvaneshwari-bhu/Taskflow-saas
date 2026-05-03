const mongoose = require('mongoose');
const { createOrg, getOrgs, getOrg, addMember, removeMember } = require('../services/orgService');
const { logActivity, ACTIONS } = require('../utils/logActivity');

const create = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ success: false, message: 'Organization name is required' });
        }

        const org = await createOrg({ name: name.trim(), ownerId: req.user });

        res.status(201).json({ success: true, org });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getAll = async (req, res) => {
    try {
        const orgs = await getOrgs(req.user);
        res.status(200).json({ success: true, orgs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getOne = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid organization id' });
        }

        const org = await getOrg(id);

        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        const isMember = org.members.some(
            m => (m.user?._id || m.user).toString() === req.user.toString()
        );

        if (!isMember) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.status(200).json({ success: true, org });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const addOrgMember = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { userId, role } = req.body;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Valid userId is required' });
        }

        const validRoles = ['admin', 'member'];
        const memberRole = validRoles.includes(role) ? role : 'member';

        const org = await addMember(orgId, userId, memberRole);

        logActivity({ orgId, userId: req.user, action: ACTIONS.MEMBER_ADDED, entityType: 'org', entityId: orgId, metadata: { addedUserId: userId, role: memberRole } });

        res.status(200).json({ success: true, org });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const removeOrgMember = async (req, res) => {
    try {
        const { orgId, userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid userId' });
        }

        if (req.org.owner.toString() === userId) {
            return res.status(400).json({ success: false, message: 'Cannot remove the organization owner' });
        }

        const org = await removeMember(orgId, userId);

        res.status(200).json({ success: true, org });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { create, getAll, getOne, addOrgMember, removeOrgMember };
