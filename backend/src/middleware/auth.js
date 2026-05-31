// Verifica que el token JWT sea válido antes de acceder a rutas protegidas

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // El token viene en la cabecera: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Coger solo la parte despues de "Bearer"

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Añadimos el usuario decodificado al request
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
}

module.exports = authMiddleware;
