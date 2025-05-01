let db = null;
let isInitialized = false;
let initializationPromise = null;

// Function to backup database to localStorage
const backupDatabase = async () => {
  if (!db) return;

  try {
    console.log('Backing up database to localStorage...');
    const users = await getUsers();
    const items = await getAllGroceryItems();
    
    localStorage.setItem('db_backup_users', JSON.stringify(users));
    localStorage.setItem('db_backup_items', JSON.stringify(items));
    console.log('Database backup completed');
  } catch (error) {
    console.error('Error backing up database:', error);
  }
};

// Function to restore database from localStorage
const restoreDatabase = async () => {
  try {
    console.log('=== Checking Database Backup ===');
    const usersBackup = localStorage.getItem('db_backup_users');
    const itemsBackup = localStorage.getItem('db_backup_items');

    console.log('Users backup exists:', !!usersBackup);
    console.log('Items backup exists:', !!itemsBackup);

    if (usersBackup && itemsBackup) {
      console.log('Found database backup, restoring...');
      const users = JSON.parse(usersBackup);
      const items = JSON.parse(itemsBackup);

      console.log('Restoring users:', users);
      console.log('Restoring items:', items);

      // Restore users
      const userTransaction = db.transaction(['users'], 'readwrite');
      const userStore = userTransaction.objectStore('users');
      for (const user of users) {
        await userStore.put(user);
      }

      // Restore items
      const itemTransaction = db.transaction(['grocery_items'], 'readwrite');
      const itemStore = itemTransaction.objectStore('grocery_items');
      for (const item of items) {
        await itemStore.put(item);
      }

      console.log('Database restore completed');
    } else {
      console.log('No database backup found in localStorage');
    }
  } catch (error) {
    console.error('Error restoring database:', error);
  }
};

export const initDatabase = () => {
  // If already initialized, return immediately
  if (isInitialized && db) {
    console.log('Database already initialized');
    return Promise.resolve(true);
  }

  // If initialization is in progress, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start new initialization
  initializationPromise = new Promise((resolve, reject) => {
    console.log('=== Database Initialization Start ===');
    console.log('Opening IndexedDB database...');
    const request = indexedDB.open('grocery_tracker', 1);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      isInitialized = false;
      db = null;
      initializationPromise = null;
      reject(event.target.error);
    };

    request.onsuccess = async (event) => {
      console.log('Database opened successfully');
      db = event.target.result;
      isInitialized = true;

      // Handle connection errors
      db.onerror = (event) => {
        console.error('Database error:', event.target.error);
      };

      // Try to restore from backup
      await restoreDatabase();
      console.log('=== Database Initialization Complete ===');
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      console.log('Database upgrade needed');
      const database = event.target.result;

      // Create users store
      if (!database.objectStoreNames.contains('users')) {
        console.log('Creating users store');
        const userStore = database.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        userStore.createIndex('email', 'email', { unique: true });
      }

      // Create grocery items store
      if (!database.objectStoreNames.contains('grocery_items')) {
        console.log('Creating grocery items store');
        const itemStore = database.createObjectStore('grocery_items', { keyPath: 'id', autoIncrement: true });
        itemStore.createIndex('user_id', 'user_id', { unique: false });
        itemStore.createIndex('expiry_date', 'expiry_date', { unique: false });
      }
    };
  });

  return initializationPromise;
};

// Function to check if database exists
export const checkDatabase = () => {
  return new Promise((resolve) => {
    const request = indexedDB.open('grocery_tracker', 1);
    
    request.onerror = () => {
      console.log('Database does not exist');
      resolve(false);
    };
    
    request.onsuccess = () => {
      console.log('Database exists');
      request.result.close();
      resolve(true);
    };
  });
};

// Function to delete database
export const deleteDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('grocery_tracker');
    
    request.onerror = () => {
      console.error('Error deleting database');
      reject(new Error('Failed to delete database'));
    };
    
    request.onsuccess = () => {
      console.log('Database deleted successfully');
      db = null;
      isInitialized = false;
      resolve(true);
    };
  });
};

export const createUser = (username, email, password) => {
  return new Promise((resolve, reject) => {
    if (!isInitialized) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const emailIndex = store.index('email');

    // Check if user exists
    const emailCheck = emailIndex.get(email);

    emailCheck.onsuccess = () => {
      if (emailCheck.result) {
        resolve({ success: false, error: 'User already exists' });
        return;
      }

      // Create new user
      const request = store.add({
        username,
        email,
        password,
        created_at: new Date().toISOString()
      });

      request.onsuccess = () => {
        const getUserRequest = store.get(request.result);
        getUserRequest.onsuccess = () => {
          const user = getUserRequest.result;
          resolve({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              email: user.email
            }
          });
        };
      };

      request.onerror = () => {
        reject(new Error('Failed to create user'));
      };
    };

    emailCheck.onerror = () => {
      reject(new Error('Failed to check existing user'));
    };
  });
};

export const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    if (!isInitialized) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const index = store.index('email');
    const request = index.get(email);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Failed to get user'));
    };
  });
};

export const addGroceryItem = async (userId, item) => {
  const result = await addGroceryItemToDb(userId, item);
  await backupDatabase();
  return result;
};

export const getGroceryItems = (userId) => {
  return new Promise((resolve, reject) => {
    if (!isInitialized) {
      console.error('Database not initialized when getting items');
      reject(new Error('Database not initialized'));
      return;
    }

    console.log('=== Getting Grocery Items ===');
    console.log('User ID:', userId);

    const transaction = db.transaction(['grocery_items'], 'readonly');
    const store = transaction.objectStore('grocery_items');
    const index = store.index('user_id');
    const request = index.getAll(userId);

    request.onsuccess = () => {
      const items = request.result.sort((a, b) => 
        new Date(a.expiry_date) - new Date(b.expiry_date)
      );
      console.log('Retrieved items:', items);
      resolve(items);
    };

    request.onerror = () => {
      console.error('Error getting items:', request.error);
      reject(request.error);
    };
  });
};

export const updateGroceryItem = async (itemId, itemData) => {
  const result = await updateGroceryItemInDb(itemId, itemData);
  await backupDatabase();
  return result;
};

export const deleteGroceryItem = async (itemId) => {
  const result = await deleteGroceryItemFromDb(itemId);
  await backupDatabase();
  return result;
};

export const getExpiringItems = (userId) => {
  return new Promise((resolve, reject) => {
    if (!isInitialized) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(['grocery_items'], 'readonly');
    const store = transaction.objectStore('grocery_items');
    const index = store.index('user_id');
    const request = index.getAll(userId);

    request.onsuccess = () => {
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);

      const expiringItems = request.result.filter(item => {
        const expiryDate = new Date(item.expiry_date);
        return expiryDate >= today && expiryDate <= sevenDaysFromNow;
      });

      resolve(expiringItems);
    };

    request.onerror = () => reject(new Error('Failed to get expiring items'));
  });
};

export const getUsers = () => {
  return new Promise((resolve, reject) => {
    if (!isInitialized) {
      reject(new Error('Database not initialized'));
      return;
    }

    console.log('=== Getting All Users ===');
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.getAll();

    request.onsuccess = () => {
      console.log('Retrieved users:', request.result);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('Error getting users:', request.error);
      reject(new Error('Failed to get users'));
    };
  });
};

// Function to get all grocery items (for backup)
export const getAllGroceryItems = () => {
  return new Promise((resolve, reject) => {
    if (!isInitialized) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(['grocery_items'], 'readonly');
    const store = transaction.objectStore('grocery_items');
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Failed to get all items'));
    };
  });
};

// Original database functions
const addGroceryItemToDb = (userId, item) => {
  return new Promise((resolve, reject) => {
    if (!isInitialized) {
      console.error('Database not initialized when adding item');
      reject(new Error('Database not initialized'));
      return;
    }

    console.log('=== Adding Grocery Item ===');
    console.log('User ID:', userId);
    console.log('Item data:', item);

    const transaction = db.transaction(['grocery_items'], 'readwrite');
    const store = transaction.objectStore('grocery_items');

    const request = store.add({
      user_id: userId,
      name: item.name,
      category: item.category,
      quantity: parseInt(item.quantity, 10) || 1,
      purchase_date: new Date(item.purchase_date).toISOString().split('T')[0],
      expiry_date: new Date(item.expiry_date).toISOString().split('T')[0],
      created_at: new Date().toISOString()
    });

    request.onsuccess = () => {
      console.log('Item added successfully with ID:', request.result);
      resolve(request.result);
    };
    request.onerror = () => {
      console.error('Error adding item:', request.error);
      reject(request.error);
    };
  });
};

const updateGroceryItemInDb = (itemId, itemData) => {
  return new Promise((resolve, reject) => {
    if (!isInitialized) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(['grocery_items'], 'readwrite');
    const store = transaction.objectStore('grocery_items');

    const getRequest = store.get(itemId);

    getRequest.onsuccess = () => {
      const existingItem = getRequest.result;
      if (!existingItem) {
        reject(new Error('Item not found'));
        return;
      }

      const updatedItem = {
        ...existingItem,
        ...itemData,
        updated_at: new Date().toISOString()
      };

      const putRequest = store.put(updatedItem);
      putRequest.onsuccess = () => resolve(true);
      putRequest.onerror = () => reject(new Error('Failed to update item'));
    };

    getRequest.onerror = () => reject(new Error('Failed to get item'));
  });
};

const deleteGroceryItemFromDb = (itemId) => {
  return new Promise((resolve, reject) => {
    if (!isInitialized) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(['grocery_items'], 'readwrite');
    const store = transaction.objectStore('grocery_items');
    const request = store.delete(itemId);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(new Error('Failed to delete item'));
  });
}; 