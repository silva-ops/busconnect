require('dotenv').config();
const { Pool } = require('pg');

// Suporta tanto DATABASE_URL (Render+Neon) quanto variaveis separadas (local)
let config;

if (process.env.DATABASE_URL) {
  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  };
} else {
  config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'busconnect',
  };
}

const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('[pool] Erro inesperado:', err.message);
});

module.exports = pool;