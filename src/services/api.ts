const AZURE_FUNCTIONS_BASE_URL = 'https://securityboxwebfunctions.azurewebsites.net/api';

export const getTransactions = async (userId: string) => {
    const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/GetTransactions?code=7y1EprCqlSY184e44oJMSfnp6rQTPDZIZQB3kvlFczkkAzFuw1R38w==`);
    if (!response.ok) {
        throw new Error('Failed to fetch transactions');
    }
    return response.json();
}

export const UserLogin = async (email: string, password: string) => {
      const response = await fetch(`${AZURE_FUNCTIONS_BASE_URL}/auth/login?code=JY3vQ-BkO3gbJMMjmAbWY6O4DKdYSr7XD4wmOyaHds-wAzFuTqA3qg==`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            "Email": email,
            "Password": password
         }),
      });
      if (!response.ok) {
        throw new Error('Login failed');
      }
      return response.json();
    return true;
}