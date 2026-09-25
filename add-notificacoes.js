const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/app-passageiro/app.js';
let txt = fs.readFileSync(arq, 'utf8');

if (txt.includes('mostrarNotificacao')) {
  console.log('-- notificacoes ja existem');
  process.exit(0);
}

const codigo = `

// ===== NOTIFICACOES =====
function pedirPermissaoNotificacao() {
  if (!('Notification' in window)) {
    console.log('Navegador nao suporta notificacoes.');
    return;
  }
  if (Notification.permission === 'granted') {
    console.log('Notificacoes ja autorizadas.');
    return;
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      console.log('Permissao de notificacao: ' + perm);
    });
  }
}

function mostrarNotificacao(titulo, corpo, icone) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(titulo, {
      body: corpo,
      icon: icone || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 rx=%2722%27 fill=%27%230f172a%27/%3E%3Crect x=%2722%27 y=%2728%27 width=%2756%27 height=%2744%27 rx=%276%27 fill=%27none%27 stroke=%27%2338bdf8%27 stroke-width=%276%27/%3E%3Ccircle cx=%2738%27 cy=%2780%27 r=%276%27 fill=%27%2338bdf8%27/%3E%3Ccircle cx=%2762%27 cy=%2780%27 r=%276%27 fill=%27%2338bdf8%27/%3E%3C/svg%3E',
      tag: 'busconnect-aviso',
      renotify: true,
    });
    n.onclick = () => { window.focus(); n.close(); };
    setTimeout(() => n.close(), 10000);
  } catch (e) {
    console.error('Erro ao mostrar notificacao:', e);
  }
}
`;

// Adiciona o codigo antes da secao de inicializacao
const marcador = '// ===== Inicializacao =====';
if (txt.includes(marcador)) {
  txt = txt.replace(marcador, codigo + '\n' + marcador);
} else {
  // Se nao achar, adiciona no final
  txt = txt + codigo;
}

// Adiciona pedido de permissao ao embarcar
txt = txt.replace(
  /embarcou = true;\s*\n\s*conectarWebSocket\(\);/,
  'embarcou = true;\n    pedirPermissaoNotificacao();\n    conectarWebSocket();'
);

// Adiciona notificacao quando o onibus aproxima
txt = txt.replace(
  /socket\.on\('passageiro:destino_proximo', \(d\) => \{[\s\S]*?mostrarTela\('aproximando'\);\s*\n\s*\}\);/,
  'socket.on(\'passageiro:destino_proximo\', (d) => {\n' +
  '    if (!embarcou) return;\n' +
  '    if (d.passageiro_id !== PASSAGEIRO_ID) return;\n' +
  '    mostrarNotificacao("⚠️ ATENÇÃO", "Seu destino está próximo. Prepare-se para desembarcar.");\n' +
  '    mostrarTela(\'aproximando\');\n' +
  '  });'
);

// Adiciona notificacao quando chegar
txt = txt.replace(
  /socket\.on\('passageiro:chegou', \(d\) => \{[\s\S]*?embarcou = false;\s*\n\s*\}\);/,
  'socket.on(\'passageiro:chegou\', (d) => {\n' +
  '    if (!embarcou) return;\n' +
  '    if (d.passageiro_id !== PASSAGEIRO_ID) return;\n' +
  '    mostrarNotificacao("🎉 VOCÊ CHEGOU", (d.ponto_nome || "Destino alcançado") + " — Boa viagem!");\n' +
  '    document.getElementById(\'chegou-ponto\').textContent = d.ponto_nome || destinoSelecionado.nome;\n' +
  '    mostrarTela(\'chegou\');\n' +
  '    embarcou = false;\n' +
  '  });'
);

fs.writeFileSync(arq, txt, 'utf8');
console.log('OK notificacoes adicionadas.');