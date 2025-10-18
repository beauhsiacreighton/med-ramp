// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
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
            navLinks.classList.remove('active');
            if (mobileToggle) {
                mobileToggle.classList.remove('active');
            }
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

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

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                
                // Trigger counter animation for stat numbers
                if (entry.target.classList.contains('stat-card')) {
                    const statNumber = entry.target.querySelector('.stat-number');
                    const target = parseInt(statNumber.getAttribute('data-target'));
                    animateCounter(statNumber, target);
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with data-scroll-animate attribute
    document.querySelectorAll('[data-scroll-animate]').forEach(element => {
        observer.observe(element);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
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
});

// Filter publications (for publications page)
function filterPublications(category) {
    const items = document.querySelectorAll('.publication-item');
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 10);
        } else {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });

    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Search publications (for publications page)
function searchPublications() {
    const searchInput = document.getElementById('publicationSearch');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const items = document.querySelectorAll('.publication-item');
    
    items.forEach(item => {
        const title = item.querySelector('h3').textContent.toLowerCase();
        const authors = item.querySelector('.authors').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || authors.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// FAQ toggle (for FAQ page)
function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('.faq-icon');
    
    if (answer.style.maxHeight) {
        answer.style.maxHeight = null;
        if (icon) icon.textContent = '+';
    } else {
        // Close all other FAQs
        document.querySelectorAll('.faq-answer').forEach(item => {
            item.style.maxHeight = null;
        });
        document.querySelectorAll('.faq-icon').forEach(item => {
            item.textContent = '+';
        });
        
        answer.style.maxHeight = answer.scrollHeight + 'px';
        if (icon) icon.textContent = '−';
    }
}

// Load blog posts from JSON (for blog page)
async function loadBlogPosts() {
    try {
        const response = await fetch('blog-posts/posts.json');
        const posts = await response.json();
        const container = document.getElementById('blogContainer');
        
        if (!container) return;
        
        // Sort posts by date (newest first)
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
        
        // Re-observe new elements for scroll animations
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
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Initialize blog posts if on blog page
if (document.getElementById('blogContainer')) {
    loadBlogPosts();
}
