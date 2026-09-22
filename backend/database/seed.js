require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const client = process.env.DATABASE_URL
    ? new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
    : new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'busconnect',
      });

  await client.connect();
  console.log('[seed] Conectado ao banco ' + (process.env.DB_NAME || 'busconnect'));

  const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  console.log('[seed] Inserindo dados iniciais...');
  await client.query(sql);
  console.log('[seed] Dados inseridos com sucesso.');

  await client.end();
}

run().catch((err) => {
  console.error('[seed] ERRO:', err.message);
  process.exit(1);
});
