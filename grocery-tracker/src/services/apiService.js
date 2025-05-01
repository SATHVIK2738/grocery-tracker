const API_URL = 'http://localhost:5001/api';

// User API calls
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (username, email, password) => {
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Item API calls
export const getItems = async (token) => {
  try {
    const response = await fetch(`${API_URL}/items`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get items');
    }

    return data;
  } catch (error) {
    console.error('Get items error:', error);
    throw error;
  }
};

export const addItem = async (token, item) => {
  try {
    const response = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add item');
    }

    return data;
  } catch (error) {
    console.error('Add item error:', error);
    throw error;
  }
};

export const updateItem = async (token, itemId, item) => {
  try {
    const response = await fetch(`${API_URL}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update item');
    }

    return data;
  } catch (error) {
    console.error('Update item error:', error);
    throw error;
  }
};

export const deleteItem = async (token, itemId) => {
  try {
    const response = await fetch(`${API_URL}/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete item');
    }

    return data;
  } catch (error) {
    console.error('Delete item error:', error);
    throw error;
  }
};

export const getExpiringItems = async (token) => {
  try {
    const response = await fetch(`${API_URL}/items/expiring`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get expiring items');
    }

    return data;
  } catch (error) {
    console.error('Get expiring items error:', error);
    throw error;
  }
}; 