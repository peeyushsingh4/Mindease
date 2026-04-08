const express = require('express');
const {
  createPost,
  getPosts,
  addComment,
  toggleLike,
  reportPost
} = require('../controllers/forumController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createPost)
  .get(protect, getPosts);

router.post('/:id/comment', protect, addComment);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/report', protect, reportPost);

module.exports = router;
