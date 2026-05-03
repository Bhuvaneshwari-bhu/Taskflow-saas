const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const { getActivity } = require('../controllers/activityController');

router.get('/:id/activity', protect, getActivity);

module.exports = router;
