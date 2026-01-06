window.TvApp = window.TvApp || {};

(function () {
  var storage = window.TvApp.storage;
  var empresaInput = null;
  var sedeInput = null;
  var topicText = null;
  var errorText = null;
  var connectBtn = null;

  function topicPreview() {
    var empresa = (empresaInput && empresaInput.value) ? empresaInput.value.trim() : '';
    var sede = (sedeInput && sedeInput.value) ? sedeInput.value.trim() : '';
    return 'empresas/' + (empresa || '{empresa}') + '/' + (sede || '{sede}') + '/PANTALLA';
  }

  function updatePreview() {
    var preview = topicPreview();
    window.TvApp.setText(topicText, preview);
    if (window.TvApp.updateTopicDisplay) {
      window.TvApp.updateTopicDisplay(preview);
    }
  }

  function setError(message) {
    window.TvApp.setText(errorText, message || '');
  }

  function handleSubmit() {
    var empresa = empresaInput ? empresaInput.value.trim() : '';
    var sede = sedeInput ? sedeInput.value.trim() : '';

    if (!empresa || !sede) {
      setError('Ingresa empresa y sede para continuar.');
      return;
    }

    setError('');
    window.TvApp.saveStorageValue(storage.EMPRESA_KEY, empresa);
    window.TvApp.saveStorageValue(storage.SEDE_KEY, sede);
    var topic = 'empresas/' + empresa + '/' + sede + '/PANTALLA';
    if (window.TvApp.updateTopicDisplay) {
      window.TvApp.updateTopicDisplay(topic);
    }
    window.TvApp.ws.connect(topic);
    window.TvApp.showDisplayView();
  }

  function restore() {
    var savedEmpresa = window.TvApp.loadStorageValue(storage.EMPRESA_KEY);
    var savedSede = window.TvApp.loadStorageValue(storage.SEDE_KEY);
    if (empresaInput && savedEmpresa) {
      empresaInput.value = savedEmpresa;
    }
    if (sedeInput && savedSede) {
      sedeInput.value = savedSede;
    }
    updatePreview();
  }

  window.TvApp.connectStored = function () {
    var savedEmpresa = window.TvApp.loadStorageValue(storage.EMPRESA_KEY);
    var savedSede = window.TvApp.loadStorageValue(storage.SEDE_KEY);
    if (!savedEmpresa || !savedSede) {
      return false;
    }
    var topic = 'empresas/' + savedEmpresa + '/' + savedSede + '/PANTALLA';
    if (window.TvApp.updateTopicDisplay) {
      window.TvApp.updateTopicDisplay(topic);
    }
    window.TvApp.ws.connect(topic);
    window.TvApp.showDisplayView();
    return true;
  };

  window.TvApp.initSetupView = function () {
    empresaInput = window.TvApp.$('empresaInput');
    sedeInput = window.TvApp.$('sedeInput');
    topicText = window.TvApp.$('topicText');
    errorText = window.TvApp.$('errorText');
    connectBtn = window.TvApp.$('connectBtn');

    if (empresaInput) {
      empresaInput.addEventListener('input', updatePreview);
    }
    if (sedeInput) {
      sedeInput.addEventListener('input', updatePreview);
    }
    if (connectBtn) {
      connectBtn.addEventListener('click', handleSubmit);
    }

    restore();
  };
})();
