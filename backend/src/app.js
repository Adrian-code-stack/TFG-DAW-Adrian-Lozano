require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:4321',
    'https://gamevault.es',
    'https://www.gamevault.es',
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/games',      require('./routes/games'));
app.use('/api/articles',   require('./routes/articles'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/reviews',    require('./routes/reviews'));
app.use('/api/favorites',  require('./routes/favorites'));
app.use('/api/contact', require('./routes/contact'));


app.use('/api',            require('./routes/pages'));


app.get('/', (req, res) => {
  res.json({ 
    message: '🎮 GameVault API funcionando correctamente',
    version: '1.0.0',
    endpoints: [
      'GET  /api/games',
      'GET  /api/games/:slug',
      'POST /api/games',
      'PUT  /api/games/:id',
      'DEL  /api/games/:id',
      'GET  /api/categories',
      'GET  /api/categories/:slug',
      'GET  /api/articles',
      'GET  /api/articles/:slug',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET  /api/auth/me',
    ]
  });
});

app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 GameVault API corriendo en http://localhost:${PORT}`);
  console.log(`📋 Entorno: ${process.env.NODE_ENV || 'development'}`);
});
