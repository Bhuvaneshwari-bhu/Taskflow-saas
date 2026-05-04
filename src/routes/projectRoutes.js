const express = require('express');
const router  = express.Router();
const protect = require('../middlewares/authMiddleware');
const { getOne, create, getAll, addProjectMember } = require('../controllers/projectController');

router.get('/',                protect, getAll);
router.post('/',               protect, create);
router.get('/:id',             protect, getOne);
router.post('/:id/members',   protect, addProjectMember);  // keep for backwards compat
router.patch('/:id/members',  protect, addProjectMember);  // canonical verb

module.exports = router;
