const path = require('path');
const dotenv = require('dotenv');
const resultado = dotenv.config({ path: path.join(__dirname, '.env') });
console.log('Erro:', resultado.error ? resultado.error.message : 'nenhum');
console.log('Chaves carregadas:', resultado.parsed ? Object.keys(resultado.parsed).length : 0);
if (resultado.parsed) {
  console.log('Nomes das chaves:', Object.keys(resultado.parsed).join(', '));
}
console.log('PUB tamanho:', (process.env.VAPID_PUBLIC_KEY || '').length);
console.log('PRIV tamanho:', (process.env.VAPID_PRIVATE_KEY || '').length);