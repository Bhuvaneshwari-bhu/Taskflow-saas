const mongoose = require('mongoose');
const { getActivities } = require('../services/activityService');

const getActivity = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid project id' });
        }

        const activities = await getActivities(id);

        res.status(200).json({ success: true, activities });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getActivity };
