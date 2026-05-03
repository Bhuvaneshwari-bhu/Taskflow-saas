const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const { create, getAll, remove } = require('../controllers/commentController');

router.get('/', protect, getAll);
router.post('/', protect, create);
router.delete('/:id', protect, remove);

module.exports = router;
