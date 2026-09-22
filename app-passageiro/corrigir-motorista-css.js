const fs = require('fs');
const arq = 'C:/Users/SSA/Desktop/busconnect/painel-motorista/style.css';
let txt = fs.readFileSync(arq, 'utf8');

const extra = `

/* ===== Mapa ===== */
.mapa-bloco {
  background: #1e293b;
  border-radius: 12px;
  padding: 14px;
  border: 1px solid #334155;
}

#mapa-motorista {
  height: 340px;
  margin-top: 8px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #334155;
}

.marcador-onibus {
  background: #38bdf8;
  border: 3px solid #fff;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(56,189,248,0.7);
  animation: pulsar 1.5s ease-in-out infinite;
}
@keyframes pulsar {
  0%, 100% { transform: scale(1); box-shadow: 0 2px 8px rgba(56,189,248,0.7); }
  50%      { transform: scale(1.1); box-shadow: 0 2px 20px rgba(56,189,248,1); }
}

.marcador-ponto {
  background: #94a3b8;
  border: 2px solid #fff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
}

.marcador-destino {
  background: #22c55e;
  border: 3px solid #fff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  box-shadow: 0 2px 12px rgba(34,197,94,0.8);
  animation: pulsarVerde 1.2s ease-in-out infinite;
}
@keyframes pulsarVerde {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.15); }
}
`;

if (!/mapa-motorista/.test(txt)) {
  fs.writeFileSync(arq, txt + extra, 'utf8');
  console.log('OK style.css atualizado.');
} else {
  console.log('-- style.css ja tem estilos do mapa');
}