import axios from 'axios';

//const api = axios.create({
  //baseURL: 'http://localhost:5000/api', // The base URL of your backend
  //headers: {
    //'Content-Type': 'application/json',
  //},
//});
// In src/services/api.js
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // Use the environment variable
  // ...
});
// Interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;