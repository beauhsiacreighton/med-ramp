// main.js

// Cache DOM elements for better performance
const DOM = {
    mobileToggle: null,
    navLinks: null,
    navbar: null
};

document.addEventListener('DOMContentLoaded', function() {
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

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                
                if (entry.target.classList.contains('stat-card')) {
                    const statNumber = entry.target.querySelector('.stat-number');
                    const target = parseInt(statNumber.getAttribute('data-target'));
                    if (statNumber && !statNumber.classList.contains('is-animated')) {
                        animateCounter(statNumber, target);
                        statNumber.classList.add('is-animated');
                    }
                }
                
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

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
        const searchInput = document.getElementById('publicationSearch');
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                event.currentTarget.classList.add('active');
                updatePublicationsView();
            });
        });

        if (searchInput) {
            searchInput.addEventListener('input', updatePublicationsView);
        }

        updatePublicationsView();
    }

    // Featured Research Carousel (Publications page)
    initFeaturedCarousel();

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

/**
 * Updates the publications display based on filter category and search term
 */
function updatePublicationsView() {
    const searchInput = document.getElementById('publicationSearch');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const activeFilterButton = document.querySelector('.filter-btn.active');
    if (!activeFilterButton) return;
    
    const activeCategory = activeFilterButton.dataset.category;
    const items = document.querySelectorAll('.publication-item');

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

    let visibleCount = 0;

    items.forEach(item => {
        const itemCategory = item.dataset.category;
        const itemText = item.textContent.toLowerCase();

        const categoryMatch = (activeCategory === 'all' || itemCategory === activeCategory);
        const searchMatch = searchTerm === '' || itemText.includes(searchTerm);

        if (categoryMatch && searchMatch) {
            item.style.display = 'block';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
            visibleCount++;
        } else {
            item.style.display = 'none';
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
        }
    });

    showNoResultsMessage(visibleCount);
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

    if (items.length > 0) {
        showSlide(0);
        startAutoSlide();

        carousel.addEventListener('mouseenter', stopAutoSlide);
        carousel.addEventListener('mouseleave', startAutoSlide);
    }
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
