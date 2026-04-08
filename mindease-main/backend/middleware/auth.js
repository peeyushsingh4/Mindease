const { getAuth, getDb } = require('../lib/firebase');

// Protect routes — verifies JWT and attaches req.user
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorised — no token provided' });
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    const userDoc = await getDb().collection('users').doc(decoded.uid).get();
    if (!userDoc.exists) {
      return res.status(401).json({ success: false, error: 'Not authorised — user no longer exists' });
    }

    req.user = {
      id: userDoc.id,
      uid: userDoc.id,
      ...userDoc.data()
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorised — invalid or expired token' });
  }
};

// Restrict to specific roles — must be used after protect
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Role '${req.user.role}' is not permitted to access this resource`
      });
    }
    next();
  };
};
