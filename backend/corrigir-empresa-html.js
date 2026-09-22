const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/painel-empresa/index.html';
let txt = fs.readFileSync(arq, 'utf8');

// 1) CSS do Leaflet
if (!/leaflet\.css/.test(txt)) {
  txt = txt.replace(
    /<link rel="stylesheet" href="style\.css" \/>/,
    '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />\n  <link rel="stylesheet" href="style.css" />'
  );
}

// 2) JS do Leaflet
if (!/leaflet\.js/.test(txt)) {
  txt = txt.replace(
    /<script src="app\.js"><\/script>/,
    '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>\n  <script src="app.js"></script>'
  );
}

// 3) Container do mapa (antes de "Viagens em andamento")
if (!/id="mapa-empresa"/.test(txt)) {
  txt = txt.replace(
    /(<section class="bloco">\s*<h2>Viagens em andamento)/,
    '<section class="bloco">\n      <h2>Mapa da frota <span class="badge-vivo">AO VIVO</span></h2>\n      <div id="mapa-empresa"></div>\n    </section>\n\n    $1'
  );
}

fs.writeFileSync(arq, txt, 'utf8');
console.log('OK index.html atualizado.');