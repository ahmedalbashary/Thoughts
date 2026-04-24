/**
 * ModernBlog – script.js
 * -------------------------------------------------------
 * Handles:
 *   - Fetching posts from posts.json
 *   - Rendering the homepage posts grid
 *   - Rendering a single post page
 *   - Mobile hamburger menu
 * -------------------------------------------------------
 * To add a new post: just add an entry to posts.json.
 * No other files need to be edited.
 */

const POSTS_JSON_PATH = 'posts.json';

/* =====================================================
   UTILITIES
   ===================================================== */

/**
 * Returns a URL query parameter value by name.
 * @param {string} param
 * @returns {string|null}
 */
function getUrlParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

/**
 * Formats an ISO date string into a human-readable date.
 * @param {string} dateString – e.g. "2026-04-10"
 * @returns {string} – e.g. "April 10, 2026"
 */
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

/**
 * Estimates reading time from HTML content.
 * @param {string} html
 * @returns {number} minutes
 */
function readingTime(html) {
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

/* =====================================================
   DATA FETCHING
   ===================================================== */

/**
 * Fetches and returns the posts array from posts.json.
 * Returns null on failure.
 * @returns {Promise<Array|null>}
 */
async function fetchPosts() {
  try {
    const res = await fetch(POSTS_JSON_PATH);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.posts;
  } catch (err) {
    console.error('Error fetching posts:', err);
    return null;
  }
}

/* =====================================================
   HOMEPAGE – POSTS GRID
   ===================================================== */

/**
 * Renders the full posts grid on index.html.
 */
async function renderPostsList() {
  const grid = document.getElementById('posts-grid');
  if (!grid) return;

  // Show spinner while loading
  grid.innerHTML = '<div class="loading">Loading posts</div>';

  const posts = await fetchPosts();

  if (!posts) {
    grid.innerHTML = '<div class="error">Failed to load posts. Please try again later.</div>';
    return;
  }

  // Sort newest first
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  grid.innerHTML = posts.map(post => {
    const rt = readingTime(post.content);
    const tagsHTML = post.tags
      .slice(0, 3) // show max 3 tags per card
      .map(t => `<span class="tag">${t}</span>`)
      .join('');

    return `
      <a href="post.html?id=${encodeURIComponent(post.id)}" class="post-card">
        <div class="post-image-wrap">
          <img src="${post.image}" alt="${post.title}" class="post-image" loading="lazy">
          <div class="post-image-overlay"></div>
        </div>
        <div class="post-body">
          <div class="post-meta">
            <span class="post-date">${formatDate(post.date)}</span>
            <span class="post-meta-dot"></span>
            <span class="post-readtime">${rt} min read</span>
          </div>
          <h2 class="post-title">${post.title}</h2>
          <p class="post-description">${post.description}</p>
          <div class="post-tags">${tagsHTML}</div>
          <span class="read-more">
            Read article
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </span>
        </div>
      </a>
    `;
  }).join('');
}

/* =====================================================
   SINGLE POST PAGE
   ===================================================== */

/**
 * Renders a single post on post.html based on the ?id= URL param.
 */
async function renderSinglePost() {
  const container = document.getElementById('post-content');
  if (!container) return;

  const postId = getUrlParam('id');

  if (!postId) {
    container.innerHTML = `
      <div class="error">
        No post ID specified.
        <br><a href="index.html" style="color:var(--accent);">← Go back home</a>
      </div>`;
    return;
  }

  container.innerHTML = '<div class="loading">Loading article</div>';

  const posts = await fetchPosts();

  if (!posts) {
    container.innerHTML = `
      <div class="error">
        Failed to load post.
        <br><a href="index.html" style="color:var(--accent);">← Go back home</a>
      </div>`;
    return;
  }

  const post = posts.find(p => p.id === postId);

  if (!post) {
    container.innerHTML = `
      <div class="error">
        Post not found.
        <br><a href="index.html" style="color:var(--accent);">← Go back home</a>
      </div>`;
    return;
  }

  // Update page <title>
  document.title = `${post.title} | ModernBlog`;

  const rt = readingTime(post.content);
  const tagsHTML = post.tags.map(t => `<span class="tag">${t}</span>`).join('');

  container.innerHTML = `
    <header class="post-header">
      <div class="post-meta">
        <span class="post-date">${formatDate(post.date)}</span>
        <span class="post-meta-dot"></span>
        <span class="post-readtime">${rt} min read</span>
      </div>
      <h1 class="post-title-large">${post.title}</h1>
      <p class="post-description-hero">${post.description}</p>
      <div class="post-tags">${tagsHTML}</div>
    </header>

    <img
      src="${post.image}"
      alt="${post.title}"
      class="post-featured-image"
      loading="eager"
    >

    <div class="post-article">
      ${post.content}
    </div>
  `;
}

/* =====================================================
   MOBILE HAMBURGER MENU
   ===================================================== */

function initHamburger() {
  const btn = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (!btn || !navLinks) return;

  btn.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
    // Animate bars
    const spans = btn.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity  = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity  = '';
      spans[2].style.transform = '';
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.querySelectorAll('span').forEach(s => s.removeAttribute('style'));
    }
  });
}

/* =====================================================
   INIT
   ===================================================== */

function init() {
  initHamburger();

  const isPostPage =
    window.location.pathname.includes('post.html') ||
    !!document.getElementById('post-content');

  if (isPostPage) {
    renderSinglePost();
  } else {
    renderPostsList();
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
