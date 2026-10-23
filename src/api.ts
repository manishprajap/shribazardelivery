// src/api.ts

const BASE_URL = 'https://shriecom.in/appapis/shreefood/public/api/';

export const apiPost = async (endpoint: string, data: unknown) => {

  // ✅ Yahan apni sahi key lagao — jo login response mein save ki thi
  const token = localStorage.getItem('token')           // pehle yeh try karo
               || localStorage.getItem('auth_token')
               || localStorage.getItem('delivery_token')
               || localStorage.getItem('access_token');

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (!response.ok) {
    throw json;
  }

  return json;
};

export const apiGet = async (endpoint: string) => {
  const token = localStorage.getItem('token')
               || localStorage.getItem('auth_token')
               || localStorage.getItem('delivery_token')
               || localStorage.getItem('access_token');

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  const json = await response.json();

  if (!response.ok) {
    throw json;
  }

  return json;
};