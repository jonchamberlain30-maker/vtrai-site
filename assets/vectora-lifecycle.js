(() => {
  'use strict';
  const key = 'vectora_lifecycle_v1', ttl = 30 * 86400000;
  const endpoint = 'https://api.getvectora.ai/lifecycle-events';
  const types = new Set(['check_started','check_completed','report_rendered','save_clicked','save_completed','save_failed','saved_token_viewed','comparison_available','comparison_viewed','return_check_completed','check_failed']);
  const uuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');
  const hash = value => /^[0-9a-f]{64}$/.test(value || '') ? value : '';
  let state, running = false, deleting = false;
  try {
    state = JSON.parse(localStorage.getItem(key) || 'null');
    if (!state || !uuid(state.id) || Date.now()-state.created >= ttl || state.created > Date.now()) {
      state = {id:crypto.randomUUID(), created:Date.now(), items:{}, pending:[]};
    }
    state.pending = (state.pending || []).filter(e=>Date.now()-Date.parse(e.occurred_at)<ttl).slice(-200);
    localStorage.setItem(key, JSON.stringify(state));
  } catch { state = null; }
  function persist() { try { localStorage.setItem(key,JSON.stringify(state)); return true; } catch { return false; } }
  async function flush() {
    if (!state || running || !['getvectora.ai','www.getvectora.ai'].includes(location.hostname)) return;
    running = true;
    try {
      while (state?.pending.length) {
        const event=state.pending[0];
        const response = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(event),keepalive:true,signal:AbortSignal.timeout(10000)});
        const receipt = await response.json();
        if (!response.ok || !receipt.ok) break;
        state.pending = state.pending.filter(e=>e.event_id!==event.event_id);
        persist();
        if (event.internal_qa) console.info('Vectora ledger receipt',JSON.stringify({event_type:event.event_type,event_id:event.event_id,receipt}));
      }
    } catch { /* Persist the same event IDs for a later retry; never claim receipt. */ }
    finally { running = false; }
  }
  function record(name, values) {
    if (!state || deleting || !types.has(name)) return;
    const itemKey = values.network && values.mint ? `${values.network}:${values.mint}` : '';
    // Token addresses stay in browser storage, not in the event ledger.
    if (itemKey && !state.items[itemKey]) state.items[itemKey] = crypto.randomUUID();
    const event = {
      event_id:crypto.randomUUID(),lifecycle_id:state.id,journey_id:values.journey_id,
      attempt_id:uuid(values.attempt_id)?values.attempt_id:'',saved_item_id:itemKey?state.items[itemKey]:'',
      report_id:hash(values.report_id),previous_report_id:hash(values.previous_report_id),
      event_type:name,occurred_at:new Date().toISOString(),internal_qa:values.traffic_class==='internal_qa',
      traffic_class:values.traffic_class,comparison_state:values.comparison_state || 'not_applicable',
      completeness_state:values.completeness_state || 'unknown',
    };
    if (!uuid(event.journey_id)) return;
    if (state.pending.length >= 200) return;
    state.pending.push(event);
    if (persist()) void flush();
  }
  async function erase() {
    if (!state) return true;
    deleting=true;
    while (running) await new Promise(resolve=>setTimeout(resolve,50));
    const response = await fetch(endpoint,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({lifecycle_id:state.id})});
    if (!response.ok) {deleting=false;return false;}
    localStorage.removeItem(key);state=null;return true;
  }
  window.VectoraLifecycle = {record,flush,erase};
  void flush();
})();
