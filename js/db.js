// Database configuration
const DB_NAME = 'TaskExtremeDB';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';

let db = null;
let dbPromise = null;

// Initialize the database (with singleton pattern)
function initDB() {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject(new Error('Failed to open database'));
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            
            // Handle database version changes
            db.onversionchange = () => {
                db.close();
                console.log('Database is outdated, please reload the page.');
                if (typeof showNotificationSafe === 'function') {
                    showNotificationSafe('Please refresh the page to update the database', 'info');
                }
            };
            
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const oldVersion = event.oldVersion;
            
            // Create object store if it doesn't exist
            if (oldVersion < 1) {
                // Initial database creation
                const store = db.createObjectStore(STORE_NAME, { 
                    keyPath: 'id',
                    autoIncrement: false
                });
                
                // Create indexes for better querying
                store.createIndex('category', 'category', { unique: false });
                store.createIndex('completed', 'completed', { unique: false });
                store.createIndex('dueDate', 'dueDate', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                store.createIndex('updatedAt', 'updatedAt', { unique: false });
            }
            
            // Future version upgrades can be handled here
            // Example for future version 2:
            // if (oldVersion < 2) {
            //     const transaction = event.target.transaction;
            //     const store = transaction.objectStore(STORE_NAME);
            //     // Add new index or modify schema
            // }
        };
    });
}

// Save task to IndexedDB
async function saveTask(task) {
    if (!db) {
        await initDB();
    }
    
    // Add timestamps
    const now = new Date().toISOString();
    const taskToSave = {
        ...task,
        updatedAt: now,
        createdAt: task.createdAt || now
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        transaction.oncomplete = () => resolve(taskToSave);
        transaction.onerror = (event) => {
            console.error('Transaction error:', event.target.error);
            reject(new Error('Transaction failed'));
        };
        
        const request = store.put(taskToSave);
        
        request.onsuccess = () => {
            console.log('Task saved successfully:', taskToSave.id);
        };
        
        request.onerror = (event) => {
            console.error('Error saving task:', event.target.error);
            reject(new Error('Failed to save task'));
        };
    });
}

// Get all tasks from IndexedDB
async function getAllTasks(options = {}) {
    if (!db) {
        await initDB();
    }
    
    const {
        filter = {},
        sortBy = 'createdAt',
        sortDirection = 'desc',
        limit = null
    } = options;
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
            let tasks = request.result || [];
            
            // Apply filters
            if (Object.keys(filter).length > 0) {
                tasks = tasks.filter(task => {
                    return Object.entries(filter).every(([key, value]) => {
                        if (value === undefined || value === null) return true;
                        return task[key] === value;
                    });
                });
            }
            
            // Apply sorting
            if (sortBy) {
                tasks.sort((a, b) => {
                    const aValue = a[sortBy] || '';
                    const bValue = b[sortBy] || '';
                    
                    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                });
            }
            
            // Apply limit
            if (limit && limit > 0) {
                tasks = tasks.slice(0, limit);
            }
            
            resolve(tasks);
        };
        
        request.onerror = (event) => {
            console.error('Error getting tasks:', event.target.error);
            reject(new Error('Failed to get tasks'));
        };
    });
}

// Delete task from IndexedDB
async function deleteTask(taskId) {
    if (!db) {
        await initDB();
    }
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        transaction.oncomplete = () => {
            console.log('Task deleted successfully:', taskId);
            resolve();
        };
        
        transaction.onerror = (event) => {
            console.error('Transaction error:', event.target.error);
            reject(new Error('Transaction failed'));
        };
        
        const request = store.delete(taskId);
        
        request.onerror = (event) => {
            console.error('Error deleting task:', event.target.error);
            reject(new Error('Failed to delete task'));
        };
    });
}

// Clear all tasks from IndexedDB (for testing)
async function clearAllTasks() {
    if (!db) {
        await initDB();
    }
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        transaction.oncomplete = () => {
            console.log('All tasks cleared');
            resolve();
        };
        
        transaction.onerror = (event) => {
            console.error('Transaction error:', event.target.error);
            reject(new Error('Transaction failed'));
        };
        
        const request = store.clear();
        
        request.onerror = (event) => {
            console.error('Error clearing tasks:', event.target.error);
            reject(new Error('Failed to clear tasks'));
        };
    });
}

// Helper function to safely show notifications
function showNotificationSafe(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Check if we're online
function isOnline() {
    return navigator.onLine;
}

// Export the functions
export {
    initDB,
    saveTask,
    getAllTasks,
    deleteTask,
    clearAllTasks,
    isOnline,
    STORE_NAME,
    showNotificationSafe
};

// For debugging in console
if (typeof window !== 'undefined') {
    window.TaskExtremeDB = {
        initDB,
        saveTask,
        getAllTasks,
        deleteTask,
        clearAllTasks,
        isOnline,
        STORE_NAME
    };
}
