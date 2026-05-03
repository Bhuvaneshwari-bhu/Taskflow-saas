const express = require('express');
const protect = require('../middlewares/authMiddleware');
const { getAll, markRead } = require('../controllers/notificationController');

const router = express.Router();

router.get('/', protect, getAll);
router.patch('/:id/read', protect, markRead);

module.exports = router;
