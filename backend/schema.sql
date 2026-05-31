-- ============================================================
-- GameVault - Script de creación de base de datos
-- Proyecto Integrado DAW - DIGITECH FP
-- ============================================================

CREATE DATABASE IF NOT EXISTS gamevault
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gamevault;

-- ------------------------------------------------------------
-- TABLA: users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(50)  NOT NULL UNIQUE,
  email        VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role         ENUM('superadmin','admin','editor','reader') NOT NULL DEFAULT 'reader',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLA: categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  slug         VARCHAR(100) NOT NULL UNIQUE,
  description  TEXT,
  icon         VARCHAR(20)  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  accent_color VARCHAR(30)  DEFAULT '#a1a1aa',
  bg_color     VARCHAR(50)  DEFAULT 'rgba(113,113,122,0.1)',
  border_color VARCHAR(50)  DEFAULT 'rgba(113,113,122,0.2)',
  sort_order   INT          DEFAULT 0,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLA: games
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS games (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  slug         VARCHAR(200) NOT NULL UNIQUE,
  description  TEXT,
  release_date DATE,
  cover_url    VARCHAR(500),
  rawg_id      INT,
  rawg_rating  DECIMAL(3,1),
  rawg_platforms VARCHAR(500),
  category_id  INT,
  created_by   INT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(id)      ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- TABLA: articles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(300) NOT NULL,
  slug         VARCHAR(300) NOT NULL UNIQUE,
  excerpt      TEXT,
  content      LONGTEXT,
  published_at DATETIME,
  author_id    INT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================

-- Usuarios (contraseñas hasheadas con bcrypt, valor original: "password123")
INSERT INTO users (username, email, password_hash, role) VALUES
('superadmin', 'superadmin@gamevault.es', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin'),
('admin',      'admin@gamevault.es',      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('editor',     'editor@gamevault.es',     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'editor'),
('lector',     'lector@gamevault.es',     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'reader');

-- Categorías
INSERT INTO categories (name, slug, description, icon, accent_color, bg_color, border_color, sort_order) VALUES
('Acción',      'accion',      'Juegos de acción frenética',      '⚔️',  '#ef4444', 'rgba(239,68,68,0.1)',   'rgba(239,68,68,0.2)',   1),
('RPG',         'rpg',         'Juegos de rol y aventura',        '🧙',  '#a855f7', 'rgba(168,85,247,0.1)', 'rgba(168,85,247,0.2)', 2),
('Shooter',     'shooter',     'Juegos de disparos',              '🔫',  '#f97316', 'rgba(249,115,22,0.1)', 'rgba(249,115,22,0.2)', 3),
('Terror',      'terror',      'Juegos de terror y survival',     '👻',  '#6366f1', 'rgba(99,102,241,0.1)', 'rgba(99,102,241,0.2)', 4),
('Deportes',    'deportes',    'Juegos deportivos',               '⚽',  '#22c55e', 'rgba(34,197,94,0.1)',  'rgba(34,197,94,0.2)',  5),
('Estrategia',  'estrategia',  'Juegos de estrategia y táctica',  '♟️',  '#eab308', 'rgba(234,179,8,0.1)',  'rgba(234,179,8,0.2)',  6),
('Aventura',    'aventura',    'Juegos de aventura y exploración','🗺️',  '#14b8a6', 'rgba(20,184,166,0.1)', 'rgba(20,184,166,0.2)', 7),
('Simulación',  'simulacion',  'Juegos de simulación',            '🛠️',  '#0ea5e9', 'rgba(14,165,233,0.1)', 'rgba(14,165,233,0.2)', 8),
('Roguelike',   'roguelike',   'Juegos roguelike y roguelite',    '🎲',  '#ec4899', 'rgba(236,72,153,0.1)', 'rgba(236,72,153,0.2)', 9),
('Indie',       'indie',       'Juegos independientes',           '🎨',  '#f59e0b', 'rgba(245,158,11,0.1)', 'rgba(245,158,11,0.2)', 10),
('Plataformas', 'plataformas', 'Juegos de plataformas',           '🏃',  '#84cc16', 'rgba(132,204,22,0.1)', 'rgba(132,204,22,0.2)', 11),
('Puzzle',      'puzzle',      'Juegos de puzles y lógica',       '🧩',  '#06b6d4', 'rgba(6,182,212,0.1)',  'rgba(6,182,212,0.2)',  12),
('Lucha',       'lucha',       'Juegos de lucha',                 '🥊',  '#f43f5e', 'rgba(244,63,94,0.1)',  'rgba(244,63,94,0.2)',  13);

-- Juegos de ejemplo
INSERT INTO games (title, slug, description, release_date, category_id, created_by) VALUES
('The Witcher 3: Wild Hunt', 'the-witcher-3-wild-hunt', 'Épico RPG de mundo abierto donde encarnas a Geralt de Rivia, un cazador de monstruos, en busca de su hija adoptiva en un mundo devastado por la guerra.', '2015-05-19', 2, 1),
('Dark Souls III',           'dark-souls-iii',          'La entrada más pulida de la trilogía Souls, con un diseño de niveles magistral y un combate exigente que recompensa la paciencia y el aprendizaje.', '2016-04-12', 1, 1),
('Hollow Knight',            'hollow-knight',           'Metroidvania indie ambientado en un reino de insectos subterráneo. Plataformas precisas, exploración profunda y un lore fascinante.', '2017-02-24', 10, 1),
('Hades',                    'hades',                   'Roguelike donde intentas escapar del Inframundo griego. Cada partida es diferente gracias a su sistema de progresión y narrativa entrelazada.', '2020-09-17', 9, 1),
('Resident Evil Village',    'resident-evil-village',   'Horror de supervivencia en primera persona. La aldea maldita, los cuatro Señores y una historia que equilibra terror y acción de forma magistral.', '2021-05-07', 4, 1),
('Celeste',                  'celeste',                 'Plataformas de precisión sobre salud mental. Desafiante pero justo, con un mensaje poderoso y una banda sonora memorable.', '2018-01-25', 11, 1);

-- Artículos de ejemplo
INSERT INTO articles (title, slug, excerpt, content, published_at, author_id) VALUES
('Los mejores RPGs de la última década', 'mejores-rpgs-ultima-decada',
 'Un repaso a los juegos de rol que han definido los años 2010-2020 y que ningún fan del género debería perderse.',
 'Los juegos de rol han vivido una edad dorada en la última década. Desde el impacto de The Witcher 3 hasta la revolución de Elden Ring, el género no ha parado de evolucionar. En este artículo repasamos los títulos imprescindibles que han marcado una era.',
 NOW(), 2),
('Guía para empezar en los Souls', 'guia-empezar-souls',
 'Todo lo que necesitas saber antes de adentrarte en el universo FromSoftware: consejos, mentalidad y por dónde empezar.',
 'Los juegos de FromSoftware tienen fama de ser brutalmente difíciles. Pero la dificultad no es el fin, sino el medio. Esta guía te ayudará a entender la filosofía detrás de estos juegos y cómo disfrutarlos al máximo.',
 NOW(), 2);
