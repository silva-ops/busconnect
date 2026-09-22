const { Server } = require('socket.io');

let io = null;

function inicializarWebSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    console.log('[ws] Cliente conectado: ' + socket.id);

    socket.on('inscrever:viagem', (viagemId) => {
      const sala = 'viagem:' + viagemId;
      socket.join(sala);
      console.log('[ws] ' + socket.id + ' entrou na sala ' + sala);
      socket.emit('inscricao:ok', { viagemId });
    });

    socket.on('sair:viagem', (viagemId) => {
      socket.leave('viagem:' + viagemId);
    });

    socket.on('inscrever:empresa', () => {
      socket.join('empresa:todas');
      console.log('[ws] ' + socket.id + ' entrou no canal empresa:todas');
      socket.emit('empresa:inscricao:ok');
    });

    socket.on('disconnect', () => {
      console.log('[ws] Cliente desconectado: ' + socket.id);
    });
  });

  return io;
}

function emitirParaViagem(viagemId, evento, dados) {
  if (!io) return;
  io.to('viagem:' + viagemId).emit(evento, dados);
  io.to('empresa:todas').emit(evento, dados);
}

module.exports = { inicializarWebSocket, emitirParaViagem };