import { initDB, saveTask, getAllTasks, deleteTask, isOnline, showNotificationSafe } from './db.js';

// Configuration
const CONFIG = {
    checkInterval: 5000, // Check connection every 5 seconds
    serverCheckUrl: '/api/health', // Endpoint to check server availability
    maxRetries: 3, // Number of retries before considering offline
    retryDelay: 1000 // Delay between retries in ms
};

// State
let connectionCheckInterval;
let isServerAvailable = true;
let retryCount = 0;

// Helper function to show notifications safely
function showNotificationSafe(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Track pending operations when offline
const pendingOperations = [];
let isInitialized = false;
let lastOnlineState = navigator.onLine;

// Initialize offline functionality
async function initOfflineSupport() {
    if (isInitialized) return;
    
    try {
        // Initialize IndexedDB
        await initDB();
        isInitialized = true;
        
        // Make functions available globally
        window.saveTaskOffline = saveTaskOffline;
        window.deleteTaskOffline = deleteTaskOffline;
        window.getAllTasks = getAllTasks;
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                
                // Check for updates
                registration.update();
            } catch (error) {
                console.error('ServiceWorker registration failed: ', error);
                showNotificationSafe('Offline features may not work correctly', 'warning');
            }
        }
        
        // Set up event listeners
        window.addEventListener('online', handleConnectionChange);
        window.addEventListener('offline', handleConnectionChange);
        
        // Initial status check and start periodic checking
        checkServerAvailability()
            .then(updateConnectionStatus)
            .catch(() => updateConnectionStatus(false));
            
        // Start periodic checking
        startPeriodicCheck();
        
    } catch (error) {
        console.error('Failed to initialize offline support:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification('Offline features are not available', 'error');
        } else {
            console.log('ERROR: Offline features are not available');
        }
    }
}

// Check server availability with retries
async function checkServerAvailability() {
    if (!navigator.onLine) {
        return false;
    }

    try {
        const response = await fetch(CONFIG.serverCheckUrl, {
            method: 'HEAD',
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        isServerAvailable = response.ok;
        if (isServerAvailable) retryCount = 0;
        return isServerAvailable;
    } catch (error) {
        console.error('Server check failed:', error);
        isServerAvailable = false;
        return false;
    }
}

// Start periodic connection checking
function startPeriodicCheck() {
    // Clear any existing interval
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
    }
    
    // Set up new interval
    connectionCheckInterval = setInterval(async () => {
        const wasOnline = navigator.onLine && isServerAvailable;
        const isNowOnline = await checkServerAvailability();
        
        if (wasOnline !== isNowOnline) {
            updateConnectionStatus(isNowOnline);
            
            if (isNowOnline) {
                showNotificationSafe('Connection restored', 'success');
                processPendingOperations();
            } else if (navigator.onLine) {
                // We're online but server is not responding
                retryCount++;
                if (retryCount >= CONFIG.maxRetries) {
                    showNotificationSafe('Server not responding. Working in offline mode.', 'warning');
                }
            }
        }
    }, CONFIG.checkInterval);
}

// Update UI based on connection status
function updateConnectionStatus(forceState = null) {
    const statusElement = document.getElementById('connection-status');
    if (!statusElement) return;
    
    const isActuallyOnline = forceState !== null ? forceState : (navigator.onLine && isServerAvailable);
    const connectionText = statusElement.querySelector('.connection-text') || 
                         document.createElement('span');
    
    if (isActuallyOnline) {
        // Update to online state
        statusElement.className = 'connection-status online';
        connectionText.textContent = 'Online';
        connectionText.className = 'connection-text';
        
        if (statusElement.querySelector('i.fas')) {
            statusElement.querySelector('i.fas').className = 'fas fa-wifi';
        }
        
        if (!statusElement.contains(connectionText)) {
            statusElement.appendChild(connectionText);
        }
        
        // Update last online state
        if (lastOnlineState !== isActuallyOnline) {
            lastOnlineState = true;
            showNotificationSafe('You are back online', 'success');
        }
    } else {
        // Update to offline state
        statusElement.className = 'connection-status offline';
        
        if (navigator.onLine && !isServerAvailable) {
            connectionText.textContent = 'Server Unavailable';
            if (retryCount < CONFIG.maxRetries) {
                connectionText.textContent += ` (Retrying ${retryCount + 1}/${CONFIG.maxRetries})`;
            }
        } else {
            connectionText.textContent = 'Offline';
        }
        
        connectionText.className = 'connection-text';
        
        if (statusElement.querySelector('i.fas')) {
            statusElement.querySelector('i.fas').className = 'fas fa-wifi-slash';
        }
        
        if (!statusElement.contains(connectionText)) {
            statusElement.appendChild(connectionText);
        }
        
        // Update last online state
        if (lastOnlineState !== false) {
            lastOnlineState = false;
            showNotificationSafe(
                'You are currently offline. Changes will be synced when you are back online.', 
                'warning'
            );
        }
    }
}

// Save task to IndexedDB
async function saveTaskOffline(task) {
    try {
        await saveTask(task);
        
        // If online, try to sync with server (in a real app)
        if (isOnline()) {
            // await syncWithServer('save', task);
        } else {
            // Queue for later sync
            pendingOperations.push({
                type: 'save',
                data: task,
                timestamp: Date.now()
            });
        }
        
        return true;
    } catch (error) {
        console.error('Error saving task offline:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification('Failed to save task', 'error');
        } else {
            console.log('ERROR: Failed to save task');
        }
        return false;
    }
}

// Delete task from IndexedDB
async function deleteTaskOffline(taskId) {
    try {
        await deleteTask(taskId);
        
        // If online, try to sync with server (in a real app)
        if (isOnline()) {
            // await syncWithServer('delete', { id: taskId });
        } else {
            // Queue for later sync
            pendingOperations.push({
                type: 'delete',
                data: { id: taskId },
                timestamp: Date.now()
            });
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting task:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification('Failed to delete task', 'error');
        } else {
            console.log('ERROR: Failed to delete task');
        }
        return false;
    }
}

// Process pending operations when back online
async function processPendingOperations() {
    if (!isOnline() || pendingOperations.length === 0) return;
    
    // Sort by timestamp (oldest first)
    pendingOperations.sort((a, b) => a.timestamp - b.timestamp);
    
    // Process each operation
    for (const operation of [...pendingOperations]) {
        try {
            switch (operation.type) {
                case 'save':
                    // await syncWithServer('save', operation.data);
                    break;
                case 'delete':
                    // await syncWithServer('delete', operation.data);
                    break;
            }
            
            // Remove from pending operations if successful
            const index = pendingOperations.indexOf(operation);
            if (index > -1) {
                pendingOperations.splice(index, 1);
            }
        } catch (error) {
            console.error(`Error processing ${operation.type} operation:`, error);
            // Stop processing if we encounter an error to maintain order
            break;
        }
    }
    
    if (pendingOperations.length === 0) {
        showNotificationSafe('All changes have been synced', 'success');
    }
}

// Clean up when the page is unloaded
window.addEventListener('beforeunload', () => {
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
    }
});

// In a real app, this would sync with your backend server
/*
async function syncWithServer(operation, data) {
    // Implementation would depend on your backend API
    // This is just a placeholder
    let url = '/api/tasks';
    let method = 'POST';
    
    if (operation === 'delete') {
        url += `/${data.id}`;
        method = 'DELETE';
    }
    
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: operation !== 'delete' ? JSON.stringify(data) : undefined
    });
    
    if (!response.ok) {
        throw new Error('Failed to sync with server');
    }
    
    return response.json();
}
*/

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOfflineSupport);
} else {
    initOfflineSupport();
}

// Export the functions
export {
    initOfflineSupport,
    saveTaskOffline,
    deleteTaskOffline,
    getAllTasks,
    isOnline,
    updateConnectionStatus
};
