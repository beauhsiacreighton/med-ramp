// blog-listing.js - Search and filter functionality for blog

let allPosts = [];
let currentCategory = 'all';
let currentSearchTerm = '';

document.addEventListener('DOMContentLoaded', async function() {
    await loadBlogPosts();
    initializeSearchAndFilters();
});

async function loadBlogPosts() {
    try {
        const response = await fetch('/blog-posts/posts.json');
        allPosts = await response.json();
        
        // Sort by date (newest first)
        allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        displayPosts(allPosts);
        updateResultsInfo(allPosts.length, allPosts.length);
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        showError();
    }
}

function initializeSearchAndFilters() {
    const searchInput = document.getElementById('blogSearch');
    const clearBtn = document.getElementById('clearSearch');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Search functionality with debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        currentSearchTerm = e.target.value.toLowerCase().trim();
        
        // Show/hide clear button
        if (currentSearchTerm) {
            clearBtn.classList.add('visible');
        } else {
            clearBtn.classList.remove('visible');
        }
        
        searchTimeout = setTimeout(() => {
            filterAndDisplayPosts();
        }, 300);
    });
    
    // Clear search
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchTerm = '';
        clearBtn.classList.remove('visible');
        filterAndDisplayPosts();
        searchInput.focus();
    });
    
    // Category filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            currentCategory = button.dataset.category;
            filterAndDisplayPosts();
        });
    });
    
    // Click on post category to filter
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('post-category')) {
            const category = e.target.textContent.trim();
            currentCategory = category;
            
            // Update filter buttons
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.category === category) {
                    btn.classList.add('active');
                }
            });
            
            filterAndDisplayPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    // Click on tag to search
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('post-tag')) {
            const tag = e.target.textContent.replace('#', '').trim();
            searchInput.value = tag;
            currentSearchTerm = tag.toLowerCase();
            clearBtn.classList.add('visible');
            filterAndDisplayPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

function filterAndDisplayPosts() {
    let filteredPosts = allPosts;
    
    // Filter by category
    if (currentCategory !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.category === currentCategory);
    }
    
    // Filter by search term
    if (currentSearchTerm) {
        filteredPosts = filteredPosts.filter(post => {
            const searchableText = [
                post.title,
                post.excerpt,
                post.author,
                post.category,
                ...(post.tags || [])
            ].join(' ').toLowerCase();
            
            return searchableText.includes(currentSearchTerm);
        });
    }
    
    displayPosts(filteredPosts);
    updateResultsInfo(filteredPosts.length, allPosts.length);
}

function displayPosts(posts) {
    const container = document.getElementById('blogContainer');
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="no-posts">
                <div class="no-posts-icon">🔍</div>
                <h3 style="color: var(--white); margin-bottom: 1rem;">No posts found</h3>
                <p>Try adjusting your search or filter criteria</p>
                <button onclick="resetFilters()" class="btn btn-primary" style="margin-top: 1.5rem;">
                    Show All Posts
                </button>
            </div>
        `;
        return;
    }
    
    const postsHTML = posts.map(post => createPostCard(post)).join('');
    container.innerHTML = postsHTML;
    
    // Animate posts
    const postElements = container.querySelectorAll('.blog-post');
    postElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        setTimeout(() => {
            el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

function createPostCard(post) {
    const featuredBadge = post.featured ? '<div class="featured-badge">⭐ FEATURED</div>' : '';
    const tagsHTML = post.tags ? post.tags.slice(0, 4).map(tag => 
        `<span class="post-tag">#${tag}</span>`
    ).join('') : '';
    
    return `
        <article class="blog-post">
            ${featuredBadge}
            ${post.featuredImage ? `
                <div class="post-image-container">
                    <img src="${post.featuredImage}" alt="${post.title}" class="post-image">
                </div>
            ` : ''}
            <div class="post-content-wrapper">
                <div class="post-header">
                    <span class="post-category">${post.category}</span>
                    <span class="post-date">${formatDate(post.date)}</span>
                </div>
                <h2 class="post-title">
                    <a href="blog-post.html?id=${post.id}">${post.title}</a>
                </h2>
                <p class="post-excerpt">${post.excerpt}</p>
                ${tagsHTML ? `<div class="post-tags">${tagsHTML}</div>` : ''}
                <div class="post-footer">
                    <div class="post-author-info">
                        <span class="post-author">${post.author}</span>
                        <span class="post-read-time">${post.readTime}</span>
                    </div>
                    <a href="blog-post.html?id=${post.id}" class="read-more-btn">
                        Read More →
                    </a>
                </div>
            </div>
        </article>
    `;
}

function updateResultsInfo(showing, total) {
    const infoElement = document.getElementById('resultsInfo');
    
    if (showing === total) {
        infoElement.textContent = `Showing all ${total} posts`;
    } else {
        infoElement.textContent = `Showing ${showing} of ${total} posts`;
    }
}

function resetFilters() {
    // Reset search
    const searchInput = document.getElementById('blogSearch');
    searchInput.value = '';
    currentSearchTerm = '';
    document.getElementById('clearSearch').classList.remove('visible');
    
    // Reset category
    currentCategory = 'all';
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === 'all') {
            btn.classList.add('active');
        }
    });
    
    filterAndDisplayPosts();
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function showError() {
    const container = document.getElementById('blogContainer');
    container.innerHTML = `
        <div class="no-posts">
            <div class="no-posts-icon">😕</div>
            <h3 style="color: var(--white); margin-bottom: 1rem;">Unable to load posts</h3>
            <p>Please try again later</p>
        </div>
    `;
}
