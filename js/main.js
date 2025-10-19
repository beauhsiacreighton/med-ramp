// main.js

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                if (mobileToggle) {
                    mobileToggle.classList.remove('active');
                }
            }
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
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
                    const offset = 80; // Account for fixed navbar
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
    document.querySelectorAll('.nav-links a').forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Page transition effect
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);

    // Add hover effect to cards
    document.querySelectorAll('.feature-card, .stat-card, .process-step').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

// Publications page: Filter and search functionality
    const publicationsGrid = document.querySelector('.publications-grid');
    if (publicationsGrid) {
        const searchInput = document.getElementById('publicationSearch');
        const filterButtons = document.querySelectorAll('.filter-btn');

        // Event listener for filter buttons
        filterButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                event.currentTarget.classList.add('active');

                // Update the display
                updatePublicationsView();
            });
        });

        // Event listener for the search input
        if (searchInput) {
            searchInput.addEventListener('input', updatePublicationsView);
        }

        // Initialize the view
        updatePublicationsView();
    }

    // Blog page: Load blog posts
    if (document.getElementById('blogContainer')) {
        loadBlogPosts();
    }
});

/**
 * Updates the publications display based on both filter category and search term
 */
function updatePublicationsView() {
    const searchInput = document.getElementById('publicationSearch');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // Find the currently active filter button
    const activeFilterButton = document.querySelector('.filter-btn.active');
    if (!activeFilterButton) return;
    
    const activeCategory = activeFilterButton.dataset.category;
    const items = document.querySelectorAll('.publication-item');

    let visibleCount = 0;

    items.forEach(item => {
        const itemCategory = item.dataset.category;
        const itemText = item.textContent.toLowerCase();

        // Check if item matches the category filter
        const categoryMatch = (activeCategory === 'all' || itemCategory === activeCategory);
        
        // Check if item matches the search term (or search is empty)
        const searchMatch = searchTerm === '' || itemText.includes(searchTerm);

        // Show item only if both conditions are met
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

    // Optional: Show a "no results" message if nothing matches
    showNoResultsMessage(visibleCount);
}

/**
 * Shows or hides a "no results" message
 */
function showNoResultsMessage(visibleCount) {
    const grid = document.querySelector('.publications-grid');
    if (!grid) return;

    // Remove existing message if present
    const existingMessage = document.getElementById('noResultsMessage');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Add message if no results
    if (visibleCount === 0) {
        const message = document.createElement('div');
        message.id = 'noResultsMessage';
        message.style.cssText = 'text-align: center; padding: 3rem; color: #6c757d; font-size: 1.1rem;';
        message.innerHTML = '📭 No publications match your search criteria. Try adjusting your filters or search terms.';
        grid.appendChild(message);
    }
}
// FAQ toggle (for FAQ page)
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

// Load blog posts from JSON (for blog page)
async function loadBlogPosts() {
    try {
        const response = await fetch('/blog-posts/posts.json');
        const posts = await response.json();
        const container = document.getElementById('blogContainer');
        
        if (!container) return;
        
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = posts.map(post => `
            <article class="blog-post glass-effect" data-scroll-animate>
                <div class="post-header">
                    <span class="post-category">${post.category}</span>
                    <span class="post-date">${formatDate(post.date)}</span>
                </div>
                <h2 class="post-title">${post.title}</h2>
                <p class="post-excerpt">${post.excerpt}</p>
                <div class="post-content">${post.content}</div>
                <div class="post-footer">
                    <span class="post-author">By ${post.author}</span>
                </div>
            </article>
        `).join('');
        
        document.querySelectorAll('[data-scroll-animate]').forEach(element => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animated');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            observer.observe(element);
        });
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        const container = document.getElementById('blogContainer');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d;">No blog posts available at this time.</p>';
        }
    }
}

// Format date helper
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options); // Corrected typo here
}
