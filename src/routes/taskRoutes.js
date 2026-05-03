const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const { handleUpload } = require('../middlewares/upload');
const {
    create, getAll, getOne, update, updateDetails, assign, remove,
    uploadAttachment, removeAttachment,
} = require('../controllers/taskController');

router.get('/',    protect, getAll);
router.get('/:id', protect, getOne);
router.post('/',   protect, create);
router.put('/:id',         protect, update);
router.put('/:id/details', protect, updateDetails);
router.put('/:id/assign',  protect, assign);
router.delete('/:id',      protect, remove);

// Attachments
// DELETE uses :publicId — Cloudinary assigns slash-free IDs by default.
// If you later add a Cloudinary folder, URL-encode the public_id on the client (%2F → /).
router.post(  '/:id/upload',                   protect, handleUpload, uploadAttachment);
router.delete('/:taskId/attachments/:publicId', protect, removeAttachment);

module.exports = router;
