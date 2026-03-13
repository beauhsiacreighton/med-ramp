const faqState = {
    currentCategory: 'all',
    currentSearch: ''
};

document.addEventListener('DOMContentLoaded', () => {
    initializeFaqControls();
    applyFaqFilters();
});

function initializeFaqControls() {
    const searchInput = document.getElementById('faqSearch');
    const clearButton = document.getElementById('faqSearchClear');
    const resetButton = document.getElementById('faqResetButton');

    document.querySelectorAll('[data-category-filter]').forEach((button) => {
        button.addEventListener('click', () => {
            document.querySelectorAll('[data-category-filter]').forEach((item) => item.classList.remove('is-active'));
            button.classList.add('is-active');
            faqState.currentCategory = button.dataset.categoryFilter || 'all';
            applyFaqFilters();

            const faqResults = document.getElementById('faqResults');
            if (faqResults) {
                faqResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    if (searchInput && clearButton) {
        let debounceTimer = null;
        searchInput.addEventListener('input', (event) => {
            faqState.currentSearch = event.target.value.trim().toLowerCase();
            clearButton.classList.toggle('visible', faqState.currentSearch.length > 0);
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                applyFaqFilters();
            }, 120);
        });

        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            faqState.currentSearch = '';
            clearButton.classList.remove('visible');
            applyFaqFilters();
            searchInput.focus();
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            resetFaqFilters();
        });
    }

    document.querySelectorAll('[data-faq-target]').forEach((button) => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.faqTarget;
            if (!targetId) {
                return;
            }

            resetFaqFilters();
            const targetItem = document.getElementById(targetId);
            if (!targetItem) {
                return;
            }

            openFaqItem(targetItem);
            targetItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function resetFaqFilters() {
    faqState.currentCategory = 'all';
    faqState.currentSearch = '';

    const searchInput = document.getElementById('faqSearch');
    const clearButton = document.getElementById('faqSearchClear');
    if (searchInput) {
        searchInput.value = '';
    }
    if (clearButton) {
        clearButton.classList.remove('visible');
    }

    document.querySelectorAll('[data-category-filter]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.categoryFilter === 'all');
    });

    applyFaqFilters();
}

function applyFaqFilters() {
    const sections = Array.from(document.querySelectorAll('.faq-category-section'));
    const emptyState = document.getElementById('faqEmptyState');
    let visibleItems = 0;

    sections.forEach((section) => {
        const sectionCategory = section.dataset.category || '';
        const categoryMatch = faqState.currentCategory === 'all' || faqState.currentCategory === sectionCategory;
        let visibleItemsInSection = 0;

        const items = Array.from(section.querySelectorAll('.faq-item'));
        items.forEach((item) => {
            const searchableText = item.textContent.toLowerCase();
            const searchMatch = !faqState.currentSearch || searchableText.includes(faqState.currentSearch);
            const itemVisible = categoryMatch && searchMatch;

            item.style.display = itemVisible ? '' : 'none';
            if (itemVisible) {
                visibleItems += 1;
                visibleItemsInSection += 1;
            }
        });

        section.style.display = visibleItemsInSection > 0 ? '' : 'none';
    });

    if (emptyState) {
        emptyState.style.display = visibleItems > 0 ? 'none' : 'block';
    }

    updateFaqResultsInfo(visibleItems);
}

function updateFaqResultsInfo(visibleItems) {
    const results = document.getElementById('faqResultsInfo');
    if (!results) {
        return;
    }

    if (visibleItems === 0) {
        results.textContent = 'No questions matched your search.';
        return;
    }

    const activeLabel = faqState.currentCategory === 'all' ? 'all categories' : faqState.currentCategory;
    results.textContent = `Showing ${visibleItems} questions from ${activeLabel}.`;
}

function openFaqItem(item) {
    const section = item.closest('.faq-category-section');
    const group = section || document;

    group.querySelectorAll('.faq-item.is-open').forEach((openItem) => {
        openItem.classList.remove('is-open');
        const trigger = openItem.querySelector('.faq-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });

    item.classList.add('is-open');
    const trigger = item.querySelector('.faq-trigger');
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'true');
    }
}
