async function loadEvents() {
  clearMsg('msg');
  const params = new URLSearchParams();
  ['search', 'category', 'venue'].forEach(k => {
    const v = document.getElementById(k).value.trim();
    if (v) params.set(k, v);
  });
  const qs = params.toString() ? '?' + params : '';
  const list = document.getElementById('list');
  try {
    const events = pickList(await api('/events' + qs), 'events');
    if (!events.length) { list.innerHTML = '<p class="empty">No events found. Try a different filter.</p>'; return; }
    const u = Auth.user();
    list.innerHTML = events.map(ev => `
      <div class="card event">
        <span class="tag">${esc(ev.category || 'General')}</span>
        <h3>${esc(ev.title)}</h3>
        <div class="meta">${esc(fmtDate(ev.event_date))}<br>${esc(ev.venue || 'Venue to be announced')}</div>
        <p>${esc((ev.description || '').slice(0, 110))}</p>
        <div class="price">${Number(ev.ticket_price) ? money(ev.ticket_price) : 'Free'}</div>
        ${u && u.role === 'student'
          ? `<a class="btn small" style="margin-top:12px" href="book.html?id=${encodeURIComponent(ev.id)}">Book tickets</a>`
          : !u ? '<p class="meta" style="margin-top:12px"><a href="login.html">Log in</a> to book</p>' : ''}
      </div>`).join('');
  } catch (err) { showMsg('msg', err.message); }
}
document.getElementById('filters').addEventListener('submit', e => { e.preventDefault(); loadEvents(); });
loadEvents();