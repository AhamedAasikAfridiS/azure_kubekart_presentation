import axios from 'axios';

// The frontend and API share one App Service origin. Easy Auth maintains the
// Entra ID session, so the browser does not store or refresh access tokens.
const api = axios.create({
  baseURL: '',
  timeout: 15000,
  withCredentials: true,
});

export const authApi = api;
export const productApi = api;
export const orderApi = api;
export const cartApi = api;
export const profileApi = api;
