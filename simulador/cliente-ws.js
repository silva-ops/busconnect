const { io } = require('socket.io-client');
const URL = process.env.WS_URL || 'http://localhost:3000';
const VIAGEM_ID = 500;
const socket = io(URL);

socket.on('connect', () => {
  console.log('[ws-cliente] Conectado. id=' + socket.id);
  socket.emit('inscrever:viagem', VIAGEM_ID);
});

socket.on('inscricao:ok', (d) => console.log('[ws-cliente] Inscrito:', d));

socket.on('onibus:localizacao', (d) => {
  console.log('[ws] GPS', d.latitude.toFixed(5), d.longitude.toFixed(5));
});

socket.on('passageiro:destino_proximo', (d) => {
  console.log('   >>> WS PASSAGEIRO (aproximando):', d.mensagem);
});

socket.on('motorista:aviso_desembarque', (d) => {
  console.log('   >>> WS MOTORISTA:', d.mensagem);
});

socket.on('passageiro:chegou', (d) => {
  console.log('   >>> WS PASSAGEIRO:', d.mensagem, '-', d.ponto_nome);
});

socket.on('disconnect', () => console.log('[ws-cliente] Desconectado.'));

process.on('SIGINT', () => { socket.close(); process.exit(0); });