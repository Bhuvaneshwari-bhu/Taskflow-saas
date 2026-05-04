const express    = require('express');
const router     = express.Router();
const protect    = require('../middlewares/authMiddleware');
const checkAdmin = require('../middlewares/checkAdmin');
const {
    create,
    getAll,
    getOne,
    addOrgMember,
    removeOrgMember,
    getInviteInfo,
    joinOrg,
    getOrgInvite,
    regenerateInvite,
} = require('../controllers/orgController');

// ── Collection routes ──────────────────────────────────────────────────────────
router.post('/',    protect, create);
router.get('/',     protect, getAll);

// ── Invite join routes — MUST come before /:id to avoid param conflict ─────────
router.get('/join/:code', protect, getInviteInfo);
router.post('/join',      protect, joinOrg);

// ── Single org ─────────────────────────────────────────────────────────────────
router.get('/:id',  protect, getOne);

// ── Member management (admin only) ────────────────────────────────────────────
router.post('/:orgId/members',           protect, checkAdmin, addOrgMember);
router.delete('/:orgId/members/:userId', protect, checkAdmin, removeOrgMember);

// ── Invite code management (admin only) ───────────────────────────────────────
router.get('/:orgId/invite',              protect, checkAdmin, getOrgInvite);
router.post('/:orgId/invite/regenerate',  protect, checkAdmin, regenerateInvite);

module.exports = router;
