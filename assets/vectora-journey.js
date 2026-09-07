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
  const trafficClass = /^(internal_qa|test|qa)$/.test(source) || !production ? 'internal_qa' : source === 'coinzilla' || /^(cpc|ppc|paid)/.test(params.get('utm_medium') || '') ? 'paid' : /google|bing|duckduckgo/.test(document.referrer || '') ? 'organic_search' : document.referrer && !document.referrer.startsWith(location.origin + '/') ? 'referral' : 'direct';
  let attempt = null;
  function savedAction(name, values) {
    const key = `vectora_retention:${values.network}:${values.mint}`;
    try {
      if (name === 'save_completed') localStorage.setItem(key, JSON.stringify({at:Date.now(), session:journeyId}));
      else {
        const saved = JSON.parse(localStorage.getItem(key) || 'null');
        if (saved && saved.session !== journeyId && Date.now() >= saved.at && Date.now() - saved.at <= 14 * 86400000) {
          emit('return_check_completed', {...values, days_since_save:Math.floor((Date.now()-saved.at)/86400000)});
        }
      }
    } catch { /* Unavailable storage cannot establish cross-session retention. */ }
  }
  function emit(name, values = {}) {
    if (production && typeof window.gtag === 'function') window.gtag('event', name, {
      journey_id: journeyId, attempt_id: attempt?.id || '', attempt_kind: attempt?.kind || '',
      acquisition_source: source, measurement_version: '2026-09-07.2', ...values, traffic_class: trafficClass,
    });
  }
  function begin(kind) {
    attempt = { id: id(), kind, completed: false };
    emit('journey_attempt_started');
    emit('check_started');
  }
  function track(name, values = {}) {
    if (name === 'token_check_submitted') begin('new_check');
    if (name === 'report_lookup_submitted') begin(values.lookup_kind || 'report_lookup');
    if (name === 'watchlist_token_refresh_started') begin('recheck');
    const completion = ['token_report_rendered', 'watchlist_token_refreshed'].includes(name);
    if (completion && attempt?.completed) return;
    emit(name, values);
    if (name === 'token_report_rendered') emit('report_rendered', values);
    if (completion && attempt && values.mode !== 'ambiguous') {
      attempt.completed = true;
      emit('journey_attempt_completed', values);
      emit(attempt.kind === 'shared_receipt' ? 'journey_receipt_viewed' : attempt.kind === 'recheck' ? 'journey_recheck_completed' : 'journey_check_completed', values);
      if (values.assessment_version && values.mint && attempt.kind !== 'shared_receipt') {
        emit('check_valid_mint', values);
        emit('check_completed', values);
        if (attempt.kind === 'recheck') savedAction('recheck', values);
      }
    }
    if (['token_check_failed', 'report_lookup_failed', 'watchlist_token_refresh_failed'].includes(name)) { emit('journey_attempt_failed', values); emit('check_failed', values); }
    if (name === 'watchlist_add') emit('journey_token_saved', values);
    if (name === 'save_completed' && values.mint) savedAction(name, values);
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
  function comparisonIssue(previous, current) {
    if (!previous?.address) return 'First saved check. Check again later to compare evidence.';
    if (previous.address !== current?.address || previous.network_id !== current.network_id) return 'These reports cover different tokens or networks.';
    if (!previous.assessment_version || previous.assessment_version !== current.assessment_version) return 'Assessment method changed or is missing. A new comparable baseline is needed.';
    const before = Date.parse(previous.checked_at_utc), after = Date.parse(current.checked_at_utc);
    if (!Number.isFinite(before) || !Number.isFinite(after) || after <= before) return 'No newer observation available yet. This is not evidence of no change.';
    if (after > Date.now() || Date.now() - after > 24 * 60 * 60 * 1000) return 'Observation is stale or has an invalid timestamp. Changes cannot be confirmed.';
    if (!previous.level || !current.level || previous.level === 'unknown' || current.level === 'unknown') return 'Evidence is incomplete. A reliable no-change conclusion is unavailable.';
    if ([previous,current].some(report => (report.reasons || []).some(reason => /evidence gaps/i.test(reason.label)))) return 'Evidence gaps remain. A reliable no-change conclusion is unavailable.';
    return '';
  }
  const seen = new Set();
  function observeSaved() {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const el = entry.target, key = el.dataset.savedItem + ':' + el.dataset.observation;
        if (!seen.has(key)) {
          seen.add(key);
          const values = {mint:el.dataset.savedItem, report_id:el.dataset.observation, comparison_state:el.dataset.comparison};
          emit('saved_token_viewed', values);
          if (el.dataset.comparison === 'available') { emit('comparison_available', values); emit('comparison_viewed', values); }
        }
        observer.unobserve(el);
      }
    }, {threshold:0.25});
    document.querySelectorAll('[data-saved-item]').forEach(el => observer.observe(el));
  }
  window.VectoraJourney = { track, begin, source, html, safeUrl, displayReport, comparisonIssue, observeSaved };
})();
