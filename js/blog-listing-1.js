const BLOG_PAGE_SIZE = 6;

const blogState = {
    allPosts: [],
    filteredPosts: [],
    currentCategory: 'all',
    currentSearch: '',
    currentPage: 1
};

document.addEventListener('DOMContentLoaded', async () => {
    initializeBlogControls();
    await loadBlogPosts();
});

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function loadBlogPosts() {
    try {
        const response = await fetch('/blog-posts/posts.json', { cache: 'no-store' });
        const postsFromJson = await response.json();
        const discoveredPosts = await discoverBlogPosts(postsFromJson);

        const existingIds = new Set(postsFromJson.map((post) => post.id || post.url));
        const mergedPosts = [
            ...postsFromJson,
            ...discoveredPosts.filter((post) => !existingIds.has(post.id || post.url))
        ];

        blogState.allPosts = mergedPosts
            .map(normalizeBlogPost)
            .filter((post) => post.title)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        updateBlogStats(blogState.allPosts);
        updateFilterCounts(blogState.allPosts);
        renderFeaturedSpotlight(blogState.allPosts);
        applyBlogFilters();
    } catch (error) {
        console.error('Error loading blog posts:', error);
        renderBlogError();
    }
}

function normalizeBlogPost(post) {
    const normalizedUrl = String(post?.url || `blog/${post?.id || ''}.html`).replace(/^\//, '');
    const tags = Array.isArray(post?.tags) ? post.tags.filter(Boolean) : [];

    return {
        id: post?.id || normalizedUrl.replace(/^blog\//, '').replace(/\.html$/, ''),
        title: post?.title || '',
        excerpt: post?.excerpt || '',
        category: post?.category || 'General Advice',
        date: parseDate(post?.date),
        author: post?.author || 'Med-RAMP Team',
        authorRole: post?.authorRole || 'Mentor Team',
        readTime: post?.readTime || '5 min read',
        tags,
        featured: Boolean(post?.featured),
        featuredImage: post?.featuredImage || '',
        url: normalizedUrl
    };
}

function parseDate(dateValue) {
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
    }

    const parsedDate = new Date(dateValue || Date.now());
    if (Number.isNaN(parsedDate.getTime())) {
        return new Date().toISOString().split('T')[0];
    }

    return parsedDate.toISOString().split('T')[0];
}

async function discoverBlogPosts(existingPosts) {
    const knownFiles = new Set();
    existingPosts.forEach((post) => {
        if (typeof post?.url === 'string' && post.url.includes('/blog/')) {
            knownFiles.add(post.url.split('/').pop());
        }
        if (post?.id) {
            knownFiles.add(`${post.id}.html`);
        }
    });

    try {
        const sitemapResponse = await fetch('/sitemap.xml', { cache: 'no-store' });
        if (!sitemapResponse.ok) {
            return [];
        }

        const sitemapText = await sitemapResponse.text();
        const parser = new DOMParser();
        const sitemapDoc = parser.parseFromString(sitemapText, 'text/xml');
        const filenames = Array.from(sitemapDoc.querySelectorAll('loc'))
            .map((entry) => entry.textContent?.trim() || '')
            .filter((url) => url.includes('/blog/') && url.endsWith('.html'))
            .map((url) => url.split('/').pop())
            .filter((filename) => filename && !knownFiles.has(filename));

        const discoveredPosts = [];
        for (const filename of filenames) {
            try {
                const response = await fetch(`/blog/${filename}`, { cache: 'no-store' });
                if (!response.ok) {
                    continue;
                }

                const html = await response.text();
                const doc = parser.parseFromString(html, 'text/html');
                const title = doc.querySelector('.post-title-main')?.textContent?.trim()
                    || doc.querySelector('meta[property="og:title"]')?.content?.trim()
                    || doc.querySelector('title')?.textContent?.replace(' - Med-RAMP Blog', '').trim();

                if (!title) {
                    continue;
                }

                const excerpt = doc.querySelector('.post-excerpt-main')?.textContent?.trim()
                    || doc.querySelector('meta[name="description"]')?.content?.trim()
                    || '';

                const category = doc.querySelector('.post-category-badge')?.textContent?.trim()
                    || doc.querySelector('meta[property="article:section"]')?.content?.trim()
                    || 'Research Tips';

                const date = doc.querySelector('.post-date')?.textContent?.trim()
                    || doc.querySelector('meta[property="article:published_time"]')?.content?.trim()
                    || new Date().toISOString().split('T')[0];

                const author = doc.querySelector('.author-info strong')?.textContent?.trim()
                    || doc.querySelector('meta[name="author"]')?.content?.trim()
                    || 'Med-RAMP Team';

                const authorRole = doc.querySelector('.author-info span')?.textContent?.trim() || 'Mentor Team';
                const readTime = doc.querySelector('.post-read-time')?.textContent?.trim() || '5 min read';
                const featuredImage = doc.querySelector('.post-featured-image')?.getAttribute('src')
                    || doc.querySelector('meta[property="og:image"]')?.content?.trim()
                    || '';
                const tags = Array.from(doc.querySelectorAll('.tag'))
                    .map((tag) => tag.textContent.replace('#', '').trim())
                    .filter(Boolean);

                discoveredPosts.push({
                    id: filename.replace('.html', ''),
                    title,
                    excerpt,
                    category,
                    date: parseDate(date),
                    author,
                    authorRole,
                    readTime,
                    tags,
                    featured: false,
                    featuredImage,
                    url: `blog/${filename}`
                });
            } catch (error) {
                console.warn(`Unable to parse ${filename}:`, error);
            }
        }

        return discoveredPosts;
    } catch (error) {
        console.warn('Unable to discover blog posts from sitemap:', error);
        return [];
    }
}

function initializeBlogControls() {
    const searchInput = document.getElementById('blogSearch');
    const clearButton = document.getElementById('clearSearch');
    const filterButtons = document.querySelectorAll('.filter-btn');

    if (!searchInput || !clearButton || !filterButtons.length) {
        return;
    }

    let debounceTimer = null;

    searchInput.addEventListener('input', (event) => {
        blogState.currentSearch = event.target.value.trim().toLowerCase();
        clearButton.classList.toggle('visible', blogState.currentSearch.length > 0);
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            blogState.currentPage = 1;
            applyBlogFilters();
        }, 180);
    });

    clearButton.addEventListener('click', () => {
        if (!searchInput.value) {
            return;
        }

        searchInput.value = '';
        blogState.currentSearch = '';
        blogState.currentPage = 1;
        clearButton.classList.remove('visible');
        applyBlogFilters();
        searchInput.focus();
    });

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            filterButtons.forEach((item) => item.classList.remove('active'));
            button.classList.add('active');
            blogState.currentCategory = button.dataset.category || 'all';
            blogState.currentPage = 1;
            applyBlogFilters();
        });
    });

    document.addEventListener('click', (event) => {
        const tagButton = event.target.closest('.post-tag');
        if (tagButton) {
            const tagValue = tagButton.dataset.tag || tagButton.textContent.replace('#', '').trim();
            if (!tagValue) {
                return;
            }

            searchInput.value = tagValue;
            blogState.currentSearch = tagValue.toLowerCase();
            clearButton.classList.add('visible');
            blogState.currentPage = 1;
            applyBlogFilters();
            return;
        }

        const quickFilter = event.target.closest('[data-quick-filter]');
        if (quickFilter) {
            const category = quickFilter.dataset.quickFilter;
            const matchingButton = Array.from(filterButtons).find((button) => button.dataset.category === category);
            if (!matchingButton) {
                return;
            }

            matchingButton.click();
        }
    });
}

function applyBlogFilters() {
    const filteredPosts = blogState.allPosts.filter((post) => {
        const matchesCategory = blogState.currentCategory === 'all' || post.category === blogState.currentCategory;
        const searchCorpus = [
            post.title,
            post.excerpt,
            post.author,
            post.authorRole,
            post.category,
            ...post.tags
        ].join(' ').toLowerCase();

        const matchesSearch = !blogState.currentSearch || searchCorpus.includes(blogState.currentSearch);
        return matchesCategory && matchesSearch;
    });

    blogState.filteredPosts = filteredPosts;
    renderBlogPosts();
    updateResultsInfo(filteredPosts.length);
}

function renderFeaturedSpotlight(posts) {
    const spotlight = document.getElementById('featuredPostSpotlight');
    if (!spotlight || !posts.length) {
        return;
    }

    const featuredPost = posts.find((post) => post.featured) || posts[0];
    const imageMarkup = featuredPost.featuredImage
        ? `<div class="spotlight-image" style="background-image: linear-gradient(135deg, rgba(1, 93, 169, 0.22), rgba(10, 22, 40, 0.12)), url('${escapeHtml(featuredPost.featuredImage)}');"></div>`
        : '<div class="spotlight-image spotlight-image-fallback"></div>';

    spotlight.innerHTML = `
        <div class="proof-label">${featuredPost.featured ? 'Featured resource' : 'Latest resource'}</div>
        ${imageMarkup}
        <div class="spotlight-meta">
            <span>${escapeHtml(featuredPost.category)}</span>
            <span>${escapeHtml(formatDate(featuredPost.date))}</span>
        </div>
        <h2>${escapeHtml(featuredPost.title)}</h2>
        <p>${escapeHtml(featuredPost.excerpt)}</p>
        <div class="spotlight-author">
            <strong>${escapeHtml(featuredPost.author)}</strong>
            <span>${escapeHtml(featuredPost.authorRole)}</span>
        </div>
        <a class="btn btn-primary" href="${escapeHtml(featuredPost.url)}">Read article</a>
    `;
}

function updateBlogStats(posts) {
    const totalPosts = document.getElementById('blogStatPosts');
    const totalCategories = document.getElementById('blogStatCategories');
    const latestUpdate = document.getElementById('blogStatLatest');

    if (totalPosts) {
        totalPosts.textContent = String(posts.length);
    }

    if (totalCategories) {
        totalCategories.textContent = String(new Set(posts.map((post) => post.category)).size);
    }

    if (latestUpdate) {
        latestUpdate.textContent = posts.length ? formatMonth(posts[0].date) : 'N/A';
    }
}

function updateFilterCounts(posts) {
    document.querySelectorAll('.filter-btn').forEach((button) => {
        const category = button.dataset.category || 'all';
        const count = category === 'all'
            ? posts.length
            : posts.filter((post) => post.category === category).length;
        const countElement = button.querySelector('.pill-count');
        if (countElement) {
            countElement.textContent = String(count);
        }
        button.style.display = category !== 'all' && count === 0 ? 'none' : 'inline-flex';
    });
}

function renderBlogPosts() {
    const container = document.getElementById('blogContainer');
    if (!container) {
        return;
    }

    if (!blogState.filteredPosts.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No articles matched your search</h3>
                <p>Try another keyword or reset your topic filters to explore the full Med-RAMP library.</p>
            </div>
        `;
        return;
    }

    const totalPages = Math.max(1, Math.ceil(blogState.filteredPosts.length / BLOG_PAGE_SIZE));
    if (blogState.currentPage > totalPages) {
        blogState.currentPage = totalPages;
    }

    const startIndex = (blogState.currentPage - 1) * BLOG_PAGE_SIZE;
    const endIndex = startIndex + BLOG_PAGE_SIZE;
    const postsForPage = blogState.filteredPosts.slice(startIndex, endIndex);

    container.innerHTML = `
        ${postsForPage.map((post, index) => createPostCard(post, index)).join('')}
        ${createPagination(totalPages)}
    `;
}

function createPostCard(post, index) {
    const imageMarkup = post.featuredImage
        ? `<div class="post-media" style="background-image: linear-gradient(180deg, rgba(10, 22, 40, 0.02), rgba(10, 22, 40, 0.22)), url('${escapeHtml(post.featuredImage)}');"></div>`
        : '<div class="post-media post-media-fallback"></div>';

    const tagsMarkup = post.tags.length
        ? `<div class="post-tags">
                ${post.tags.slice(0, 3).map((tag) => `<button type="button" class="post-tag" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`).join('')}
            </div>`
        : '';

    return `
        <article class="blog-post surface-card" data-animate style="--stagger: ${index * 0.05}s;">
            ${imageMarkup}
            <div class="post-content-wrapper">
                <div>
                    <div class="post-meta-row">
                        <span class="post-category" data-quick-filter="${escapeHtml(post.category)}">${escapeHtml(post.category)}</span>
                        <span class="post-date">${escapeHtml(formatDate(post.date))}</span>
                    </div>
                    <h2 class="post-title">${escapeHtml(post.title)}</h2>
                    <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
                    ${tagsMarkup}
                </div>
                <div class="post-footer">
                    <div class="post-author-block">
                        <span class="post-author">${escapeHtml(post.author)}</span>
                        <span class="post-author-role">${escapeHtml(post.authorRole)}</span>
                        <span class="post-read-time">${escapeHtml(post.readTime)}</span>
                    </div>
                    <a class="post-link" href="${escapeHtml(post.url)}">Read article</a>
                </div>
            </div>
        </article>
    `;
}

function createPagination(totalPages) {
    if (totalPages <= 1) {
        return '';
    }

    const pageButtons = getPageNumbers(blogState.currentPage, totalPages).map((pageNumber) => {
        if (pageNumber === '...') {
            return '<span class="pagination-ellipsis">...</span>';
        }

        const isActive = pageNumber === blogState.currentPage;
        return `
            <button type="button" class="pagination-btn ${isActive ? 'active' : ''}" data-page="${pageNumber}">
                ${pageNumber}
            </button>
        `;
    }).join('');

    return `
        <div class="pagination-container">
            <div class="pagination-info">Page ${blogState.currentPage} of ${totalPages}</div>
            <div class="pagination-controls">
                <button type="button" class="pagination-btn ${blogState.currentPage === 1 ? 'disabled' : ''}" data-page="${Math.max(1, blogState.currentPage - 1)}" ${blogState.currentPage === 1 ? 'disabled' : ''}>Previous</button>
                ${pageButtons}
                <button type="button" class="pagination-btn ${blogState.currentPage === totalPages ? 'disabled' : ''}" data-page="${Math.min(totalPages, blogState.currentPage + 1)}" ${blogState.currentPage === totalPages ? 'disabled' : ''}>Next</button>
            </div>
        </div>
    `;
}

document.addEventListener('click', (event) => {
    const paginationButton = event.target.closest('.pagination-btn[data-page]');
    if (!paginationButton || paginationButton.disabled) {
        return;
    }

    const page = Number.parseInt(paginationButton.dataset.page || '1', 10);
    if (!Number.isFinite(page)) {
        return;
    }

    blogState.currentPage = page;
    renderBlogPosts();
    updateResultsInfo(blogState.filteredPosts.length);

    const controls = document.querySelector('.blog-controls');
    if (controls) {
        controls.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});

function getPageNumbers(currentPage, totalPages) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = [1];
    if (currentPage > 3) {
        pages.push('...');
    }

    for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page += 1) {
        pages.push(page);
    }

    if (currentPage < totalPages - 2) {
        pages.push('...');
    }

    pages.push(totalPages);
    return pages;
}

function updateResultsInfo(resultCount) {
    const info = document.getElementById('resultsInfo');
    if (!info) {
        return;
    }

    if (!resultCount) {
        info.textContent = 'No articles matched your filters.';
        return;
    }

    const start = ((blogState.currentPage - 1) * BLOG_PAGE_SIZE) + 1;
    const end = Math.min(blogState.currentPage * BLOG_PAGE_SIZE, resultCount);
    const label = blogState.currentCategory === 'all' ? 'all topics' : blogState.currentCategory;
    info.textContent = `Showing ${start}-${end} of ${resultCount} articles for ${label}.`;
}

function renderBlogError() {
    const container = document.getElementById('blogContainer');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>We couldn't load the resource library</h3>
                <p>Please refresh the page or try again shortly.</p>
            </div>
        `;
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatMonth(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
    });
}
