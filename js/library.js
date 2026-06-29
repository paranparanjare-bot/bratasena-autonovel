/**
 * brat-library.js — Load novel database, render library grid
 */

const Library = (() => {
  let novels = [];
  let dbUrl = '';

  function getDbUrl() {
    // Automatically determine the base URL
    const scripts = document.getElementsByTagName('script');
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
        // If fetching from relative path fails, try absolute from gh pages
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
     * Render grid of novel cards
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
        card.className = 'novel-card';
        card.href = `reader.html?novel=${novel.id}`;

        const coverUrl = novel.cover || '';
        const coverHtml = coverUrl
          ? `<img src="${coverUrl}" alt="${novel.title}" loading="lazy">`
          : `<span class="no-cover">${novel.title.charAt(0)}</span>`;

        const seasons = novel.seasons ? novel.seasons.length : 0;
        const totalChapters = novel.totalChapters || 0;

        card.innerHTML = `
          <div class="novel-card-cover">${coverHtml}</div>
          <div class="novel-card-info">
            <div class="novel-card-title">${novel.title}</div>
            ${novel.author ? `<div class="novel-card-author">${novel.author}</div>` : ''}
            <div class="novel-card-meta">
              <span>${seasons} Season</span>
              <span>${totalChapters} Bab</span>
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

      // If logged in, show reading progress
      if (Auth.isLoggedIn()) {
        const user = Auth.getCurrentUser();
        document.querySelector('[data-auth="username"]').textContent = user.username;
      }
      App.updateAuthUI();
    },
  };
})();

document.addEventListener('DOMContentLoaded', () => Library.init());
