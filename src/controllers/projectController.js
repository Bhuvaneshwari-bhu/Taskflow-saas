const mongoose = require('mongoose');
const { getProject, createProject, getProjects, getProjectsByOrg, addMember } = require('../services/projectService');
const { isOrgMember } = require('../services/orgService');
const { createActivity }      = require('../services/activityService');
const { createNotification }  = require('../services/notificationService');
const { logActivity, ACTIONS } = require('../utils/logActivity');
const { getIO } = require('../socket');

const CLEAN_PROJECT = (p) => ({
    _id: p._id,
    name: p.name,
    description: p.description,
    owner: p.owner,
    members: p.members,
    orgId: p.orgId,
    createdAt: p.createdAt,
});

const create = async (req, res) => {
    try {
        const { name, description, orgId } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        if (orgId) {
            if (!mongoose.Types.ObjectId.isValid(orgId)) {
                return res.status(400).json({ success: false, message: 'Invalid orgId' });
            }
            const member = await isOrgMember(req.user, orgId);
            if (!member) {
                return res.status(403).json({ success: false, message: 'Not a member of this organization' });
            }
        }

        const project = await createProject({ name: name.trim(), description, ownerId: req.user, orgId });

        if (project.orgId) {
            logActivity({ orgId: project.orgId, userId: req.user, action: ACTIONS.PROJECT_CREATED, entityType: 'project', entityId: project._id, metadata: { name: project.name } });
        }

        res.status(201).json({ success: true, project: CLEAN_PROJECT(project) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getAll = async (req, res) => {
    try {
        const { orgId } = req.query;

        let projects;

        if (orgId) {
            if (!mongoose.Types.ObjectId.isValid(orgId)) {
                return res.status(400).json({ success: false, message: 'Invalid orgId' });
            }
            const member = await isOrgMember(req.user, orgId);
            if (!member) {
                return res.status(403).json({ success: false, message: 'Not a member of this organization' });
            }
            projects = await getProjectsByOrg(orgId);
        } else {
            projects = await getProjects(req.user);
        }

        res.status(200).json({ success: true, projects: projects.map(CLEAN_PROJECT) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const addProjectMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid project id' });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Valid userId is required' });
        }

        const existing = await getProject(id);

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (existing.owner.toString() !== req.user.toString()) {
            return res.status(403).json({ success: false, message: 'Only owner can add members' });
        }

        const project = await addMember(id, userId, req.user);

        createActivity({ projectId: id, user: req.user, action: 'added member', entity: 'member', entityId: userId, meta: { userId } }).catch(() => {});
        getIO().to(id).emit('member:added', { projectId: id, userId });

        createNotification({
            user: userId,
            projectId: id,
            type: 'member_added',
            message: `You have been added to project "${existing.name}"`,
        }).then((notification) => {
            getIO().to(userId).emit('notification:new', notification);
        }).catch(() => {});

        res.status(200).json({ success: true, project });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { create, getAll, addProjectMember };
