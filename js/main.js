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

    // *** NEW: Check if we are on the publications page and load publications ***
    if (document.querySelector('.publications-grid')) {
        loadPublications();
    }
    
    // *** NEW: Check if we are on the blog page and load posts ***
    if (document.getElementById('blogContainer')) {
        loadBlogPosts();
    }
});


// *** NEW: Function to load publications from JSON ***
async function loadPublications() {
    try {
        const response = await fetch('data/publications.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const publications = await response.json();
        const grid = document.querySelector('.publications-grid');
        
        if (!grid) return;

        // Map categories to badge classes
        const badgeClasses = {
            journal: 'badge-journal',
            abstract: 'badge-abstract',
            poster: 'badge-poster'
        };

        grid.innerHTML = publications.map(pub => `
            <div class="publication-item" data-category="${pub.category}" data-scroll-animate>
                <span class="pub-badge ${badgeClasses[pub.category] || 'badge-journal'}">${pub.category.charAt(0).toUpperCase() + pub.category.slice(1)}</span>
                <h3>${pub.title}</h3>
                <p class="authors">${pub.authors}</p>
                <div class="pub-details">
                    <span>📅 ${pub.date}</span>
                    <span>📚 ${pub.source}</span>
                </div>
                <p class="pub-abstract">${pub.abstract}</p>
                <a href="${pub.link}" target="_blank" class="pub-link">
                    View Publication →
                </a>
            </div>
        `).join('');

        // Re-initialize observer for newly added elements
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('[data-scroll-animate]').forEach(element => {
            observer.observe(element);
        });

    } catch (error) {
        console.error('Error loading publications:', error);
        const grid = document.querySelector('.publications-grid');
        if (grid) {
            grid.innerHTML = '<p style="text-align: center; color: #6c757d;">Could not load publications.</p>';
        }
    }
}


// *** REVISED: Filter publications function ***
function filterPublications(category, buttonElement) {
    const items = document.querySelectorAll('.publication-item');
    items.forEach(item => {
        const itemCategory = item.dataset.category;
        if (category === 'all' || itemCategory === category) {
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
    // Add 'active' class to the clicked button
    if(buttonElement) {
        buttonElement.classList.add('active');
    } else {
        // Fallback for initial load if needed
        document.querySelector('.filter-btn[onclick*="\'all\'"]').classList.add('active');
    }
}

// *** REVISED: Search publications function ***
function searchPublications() {
    const searchInput = document.getElementById('publicationSearch');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const items = document.querySelectorAll('.publication-item');
    
    items.forEach(item => {
        // Check content inside the item for a match
        const itemText = item.textContent.toLowerCase();
        
        if (itemText.includes(searchTerm)) {
            item.style.display = 'block'; // Show if it matches
        } else {
            item.style.display = 'none'; // Hide if it doesn't
        }
    });
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
        const response = await fetch('blog-posts/posts.json');
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
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Lastly, you need to slightly adjust the onclick attributes in your HTML to pass the element itself to the function
// This ensures the 'active' class is set correctly.
// Go to publications.html and change:
// onclick="filterPublications('all')"
// TO:
// onclick="filterPublications('all', this)"

// Example for all buttons:
/*
<button class="filter-btn active" onclick="filterPublications('all', this)">All Publications</button>
<button class="filter-btn" onclick="filterPublications('journal', this)">Journal Articles</button>
<button class="filter-btn" onclick="filterPublications('abstract', this)">Conference Abstracts</button>
<button class="filter-btn" onclick="filterPublications('poster', this)">Posters</button>
*/
