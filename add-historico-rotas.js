const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/backend/src/routes/passageirosRoutes.js';
let txt = fs.readFileSync(arq, 'utf8');

if (txt.includes('/:id/historico')) {
  console.log('-- rotas ja existem');
  process.exit(0);
}

// Adiciona as rotas protegidas por JWT
txt = txt.replace(
  /module\.exports = router;/,
  \`router.get('/:id/historico', autenticar, controller.historico);
router.get('/:id/estatisticas', autenticar, controller.estatisticas);

module.exports = router;\`
);

// Adiciona o require do middleware de auth se nao existir
if (!txt.includes("middleware/auth")) {
  txt = txt.replace(
    /const controller = require\('\.\.\/controllers\/passageirosController'\);/,
    "const controller = require('../controllers/passageirosController');\\nconst { autenticar } = require('../middleware/auth');"
  );
}

fs.writeFileSync(arq, txt, 'utf8');
console.log('OK rotas de historico adicionadas.');