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
  console.log('[migrate] Conectado ao banco ' + (process.env.DB_NAME || 'busconnect'));

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('[migrate] Executando schema.sql...');
  await client.query(schema);
  console.log('[migrate] Schema aplicado com sucesso.');

  await client.end();
}

run().catch((err) => {
  console.error('[migrate] ERRO:', err.message);
  process.exit(1);
});
