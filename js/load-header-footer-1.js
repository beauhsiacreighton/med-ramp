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

    function isNestedPage() {
        const path = window.location.pathname;
        const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
        return normalizedPath.includes('/blog/');
    }

    function getBasePrefix() {
        return isNestedPage() ? '../' : '';
    }

    function getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('/blog/')) {
            return 'blog';
        }

        const filename = path.split('/').pop() || 'index1.html';
        return pageMap[filename] || null;
    }

    function normalizeLinkPath(element) {
        const basePrefix = getBasePrefix();

        element.querySelectorAll('a[href]').forEach((link) => {
            const href = link.getAttribute('href');
            if (!href) {
                return;
            }

            const isAbsolute = /^(?:[a-z]+:)?\/\//i.test(href) || href.startsWith('#');
            const isSpecialProtocol = href.startsWith('mailto:') || href.startsWith('tel:');
            const isRootRelative = href.startsWith('/');
            const alreadyNestedRelative = href.startsWith('../');

            if (isAbsolute || isSpecialProtocol || isRootRelative || alreadyNestedRelative) {
                return;
            }

            link.setAttribute('href', `${basePrefix}${href}`);
        });
    }

    function setActiveNav(headerEl) {
        const current = getCurrentPage();
        if (!current) {
            return;
        }

        const link = headerEl.querySelector(`[data-nav="${current}"]`);
        if (link) {
            link.classList.add('active');
        }
    }

    function getComponentPath() {
        return `${getBasePrefix()}components/header-footer-1.html`;
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
                normalizeLinkPath(headerPart);
                headerPlaceholder.innerHTML = headerPart.innerHTML;
                setActiveNav(headerPlaceholder);
            }

            if (footerPart && footerPlaceholder) {
                normalizeLinkPath(footerPart);
                footerPlaceholder.innerHTML = footerPart.innerHTML;
            }
        })
        .catch(err => console.error('Failed to load header/footer:', err));
})();
