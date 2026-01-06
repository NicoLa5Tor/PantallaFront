window.TvApp = window.TvApp || {};

(function () {
  var DEFAULT_WS_URL = 'wss://backtv.rescue.com.co/ws';
  var socket = null;
  var status = 'idle';
  var onMessage = function () {};
  var onStatus = function () {};

  function setStatus(next) {
    status = next;
    onStatus(status);
  }

  function parseQuery() {
    var params = {};
    var query = window.location.search || '';
    query.replace(/^\?/, '').split('&').forEach(function (pair) {
      if (!pair) {
        return;
      }
      var parts = pair.split('=');
      var key = decodeURIComponent(parts[0] || '');
      var value = decodeURIComponent(parts[1] || '');
      params[key] = value;
    });
    return params;
  }

  window.TvApp.ws = {
    connect: function (topic) {
      var params = parseQuery();
      var wsUrl = params.ws || DEFAULT_WS_URL;
      if (socket) {
        socket.close();
        socket = null;
      }

      setStatus('connecting');
      socket = new WebSocket(wsUrl);
      socket.onopen = function () {
        setStatus('open');
        try {
          socket.send(JSON.stringify({ action: 'subscribe', topic: topic }));
        } catch (err) {
          setStatus('error');
        }
      };
      socket.onerror = function () {
        setStatus('error');
      };
      socket.onclose = function () {
        setStatus('closed');
      };
      socket.onmessage = function (event) {
        onMessage(event.data);
      };
    },
    disconnect: function () {
      if (socket) {
        socket.close();
        socket = null;
      }
      setStatus('closed');
    },
    onMessage: function (handler) {
      onMessage = handler;
    },
    onStatus: function (handler) {
      onStatus = handler;
      handler(status);
    }
  };
})();
