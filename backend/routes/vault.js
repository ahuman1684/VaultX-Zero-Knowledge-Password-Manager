const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const entries = db.prepare(
    'SELECT id, site, username, encrypted_password, created_at, updated_at FROM passwords WHERE user_id = ? ORDER BY site ASC'
  ).all(req.userId);
  res.json(entries);
});

router.post('/', (req, res) => {
  const { site, username, encryptedPassword } = req.body;
  if (!site || !username || !encryptedPassword) {
    return res.status(400).json({ error: 'site, username, and encryptedPassword are required' });
  }

  const result = db.prepare(
    'INSERT INTO passwords (user_id, site, username, encrypted_password) VALUES (?, ?, ?, ?)'
  ).run(req.userId, site.trim(), username.trim(), encryptedPassword);

  const entry = db.prepare('SELECT * FROM passwords WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(entry);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { site, username, encryptedPassword } = req.body;

  const existing = db.prepare('SELECT id FROM passwords WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  db.prepare(
    'UPDATE passwords SET site = ?, username = ?, encrypted_password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
  ).run(site.trim(), username.trim(), encryptedPassword, id, req.userId);

  const updated = db.prepare('SELECT * FROM passwords WHERE id = ?').get(id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM passwords WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  db.prepare('DELETE FROM passwords WHERE id = ? AND user_id = ?').run(id, req.userId);
  res.json({ message: 'Entry deleted' });
});

module.exports = router;
