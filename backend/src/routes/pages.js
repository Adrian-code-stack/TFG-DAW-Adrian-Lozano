const express = require('express');
const router = express.Router();

router.get('/home-page', (req, res) => {
  res.json({
    data: {
      heroTag: 'Tu portal de videojuegos',
      heroTitle: 'Descubre tu próximo',
      heroTitleAccent: 'juego favorito',
      heroSubtitle: 'El catálogo definitivo en español. Explora cientos de juegos organizados por género, lee análisis editoriales y encuentra tu próxima aventura.',
      cta1Label: 'Explorar catálogo',
      cta1Href: '/games',
      cta2Label: 'Ver categorías',
      cta2Href: '/categories',
      cta3Label: 'Leer artículos',
      cta3Href: '/articles',
      statGamesLabel: 'Juegos en catálogo',
      statCategoriesLabel: 'Categorías',
      statCustomValue: '2026',
      statCustomLabel: 'Actualizado',
      categoriesSectionTitle: 'Explora por género',
      categoriesLinkLabel: 'Ver todas',
      categoriesLinkHref: '/categories',
      gamesSectionTitle: 'Últimas incorporaciones',
      gamesLinkLabel: 'Ver todos los juegos',
      gamesLinkHref: '/games',
      articlesSectionTitle: 'Artículos recientes',
      articlesLinkLabel: 'Ver todos los artículos',
      articlesLinkHref: '/articles',
      articlesEmptyText: 'Próximamente...',
    }
  });
});

router.get('/games-page', (req, res) => {
  res.json({
    data: {
      pageTag: 'Catálogo completo',
      pageTitle: 'Videojuegos',
      pageSubtitle: 'Explora nuestra colección organizada por género',
      searchPlaceholder: 'Buscar juego...',
      allCategoriesLabel: 'Todas las categorías',
      loadingText: 'Cargando juegos...',
      emptyTitle: 'No se encontraron juegos',
      emptySub: 'Prueba con otros filtros o términos de búsqueda',
      btnResetLabel: 'Limpiar filtros',
      sortTitleAsc: 'Título (A-Z)',
      sortTitleDesc: 'Título (Z-A)',
      sortDateDesc: 'Más recientes',
      sortDateAsc: 'Más antiguos',
      resultsLabel: 'juegos encontrados',
    }
  });
});

router.get('/game-page', (req, res) => {
  res.json({
    data: {
      backLabel: '← Volver al catálogo',
      releaseDateLabel: 'Fecha de lanzamiento',
      notFoundTitle: 'Juego no encontrado',
      notFoundBtn: 'Volver al catálogo',
      gamePlaceholder: 'Sin imagen disponible',
      noImageText: 'Sin imagen',
      noDescText: 'Sin descripción disponible',
    }
  });
});

router.get('/article-page', (req, res) => {
  res.json({
    data: {
      pageTag: 'Editorial',
      pageTitle: 'Artículos',
      pageSubtitle: 'Análisis, opiniones y noticias sobre la industria del videojuego',
      emptyTitle: 'Sin artículos todavía',
      emptySub: 'Próximamente publicaremos nuestros primeros análisis',
      emptyIcon: '📝',
      coverPlaceholder: 'Sin imagen',
      readingTimeSuffix: 'min de lectura',
    }
  });
});

router.get('/categories-page', (req, res) => {
  res.json({
    data: {
      exploreLabel: 'Géneros',
      pageTitle: 'Categorías',
      pageSubtitle: 'Encuentra juegos organizados por género',
      emptyText: 'Sin categorías disponibles',
    }
  });
});

router.get('/category-page', (req, res) => {
  res.json({
    data: {
      backLabel: '← Todas las categorías',
      emptyTitle: 'Sin juegos en esta categoría todavía',
      emptySub: 'Próximamente añadiremos más juegos',
    }
  });
});

module.exports = router;
