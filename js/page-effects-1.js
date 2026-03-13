(function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let revealObserver = null;
    let countObserver = null;

    function getRevealObserver() {
        if (revealObserver || typeof IntersectionObserver !== 'function' || prefersReducedMotion) {
            return revealObserver;
        }

        revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.15
        });

        return revealObserver;
    }

    function animateCount(element) {
        if (!element || element.dataset.counted === 'true') {
            return;
        }

        const targetValue = Number.parseInt(element.dataset.countup || '0', 10);
        if (!Number.isFinite(targetValue)) {
            return;
        }

        const suffix = element.dataset.countupSuffix || '';
        const prefix = element.dataset.countupPrefix || '';
        const duration = Number.parseInt(element.dataset.countupDuration || '1400', 10);

        if (prefersReducedMotion || targetValue === 0) {
            element.textContent = `${prefix}${targetValue}${suffix}`;
            element.dataset.counted = 'true';
            return;
        }

        const start = performance.now();

        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(targetValue * eased);
            element.textContent = `${prefix}${currentValue}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                element.dataset.counted = 'true';
            }
        }

        requestAnimationFrame(tick);
    }

    function getCountObserver() {
        if (countObserver || typeof IntersectionObserver !== 'function' || prefersReducedMotion) {
            return countObserver;
        }

        countObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                animateCount(entry.target);
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.45
        });

        return countObserver;
    }

    function initRevealAnimations(root = document) {
        const animatedElements = root.querySelectorAll('[data-animate]:not([data-animate-bound])');
        if (!animatedElements.length) {
            return;
        }

        const observer = getRevealObserver();
        animatedElements.forEach((element) => {
            element.setAttribute('data-animate-bound', 'true');

            if (prefersReducedMotion || !observer) {
                element.classList.add('is-visible');
                return;
            }

            observer.observe(element);
        });
    }

    function initCountUps(root = document) {
        const countElements = root.querySelectorAll('[data-countup]:not([data-countup-bound])');
        if (!countElements.length) {
            return;
        }

        const observer = getCountObserver();
        countElements.forEach((element) => {
            element.setAttribute('data-countup-bound', 'true');

            if (prefersReducedMotion || !observer) {
                animateCount(element);
                return;
            }

            observer.observe(element);
        });
    }

    function closeMenu(nav, toggle) {
        if (!nav || !toggle) {
            return;
        }

        nav.classList.remove('active');
        toggle.classList.remove('is-active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
    }

    function initMobileNav(root = document) {
        const nav = root.querySelector('.nav-links');
        const toggle = root.querySelector('.mobile-toggle');
        if (!nav || !toggle || toggle.dataset.mobileBound === 'true') {
            return;
        }

        toggle.dataset.mobileBound = 'true';

        toggle.addEventListener('click', () => {
            const isActive = nav.classList.toggle('active');
            toggle.classList.toggle('is-active', isActive);
            toggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            document.body.classList.toggle('menu-open', isActive);
        });

        nav.addEventListener('click', (event) => {
            const clickedLink = event.target.closest('a');
            if (!clickedLink) {
                return;
            }

            closeMenu(nav, toggle);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeMenu(nav, toggle);
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 767) {
                closeMenu(nav, toggle);
            }
        });

        document.addEventListener('click', (event) => {
            if (!nav.classList.contains('active')) {
                return;
            }

            const clickedInsideNav = nav.contains(event.target);
            const clickedToggle = toggle.contains(event.target);
            if (!clickedInsideNav && !clickedToggle) {
                closeMenu(nav, toggle);
            }
        });
    }

    function initFaqAccordions(root = document) {
        const triggers = root.querySelectorAll('.faq-trigger:not([data-faq-bound])');
        if (!triggers.length) {
            return;
        }

        triggers.forEach((trigger) => {
            const item = trigger.closest('.faq-item');
            if (!item) {
                return;
            }

            trigger.setAttribute('data-faq-bound', 'true');
            const content = item.querySelector('.faq-content');
            if (content && !content.id) {
                const safeId = `faq-${Math.random().toString(36).slice(2, 10)}`;
                content.id = safeId;
                trigger.setAttribute('aria-controls', safeId);
            }

            trigger.addEventListener('click', () => {
                const group = item.closest('[data-faq-group]') || item.closest('.faq-category-section') || root;
                const isOpen = item.classList.contains('is-open');

                group.querySelectorAll('.faq-item.is-open').forEach((openItem) => {
                    openItem.classList.remove('is-open');
                    const openTrigger = openItem.querySelector('.faq-trigger');
                    if (openTrigger) {
                        openTrigger.setAttribute('aria-expanded', 'false');
                    }
                });

                if (!isOpen) {
                    item.classList.add('is-open');
                    trigger.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    function initialize(root = document) {
        initRevealAnimations(root);
        initCountUps(root);
        initMobileNav(root);
        initFaqAccordions(root);
    }

    document.addEventListener('DOMContentLoaded', () => {
        initialize(document);

        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof Element)) {
                        return;
                    }

                    initialize(node);
                    initialize(document);
                });
            });
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}());
