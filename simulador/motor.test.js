const assert = require('assert');
const { MotorViagem21, ESTADOS } = require('./motorViagem21');
const rota = require('./rota-teste');

let total = 0, passou = 0;

function teste(nome, fn) {
  total++;
  try { fn(); passou++; console.log('  OK ' + nome); }
  catch (e) { console.log('  FALHOU ' + nome); console.log('     ' + e.message); }
}

function novoMotorComPassageiro(passageiroId, pontoDestinoId) {
  const m = new MotorViagem21();
  m.registrarViagem({ viagemId: 500, linhaId: 3050, onibusId: 1234, pontos: rota.pontos });
  m.registrarPassageiro({ viagemId: 500, passageiroId, pontoDestinoId });
  return m;
}

console.log('');
console.log('[Motor 2.1] Executando testes...');
console.log('');

teste('Onibus distante nao gera avisos', () => {
  const m = novoMotorComPassageiro(10, 4);
  const { eventos } = m.processarLocalizacao({
    viagemId: 500, latitude: -19.9500, longitude: -43.9400,
    velocidade: 30, timestamp: new Date().toISOString(),
  });
  const rel = eventos.filter((e) =>
    ['passageiro:destino_proximo','passageiro:chegou','motorista:aviso_desembarque'].includes(e.evento));
  assert.strictEqual(rel.length, 0);
});

teste('Aproximacao gera passageiro:destino_proximo', () => {
  const m = novoMotorComPassageiro(10, 4);
  const { eventos } = m.processarLocalizacao({
    viagemId: 500, latitude: -19.9515, longitude: -43.9415,
    velocidade: 30, timestamp: new Date().toISOString(),
  });
  assert.ok(eventos.find((e) => e.evento === 'passageiro:destino_proximo'));
});

teste('Chegada gera aviso ao motorista e passageiro:chegou, e finaliza', () => {
  const m = novoMotorComPassageiro(10, 4);
  const ponto = rota.pontos.find((p) => p.id === 4);
  const { eventos } = m.processarLocalizacao({
    viagemId: 500, latitude: ponto.latitude, longitude: ponto.longitude,
    velocidade: 0, timestamp: new Date().toISOString(),
  });
  assert.ok(eventos.find((e) => e.evento === 'motorista:aviso_desembarque'));
  assert.ok(eventos.find((e) => e.evento === 'passageiro:chegou'));
  assert.strictEqual(m.viagens.get(500).passageiros.get(10).status, ESTADOS.FINALIZADO);
});

teste('GPS duplicado no ponto nao reemite eventos', () => {
  const m = novoMotorComPassageiro(10, 4);
  const ponto = rota.pontos.find((p) => p.id === 4);
  const r1 = m.processarLocalizacao({ viagemId: 500, latitude: ponto.latitude, longitude: ponto.longitude, velocidade: 0, timestamp: new Date().toISOString() });
  const r2 = m.processarLocalizacao({ viagemId: 500, latitude: ponto.latitude, longitude: ponto.longitude, velocidade: 0, timestamp: new Date().toISOString() });
  assert.strictEqual(r1.eventos.filter((e) => e.evento === 'passageiro:chegou').length, 1);
  assert.strictEqual(r2.eventos.filter((e) => e.evento === 'passageiro:chegou').length, 0);
});

teste('3 passageiros no mesmo destino geram 1 aviso com contagem 3', () => {
  const m = new MotorViagem21();
  m.registrarViagem({ viagemId: 500, linhaId: 3050, onibusId: 1234, pontos: rota.pontos });
  m.registrarPassageiro({ viagemId: 500, passageiroId: 1, pontoDestinoId: 4 });
  m.registrarPassageiro({ viagemId: 500, passageiroId: 2, pontoDestinoId: 4 });
  m.registrarPassageiro({ viagemId: 500, passageiroId: 3, pontoDestinoId: 4 });
  const ponto = rota.pontos.find((p) => p.id === 4);
  const { eventos } = m.processarLocalizacao({ viagemId: 500, latitude: ponto.latitude, longitude: ponto.longitude, velocidade: 0, timestamp: new Date().toISOString() });
  const avisos = eventos.filter((e) => e.evento === 'motorista:aviso_desembarque');
  const chegaram = eventos.filter((e) => e.evento === 'passageiro:chegou');
  assert.strictEqual(avisos.length, 1);
  assert.strictEqual(avisos[0].passageiros, 3);
  assert.strictEqual(chegaram.length, 3);
});

teste('2 passageiros em pontos distintos recebem avisos corretos', () => {
  const m = new MotorViagem21();
  m.registrarViagem({ viagemId: 500, linhaId: 3050, onibusId: 1234, pontos: rota.pontos });
  m.registrarPassageiro({ viagemId: 500, passageiroId: 1, pontoDestinoId: 3 });
  m.registrarPassageiro({ viagemId: 500, passageiroId: 2, pontoDestinoId: 4 });
  const ponto3 = rota.pontos.find((p) => p.id === 3);
  const { eventos } = m.processarLocalizacao({ viagemId: 500, latitude: ponto3.latitude, longitude: ponto3.longitude, velocidade: 0, timestamp: new Date().toISOString() });
  const chegaram = eventos.filter((e) => e.evento === 'passageiro:chegou');
  assert.strictEqual(chegaram.length, 1);
  assert.strictEqual(chegaram[0].passageiro_id, 1);
});


teste('Chegada ao ultimo ponto finaliza a viagem', () => {
  const m = novoMotorComPassageiro(10, 4);
  const ultimoPonto = rota.pontos[rota.pontos.length - 1];
  const { eventos } = m.processarLocalizacao({
    viagemId: 500, latitude: ultimoPonto.latitude, longitude: ultimoPonto.longitude,
    velocidade: 0, timestamp: new Date().toISOString(),
  });
  const finalizada = eventos.find((e) => e.evento === 'viagem:finalizada');
  assert.ok(finalizada, 'Evento viagem:finalizada nao emitido');
  assert.strictEqual(finalizada.ponto_final_nome, 'Mercado');
});

teste('Nao emite viagem:finalizada duas vezes', () => {
  const m = novoMotorComPassageiro(10, 4);
  const ultimoPonto = rota.pontos[rota.pontos.length - 1];
  m.processarLocalizacao({
    viagemId: 500, latitude: ultimoPonto.latitude, longitude: ultimoPonto.longitude,
    velocidade: 0, timestamp: new Date().toISOString(),
  });
  const r2 = m.processarLocalizacao({
    viagemId: 500, latitude: ultimoPonto.latitude, longitude: ultimoPonto.longitude,
    velocidade: 0, timestamp: new Date().toISOString(),
  });
  const finalizada = r2.eventos.filter((e) => e.evento === 'viagem:finalizada');
  assert.strictEqual(finalizada.length, 0);
});
console.log('');
console.log('[Motor 2.1] ' + passou + '/' + total + ' testes passaram.');
console.log('');
if (passou !== total) process.exit(1);
