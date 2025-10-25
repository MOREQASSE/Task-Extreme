// TaskExtreme: Templates Dropdown Logic for Main Navbar
// Requires templates.js to be loaded on templates.html, but this file is for the main app UI

(function() {
  // Load templates from localStorage
  function getTemplates() {
    try {
      return JSON.parse(localStorage.getItem('taskextreme_templates')) || [];
    } catch {
      return [];
    }
  }

  // Render dropdown menu
  function renderTemplatesDropdown() {
    const menu = document.getElementById('templates-dropdown-menu');
    const list = document.getElementById('templates-list');
    if (!menu || !list) return;
    list.innerHTML = '';
    const templates = getTemplates();
    if (templates.length === 0) {
      list.innerHTML = '<div class="templates-empty">No templates yet</div>';
      return;
    }
    templates.forEach(t => {
      const item = document.createElement('div');
      item.className = 'template-dropdown-item';
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.setAttribute('data-template-id', t.id);
      item.innerHTML = `<span class="template-dropdown-icon" style="background:${t.color||'#e0e7ef'}">${t.icon||'📋'}</span><span>${t.name}</span>`;
      item.addEventListener('click', () => applyTemplate(t.id));
      item.addEventListener('keypress', e => { if (e.key === 'Enter') applyTemplate(t.id); });
      list.appendChild(item);
    });
  }

  // Apply a template instantly
  function applyTemplate(templateId) {
    const templates = getTemplates();
    const t = templates.find(tmp => tmp.id === templateId);
    if (!t || !Array.isArray(t.tasks)) return;
    // Add all tasks to today (or current view)
    const today = window.currentDate ? window.currentDate() : (new Date()).toISOString().split('T')[0];
    t.tasks.forEach(task => {
      // Clone and adapt task
      const newTask = {
        ...task,
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        date: today,
        repeat: t.repeat,
        completed: false
      };
      if (window.tasks) {
        window.tasks.push(newTask);
      }
    });
    if (window.saveTasks) window.saveTasks();
    if (window.renderTasks) window.renderTasks();
    if (window.renderCalendar) window.renderCalendar();
    // Optionally: show a toast/notification
    if (window.showFormFeedback) window.showFormFeedback('Template applied!','success');
    // Close dropdown
    setTimeout(() => { document.getElementById('templates-dropdown-menu').style.display = 'none'; }, 100);
  }

  // Dropdown open/close logic
  function setupDropdown() {
    const btn = document.getElementById('templates-dropdown-btn');
    const menu = document.getElementById('templates-dropdown-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = menu.style.display === 'block';
      document.querySelectorAll('.templates-dropdown-menu').forEach(m => m.style.display = 'none');
      menu.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) renderTemplatesDropdown();
    });
    // Close on outside click
    document.addEventListener('click', function(e) {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.style.display = 'none';
      }
    });
  }

  // Initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', setupDropdown);
})();
