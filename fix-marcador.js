const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/painel-empresa/app.js';
let txt = fs.readFileSync(arq, 'utf8');

const funcaoAntiga = `function atualizarOnibusNoMapa(dados) {
  if (!mapaEmpresa) return;
  const viagemId = dados.viagem_id;
  if (marcadoresOnibus.has(viagemId)) {
    const m = marcadoresOnibus.get(viagemId);
    m.setLatLng([dados.latitude, dados.longitude]);
  }
}`;

const funcaoNova = `function atualizarOnibusNoMapa(dados) {
  if (!mapaEmpresa) return;
  const viagemId = dados.viagem_id;

  if (marcadoresOnibus.has(viagemId)) {
    const m = marcadoresOnibus.get(viagemId);
    m.setLatLng([dados.latitude, dados.longitude]);
  } else {
    // Cria o marcador na hora se ainda nao existia
    const icone = L.divIcon({
      className: '',
      html: '<div class="marcador-onibus-emp">&#128652;</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const marker = L.marker([dados.latitude, dados.longitude], {
      icon: icone,
      zIndexOffset: 1000,
    }).addTo(mapaEmpresa).bindPopup('Viagem #' + viagemId);
    marcadoresOnibus.set(viagemId, marker);
  }
}`;

if (txt.includes(funcaoAntiga)) {
  txt = txt.replace(funcaoAntiga, funcaoNova);
  fs.writeFileSync(arq, txt, 'utf8');
  console.log('OK funcao atualizada.');
} else {
  console.log('-- funcao nao encontrada, tentando padrao alternativo');
  // Padrao alternativo
  const busca = /function atualizarOnibusNoMapa\(dados\) \{[\s\S]*?\n\}/;
  if (busca.test(txt)) {
    txt = txt.replace(busca, funcaoNova);
    fs.writeFileSync(arq, txt, 'utf8');
    console.log('OK funcao atualizada (padrao 2).');
  } else {
    console.log('!! funcao nao encontrada');
  }
}