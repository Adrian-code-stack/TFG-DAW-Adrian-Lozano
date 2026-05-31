const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, slug, description, icon, accent_color as accentColor, bg_color as bgColor, border_color as borderColor, sort_order as `order` FROM categories ORDER BY sort_order ASC'
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo categorías.' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, slug, description, icon, accent_color as accentColor, bg_color as bgColor, border_color as borderColor, sort_order as `order` FROM categories WHERE slug = ?',
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Categoría no encontrada.' });
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo categoría.' });
  }
});

router.post('/', authMiddleware, requireRole('admin'), [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('El slug solo puede contener letras minúsculas, números y guiones.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, slug, description, icon, accentColor, bgColor, borderColor, order } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO categories (name, slug, description, icon, accent_color, bg_color, border_color, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, slug, description || null, icon || '🎮', accentColor || '#a1a1aa', bgColor || 'rgba(113,113,122,0.1)', borderColor || 'rgba(113,113,122,0.2)', order || 0]
    );
    res.status(201).json({ message: 'Categoría creada.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una categoría con ese slug.' });
    res.status(500).json({ error: 'Error creando categoría.' });
  }
});

router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, slug, description, icon, accentColor, bgColor, borderColor, order } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE categories SET name=?, slug=?, description=?, icon=?, accent_color=?, bg_color=?, border_color=?, sort_order=? WHERE id=?',
      [name, slug, description, icon, accentColor, bgColor, borderColor, order, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Categoría no encontrada.' });
    res.json({ message: 'Categoría actualizada.' });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando categoría.' });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Categoría no encontrada.' });
    res.json({ message: 'Categoría eliminada.' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando categoría.' });
  }
});

module.exports = router;
