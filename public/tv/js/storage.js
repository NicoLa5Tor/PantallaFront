window.TvApp = window.TvApp || {};

window.TvApp.storage = {
  EMPRESA_KEY: 'rescue-empresa',
  SEDE_KEY: 'rescue-sede',
  THEME_KEY: 'rescue-theme',
  LAST_ALERT_KEY: 'rescue-last-alert'
};

window.TvApp.loadStorageValue = function (key) {
  try {
    return localStorage.getItem(key) || '';
  } catch (err) {
    return '';
  }
};

window.TvApp.saveStorageValue = function (key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    return;
  }
};
