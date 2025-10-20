// blog-post.js - Dynamically loads blog post content

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (!postId) {
        showError('No post ID specified');
        return;
    }
    
    try {
        const response = await fetch('/blog-posts/posts.json');
        const posts = await response.json();
        const post = posts.find(p => p.id === postId);
        
        if (!post) {
            showError('Post not found');
            return;
        }
        
        renderPost(post);
        document.getElementById('pageTitle').textContent = `${post.title} - Med-RAMP Blog`;
        
        // Initialize navbar color change on scroll
        initNavbarColorChange();
        
    } catch (error) {
        console.error('Error loading post:', error);
        showError('Failed to load post content');
    }
});

function initNavbarColorChange() {
    const navbar = document.querySelector('.navbar');
    const postContainer = document.querySelector('.post-container');
    
    function checkNavbarPosition() {
        if (!postContainer) return;
        
        const containerTop = postContainer.getBoundingClientRect().top;
        const navbarHeight = navbar.offsetHeight;
        
        // When navbar overlaps white content area
        if (containerTop <= navbarHeight) {
            navbar.classList.add('scrolled-white');
        } else {
            navbar.classList.remove('scrolled-white');
        }
    }
    
    window.addEventListener('scroll', checkNavbarPosition);
    checkNavbarPosition(); // Check initial position
}

function renderPost(post) {
    const container = document.getElementById('postContent');
    
    const headerHTML = `
        <div class="post-container">
            ${post.featuredImage ? `
                <img src="${post.featuredImage}" alt="${post.title}" class="post-featured-image">
            ` : ''}
            
            <div class="post-header-section">
                <div class="post-meta-top">
                    <span class="post-category-badge">${post.category}</span>
                    <span class="post-date">${formatDate(post.date)}</span>
                    <span class="post-read-time">• ${post.readTime}</span>
                </div>
                
                <h1 class="post-title-main">${post.title}</h1>
                <p class="post-excerpt-main">${post.excerpt}</p>
                
                <div class="post-author-section">
                    <div class="author-avatar">${getInitials(post.author)}</div>
                    <div class="author-info">
                        <strong>${post.author}</strong>
                        <span>${post.authorRole}</span>
                    </div>
                </div>
            </div>
            
            <div class="post-content-section">
                <article class="post-content">
                    ${renderContent(post.content)}
                    
                    ${post.tags ? `
                        <div class="post-tags">
                            ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </article>
                
                <div class="post-footer-cta">
                    <h3>Ready to Start Your Research Journey?</h3>
                    <p>Join Med-RAMP and gain valuable research experience for your medical school application.</p>
                    <a href="https://forms.gle/1b31NgtUQn37vqH27" target="_blank" class="btn btn-primary btn-large">Apply to Med-RAMP</a>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = headerHTML;
    container.classList.remove('loading');
}

function renderContent(contentArray) {
    if (!contentArray) return '';
    
    return contentArray.map(block => {
        switch(block.type) {
            case 'paragraph':
                return `<p>${block.text}</p>`;
            
            case 'heading':
                return `<h${block.level}>${block.text}</h${block.level}>`;
            
            case 'list':
                return `
                    <ul>
                        ${block.items.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                `;
            
            case 'image':
                return `
                    <div class="content-image-wrapper">
                        <img src="${block.src}" alt="${block.alt}" class="content-image">
                        ${block.caption ? `<p class="image-caption">${block.caption}</p>` : ''}
                    </div>
                `;
            
            case 'callout':
                return `
                    <div class="callout callout-${block.style}">
                        ${block.text}
                    </div>
                `;
            
            case 'stats':
                return `
                    <div class="stats-display">
                        ${block.data.map(stat => `
                            <div class="stat-item">
                                <div class="stat-value">${stat.value}</div>
                                <div class="stat-label">${stat.label}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            
            case 'timeline':
                return `
                    <div class="timeline">
                        ${block.events.map(event => `
                            <div class="timeline-item">
                                <div class="timeline-period">${event.period}</div>
                                <div class="timeline-title">${event.title}</div>
                                <div class="timeline-desc">${event.description}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            
            default:
                return '';
        }
    }).join('');
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function showError(message) {
    const container = document.getElementById('postContent');
    container.className = 'error';
    container.innerHTML = `
        <div class="post-container" style="padding: 3rem; text-align: center;">
            <h2 style="color: var(--white); margin-bottom: 1rem;">😕 ${message}</h2>
            <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 2rem;">
                The blog post you're looking for couldn't be loaded.
            </p>
            <a href="blog.html" class="btn btn-primary">Return to Blog</a>
        </div>
    `;
}
