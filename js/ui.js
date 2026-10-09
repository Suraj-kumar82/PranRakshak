/**
 * PRANरक्षक — Shared UI Component Interactions
 * Toasts, Modals, Audio alerts, Mobile drawer, and helpers
 */

const UI = {
  // Toast notifications
  showToast(message, type = 'info', title = '', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<span style="color:var(--color-sage-dark);">${Icons.check}</span>`;
      if (!title) title = 'Success';
    } else if (type === 'error') {
      iconSvg = `<span style="color:var(--color-emergency-red);">${Icons.shieldAlert}</span>`;
      if (!title) title = 'Alert';
    } else if (type === 'warning') {
      iconSvg = `<span style="color:#d97706;">${Icons.alertTriangle}</span>`;
      if (!title) title = 'Notice';
    } else {
      iconSvg = `<span style="color:var(--color-teal);">${Icons.info}</span>`;
      if (!title) title = 'PRANरक्षक Update';
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  },

  // Modal helpers
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('is-active');
      document.body.style.overflow = '';
    }
  },

  initModalClosers() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.modal-backdrop') || e.target.closest('[data-modal-close]')) {
        const modal = e.target.closest('.modal-backdrop');
        if (modal) {
          modal.classList.remove('is-active');
          document.body.style.overflow = '';
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-backdrop.is-active');
        if (activeModal) {
          activeModal.classList.remove('is-active');
          document.body.style.overflow = '';
        }
      }
    });
  },

  // Clipboard copy
  async copyToClipboard(text, successMsg = 'Copied to clipboard!') {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement('textarea');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      this.showToast(successMsg, 'success');
      return true;
    } catch (err) {
      this.showToast('Could not copy link automatically.', 'error');
      return false;
    }
  },

  // Web Audio subtle chime for emergency alert simulation
  playEmergencyBeep() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  },

  formatDateTime(isoStr) {
    if (!isoStr) return '--';
    const d = new Date(isoStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  timeAgo(isoStr) {
    if (!isoStr) return '';
    const now = new Date();
    const then = new Date(isoStr);
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHrs = Math.floor(diffMin / 60);
    return `${diffHrs} hours ago`;
  },

  initMobileMenu() {
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggleBtn && navLinks) {
      toggleBtn.addEventListener('click', () => {
        const isOpen = navLinks.style.display === 'flex';
        navLinks.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) {
          navLinks.style.flexDirection = 'column';
          navLinks.style.position = 'absolute';
          navLinks.style.top = '72px';
          navLinks.style.left = '0';
          navLinks.style.right = '0';
          navLinks.style.background = '#ffffff';
          navLinks.style.padding = '1.5rem';
          navLinks.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
          navLinks.style.zIndex = '999';
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  UI.initModalClosers();
  UI.initMobileMenu();
});
