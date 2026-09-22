const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/app-passageiro/index.html';
let txt = fs.readFileSync(arq, 'utf8');
const Ecirc = String.fromCharCode(0x00CA);
txt = txt.replace(
  /<div class="titulo-chegou">[\s\S]*?<\/div>/,
  '<div class="titulo-chegou">VOC' + Ecirc + ' CHEGOU</div>'
);
fs.writeFileSync(arq, txt, 'utf8');
console.log('OK VOCE CHEGOU corrigido.');