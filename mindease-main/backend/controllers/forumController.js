const { getDb } = require('../lib/firebase');

const nowIso = () => new Date().toISOString();
const postsCollection = () => getDb().collection('posts');

const toPostResponse = (docId, data, viewerUserId) => {
  const likes = Array.isArray(data.likes) ? data.likes : [];
  const comments = Array.isArray(data.comments) ? data.comments : [];
  const viewerId = viewerUserId ? String(viewerUserId) : '';

  return {
    _id: docId,
    id: docId,
    ...data,
    likeCount: likes.length,
    commentCount: comments.length,
    likedByMe: viewerId ? likes.includes(viewerId) : false
  };
};

// @desc    Create post
// @route   POST /api/forum
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, isAnonymousPost } = req.body;
    const normalizedTitle = title?.trim();
    const normalizedContent = content?.trim();

    if (!normalizedTitle || !normalizedContent) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    if (normalizedTitle.length < 5) {
      return res.status(400).json({ success: false, error: 'Title should be at least 5 characters' });
    }

    if (normalizedContent.length < 20) {
      return res.status(400).json({ success: false, error: 'Post content should be at least 20 characters' });
    }

    let authorName = req.user.name;
    if (isAnonymousPost || req.user.isAnonymous) {
      authorName = req.user.anonymousId || 'Anonymous Student';
    }

    const payload = {
      author: req.user.id,
      authorName,
      title: normalizedTitle,
      content: normalizedContent,
      category,
      likes: [],
      reports: 0,
      comments: [],
      createdAt: nowIso()
    };
    const docRef = await postsCollection().add(payload);
    const post = toPostResponse(docRef.id, payload, req.user.id);

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
    const snapshot = await postsCollection().get();
    const posts = snapshot.docs
      .map((doc) => toPostResponse(doc.id, doc.data(), req.user.id))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

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
    const postRef = postsCollection().doc(req.params.id);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    const post = postDoc.data();

    const { text } = req.body;
    const normalizedText = text?.trim();
    if (!normalizedText) {
      return res.status(400).json({ success: false, error: 'Comment text is required' });
    }
    if (normalizedText.length < 2) {
      return res.status(400).json({ success: false, error: 'Comment is too short' });
    }

    const comments = Array.isArray(post.comments) ? post.comments : [];
    comments.push({
      user: req.user.id,
      authorName: req.user.isAnonymous ? (req.user.anonymousId || 'Anonymous Student') : (req.user.name || 'Anonymous Student'),
      text: normalizedText,
      createdAt: nowIso()
    });
    await postRef.update({ comments });

    res.status(201).json({
      success: true,
      data: toPostResponse(postRef.id, { ...post, comments }, req.user.id)
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Toggle like on post
// @route   POST /api/forum/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
  try {
    const postRef = postsCollection().doc(req.params.id);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    const post = postDoc.data();

    const userId = req.user.id.toString();
    const likes = Array.isArray(post.likes) ? post.likes : [];
    const hasLiked = likes.includes(userId);

    if (hasLiked) {
      await postRef.update({ likes: likes.filter((id) => id !== userId) });
    } else {
      await postRef.update({ likes: [...likes, userId] });
    }

    const updated = await postRef.get();
    res.status(200).json({
      success: true,
      data: toPostResponse(updated.id, updated.data(), req.user.id),
      liked: !hasLiked
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Report post
// @route   POST /api/forum/:id/report
// @access  Private
exports.reportPost = async (req, res) => {
  try {
    const postRef = postsCollection().doc(req.params.id);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    const post = postDoc.data();

    const nextReports = Number(post.reports || 0) + 1;
    await postRef.update({ reports: nextReports });
    res.status(200).json({
      success: true,
      data: toPostResponse(postRef.id, { ...post, reports: nextReports }, req.user.id)
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
