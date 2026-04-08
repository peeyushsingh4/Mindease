import React, { useState, useEffect } from 'react';
import api from '../api';
import { Search, Heart, MessageSquare, AlertTriangle, Plus, Users } from 'lucide-react';

const CATEGORIES = [
  { label: 'All',           value: 'all' },
  { label: 'Stress',        value: 'stress' },
  { label: 'Sleep',         value: 'sleep' },
  { label: 'Relationships', value: 'relationships' },
  { label: 'Mindfulness',   value: 'mindfulness' },
  { label: 'General',       value: 'general' },
];

const STARTER_POSTS = [
  {
    _id: 'demo-1',
    authorName: 'Anonymous Owl',
    title: "Dealing with mid-term stress? You're not alone.",
    content: "I've been feeling overwhelmed with multiple deadlines. What's helping me is 10 minutes of breathing before study blocks and breaking tasks into tiny goals.",
    category: 'stress',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 24,
    comments: [
      { text: 'This helped me too, thanks for sharing.' },
      { text: 'Tiny goals are a game changer.' }
    ],
    reports: 0
  },
  {
    _id: 'demo-2',
    authorName: 'Brave Penguin',
    title: 'Finally spoke to a counsellor today',
    content: "I was nervous, but it felt relieving to talk honestly. If you're unsure, maybe try one session first and decide after that.",
    category: 'general',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: 56,
    comments: [
      { text: 'Proud of you for taking that step.' },
      { text: 'Needed to hear this today.' },
      { text: 'Thanks for normalizing counselling.' }
    ],
    reports: 0
  },
  {
    _id: 'demo-3',
    authorName: 'Calm Breeze',
    title: 'Tips for anxiety before presentations?',
    content: 'My heartbeat gets intense before presenting. Any quick grounding techniques that work just before speaking?',
    category: 'stress',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    likes: 15,
    comments: [{ text: 'Try 4-6 breathing for 2 minutes right before you start.' }],
    reports: 0
  }
];

const Forum = () => {
  const [posts, setPosts] = useState([]);
  const [starterPosts, setStarterPosts] = useState(STARTER_POSTS);
  const [showCreate, setShowCreate] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [postError, setPostError] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [activeActionPostId, setActiveActionPostId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.get('/forum');
      setPosts(res.data.data);
    } catch (err) {
      console.error(err);
      setLoadError('Could not load community posts right now. Please refresh in a moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostError('');
    if (title.trim().length < 5) {
      setPostError('Title should be at least 5 characters.');
      return;
    }
    if (content.trim().length < 20) {
      setPostError('Post content should be at least 20 characters.');
      return;
    }
    try {
      await api.post('/forum', { title: title.trim(), content: content.trim(), category, isAnonymousPost: true });
      setShowCreate(false);
      setTitle('');
      setContent('');
      fetchPosts();
    } catch (err) {
      setPostError(err.response?.data?.error || 'Error creating post. Please try again.');
    }
  };

  const handleLike = async (postId) => {
    setActiveActionPostId(postId);
    const isDemo = postId.startsWith('demo-');
    if (isDemo) {
      setStarterPosts((prev) =>
        prev.map((post) => (post._id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post))
      );
      setActiveActionPostId(null);
      return;
    }
    try {
      await api.post(`/forum/${postId}/like`);
      await fetchPosts();
    } catch (err) {
      setLoadError(err.response?.data?.error || 'Could not update like. Please try again.');
    } finally {
      setActiveActionPostId(null);
    }
  };

  const handleReport = async (postId) => {
    setActiveActionPostId(postId);
    const isDemo = postId.startsWith('demo-');
    if (isDemo) {
      setStarterPosts((prev) =>
        prev.map((post) => (post._id === postId ? { ...post, reports: (post.reports || 0) + 1 } : post))
      );
      setActiveActionPostId(null);
      return;
    }
    try {
      await api.post(`/forum/${postId}/report`);
      await fetchPosts();
    } catch (err) {
      setLoadError(err.response?.data?.error || 'Could not submit report. Please try again.');
    } finally {
      setActiveActionPostId(null);
    }
  };

  const handleAddComment = async (postId) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;

    setActiveActionPostId(postId);
    const isDemo = postId.startsWith('demo-');
    if (isDemo) {
      setStarterPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, comments: [...(post.comments || []), { text }] } : post
        )
      );
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      setActiveActionPostId(null);
      return;
    }

    try {
      await api.post(`/forum/${postId}/comment`, { text });
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      await fetchPosts();
    } catch (err) {
      setLoadError(err.response?.data?.error || 'Could not add comment. Please try again.');
    } finally {
      setActiveActionPostId(null);
    }
  };

  const displayPosts = posts.length > 0 ? posts : starterPosts;
  const selectedPostData = selectedPost
    ? displayPosts.find((post) => post._id === selectedPost) || null
    : null;

  const filteredPosts = displayPosts.filter(post => {
    const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      post.title.toLowerCase().includes(q) ||
      post.content.toLowerCase().includes(q) ||
      post.authorName?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>Peer Support Community</h1>
          <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
            <Users size={16} /> 1,240 members online now
          </p>
        </div>
        <button onClick={() => { setShowCreate(!showCreate); setPostError(''); }} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem' }}>
          <Plus size={18} /> {showCreate ? 'Cancel' : 'Create New Post'}
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>New Discussion</h3>
          {postError && (
            <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {postError}
            </div>
          )}
          <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <input type="text" className="input-field" placeholder="Discussion Title" value={title} onChange={e => setTitle(e.target.value)} required />
            <textarea className="input-field" rows="4" placeholder="Share your thoughts..." value={content} onChange={e => setContent(e.target.value)} required></textarea>
            <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div style={{ alignSelf: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Publish Anonymously</button>
            </div>
          </form>
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search discussions..."
            className="input-field"
            style={{ paddingLeft: '2.5rem', borderRadius: '999px', margin: 0 }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              style={{
                backgroundColor: activeCategory === cat.value ? 'var(--primary)' : 'white',
                color: activeCategory === cat.value ? 'white' : 'var(--text-secondary)',
                border: activeCategory === cat.value ? 'none' : '1px solid var(--border-light)',
                padding: '0.5rem 1.25rem',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="card" style={{ marginBottom: '1rem', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#991b1b' }}>
          {loadError}
        </div>
      )}

      {filteredPosts.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            {loading ? 'Loading community posts...' : 'No posts found yet. Start the first supportive discussion.'}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredPosts.map(post => (
          <div
            key={post._id}
            className="card"
            style={{ display: 'flex', flexDirection: 'column', borderRadius: '20px', cursor: 'pointer' }}
            onClick={() => setSelectedPost(post._id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: post.color || 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {post.initial || post.authorName?.charAt(0) || '?'}
                </div>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.95rem' }}>{post.authorName}</h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(post.createdAt).toLocaleDateString()} • {post.category}
                  </div>
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {post.reports || 0} reports
              </span>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>{post.title}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {post.content}
            </p>

            <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '0.75rem', marginBottom: '1rem' }}>
              {(post.comments || []).slice(-2).map((comment, idx) => (
                <div key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  💬 {comment.text}
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  className="input-field"
                  placeholder="Add a supportive comment..."
                  style={{ margin: 0, fontSize: '0.82rem', padding: '0.55rem 0.75rem' }}
                  value={commentDrafts[post._id] || ''}
                  onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post._id]: e.target.value }))}
                />
                <button
                  onClick={() => handleAddComment(post._id)}
                  disabled={activeActionPostId === post._id}
                  className="btn btn-outline"
                  style={{ padding: '0.5rem 0.8rem' }}
                >
                  Post
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post._id);
                  }}
                  disabled={activeActionPostId === post._id}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Heart size={16} /> {Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)}
                </button>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <MessageSquare size={16} /> {post.comments?.length || 0}
                </span>
              </div>
              <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReport(post._id);
                  }}
                disabled={activeActionPostId === post._id}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
              >
                <AlertTriangle size={14} /> Report
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPosts.length > 0 && (
        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Be kind, avoid sharing personal identifiers, and report harmful content.
        </p>
      )}

      {selectedPostData && (
        <div
          onClick={() => setSelectedPost(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.5rem'
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '760px', width: '100%', maxHeight: '85vh', overflowY: 'auto', borderRadius: '18px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ marginBottom: '0.35rem', color: 'var(--secondary)' }}>{selectedPostData.title}</h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {selectedPostData.authorName} · {new Date(selectedPostData.createdAt).toLocaleString()} · {selectedPostData.category}
                </div>
              </div>
              <button className="btn btn-outline" onClick={() => setSelectedPost(null)}>Close</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>{selectedPostData.content}</p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}><Heart size={14} /> {Array.isArray(selectedPostData.likes) ? selectedPostData.likes.length : selectedPostData.likes || 0}</span>
              <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}><MessageSquare size={14} /> {(selectedPostData.comments || []).length}</span>
            </div>

            <h4 style={{ marginBottom: '0.75rem', color: 'var(--secondary)' }}>Community comments</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
              {(selectedPostData.comments || []).length === 0 && (
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No comments yet. Be the first to offer support.</div>
              )}
              {(selectedPostData.comments || []).map((comment, idx) => (
                <div key={idx} style={{ background: 'var(--bg-main)', borderRadius: '10px', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    {comment.authorName || 'Anonymous Student'}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{comment.text}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="input-field"
                placeholder="Write a supportive anonymous comment..."
                style={{ margin: 0 }}
                value={commentDrafts[selectedPostData._id] || ''}
                onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [selectedPostData._id]: e.target.value }))}
              />
              <button
                className="btn btn-primary"
                onClick={() => handleAddComment(selectedPostData._id)}
                disabled={activeActionPostId === selectedPostData._id}
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
