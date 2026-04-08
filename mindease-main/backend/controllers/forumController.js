const Post = require('../models/Post');

// @desc    Create post
// @route   POST /api/forum
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, isAnonymousPost } = req.body;
    
    let authorName = req.user.name;
    if (isAnonymousPost || req.user.isAnonymous) {
      authorName = req.user.anonymousId || 'Anonymous Student';
    }

    const post = await Post.create({
      author: req.user.id,
      authorName,
      title,
      content,
      category
    });

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get all posts
// @route   GET /api/forum
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort('-createdAt');
    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Add comment
// @route   POST /api/forum/:id/comment
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const { text } = req.body;
    post.comments.push({
      user: req.user.id,
      text
    });

    await post.save();

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
