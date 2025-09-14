import SHA256 from "crypto-js/sha256";
var AZURE_FUNCTIONS_BASE_URL = 'https://securityboxwebfunctions.azurewebsites.net/api';

if (window.location.hostname === 'localhost') {
  AZURE_FUNCTIONS_BASE_URL = 'http://localhost:7107/api';
}

// interface Transaction {
//   id: number;
// }

export const getTransactions = async (
  userId: string,
  page: number = 0,
  pageSize: number = 25) => {

  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    userId: userId,
    code: "7y1EprCqlSY184e44oJMSfnp6rQTPDZIZQB3kvlFczkkAzFuw1R38w=="
  });

  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/GetTransactions?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  const data = await response.json();

  if (data.data && Array.isArray(data.data)) {

    return data.data;
  }

  return data;
}

export const initiateSignalR = async () => {
  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/negotiateSignalR?code=7y1EprCqlSY184e44oJMSfnp6rQTPDZIZQB3kvlFczkkAzFuw1R38w==`);
  if (!response.ok) {
    throw new Error('Failed to initiate SignalR');
  }

  const data = await response.json();

  return data;
}

export const UserLogin = async (email: string, password: string) => {
  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/auth/login?code=JY3vQ-BkO3gbJMMjmAbWY6O4DKdYSr7XD4wmOyaHds-wAzFuTqA3qg==`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "Email": email,
      "Password": SHA256(password).toString()  // Hash the password before sending
    }),
  });
  if (!response.ok) {
    throw new Error('Login failed');
  }
  return response.json();
}

// push-notification

const PUBLIC_VAPID = 'BCUVoQ_umbRV53LwdbPqq7jPHPLMpLi_drkf-PwZZb34LIVZ6DOMQW2ZbRddAAh-BSgMF_Hk8gOPfIREcUYV9ac';//import.meta.env.VITE_VAPID_PUBLIC_KEY; // put your public key in .env

function urlBase64ToUint8Array(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i=0;i<raw.length;i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function enablePush(userId: number, jwt: string) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Web Push not supported");
  }

  // 1) Must be https or localhost
  if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
    throw new Error("Notifications require HTTPS (except localhost).");
  }

  // 2) If already denied, bail early
  if (Notification.permission === "denied") {
    throw new Error("Notifications are blocked for this site. Enable them in browser settings.");
  }

  // 3) Ask from a user gesture (this function should be called by a click)
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error(`Permission was ${perm}`);

  const reg = await navigator.serviceWorker.register("/service-worker.js");
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID),
  });

  // 4) Send to your Function to save
  await fetch(`${AZURE_FUNCTIONS_BASE_URL}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ userId, subscription: sub }),
  });
}

export async function ensurePushSubscribed(userId: number, jwt: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (Notification.permission !== 'granted') return; // or prompt if you want

  // const reg = await navigator.serviceWorker.ready;

  // // Always upsert the CURRENT subscription to the server
  // let sub = await reg.pushManager.getSubscription();
  // if (!sub) {
  //   const key = urlBase64ToUint8Array(PUBLIC_VAPID);
  //   sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  // }

  // *** force resubscribe
  const reg = await navigator.serviceWorker.ready;
  const old = await reg.pushManager.getSubscription();
  if (old) {
    console.log('old service worker unsubscribed')
    await old.unsubscribe();                // force new keys
  }

  
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID)
  });
  console.log('service-worker subscrived', sub)
  // *** end of force resubscribe

  await fetch(`${AZURE_FUNCTIONS_BASE_URL}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ userId, subscription: sub })  // server upserts by endpoint
  });
}

// export async function enablePush(userId: string, jwt: string) {
//   if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
//     throw new Error("Web Push not supported on this browser");
//   }
//   const reg = await navigator.serviceWorker.register("/service-worker.js");
//   const perm = await Notification.requestPermission();
//   if (perm !== "granted") throw new Error("Notification permission denied");

//   const sub = await reg.pushManager.subscribe({
//     userVisibleOnly: true,
//     applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID),
//   });

//   await fetch(`${AZURE_FUNCTIONS_BASE_URL}/push/subscribe`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
//     body: JSON.stringify({ userId, subscription: sub }),
//   });
// }
