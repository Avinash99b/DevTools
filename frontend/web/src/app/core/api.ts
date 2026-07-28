import axios from 'axios';
const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
export const api = axios.create({ baseURL, withCredentials: true });
