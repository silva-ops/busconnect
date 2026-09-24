const axios = require('axios');
const rota = require('./rota-teste');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const INTERVALO_MS = 1000;

const onibus = [
  { viagemId: 500, onibusId: 1234, trilhaOffset: 0 },
  { viagemId: 501, onibusId: 1235, trilhaOffset: 20 },
  { viagemId: 502, onibusId: 1236, trilhaOffset: 40 },
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

async function enviarLocalizacao(info, pos) {
  const payload = {
    onibus_id: info.onibusId,
    viagem_id: info.viagemId,
    latitude: pos.latitude,
    longitude: pos.longitude,
    velocidade: 30,
    timestamp: new Date().toISOString(),
  };
  try {
    await axios.post(API_URL + '/api/onibus/localizacao', payload);
  } catch (err) {
    const msg = err.response ? JSON.stringify(err.response.data) : err.message;
    console.error('[ERRO viagem ' + info.viagemId + ']', msg);
  }
}

async function main() {
  console.log('[BusConnect] Simulador MULTI iniciado');
  console.log('[BusConnect] Enviando para ' + API_URL);
  const trilha = construirTrilha(rota.pontos, 20);
  console.log('[BusConnect] Trilha com ' + trilha.length + ' posicoes');
  console.log('[BusConnect] Onibus: 1234 (viagem 500), 1235 (viagem 501), 1236 (viagem 502)');
  console.log('');

  let passo = 0;
  const timer = setInterval(async () => {
    const promises = [];
    for (const b of onibus) {
      const idx = passo + b.trilhaOffset;
      if (idx < trilha.length) {
        promises.push(enviarLocalizacao(b, trilha[idx]));
      }
    }
    if (promises.length === 0) {
      clearInterval(timer);
      console.log('[BusConnect] Fim da rota para todos os onibus.');
      return;
    }
    await Promise.all(promises);
    if (passo % 10 === 0) {
      console.log('[GPS multi] passo ' + passo + ' | ' + promises.length + ' onibus enviando');
    }
    passo++;
  }, INTERVALO_MS);
}

main();