require('dotenv').config();
const bcrypt = require('bcryptjs');
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

  const email = 'motorista@busconnect.com';
  const senha = 'senha123';
  const hash = await bcrypt.hash(senha, 10);

  await client.query('DELETE FROM usuarios WHERE email = $1', [email]);

  const { rows } = await client.query(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, 'MOTORISTA')
     RETURNING id, nome, email, perfil`,
    ['Motorista Teste', email, hash]
  );

  console.log('');
  console.log('===========================================');
  console.log('  USUARIO MOTORISTA CRIADO');
  console.log('===========================================');
  console.log('  Email: ' + email);
  console.log('  Senha: ' + senha);
  console.log('  Perfil: ' + rows[0].perfil);
  console.log('  ID: ' + rows[0].id);
  console.log('===========================================');
  console.log('');

  await client.end();
}

run().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });