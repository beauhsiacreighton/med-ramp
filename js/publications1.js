const PUBLICATIONS_PAGE_SIZE = 12;

const publicationState = {
    records: [],
    filteredRecords: [],
    currentCategory: 'all',
    currentYear: 'all',
    currentSort: 'newest',
    currentSearch: '',
    currentPage: 1,
    carouselIndex: 0,
    carouselInterval: null
};

const PUBLICATION_CATEGORY_META = {
    journal: {
        label: 'Journal Article',
        badgeClass: 'badge-journal'
    },
    abstract: {
        label: 'Conference Abstract',
        badgeClass: 'badge-abstract'
    },
    poster: {
        label: 'Poster Presentation',
        badgeClass: 'badge-poster'
    }
};

const PUBLICATIONS_JSON_CANDIDATES = [
    '/publications.json',
    'publications.json',
    './publications.json',
    '/data/publications.json',
    'data/publications.json',
    './data/publications.json'
];

document.addEventListener('DOMContentLoaded', async () => {
    initializePublicationControls();
    await loadPublications();
});

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function loadPublications() {
    try {
        const records = await loadPublicationsData();
        publicationState.records = records
            .map(normalizePublication)
            .filter((record) => record.title)
            .sort((a, b) => Number(b.year) - Number(a.year));

        populateYearFilter(publicationState.records);
        updatePublicationStats(publicationState.records);
        updatePublicationCategoryCounts(publicationState.records);
        renderFeaturedCarousel(publicationState.records.filter((record) => record.featured));
        applyPublicationFilters();
    } catch (error) {
        console.error('Unable to load publications:', error);
        renderPublicationError();
    }
}

async function loadPublicationsData() {
    const candidateUrls = [...new Set(PUBLICATIONS_JSON_CANDIDATES.map((value) => {
        try {
            return new URL(value, window.location.href).toString();
        } catch (error) {
            return null;
        }
    }).filter(Boolean))];

    const errors = [];
    for (const candidateUrl of candidateUrls) {
        try {
            const response = await fetch(candidateUrl, { cache: 'no-store' });
            if (!response.ok) {
                errors.push(`${candidateUrl} (${response.status})`);
                continue;
            }

            const payload = await response.json();
            if (Array.isArray(payload)) {
                return payload;
            }

            if (payload && typeof payload === 'object' && Array.isArray(payload.publications)) {
                return payload.publications;
            }
        } catch (error) {
            errors.push(`${candidateUrl} (${error instanceof Error ? error.message : 'unknown'})`);
        }
    }

    throw new Error(`Tried ${errors.join('; ')}`);
}

function normalizePublication(record) {
    const categoryValue = String(record?.category || 'journal').trim().toLowerCase();
    const category = PUBLICATION_CATEGORY_META[categoryValue] ? categoryValue : 'journal';
    const yearValue = Number.parseInt(record?.year ?? record?.date ?? '', 10);
    const url = String(record?.url || record?.link || '#').trim() || '#';

    return {
        title: record?.title || '',
        authors: record?.authors || 'Med-RAMP contributors',
        year: Number.isFinite(yearValue) ? yearValue : 'N/A',
        journal: record?.journal || record?.source || 'Publication venue',
        abstract: record?.abstract || '',
        featuredAbstract: record?.featuredAbstract || record?.featured_abstract || record?.abstract || '',
        category,
        url,
        featured: Boolean(record?.featured)
    };
}

function initializePublicationControls() {
    const searchInput = document.getElementById('publicationSearch');
    const searchClear = document.getElementById('publicationSearchClear');
    const yearSelect = document.getElementById('publicationYearFilter');
    const sortSelect = document.getElementById('publicationSort');

    document.querySelectorAll('.filter-btn').forEach((button) => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach((item) => item.classList.remove('active'));
            button.classList.add('active');
            publicationState.currentCategory = button.dataset.category || 'all';
            publicationState.currentPage = 1;
            applyPublicationFilters();
        });
    });

    if (searchInput && searchClear) {
        let debounceTimer = null;

        searchInput.addEventListener('input', (event) => {
            publicationState.currentSearch = event.target.value.trim().toLowerCase();
            searchClear.classList.toggle('visible', publicationState.currentSearch.length > 0);
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                publicationState.currentPage = 1;
                applyPublicationFilters();
            }, 160);
        });

        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            publicationState.currentSearch = '';
            publicationState.currentPage = 1;
            searchClear.classList.remove('visible');
            applyPublicationFilters();
            searchInput.focus();
        });
    }

    if (yearSelect) {
        yearSelect.addEventListener('change', (event) => {
            publicationState.currentYear = event.target.value;
            publicationState.currentPage = 1;
            applyPublicationFilters();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (event) => {
            publicationState.currentSort = event.target.value;
            publicationState.currentPage = 1;
            applyPublicationFilters();
        });
    }

    document.addEventListener('click', async (event) => {
        const pageButton = event.target.closest('.pagination-btn[data-page]');
        if (pageButton) {
            const nextPage = Number.parseInt(pageButton.dataset.page || '1', 10);
            if (!Number.isFinite(nextPage) || pageButton.disabled) {
                return;
            }

            publicationState.currentPage = nextPage;
            renderPublicationGrid();
            updatePublicationSummary();
            scrollToPublicationsResults();
            return;
        }

        const carouselControl = event.target.closest('[data-carousel-action]');
        if (carouselControl) {
            const action = carouselControl.dataset.carouselAction;
            if (action === 'next') {
                moveCarousel(1);
            } else if (action === 'prev') {
                moveCarousel(-1);
            } else if (action === 'goto') {
                const index = Number.parseInt(carouselControl.dataset.carouselIndex || '0', 10);
                if (Number.isFinite(index)) {
                    showCarouselSlide(index);
                }
            }
            restartCarouselAutoPlay();
            return;
        }

        const copyButton = event.target.closest('.copy-doi-btn');
        if (copyButton) {
            const doiText = copyButton.dataset.doi || '';
            if (!doiText) {
                return;
            }

            try {
                await navigator.clipboard.writeText(doiText);
                const originalLabel = copyButton.textContent;
                copyButton.textContent = 'DOI copied';
                window.setTimeout(() => {
                    copyButton.textContent = originalLabel;
                }, 1800);
            } catch (error) {
                console.warn('Clipboard copy failed:', error);
            }
        }
    });
}

function populateYearFilter(records) {
    const yearSelect = document.getElementById('publicationYearFilter');
    if (!yearSelect) {
        return;
    }

    const years = Array.from(new Set(records
        .map((record) => record.year)
        .filter((year) => typeof year === 'number')))
        .sort((a, b) => b - a);

    yearSelect.innerHTML = `
        <option value="all">All years</option>
        ${years.map((year) => `<option value="${year}">${year}</option>`).join('')}
    `;
}

function updatePublicationStats(records) {
    const totalCount = records.length;
    const featuredCount = records.filter((record) => record.featured).length;
    const latestYear = records.reduce((highest, record) => typeof record.year === 'number' && record.year > highest ? record.year : highest, 0);
    const uniqueVenues = new Set(records.map((record) => record.journal)).size;

    setText('pubHeroTotal', totalCount);
    setText('pubHeroFeatured', featuredCount);
    setText('pubHeroRecentYear', latestYear || 'N/A');
    setText('pubStatTotal', totalCount);
    setText('pubStatVenues', uniqueVenues);
    setText('pubStatFeatured', featuredCount);
}

function updatePublicationCategoryCounts(records) {
    document.querySelectorAll('.filter-btn').forEach((button) => {
        const category = button.dataset.category || 'all';
        const count = category === 'all'
            ? records.length
            : records.filter((record) => record.category === category).length;
        const countElement = button.querySelector('.pill-count');
        if (countElement) {
            countElement.textContent = String(count);
        }
    });
}

function applyPublicationFilters() {
    const filtered = publicationState.records.filter((record) => {
        const categoryMatch = publicationState.currentCategory === 'all' || record.category === publicationState.currentCategory;
        const yearMatch = publicationState.currentYear === 'all' || String(record.year) === publicationState.currentYear;
        const searchCorpus = [
            record.title,
            record.authors,
            record.journal,
            record.abstract,
            record.year
        ].join(' ').toLowerCase();
        const searchMatch = !publicationState.currentSearch || searchCorpus.includes(publicationState.currentSearch);
        return categoryMatch && yearMatch && searchMatch;
    });

    publicationState.filteredRecords = sortPublications(filtered, publicationState.currentSort);
    publicationState.currentPage = Math.min(publicationState.currentPage, Math.max(1, Math.ceil(publicationState.filteredRecords.length / PUBLICATIONS_PAGE_SIZE)));

    const showFeatured = publicationState.currentCategory === 'all'
        && publicationState.currentYear === 'all'
        && publicationState.currentSearch === '';

    const featuredSection = document.querySelector('.featured-section');
    if (featuredSection) {
        featuredSection.style.display = showFeatured ? 'block' : 'none';
    }

    renderPublicationGrid();
    updatePublicationSummary();
}

function sortPublications(records, sortValue) {
    const sorted = [...records];

    switch (sortValue) {
        case 'oldest':
            return sorted.sort((a, b) => Number(a.year) - Number(b.year));
        case 'title':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        case 'venue':
            return sorted.sort((a, b) => a.journal.localeCompare(b.journal));
        case 'featured':
            return sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.year) - Number(a.year));
        case 'newest':
        default:
            return sorted.sort((a, b) => Number(b.year) - Number(a.year));
    }
}

function renderFeaturedCarousel(featuredRecords) {
    const carousel = document.getElementById('featuredCarousel');
    const dots = document.getElementById('featuredCarouselDots');
    const nav = document.getElementById('featuredCarouselNav');

    if (!carousel || !dots || !nav) {
        return;
    }

    if (!featuredRecords.length) {
        carousel.innerHTML = `
            <div class="empty-state">
                <h3>No featured research yet</h3>
                <p>New highlighted publications will appear here as research is added.</p>
            </div>
        `;
        dots.innerHTML = '';
        nav.style.display = 'none';
        return;
    }

    publicationState.carouselIndex = 0;
    carousel.innerHTML = featuredRecords.map((record, index) => {
        const meta = PUBLICATION_CATEGORY_META[record.category] || PUBLICATION_CATEGORY_META.journal;
        return `
            <article class="carousel-slide ${index === 0 ? 'active' : ''}" data-carousel-index="${index}">
                <div class="featured-pub surface-card">
                    <div class="featured-topline">
                        <span class="pub-badge ${meta.badgeClass}">${meta.label}</span>
                        <span class="featured-year">${escapeHtml(record.year)}</span>
                    </div>
                    <h3>${escapeHtml(record.title)}</h3>
                    <p class="authors">${escapeHtml(record.authors)}</p>
                    <p class="pub-abstract">${escapeHtml(record.featuredAbstract || record.abstract)}</p>
                    <div class="featured-actions">
                        <span class="featured-venue">${escapeHtml(record.journal)}</span>
                        ${record.url !== '#' ? `<a class="pub-link" href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">Open publication</a>` : '<span class="pub-link is-muted">Poster archive forthcoming</span>'}
                    </div>
                </div>
            </article>
        `;
    }).join('');

    dots.innerHTML = featuredRecords.map((record, index) => `
        <button type="button" class="carousel-dot ${index === 0 ? 'active' : ''}" aria-label="Show featured publication ${index + 1}" data-carousel-action="goto" data-carousel-index="${index}"></button>
    `).join('');

    nav.style.display = featuredRecords.length > 1 ? 'flex' : 'none';
    startCarouselAutoPlay();
}

function showCarouselSlide(index) {
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const dots = Array.from(document.querySelectorAll('.carousel-dot'));
    if (!slides.length) {
        return;
    }

    const boundedIndex = (index + slides.length) % slides.length;
    publicationState.carouselIndex = boundedIndex;

    slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('active', slideIndex === boundedIndex);
    });

    dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === boundedIndex);
    });
}

function moveCarousel(direction) {
    showCarouselSlide(publicationState.carouselIndex + direction);
}

function startCarouselAutoPlay() {
    const slides = document.querySelectorAll('.carousel-slide');
    clearInterval(publicationState.carouselInterval);

    if (slides.length <= 1) {
        return;
    }

    publicationState.carouselInterval = window.setInterval(() => {
        moveCarousel(1);
    }, 5600);
}

function restartCarouselAutoPlay() {
    startCarouselAutoPlay();
}

function renderPublicationGrid() {
    const grid = document.getElementById('publicationsGrid');
    const pagination = document.getElementById('publicationsPagination');

    if (!grid || !pagination) {
        return;
    }

    if (!publicationState.filteredRecords.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No research matched your filters</h3>
                <p>Try broadening your search, selecting all years, or switching publication types.</p>
            </div>
        `;
        pagination.innerHTML = '';
        return;
    }

    const totalPages = Math.max(1, Math.ceil(publicationState.filteredRecords.length / PUBLICATIONS_PAGE_SIZE));
    const startIndex = (publicationState.currentPage - 1) * PUBLICATIONS_PAGE_SIZE;
    const pageRecords = publicationState.filteredRecords.slice(startIndex, startIndex + PUBLICATIONS_PAGE_SIZE);

    grid.innerHTML = pageRecords.map((record, index) => createPublicationCard(record, index)).join('');
    pagination.innerHTML = createPublicationPagination(totalPages);
}

function createPublicationCard(record, index) {
    const meta = PUBLICATION_CATEGORY_META[record.category] || PUBLICATION_CATEGORY_META.journal;
    const doiText = extractDoi(record.url);
    const copyDoiButton = doiText
        ? `<button type="button" class="copy-doi-btn" data-doi="${escapeHtml(doiText)}">Copy DOI</button>`
        : '';

    return `
        <article class="publication-item surface-card" data-animate style="--stagger: ${index * 0.05}s;">
            <div class="publication-topline">
                <span class="pub-badge ${meta.badgeClass}">${meta.label}</span>
                <div class="publication-meta-chips">
                    <span class="publication-chip">${escapeHtml(record.year)}</span>
                    <span class="publication-chip">${escapeHtml(record.journal)}</span>
                </div>
            </div>
            <h3>${escapeHtml(record.title)}</h3>
            <p class="authors">${escapeHtml(record.authors)}</p>
            <p class="pub-abstract">${escapeHtml(record.abstract)}</p>
            <div class="publication-actions">
                ${record.url !== '#'
                    ? `<a class="pub-link" href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">View publication</a>`
                    : '<span class="pub-link is-muted">Poster listing only</span>'}
                ${copyDoiButton}
            </div>
        </article>
    `;
}

function createPublicationPagination(totalPages) {
    if (totalPages <= 1) {
        return '';
    }

    const pageButtons = getPublicationPages(publicationState.currentPage, totalPages).map((page) => {
        if (page === '...') {
            return '<span class="pagination-ellipsis">...</span>';
        }

        return `
            <button type="button" class="pagination-btn ${page === publicationState.currentPage ? 'active' : ''}" data-page="${page}">
                ${page}
            </button>
        `;
    }).join('');

    return `
        <button type="button" class="pagination-btn" data-page="${Math.max(1, publicationState.currentPage - 1)}" ${publicationState.currentPage === 1 ? 'disabled' : ''}>Previous</button>
        ${pageButtons}
        <button type="button" class="pagination-btn" data-page="${Math.min(totalPages, publicationState.currentPage + 1)}" ${publicationState.currentPage === totalPages ? 'disabled' : ''}>Next</button>
    `;
}

function getPublicationPages(currentPage, totalPages) {
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

function updatePublicationSummary() {
    const titleElement = document.getElementById('publicationsResultsTitle');
    const metaElement = document.getElementById('publicationsResultsMeta');
    const totalMatches = publicationState.filteredRecords.length;
    const start = totalMatches ? ((publicationState.currentPage - 1) * PUBLICATIONS_PAGE_SIZE) + 1 : 0;
    const end = totalMatches ? Math.min(publicationState.currentPage * PUBLICATIONS_PAGE_SIZE, totalMatches) : 0;

    if (titleElement) {
        const activeFilterButton = document.querySelector('.filter-btn.active');
        titleElement.textContent = activeFilterButton ? activeFilterButton.dataset.label || activeFilterButton.textContent.trim() : 'Research archive';
    }

    if (metaElement) {
        if (!totalMatches) {
            metaElement.textContent = 'No publications matched your current search.';
        } else {
            metaElement.textContent = `Showing ${start}-${end} of ${totalMatches} research outputs.`;
        }
    }
}

function renderPublicationError() {
    const grid = document.getElementById('publicationsGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>We couldn't load the research archive</h3>
                <p>Please refresh the page or try again shortly.</p>
            </div>
        `;
    }
}

function extractDoi(url) {
    if (typeof url !== 'string' || !url.includes('doi.org/')) {
        return '';
    }

    const parts = url.split('doi.org/');
    return parts[1] ? decodeURIComponent(parts[1]).trim() : '';
}

function scrollToPublicationsResults() {
    const anchor = document.getElementById('publicationsResultsTitle');
    if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = String(value);
    }
}
