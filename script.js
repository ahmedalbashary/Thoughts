// Configuration
const POSTS_JSON_PATH = 'posts.json';

// Utility: Get URL parameter
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Utility: Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Theme Management
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (systemPrefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Toggle theme
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
}

// Fetch and parse posts
async function fetchPosts() {
    try {
        const response = await fetch(POSTS_JSON_PATH);
        if (!response.ok) throw new Error('Failed to load posts');
        const data = await response.json();
        return data.posts;
    } catch (error) {
        console.error('Error fetching posts:', error);
        return null;
    }
}

// Render posts list (for index.html)
async function renderPostsList() {
    const grid = document.getElementById('posts-grid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading">Loading posts...</div>';
    
    const posts = await fetchPosts();
    
    if (!posts) {
        grid.innerHTML = '<div class="error">Failed to load posts. Please try again later.</div>';
        return;
    }
    
    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    grid.innerHTML = posts.map(post => `
        <a href="post.html?id=${post.id}" class="post-card">
            <div class="post-image-container">
                <img src="${post.image}" alt="${post.title}" class="post-image" loading="lazy">
            </div>
            <div class="post-content-preview">
                <div class="post-date">${formatDate(post.date)}</div>
                <h2 class="post-title">${post.title}</h2>
                <p class="post-description">${post.description}</p>
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        </a>
    `).join('');
}

// Render single post (for post.html)
async function renderSinglePost() {
    const container = document.getElementById('post-content');
    if (!container) return;
    
    const postId = getUrlParam('id');
    
    if (!postId) {
        container.innerHTML = '<div class="error">No post ID specified. <a href="index.html">Go back home</a></div>';
        return;
    }
    
    container.innerHTML = '<div class="loading">Loading article...</div>';
    
    const posts = await fetchPosts();
    
    if (!posts) {
        container.innerHTML = '<div class="error">Failed to load post. <a href="index.html">Go back home</a></div>';
        return;
    }
    
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
        container.innerHTML = '<div class="error">Post not found. <a href="index.html">Go back home</a></div>';
        return;
    }
    
    // Update page title
    document.title = `${post.title} | Modern Blog`;
    
    // Calculate read time (rough estimate: 200 words per minute)
    const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);
    
    container.innerHTML = `
        <header class="post-header">
            <div class="post-meta">
                <time datetime="${post.date}">${formatDate(post.date)}</time>
                <span>•</span>
                <span>${readTime} min read</span>
            </div>
            <h1 class="hero-title" style="font-size: 2.5rem; margin-bottom: 1rem;">${post.title}</h1>
            <div class="post-tags" style="justify-content: center;">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </header>
        
        <img src="${post.image}" alt="${post.title}" class="post-featured-image">
        
        <div class="post-body">
            ${post.content}
        </div>
    `;
}

// Initialize based on current page
function init() {
    initTheme();
    
    // Check if we're on the homepage or post page
    const path = window.location.pathname;
    const isPostPage = path.includes('post.html') || document.getElementById('post-content');
    
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
