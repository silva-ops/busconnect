const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/backend/src/routes/empresaRoutes.js';
let txt = fs.readFileSync(arq, 'utf8');

if (!/onibus-ativos/.test(txt)) {
  txt = txt.replace(
    /router\.get\('\/onibus', controller\.onibus\);/,
    "router.get('/onibus', controller.onibus);\nrouter.get('/onibus-ativos', controller.onibusAtivos);"
  );
  fs.writeFileSync(arq, txt, 'utf8');
  console.log('OK empresaRoutes.js atualizado.');
} else {
  console.log('-- rota ja existe');
}