const API = '/api';

const Auth = {
  token: () => localStorage.getItem('token'),
  user: () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } },
  save(token, user) { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); },
  clear() { localStorage.removeItem('token'); localStorage.removeItem('user'); },
  require(roles) {
    const u = Auth.user();
    if (!Auth.token() || !u) { location.href = 'login.html'; return null; }
    if (roles && !roles.includes(u.role)) { location.href = 'events.html'; return null; }
    return u;
  }
};

async function api(path, method = 'GET', body) {
  const headers = { 'Content-Type': 'application/json' };
  if (Auth.token()) headers.Authorization = 'Bearer ' + Auth.token();
  const res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = {};
  try { data = await res.json(); } catch { }
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed (' + res.status + ')');
  return data;
}

function pickList(data, key) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}
function pickOne(data, key) { return (data && (data[key] || data.data)) || data; }

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function money(n) { return 'KES ' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) { const x = new Date(d); return isNaN(x) ? '' : x.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }

function showMsg(id, text, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function clearMsg(id) { const el = document.getElementById(id); if (el) el.className = 'msg'; }

function renderNav() {
  const el = document.getElementById('nav');
  if (!el) return;
  const u = Auth.user();
  const page = location.pathname.split('/').pop();
  const link = (href, text) => `<a href="${href}" class="${page === href ? 'active' : ''}">${text}</a>`;
  let html = '<a class="logo" href="events.html">Campus Events</a>' + link('events.html', 'Events');
  if (u) {
    if (u.role === 'student') html += link('my-bookings.html', 'My bookings') + link('tickets.html', 'My tickets');
    if (u.role === 'organizer' || u.role === 'admin') html += link('create-event.html', 'Create event');
    if (u.role === 'admin') html += link('admin.html', 'Admin');
    html += `<span style="color:#9aa5bd">${esc(u.name || u.email)} (${esc(u.role)})</span><button id="logout">Log out</button>`;
  } else {
    html += link('login.html', 'Log in') + link('register.html', 'Register');
  }
  el.className = 'nav';
  el.innerHTML = html;
  const lo = document.getElementById('logout');
  if (lo) lo.onclick = () => { Auth.clear(); location.href = 'login.html'; };
}
document.addEventListener('DOMContentLoaded', renderNav);