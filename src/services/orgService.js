const crypto       = require('crypto');
const Organization = require('../models/Organization');

const genCode = () => crypto.randomBytes(6).toString('hex');

const createOrg = ({ name, ownerId }) => {
    return Organization.create({
        name,
        owner:      ownerId,
        members:    [{ user: ownerId, role: 'admin' }],
        inviteCode: genCode(),
    });
};

const getOrgs = (userId) => {
    return Organization.find({ 'members.user': userId })
        .populate('members.user', 'name email')
        .sort({ createdAt: -1 });
};

const getOrg = (orgId) => {
    return Organization.findById(orgId).populate('members.user', 'name email');
};

const isOrgMember = async (userId, orgId) => {
    const org = await Organization.findOne({ _id: orgId, 'members.user': userId });
    return !!org;
};

const addMember = async (orgId, userId, role = 'member') => {
    await Organization.findByIdAndUpdate(orgId, { $pull: { members: { user: userId } } });
    return Organization.findByIdAndUpdate(
        orgId,
        { $push: { members: { user: userId, role } } },
        { new: true }
    ).populate('members.user', 'name email');
};

const removeMember = (orgId, userId) => {
    return Organization.findByIdAndUpdate(
        orgId,
        { $pull: { members: { user: userId } } },
        { new: true }
    ).populate('members.user', 'name email');
};

// ── Invite code ────────────────────────────────────────────────────────────────

const getOrgByInviteCode = (inviteCode) => {
    return Organization.findOne({ inviteCode }, 'name members');
};

const joinByInviteCode = async (userId, inviteCode) => {
    const org = await Organization.findOne({ inviteCode });
    if (!org) throw Object.assign(new Error('Invalid invite code'), { status: 404 });

    const alreadyMember = org.members.some(m => m.user.toString() === userId.toString());
    if (alreadyMember) throw Object.assign(new Error('You are already a member of this organization'), { status: 400 });

    return Organization.findByIdAndUpdate(
        org._id,
        { $push: { members: { user: userId, role: 'member' } } },
        { new: true }
    ).populate('members.user', 'name email');
};

// Returns the invite code, generating one if the org predates this feature.
const getOrCreateInviteCode = async (orgId) => {
    const org = await Organization.findById(orgId);
    if (!org) return null;
    if (org.inviteCode) return org.inviteCode;
    const inviteCode = genCode();
    await Organization.findByIdAndUpdate(orgId, { inviteCode });
    return inviteCode;
};

const rotateInviteCode = async (orgId) => {
    const inviteCode = genCode();
    const org = await Organization.findByIdAndUpdate(orgId, { inviteCode }, { new: true });
    return org?.inviteCode ?? null;
};

module.exports = {
    createOrg,
    getOrgs,
    getOrg,
    isOrgMember,
    addMember,
    removeMember,
    getOrgByInviteCode,
    joinByInviteCode,
    getOrCreateInviteCode,
    rotateInviteCode,
};
