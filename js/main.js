// main.js

// Cache DOM elements for better performance
const DOM = {
    mobileToggle: null,
    navLinks: null,
    navbar: null
};

const PUBLICATIONS_PAGE_SIZE = 20;
const publicationsPaginationState = {
    currentPage: 1,
    lastCategory: '',
    lastSearchTerm: ''
};

const PUBLICATION_CATEGORY_META = {
    journal: {
        badgeClass: 'badge-journal',
        badgeLabel: 'Journal Article'
    },
    abstract: {
        badgeClass: 'badge-abstract',
        badgeLabel: 'Abstract'
    },
    poster: {
        badgeClass: 'badge-poster',
        badgeLabel: 'Poster'
    }
};

const PUBLICATIONS_JSON_CANDIDATES = [
    'publications.json',
    './publications.json',
    '../publications.json',
    '/publications.json',
    'data/publications.json',
    './data/publications.json',
    '../data/publications.json',
    '/data/publications.json'
];

document.addEventListener('DOMContentLoaded', async function() {
    // Cache DOM elements once
    DOM.mobileToggle = document.querySelector('.mobile-toggle');
    DOM.navLinks = document.querySelector('.nav-links');
    DOM.navbar = document.querySelector('.navbar');

    // Mobile Navigation Toggle - Completely rewritten for reliability
    function toggleMobileMenu() {
        if (!DOM.navLinks || !DOM.mobileToggle) return;
        
        const isActive = DOM.navLinks.classList.contains('active');
        
        if (isActive) {
            // Close menu
            DOM.navLinks.classList.remove('active');
            DOM.mobileToggle.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        } else {
            // Open menu
            DOM.navLinks.classList.add('active');
            DOM.mobileToggle.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }
    
    function closeMobileMenu() {
        if (!DOM.navLinks || !DOM.mobileToggle) return;
        
        DOM.navLinks.classList.remove('active');
        DOM.mobileToggle.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    // Toggle button click handler
    if (DOM.mobileToggle && DOM.navLinks) {
        DOM.mobileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileMenu();
        });
    }

    // Close menu when clicking a navigation link
    if (DOM.navLinks) {
        DOM.navLinks.addEventListener('click', function(e) {
            // Check if clicked element is a link or inside a link
            const link = e.target.closest('a');
            if (link && DOM.navLinks.classList.contains('active')) {
                // Small delay to allow navigation to happen
                setTimeout(() => {
                    closeMobileMenu();
                }, 100);
            }
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!DOM.navLinks || !DOM.mobileToggle) return;
        
        if (DOM.navLinks.classList.contains('active')) {
            // Check if click is outside both menu and toggle button
            const clickedInsideMenu = DOM.navLinks.contains(e.target);
            const clickedToggle = DOM.mobileToggle.contains(e.target);
            
            if (!clickedInsideMenu && !clickedToggle) {
                closeMobileMenu();
            }
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && DOM.navLinks && DOM.navLinks.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // Close menu on window resize (if resizing to desktop)
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 768 && DOM.navLinks && DOM.navLinks.classList.contains('active')) {
                closeMobileMenu();
            }
        }, 250);
    });

    // Navbar scroll effect with throttling for better performance
    if (DOM.navbar) {
        let scrollTimeout;
        const handleScroll = () => {
            if (scrollTimeout) return;
            scrollTimeout = setTimeout(() => {
                if (window.scrollY > 50) {
                    DOM.navbar.classList.add('scrolled');
                } else {
                    DOM.navbar.classList.remove('scrolled');
                }
                scrollTimeout = null;
            }, 50);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Animated counter for statistics
    const animateCounter = (element, target, duration = 2000) => {
        let current = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = Math.round(target);
                clearInterval(timer);
            } else {
                element.textContent = Math.round(current);
            }
        }, 16);
    };

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = createAnimationObserver(observerOptions, animateCounter);

    document.querySelectorAll('[data-scroll-animate]').forEach(element => {
        observer.observe(element);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offset = 80;
                    const targetPosition = target.offsetTop - offset;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Set active nav link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a:not(.apply-btn)').forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Page transition effect (optimized to avoid layout thrashing)
    requestAnimationFrame(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    });

    // Publications page: Filter and search functionality
    const publicationsGrid = document.querySelector('.publications-grid');
    if (publicationsGrid) {
        const publicationsLoaded = await loadAndRenderPublications();

        if (publicationsLoaded) {
            document.querySelectorAll('.publication-item[data-scroll-animate], .featured-pub[data-scroll-animate]').forEach(element => {
                observer.observe(element);
            });

            const searchInput = document.getElementById('publicationSearch');
            const searchClearButton = document.getElementById('publicationSearchClear');
            const filterButtons = document.querySelectorAll('.filter-btn');

            filterButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    event.currentTarget.classList.add('active');
                    updatePublicationsView({ resetPage: true, scrollToTop: true });
                });
            });

            const updateSearchClearButton = () => {
                if (!searchInput || !searchClearButton) return;
                const hasValue = searchInput.value.trim().length > 0;
                searchClearButton.classList.toggle('visible', hasValue);
            };

            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    updateSearchClearButton();
                    updatePublicationsView({ resetPage: true });
                });
            }

            if (searchInput && searchClearButton) {
                searchClearButton.addEventListener('click', () => {
                    if (!searchInput.value) return;
                    searchInput.value = '';
                    updateSearchClearButton();
                    updatePublicationsView({ resetPage: true });
                    searchInput.focus();
                });
            }

            updateSearchClearButton();
            updatePublicationsView({ resetPage: true });
            initFeaturedCarousel();
        }
    } else {
        // Featured Research Carousel (Publications page)
        initFeaturedCarousel();
    }

    // FAQ page: Category filtering
    const faqCategories = document.querySelectorAll('.category-card');
    if (faqCategories.length > 0) {
        faqCategories.forEach(card => {
            card.addEventListener('click', () => {
                const categoryName = card.querySelector('.category-name').textContent.trim();
                filterFAQByCategory(categoryName);
                
                // Scroll to FAQ sections
                const faqContainer = document.querySelector('.faq-container');
                if (faqContainer) {
                    faqContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // Blog page: Load blog posts
    if (document.getElementById('blogContainer')) {
        loadBlogPosts();
    }
});

function createAnimationObserver(observerOptions, animateCounterFn) {
    if (typeof window.IntersectionObserver !== 'function') {
        return {
            observe(element) {
                if (!element) return;
                element.classList.add('animated');

                if (element.classList.contains('stat-card')) {
                    const statNumber = element.querySelector('.stat-number');
                    const target = Number.parseInt(statNumber?.getAttribute('data-target'), 10);
                    if (statNumber && Number.isFinite(target) && !statNumber.classList.contains('is-animated')) {
                        animateCounterFn(statNumber, target);
                        statNumber.classList.add('is-animated');
                    }
                }
            },
            unobserve() {}
        };
    }

    return new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');

                if (entry.target.classList.contains('stat-card')) {
                    const statNumber = entry.target.querySelector('.stat-number');
                    const target = Number.parseInt(statNumber?.getAttribute('data-target'), 10);
                    if (statNumber && Number.isFinite(target) && !statNumber.classList.contains('is-animated')) {
                        animateCounterFn(statNumber, target);
                        statNumber.classList.add('is-animated');
                    }
                }

                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getPublicationCategoryMeta(category) {
    return PUBLICATION_CATEGORY_META[category] || PUBLICATION_CATEGORY_META.journal;
}

function getPublicationLink(url) {
    if (typeof url !== 'string') return '#';
    const trimmed = url.trim();
    return trimmed.length > 0 ? trimmed : '#';
}

function createPublicationCard(publication) {
    const category = publication?.category || 'journal';
    const categoryMeta = getPublicationCategoryMeta(category);
    const link = getPublicationLink(publication?.url);
    const year = Number.parseInt(publication?.year, 10);
    const yearText = Number.isNaN(year) ? 'N/A' : String(year);

    return `
        <div class="publication-item" data-category="${escapeHtml(category)}" data-scroll-animate>
            <span class="pub-badge ${categoryMeta.badgeClass}">${categoryMeta.badgeLabel}</span>
            <h3>${escapeHtml(publication?.title)}</h3>
            <p class="authors">${escapeHtml(publication?.authors)}</p>
            <div class="pub-details">
                <span>📅 ${yearText}</span>
                <span>📚 ${escapeHtml(publication?.journal)}</span>
            </div>
            <p class="pub-abstract">${escapeHtml(publication?.abstract)}</p>
            <a href="${escapeHtml(link)}" target="_blank" class="pub-link">
                View Publication →
            </a>
        </div>
    `;
}

function createFeaturedCarouselItem(publication, index) {
    const category = publication?.category || 'journal';
    const categoryMeta = getPublicationCategoryMeta(category);
    const link = getPublicationLink(publication?.url);
    const summary = publication?.featuredAbstract || publication?.abstract || '';
    const activeClass = index === 0 ? ' active' : '';

    return `
        <div class="carousel-item${activeClass}">
            <div class="featured-pub" data-scroll-animate>
                <span class="pub-badge ${categoryMeta.badgeClass}">${categoryMeta.badgeLabel}</span>
                <h3>${escapeHtml(publication?.title)}</h3>
                <p class="authors">${escapeHtml(publication?.authors)}</p>
                <p class="pub-abstract">${escapeHtml(summary)}</p>
                <a href="${escapeHtml(link)}" target="_blank" class="pub-link">
                    Read Full Article →
                </a>
            </div>
        </div>
    `;
}

function updateCarouselNavigationVisibility(featuredCount) {
    const carouselNav = document.querySelector('.carousel-nav');
    if (!carouselNav) return;

    carouselNav.style.display = featuredCount > 1 ? 'flex' : 'none';
}

function getPublicationJsonCandidateUrls() {
    return [...new Set(PUBLICATIONS_JSON_CANDIDATES
        .map(candidatePath => {
            try {
                return new URL(candidatePath, window.location.href).toString();
            } catch (error) {
                console.warn('Skipping invalid publications JSON path:', candidatePath, error);
                return null;
            }
        })
        .filter(Boolean))];
}

function coercePublicationsArray(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && typeof payload === 'object' && Array.isArray(payload.publications)) {
        return payload.publications;
    }

    return null;
}

function normalizePublicationRecord(record) {
    const publication = (record && typeof record === 'object') ? record : {};
    const normalizedCategory = typeof publication.category === 'string'
        ? publication.category.trim().toLowerCase()
        : '';
    const category = PUBLICATION_CATEGORY_META[normalizedCategory] ? normalizedCategory : 'journal';

    const rawYear = publication.year ?? publication.date;
    const parsedYear = Number.parseInt(rawYear, 10);

    return {
        ...publication,
        category,
        title: publication.title ?? '',
        authors: publication.authors ?? '',
        abstract: publication.abstract ?? '',
        year: Number.isNaN(parsedYear) ? (rawYear ?? '') : parsedYear,
        journal: publication.journal ?? publication.source ?? '',
        url: publication.url ?? publication.link ?? '#',
        featured: Boolean(publication.featured),
        featuredAbstract: publication.featuredAbstract ?? publication.featured_abstract ?? publication.abstract ?? ''
    };
}

async function loadPublicationsData() {
    const candidateUrls = getPublicationJsonCandidateUrls();
    const loadErrors = [];

    for (const candidateUrl of candidateUrls) {
        try {
            const response = await fetch(candidateUrl, { cache: 'no-store' });
            if (!response.ok) {
                loadErrors.push(`${candidateUrl} (${response.status})`);
                continue;
            }

            const payload = await response.json();
            const rawPublications = coercePublicationsArray(payload);
            if (!Array.isArray(rawPublications)) {
                loadErrors.push(`${candidateUrl} (invalid JSON shape)`);
                continue;
            }

            const normalizedPublications = rawPublications
                .map(normalizePublicationRecord)
                .filter(publication => typeof publication?.title === 'string' && publication.title.trim().length > 0);

            if (normalizedPublications.length === 0) {
                loadErrors.push(`${candidateUrl} (no publication records)`);
                continue;
            }

            return normalizedPublications;
        } catch (error) {
            loadErrors.push(`${candidateUrl} (${error instanceof Error ? error.message : 'unknown error'})`);
        }
    }

    throw new Error(`Unable to load publications data from known JSON paths: ${loadErrors.join('; ')}`);
}

async function loadAndRenderPublications() {
    const publicationsGrid = document.querySelector('.publications-grid');
    if (!publicationsGrid) return false;

    const featuredCarousel = document.querySelector('.featured-carousel');

    try {
        const publications = await loadPublicationsData();

        publicationsGrid.innerHTML = publications.map(createPublicationCard).join('');

        if (featuredCarousel) {
            const featuredPublications = publications.filter(publication => publication?.featured);
            if (featuredPublications.length === 0) {
                featuredCarousel.innerHTML = '<div class="publications-loading">No featured research available right now.</div>';
            } else {
                featuredCarousel.innerHTML = featuredPublications.map(createFeaturedCarouselItem).join('');
            }
            updateCarouselNavigationVisibility(featuredPublications.length);
        }

        return true;
    } catch (error) {
        console.error('Error loading publications:', error);
        publicationsGrid.innerHTML = `
            <div class="no-posts">
                <p>Unable to load publications at this time. Please try again later.</p>
            </div>
        `;

        if (featuredCarousel) {
            featuredCarousel.innerHTML = '';
            updateCarouselNavigationVisibility(0);
        }

        return false;
    }
}

/**
 * Updates the publications display based on filter category and search term
 */
function updatePublicationsView(options = {}) {
    const searchInput = document.getElementById('publicationSearch');
    if (!searchInput) return;
    
    const { resetPage = false, scrollToTop = false } = options;
    const searchTerm = searchInput.value.toLowerCase().trim();
    const activeFilterButton = document.querySelector('.filter-btn.active');
    if (!activeFilterButton) return;
    
    const activeCategory = activeFilterButton.dataset.category;
    const items = Array.from(document.querySelectorAll('.publication-item'));

    updatePublicationsHeading(activeFilterButton.textContent.trim());

    if (
        resetPage ||
        activeCategory !== publicationsPaginationState.lastCategory ||
        searchTerm !== publicationsPaginationState.lastSearchTerm
    ) {
        publicationsPaginationState.currentPage = 1;
    }

    publicationsPaginationState.lastCategory = activeCategory;
    publicationsPaginationState.lastSearchTerm = searchTerm;

    // Show/hide stats banner and featured section
    const showExtraSections = (activeCategory === 'all' && searchTerm === '');
    
    const statsBanner = document.querySelector('.stats-banner');
    const featuredSection = document.querySelector('.featured-section');
    
    if (statsBanner) {
        statsBanner.style.display = showExtraSections ? 'block' : 'none';
    }
    
    if (featuredSection) {
        featuredSection.style.display = showExtraSections ? 'block' : 'none';
    }

    const matchingItems = [];

    items.forEach(item => {
        const itemCategory = item.dataset.category;
        const itemText = item.textContent.toLowerCase();

        const categoryMatch = (activeCategory === 'all' || itemCategory === activeCategory);
        const searchMatch = searchTerm === '' || itemText.includes(searchTerm);

        if (categoryMatch && searchMatch) {
            matchingItems.push(item);
        }
    });

    const totalPages = Math.max(1, Math.ceil(matchingItems.length / PUBLICATIONS_PAGE_SIZE));
    if (matchingItems.length === 0) {
        publicationsPaginationState.currentPage = 1;
    } else if (publicationsPaginationState.currentPage > totalPages) {
        publicationsPaginationState.currentPage = totalPages;
    }

    const start = (publicationsPaginationState.currentPage - 1) * PUBLICATIONS_PAGE_SIZE;
    const end = start + PUBLICATIONS_PAGE_SIZE;
    const visibleItems = matchingItems.slice(start, end);

    items.forEach(item => setPublicationVisibility(item, false));
    visibleItems.forEach(item => setPublicationVisibility(item, true));

    showNoResultsMessage(matchingItems.length);
    renderPublicationsPagination(matchingItems.length);

    if (scrollToTop) {
        scrollPageToTop();
    }
}

function scrollPageToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Shows or hides a "no results" message
 */
function showNoResultsMessage(visibleCount) {
    const grid = document.querySelector('.publications-grid');
    if (!grid) return;

    const existingMessage = document.getElementById('noResultsMessage');
    if (existingMessage) {
        existingMessage.remove();
    }

    if (visibleCount === 0) {
        const message = document.createElement('div');
        message.id = 'noResultsMessage';
        message.style.cssText = 'text-align: center; padding: 3rem; color: rgba(255,255,255,0.8); font-size: 1.1rem;';
        message.innerHTML = '📭 No publications match your search criteria. Try adjusting your filters or search terms.';
        grid.appendChild(message);
    }
}

/**
 * Updates the publications section heading to match selected filter.
 */
function updatePublicationsHeading(title) {
    const heading = document.getElementById('publicationsResultsTitle');
    if (!heading) return;

    heading.textContent = title || 'Publications';
}

/**
 * Updates a publication card visibility with consistent transition styles.
 */
function setPublicationVisibility(item, isVisible) {
    item.style.display = isVisible ? 'block' : 'none';
    item.style.opacity = isVisible ? '1' : '0';
    item.style.transform = isVisible ? 'translateY(0)' : 'translateY(20px)';
}

/**
 * Render pagination controls and viewing range details.
 */
function renderPublicationsPagination(totalMatches) {
    const paginationContainer = document.getElementById('publicationsPagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (totalMatches === 0) {
        paginationContainer.style.display = 'none';
        return;
    }

    const totalPages = Math.ceil(totalMatches / PUBLICATIONS_PAGE_SIZE);
    paginationContainer.style.display = 'flex';
    const startItem = ((publicationsPaginationState.currentPage - 1) * PUBLICATIONS_PAGE_SIZE) + 1;
    const endItem = Math.min(publicationsPaginationState.currentPage * PUBLICATIONS_PAGE_SIZE, totalMatches);

    const pageInfo = document.createElement('span');
    pageInfo.className = 'pagination-info';
    pageInfo.textContent = `Viewing ${startItem}-${endItem} of ${totalMatches} (Page ${publicationsPaginationState.currentPage} of ${Math.max(totalPages, 1)})`;

    if (totalPages <= 1) {
        paginationContainer.appendChild(pageInfo);
        return;
    }

    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'pagination-btn';
    prevButton.textContent = 'Previous';
    prevButton.disabled = publicationsPaginationState.currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (publicationsPaginationState.currentPage === 1) return;
        publicationsPaginationState.currentPage -= 1;
        updatePublicationsView({ scrollToTop: true });
    });

    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'pagination-btn';
    nextButton.textContent = 'Next';
    nextButton.disabled = publicationsPaginationState.currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (publicationsPaginationState.currentPage === totalPages) return;
        publicationsPaginationState.currentPage += 1;
        updatePublicationsView({ scrollToTop: true });
    });

    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextButton);
}

/**
 * Initialize Featured Research Carousel
 */
function initFeaturedCarousel() {
    const carousel = document.querySelector('.featured-carousel');
    if (!carousel) return;

    const items = carousel.querySelectorAll('.carousel-item');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    let currentIndex = 0;
    let autoSlideInterval;

    function showSlide(index) {
        items.forEach((item, i) => {
            item.classList.remove('active');
            if (i === index) {
                item.classList.add('active');
            }
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % items.length;
        showSlide(currentIndex);
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        showSlide(currentIndex);
    }

    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            stopAutoSlide();
            startAutoSlide();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            stopAutoSlide();
            startAutoSlide();
        });
    }

    if (items.length === 0) {
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        return;
    }

    showSlide(0);

    if (items.length === 1) {
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        return;
    }

    startAutoSlide();

    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);
}

/**
 * Filter FAQ by category
 */
function filterFAQByCategory(categoryName) {
    const sections = document.querySelectorAll('.faq-category-section');
    
    // Map category card names to section titles
    const categoryMap = {
        'Application Process': 'Application Process',
        'Time Commitment': 'Time Commitment & Flexibility',
        'Research Experience': 'Research Experience',
        'Publications': 'Publications & Authorship'
    };

    const targetCategory = categoryMap[categoryName];

    sections.forEach(section => {
        const sectionTitle = section.querySelector('.category-title').textContent.trim();
        
        if (!targetCategory || sectionTitle === targetCategory) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
}

/**
 * FAQ toggle
 */
function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('.faq-icon');
    
    const isOpening = !answer.style.maxHeight;

    // Close all other FAQs first
    document.querySelectorAll('.faq-answer').forEach(item => {
        item.style.maxHeight = null;
    });
    document.querySelectorAll('.faq-icon').forEach(item => {
        if (item) item.textContent = '+';
    });
    
    // If the clicked one was closed, open it
    if (isOpening) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        if (icon) icon.textContent = '−';
    }
}

/**
 * Load blog posts from JSON
 */
/**
 * Enhanced blog loading with better card generation
 * Optimized for performance with lazy loading
 */
async function loadBlogPosts() {
    try {
        const response = await fetch('/blog-posts/posts.json');
        const posts = await response.json();
        const container = document.getElementById('blogContainer');
        
        if (!container) return;
        
        // Sort by date (newest first)
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Separate featured posts
        const featuredPosts = posts.filter(p => p.featured);
        const regularPosts = posts.filter(p => !p.featured);
        
        let html = '';
        
        // Featured section if there are featured posts
        if (featuredPosts.length > 0) {
            html += `
                <div class="featured-posts-section" style="margin-bottom: 4rem;">
                    <h2 style="color: var(--white); text-align: center; margin-bottom: 2rem; font-size: 1.75rem;">
                        ⭐ Featured Posts
                    </h2>
                    <div class="featured-posts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 3rem;">
                        ${featuredPosts.map(post => createBlogCard(post, true)).join('')}
                    </div>
                </div>
            `;
        }
        
        // Regular posts section
        if (regularPosts.length > 0) {
            html += `
                <div class="regular-posts-section">
                    ${featuredPosts.length > 0 ? `
                        <h2 style="color: var(--white); text-align: center; margin-bottom: 2rem; font-size: 1.75rem;">
                            Recent Posts
                        </h2>
                    ` : ''}
                    ${regularPosts.map(post => createBlogCard(post, false)).join('')}
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        // Animate posts with optimized IntersectionObserver
        const animateElements = document.querySelectorAll('[data-scroll-animate]');
        if (animateElements.length > 0 && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        requestAnimationFrame(() => {
                            entry.target.classList.add('animated');
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '50px' });
            
            animateElements.forEach(el => observer.observe(el));
        }
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        const container = document.getElementById('blogContainer');
        if (container) {
            container.innerHTML = `
                <div class="no-posts">
                    <p>Unable to load blog posts at this time. Please try again later.</p>
                </div>
            `;
        }
    }
}

/**
 * Create a blog card with enhanced styling
 */
function createBlogCard(post, isFeatured) {
    const featuredBadge = isFeatured ? '<span style="position: absolute; top: 1rem; right: 1rem; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.75rem; font-weight: 600;">FEATURED</span>' : '';
    
    return `
        <article class="blog-post glass-card" data-scroll-animate style="position: relative;">
            ${featuredBadge}
            <div class="post-header">
                <span class="post-category">${post.category}</span>
                <span class="post-date">${formatDate(post.date)}</span>
            </div>
            <h2 class="post-title">${post.title}</h2>
            <p class="post-excerpt">${post.excerpt}</p>
            
            ${post.tags ? `
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0;">
                    ${post.tags.slice(0, 3).map(tag => `
                        <span style="padding: 0.25rem 0.75rem; background: rgba(255, 255, 255, 0.2); border-radius: 15px; font-size: 0.8rem; color: rgba(255, 255, 255, 0.9);">
                            #${tag}
                        </span>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="post-footer">
                <div>
                    <span class="post-author">${post.author}</span>
                    ${post.readTime ? `<span style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; display: block; margin-top: 0.25rem;">${post.readTime}</span>` : ''}
                </div>
                <a href="blog-post.html?id=${post.id}" class="btn btn-secondary" style="padding: 0.6rem 1.5rem; font-size: 0.9rem;">
                    Read More →
                </a>
            </div>
        </article>
    `;
}

/**
 * Format date helper
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}
