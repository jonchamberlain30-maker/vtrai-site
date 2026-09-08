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
  let referrerHost = '';
  try { referrerHost = new URL(document.referrer).hostname; } catch {}
  const explicitSource = params.has('utm_source') || params.has('source') || params.has('utm_medium');
  const trafficClass = /^(internal_qa|test|qa)$/.test(source) || !production ? 'internal_qa'
    : !explicitSource && read('vectora_traffic_class') ? read('vectora_traffic_class')
    : source === 'coinzilla' || /^(cpc|ppc|paid)/.test(params.get('utm_medium') || '') ? 'paid'
    : /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com)$/.test(referrerHost) ? 'organic_search'
    : referrerHost && referrerHost !== location.hostname ? 'referral' : 'direct';
  write('vectora_traffic_class', trafficClass);
  let attempt = null;
  function savedAction(name, values) {
    const key = `vectora_retention:${values.network}:${values.mint}`;
    try {
      if (name === 'save_completed') localStorage.setItem(key, JSON.stringify({at:Date.now(), session:journeyId,report_id:values.report_id || ''}));
      else {
        const saved = JSON.parse(localStorage.getItem(key) || 'null');
        if (saved && saved.session !== journeyId && values.report_id && values.previous_report_id && values.report_id!==values.previous_report_id && values.report_id!==saved.report_id && Date.now() >= saved.at && Date.now() - saved.at <= 14 * 86400000) {
          emit('return_check_completed', {...values, days_since_save:Math.floor((Date.now()-saved.at)/86400000)});
        }
      }
    } catch { /* Unavailable storage cannot establish cross-session retention. */ }
  }
  function emit(name, values = {}) {
    const payload = {
      journey_id: journeyId, attempt_id: attempt?.id || '', attempt_kind: attempt?.kind || '',
      acquisition_source: source, measurement_version: '2026-09-07.3',
      completeness_state:'unknown',comparison_state:'not_applicable',...values, traffic_class: trafficClass,
    };
    window.VectoraLifecycle?.record(name,payload);
    if (production && typeof window.gtag === 'function') {
      window.gtag('event', name, {...payload, ...(trafficClass === 'internal_qa' ? {debug_mode:true} : {})});
      if (trafficClass === 'internal_qa') console.info('Vectora GA queued',JSON.stringify({event:name,...payload}));
    }
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
      const freshRecheck = attempt.kind !== 'recheck' || (values.cached === false && values.previous_report_id && values.report_id !== values.previous_report_id);
      if (freshRecheck && values.assessment_version && values.mint && values.report_id && values.completeness_state === 'usable' && attempt.kind !== 'shared_receipt') {
        emit('check_valid_mint', values);
        emit('check_completed', values);
        if (attempt.kind === 'recheck') savedAction('recheck', values);
      }
    }
    if (['token_check_failed', 'report_lookup_failed', 'watchlist_token_refresh_failed'].includes(name)) { emit('journey_attempt_failed', values); emit('check_failed', values); }
    if (name === 'watchlist_add') emit('journey_token_saved', values);
    if (name === 'watchlist_remove' && values.mint) {
      try { localStorage.removeItem(`vectora_retention:${values.network}:${values.mint}`); } catch {}
    }
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
  function comparisonEligibility(previous, current, now = Date.now()) {
    const blocked = (code, message) => ({eligible:false, code, message});
    if (!previous?.address || !current?.address) return blocked('INSUFFICIENT_EVIDENCE','First saved check. Check again later to compare evidence.');
    if (previous.address !== current.address || previous.network_id !== current.network_id) return blocked('IDENTITY_MISMATCH','These reports cover different tokens or networks.');
    if (previous.comparison_scope !== current.comparison_scope) return blocked('SCOPE_MISMATCH','These observations cover different evidence.');
    if (current.comparison_scope === 'solana_mint_controls') {
      const authority=value=>value===null || (typeof value==='string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value));
      if ([previous,current].some(r=>r.commitment!=='finalized' || !Number.isSafeInteger(r.slot) || r.slot<=0 || !authority(r.mint_authority) || !authority(r.freeze_authority)) || current.slot<=previous.slot) return blocked('INVALID_FINALIZED_CONTROLS','Distinct finalized mint-control evidence is required.');
    }
    if (!previous.assessment_version || previous.assessment_version !== current.assessment_version) return blocked('INCOMPATIBLE_VERSION','Assessment method changed or is missing. A new comparable baseline is needed.');
    const before = Date.parse(previous.checked_at_utc), after = Date.parse(current.checked_at_utc);
    if (!Number.isFinite(before) || !Number.isFinite(after) || after <= before || (previous.receipt_id && previous.receipt_id === current.receipt_id)) return blocked('SAME_OBSERVATION','No newer observation available yet. This is not evidence of no change.');
    if (!previous.receipt_id || !current.receipt_id) return blocked('OBSERVATION_ID_MISSING','Observation identity is missing. Comparison cannot be verified.');
    if (after > now || now - after > 86400000) return blocked('STALE_SOURCE','Observation is stale or has an invalid timestamp. Changes cannot be confirmed.');
    if ([previous,current].some(r=>r.source_status === 'degraded')) return blocked('SOURCE_FAILURE','Source coverage is degraded. Comparison is insufficient.');
    if ([previous,current].some(r=>!r.level || r.level === 'unknown' || (r.reasons || []).some(reason=>/evidence gaps/i.test(reason.label)))) return blocked('INSUFFICIENT_EVIDENCE','Evidence is incomplete. A reliable no-change conclusion is unavailable.');
    const sourceA = Date.parse(previous.source_observed_at), sourceB = Date.parse(current.source_observed_at);
    if (!Number.isFinite(sourceA) || !Number.isFinite(sourceB)) return blocked('FRESHNESS_UNKNOWN_AND_INSUFFICIENT','Provider observation time is unknown. A new fetch alone cannot prove a fresh comparison.');
    if (sourceB <= sourceA || sourceA > before || sourceB > after || before-sourceA > 86400000 || after-sourceB > 86400000) return blocked('STALE_SOURCE','Independent fresh source observations are not established.');
    return {eligible:true,code:'ELIGIBLE',message:''};
  }
  function comparisonIssue(previous, current) { return comparisonEligibility(previous,current).message; }
  function controlComparison(previous,current) {
    const a=previous?.control_observation,b=current?.control_observation;
    if (!a || !b || a.comparison_scope!=='solana_mint_controls' || b.comparison_scope!=='solana_mint_controls' ||
        a.address!==previous.address || b.address!==current.address || a.network_id!==previous.network_id || b.network_id!==current.network_id) return {eligible:false,code:'CONTROLS_UNAVAILABLE',changes:[]};
    const result=comparisonEligibility(a,b);
    return {...result,changes:result.eligible?['mint_authority','freeze_authority'].filter(field=>a[field]!==b[field]):[]};
  }
  function measurementSelfCheck(previous, current, attestation = {}) {
    const reasons=[];
    if (typeof window.gtag !== 'function') reasons.push('GA_NOT_CONFIGURED');
    if (!read('vectora_journey_id')) reasons.push('SESSION_STORAGE_UNAVAILABLE');
    const comparison=comparisonEligibility(previous,current);
    if (!comparison.eligible) reasons.push(comparison.code);
    const required=['events_received','qa_excludable','traffic_segmentation','lifecycle_correlation','browser_restart_persistence','deduplication'];
    for (const name of required) if (attestation[name] !== true) reasons.push(name.toUpperCase()+'_NOT_ATTESTED');
    const verified=Date.parse(attestation.verified_at), baseline=Date.parse(attestation.valid_from);
    if (!Number.isFinite(verified) || verified>Date.now() || Date.now()-verified>86400000) reasons.push('ATTESTATION_MISSING_OR_STALE');
    if (!Number.isFinite(baseline) || baseline>Date.now()) reasons.push('FORWARD_BASELINE_NOT_SET');
    return {health:reasons.length?'INVALID':'HEALTHY',reasons,comparison,valid_from:reasons.length?null:attestation.valid_from};
  }
  let priorSeen = [];
  try { const stored = JSON.parse(read('vectora_seen_observations') || '[]'); if (Array.isArray(stored)) priorSeen = stored; } catch {}
  const seen = new Set(priorSeen);
  function observeSaved() {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const el = entry.target, key = el.dataset.network + ':' + el.dataset.savedItem + ':' + el.dataset.observation + ':' + el.dataset.previousObservation + ':' + el.dataset.comparison;
        if (!seen.has(key)) {
          seen.add(key);
          write('vectora_seen_observations',JSON.stringify([...seen].slice(-200)));
          const values = {network:el.dataset.network,mint:el.dataset.savedItem, report_id:el.dataset.observation, previous_report_id:el.dataset.previousObservation || '',comparison_state:el.dataset.comparison};
          emit('saved_token_viewed', values);
          if (el.dataset.comparison === 'available') { emit('comparison_available', values); emit('comparison_viewed', values); }
        }
        observer.unobserve(el);
      }
    }, {threshold:0.25});
    document.querySelectorAll('[data-saved-item]').forEach(el => observer.observe(el));
  }
  window.VectoraJourney = { track, begin, source, html, safeUrl, displayReport, comparisonIssue, comparisonEligibility, controlComparison, measurementSelfCheck, observeSaved };
})();
