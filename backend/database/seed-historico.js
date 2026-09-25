require('dotenv').config();
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
  console.log('[seed-historico] Conectado ao banco');

  // Cria viagens FINALIZADAS antigas para o passageiro 10 (passageiro@busconnect.com)
  // Passageiro 10 = dono do app
  const viagensAntigas = [
    { id: 900, data: '2026-09-20 08:30:00', destino: 4 },
    { id: 901, data: '2026-09-21 18:15:00', destino: 3 },
    { id: 902, data: '2026-09-22 07:45:00', destino: 5 },
    { id: 903, data: '2026-09-23 12:30:00', destino: 4 },
    { id: 904, data: '2026-09-24 19:00:00', destino: 2 },
  ];

  // Tabela pode ter restricao de FK no id da viagem, entao inserimos em viagens tambem
  for (const v of viagensAntigas) {
    await client.query(
      `INSERT INTO viagens (id, linha_id, rota_id, onibus_id, status, iniciada_em, finalizada_em)
       VALUES ($1, 3050, 1, 1234, 'FINALIZADA', $2::timestamptz, $2::timestamptz + interval '20 minutes')
       ON CONFLICT (id) DO NOTHING`,
      [v.id, v.data]
    );

    await client.query(
      `INSERT INTO viagens_passageiros (viagem_id, passageiro_id, ponto_destino_id, status, embarcou_em, chegou_em, finalizado_em, notificado_aproximacao, notificado_chegada)
       VALUES ($1, 10, $2, 'FINALIZADO', $3::timestamptz, $3::timestamptz + interval '20 minutes', $3::timestamptz + interval '20 minutes', true, true)
       ON CONFLICT (viagem_id, passageiro_id) DO NOTHING`,
      [v.id, v.destino, v.data]
    );

    console.log('  + viagem ' + v.id + ' em ' + v.data + ' -> ponto ' + v.destino);
  }

  // Ajusta a sequence
  await client.query("SELECT setval('viagens_id_seq', 904)");

  console.log('');
  console.log('OK Historico criado para passageiro 10.');
  await client.end();
}

run().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });