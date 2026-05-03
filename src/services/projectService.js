const Project = require('../models/Project');
const { getCache, setCache, deleteCache, KEYS, TTL } = require('../utils/cache');
const { emailQueue } = require('../queue/queues');

// ── Read ───────────────────────────────────────────────────────────────────────

const getProject = async (projectId) => {
    return Project.findById(projectId);
};

/**
 * Cache-aside: check Redis → on miss, query DB and populate cache.
 * Returns plain objects after the first cache round-trip (JSON round-trip
 * strips Mongoose document methods, which is fine — callers only read fields).
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

    // Owner's project list now has one more entry
    await deleteCache(KEYS.userProjects(ownerId));
    if (orgId) await deleteCache(KEYS.orgProjects(orgId));

    return project;
};

// invitedBy is the requesting user's id (string) — used for the email job payload
const addMember = async (projectId, userId, invitedBy = null) => {
    const project = await Project.findByIdAndUpdate(
        projectId,
        { $addToSet: { members: userId } },
        { new: true }
    );

    if (project) {
        // New member can now see this project — their list is stale
        await deleteCache(KEYS.userProjects(userId));
        // Owner's cached project object has a stale members array
        await deleteCache(KEYS.userProjects(project.owner.toString()));
        // Org list also has a stale member count for this project
        if (project.orgId) await deleteCache(KEYS.orgProjects(project.orgId.toString()));

        // Queue invite email — fire and forget; Redis failure must not block the response
        emailQueue.add('sendInviteEmail', {
            email:       `user:${userId}`,   // swap for real user email when User is populated
            projectName: project.name,
            invitedBy:   invitedBy ? invitedBy.toString() : project.owner.toString(),
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
    createProject,
    getProjects,
    getProjectsByOrg,
    isProjectMember,
    addMember,
};
