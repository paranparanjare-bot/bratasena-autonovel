/**
 * brat-app.js — Navigation, Theme, Notifications, Utilities
 */
const App = (() => {
  const BOOKMARK_KEY = 'brat_bookmarks';
  const THEME_KEY = 'brat_theme';
  const FONTSIZE_KEY = 'brat_fontsize';
  const READING_KEY = 'brat_reading_positions';

  return {
    // ===== NAVIGATION =====
    goTo(path) {
      window.location.href = path;
    },

    goBack() {
      window.history.back();
    },

    // ===== AUTH UI =====
    updateAuthUI() {
      const user = Auth.getCurrentUser();
      const els = document.querySelectorAll('[data-auth]');

      els.forEach(el => {
        const mode = el.dataset.auth; // 'logged-in', 'logged-out', 'username'
        if (mode === 'logged-in') {
          el.style.display = user ? '' : 'none';
        } else if (mode === 'logged-out') {
          el.style.display = user ? 'none' : '';
        } else if (mode === 'username') {
          el.textContent = user ? user.username : '';
        }
      });
    },

    // ===== MODAL =====
    openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.add('active');
    },

    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('active');
    },

    // ===== NOTIFICATION =====
    notify(message, type = 'info') {
      const container = document.getElementById('notification-container');
      if (!container) return;

      const el = document.createElement('div');
      el.className = `notification ${type}`;
      el.textContent = message;
      container.appendChild(el);

      requestAnimationFrame(() => {
        el.classList.add('show');
      });

      setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 400);
      }, 3000);
    },

    // ===== THEME =====
    getTheme() {
      return localStorage.getItem(THEME_KEY) || 'dark';
    },

    setTheme(theme) {
      document.body.className = `theme-${theme}`;
      localStorage.setItem(THEME_KEY, theme);
      // Update active state on theme buttons
      document.querySelectorAll('[data-theme]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
      });
    },

    // ===== FONT SIZE =====
    getFontSize() {
      return parseInt(localStorage.getItem(FONTSIZE_KEY)) || 16;
    },

    setFontSize(size) {
      size = Math.max(12, Math.min(28, size));
      document.documentElement.style.setProperty('--reader-font-size', size + 'px');
      localStorage.setItem(FONTSIZE_KEY, size.toString());

      document.querySelectorAll('[data-fontsize-label]').forEach(el => {
        el.textContent = size + 'px';
      });
    },

    adjustFontSize(delta) {
      this.setFontSize(this.getFontSize() + delta);
    },

    // ===== BOOKMARKS =====
    getBookmarks() {
      try {
        return JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || {};
      } catch { return {}; }
    },

    toggleBookmark(novelId, chapterNum) {
      const marks = this.getBookmarks();
      const key = `${novelId}:${chapterNum}`;
      if (marks[key]) {
        delete marks[key];
        this.saveBookmarks(marks);
        return false; // removed
      } else {
        marks[key] = Date.now();
        this.saveBookmarks(marks);
        return true; // added
      }
    },

    isBookmarked(novelId, chapterNum) {
      const marks = this.getBookmarks();
      return !!marks[`${novelId}:${chapterNum}`];
    },

    saveBookmarks(marks) {
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(marks));
    },

    // ===== READING POSITION =====
    saveReadingPosition(novelId, chapterNum, scrollPercent = 0) {
      const positions = this.getReadingPositions();
      positions[novelId] = { chapter: chapterNum, scroll: scrollPercent, timestamp: Date.now() };
      localStorage.setItem(READING_KEY, JSON.stringify(positions));
    },

    getReadingPositions() {
      try {
        return JSON.parse(localStorage.getItem(READING_KEY)) || {};
      } catch { return {}; }
    },

    getLastReadChapter(novelId) {
      const positions = this.getReadingPositions();
      return positions[novelId] || null;
    },

    // ===== AUTH MODAL HANDLER =====
    _setupAuthModal() {
      const modal = document.getElementById('auth-modal');
      if (!modal) return;

      const title = document.getElementById('auth-modal-title');
      const subtitle = document.getElementById('auth-modal-subtitle');
      const submitBtn = document.getElementById('auth-submit');
      const switchLink = document.getElementById('auth-switch');
      const usernameInput = document.getElementById('auth-username');
      const passwordInput = document.getElementById('auth-password');
      const usernameError = document.getElementById('auth-username-error');
      const passwordError = document.getElementById('auth-password-error');

      let isSignup = false;

      function resetErrors() {
        if (usernameError) usernameError.classList.remove('show');
        if (passwordError) passwordError.classList.remove('show');
      }

      function showError(input, msg) {
        const err = input === 'username' ? usernameError : passwordError;
        if (err) { err.textContent = msg; err.classList.add('show'); }
      }

      function setMode(signup) {
        isSignup = signup;
        if (title) title.textContent = signup ? 'Daftar Akun Baru' : 'Masuk';
        if (subtitle) subtitle.textContent = signup
          ? 'Buat akun untuk mulai membaca'
          : 'Silakan masuk untuk melanjutkan';
        if (submitBtn) submitBtn.textContent = signup ? 'Daftar' : 'Masuk';
        if (switchLink) switchLink.textContent = signup ? 'Masuk di sini' : 'Daftar di sini';
        resetErrors();
      }

      if (switchLink) {
        switchLink.addEventListener('click', () => {
          setMode(!isSignup);
        });
      }

      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          resetErrors();
          const username = usernameInput ? usernameInput.value.trim() : '';
          const password = passwordInput ? passwordInput.value.trim() : '';

          if (isSignup) {
            const result = Auth.signup(username, password);
            if (result.success) {
              App.closeModal('auth-modal');
              App.updateAuthUI();
              App.notify('Akun berhasil dibuat! Selamat membaca!', 'success');
              // Redirect to library if on index
              if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
                window.location.href = 'library.html';
              } else {
                location.reload();
              }
            } else {
              if (result.error.includes('Nama pengguna') || result.error.includes('minimal 3')) {
                showError('username', result.error);
              } else {
                showError('password', result.error);
              }
              App.notify(result.error, 'error');
            }
          } else {
            const result = Auth.login(username, password);
            if (result.success) {
              App.closeModal('auth-modal');
              App.updateAuthUI();
              App.notify('Selamat datang kembali!', 'success');
              location.reload();
            } else {
              if (result.error.includes('tidak ditemukan')) {
                showError('username', result.error);
              } else {
                showError('password', result.error);
              }
              App.notify(result.error, 'error');
            }
          }
        });
      }

      // Enter key to submit
      if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') submitBtn.click();
        });
      }
      if (usernameInput) {
        usernameInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') passwordInput.focus();
        });
      }
    },

    // ===== INIT =====
    init() {
      this._setupAuthModal();
      // Apply saved theme
      const theme = this.getTheme();
      this.setTheme(theme);

      // Apply saved font size
      const fontSize = this.getFontSize();
      this.setFontSize(fontSize);

      // Update auth UI
      this.updateAuthUI();

      // Hide loading states
      document.querySelectorAll('.loading').forEach(el => {
        el.style.display = 'none';
      });

      // Close modals on overlay click
      document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) overlay.classList.remove('active');
        });
      });

      // Close modals on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        }
      });

      console.log('✓ Bratasena App initialized');
    },
  };
})();

// Bootstrap
document.addEventListener('DOMContentLoaded', () => App.init());

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('✓ Service Worker registered successfully', reg.scope))
      .catch(err => console.warn('✗ Service Worker registration failed', err));
  });
}
