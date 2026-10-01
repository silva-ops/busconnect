// Simulador com 2 linhas em paralelo
// Linha 3050: onibus 1234, 1235, 1236 (rota 1)
// Linha 3060: onibus 1237 (rota 2)
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const INTERVALO_MS = 1000;

// Rotas hardcoded (batem com o banco)
const rota3050 = [
  { id: 1, latitude: -19.9500, longitude: -43.9400 },
  { id: 2, latitude: -19.9510, longitude: -43.9410 },
  { id: 3, latitude: -19.9520, longitude: -43.9420 },
  { id: 4, latitude: -19.9530, longitude: -43.9430 },
  { id: 5, latitude: -19.9540, longitude: -43.9440 },
];

const rota3060 = [
  { id: 6, latitude: -19.9450, longitude: -43.9350 },
  { id: 7, latitude: -19.9470, longitude: -43.9370 },
  { id: 8, latitude: -19.9490, longitude: -43.9390 },
  { id: 4, latitude: -19.9530, longitude: -43.9430 }, // compartilha Praca Central
  { id: 9, latitude: -19.9550, longitude: -43.9450 },
];

function construirTrilha(pontos, passosPorTrecho = 20) {
  const trilha = [];
  for (let i = 0; i < pontos.length - 1; i++) {
    const a = pontos[i];
    const b = pontos[i + 1];
    for (let s = 0; s < passosPorTrecho; s++) {
      const t = s / passosPorTrecho;
      trilha.push({
        latitude: a.latitude + (b.latitude - a.latitude) * t,
        longitude: a.longitude + (b.longitude - a.longitude) * t,
      });
    }
  }
  const ultimo = pontos[pontos.length - 1];
  trilha.push({ latitude: ultimo.latitude, longitude: ultimo.longitude });
  return trilha;
}

const trilha3050 = construirTrilha(rota3050, 20);
const trilha3060 = construirTrilha(rota3060, 20);

// Onibus com offset para nao andarem colados
const onibus = [
  { viagemId: 500, onibusId: 1234, trilha: trilha3050, offset: 0 },
  { viagemId: 501, onibusId: 1235, trilha: trilha3050, offset: 20 },
  { viagemId: 502, onibusId: 1236, trilha: trilha3050, offset: 40 },
  { viagemId: 503, onibusId: 1237, trilha: trilha3060, offset: 0 },
];

async function enviar(info, pos) {
  try {
    await axios.post(API_URL + '/api/onibus/localizacao', {
      onibus_id: info.onibusId,
      viagem_id: info.viagemId,
      latitude: pos.latitude,
      longitude: pos.longitude,
      velocidade: 30,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err.response ? JSON.stringify(err.response.data) : err.message;
    console.error('[ERRO viagem ' + info.viagemId + ']', msg);
  }
}

async function main() {
  console.log('[BusConnect] Simulador DUAS LINHAS iniciado');
  console.log('[BusConnect] Enviando para ' + API_URL);
  console.log('[BusConnect] Trilha 3050: ' + trilha3050.length + ' posicoes');
  console.log('[BusConnect] Trilha 3060: ' + trilha3060.length + ' posicoes');
  console.log('[BusConnect] Onibus: 1234/1235/1236 na 3050 | 1237 na 3060');
  console.log('');

  let passo = 0;
  const timer = setInterval(async () => {
    const promises = [];
    for (const b of onibus) {
      const idx = passo + b.offset;
      if (idx < b.trilha.length) {
        promises.push(enviar(b, b.trilha[idx]));
      }
    }
    if (promises.length === 0) {
      clearInterval(timer);
      console.log('[BusConnect] Fim da rota para todos os onibus.');
      return;
    }
    await Promise.all(promises);
    if (passo % 10 === 0) {
      console.log('[GPS] passo ' + passo + ' | ' + promises.length + ' onibus enviando');
    }
    passo++;
  }, INTERVALO_MS);
}

main();