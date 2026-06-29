/**
 * brat-reader.js — Chapter reader with theme, font, progress, navigation
 */

const Reader = (() => {
  let novelData = null;
  let allChapters = [];
  let currentChapterIndex = 0;
  let novelId = '';
  let novelInfo = null;

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  return {
    /**
     * Load novel database and find the right novel
     */
    async init() {
      novelId = getQueryParam('novel') || '';
      const chapterParam = getQueryParam('bab');

      if (!novelId) {
        document.getElementById('reader-body').textContent = 'Novel tidak ditemukan.';
        return;
      }

      // Fetch novels database
      let dbUrl = 'novels/novels.json';
      try {
        const resp = await fetch(dbUrl);
        if (!resp.ok) throw new Error('not found');
        const data = await resp.json();
        novelInfo = data.novels.find(n => n.id === novelId);
      } catch {
        // Try GH pages absolute
        try {
          const resp = await fetch('https://paranparanjare-bot.github.io/bratasena-autonovel/novels/novels.json');
          const data = await resp.json();
          novelInfo = data.novels.find(n => n.id === novelId);
        } catch (e) {
          console.error('Cannot load novel DB:', e);
        }
      }

      if (!novelInfo) {
        document.getElementById('reader-body').textContent = 'Novel tidak ditemukan.';
        return;
      }

      // Update top bar title
      document.getElementById('reader-novel-title').textContent = novelInfo.title;

      // Collect all chapters from all seasons
      allChapters = [];
      if (novelInfo.seasons) {
        novelInfo.seasons.forEach(season => {
          if (season.chapters) {
            season.chapters.forEach(ch => {
              allChapters.push({
                ...ch,
                seasonPath: season.path,
                seasonName: season.name || season.season,
              });
            });
          }
        });
      }

      if (allChapters.length === 0) {
        document.getElementById('reader-body').textContent = 'Tidak ada bab tersedia.';
        return;
      }

      // Determine which chapter to load
      let targetChapter = 0;
      if (chapterParam) {
        const idx = allChapters.findIndex(ch => String(ch.num) === chapterParam);
        if (idx >= 0) targetChapter = idx;
      } else {
        // Resume from last read position
        const lastPos = App.getLastReadChapter(novelId);
        if (lastPos && lastPos.chapter) {
          const idx = allChapters.findIndex(ch => String(ch.num) === String(lastPos.chapter));
          if (idx >= 0) targetChapter = idx;
        }
      }

      currentChapterIndex = targetChapter;
      this.loadChapter(currentChapterIndex);
      this.renderSidebar();

      // Set up scroll progress tracking
      window.addEventListener('scroll', this.onScroll.bind(this));
    },

    /**
     * Load a chapter by index
     */
    async loadChapter(index) {
      if (index < 0 || index >= allChapters.length) return;

      const ch = allChapters[index];
      currentChapterIndex = index;

      const container = document.getElementById('reader-body');
      container.innerHTML = '<div class="loading">Memuat...</div>';

      try {
        const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
        // Ensure no double slash
        const baseClean = base.endsWith('/') ? base.slice(0, -1) : base;
        const chapterUrl = `${baseClean}/novels/${novelInfo.id}/${ch.seasonPath}/${ch.file}`;

        const resp = await fetch(chapterUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        let text = await resp.text();

        // Update header
        const chapNumEl = document.getElementById('reader-chapter-num');
        if (chapNumEl) chapNumEl.textContent = `Bab ${ch.num}`;
        document.getElementById('reader-chapter-title').textContent = ch.title || '';
        document.title = `${ch.title || 'Bab ' + ch.num} — ${novelInfo.title}`;

        // Update button states
        document.getElementById('prev-chapter').disabled = index <= 0;
        document.getElementById('next-chapter').disabled = index >= allChapters.length - 1;

        // Update URL without reload
        const url = new URL(window.location);
        url.searchParams.set('novel', novelId);
        url.searchParams.set('bab', ch.num);
        window.history.replaceState({}, '', url);

        // Save reading position
        App.saveReadingPosition(novelId, ch.num, 0);

        // Render text — format nicely
        container.innerHTML = '';
        const pre = document.createElement('div');
        pre.className = 'reader-body';
        pre.style.fontSize = 'var(--reader-font-size, 1rem)';
        // Use <p> for paragraphs
        const paragraphs = text.split(/\n\n+/);
        paragraphs.forEach(para => {
          const trimmed = para.trim();
          if (!trimmed) return;
          const p = document.createElement('p');
          // Handle dialog lines (starts with —)
          if (trimmed.startsWith('—') || trimmed.startsWith('"')) {
            p.textContent = trimmed;
          } else {
            p.textContent = trimmed;
          }
          container.appendChild(p);
        });

        // Scroll to top
        window.scrollTo(0, 0);

        // Update sidebar active
        document.querySelectorAll('.sidebar-chapter').forEach(el => {
          el.classList.toggle('active', parseInt(el.dataset.index) === index);
        });

        // Bookmark state
        this.updateBookmarkButton();

      } catch (e) {
        console.error('Failed to load chapter:', e);
        container.innerHTML = `<div class="text-center" style="padding:40px;color:var(--text-muted);">
          <p>Gagal memuat bab. Pastikan file tersedia.</p>
          <p style="font-size:0.8rem;margin-top:8px;">${e.message}</p>
        </div>`;
      }
    },

    updateBookmarkButton() {
      const ch = allChapters[currentChapterIndex];
      if (!ch) return;
      const isMarked = App.isBookmarked(novelId, ch.num);
      const btn = document.getElementById('bookmark-btn');
      if (btn) {
        btn.textContent = isMarked ? '🔖' : '🔖';
        btn.style.opacity = isMarked ? '1' : '0.4';
      }
    },

    /**
     * Render sidebar chapter list
     */
    renderSidebar() {
      const list = document.getElementById('sidebar-chapter-list');
      if (!list) return;

      list.innerHTML = '';
      let currentSeason = '';

      allChapters.forEach((ch, idx) => {
        // Season separator
        if (ch.seasonName !== currentSeason) {
          currentSeason = ch.seasonName;
          const sep = document.createElement('div');
          sep.className = 'sidebar-season';
          sep.textContent = ch.seasonName;
          list.appendChild(sep);
        }

        const item = document.createElement('a');
        item.className = 'sidebar-chapter';
        item.dataset.index = idx;
        item.dataset.num = ch.num;

        // Read status
        const readPos = App.getLastReadChapter(novelId);
        const readIndicator = (readPos && readPos.chapter >= ch.num) 
          ? '<span class="read-indicator">✓</span>' 
          : '';

        item.innerHTML = `<span class="chapter-num">${ch.num}.</span> ${ch.title || ''} ${readIndicator}`;
        item.href = `reader.html?novel=${novelId}&bab=${ch.num}`;
        item.addEventListener('click', (e) => {
          e.preventDefault();
          this.loadChapter(idx);
          this.closeSidebar();
        });

        if (idx === currentChapterIndex) {
          item.classList.add('active');
        }

        list.appendChild(item);
      });
    },

    /**
     * Navigate to next/prev chapter
     */
    goToChapter(delta) {
      const next = currentChapterIndex + delta;
      if (next >= 0 && next < allChapters.length) {
        this.loadChapter(next);
      }
    },

    /**
     * Sidebar toggle
     */
    openSidebar() {
      document.getElementById('sidebar').classList.add('open');
      document.getElementById('sidebar-overlay').classList.add('active');
    },

    closeSidebar() {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.remove('active');
    },

    toggleBookmark() {
      const ch = allChapters[currentChapterIndex];
      if (!ch) return;
      const added = App.toggleBookmark(novelId, ch.num);
      this.updateBookmarkButton();
      App.notify(added ? 'Ditambahkan ke bookmark' : 'Bookmark dihapus', 'success');
    },

    /**
     * Scroll progress tracking
     */
    onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      document.getElementById('reader-progress-bar').style.width = Math.min(100, progress) + '%';

      // Save scroll position periodically (every 2s)
      if (!this._scrollTimeout) {
        this._scrollTimeout = setTimeout(() => {
          const ch = allChapters[currentChapterIndex];
          if (ch) {
            const scrollPercent = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
            App.saveReadingPosition(novelId, ch.num, scrollPercent);
          }
          this._scrollTimeout = null;
        }, 2000);
      }
    },

    /**
     * Toggle theme
     */
    cycleTheme() {
      const themes = ['dark', 'sepia', 'light'];
      const current = App.getTheme();
      const idx = themes.indexOf(current);
      const next = themes[(idx + 1) % themes.length];
      App.setTheme(next);
      App.notify(`Tema: ${next.charAt(0).toUpperCase() + next.slice(1)}`, 'success');
    },

    /**
     * Keyboard shortcuts
     */
    onKeydown(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.goToChapter(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.goToChapter(-1);
      } else if (e.key === 'Escape') {
        this.closeSidebar();
      }
    },
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  Reader.init();

  document.addEventListener('keydown', (e) => Reader.onKeydown(e));

  // Sidebar open/close
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => Reader.openSidebar());
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => Reader.closeSidebar());
  document.getElementById('sidebar-close')?.addEventListener('click', () => Reader.closeSidebar());

  // Chapter navigation
  document.getElementById('prev-chapter')?.addEventListener('click', () => Reader.goToChapter(-1));
  document.getElementById('next-chapter')?.addEventListener('click', () => Reader.goToChapter(1));

  // Theme cycling
  document.getElementById('theme-toggle')?.addEventListener('click', () => Reader.cycleTheme());

  // Bookmark
  document.getElementById('bookmark-btn')?.addEventListener('click', () => Reader.toggleBookmark());

  // Font size controls
  document.getElementById('font-increase')?.addEventListener('click', () => App.adjustFontSize(2));
  document.getElementById('font-decrease')?.addEventListener('click', () => App.adjustFontSize(-2));

  // Swipe support for mobile
  let touchStartX = 0;
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });
  document.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].screenX - touchStartX;
    const absDiff = Math.abs(diff);
    if (absDiff > 80) {
      if (diff < 0) Reader.goToChapter(1); // swipe left = next
      else Reader.goToChapter(-1); // swipe right = prev
    }
  });
});
