import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // retire || 'http://localhost:8080'
  headers: { 'Content-Type': 'application/json' },
});

export default api;
