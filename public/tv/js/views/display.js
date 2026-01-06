window.TvApp = window.TvApp || {};

(function () {
  var statusText = null;
  var topicDisplay = null;
  var listeningPanel = null;
  var alertPanel = null;
  var alertTypeName = null;
  var alertLevel = null;
  var alertPriority = null;
  var alertDescription = null;
  var alertImage = null;
  var locationAddress = null;
  var locationName = null;
  var locationLink = null;
  var originName = null;
  var originType = null;
  var checklist = null;
  var mapContainer = null;
  var instructions = null;
  var contacts = null;
  var editBtn = null;
  var normalNotice = null;
  var normalDetail = null;
  var normalTimer = null;
  var lastAlertName = '';
  var storage = window.TvApp.storage;

  function parsePayload(payload) {
    if (typeof payload === 'string') {
      try {
        return JSON.parse(payload);
      } catch (err) {
        return null;
      }
    }
    return payload;
  }

  function unwrapPayload(parsed) {
    if (!parsed || typeof parsed !== 'object') {
      return parsed;
    }
    if (parsed.payload && typeof parsed.payload === 'object') {
      return parsed.payload;
    }
    return parsed;
  }

  function unwrapAlert(data) {
    if (data.alert && typeof data.alert === 'object') {
      return data.alert;
    }
    return data;
  }

  function asRecord(value) {
    if (!value || typeof value !== 'object') {
      return null;
    }
    return value;
  }

  function getPathValue(data, path) {
    var parts = path.split('.');
    var current = data;
    var i;
    for (i = 0; i < parts.length; i += 1) {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      current = current[parts[i]];
    }
    return current;
  }

  function pickString(data, paths) {
    var i;
    var value;
    for (i = 0; i < paths.length; i += 1) {
      value = getPathValue(data, paths[i]);
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return '';
  }

  function pickStringArray(data, paths) {
    var i;
    var value;
    for (i = 0; i < paths.length; i += 1) {
      value = getPathValue(data, paths[i]);
      if (Object.prototype.toString.call(value) === '[object Array]') {
        return value.filter(function (item) {
          return typeof item === 'string';
        });
      }
    }
    return [];
  }

  function parseContacts(value) {
    if (Object.prototype.toString.call(value) !== '[object Array]') {
      return [];
    }
    return value.map(function (item) {
      if (typeof item === 'string') {
        return {
          nombre: '',
          rol: '',
          telefono: item
        };
      }
      if (!item || typeof item !== 'object') {
        return null;
      }
      return {
        nombre: pickString(item, ['nombre']),
        rol: pickString(item, ['rol']),
        telefono: pickString(item, ['telefono'])
      };
    }).filter(function (item) { return item !== null; });
  }

  function isNormalPayload(payload) {
    var parsed = unwrapPayload(parsePayload(payload));
    if (!parsed || typeof parsed !== 'object') {
      return false;
    }
    var data = unwrapAlert(parsed);
    var estado = pickString(data, ['estado']);
    if (estado) {
      return estado.toUpperCase() !== 'ACTIVA';
    }
    var activo = getPathValue(data, 'activo');
    if (typeof activo === 'boolean') {
      return !activo;
    }
    var fechaDesactivacion = pickString(data, ['fecha_desactivacion']);
    if (fechaDesactivacion) {
      return true;
    }
    var tipo = pickString(data, ['tipo_alarma', 'tipo_alerta', 'nivel_alerta', 'estado']);
    return tipo.toUpperCase() === 'NORMAL';
  }

  function extractAlert(payload) {
    var parsed = unwrapPayload(parsePayload(payload));
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    var data = unwrapAlert(parsed);
    var nombre = pickString(data, [
      'nombre',
      'nombre_alerta',
      'tipo_alerta',
      'tipo_alarma',
      'data.tipo_alarma_detalle.nombre'
    ]);
    var prioridad = pickString(data, ['prioridad']);
    var nivelAlerta = pickString(data, ['nivel_alerta', 'tipo_alerta', 'data.tipo_alarma_detalle.tipo_alerta']);
    var descripcion = pickString(data, ['descripcion']);
    var imagen = pickString(data, ['imagen', 'image_alert', 'data.image_alert', 'data.tipo_alarma_detalle.imagen_base64']);
    var id = pickString(data, ['id', '_id']);

    var ubicacionRaw = getPathValue(data, 'ubicacion');
    var ubicacionData = asRecord(ubicacionRaw);
    var ubicacionNombre = ubicacionData ? pickString(ubicacionData, ['nombre']) : '';
    var ubicacionDireccion = '';
    if (typeof ubicacionRaw === 'string') {
      ubicacionDireccion = ubicacionRaw;
    } else if (ubicacionData) {
      ubicacionDireccion = pickString(ubicacionData, ['direccion']);
    }
    if (!ubicacionDireccion) {
      ubicacionDireccion = pickString(data, ['ubicacion', 'sede']);
    }
    var ubicacionMaps = '';
    if (ubicacionData) {
      ubicacionMaps = pickString(ubicacionData, ['maps', 'url_maps', 'url']);
    }
    if (!ubicacionMaps) {
      ubicacionMaps = pickString(data, ['url_maps', 'url', 'data.ubicacion.url_maps', 'data.ubicacion.maps']);
    }

    var origenData = asRecord(getPathValue(data, 'origen'));
    var activacionData = asRecord(getPathValue(data, 'activacion_alerta'));
    var origenTipo = origenData
      ? pickString(origenData, ['tipo'])
      : activacionData
        ? pickString(activacionData, ['tipo_activacion'])
        : pickString(data, ['data.creador_tipo', 'data.origen']);
    var origenNombre = origenData
      ? pickString(origenData, ['nombre'])
      : activacionData
        ? pickString(activacionData, ['nombre'])
        : pickString(data, ['empresa_nombre', 'data.creador_id']);

    var contactos = parseContacts(data.contactos || getPathValue(data, 'numeros_telefonicos'));
    var elementos = pickStringArray(data, [
      'elementos_necesarios',
      'data.elementos_necesarios',
      'data.tipo_alarma_detalle.implementos_necesarios'
    ]);
    var instrucciones = pickStringArray(data, [
      'instrucciones',
      'data.instrucciones',
      'data.tipo_alarma_detalle.recomendaciones'
    ]);

    if (nombre && prioridad && (ubicacionDireccion || ubicacionNombre)) {
      return {
        id: id,
        nombre: nombre,
        prioridad: prioridad,
        nivel_alerta: nivelAlerta,
        descripcion: descripcion,
        imagen: imagen,
        ubicacion: {
          nombre: ubicacionNombre,
          direccion: ubicacionDireccion,
          maps: ubicacionMaps
        },
        origen: {
          tipo: origenTipo,
          nombre: origenNombre
        },
        contactos: contactos,
        instrucciones: instrucciones,
        elementos_necesarios: elementos
      };
    }
    return null;
  }

  function toEmbedUrl(url) {
    var trimmed = String(url || '').trim();
    if (!trimmed) {
      return '';
    }
    if (trimmed.indexOf('output=embed') !== -1 || trimmed.indexOf('/maps/embed') !== -1) {
      return trimmed;
    }
    var queryIndex = trimmed.indexOf('?q=');
    if (queryIndex !== -1) {
      return 'https://www.google.com/maps?q=' + trimmed.slice(queryIndex + 3) + '&output=embed';
    }
    var placeMatch = trimmed.match(/\/maps\/place\/([^/?#]+)/i);
    if (placeMatch && placeMatch[1]) {
      return 'https://www.google.com/maps?q=' + placeMatch[1] + '&output=embed';
    }
    return 'https://www.google.com/maps?q=' + encodeURIComponent(trimmed) + '&output=embed';
  }

  function buildMapUrls(alert) {
    if (!alert || !alert.ubicacion || !alert.ubicacion.maps) {
      return { embed: '', link: '' };
    }
    var link = alert.ubicacion.maps;
    return { embed: toEmbedUrl(link), link: link };
  }

  function renderAlert(alert) {
    if (!mapContainer) {
      return;
    }
    if (!alert) {
      window.TvApp.show(listeningPanel);
      window.TvApp.hide(alertPanel);
      window.TvApp.setText(alertTypeName, '--');
      window.TvApp.setText(alertPriority, 'Prioridad --');
      window.TvApp.setText(locationAddress, '--');
      window.TvApp.setText(originName, '--');
      window.TvApp.setText(originType, '');
      window.TvApp.setText(alertDescription, '');
      window.TvApp.setText(alertLevel, '');
      if (alertLevel) {
        alertLevel.className = 'badge hidden';
      }
      if (alertImage) {
        alertImage.className = 'alert-image hidden';
        alertImage.removeAttribute('src');
      }
      if (locationName) {
        locationName.className = 'block-sub hidden';
      }
      if (locationLink) {
        locationLink.className = 'block-link hidden';
      }
      window.TvApp.setHtml(checklist, '<span class="empty">Sin elementos</span>');
      window.TvApp.setHtml(instructions, '<span class="empty">Sin instrucciones</span>');
      window.TvApp.setHtml(contacts, '<span class="empty">Sin contactos</span>');
      mapContainer.className = 'map-shell empty';
      mapContainer.textContent = 'Sin ubicacion.';
      return;
    }

    window.TvApp.hide(listeningPanel);
    window.TvApp.show(alertPanel);

    window.TvApp.setText(alertTypeName, alert.nombre || '--');
    window.TvApp.setText(alertPriority, 'Prioridad ' + (alert.prioridad || '--'));
    if (alert.nivel_alerta) {
      if (alertLevel) {
        alertLevel.className = 'badge';
        alertLevel.textContent = alert.nivel_alerta;
      }
    } else if (alertLevel) {
      alertLevel.className = 'badge hidden';
      alertLevel.textContent = '';
    }

    if (alert.imagen) {
      alertImage.src = alert.imagen;
      alertImage.className = 'alert-image';
    } else if (alertImage) {
      alertImage.className = 'alert-image hidden';
      alertImage.removeAttribute('src');
    }

    if (alert.descripcion) {
      window.TvApp.setText(alertDescription, alert.descripcion);
      alertDescription.className = 'block-note';
    } else if (alertDescription) {
      alertDescription.className = 'block-note hidden';
      alertDescription.textContent = '';
    }

    var locationText = alert.ubicacion && alert.ubicacion.direccion ? alert.ubicacion.direccion : (alert.ubicacion ? alert.ubicacion.nombre : '');
    window.TvApp.setText(locationAddress, locationText || '--');
    if (alert.ubicacion && alert.ubicacion.nombre) {
      locationName.textContent = 'Sede ' + alert.ubicacion.nombre;
      locationName.className = 'block-sub';
    } else if (locationName) {
      locationName.className = 'block-sub hidden';
      locationName.textContent = '';
    }

    if (alert.ubicacion && alert.ubicacion.maps) {
      locationLink.href = alert.ubicacion.maps;
      locationLink.className = 'block-link';
    } else if (locationLink) {
      locationLink.className = 'block-link hidden';
      locationLink.removeAttribute('href');
    }

    window.TvApp.setText(originName, alert.origen && alert.origen.nombre ? alert.origen.nombre : 'Sin origen');
    if (alert.origen && alert.origen.tipo) {
      originType.textContent = alert.origen.tipo;
      originType.className = 'block-sub';
    } else if (originType) {
      originType.className = 'block-sub hidden';
      originType.textContent = '';
    }

    if (alert.elementos_necesarios && alert.elementos_necesarios.length) {
      window.TvApp.setHtml(checklist, alert.elementos_necesarios.map(function (item) {
        return '<span class="chip">' + item + '</span>';
      }).join(''));
    } else {
      window.TvApp.setHtml(checklist, '<span class="empty">Sin elementos</span>');
    }

    if (alert.instrucciones && alert.instrucciones.length) {
      window.TvApp.setHtml(instructions, alert.instrucciones.map(function (step, index) {
        return '<div class="step"><span class="step-index">' + (index + 1) + '</span><div>' + step + '</div></div>';
      }).join(''));
    } else {
      window.TvApp.setHtml(instructions, '<span class="empty">Sin instrucciones</span>');
    }

    if (alert.contactos && alert.contactos.length) {
      window.TvApp.setHtml(contacts, alert.contactos.map(function (person) {
        var name = person.nombre || 'Sin nombre';
        var role = person.rol || '';
        var phone = person.telefono || '';
        return '<div class="contact-card"><div class="contact-name">' + name + '</div>' +
          (role ? '<div class="contact-role">' + role + '</div>' : '') +
          (phone ? '<div class="contact-phone">' + phone + '</div>' : '') +
          '</div>';
      }).join(''));
    } else {
      window.TvApp.setHtml(contacts, '<span class="empty">Sin contactos</span>');
    }

    if (alert.ubicacion && alert.ubicacion.maps) {
      var urls = buildMapUrls(alert);
      mapContainer.className = 'map-shell';
      mapContainer.innerHTML = '<iframe title="mapa" src="' + urls.embed + '"></iframe>';
    } else {
      mapContainer.className = 'map-shell empty';
      mapContainer.textContent = 'Sin ubicacion.';
    }
  }

  function showNormalNotice() {
    if (!normalNotice) {
      return;
    }
    if (normalDetail) {
      var detailText = lastAlertName ? ('Alerta "' + lastAlertName + '" desactivada. Volviendo al canal de alertas en 5 segundos.') : 'Volviendo al canal de alertas en 5 segundos.';
      normalDetail.textContent = detailText;
    }
    window.TvApp.show(normalNotice);
    if (normalTimer) {
      clearTimeout(normalTimer);
    }
    normalTimer = setTimeout(function () {
      window.TvApp.hide(normalNotice);
      normalTimer = null;
    }, 5000);
  }

  window.TvApp.initDisplayView = function () {
    statusText = window.TvApp.$('statusText');
    topicDisplay = window.TvApp.$('topicDisplay');
    listeningPanel = window.TvApp.$('listeningPanel');
    alertPanel = window.TvApp.$('alertPanel');
    alertTypeName = window.TvApp.$('alertTypeName');
    alertLevel = window.TvApp.$('alertLevel');
    alertPriority = window.TvApp.$('alertPriority');
    alertDescription = window.TvApp.$('alertDescription');
    alertImage = window.TvApp.$('alertImage');
    locationAddress = window.TvApp.$('locationAddress');
    locationName = window.TvApp.$('locationName');
    locationLink = window.TvApp.$('locationLink');
    originName = window.TvApp.$('originName');
    originType = window.TvApp.$('originType');
    checklist = window.TvApp.$('checklist');
    mapContainer = window.TvApp.$('mapContainer');
    instructions = window.TvApp.$('instructions');
    contacts = window.TvApp.$('contacts');
    editBtn = window.TvApp.$('editBtn');
    normalNotice = window.TvApp.$('normalNotice');
    normalDetail = window.TvApp.$('normalDetail');

    if (editBtn) {
      editBtn.addEventListener('click', function () {
        window.TvApp.showSetupView();
      });
    }

    window.TvApp.ws.onStatus(function (value) {
      window.TvApp.setText(statusText, value);
    });

    window.TvApp.ws.onMessage(function (payload) {
      var parsed = parsePayload(payload);
      var data = parsed;
      if (parsed && typeof parsed === 'object' && parsed.payload) {
        data = parsed.payload;
      }

      if (isNormalPayload(data)) {
        renderAlert(null);
        showNormalNotice();
        window.TvApp.saveStorageValue(storage.LAST_ALERT_KEY, '');
        return;
      }
      var alert = extractAlert(data);
      if (alert) {
        lastAlertName = alert.nombre || '';
        renderAlert(alert);
        window.TvApp.saveStorageValue(storage.LAST_ALERT_KEY, JSON.stringify(alert));
        if (window.TvApp.showDisplayView) {
          window.TvApp.showDisplayView();
        }
      } else {
        renderAlert(null);
      }
    });

    var savedAlert = window.TvApp.loadStorageValue(storage.LAST_ALERT_KEY);
    if (savedAlert) {
      var parsedAlert = window.TvApp.safeJsonParse(savedAlert);
      if (parsedAlert) {
        lastAlertName = parsedAlert.nombre || '';
        renderAlert(parsedAlert);
      } else {
        renderAlert(null);
      }
    } else {
      renderAlert(null);
    }
  };

  window.TvApp.updateTopicDisplay = function (value) {
    window.TvApp.setText(topicDisplay, value || 'empresas/{empresa}/{sede}/PANTALLA');
  };

  window.TvApp.updateTopicFromStorage = function () {
    var empresa = window.TvApp.loadStorageValue(storage.EMPRESA_KEY);
    var sede = window.TvApp.loadStorageValue(storage.SEDE_KEY);
    if (empresa && sede) {
      window.TvApp.setText(topicDisplay, 'empresas/' + empresa + '/' + sede + '/PANTALLA');
    }
  };

  window.TvApp.forceListening = function () {
    renderAlert(null);
  };
})();
