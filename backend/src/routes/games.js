const express = require('express');
const fetch   = require('node-fetch');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

// Helper: obtener datos de RAWG por nombre de juego
async function fetchRawgData(gameTitle) {
  try {
    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) return null;

    // Buscar el juego
    const query     = encodeURIComponent(gameTitle);
    const searchUrl = `https://api.rawg.io/api/games?key=${apiKey}&search=${query}&page_size=1&search_precise=true`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) return null;
    const game = searchData.results[0];

    // Descripcion larga
    let rawgDescription = null;
    try {
      const detailUrl  = `https://api.rawg.io/api/games/${game.id}?key=${apiKey}`;
      const detailRes  = await fetch(detailUrl);
      const detailData = await detailRes.json();
      rawgDescription  = detailData.description_raw || null;
    } catch (e) {
      console.error('Error obteniendo detalle RAWG:', e.message);
    }

    // Fotos
    let rawgScreenshots = null;
    try {
      const scrUrl  = `https://api.rawg.io/api/games/${game.id}/screenshots?key=${apiKey}&page_size=6`;
      const scrRes  = await fetch(scrUrl);
      const scrData = await scrRes.json();
      if (scrData.results && scrData.results.length > 0) {
        rawgScreenshots = JSON.stringify(scrData.results.map(s => s.image));
      }
    } catch (e) {
      console.error('Error obteniendo screenshots RAWG:', e.message);
    }

    // Trailer o Video
    let rawgVideo = null;
    try {
      const movUrl  = `https://api.rawg.io/api/games/${game.id}/movies?key=${apiKey}`;
      const movRes  = await fetch(movUrl);
      const movData = await movRes.json();
      if (movData.results && movData.results.length > 0) {
        // Intentar conseguir la maxima calidad o sino la de 480
        rawgVideo = movData.results[0].data?.max || movData.results[0].data?.['480'] || null;
      }
    } catch (e) {
      console.error('Error obteniendo vídeo RAWG:', e.message);
    }

    return {
      rawg_id:          game.id,
      cover_url:        game.background_image || null,
      rawg_rating:      game.rating           || null,
      rawg_platforms:   game.platforms
        ? game.platforms.map(p => p.platform.name).join(', ')
        : null,
      rawg_description: rawgDescription,
      rawg_screenshots: rawgScreenshots,
      rawg_video:       rawgVideo,
    };
  } catch (err) {
    console.error('Error consultando RAWG:', err.message);
    return null;
  }
}

// GET /api/games  - Listar juegos 
// Soporta ?category=slug para filtrar por categoría

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT 
        g.id, g.title, g.slug, g.description, g.rawg_description, g.release_date,
        g.cover_url, g.rawg_rating, g.rawg_platforms,
        c.id   AS cat_id,
        c.name AS cat_name,
        c.slug AS cat_slug,
        c.accent_color AS cat_accentColor,
        c.bg_color     AS cat_bgColor,
        c.border_color AS cat_borderColor
      FROM games g
      LEFT JOIN categories c ON g.category_id = c.id
    `;
    const params = [];
    if (category) {
      query += ' WHERE c.slug = ?';
      params.push(category);
    }
    query += ' ORDER BY g.release_date DESC, g.id DESC';

    const [rows] = await db.query(query, params);

    // Formateo para el Frontend
    const data = rows.map(g => ({
      id:               g.id,
      title:            g.title,
      slug:             g.slug,
      description:      g.description,
      rawg_description: g.rawg_description,
      release_date:     g.release_date,
      cover_url:        g.cover_url,
      rawg_rating:      g.rawg_rating,
      rawg_platforms:   g.rawg_platforms,
      category: g.cat_id ? {
        id:          g.cat_id,
        name:        g.cat_name,
        slug:        g.cat_slug,
        accentColor: g.cat_accentColor,
        bgColor:     g.cat_bgColor,
        borderColor: g.cat_borderColor,
      } : null,
    }));

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo juegos.' });
  }
});

// GET /api/games/:slug  - Juego individual

router.get('/:slug', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        g.id, g.title, g.slug, g.description, g.rawg_description, g.release_date,
        g.cover_url, g.rawg_rating, g.rawg_platforms, g.rawg_id, g.rawg_screenshots, g.rawg_video,
        c.id   AS cat_id,
        c.name AS cat_name,
        c.slug AS cat_slug,
        c.accent_color AS cat_accentColor,
        c.bg_color     AS cat_bgColor,
        c.border_color AS cat_borderColor
      FROM games g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE g.slug = ?
    `, [req.params.slug]);

    if (rows.length === 0) return res.status(404).json({ error: 'Juego no encontrado.' });

    const g = rows[0];
    res.json({
      data: {
        id:               g.id,
        title:            g.title,
        slug:             g.slug,
        description:      g.description,
        rawg_description: g.rawg_description,
        release_date:     g.release_date,
        cover_url:        g.cover_url,
        rawg_rating:      g.rawg_rating,
        rawg_platforms:   g.rawg_platforms,
        rawg_id:          g.rawg_id,
        rawg_screenshots: g.rawg_screenshots ? JSON.parse(g.rawg_screenshots) : [],
        rawg_video:       g.rawg_video,
        category: g.cat_id ? {
          id:          g.cat_id,
          name:        g.cat_name,
          slug:        g.cat_slug,
          accentColor: g.cat_accentColor,
          bgColor:     g.cat_bgColor,
          borderColor: g.cat_borderColor,
        } : null,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo juego.' });
  }
});

// POST /api/games  - Crear juego (editor o admins)

router.post('/', authMiddleware, requireRole('editor'), [
  body('title').trim().notEmpty().withMessage('El título es obligatorio.'),
  body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Slug inválido.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, slug, description, release_date, category_id, cover_url } = req.body;

  try {
    // Intentar enriquecer con datos de RAWG
    let rawgData = null;
    if (!cover_url) {
      rawgData = await fetchRawgData(title);
    }

    const [result] = await db.query(
      `INSERT INTO games (title, slug, description, rawg_description, release_date, category_id, created_by, cover_url, rawg_id, rawg_rating, rawg_platforms, rawg_screenshots, rawg_video)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, slug, description || null,
        rawgData?.rawg_description || null,
        release_date || null, category_id || null,
        req.user.id,
        cover_url || rawgData?.cover_url || null,
        rawgData?.rawg_id || null,
        rawgData?.rawg_rating || null,
        rawgData?.rawg_platforms || null,
        rawgData?.rawg_screenshots || null,
        rawgData?.rawg_video || null,
      ]
    );

    res.status(201).json({ 
      message: 'Juego creado.', 
      id: result.insertId,
      rawgEnriched: !!rawgData 
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un juego con ese slug.' });
    res.status(500).json({ error: 'Error creando juego.' });
  }
});

// PUT /api/games/:id  - Actualizar juego (editor o admin)

router.put('/:id', authMiddleware, requireRole('editor'), async (req, res) => {
  const { title, slug, description, release_date, category_id, cover_url } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE games SET title=?, slug=?, description=?, release_date=?, category_id=?, cover_url=? WHERE id=?',
      [title, slug, description, release_date, category_id, cover_url, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Juego no encontrado.' });
    res.json({ message: 'Juego actualizado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando juego.' });
  }
});

// DELETE /api/games/:id  - Eliminar juego (admin)

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM games WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Juego no encontrado.' });
    res.json({ message: 'Juego eliminado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando juego.' });
  }
});

// POST /api/games/:id/enrich  - Enriquecer con RAWG manualmente (editor o admin)

router.post('/:id/enrich', authMiddleware, requireRole('editor'), async (req, res) => {
  try {
    const [games] = await db.query('SELECT title FROM games WHERE id = ?', [req.params.id]);
    if (games.length === 0) return res.status(404).json({ error: 'Juego no encontrado.' });

    const rawgData = await fetchRawgData(games[0].title);
    if (!rawgData) return res.status(404).json({ error: 'No se encontraron datos en RAWG para este juego.' });

    await db.query(
      'UPDATE games SET cover_url=?, rawg_id=?, rawg_rating=?, rawg_platforms=?, rawg_description=?, rawg_screenshots=?, rawg_video=? WHERE id=?',
      [rawgData.cover_url, rawgData.rawg_id, rawgData.rawg_rating, rawgData.rawg_platforms, rawgData.rawg_description, rawgData.rawg_screenshots, rawgData.rawg_video, req.params.id]
    );

    res.json({ message: 'Juego enriquecido con datos de RAWG.', rawgData });
  } catch (err) {
    res.status(500).json({ error: 'Error enriqueciendo juego.' });
  }
});

module.exports = router;
