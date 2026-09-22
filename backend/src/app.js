require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const pool = require('./database/pool');
const { inicializarWebSocket } = require('./websocket/server');
const { autenticar, exigirPerfil } = require('./middleware/auth');

const onibusRoutes = require('./routes/onibusRoutes');
const viagensRoutes = require('./routes/viagensRoutes');
const pontosRoutes = require('./routes/pontosRoutes');
const passageirosRoutes = require('./routes/passageirosRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Rota raiz (publica)
app.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT NOW() AS agora');
    res.json({ sistema: 'BusConnect', versao: '0.6.0', status: 'online', banco: 'conectado', agora: r.rows[0].agora });
  } catch (e) {
    res.status(500).json({ status: 'erro', mensagem: e.message });
  }
});

// Status (publico)
app.get('/api/onibus/status', (req, res) => res.json({ status: 'ok', fase: 8 }));

// Auth (publico)
app.use('/api/auth', authRoutes);

// Onibus GPS (publico - o simulador nao tem login)
app.use('/api/onibus', onibusRoutes);

// Pontos (publico - o app do passageiro precisa listar destinos antes do login)
app.use('/api/pontos', pontosRoutes);

// Passageiros (publico por enquanto - o app do passageiro nao exige login nesta fase)
app.use('/api/passageiros', passageirosRoutes);

// Viagens (publico - o app do passageiro e o painel do motorista consultam)
app.use('/api/viagens', viagensRoutes);

// Empresa (PROTEGIDO - somente perfis EMPRESA e ADMINISTRADOR)
app.use('/api/empresa', autenticar, exigirPerfil('EMPRESA', 'ADMINISTRADOR'), empresaRoutes);

const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);
inicializarWebSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log('[BusConnect] Backend rodando em http://localhost:' + PORT);
  console.log('[BusConnect] WebSocket pronto em ws://localhost:' + PORT);
  console.log('[BusConnect] POST /api/auth/registro e /api/auth/login prontos');
  console.log('[BusConnect] GET  /api/auth/me (protegido)');
  console.log('[BusConnect] POST /api/onibus/localizacao pronto');
  console.log('[BusConnect] GET  /api/viagens/:id e /:id/pontos prontos');
  console.log('[BusConnect] GET  /api/pontos pronto');
  console.log('[BusConnect] POST /api/passageiros/embarcar pronto');
  console.log('[BusConnect] GET  /api/empresa/* PROTEGIDO por JWT');
});

module.exports = app;