const express = require('express');
const { getClassPosts, createPost, deletePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { uploadPostImages } = require('../middleware/postUploadMiddleware');

const router = express.Router();

router.use(protect);

router.get('/class/:classId', getClassPosts);
router.post('/', uploadPostImages, createPost);
router.delete('/:postId', deletePost);

module.exports = router;