const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/app-passageiro/app.js';
let txt = fs.readFileSync(arq, 'utf8');

if (txt.includes("linhas: document.getElementById('tela-linhas')")) {
  console.log('-- ja mapeado');
  process.exit(0);
}

txt = txt.replace(
  /recomendado: document\.getElementById\('tela-recomendado'\),/,
  "recomendado: document.getElementById('tela-recomendado'),\n  linhas: document.getElementById('tela-linhas'),"
);

fs.writeFileSync(arq, txt, 'utf8');
console.log('OK tela-linhas mapeada.');