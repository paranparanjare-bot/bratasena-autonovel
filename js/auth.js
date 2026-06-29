/**
 * brat-auth.js — Authentication via localStorage
 * "Akun hanya berlaku di HP ini. Ganti HP = daftar ulang."
 * 
 * Sistem sign-up/sign-in sederhana tanpa backend.
 * Data tersimpan di localStorage browser perangkat.
 */

const Auth = (() => {
  const STORAGE_KEY = 'brat_auth_users';
  const SESSION_KEY = 'brat_current_user';

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  function getDeviceId() {
    let id = localStorage.getItem('brat_device_id');
    if (!id) {
      id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('brat_device_id', id);
    }
    return id;
  }

  return {
    /**
     * Daftar akun baru
     * @returns {{ success: boolean, error?: string }}
     */
    signup(username, password) {
      const users = getUsers();
      const key = username.toLowerCase().trim();

      if (!key || key.length < 3) return { success: false, error: 'Nama pengguna minimal 3 karakter.' };
      if (!password || password.length < 4) return { success: false, error: 'Kata sandi minimal 4 karakter.' };
      if (users[key]) return { success: false, error: 'Nama pengguna sudah terdaftar di perangkat ini.' };

      users[key] = {
        username: username.trim(),
        password,
        deviceId: getDeviceId(),
        createdAt: new Date().toISOString(),
      };
      saveUsers(users);

      // Auto login
      localStorage.setItem(SESSION_KEY, JSON.stringify(users[key]));
      return { success: true };
    },

    /**
     * Masuk dengan akun yang sudah didaftarkan
     */
    login(username, password) {
      const users = getUsers();
      const key = username.toLowerCase().trim();
      const user = users[key];

      if (!user) return { success: false, error: 'Akun tidak ditemukan di perangkat ini.' };
      if (user.password !== password) return { success: false, error: 'Kata sandi salah.' };

      // Verify device binding
      if (user.deviceId !== getDeviceId()) {
        return { success: false, error: 'Akun ini terdaftar di perangkat lain. Silakan daftar ulang di HP ini.' };
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { success: true };
    },

    /**
     * Cek status login saat ini
     */
    getCurrentUser() {
      try {
        const data = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (!data) return null;

        // Verify device binding on every check
        const users = getUsers();
        const key = data.username.toLowerCase().trim();
        const stored = users[key];

        if (!stored || stored.deviceId !== getDeviceId()) {
          this.logout();
          return null;
        }

        return stored;
      } catch { return null; }
    },

    isLoggedIn() {
      return this.getCurrentUser() !== null;
    },

    logout() {
      localStorage.removeItem(SESSION_KEY);
    },

    getDeviceId,
  };
})();
