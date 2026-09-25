const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/app-passageiro/style.css';
let txt = fs.readFileSync(arq, 'utf8');

if (txt.includes('.lista-historico')) {
  console.log('-- CSS do historico ja existe');
  process.exit(0);
}

const css = `

/* ===== Historico ===== */
.lista-historico {
  list-style: none;
  margin-top: 8px;
  display: grid;
  gap: 10px;
  max-height: 50vh;
  overflow-y: auto;
  padding-right: 4px;
}
.item-historico {
  background: #1e293b;
  border: 1px solid #334155;
  border-left: 4px solid #38bdf8;
  border-radius: 10px;
  padding: 14px 16px;
  display: grid;
  gap: 4px;
  animation: fadeInItem 0.3s ease-out;
}
.item-historico .linha-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.item-historico .linha-cod {
  font-weight: 800;
  color: #38bdf8;
  font-size: 15px;
}
.item-historico .linha-data {
  color: #64748b;
  font-size: 11px;
}
.item-historico .destino {
  color: #f1f5f9;
  font-weight: 700;
  font-size: 14px;
}
.item-historico .detalhe {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 2px;
}
.historico-vazio {
  text-align: center;
  color: #64748b;
  padding: 40px 20px;
  font-size: 14px;
}
`;

fs.writeFileSync(arq, txt + css, 'utf8');
console.log('OK CSS do historico adicionado.');