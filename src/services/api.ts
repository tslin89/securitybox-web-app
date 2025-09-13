import SHA256 from "crypto-js/sha256";
var AZURE_FUNCTIONS_BASE_URL = 'https://securityboxwebfunctions.azurewebsites.net/api';

if (window.location.hostname === 'localhost') {
  AZURE_FUNCTIONS_BASE_URL = 'http://localhost:7107/api';
}

interface Transaction {
  id: number;
}

export const getTransactions = async (userId: string, page: number, size: number) => {
  const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/GetTransactions?code=7y1EprCqlSY184e44oJMSfnp6rQTPDZIZQB3kvlFczkkAzFuw1R38w==`);
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  const data = await response.json();

  // Sort by ID descending (highest ID first)
  if (data.data && Array.isArray(data.data)) {
    data.data.sort((a: Transaction, b: Transaction) => b.id - a.id);
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
