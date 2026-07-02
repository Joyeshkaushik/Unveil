const API_BASE = 'http://localhost:5000/api'

async function checkLoggedIn() {
  const { token, userName } = await chrome.storage.local.get(['token', 'userName'])
  if (token) {
    document.getElementById('login-view').style.display = 'none'
    document.getElementById('loggedin-view').style.display = 'block'
    document.getElementById('username').textContent = userName || 'User'
    document.getElementById('avatar').textContent = (userName || 'U').charAt(0).toUpperCase()
  }
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value.trim()
  const msg = document.getElementById('msg')

  if (!email || !password) { msg.className = 'error'; msg.textContent = 'Please fill all fields'; return }

  msg.className = ''; msg.textContent = 'Logging in...'

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')

    await chrome.storage.local.set({ token: data.token, userName: data.user?.name || email })
    msg.className = 'success'; msg.textContent = '✓ Logged in!'
    setTimeout(checkLoggedIn, 500)
  } catch (err) {
    msg.className = 'error'; msg.textContent = err.message
  }
})

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await chrome.storage.local.remove(['token', 'userName'])
  document.getElementById('login-view').style.display = 'block'
  document.getElementById('loggedin-view').style.display = 'none'
})

checkLoggedIn()