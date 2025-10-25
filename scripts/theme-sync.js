// TaskExtreme: Theme Sync Across Pages
// This script ensures the selected theme (dark, light, etc.) persists between index.html and templates.html

(function() {
  // Store theme in localStorage under 'theme'
  function applyTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.documentElement.removeAttribute('data-theme');
    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.body.classList.add('theme-light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  function getSavedTheme() {
    return localStorage.getItem('theme') || '';
  }

  function saveTheme(theme) {
    localStorage.setItem('theme', theme);
  }

  // Listen for theme changes (optional: if you have a theme switcher)
  window.setTheme = function(theme) {
    applyTheme(theme);
    saveTheme(theme);
  };

  // On load, apply saved theme
  document.addEventListener('DOMContentLoaded', function() {
    const theme = getSavedTheme();
    if (theme) applyTheme(theme);
  });
})();
