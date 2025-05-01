import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User API calls
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/users/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.user.id);
    }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const registerUser = async (username, email, password) => {
  try {
    const response = await api.post('/users/register', { username, email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.user.id);
    }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
};

// Grocery Items API calls
export const addGroceryItem = async (item) => {
  try {
    const response = await api.post('/items', item);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add item');
  }
};

export const getGroceryItems = async () => {
  try {
    const response = await api.get('/items');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch items');
  }
};

export const updateGroceryItem = async (itemId, itemData) => {
  try {
    const response = await api.put(`/items/${itemId}`, itemData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update item');
  }
};

export const deleteGroceryItem = async (itemId) => {
  try {
    await api.delete(`/items/${itemId}`);
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete item');
  }
};

export const getExpiringItems = async () => {
  try {
    const response = await api.get('/items/expiring');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch expiring items');
  }
};

// Profile API calls
export const updateProfile = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};

export const updatePassword = async (userId, currentPassword, newPassword) => {
  try {
    const response = await api.put(`/users/${userId}/password`, {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update password');
  }
}; 