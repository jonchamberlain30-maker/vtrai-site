(function () {
  var ATTRIBUTION_KEY = "vectora_coinzilla_attribution_v1";
  var params = new URLSearchParams(window.location.search);
  var source = (params.get("utm_source") || params.get("source") || "").toLowerCase();
  var isCoinzillaVisit = source === "coinzilla";
  var attribution = {
    source: source || "",
    medium: params.get("utm_medium") || "",
    campaign: params.get("utm_campaign") || "",
    term: params.get("utm_term") || params.get("zone") || "",
    content: params.get("utm_content") || "",
    landing_path: window.location.pathname,
    captured_at: new Date().toISOString()
  };

  try {
    if (isCoinzillaVisit && window.sessionStorage) {
      window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    } else if (window.sessionStorage) {
      var stored = window.sessionStorage.getItem(ATTRIBUTION_KEY);
      if (stored) {
        attribution = JSON.parse(stored);
        isCoinzillaVisit = attribution && attribution.source === "coinzilla";
      }
    }
  } catch (err) {}

  window.vectoraCoinzillaAttribution = isCoinzillaVisit ? attribution : null;
  if (!isCoinzillaVisit) return;

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
  push({
    event: "landing",
    campaign: attribution.campaign || undefined,
    zone: attribution.term || undefined,
    content: attribution.content || undefined
  });

  window.vectoraCoinzillaTrackConversion = function (eventName) {
    var event = eventName || "register";
    var key = "vectora_coinzilla_" + event + "_" + window.location.pathname;
    try {
      if (window.sessionStorage && window.sessionStorage.getItem(key)) return;
      if (window.sessionStorage) window.sessionStorage.setItem(key, "1");
    } catch (err) {}
    push({
      event: event,
      campaign: attribution.campaign || undefined,
      zone: attribution.term || undefined,
      content: attribution.content || undefined
    });
  };
})();
