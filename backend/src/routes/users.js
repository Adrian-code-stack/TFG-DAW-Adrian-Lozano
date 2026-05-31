const express = require('express');
const bcrypt  = require('bcryptjs');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo usuarios.' });
  }
});

router.get('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo usuario.' });
  }
});

router.put('/:id/role', authMiddleware, requireRole('superadmin'), async (req, res) => {
  const { role } = req.body;
  const validRoles = ['reader', 'editor', 'admin', 'superadmin'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Rol inválido. Valores permitidos: ${validRoles.join(', ')}` });
  }

  try {
    const [result] = await db.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ message: `Rol actualizado a "${role}".` });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando rol.' });
  }
});

router.delete('/:id', authMiddleware, requireRole('superadmin'), async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
  }
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ message: 'Usuario eliminado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando usuario.' });
  }
});

module.exports = router;
