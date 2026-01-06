window.TvApp = window.TvApp || {};

window.TvApp.$ = function (id) {
  return document.getElementById(id);
};

window.TvApp.setText = function (el, value) {
  if (el) {
    el.textContent = value;
  }
};

window.TvApp.setHtml = function (el, value) {
  if (el) {
    el.innerHTML = value;
  }
};

window.TvApp.show = function (el) {
  if (el) {
    el.className = el.className.replace(/\bhidden\b/g, '').trim();
  }
};

window.TvApp.hide = function (el) {
  if (el && el.className.indexOf('hidden') === -1) {
    el.className = (el.className + ' hidden').trim();
  }
};

window.TvApp.safeJsonParse = function (value) {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
};
