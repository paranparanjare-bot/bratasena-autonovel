/**
 * brat-library.js — Load novel database, render library grid
 */

const Library = (() => {
  let novels = [];

  function getDbUrl() {
    const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
    return base.replace(/\/[^/]*$/, '') + '/novels/novels.json';
  }

  return {
    async loadDatabase() {
      const url = getDbUrl();
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        novels = data.novels || [];
        return novels;
      } catch (e) {
        console.error('Failed to load novel database:', e);
        try {
          const ghUrl = 'https://paranparanjare-bot.github.io/bratasena-autonovel/novels/novels.json';
          const resp = await fetch(ghUrl);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const data = await resp.json();
          novels = data.novels || [];
          return novels;
        } catch (e2) {
          console.error('Fallback also failed:', e2);
          return [];
        }
      }
    },

    /**
     * Render grid of novel cards as a list of Titles (not seasons)
     */
    renderGrid(novels, containerId = 'library-grid') {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = '';

      if (!novels || novels.length === 0) {
        container.innerHTML = `
          <div class="text-center" style="grid-column:1/-1;padding:60px 20px;">
            <p style="color:var(--text-muted);font-family:var(--font-ui);font-size:0.9rem;">
              Belum ada novel di perpustakaan.
            </p>
          </div>
        `;
        return;
      }

      novels.forEach(novel => {
        const card = document.createElement('a');
        card.className = 'novel-card-horizontal';
        card.href = `novel.html?novel=${novel.id}`;

        // Get cover (default to first season cover, or novel cover)
        const coverUrl = (novel.seasons && novel.seasons.length > 0 && novel.seasons[0].cover)
          ? novel.seasons[0].cover
          : (novel.cover || '');

        const coverHtml = coverUrl
          ? `<img src="${coverUrl}" alt="${novel.title}" loading="lazy">`
          : `<span class="no-cover-small">${novel.title.charAt(0)}</span>`;

        const seasonsCount = novel.seasons ? novel.seasons.length : 1;
        const hasMultipleSeasons = novel.seasons && novel.seasons.length > 1;
        const totalChapters = novel.totalChapters || 0;

        card.innerHTML = `
          <div class="novel-card-h-cover">${coverHtml}</div>
          <div class="novel-card-h-info">
            <div class="novel-card-h-title">${novel.title}</div>
            <div class="novel-card-h-desc">${novel.description || ''}</div>
            <div class="novel-card-h-meta">
              <span>${totalChapters} Bab</span>
              <span>${seasonsCount} Season</span>
              ${novel.genre ? `<span>${novel.genre}</span>` : ''}
            </div>
          </div>
        `;

        container.appendChild(card);
      });
    },

    /**
     * Initialize library page
     */
    async init() {
      document.getElementById('library-grid').innerHTML = '<div class="loading">Memuat perpustakaan...</div>';
      const novels = await this.loadDatabase();
      this.renderGrid(novels);

      // Show username if logged in
      if (Auth.isLoggedIn()) {
        const user = Auth.getCurrentUser();
        const usernameEl = document.querySelector('[data-auth="username"]');
        if (usernameEl) usernameEl.textContent = user.username;
      }
      App.updateAuthUI();
    },
  };
})();

document.addEventListener('DOMContentLoaded', () => Library.init());
