const Activity = require('../models/Activity');

const createActivity = ({ projectId, user, action, entity, entityId, meta }) => {
    return Activity.create({ projectId, user, action, entity, entityId, meta });
};

const getActivities = (projectId) => {
    return Activity.find({ projectId }).sort({ createdAt: -1 });
};

module.exports = { createActivity, getActivities };
