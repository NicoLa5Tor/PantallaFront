window.TvApp = window.TvApp || {};

(function () {
  var errorOverlay = null;
  var setupView = null;
  var displayView = null;
  var displayContainer = null;
  var displayLoaded = false;

  window.TvApp.recentAlerts = [];

  function showErrorOverlay(label, error) {
    if (!errorOverlay) {
      return;
    }
    var message = error && error.message ? error.message : String(error);
    errorOverlay.textContent = label + '\n\n' + message;
    errorOverlay.style.display = 'block';
  }

  window.addEventListener('error', function (event) {
    showErrorOverlay('window.onerror', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', function (event) {
    showErrorOverlay('unhandledrejection', event.reason);
  });

  window.TvApp.showSetupView = function () {
    window.TvApp.show(setupView);
    if (displayView) {
      window.TvApp.hide(displayView);
    }
  };

  window.TvApp.showDisplayView = function () {
    window.TvApp.loadDisplayView(function () {
      window.TvApp.show(displayView);
      window.TvApp.hide(setupView);
    });
  };

  window.TvApp.loadDisplayView = function (callback) {
    if (displayLoaded) {
      if (callback) {
        callback();
      }
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', './views/display.html', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          displayContainer.innerHTML = xhr.responseText;
          displayView = window.TvApp.$('displayView');
          window.TvApp.initDisplayView();
          if (window.TvApp.updateTopicFromStorage) {
            window.TvApp.updateTopicFromStorage();
          }
          displayLoaded = true;
          if (callback) {
            callback();
          }
        } else {
          showErrorOverlay('display view load', 'No se pudo cargar la vista de alertas.');
        }
      }
    };
    xhr.send();
  };

  function init() {
    errorOverlay = window.TvApp.$('errorOverlay');
    setupView = window.TvApp.$('setupView');
    displayContainer = window.TvApp.$('displayContainer');

    window.TvApp.initTheme();
    window.TvApp.initSetupView();
    if (!window.TvApp.connectStored || !window.TvApp.connectStored()) {
      window.TvApp.showSetupView();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
