import { initDB, saveTask, getAllTasks, deleteTask, isOnline } from './db.js';

// Helper function to show notifications safely
function showNotificationSafe(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Track pending operations when offline

// Track pending operations when offline
const pendingOperations = [];
let isInitialized = false;

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
        
        // Listen for online/offline events
        window.addEventListener('online', handleConnectionChange);
        window.addEventListener('offline', handleConnectionChange);
        
        // Initial status check
        updateConnectionStatus();
        
    } catch (error) {
        console.error('Failed to initialize offline support:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification('Offline features are not available', 'error');
        } else {
            console.log('ERROR: Offline features are not available');
        }
    }
}

// Handle connection status changes
function handleConnectionChange() {
    updateConnectionStatus();
    
    if (isOnline()) {
        // Process any pending operations when coming back online
        processPendingOperations();
        if (typeof window.showNotification === 'function') {
            window.showNotification('You are back online', 'success');
        } else {
            console.log('SUCCESS: You are back online');
        }
    } else {
        if (typeof window.showNotification === 'function') {
            window.showNotification('You are currently offline. Changes will be synced when you are back online.', 'warning');
        } else {
            console.log('WARNING: You are currently offline. Changes will be synced when you are back online.');
        }
    }
}

// Update UI based on connection status
function updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        if (isOnline()) {
            statusElement.innerHTML = '<i class="fas fa-wifi"></i> Online';
            statusElement.className = 'online';
        } else {
            statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline';
            statusElement.className = 'offline';
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
