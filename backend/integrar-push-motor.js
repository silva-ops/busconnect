const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/backend/src/services/localizacaoService.js';
let txt = fs.readFileSync(arq, 'utf8');

if (txt.includes('pushService')) {
  console.log('-- pushService ja integrado');
  process.exit(0);
}

// 1) Adiciona require
txt = txt.replace(
  /const ws = require\('\.\.\/websocket\/server'\);/,
  "const ws = require('../websocket/server');\nconst pushService = require('./pushService');"
);

// 2) Adiciona envio de push apos o loop de eventos
const marcador = `  ws.emitirParaViagem(viagemId, 'onibus:localizacao', {
    viagem_id: viagemId, onibus_id: onibusId,
    latitude, longitude, velocidade, timestamp,
  });

  for (const ev of resultado.eventos) {
    ws.emitirParaViagem(viagemId, ev.evento, ev);
  }`;

const novoBloco = `  ws.emitirParaViagem(viagemId, 'onibus:localizacao', {
    viagem_id: viagemId, onibus_id: onibusId,
    latitude, longitude, velocidade, timestamp,
  });

  for (const ev of resultado.eventos) {
    ws.emitirParaViagem(viagemId, ev.evento, ev);

    // Envia Web Push (funciona mesmo com app fechado)
    try {
      if (ev.evento === 'passageiro:destino_proximo') {
        pushService.enviarParaPassageiro(ev.passageiro_id, {
          titulo: '⚠️ ATENÇÃO',
          corpo: 'Seu destino está próximo. Prepare-se para desembarcar.',
          vibrar: [200, 100, 200],
          persistente: false,
          url: '/',
          tag: 'busconnect-aproximando',
        }).catch((e) => console.error('[push] erro aprox:', e.message));
      }

      if (ev.evento === 'passageiro:chegou') {
        pushService.enviarParaPassageiro(ev.passageiro_id, {
          titulo: '🎉 VOCÊ CHEGOU',
          corpo: (ev.ponto_nome || 'Destino alcançado') + ' — Boa viagem!',
          vibrar: [400, 150, 400, 150, 400],
          persistente: true,
          url: '/',
          tag: 'busconnect-chegou',
        }).catch((e) => console.error('[push] erro chegou:', e.message));
      }

      if (ev.evento === 'motorista:aviso_desembarque') {
        pushService.enviarParaMotoristas({
          titulo: '🔔 PRÓXIMA PARADA',
          corpo: ev.ponto_nome + ' — ' + ev.passageiros + ' passageiro(s) desembarcam',
          vibrar: [400, 150, 400, 150, 400],
          persistente: false,
          url: '/',
          tag: 'motorista-parada',
        }).catch((e) => console.error('[push] erro mot:', e.message));
      }
    } catch (e) {
      console.error('[push] erro geral:', e.message);
    }
  }`;

if (txt.includes(marcador)) {
  txt = txt.replace(marcador, novoBloco);
  console.log('OK push integrado ao motor.');
} else {
  console.log('!! marcador nao encontrado, aplicando patch alternativo');

  // Patch alternativo: adiciona push dentro do loop existente
  const loopAntigo = `  for (const ev of resultado.eventos) {
    ws.emitirParaViagem(viagemId, ev.evento, ev);
  }`;
  const loopNovo = `  for (const ev of resultado.eventos) {
    ws.emitirParaViagem(viagemId, ev.evento, ev);
    try {
      if (ev.evento === 'passageiro:destino_proximo') {
        pushService.enviarParaPassageiro(ev.passageiro_id, {
          titulo: '⚠️ ATENÇÃO',
          corpo: 'Seu destino está próximo. Prepare-se para desembarcar.',
          vibrar: [200, 100, 200],
          persistente: false,
          url: '/',
          tag: 'busconnect-aproximando',
        }).catch((e) => console.error('[push] erro aprox:', e.message));
      }
      if (ev.evento === 'passageiro:chegou') {
        pushService.enviarParaPassageiro(ev.passageiro_id, {
          titulo: '🎉 VOCÊ CHEGOU',
          corpo: (ev.ponto_nome || 'Destino alcançado') + ' — Boa viagem!',
          vibrar: [400, 150, 400, 150, 400],
          persistente: true,
          url: '/',
          tag: 'busconnect-chegou',
        }).catch((e) => console.error('[push] erro chegou:', e.message));
      }
      if (ev.evento === 'motorista:aviso_desembarque') {
        pushService.enviarParaMotoristas({
          titulo: '🔔 PRÓXIMA PARADA',
          corpo: ev.ponto_nome + ' — ' + ev.passageiros + ' passageiro(s) desembarcam',
          vibrar: [400, 150, 400, 150, 400],
          persistente: false,
          url: '/',
          tag: 'motorista-parada',
        }).catch((e) => console.error('[push] erro mot:', e.message));
      }
    } catch (e) {
      console.error('[push] erro geral:', e.message);
    }
  }`;
  if (txt.includes(loopAntigo)) {
    txt = txt.replace(loopAntigo, loopNovo);
    console.log('OK push integrado (padrao alternativo).');
  } else {
    console.log('!! loop nao encontrado, tentando padrao 3');
    const loop3 = `  for (const ev of resultado.eventos) {
    ws.emitirParaViagem(viagemId, ev.evento, ev);
  }`;
    if (txt.includes(loop3)) {
      txt = txt.replace(loop3, loopNovo);
      console.log('OK push integrado (padrao 3).');
    } else {
      console.log('!! nenhum padrao encontrado');
    }
  }
}

fs.writeFileSync(arq, txt, 'utf8');
console.log('OK localizacaoService.js atualizado.');