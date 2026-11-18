async function register(e) {
  e.preventDefault();
  clearMsg('msg');
  try {
    await api('/auth/register', 'POST', {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      role: document.getElementById('role').value
    });
    showMsg('msg', 'Account created. Redirecting to log in...', 'success');
    setTimeout(() => (location.href = 'login.html'), 1000);
  } catch (err) { showMsg('msg', err.message); }
}

async function login(e) {
  e.preventDefault();
  clearMsg('msg');
  try {
    const data = await api('/auth/login', 'POST', {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    });
    Auth.save(data.token, data.user);
    location.href = 'events.html';
  } catch (err) { showMsg('msg', err.message); }
}