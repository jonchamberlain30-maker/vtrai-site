(() => {
  'use strict';
  const production = ['getvectora.ai', 'www.getvectora.ai'].includes(location.hostname);
  const params = new URLSearchParams(location.search);
  const id = () => crypto.randomUUID();
  const read = key => { try { return sessionStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { sessionStorage.setItem(key, value); } catch {} };
  const journeyId = read('vectora_journey_id') || id();
  write('vectora_journey_id', journeyId);
  const source = (params.get('utm_source') || params.get('source') || read('vectora_journey_source') || 'direct').slice(0, 80);
  write('vectora_journey_source', source);
  let attempt = null;
  function emit(name, values = {}) {
    if (production && typeof window.gtag === 'function') window.gtag('event', name, {
      journey_id: journeyId, attempt_id: attempt?.id || '', attempt_kind: attempt?.kind || '',
      acquisition_source: source, measurement_version: '2026-09-05.1', ...values,
    });
  }
  function begin(kind) {
    attempt = { id: id(), kind, completed: false };
    emit('journey_attempt_started');
  }
  function track(name, values = {}) {
    if (name === 'token_check_submitted') begin('new_check');
    if (name === 'report_lookup_submitted') begin(values.lookup_kind || 'report_lookup');
    if (name === 'watchlist_token_refresh_started') begin('recheck');
    const completion = ['token_report_rendered', 'watchlist_token_refreshed'].includes(name);
    if (completion && attempt?.completed) return;
    emit(name, values);
    if (completion && attempt && values.mode !== 'ambiguous') {
      attempt.completed = true;
      emit('journey_attempt_completed', values);
      emit(attempt.kind === 'shared_receipt' ? 'journey_receipt_viewed' : attempt.kind === 'recheck' ? 'journey_recheck_completed' : 'journey_check_completed', values);
    }
    if (['token_check_failed', 'report_lookup_failed', 'watchlist_token_refresh_failed'].includes(name)) emit('journey_attempt_failed', values);
    if (name === 'watchlist_add') emit('journey_token_saved', values);
    if (['report_link_copied', 'token_report_shared'].includes(name)) emit('journey_receipt_shared', values);
  }
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function safeUrl(value) {
    try { const url = new URL(value); return url.protocol === 'https:' ? html(url.href) : ''; } catch { return ''; }
  }
  function displayReport(report) {
    return {...report, title:html(report.title), summary:html(report.summary), image_url:safeUrl(report.image_url),
      meta:(report.meta || []).map(item=>({label:html(item.label),value:html(item.value)})),
      reasons:(report.reasons || []).map(item=>({label:html(item.label),text:html(item.text)})),
      notes:(report.notes || []).map(html),
      links:(report.links || []).map(item=>({label:html(item.label),url:safeUrl(item.url)})).filter(item=>item.url)};
  }
  window.VectoraJourney = { track, begin, source, html, safeUrl, displayReport };
})();
