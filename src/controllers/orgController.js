const mongoose = require('mongoose');
const {
    createOrg,
    getOrgs,
    getOrg,
    addMember,
    removeMember,
    getOrgByInviteCode,
    joinByInviteCode,
    getOrCreateInviteCode,
    rotateInviteCode,
} = require('../services/orgService');
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

// ── Invite code ────────────────────────────────────────────────────────────────

// GET /org/join/:code — preview org info before joining
const getInviteInfo = async (req, res) => {
    try {
        const org = await getOrgByInviteCode(req.params.code);
        if (!org) return res.status(404).json({ success: false, message: 'Invalid invite code' });
        res.json({ success: true, org: { _id: org._id, name: org.name, memberCount: org.members.length } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /org/join — join via invite code
const joinOrg = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        if (!inviteCode?.trim()) {
            return res.status(400).json({ success: false, message: 'Invite code is required' });
        }
        const org = await joinByInviteCode(req.user, inviteCode.trim().toLowerCase());
        res.status(200).json({ success: true, org });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
};

// GET /org/:orgId/invite — get invite code (admin only)
const getOrgInvite = async (req, res) => {
    try {
        const inviteCode = await getOrCreateInviteCode(req.params.orgId);
        if (!inviteCode) return res.status(404).json({ success: false, message: 'Organization not found' });
        res.json({ success: true, inviteCode });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /org/:orgId/invite/regenerate — reset invite link (admin only)
const regenerateInvite = async (req, res) => {
    try {
        const inviteCode = await rotateInviteCode(req.params.orgId);
        if (!inviteCode) return res.status(404).json({ success: false, message: 'Organization not found' });
        res.json({ success: true, inviteCode });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { create, getAll, getOne, addOrgMember, removeOrgMember, getInviteInfo, joinOrg, getOrgInvite, regenerateInvite };
