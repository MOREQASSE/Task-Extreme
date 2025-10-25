// TaskExtreme: Templates UI logic for templates.html
// Requires templates.js

/**
 * Close a modal with animation
 * @param {HTMLElement} modal - The modal element to close
 */
function closeModal(modal) {
  if (!modal) return;
  
  // Remove open class for fade-out animation
  modal.classList.remove('open');
  
  // Wait for animation to complete before hiding
  setTimeout(() => {
    modal.style.display = 'none';
  }, 200); // Should match the CSS transition time
}

document.addEventListener('DOMContentLoaded', function() {
  loadTemplates();
  renderTemplateGroups();
  setupActions();
});

function groupTemplates(templates) {
  const groups = {};
  templates.forEach(t => {
    const group = t.group || 'Ungrouped';
    if (!groups[group]) groups[group] = [];
    groups[group].push(t);
  });
  return groups;
}

function renderTemplateGroups() {
  const container = document.getElementById('template-groups');
  container.innerHTML = '';
  const groups = groupTemplates(templates);
  Object.entries(groups).forEach(([group, tpls]) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'template-group';
    groupDiv.innerHTML = `<div class="template-group-title">${group}</div>`;
    const list = document.createElement('div');
    list.className = 'templates-card-list';
    tpls.forEach(t => list.appendChild(renderTemplateCard(t)));
    groupDiv.appendChild(list);
    container.appendChild(groupDiv);
  });
}

function renderTemplateCard(template) {
  const card = document.createElement('div');
  card.className = 'template-card';
  card.innerHTML = `
    <div class="template-card-header">
      <span class="template-card-icon" style="background:${template.color||'#e0e7ef'}">${template.icon||'📋'}</span>
      <span class="template-card-title">${template.name}</span>
    </div>
    <div class="template-card-meta">${template.tasks.length} tasks${template.repeat ? ' • ' + template.repeat : ''}</div>
    <div class="template-card-tasks">${template.tasks.map(t=>t.title).join(', ')}</div>
    <div class="template-card-actions">
      <button class="template-card-action-btn edit-btn">Edit</button>
      <button class="template-card-action-btn duplicate-btn">Duplicate</button>
      <button class="template-card-action-btn delete-btn">Delete</button>
    </div>
  `;
  card.querySelector('.edit-btn').onclick = () => openTemplateEditor(template.id);
  card.querySelector('.duplicate-btn').onclick = () => duplicateTemplate(template.id);
  card.querySelector('.delete-btn').onclick = () => deleteTemplateUI(template.id);
  return card;
}

function setupActions() {
  document.getElementById('create-template-btn').onclick = () => openTemplateEditor();
  document.getElementById('import-template-btn').onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
      if (input.files && input.files[0]) {
        importTemplates(input.files[0], ok => {
          if (ok) {
            loadTemplates();
            renderTemplateGroups();
            alert('Templates imported!');
          } else {
            alert('Import failed.');
          }
        });
      }
    };
    input.click();
  };
  document.getElementById('export-template-btn').onclick = exportTemplates;
}

function openTemplateEditor(templateId) {
  const modal = document.getElementById('template-editor-modal');
  const form = document.getElementById('template-editor-form');
  const delBtn = document.getElementById('delete-template-btn');
  let editing = false;
  let template = null;
  if (templateId) {
    template = getTemplateById(templateId);
    editing = true;
  }
  form.reset();
  document.getElementById('template-id').value = template ? template.id : '';
  document.getElementById('template-name').value = template ? template.name : '';
  document.getElementById('template-icon').value = template ? template.icon : '';
  document.getElementById('template-color').value = template ? template.color : '#2563eb';
  document.getElementById('template-group').value = template ? template.group : '';
  document.getElementById('template-repeat').value = template ? template.repeat : 'none';
  renderTemplateTasksList(template ? template.tasks : []);
  delBtn.style.display = editing ? '' : 'none';
  document.getElementById('template-editor-title').textContent = editing ? 'Edit Template' : 'New Template';
  modal.style.display = 'block';
  setTimeout(() => modal.classList.add('open'), 10);
  document.getElementById('close-template-editor').onclick = () => closeModal(modal);
  delBtn.onclick = () => {
    if (confirm('Delete this template?')) {
      deleteTemplate(template.id);
      loadTemplates();
      renderTemplateGroups();
      modal.style.display = 'none';
    }
  };
  form.onsubmit = function(e) {
    e.preventDefault();
    const id = document.getElementById('template-id').value;
    const name = document.getElementById('template-name').value.trim();
    if (!name) {
      alert('Please enter a template name');
      return;
    }
    const icon = document.getElementById('template-icon').value.trim() || '📄';
    const color = document.getElementById('template-color').value || '#2563eb';
    const group = document.getElementById('template-group').value.trim() || 'Ungrouped';
    const repeat = document.getElementById('template-repeat').value || 'none';
    const tasks = getCurrentTemplateTasks();
    const tpl = { 
      id: id || Date.now().toString(), 
      name, 
      icon, 
      color, 
      group, 
      repeat, 
      tasks 
    };
    
    try {
      if (editing) {
        updateTemplate(id, tpl);
      } else {
        addTemplate(tpl);
      }
      loadTemplates();
      renderTemplateGroups();
      closeModal(modal);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    }
  };
  document.getElementById('add-template-task').onclick = () => openTemplateTaskModal();
}

function renderTemplateTasksList(tasks = []) {
  const list = document.getElementById('template-tasks-list');
  if (!list) return;
  
  // Create table structure
  list.innerHTML = `
    <table class="template-tasks-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Category</th>
          <th>Priority</th>
          <th>Time</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${tasks.map((task, i) => `
          <tr data-task-idx="${i}">
            <td>${escapeHtml(task.title || '')}</td>
            <td>${escapeHtml(task.category || '')}</td>
            <td>
              <span class="priority-badge ${task.priority || 'medium'}">
                ${(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
              </span>
            </td>
            <td>${task.time || ''}</td>
            <td class="task-actions">
              <button class="edit-task-btn" title="Edit task" onclick="openTemplateTaskModal(${i})">✏️</button>
              <button class="delete-task-btn" title="Delete task" onclick="removeTemplateTask(${i})">🗑️</button>
            </td>
          </tr>
        `).join('')}
        ${tasks.length === 0 ? `
          <tr>
            <td colspan="5" class="empty-state">No tasks added yet. Click "Add Task" to get started.</td>
          </tr>
        ` : ''}
      </tbody>
    </table>
  `;
  
  // Store task data for editing
  const rows = list.querySelectorAll('tbody tr');
  rows.forEach((row, i) => {
    if (tasks[i]) {
      row.dataset.taskJson = JSON.stringify(tasks[i]);
    }
  });
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getCurrentTemplateTasks() {
  const list = document.getElementById('template-tasks-list');
  const tasks = [];
  for (let li of list.children) {
    if (li.dataset.taskJson) {
      tasks.push(JSON.parse(li.dataset.taskJson));
    }
  }
  return tasks;
}

let editingTaskIndex = null;
function openTemplateTaskModal(taskIndex) {
  const modal = document.getElementById('template-task-modal');
  const form = document.getElementById('template-task-form');
  editingTaskIndex = typeof taskIndex === 'number' ? taskIndex : null;
  // Populate fields
  let task = { title:'', details:'', category:'', priority:'medium', time:'' };
  const tasks = getCurrentTemplateTasks();
  if (editingTaskIndex !== null) {
    task = tasks[editingTaskIndex];
  }
  form.reset();
  document.getElementById('template-task-title').value = task.title || '';
  document.getElementById('template-task-details').value = task.details || '';
  document.getElementById('template-task-category').value = task.category || '';
  document.getElementById('template-task-priority').value = task.priority || 'medium';
  document.getElementById('template-task-time').value = task.time || '';
  modal.style.display = 'block';
  setTimeout(() => modal.classList.add('open'), 10);
  document.getElementById('close-template-task-modal').onclick = () => closeModal(modal);
  form.onsubmit = function(e) {
    e.preventDefault();
    const t = {
      title: document.getElementById('template-task-title').value.trim(),
      details: document.getElementById('template-task-details').value.trim(),
      category: document.getElementById('template-task-category').value,
      priority: document.getElementById('template-task-priority').value,
      time: document.getElementById('template-task-time').value
    };
    saveTemplateTask(t);
    modal.style.display = 'none';
  };
}
function saveTemplateTask(task) {
  const list = document.getElementById('template-tasks-list');
  let tasks = [];
  for (let li of list.children) {
    if (li.dataset.taskJson) {
      tasks.push(JSON.parse(li.dataset.taskJson));
    }
  }
  if (editingTaskIndex !== null) {
    tasks[editingTaskIndex] = task;
  } else {
    tasks.push(task);
  }
  renderTemplateTasksList(tasks);
}
function removeTemplateTask(idx) {
  const list = document.getElementById('template-tasks-list');
  let tasks = [];
  for (let li of list.children) {
    if (li.dataset.taskJson) {
      tasks.push(JSON.parse(li.dataset.taskJson));
    }
  }
  tasks.splice(idx, 1);
  renderTemplateTasksList(tasks);
}
function deleteTemplateUI(id) {
  if (confirm('Delete this template?')) {
    deleteTemplate(id);
    loadTemplates();
    renderTemplateGroups();
  }
}
function duplicateTemplate(id) {
  const tpl = getTemplateById(id);
  if (tpl) {
    const copy = { ...tpl, id: Date.now().toString(), name: tpl.name + ' (Copy)' };
    templates.push(copy);
    saveTemplates();
    loadTemplates();
    renderTemplateGroups();
  }
}
