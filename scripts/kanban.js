// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        const taskList = document.getElementById('tasks-list');
        const kanbanBoard = document.getElementById('kanban-board');
        const viewToggleList = document.getElementById('view-toggle-list');
        const viewToggleKanban = document.getElementById('view-toggle-kanban');
        
        if (!taskList || !kanbanBoard || !viewToggleList || !viewToggleKanban) {
            console.error('One or more required elements not found. Check your HTML structure.');
            return;
        }
        
        let draggedTask = null;

    // Function to switch to Task List view
    function showTaskList() {
        taskList.style.display = '';
        kanbanBoard.style.display = 'none';
        viewToggleList.classList.add('active');
        viewToggleKanban.classList.remove('active');
        localStorage.setItem('preferredView', 'list');
    }

    // Function to switch to Kanban Board view
    function showKanbanBoard() {
        taskList.style.display = 'none';
        kanbanBoard.style.display = 'grid';
        viewToggleList.classList.remove('active');
        viewToggleKanban.classList.add('active');
        localStorage.setItem('preferredView', 'kanban');
        renderKanbanBoard();
    }

    // Event listeners for the toggle buttons
    viewToggleList.addEventListener('click', showTaskList);
    viewToggleKanban.addEventListener('click', showKanbanBoard);

    // View initialization is handled at the end of the file

    // Function to get priority color
    function getPriorityColor(priority) {
        const colors = {
            'high': '#ef4444',
            'medium': '#f59e0b',
            'low': '#10b981'
        };
        return colors[priority?.toLowerCase()] || '#6b7280';
    }

    // Function to format date
    function formatDate(dateString) {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Function to get category class
    function getCategoryClass(category) {
        const categories = {
            'work': 'work',
            'personal': 'personal',
            'shopping': 'shopping',
            'health': 'health',
            'other': 'other'
        };
        return categories[category?.toLowerCase()] || 'other';
    }

    // Track current page for each column
    const kanbanPages = {
        todo: 1,
        done: 1
    };
    const TASKS_PER_PAGE = 3;

    // Function to render tasks for a specific column with pagination
    function renderKanbanColumn(columnId, tasks, page) {
        const startIdx = (page - 1) * TASKS_PER_PAGE;
        const paginatedTasks = tasks.slice(0, startIdx + TASKS_PER_PAGE);
        const totalPages = Math.ceil(tasks.length / TASKS_PER_PAGE);
        
        let tasksHTML = '';
        
        if (tasks.length === 0) {
            tasksHTML = `
                <div class="kanban-empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No tasks here</p>
                </div>`;
        } else {
            paginatedTasks.forEach(task => {
                const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const isOverdue = dueDate && dueDate < today && !(JSON.parse(localStorage.getItem('taskextreme_checked') || '{}')[task.id]);
                const dueDateClass = isOverdue ? 'overdue' : '';
                
                const priorityIcons = {
                    'high': 'fa-arrow-up',
                    'medium': 'fa-arrow-right',
                    'low': 'fa-arrow-down'
                };
                const priorityIcon = priorityIcons[task.priority] || 'fa-flag';

                const categoryIcons = {
                    'work': 'fa-briefcase',
                    'personal': 'fa-user',
                    'shopping': 'fa-shopping-cart',
                    'health': 'fa-heartbeat',
                    'other': 'fa-tasks'
                };
                const categoryIcon = categoryIcons[task.category?.toLowerCase()] || 'fa-tag';

                tasksHTML += `
                    <div class="kanban-task" data-task-id="${task.id}" draggable="true">
                        <div class="kanban-task-header">
                            <div class="task-meta">
                                <span class="kanban-task-priority" style="background: ${getPriorityColor(task.priority)}">
                                    <i class="fas ${priorityIcon}"></i>
                                </span>
                                <span class="kanban-task-category ${getCategoryClass(task.category)}">
                                    <i class="fas ${categoryIcon}"></i>
                                    <span>${task.category || 'Task'}</span>
                                </span>
                            </div>
                        </div>
                        <div class="kanban-task-title">
                            <i class="fas fa-tasks task-icon"></i>
                            <span>${task.title}</span>
                        </div>
                        ${task.details ? `
                            <div class="kanban-task-description">
                                <i class="far fa-file-alt"></i>
                                <span>${task.details}</span>
                            </div>` : ''
                        }
                        <div class="kanban-task-footer">
                            ${dueDate ? 
                                `<div class="kanban-task-due ${dueDateClass}" title="Due date">
                                    <i class="far ${isOverdue ? 'fa-exclamation-circle' : 'fa-calendar'}"></i>
                                    <span>${formatDate(dueDate)}</span>
                                </div>` : 
                                '<div class="kanban-task-due"><i class="far fa-calendar-plus"></i> No due date</div>'
                            }
                            <div class="kanban-task-actions">
                                <button class="kanban-task-edit" data-task-id="${task.id}" title="Edit task">
                                    <i class="fas fa-pencil-alt"></i>
                                </button>
                                <button class="kanban-task-delete" data-task-id="${task.id}" title="Delete task">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>`;
            });

            // Add show more button if there are more tasks
            if (tasks.length > paginatedTasks.length) {
                tasksHTML += `
                    <div class="kanban-show-more-container">
                        <button class="kanban-show-more" data-column="${columnId}">
                            Show ${Math.min(TASKS_PER_PAGE, tasks.length - paginatedTasks.length)} more
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>`;
            }
        }
        
        return tasksHTML;
    }

    // Function to render the Kanban board
    function renderKanbanBoard() {
        kanbanBoard.innerHTML = ''; // Clear the board

        const tasks = JSON.parse(localStorage.getItem('taskextreme_tasks')) || [];
        const checked = JSON.parse(localStorage.getItem('taskextreme_checked')) || {};

        const columns = [
            { 
                id: 'todo', 
                title: '📋 To Do',
                icon: 'fa-list-check',
                tasks: [] 
            },
            { 
                id: 'done', 
                title: '✅ Done',
                icon: 'fa-circle-check',
                tasks: [] 
            }
        ];

        // Categorize tasks into columns
        tasks.forEach(task => {
            const taskStatus = task.status || 'todo';
            const column = columns.find(col => col.id === taskStatus) || columns[0];
            
            // If task is checked, it's considered done
            if (checked[task.id]) {
                columns[1].tasks.push(task);
            } else if (column && column.id !== 'inprogress') {
                column.tasks.push(task);
            }
        });

        // Create columns
        columns.forEach(column => {
            const columnEl = document.createElement('div');
            columnEl.className = 'kanban-column';
            columnEl.dataset.status = column.id;
            
            columnEl.innerHTML = `
                <h3><i class="fas ${column.icon}"></i> ${column.title} <span class="task-count">${column.tasks.length}</span></h3>
                <div class="kanban-tasks" data-status="${column.id}">
                    ${renderKanbanColumn(column.id, column.tasks, kanbanPages[column.id] || 1)}
                </div>
            `;

            kanbanBoard.appendChild(columnEl);
        });

        // Initialize drag and drop
        initDragAndDrop();
        // Add event listeners for task actions
        initTaskActions();
        
        // Add event listeners for show more buttons
        document.querySelectorAll('.kanban-show-more').forEach(button => {
            button.addEventListener('click', (e) => {
                const columnId = e.currentTarget.dataset.column;
                kanbanPages[columnId] = (kanbanPages[columnId] || 1) + 1;
                renderKanbanBoard();
            });
        });
    }

    // Initialize drag and drop functionality
    function initDragAndDrop() {
        const tasks = document.querySelectorAll('.kanban-task');
        const columns = document.querySelectorAll('.kanban-column');
        
        // Make tasks draggable
        tasks.forEach(task => {
            task.addEventListener('dragstart', handleDragStart);
            task.addEventListener('dragend', handleDragEnd);
        });

        // Make columns drop targets
        columns.forEach(column => {
            column.addEventListener('dragover', handleDragOver);
            column.addEventListener('dragenter', handleDragEnter);
            column.addEventListener('dragleave', handleDragLeave);
            column.addEventListener('drop', handleDrop);
        });
    }

    // Drag and drop event handlers
    function handleDragStart(e) {
        draggedTask = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        document.querySelectorAll('.kanban-column').forEach(col => {
            col.classList.remove('drop-zone');
        });
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('drop-zone');
    }

    function handleDragLeave() {
        this.classList.remove('drop-zone');
    }

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        
        if (draggedTask) {
            const targetStatus = this.dataset.status;
            const taskId = draggedTask.dataset.taskId;
            
            // Update task status in local storage
            const tasks = JSON.parse(localStorage.getItem('taskextreme_tasks')) || [];
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            
            if (taskIndex !== -1) {
                tasks[taskIndex].status = targetStatus;
                
                // If moved to done, mark as checked
                const checked = JSON.parse(localStorage.getItem('taskextreme_checked')) || {};
                if (targetStatus === 'done') {
                    checked[taskId] = true;
                } else {
                    delete checked[taskId];
                }
                
                localStorage.setItem('taskextreme_tasks', JSON.stringify(tasks));
                localStorage.setItem('taskextreme_checked', JSON.stringify(checked));
                
                // Re-render the board
                renderKanbanBoard();
                
                // Show success notification
                showNotification('Task moved successfully!', 'success');
            }
        }
        
        this.classList.remove('drop-zone');
        return false;
    }

    // Initialize task action buttons
    function initTaskActions() {
        // Edit task
        document.querySelectorAll('.kanban-task-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = e.currentTarget.dataset.taskId;
                // Trigger edit task event
                const event = new CustomEvent('editTask', { detail: { taskId } });
                window.dispatchEvent(event);
            });
        });

        // Delete task
        document.querySelectorAll('.kanban-task-delete').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const taskId = e.currentTarget.dataset.taskId;
                
                // Show confirmation dialog
                const confirmDelete = confirm('Are you sure you want to delete this task?');
                if (!confirmDelete) return;

                try {
                    // Get current tasks
                    const tasks = JSON.parse(localStorage.getItem('taskextreme_tasks')) || [];
                    const checked = JSON.parse(localStorage.getItem('taskextreme_checked')) || {};
                    
                    // Remove task
                    const updatedTasks = tasks.filter(task => task.id !== taskId);
                    
                    // Remove from checked tasks if it exists
                    if (checked[taskId]) {
                        delete checked[taskId];
                    }
                    
                    // Save changes
                    localStorage.setItem('taskextreme_tasks', JSON.stringify(updatedTasks));
                    localStorage.setItem('taskextreme_checked', JSON.stringify(checked));
                    
                    // Show success message
                    showNotification('Task deleted successfully', 'success');
                    
                    // Refresh the board
                    renderKanbanBoard();
                    
                    // Notify other components
                    window.dispatchEvent(new Event('taskUpdated'));
                    
                } catch (error) {
                    console.error('Error deleting task:', error);
                    showNotification('Failed to delete task', 'error');
                }
            });
        });

        // Task click to view details
        document.querySelectorAll('.kanban-task').forEach(task => {
            task.addEventListener('click', function(e) {
                // Don't trigger if clicking on action buttons
                if (e.target.closest('.kanban-task-edit, .kanban-task-delete')) {
                    return;
                }
                const taskId = this.dataset.taskId;
                // Here you would typically open a task details view
                showNotification('Viewing task: ' + taskId, 'info');
            });
        });
    }

    // Helper function to show notifications
    function showNotification(message, type = 'info') {
        // You can integrate this with your existing notification system
        console.log(`${type.toUpperCase()}: ${message}`);
        // Example: window.showNotification(message, type);
    }

        // Listen for task updates from other parts of the app
        window.addEventListener('taskUpdated', () => {
            if (kanbanBoard.style.display !== 'none') {
                renderKanbanBoard();
            }
        });
        
        // Initialize the Kanban board if it's the preferred view
        const initialView = localStorage.getItem('preferredView') || 'list';
        if (initialView === 'kanban') {
            // Small timeout to ensure all styles are loaded
            setTimeout(showKanbanBoard, 100);
        } else {
            // Make sure list view is shown by default
            showTaskList();
        }
    } catch (error) {
        console.error('Error initializing Kanban board:', error);
    }
});
