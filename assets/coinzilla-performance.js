(function () {
  var params = new URLSearchParams(window.location.search);
  var source = (params.get("utm_source") || params.get("source") || "").toLowerCase();
  if (source !== "coinzilla") return;

  function loadPerformanceScript() {
    if (document.querySelector('script[src="https://coinzillatag.com/lib/performance.js"]')) return;
    var script = document.createElement("script");
    script.src = "https://coinzillatag.com/lib/performance.js";
    script.async = true;
    document.head.appendChild(script);
  }

  function push(payload) {
    window.coinzilla_performance = window.coinzilla_performance || [];
    window.coinzilla_performance.push(payload || {});
  }

  loadPerformanceScript();
  push({});

  window.vectoraCoinzillaTrackConversion = function (eventName) {
    var event = eventName || "register";
    var key = "vectora_coinzilla_" + event + "_" + window.location.pathname;
    try {
      if (window.sessionStorage && window.sessionStorage.getItem(key)) return;
      if (window.sessionStorage) window.sessionStorage.setItem(key, "1");
    } catch (err) {}
    push({ event: event });
  };
})();
