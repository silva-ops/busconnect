const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/app-passageiro/app.js';
let txt = fs.readFileSync(arq, 'utf8');

if (txt.includes('historico: document.getElementById')) {
  console.log('-- ja tem tela historico mapeada');
  process.exit(0);
}

txt = txt.replace(
  /chegou: document\.getElementById\('tela-chegou'\),/,
  "chegou: document.getElementById('tela-chegou'),\n  historico: document.getElementById('tela-historico'),"
);

fs.writeFileSync(arq, txt, 'utf8');
console.log('OK tela historico mapeada.');