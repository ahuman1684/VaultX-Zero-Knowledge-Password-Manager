const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

function signTokens(userId) {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

router.post('/register', async (req, res) => {
  const { username, masterPassword } = req.body;

  if (!username || !masterPassword) {
    return res.status(400).json({ error: 'Username and master password are required' });
  }
  if (username.length < 3 || username.length > 32) {
    return res.status(400).json({ error: 'Username must be 3–32 characters' });
  }
  if (masterPassword.length < 8) {
    return res.status(400).json({ error: 'Master password must be at least 8 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const passwordHash = await bcrypt.hash(masterPassword, 12);
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);

  res.status(201).json({ message: 'Account created successfully' });
});

router.post('/login', async (req, res) => {
  const { username, masterPassword } = req.body;

  if (!username || !masterPassword) {
    return res.status(400).json({ error: 'Username and master password are required' });
  }

  const user = db.prepare('SELECT id, password_hash FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(masterPassword, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { accessToken, refreshToken } = signTokens(user.id);
  res.json({ accessToken, refreshToken });
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);
    const accessToken = jwt.sign({ userId: payload.userId }, process.env.ACCESS_JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', (req, res) => {
  // Stateless — client clears tokens
  res.json({ message: 'Logged out' });
});

module.exports = router;
