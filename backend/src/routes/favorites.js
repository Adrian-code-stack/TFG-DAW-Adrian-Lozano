const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        f.id, f.created_at,
        g.id AS game_id, g.title, g.slug, g.cover_url, g.rawg_rating,
        c.name AS cat_name, c.slug AS cat_slug,
        c.accent_color AS accentColor, c.bg_color AS bgColor, c.border_color AS borderColor
      FROM favorites f
      JOIN games g ON f.game_id = g.id
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    const data = rows.map(f => ({
      id:         f.id,
      created_at: f.created_at,
      game: {
        id:          f.game_id,
        title:       f.title,
        slug:        f.slug,
        cover_url:   f.cover_url,
        rawg_rating: f.rawg_rating,
        category: f.cat_name ? {
          name:        f.cat_name,
          slug:        f.cat_slug,
          accentColor: f.accentColor,
          bgColor:     f.bgColor,
          borderColor: f.borderColor,
        } : null,
      }
    }));

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo favoritos.' });
  }
});

router.get('/check/:gameId', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id FROM favorites WHERE user_id = ? AND game_id = ?',
      [req.user.id, req.params.gameId]
    );
    res.json({ isFavorite: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Error comprobando favorito.' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { game_id } = req.body;
  if (!game_id) return res.status(400).json({ error: 'game_id es obligatorio.' });

  try {
    const [games] = await db.query('SELECT id FROM games WHERE id = ?', [game_id]);
    if (games.length === 0) return res.status(404).json({ error: 'Juego no encontrado.' });

    await db.query(
      'INSERT IGNORE INTO favorites (user_id, game_id) VALUES (?, ?)',
      [req.user.id, game_id]
    );
    res.status(201).json({ message: 'Añadido a favoritos.' });
  } catch (err) {
    res.status(500).json({ error: 'Error añadiendo favorito.' });
  }
});

router.delete('/:gameId', authMiddleware, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM favorites WHERE user_id = ? AND game_id = ?',
      [req.user.id, req.params.gameId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Favorito no encontrado.' });
    res.json({ message: 'Eliminado de favoritos.' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando favorito.' });
  }
});

module.exports = router;
