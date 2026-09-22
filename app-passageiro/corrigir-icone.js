const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/app-passageiro/index.html';
let txt = fs.readFileSync(arq, 'utf8');
txt = txt.replace(
  /<div class="icone-grande">[\s\S]*?<\/div>/,
  '<div class="icone-grande">&#9888;&#65039;</div>'
);
fs.writeFileSync(arq, txt, 'utf8');
console.log('OK icone corrigido.');