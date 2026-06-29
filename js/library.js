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
        // Fallback to absolute gh-pages path
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
     * Render grid of novel cards by mapping seasons to individual cards
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
        // If the novel has multiple seasons, render each season as its own card!
        if (novel.seasons && novel.seasons.length > 0) {
          novel.seasons.forEach(season => {
            const card = document.createElement('a');
            card.className = 'novel-card';

            // First chapter of this season
            const firstChapNum = (season.chapters && season.chapters.length > 0)
              ? season.chapters[0].num
              : 1;

            card.href = `reader.html?novel=${novel.id}&bab=${firstChapNum}`;

            // Try season cover, fallback to main cover
            const coverUrl = season.cover || novel.cover || '';
            const coverHtml = coverUrl
              ? `<img src="${coverUrl}" alt="${novel.title} - ${season.name}" loading="lazy">`
              : `<span class="no-cover">${novel.title.charAt(0)}</span>`;

            const totalChapters = season.chapters ? season.chapters.length : 0;

            card.innerHTML = `
              <div class="novel-card-cover">${coverHtml}</div>
              <div class="novel-card-info">
                <div class="novel-card-title">${novel.title}</div>
                <div class="novel-card-season">${season.name}</div>
                <div class="novel-card-meta">
                  <span>${totalChapters} Bab</span>
                  ${novel.genre ? `<span>${novel.genre}</span>` : ''}
                </div>
              </div>
            `;

            container.appendChild(card);
          });
        } else {
          // Fallback rendering for single-season or flat novels
          const card = document.createElement('a');
          card.className = 'novel-card';
          card.href = `reader.html?novel=${novel.id}`;

          const coverUrl = novel.cover || '';
          const coverHtml = coverUrl
            ? `<img src="${coverUrl}" alt="${novel.title}" loading="lazy">`
            : `<span class="no-cover">${novel.title.charAt(0)}</span>`;

          const totalChapters = novel.totalChapters || 0;

          card.innerHTML = `
            <div class="novel-card-cover">${coverHtml}</div>
            <div class="novel-card-info">
              <div class="novel-card-title">${novel.title}</div>
              <div class="novel-card-meta">
                <span>${totalChapters} Bab</span>
                ${novel.genre ? `<span>${novel.genre}</span>` : ''}
              </div>
            </div>
          `;

          container.appendChild(card);
        }
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
