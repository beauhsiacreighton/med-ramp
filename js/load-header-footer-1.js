/**
 * Load shared header and footer from components/header-footer-1.html
 * Sets active nav link based on current page
 */
(function() {
    const pageMap = {
        'index1.html': 'index',
        'about1.html': 'about',
        'publications1.html': 'publications',
        'blog1.html': 'blog',
        'faqs1.html': 'faqs'
    };

    function getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index1.html';
        return pageMap[filename] || null;
    }

    function setActiveNav(headerEl) {
        const current = getCurrentPage();
        if (!current) return;
        const link = headerEl.querySelector(`[data-nav="${current}"]`);
        if (link) link.classList.add('active');
    }

    function getComponentPath() {
        const path = window.location.pathname;
        const depth = (path.match(/\//g) || []).length;
        return depth > 1 ? '../components/header-footer-1.html' : 'components/header-footer-1.html';
    }

    fetch(getComponentPath())
        .then(r => r.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const headerPart = doc.querySelector('[data-component="header"]');
            const footerPart = doc.querySelector('[data-component="footer"]');

            const headerPlaceholder = document.getElementById('header-placeholder');
            const footerPlaceholder = document.getElementById('footer-placeholder');

            if (headerPart && headerPlaceholder) {
                headerPlaceholder.innerHTML = headerPart.innerHTML;
                setActiveNav(headerPlaceholder);
            }
            if (footerPart && footerPlaceholder) {
                footerPlaceholder.innerHTML = footerPart.innerHTML;
            }
        })
        .catch(err => console.error('Failed to load header/footer:', err));
})();
