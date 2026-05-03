const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const { create, getAll, addProjectMember } = require('../controllers/projectController');

router.get('/', protect, getAll);
router.post('/', protect, create);
router.post('/:id/members', protect, addProjectMember);

module.exports = router;
