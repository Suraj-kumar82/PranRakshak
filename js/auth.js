/**
 * PRANरक्षक — Authentication, Session & Access Control
 * Handles patient registration, login, demo quick-access, and route protection.
 */

const Auth = {
  SESSION_KEY: 'pran_user_session',

  getSession() {
    const raw = sessionStorage.getItem(this.SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  setSession(user) {
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
      id: user.id || 'PRAN-7429',
      fullName: user.fullName || 'Aarav Sharma',
      email: user.email,
      role: user.role || 'patient',
      token: 'demo-jwt-' + Math.random().toString(36).substring(2),
      loginTime: new Date().toISOString()
    }));
  },

  clearSession() {
    sessionStorage.removeItem(this.SESSION_KEY);
  },

  isAuthenticated() {
    return !!this.getSession();
  },

  requireAuth(targetRole = 'patient') {
    const session = this.getSession();
    if (!session) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    if (targetRole && session.role !== targetRole && session.role !== 'admin') {
      UI.showToast('Access restricted to ' + targetRole + ' accounts', 'warning');
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  },

  logout() {
    this.clearSession();
    UI.showToast('Logged out successfully.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 400);
  },

  // One-click demo login helper
  loginAsDemoPatient() {
    const patient = DataManager.getPatient();
    this.setSession({
      id: patient.id,
      fullName: patient.fullName,
      email: patient.email,
      role: 'patient'
    });
    UI.showToast(`Welcome back, ${patient.fullName}!`, 'success', 'Demo Access Granted');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 600);
  },

  loginAsDemoProvider() {
    this.setSession({
      id: 'HOSP-01',
      fullName: 'City General Trauma Center Triage',
      email: 'dispatcher@citytrauma.org',
      role: 'provider'
    });
    UI.showToast('Logged in as Hospital Emergency Dispatcher', 'success', 'Provider Access');
    setTimeout(() => {
      window.location.href = 'provider-dashboard.html';
    }, 600);
  },

  // Password visibility toggle handler
  initPasswordToggles() {
    document.querySelectorAll('[data-toggle-password]').forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-toggle-password');
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        button.innerHTML = isPassword ? Icons.eyeOff : Icons.eye;
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.initPasswordToggles();

  // Update dynamic user info in navbar if present
  const session = Auth.getSession();
  const userNameEl = document.getElementById('nav-user-name');
  if (userNameEl) {
    if (session) {
      userNameEl.textContent = session.fullName;
      const logoutBtn = document.getElementById('nav-logout-btn');
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    } else {
      userNameEl.textContent = 'Guest';
    }
  }
});
