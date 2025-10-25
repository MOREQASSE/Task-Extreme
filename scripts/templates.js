// TaskExtreme: Task Templates Logic
// Data model: { id, name, icon, color, group, repeat, tasks: [ {title, details, category, priority, time} ] }

const TEMPLATE_STORAGE_KEY = 'taskextreme_templates';

let templates = [];

function loadTemplates() {
  try {
    templates = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY)) || [];
  } catch {
    templates = [];
  }
}

function saveTemplates() {
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
}

function addTemplate(template) {
  template.id = Date.now().toString();
  templates.push(template);
  saveTemplates();
}

function updateTemplate(id, updated) {
  const idx = templates.findIndex(t => t.id === id);
  if (idx !== -1) {
    templates[idx] = { ...templates[idx], ...updated };
    saveTemplates();
  }
}

function deleteTemplate(id) {
  templates = templates.filter(t => t.id !== id);
  saveTemplates();
}

function getTemplateById(id) {
  return templates.find(t => t.id === id);
}

function exportTemplates() {
  const dataStr = JSON.stringify(templates, null, 2);
  const blob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'taskextreme_templates.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importTemplates(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        templates = imported;
        saveTemplates();
        if (callback) callback(true);
      } else {
        if (callback) callback(false);
      }
    } catch {
      if (callback) callback(false);
    }
  };
  reader.readAsText(file);
}

window.loadTemplates = loadTemplates;
window.saveTemplates = saveTemplates;
window.addTemplate = addTemplate;
window.updateTemplate = updateTemplate;
window.deleteTemplate = deleteTemplate;
window.getTemplateById = getTemplateById;
window.exportTemplates = exportTemplates;
window.importTemplates = importTemplates;

// UI rendering and event logic will be added next.
