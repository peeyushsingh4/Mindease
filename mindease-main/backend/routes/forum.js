const express = require('express');
const { createPost, getPosts, addComment } = require('../controllers/forumController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createPost)
  .get(protect, getPosts);

router.post('/:id/comment', protect, addComment);

module.exports = router;
