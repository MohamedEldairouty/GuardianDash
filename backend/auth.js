const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET = process.env.GD_JWT_SECRET || 'dev-only-secret-change-me';

function hash(password) {
  return bcrypt.hashSync(password, 10);
}

function verify(password, passwordHash) {
  return bcrypt.compareSync(password, passwordHash);
}

function sign(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    SECRET,
    { expiresIn: '30d' },
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, SECRET);
    req.userId = payload.sub;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { hash, verify, sign, requireAuth };
