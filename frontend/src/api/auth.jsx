// This file acts as the bridge to your authController.js endpoints. Using Axios is preferred over fetch for professional projects because it handles JSON automatically and has better error interception.
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

export const loginUser = async (email, password) => {
  // This hits your authController.login method
  const response = await axios.post(`${API_URL}/login`, { email, password });
  return response.data; 
};

export const registerUser = async (email, password) => {
  // This hits your authController.register method
  const response = await axios.post(`${API_URL}/register`, { email, password });
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('authToken'); // Wipe the token
  // If you add a blacklist or refresh tokens later, call the API here
};