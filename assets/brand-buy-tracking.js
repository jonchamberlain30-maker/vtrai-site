(function () {
  function pageName() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    return path.replace(/\.html$/, '').replace(/-/g, '_') || 'index';
  }

  function labelFor(link) {
    if (link.dataset.brandBuyLabel) return link.dataset.brandBuyLabel;
    return link.classList.contains('token-mark-buy-link') ? 'token_mark' : 'site_brand';
  }

  function trackBrandBuy(link) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'buy_path_brand_click', {
      page_name: pageName(),
      link_label: labelFor(link),
      link_url: link.href,
      page_location: window.location.href,
      transport_type: 'beacon'
    });
  }

  function init() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('.brand-buy-link, .token-mark-buy-link');
      if (!link) return;
      trackBrandBuy(link);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
