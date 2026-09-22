const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/app-passageiro/app.js';
let txt = fs.readFileSync(arq, 'utf8');

// Troca o tile do CartoDB (que exige API key) por Esri (gratuito, sem key)
txt = txt.replace(
  /https:\/\/\{s\}\.basemaps\.cartocdn\.com\/light_all\/\{z\}\/\{x\}\/\{y\}\{r\}\.png/g,
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
);

// Ajusta atribuicao
txt = txt.replace(
  /'&copy; OpenStreetMap \| &copy; CARTO'/g,
  "'Tiles &copy; Esri'"
);

fs.writeFileSync(arq, txt, 'utf8');
console.log('OK app.js atualizado.');