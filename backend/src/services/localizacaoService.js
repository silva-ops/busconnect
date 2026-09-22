const pool = require('../database/pool');
const { MotorViagem21 } = require('../motor/motorViagem21');
const ws = require('../websocket/server');

const motor = new MotorViagem21();
const viagensCarregadas = new Set();

async function carregarViagem(viagemId) {
  if (viagensCarregadas.has(viagemId)) return;

  const { rows: viagens } = await pool.query(
    'SELECT id, linha_id, rota_id, onibus_id, status FROM viagens WHERE id = $1', [viagemId]
  );
  if (viagens.length === 0) throw new Error('Viagem ' + viagemId + ' nao encontrada');
  const v = viagens[0];

  const { rows: pontos } = await pool.query(
    `SELECT p.id, p.nome, p.latitude::float AS latitude, p.longitude::float AS longitude, rp.ordem
     FROM rota_pontos rp
     JOIN pontos p ON p.id = rp.ponto_id
     WHERE rp.rota_id = $1 ORDER BY rp.ordem`, [v.rota_id]
  );

  motor.registrarViagem({
    viagemId: v.id, linhaId: v.linha_id, onibusId: v.onibus_id, pontos,
  });

  const { rows: passageiros } = await pool.query(
    `SELECT passageiro_id, ponto_destino_id, notificado_aproximacao, notificado_chegada
     FROM viagens_passageiros WHERE viagem_id = $1 AND status <> 'FINALIZADO'`, [viagemId]
  );

  const viagemMem = motor.viagens.get(viagemId);
  for (const p of passageiros) {
    viagemMem.passageiros.set(p.passageiro_id, {
      passageiroId: p.passageiro_id,
      pontoDestinoId: p.ponto_destino_id,
      status: 'EM_VIAGEM',
      notificadoAproximacao: p.notificado_aproximacao,
      notificadoChegada: p.notificado_chegada,
    });
  }

  if (v.status === 'FINALIZADA') {
    viagemMem.viagemFinalizada = true;
  }

  console.log('[localizacaoService] Viagem ' + viagemId + ' carregada: ' +
    pontos.length + ' pontos, ' + passageiros.length + ' passageiros ativos.');
  viagensCarregadas.add(viagemId);
}

function invalidarViagem(viagemId) {
  viagensCarregadas.delete(viagemId);
  motor.viagens.delete(viagemId);
  console.log('[localizacaoService] Cache invalidado para viagem ' + viagemId);
}

async function processarLocalizacao(payload) {
  const { viagemId, onibusId, latitude, longitude, velocidade, timestamp } = payload;
  await carregarViagem(viagemId);

  await pool.query(
    `INSERT INTO localizacoes_onibus (onibus_id, viagem_id, latitude, longitude, velocidade, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [onibusId, viagemId, latitude, longitude, velocidade, timestamp]
  );

  const resultado = motor.processarLocalizacao(payload);

  for (const ev of resultado.eventos) {
    if (ev.evento === 'passageiro:destino_proximo') {
      await pool.query(
        `UPDATE viagens_passageiros SET status='APROXIMANDO_DESTINO', notificado_aproximacao=TRUE
         WHERE viagem_id=$1 AND passageiro_id=$2 AND status<>'FINALIZADO'`,
        [viagemId, ev.passageiro_id]
      );
    }
    if (ev.evento === 'passageiro:chegou') {
      await pool.query(
        `UPDATE viagens_passageiros SET status='FINALIZADO', notificado_chegada=TRUE,
         chegou_em=NOW(), finalizado_em=NOW()
         WHERE viagem_id=$1 AND passageiro_id=$2 AND status<>'FINALIZADO'`,
        [viagemId, ev.passageiro_id]
      );
    }
    if (ev.evento === 'viagem:finalizada') {
      await pool.query(
        `UPDATE viagens SET status='FINALIZADA', finalizada_em=NOW()
         WHERE id=$1 AND status<>'FINALIZADA'`,
        [viagemId]
      );
      console.log('[localizacaoService] Viagem ' + viagemId + ' FINALIZADA automaticamente.');
    }
  }

  ws.emitirParaViagem(viagemId, 'onibus:localizacao', {
    viagem_id: viagemId, onibus_id: onibusId,
    latitude, longitude, velocidade, timestamp,
  });

  for (const ev of resultado.eventos) {
    ws.emitirParaViagem(viagemId, ev.evento, ev);
  }

  return resultado;
}

module.exports = { processarLocalizacao, carregarViagem, invalidarViagem, motor };