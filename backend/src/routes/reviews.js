// src/routes/reviews.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const ROLE_LEVELS = { reader: 1, editor: 2, admin: 3, superadmin: 4 };

// GET /api/reviews/game/:gameId
router.get('/game/:gameId', async (req, res) => {
  try {
    let userId = null;
    const auth = req.headers['authorization'];
    if (auth) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (e) {}
    }

    const [rows] = await db.query(`
      SELECT 
        r.id, r.rating, r.content, r.created_at, r.updated_at,
        u.id AS user_id, u.username,
        COALESCE(SUM(CASE WHEN rl.is_like = 1 THEN 1 ELSE 0 END), 0) AS likes,
        COALESCE(SUM(CASE WHEN rl.is_like = 0 THEN 1 ELSE 0 END), 0) AS dislikes
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN review_likes rl ON rl.review_id = r.id
      WHERE r.game_id = ?
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `, [req.params.gameId]);

    let userVotes = {};
    if (userId) {
      const [votes] = await db.query(
        'SELECT review_id, is_like FROM review_likes WHERE user_id = ?', [userId]
      );
      votes.forEach(v => { userVotes[v.review_id] = v.is_like; });
    }

    const data = rows.map(r => ({
      ...r,
      likes:    parseInt(r.likes),
      dislikes: parseInt(r.dislikes),
      userVote: userId ? (userVotes[r.id] !== undefined ? userVotes[r.id] : null) : null,
    }));

    const avg = data.length > 0
      ? (data.reduce((sum, r) => sum + r.rating, 0) / data.length).toFixed(1)
      : null;

    res.json({ data, average: avg, total: data.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo reseñas.' });
  }
});

// GET /api/reviews/user/me
router.get('/user/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.id, r.rating, r.content, r.created_at,
             g.id AS game_id, g.title AS game_title, g.slug AS game_slug
      FROM reviews r
      JOIN games g ON r.game_id = g.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo reseñas.' });
  }
});

// POST /api/reviews  - Crear o actualizar reseña
router.post('/', authMiddleware, [
  body('game_id').isInt().withMessage('game_id debe ser un número entero.'),
  body('rating').isInt({ min: 1, max: 10 }).withMessage('La nota debe ser entre 1 y 10.'),
  body('content').optional().trim().isLength({ max: 2000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { game_id, rating, content } = req.body;
  try {
    const [games] = await db.query('SELECT id FROM games WHERE id = ?', [game_id]);
    if (games.length === 0) return res.status(404).json({ error: 'Juego no encontrado.' });

    await db.query(`
      INSERT INTO reviews (user_id, game_id, rating, content)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE rating = VALUES(rating), content = VALUES(content), updated_at = NOW()
    `, [req.user.id, game_id, rating, content || null]);

    res.status(201).json({ message: 'Reseña guardada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error guardando reseña.' });
  }
});

// POST /api/reviews/:id/like  - Like o dislike
router.post('/:id/like', authMiddleware, async (req, res) => {
  const { is_like } = req.body;
  if (typeof is_like !== 'boolean') {
    return res.status(400).json({ error: 'is_like debe ser true o false.' });
  }
  try {
    const [rows] = await db.query('SELECT user_id FROM reviews WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Reseña no encontrada.' });
    if (rows[0].user_id === req.user.id) {
      return res.status(400).json({ error: 'No puedes votar tu propia reseña.' });
    }

    await db.query(`
      INSERT INTO review_likes (user_id, review_id, is_like)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE is_like = VALUES(is_like)
    `, [req.user.id, req.params.id, is_like ? 1 : 0]);

    const [counts] = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN is_like = 1 THEN 1 ELSE 0 END), 0) AS likes,
        COALESCE(SUM(CASE WHEN is_like = 0 THEN 1 ELSE 0 END), 0) AS dislikes
      FROM review_likes WHERE review_id = ?
    `, [req.params.id]);

    res.json({
      message: 'Voto registrado.',
      likes:    parseInt(counts[0].likes),
      dislikes: parseInt(counts[0].dislikes),
      userVote: is_like ? 1 : 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error registrando voto.' });
  }
});

// DELETE /api/reviews/:id/like - Quitar voto
router.delete('/:id/like', authMiddleware, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM review_likes WHERE user_id = ? AND review_id = ?',
      [req.user.id, req.params.id]
    );

    const [counts] = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN is_like = 1 THEN 1 ELSE 0 END), 0) AS likes,
        COALESCE(SUM(CASE WHEN is_like = 0 THEN 1 ELSE 0 END), 0) AS dislikes
      FROM review_likes WHERE review_id = ?
    `, [req.params.id]);

    res.json({
      message: 'Voto eliminado.',
      likes:    parseInt(counts[0].likes),
      dislikes: parseInt(counts[0].dislikes),
      userVote: null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando voto.' });
  }
});

// PUT /api/reviews/:id  - Editar reseña propia
router.put('/:id', authMiddleware, [
  body('rating').isInt({ min: 1, max: 10 }).withMessage('La nota debe ser entre 1 y 10.'),
  body('content').optional().trim().isLength({ max: 2000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const [rows] = await db.query('SELECT user_id FROM reviews WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Reseña no encontrada.' });
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Solo puedes editar tus propias reseñas.' });
    }

    const { rating, content } = req.body;
    await db.query(
      'UPDATE reviews SET rating = ?, content = ?, updated_at = NOW() WHERE id = ?',
      [rating, content || null, req.params.id]
    );
    res.json({ message: 'Reseña actualizada.' });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando reseña.' });
  }
});

// DELETE /api/reviews/:id  - Eliminar reseña (propia o administrador)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id FROM reviews WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Reseña no encontrada.' });

    const isOwner = rows[0].user_id === req.user.id;
    const isAdmin = (ROLE_LEVELS[req.user.role] || 0) >= 3;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta reseña.' });
    }

    await db.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Reseña eliminada.' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando reseña.' });
  }
});

module.exports = router;
