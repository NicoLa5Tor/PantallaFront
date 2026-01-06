window.TvApp = window.TvApp || {};

(function () {
  var storage = window.TvApp.storage;
  var themeLabel = null;
  var toggleButton = null;

  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === 'dark') {
      if (root && root.classList) {
        root.classList.add('theme-dark');
      }
      if (document.body && document.body.classList) {
        document.body.classList.add('theme-dark');
      }
      if (themeLabel) {
        themeLabel.textContent = 'Oscuro';
      }
    } else {
      if (root && root.classList) {
        root.classList.remove('theme-dark');
      }
      if (document.body && document.body.classList) {
        document.body.classList.remove('theme-dark');
      }
      if (themeLabel) {
        themeLabel.textContent = 'Claro';
      }
    }
  }

  function toggleTheme() {
    var current = window.TvApp.loadStorageValue(storage.THEME_KEY) || 'light';
    var next = current === 'light' ? 'dark' : 'light';
    window.TvApp.saveStorageValue(storage.THEME_KEY, next);
    applyTheme(next);
  }

  window.TvApp.initTheme = function () {
    themeLabel = window.TvApp.$('themeLabel');
    toggleButton = window.TvApp.$('themeToggle');

    if (toggleButton) {
      toggleButton.addEventListener('click', toggleTheme);
    }

    var saved = window.TvApp.loadStorageValue(storage.THEME_KEY) || 'light';
    applyTheme(saved);
  };
})();
