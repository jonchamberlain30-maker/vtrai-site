(() => {
  const $ = id => document.getElementById(id);
  const key = 'vectora_pilot_submission_v1';
  let record;
  try { record = JSON.parse(localStorage.getItem(key) || 'null'); } catch {}
  if (!record || !/^[a-f0-9-]{36}$/.test(record.id || '')) record = {id: crypto.randomUUID(), sent: false};
  const remember = () => { try { localStorage.setItem(key, JSON.stringify(record)); } catch {} };
  remember();
  const sourceParam = new URLSearchParams(location.search).get('utm_source');
  const source = ['x', 'telegram', 'partner', 'site'].includes(sourceParam) ? sourceParam : 'direct';
  $('start').href = './?utm_source=' + (source === 'direct' ? 'pilot' : source) + '&utm_medium=' + (source === 'x' ? 'social' : 'referral') + '&utm_campaign=activation_sep2026&utm_content=usability_task';
  function displaySent() {
    $('feedback').hidden = true;
    $('after').hidden = false;
    $('message').textContent = 'Thank you. Your feedback was received. We will use it to decide what to fix.';
    $('conversation').hidden = !record.followup;
    if (record.followup) refreshThread();
  }
  if (record.sent) displaySent();
  async function send(data) {
    const response = await fetch('https://api.getvectora.ai/pilot-feedback', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data), signal: AbortSignal.timeout(15000)});
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Feedback could not be saved. Please try again.');
    return result;
  }
  $('feedback').addEventListener('submit', async event => {
    event.preventDefault();
    $('submit').disabled = true;
    $('message').textContent = 'Sending feedback...';
    try {
      await send({id: record.id, followup: $('followup').checked, role: $('role').value, outcome: new FormData($('feedback')).get('outcome'), feedback: $('details').value, next_step: $('next').value, consent: $('consent').checked, website: $('website').value, source, device: matchMedia('(max-width: 600px)').matches ? 'mobile' : 'desktop'});
      record.followup = $('followup').checked;
      record.sent = true;
      remember();
      displaySent();
    } catch (error) { $('message').textContent = error.name === 'TimeoutError' ? 'The request timed out. Please retry; the same submission will not be counted twice.' : error.message; }
    finally { $('submit').disabled = false; }
  });
  function renderThread(result) {
    $('messages').replaceChildren();
    for (const message of result.messages || []) {
      const item = document.createElement('p');
      item.textContent = (message.role === 'vectora' ? 'Vectora (AI-assisted): ' : 'You: ') + message.text;
      $('messages').append(item);
    }
    $('question-form').hidden = result.status === 'unavailable';
    $('thread-status').textContent = result.status === 'unavailable' ? 'This conversation has expired or been withdrawn.' : 'Replies are reviewed daily. This is not live chat.';
  }
  async function refreshThread() {
    try { renderThread(await send({action: 'thread', id: record.id})); }
    catch (error) { $('thread-status').textContent = error.message; }
  }
  $('refresh').addEventListener('click', refreshThread);
  $('question-form').addEventListener('submit', async event => {
    event.preventDefault();
    const text = $('question').value;
    if (!record.pending || record.pending.text !== text) record.pending = {message_id: crypto.randomUUID(), text};
    remember();
    $('send-question').disabled = true;
    try {
      renderThread(await send({action: 'message', id: record.id, ...record.pending}));
      delete record.pending; remember(); $('question').value = '';
    } catch (error) { $('thread-status').textContent = error.message; }
    finally { $('send-question').disabled = false; }
  });
  $('withdraw').addEventListener('click', async () => {
    $('withdraw').disabled = true;
    try {
      await send({action: 'withdraw', id: record.id});
      record = {id: crypto.randomUUID(), sent: false};
      remember();
      $('after').hidden = true;
      $('feedback').hidden = false;
      $('feedback').reset();
      $('message').textContent = 'Your feedback has been withdrawn from the research store.';
    } catch (error) { $('message').textContent = error.message; }
    finally { $('withdraw').disabled = false; }
  });
  $('remind').addEventListener('click', () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    const day = date.toISOString().slice(0, 10).replaceAll('-', '');
    const stamp = new Date().toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}Z$/, 'Z');
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Vectora//Pilot//EN', 'BEGIN:VEVENT', `UID:${crypto.randomUUID()}@getvectora.ai`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${day}`, 'SUMMARY:Was Vectora useful enough to revisit?', 'DESCRIPTION:Only return if you have a real token research task.\\nTell us what helped or what was missing.', 'URL:https://getvectora.ai/?utm_source=pilot&utm_medium=calendar&utm_campaign=activation_sep2026', 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
    const url = URL.createObjectURL(new Blob([body], {type: 'text/calendar'}));
    const link = document.createElement('a');
    link.href = url; link.download = 'vectora-seven-day-check-in.ics'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
