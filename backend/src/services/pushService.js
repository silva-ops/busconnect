require('dotenv').config();
const webpush = require('web-push');
const pool = require('../database/pool');

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@busconnect.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  console.log('[push] VAPID configurado.');
} else {
  console.warn('[push] VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY ausentes no .env');
}

async function salvarSubscription(dados) {
  const { passageiro_id, viagem_id, perfil, endpoint, p256dh, auth } = dados;
  await pool.query(
    `INSERT INTO push_subscriptions (passageiro_id, viagem_id, perfil, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (endpoint) DO UPDATE SET
       passageiro_id = EXCLUDED.passageiro_id,
       viagem_id = EXCLUDED.viagem_id,
       perfil = EXCLUDED.perfil,
       p256dh = EXCLUDED.p256dh,
       auth = EXCLUDED.auth`,
    [passageiro_id || null, viagem_id || null, perfil || 'PASSAGEIRO', endpoint, p256dh, auth]
  );
}

async function buscarSubscriptions(filtro) {
  const { passageiro_id, perfil, viagem_id } = filtro;
  const condicoes = [];
  const valores = [];
  let i = 1;

  if (passageiro_id != null) {
    condicoes.push('passageiro_id = $' + i); valores.push(passageiro_id); i++;
  }
  if (perfil != null) {
    condicoes.push('perfil = $' + i); valores.push(perfil); i++;
  }
  if (viagem_id != null) {
    condicoes.push('(viagem_id = $' + i + ' OR viagem_id IS NULL)');
    valores.push(viagem_id); i++;
  }

  const where = condicoes.length > 0 ? 'WHERE ' + condicoes.join(' AND ') : '';
  const { rows } = await pool.query(
    'SELECT id, passageiro_id, viagem_id, perfil, endpoint, p256dh, auth FROM push_subscriptions ' + where,
    valores
  );
  return rows;
}

async function removerSubscription(id) {
  await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [id]);
}

async function enviarPushUnico(sub, payload) {
  const pushSub = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };
  try {
    await webpush.sendNotification(pushSub, JSON.stringify(payload));
    return { ok: true };
  } catch (e) {
    if (e.statusCode === 410 || e.statusCode === 404) {
      // Subscription expirada, remover
      await removerSubscription(sub.id);
      return { ok: false, removida: true };
    }
    console.error('[push] erro ao enviar:', e.message);
    return { ok: false, erro: e.message };
  }
}

async function enviarParaPassageiro(passageiroId, payload) {
  const subs = await buscarSubscriptions({ passageiro_id: passageiroId });
  if (subs.length === 0) return { enviados: 0 };
  let enviados = 0;
  for (const s of subs) {
    const r = await enviarPushUnico(s, payload);
    if (r.ok) enviados++;
  }
  return { enviados, total: subs.length };
}

async function enviarParaMotoristas(payload) {
  const subs = await buscarSubscriptions({ perfil: 'MOTORISTA' });
  if (subs.length === 0) return { enviados: 0 };
  let enviados = 0;
  for (const s of subs) {
    const r = await enviarPushUnico(s, payload);
    if (r.ok) enviados++;
  }
  return { enviados, total: subs.length };
}

module.exports = {
  salvarSubscription,
  enviarParaPassageiro,
  enviarParaMotoristas,
  buscarSubscriptions,
};