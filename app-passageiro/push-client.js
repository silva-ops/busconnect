// BusConnect - Push Notification Client
// Registra subscription e envia para o backend

const PUSH_API_URL = (function() {
  if (window.location.protocol === 'file:') return 'http://localhost:3000';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return 'http://localhost:3000';
  if (window.BUSCONNECT_BACKEND_URL) return window.BUSCONNECT_BACKEND_URL;
  return 'http://localhost:3000';
})();

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registrarPush(passageiroId, viagemId) {
  console.log('[push-client] iniciando registro...');

  if (!('serviceWorker' in navigator)) {
    console.log('[push-client] SW nao suportado');
    return null;
  }
  if (!('PushManager' in window)) {
    console.log('[push-client] PushManager nao suportado');
    return null;
  }
  if (Notification.permission !== 'granted') {
    console.log('[push-client] permissao de notificacao nao concedida');
    return null;
  }

  try {
    // 1) Pega a public key do backend
    const r = await fetch(PUSH_API_URL + '/api/push/public-key');
    const { publicKey } = await r.json();
    if (!publicKey) {
      console.error('[push-client] public key nao retornada');
      return null;
    }

    // 2) Pega a registration do SW
    const reg = await navigator.serviceWorker.ready;
    console.log('[push-client] SW pronto');

    // 3) Cria/pega subscription
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      console.log('[push-client] subscription criada');
    } else {
      console.log('[push-client] subscription existente');
    }

    // 4) Envia para o backend
    const resp = await fetch(PUSH_API_URL + '/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passageiro_id: passageiroId,
        viagem_id: viagemId,
        perfil: 'PASSAGEIRO',
        subscription: sub.toJSON(),
      }),
    });
    const data = await resp.json();
    console.log('[push-client] backend respondeu:', data);
    return sub;
  } catch (e) {
    console.error('[push-client] erro:', e);
    return null;
  }
}

window.registrarPush = registrarPush;
console.log('[push-client] carregado');