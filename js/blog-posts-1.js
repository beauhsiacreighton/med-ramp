(function () {
    function slugify(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-{2,}/g, '-');
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function initReadingProgress() {
        const progressBar = document.querySelector('.reading-progress-bar');
        const article = document.querySelector('.post-article');

        if (!progressBar || !article) {
            return;
        }

        function updateProgress() {
            const rect = article.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const readableHeight = Math.max(article.offsetHeight - viewportHeight * 0.55, 1);
            const pixelsRead = Math.min(
                Math.max((viewportHeight * 0.4) - rect.top, 0),
                readableHeight
            );
            const progress = Math.min((pixelsRead / readableHeight) * 100, 100);
            progressBar.style.width = `${progress}%`;
        }

        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);
    }

    function initTableOfContents() {
        const article = document.querySelector('.post-article');
        const tocList = document.getElementById('postToc');
        const tocShell = document.getElementById('postTocShell');

        if (!article || !tocList || !tocShell) {
            return;
        }

        const headings = Array.from(article.querySelectorAll('h2'));
        if (!headings.length) {
            tocList.innerHTML = '<li class="toc-empty">No sections were detected for this article.</li>';
            return;
        }

        tocList.innerHTML = headings.map((heading, index) => {
            if (!heading.id) {
                heading.id = `${slugify(heading.textContent) || 'section'}-${index + 1}`;
            }

            return `
                <li>
                    <a class="toc-link" href="#${escapeHtml(heading.id)}">${escapeHtml(heading.textContent)}</a>
                </li>
            `;
        }).join('');

        const tocLinks = Array.from(tocList.querySelectorAll('.toc-link'));
        const activeById = new Map(tocLinks.map((link) => [link.getAttribute('href')?.slice(1), link]));

        if (typeof IntersectionObserver !== 'function') {
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                tocLinks.forEach((link) => link.classList.remove('is-active'));
                const activeLink = activeById.get(entry.target.id);
                if (activeLink) {
                    activeLink.classList.add('is-active');
                }
            });
        }, {
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0.1
        });

        headings.forEach((heading) => observer.observe(heading));
    }

    function initCopyLink() {
        const button = document.getElementById('copyArticleLink');
        if (!button) {
            return;
        }

        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                const originalText = button.textContent;
                button.textContent = 'Link copied';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 1600);
            } catch (error) {
                console.error('Unable to copy link:', error);
                button.textContent = 'Copy failed';
                setTimeout(() => {
                    button.textContent = 'Copy article link';
                }, 1600);
            }
        });
    }

    function normalizePost(post) {
        return {
            id: post?.id || '',
            title: post?.title || '',
            excerpt: post?.excerpt || '',
            category: post?.category || 'General Advice',
            date: post?.date || '',
            readTime: post?.readTime || '5 min read',
            url: String(post?.url || '').replace(/^\//, '')
        };
    }

    async function renderRelatedPosts() {
        const relatedGrid = document.getElementById('relatedPostsGrid');
        const pageData = document.body?.dataset;

        if (!relatedGrid || !pageData?.postId) {
            return;
        }

        try {
            const response = await fetch('/blog-posts/posts.json', { cache: 'no-store' });
            const posts = (await response.json()).map(normalizePost);
            const currentId = pageData.postId;
            const currentCategory = pageData.postCategory || '';

            const sameCategoryPosts = posts.filter((post) => post.id !== currentId && post.category === currentCategory);
            const fallbackPosts = posts.filter((post) => post.id !== currentId && post.category !== currentCategory);
            const relatedPosts = [...sameCategoryPosts, ...fallbackPosts].slice(0, 3);

            if (!relatedPosts.length) {
                relatedGrid.innerHTML = '<div class="related-posts-empty">More Med-RAMP articles will appear here as the resource library grows.</div>';
                return;
            }

            relatedGrid.innerHTML = relatedPosts.map((post) => `
                <article class="related-post-card">
                    <div class="meta-chip"><strong>${escapeHtml(post.category)}</strong></div>
                    <h3>${escapeHtml(post.title)}</h3>
                    <p>${escapeHtml(post.excerpt)}</p>
                    <div class="related-post-card-footer">
                        <span>${escapeHtml(formatDate(post.date))}</span>
                        <a href="../${escapeHtml(post.url)}">Read article</a>
                    </div>
                </article>
            `).join('');
        } catch (error) {
            console.error('Unable to load related posts:', error);
            relatedGrid.innerHTML = '<div class="related-posts-empty">Related articles are temporarily unavailable.</div>';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initReadingProgress();
        initTableOfContents();
        initCopyLink();
        renderRelatedPosts();
    });
}());
