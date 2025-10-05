import axios from 'axios';

// DEBUG: Vérifiez que la variable est bien lue
console.log('API URL:', process.env.REACT_APP_API_URL);

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default api;