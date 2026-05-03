const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const checkAdmin = require('../middlewares/checkAdmin');
const { create, getAll, getOne, addOrgMember, removeOrgMember } = require('../controllers/orgController');

router.post('/',                          protect,            create);
router.get('/',                           protect,            getAll);
router.get('/:id',                        protect,            getOne);
router.post('/:orgId/members',            protect, checkAdmin, addOrgMember);
router.delete('/:orgId/members/:userId',  protect, checkAdmin, removeOrgMember);

module.exports = router;
