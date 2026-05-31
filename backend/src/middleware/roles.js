// Jerarquia de roles
const ROLE_LEVELS = {
  reader:     1,
  editor:     2,
  admin:      3,
  superadmin: 4,
};

// requireRole('editor') -> solo para editors admins y superadmins
function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    const userLevel = ROLE_LEVELS[req.user.role] || 0;
    const minLevel  = ROLE_LEVELS[minRole]        || 999;

    if (userLevel < minLevel) {
      return res.status(403).json({ 
        error: `Acceso denegado. Se requiere rol "${minRole}" o superior.` 
      });
    }

    next();
  };
}

module.exports = { requireRole };
