const Organization = require('../models/Organization');

const createOrg = ({ name, ownerId }) => {
    return Organization.create({
        name,
        owner: ownerId,
        members: [{ user: ownerId, role: 'admin' }],
    });
};

const getOrgs = (userId) => {
    return Organization.find({ 'members.user': userId }).sort({ createdAt: -1 });
};

const getOrg = (orgId) => {
    return Organization.findById(orgId).populate('members.user', 'name email');
};

const isOrgMember = async (userId, orgId) => {
    const org = await Organization.findOne({ _id: orgId, 'members.user': userId });
    return !!org;
};

const addMember = async (orgId, userId, role = 'member') => {
    // Remove existing entry first so we can upsert the role cleanly
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

module.exports = { createOrg, getOrgs, getOrg, isOrgMember, addMember, removeMember };
