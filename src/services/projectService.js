const Project = require('../models/Project');
const { getCache, setCache, deleteCache, KEYS, TTL } = require('../utils/cache');
const { emailQueue } = require('../queue/queues');

// ── Read ───────────────────────────────────────────────────────────────────────

const getProject = async (projectId) => {
    return Project.findById(projectId);
};

const getProjectWithMembers = (projectId) => {
    return Project.findById(projectId)
        .populate('members', 'name email')
        .populate('owner', 'name email');
};

/**
 * Cache-aside: check Redis → on miss, query DB and populate cache.
 */
const getProjects = async (userId) => {
    const key    = KEYS.userProjects(userId);
    const cached = await getCache(key);
    if (cached) return cached;

    const projects = await Project.find({
        $or: [{ owner: userId }, { members: userId }],
    }).sort({ createdAt: -1 });

    await setCache(key, projects, TTL.PROJECTS);
    return projects;
};

const getProjectsByOrg = async (orgId) => {
    const key    = KEYS.orgProjects(orgId);
    const cached = await getCache(key);
    if (cached) return cached;

    const projects = await Project.find({ orgId }).sort({ createdAt: -1 });

    await setCache(key, projects, TTL.PROJECTS);
    return projects;
};

// ── Write (always invalidate after mutation) ───────────────────────────────────

const createProject = async ({ name, description, ownerId, orgId }) => {
    const project = await Project.create({
        name,
        description,
        owner:   ownerId,
        members: [ownerId],
        ...(orgId && { orgId }),
    });

    await deleteCache(KEYS.userProjects(ownerId));
    if (orgId) await deleteCache(KEYS.orgProjects(orgId));

    return project;
};

const addMember = async (projectId, userId, invitedBy = null) => {
    const project = await Project.findByIdAndUpdate(
        projectId,
        { $addToSet: { members: userId } },
        { new: true }
    ).populate('members', 'name email').populate('owner', 'name email');

    if (project) {
        await deleteCache(KEYS.userProjects(userId));
        await deleteCache(KEYS.userProjects(project.owner._id.toString()));
        if (project.orgId) await deleteCache(KEYS.orgProjects(project.orgId.toString()));

        emailQueue.add('sendInviteEmail', {
            email:       `user:${userId}`,
            projectName: project.name,
            invitedBy:   invitedBy ? invitedBy.toString() : project.owner._id.toString(),
        }).then((job) => {
            console.log(`[queue:email] job ${job.id} added — sendInviteEmail for user ${userId}`);
        }).catch((err) => {
            console.error('[queue:email] failed to enqueue sendInviteEmail:', err.message);
        });
    }

    return project;
};

// ── Authorization (never cached — security-sensitive) ─────────────────────────

const isProjectMember = async (userId, projectId) => {
    const project = await Project.findById(projectId);
    if (!project) return false;
    const uid = userId.toString();
    return (
        project.owner.toString() === uid ||
        project.members.some((m) => m.toString() === uid)
    );
};

module.exports = {
    getProject,
    getProjectWithMembers,
    createProject,
    getProjects,
    getProjectsByOrg,
    isProjectMember,
    addMember,
};
