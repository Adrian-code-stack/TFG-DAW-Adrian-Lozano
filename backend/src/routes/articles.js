const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.id, a.title, a.slug, a.excerpt, a.content,
        a.published_at AS publishedAt, a.cover_url, a.reading_time,
        u.username AS author
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.published_at IS NOT NULL
      ORDER BY a.published_at DESC
    `);

    const data = rows.map(a => ({
      id:          a.id,
      title:       a.title,
      slug:        a.slug,
      excerpt:     a.excerpt,
      content:     a.content,
      publishedAt: a.publishedAt,
      cover_url:   a.cover_url ?? null,
      readingTime: a.reading_time ?? null,
      author:      a.author ?? null,
    }));

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo artículos.' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.id, a.title, a.slug, a.excerpt, a.content,
        a.published_at AS publishedAt, a.cover_url, a.reading_time,
        u.username AS author
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.slug = ?
    `, [req.params.slug]);

    if (rows.length === 0) return res.status(404).json({ error: 'Artículo no encontrado.' });

    const a = rows[0];
    res.json({
      data: {
        id:          a.id,
        title:       a.title,
        slug:        a.slug,
        excerpt:     a.excerpt,
        content:     a.content,
        publishedAt: a.publishedAt,
        cover_url:   a.cover_url ?? null,
        readingTime: a.reading_time ?? null,
        author:      a.author ?? null,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo artículo.' });
  }
});

router.post('/', authMiddleware, requireRole('editor'), [
  body('title').trim().notEmpty().withMessage('El título es obligatorio.'),
  body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Slug inválido.'),
  body('content').notEmpty().withMessage('El contenido es obligatorio.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, slug, excerpt, content, publish } = req.body;

  try {
    const published_at = publish ? new Date() : null;
    const [result] = await db.query(
      'INSERT INTO articles (title, slug, excerpt, content, published_at, author_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, slug, excerpt || null, content, published_at, req.user.id]
    );
    res.status(201).json({ message: 'Artículo creado.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un artículo con ese slug.' });
    res.status(500).json({ error: 'Error creando artículo.' });
  }
});

router.put('/:id', authMiddleware, requireRole('editor'), async (req, res) => {
  const { title, slug, excerpt, content, publish } = req.body;

  try {
    const [existing] = await db.query('SELECT author_id FROM articles WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Artículo no encontrado.' });

    const ROLE_LEVELS = { reader: 1, editor: 2, admin: 3, superadmin: 4 };
    const isOwner     = existing[0].author_id === req.user.id;
    const isAdmin     = ROLE_LEVELS[req.user.role] >= 3;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Solo puedes editar tus propios artículos.' });
    }

    const published_at = publish !== undefined
      ? (publish ? new Date() : null)
      : undefined;

    let query  = 'UPDATE articles SET title=?, slug=?, excerpt=?, content=?';
    let params = [title, slug, excerpt, content];

    if (published_at !== undefined) {
      query  += ', published_at=?';
      params.push(published_at);
    }

    query  += ' WHERE id=?';
    params.push(req.params.id);

    await db.query(query, params);
    res.json({ message: 'Artículo actualizado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando artículo.' });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Artículo no encontrado.' });
    res.json({ message: 'Artículo eliminado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando artículo.' });
  }
});

module.exports = router;