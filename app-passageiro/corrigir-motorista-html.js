const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/painel-motorista/index.html';
let txt = fs.readFileSync(arq, 'utf8');

// 1) Adiciona CSS do Leaflet no head
if (!/leaflet\.css/.test(txt)) {
  txt = txt.replace(
    /<link rel="stylesheet" href="style\.css" \/>/,
    '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />\n  <link rel="stylesheet" href="style.css" />'
  );
}

// 2) Adiciona JS do Leaflet antes do app.js
if (!/leaflet\.js/.test(txt)) {
  txt = txt.replace(
    /<script src="app\.js"><\/script>/,
    '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>\n  <script src="app.js"></script>'
  );
}

// 3) Adiciona o container do mapa entre o card-info e o histórico
if (!/id="mapa-motorista"/.test(txt)) {
  txt = txt.replace(
    /(<section class="historico">)/,
    '<section class="mapa-bloco">\n      <div class="label">MAPA DA ROTA</div>\n      <div id="mapa-motorista"></div>\n    </section>\n\n    $1'
  );
}

fs.writeFileSync(arq, txt, 'utf8');
console.log('OK index.html atualizado.');