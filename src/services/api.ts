import SHA256 from "crypto-js/sha256";
var AZURE_FUNCTIONS_BASE_URL = 'https://securityboxwebfunctions.azurewebsites.net/api';

if (window.location.hostname === 'localhost') {
  AZURE_FUNCTIONS_BASE_URL = 'http://localhost:7107/api';
  // AZURE_FUNCTIONS_BASE_URL = 'http://localhost:7071/api';
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

export const initiateSignalR = async (userId: number) => {
  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/negotiateSignalR?userId=${userId}&code=7y1EprCqlSY184e44oJMSfnp6rQTPDZIZQB3kvlFczkkAzFuw1R38w==`);
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
    throw new Error(response.statusText);
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

export type DashboardOverview = {
  summary: { totalBoxes: number; activeBoxes: number; openDoorsNow: number };
  perDayCounts: Array<{ date: string; eventCode: string; count: number }>;
  weightSeries: Array<{ date: string; avgWeight: number }>;
  recentEvents: Array<{
    id: number; timestamp: string; boxID: number; eventCode: string;
    doorState: number; fingerprintNum: number | null; totalWeight: number | null; boxPosition: number | null;
  }>;
  countsSinceStart: Array<{ eventCode: string; total: number }>;
  topBoxesIncidents: Array<{ boxID: number; eventCode: string; total: number }>;
};

export async function getDashboardOverview(
  params: { days?: number; recent?: number; activeMinutes?: number } = {}
): Promise<DashboardOverview> {
  const q = new URLSearchParams();
  if (params.days) q.set('days', String(params.days));
  if (params.recent) q.set('recent', String(params.recent));
  if (params.activeMinutes) q.set('activeMinutes', String(params.activeMinutes));

  const res = await fetch(`${AZURE_FUNCTIONS_BASE_URL || ''}/dashboard/overview?${q.toString()}&code=Wz8uG-2_xw3OgikaScK9orz0lHphlxwFB8TdEq2adx-iAzFu3rkfsA==`);
  if (!res.ok) throw new Error(`DashboardOverview failed: ${res.status}`);
  return res.json();
}

// users
// Add these types and methods to your api.ts file

export interface UserBox {
  userID: number;
  boxID: number;
  userRole: number; // 0=user, 1=owner
  fingerprintNum?: number | null;
}

export interface User {
  userID: number;
  userName: string;
  email: string;
  phoneNo?: string;
  userType: number;
  fingerprintNum?: number;
  fingerprintEnabled?: boolean;
  isEnabled?: boolean;
  userBoxes?: UserBox[];
}

export interface CreateUserRequest {
  userName: string;
  email: string;
  phoneNo?: string;
  password: string;
  userType: number;
  boxID?: number;
  boxIDs?: number[]; // Array of selected box IDs
  fingerprintEnabled?: boolean;
  isEnabled?: boolean;
}

export interface UpdateUserRequest {
  userID: number;
  userName: string;
  email: string;
  phoneNo?: string;
  password?: string;
  userType: number;
  boxID: number;
  boxIDs?: number[]; // Array of selected box IDs
  fingerprintEnabled?: boolean;
  isEnabled?: boolean;
}

// User Management API Methods
export const getUsers = async (): Promise<User[]> => {
  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/users?code=7y1EprCqlSY184e44oJMSfnp6rQTPDZIZQB3kvlFczkkAzFuw1R38w==`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  return response.json();
};

export const getUser = async (userId: number): Promise<User> => {
  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/users/${userId}?code=7y1EprCqlSY184e44oJMSfnp6rQTPDZIZQB3kvlFczkkAzFuw1R38w==`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    throw new Error('Failed to fetch user');
  }

  return response.json();
};

export const deleteUser = async (userId: number, fingerprintNum: number): Promise<{ message: string }> => {
  
  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/users/${userId}?code=7y1EprCqlSY184e44oJMSfnp6rQTPDZIZQB3kvlFczkkAzFuw1R38w==`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to update user');
  }

  return response.json();
};

export const createUser = async (userData: CreateUserRequest): Promise<{ userID: number; message: string }> => {
  // Hash the password before sending
  const hashedUserData = {
    ...userData,
    password: SHA256(userData.password).toString()
  };

  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/users?code=7y1EprCqlSY184e44oJMSfnp6rQTPDZIZQB3kvlFczkkAzFuw1R38w==`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(hashedUserData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to create user');
  }

  return response.json();
};

export const updateUser = async (userId: number, userData: UpdateUserRequest): Promise<{ message: string }> => {
  // Hash the password if provided
  const hashedUserData = userData.password 
    ? { ...userData, password: SHA256(userData.password).toString() }
    : userData;

  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/users/${userId}?code=7y1EprCqlSY184e44oJMSfnp6rQTPDZIZQB3kvlFczkkAzFuw1R38w==`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(hashedUserData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to update user');
  }

  return response.json();
};

export const checkFingerprintStatus = async (userId: number, boxId: number): Promise<{ fingerprintNum?: number }> => {
  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/users/${userId}/fingerprint-status?boxId=${boxId}&code=7y1EprCqlSY184e44oJMSfnp6rQTPDZIZQB3kvlFczkkAzFuw1R38w==`);
  
  if (!response.ok) {
    throw new Error('Failed to check fingerprint status');
  }

  return response.json();
};

// Event Settings API Methods

export interface EventSetting {
  eventCode: string;
  eventDescription: string;
  eventType: number;
  notificationEnabled: boolean;
}

export interface EventSettingsResponse {
  transactionID: string;
  status: number;
  message: string;
  data: EventSetting[];
}

// Box Status API Types
export interface BoxData {
  deviceID: string;
  boxDescription: string; // Changed from description to boxDescription
  timeStamp: string | null;
  userFingerprintNum: number; // New field for user's fingerprint number
  userID: number; // Changed from nullable to required
  id: number;
  boxID: number;
  eventCode: string | null;
  doorState: number | null; // 1=open, 0=close
  fingerprintNum: number | null;
  totalWeight: number | null; // in grams
  boxPosition: number | null;
  transactionID: string | null;
  receivedTime: string | null;
  securityStatus: number | null; // 1=enabled, 0=disabled
  userRole: number | null; // 0=user, 1=owner
}

export interface BoxStatusResponse {
  transactionID: string;
  status: number;
  message: string;
  data: BoxData[];
}

export interface UpdateEventSettingsRequest {
  disabledCodes: string[];
}

export interface UpdateEventSettingsResponse {
  transactionID: string;
  status: number;
  message: string;
  data: string;
}

export const getUserEventSettings = async (userId: number): Promise<EventSettingsResponse> => {
  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/users/${userId}/eventsettings?code=7y1EprCqlSY184e44oJMSfnp6rQTPDZIZQB3kvlFczkkAzFuw1R38w==`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch user event settings');
  }

  return response.json();
};

export const updateUserEventSettings = async (userId: number, disabledCodes: string[]): Promise<UpdateEventSettingsResponse> => {
  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/users/${userId}/eventsettings?code=7y1EprCqlSY184e44oJMSfnp6rQTPDZIZQB3kvlFczkkAzFuw1R38w==`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ disabledCodes }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to update user event settings');
  }

  return response.json();
};

export const getLastEventData = async (userId: number, boxID: number = 0): Promise<BoxStatusResponse> => {
  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/transactions/lastevent?userId=${userId}&boxID=${boxID}&code=Wz8uG-2_xw3OgikaScK9orz0lHphlxwFB8TdEq2adx-iAzFu3rkfsA==`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch last event data');
  }

  return response.json();
};

export const getUserBoxData = async (userId: number, boxID: number = 0): Promise<BoxStatusResponse> => {
  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/users/${userId}/boxdata?boxID=${boxID}&code=Wz8uG-2_xw3OgikaScK9orz0lHphlxwFB8TdEq2adx-iAzFu3rkfsA==`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch user box data');
  }

  return response.json();
};

const invokeDeviceSignal = async (deviceId: string, userId: number, eventCode: string, boxId: number, fingerprintNum: number = 0) => {
  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/device/sendsignal?code=Wz8uG-2_xw3OgikaScK9orz0lHphlxwFB8TdEq2adx-iAzFu3rkfsA==`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      deviceId, 
      userId, 
      eventCode,
      boxId,
      fingerprintNum
    })
  });
  return response;
}

export async function startFingerprintOnDevice(deviceId: string, userId: number, boxId: number) {

  const res = await invokeDeviceSignal(deviceId, userId, "D001", boxId, 0);

  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export async function disableSecurity(deviceId: string, userId: number, boxId: number) {

  const res = await invokeDeviceSignal(deviceId, userId, "D003", boxId, 0);

  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export async function enableSecurity(deviceId: string, userId: number, boxId: number) {

  const res = await invokeDeviceSignal(deviceId, userId, "D004", boxId, 0);

  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}


export async function deleteFingerprint(deviceId: string, userId: number, fingerprintNum: number, boxId: number) {
  const res = await invokeDeviceSignal(deviceId, userId, "D002", boxId, fingerprintNum);

  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}