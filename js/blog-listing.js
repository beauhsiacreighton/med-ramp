// blog-listing.js - Search, filter, and pagination functionality

let allPosts = [];
let currentCategory = 'all';
let currentSearchTerm = '';
let currentPage = 1;
const POSTS_PER_PAGE = 6; // Show 6 posts per page for better two-column layout

document.addEventListener('DOMContentLoaded', async function() {
    await loadBlogPosts();
    initializeSearchAndFilters();
});

async function loadBlogPosts() {
    try {
        const response = await fetch('/blog-posts/posts.json');
        let postsFromJson = await response.json();
        
        // Auto-discover blog posts from /blog/ directory
        const discoveredPosts = await discoverBlogPosts();
        
        // Merge: add discovered posts that aren't already in the JSON
        const existingIds = new Set(postsFromJson.map(p => p.id || p.url));
        const newPosts = discoveredPosts.filter(post => {
            const postId = post.id || post.url;
            return !existingIds.has(postId) && !existingIds.has(post.url);
        });
        
        // Combine and sort by date (newest first)
        allPosts = [...postsFromJson, ...newPosts];
        allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        displayPosts(allPosts, 1);
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        showError();
    }
}

/**
 * Discover blog posts by scanning HTML files in /blog/ directory
 * Extracts metadata from HTML files that aren't in posts.json
 */
async function discoverBlogPosts() {
    try {
        // Known blog files - this will be auto-populated from existing posts.json
        // but can also check for new files by trying common patterns
        const knownBlogFiles = new Set();
        
        // First, get all URLs from existing posts to avoid duplicates
        try {
            const existingResponse = await fetch('/blog-posts/posts.json');
            const existingPosts = await existingResponse.json();
            existingPosts.forEach(post => {
                if (post.url) {
                    const filename = post.url.replace('/blog/', '');
                    if (filename) knownBlogFiles.add(filename);
                }
                if (post.id) {
                    knownBlogFiles.add(`${post.id}.html`);
                }
            });
        } catch (e) {
            // If we can't load existing posts, continue anyway
        }
        
        // Try to discover new blog files by checking common patterns
        // We'll check files that might exist based on sitemap or try fetching them
        const potentialFiles = [];
        
        // Check if there's a way to get blog file list (sitemap, API, etc.)
        // For now, we'll try to fetch known patterns and also check sitemap
        try {
            const sitemapResponse = await fetch('/sitemap.xml');
            if (sitemapResponse.ok) {
                const sitemapText = await sitemapResponse.text();
                const parser = new DOMParser();
                const sitemapDoc = parser.parseFromString(sitemapText, 'text/xml');
                const urls = sitemapDoc.querySelectorAll('loc');
                
                urls.forEach(urlElement => {
                    const url = urlElement.textContent;
                    if (url.includes('/blog/') && url.endsWith('.html')) {
                        const filename = url.substring(url.lastIndexOf('/') + 1);
                        if (filename && !knownBlogFiles.has(filename)) {
                            potentialFiles.push(filename);
                        }
                    }
                });
            }
        } catch (e) {
            // If sitemap fetch fails, continue with manual checks
        }
        
        // Also check for the specific file mentioned by user
        if (!knownBlogFiles.has('mcat-study-guide-day-1-no-content.html')) {
            potentialFiles.push('mcat-study-guide-day-1-no-content.html');
        }
        
        const discoveredPosts = [];
        
        // Process potential new files
        for (const filename of potentialFiles) {
            try {
                const response = await fetch(`/blog/${filename}`);
                if (!response.ok) continue;
                
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Extract metadata from HTML
                const title = doc.querySelector('.post-title-main')?.textContent?.trim() ||
                             doc.querySelector('h1')?.textContent?.trim() ||
                             doc.querySelector('title')?.textContent?.replace(' - Med-RAMP Blog', '').trim();
                
                const excerpt = doc.querySelector('.post-excerpt-main')?.textContent?.trim() ||
                               doc.querySelector('meta[name="description"]')?.content ||
                               '';
                
                const category = doc.querySelector('.post-category-badge')?.textContent?.trim() ||
                                doc.querySelector('meta[property="article:section"]')?.content ||
                                'Research Tips';
                
                const dateStr = doc.querySelector('.post-date')?.textContent?.trim() ||
                               doc.querySelector('meta[property="article:published_time"]')?.content ||
                               new Date().toISOString().split('T')[0];
                
                const author = doc.querySelector('.author-info strong')?.textContent?.trim() ||
                              doc.querySelector('meta[name="author"]')?.content ||
                              'Med-RAMP Team';
                
                const authorRole = doc.querySelector('.author-info span')?.textContent?.trim() || '';
                
                const readTime = doc.querySelector('.post-read-time')?.textContent?.trim() || '5 min read';
                
                const tags = Array.from(doc.querySelectorAll('.tag'))
                    .map(tag => tag.textContent.replace('#', '').trim())
                    .filter(Boolean);
                
                const featuredImage = doc.querySelector('.post-featured-image')?.src ||
                                    doc.querySelector('meta[property="og:image"]')?.content ||
                                    '';
                
                const id = filename.replace('.html', '');
                
                if (title) {
                    discoveredPosts.push({
                        id: id,
                        title: title,
                        excerpt: excerpt,
                        category: category,
                        date: parseDate(dateStr),
                        author: author,
                        authorRole: authorRole,
                        readTime: readTime,
                        tags: tags,
                        featured: false,
                        featuredImage: featuredImage,
                        url: `/blog/${filename}`
                    });
                    
                    console.log(`? Discovered new blog post: ${title}`);
                }
            } catch (err) {
                console.warn(`Could not parse ${filename}:`, err);
            }
        }
        
        return discoveredPosts;
    } catch (error) {
        console.warn('Could not discover blog posts:', error);
        return [];
    }
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // If already in ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    
    // Try to parse various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }
    
    // Fallback to today
    return new Date().toISOString().split('T')[0];
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
            currentPage = 1; // Reset to first page on new search
            filterAndDisplayPosts();
        }, 300);
    });
    
    // Clear search
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchTerm = '';
        clearBtn.classList.remove('visible');
        currentPage = 1;
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
            currentPage = 1; // Reset to first page on filter change
            filterAndDisplayPosts();
        });
    });
    
    // Click on post category to filter
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('post-category')) {
            e.preventDefault();
            e.stopPropagation();
            const category = e.target.textContent.trim();
            currentCategory = category;
            
            // Update filter buttons
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.category === category) {
                    btn.classList.add('active');
                }
            });
            
            currentPage = 1;
            filterAndDisplayPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    // Click on tag to search
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('post-tag')) {
            e.preventDefault();
            e.stopPropagation();
            const tag = e.target.textContent.replace('#', '').trim();
            searchInput.value = tag;
            currentSearchTerm = tag.toLowerCase();
            clearBtn.classList.add('visible');
            currentPage = 1;
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
    
    displayPosts(filteredPosts, currentPage);
}

function displayPosts(posts, page) {
    const container = document.getElementById('blogContainer');
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="no-posts">
                <div class="no-posts-icon">??</div>
                <h3 style="color: var(--white); margin-bottom: 1rem;">No posts found</h3>
                <p>Try adjusting your search or filter criteria</p>
                <button onclick="resetFilters()" class="btn btn-primary" style="margin-top: 1.5rem;">
                    Show All Posts
                </button>
            </div>
        `;
        updateResultsInfo(0, allPosts.length);
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
    const startIndex = (page - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const paginatedPosts = posts.slice(startIndex, endIndex);
    
    // Render posts
    const postsHTML = paginatedPosts.map(post => createPostCard(post)).join('');
    
    // Render pagination
    const paginationHTML = totalPages > 1 ? createPagination(page, totalPages, posts.length) : '';
    
    container.innerHTML = postsHTML + paginationHTML;
    
    updateResultsInfo(posts.length, allPosts.length, page, totalPages);
    
    // Animate posts (optimized with requestAnimationFrame)
    const postElements = container.querySelectorAll('.blog-post');
    if (postElements.length > 0) {
        requestAnimationFrame(() => {
            postElements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            });
            
            // Stagger animations
            postElements.forEach((el, index) => {
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    });
                }, index * 50);
            });
        });
    }
}

function createPostCard(post) {
    const featuredBadge = post.featured ? '<div class="featured-badge">? FEATURED</div>' : '';
    const tagsHTML = post.tags ? post.tags.slice(0, 3).map(tag => 
        `<span class="post-tag">#${tag}</span>`
    ).join('') : '';
    
    // Use the url from posts.json if available, otherwise construct it
    // Remove leading slash if present to make it relative
    let postUrl = post.url || `blog/${post.id}.html`;
    if (postUrl.startsWith('/')) {
        postUrl = postUrl.substring(1);
    }
    
    return `
        <a href="${postUrl}" class="blog-post">
            ${featuredBadge}
            <div class="post-content-wrapper">
                <div class="post-header">
                    <span class="post-category">${post.category}</span>
                    <span class="post-date">${formatDate(post.date)}</span>
                </div>
                <h2 class="post-title">${post.title}</h2>
                <p class="post-excerpt">${post.excerpt}</p>
                ${tagsHTML ? `<div class="post-tags">${tagsHTML}</div>` : ''}
                <div class="post-footer">
                    <div class="post-author-info">
                        <span class="post-author">${post.author}</span>
                        <span class="post-read-time">${post.readTime}</span>
                    </div>
                </div>
            </div>
        </a>
    `;
}

function createPagination(currentPage, totalPages, totalResults) {
    let paginationHTML = `
        <div class="pagination-container">
            <div class="pagination-info">
                Showing ${(currentPage - 1) * POSTS_PER_PAGE + 1}-${Math.min(currentPage * POSTS_PER_PAGE, totalResults)} of ${totalResults}
            </div>
            <div class="pagination-controls">
    `;
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `
            <button class="pagination-btn" onclick="goToPage(${currentPage - 1})">
                ? Previous
            </button>
        `;
    } else {
        paginationHTML += `
            <button class="pagination-btn disabled" disabled>
                ? Previous
            </button>
        `;
    }
    
    // Page numbers
    const pageNumbers = getPageNumbers(currentPage, totalPages);
    pageNumbers.forEach(pageNum => {
        if (pageNum === '...') {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        } else {
            const activeClass = pageNum === currentPage ? 'active' : '';
            paginationHTML += `
                <button class="pagination-btn ${activeClass}" onclick="goToPage(${pageNum})">
                    ${pageNum}
                </button>
            `;
        }
    });
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `
            <button class="pagination-btn" onclick="goToPage(${currentPage + 1})">
                Next ?
            </button>
        `;
    } else {
        paginationHTML += `
            <button class="pagination-btn disabled" disabled>
                Next ?
            </button>
        `;
    }
    
    paginationHTML += `
            </div>
        </div>
    `;
    
    return paginationHTML;
}

function getPageNumbers(current, total) {
    // Always show first page, last page, current page, and pages around current
    const pages = [];
    
    if (total <= 7) {
        // Show all pages if 7 or fewer
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
    } else {
        // Always include first page
        pages.push(1);
        
        if (current > 3) {
            pages.push('...');
        }
        
        // Pages around current
        for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
            pages.push(i);
        }
        
        if (current < total - 2) {
            pages.push('...');
        }
        
        // Always include last page
        pages.push(total);
    }
    
    return pages;
}

function goToPage(page) {
    currentPage = page;
    filterAndDisplayPosts();
    
    // Smooth scroll to top of blog section
    const blogSection = document.querySelector('.blog-controls');
    if (blogSection) {
        blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateResultsInfo(showing, total, page, totalPages) {
    const infoElement = document.getElementById('resultsInfo');
    
    if (showing === 0) {
        infoElement.textContent = '';
        return;
    }
    
    if (showing === total) {
        if (totalPages && totalPages > 1) {
            infoElement.textContent = `Page ${page} of ${totalPages} ? ${total} total posts`;
        } else {
            infoElement.textContent = `Showing all ${total} posts`;
        }
    } else {
        if (totalPages && totalPages > 1) {
            infoElement.textContent = `${showing} posts found ? Page ${page} of ${totalPages}`;
        } else {
            infoElement.textContent = `Showing ${showing} of ${total} posts`;
        }
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
    
    // Reset page
    currentPage = 1;
    
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
            <div class="no-posts-icon">??</div>
            <h3 style="color: var(--white); margin-bottom: 1rem;">Unable to load posts</h3>
            <p>Please try again later</p>
        </div>
    `;
}
