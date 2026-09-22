const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/painel-empresa/style.css';
let txt = fs.readFileSync(arq, 'utf8');

const extra = `

/* ===== Mapa ===== */
#mapa-empresa {
  height: 420px;
  margin-top: 8px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #1e293b;
}

.marcador-onibus-emp {
  background: #38bdf8;
  border: 3px solid #fff;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(56,189,248,0.7);
  animation: pulsarEmp 1.5s ease-in-out infinite;
}
@keyframes pulsarEmp {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.1); }
}

.marcador-ponto-emp {
  background: #64748b;
  border: 2px solid #fff;
  border-radius: 50%;
  width: 12px;
  height: 12px;
}
`;

if (!/mapa-empresa/.test(txt)) {
  fs.writeFileSync(arq, txt + extra, 'utf8');
  console.log('OK style.css atualizado.');
} else {
  console.log('-- ja tem estilos do mapa');
}