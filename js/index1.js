(function () {
    const reviewSlides = Array.from(document.querySelectorAll('.review-slide'));
    const schoolSlides = Array.from(document.querySelectorAll('.school-slide'));
    const dots = Array.from(document.querySelectorAll('.review-dot'));
    const prevButton = document.getElementById('reviewPrev');
    const nextButton = document.getElementById('reviewNext');
    const carouselShell = document.querySelector('.proof-carousel-shell');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reviewSlides.length || reviewSlides.length !== schoolSlides.length) {
        return;
    }

    let currentIndex = 0;
    let intervalId = null;

    function renderSlides(index) {
        currentIndex = (index + reviewSlides.length) % reviewSlides.length;

        reviewSlides.forEach((slide, slideIndex) => {
            slide.classList.toggle('is-active', slideIndex === currentIndex);
        });

        schoolSlides.forEach((slide, slideIndex) => {
            slide.classList.toggle('is-active', slideIndex === currentIndex);
        });

        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('is-active', dotIndex === currentIndex);
        });
    }

    function startAutoplay() {
        if (prefersReducedMotion || intervalId) {
            return;
        }

        intervalId = window.setInterval(() => {
            renderSlides(currentIndex + 1);
        }, 4800);
    }

    function stopAutoplay() {
        if (!intervalId) {
            return;
        }

        window.clearInterval(intervalId);
        intervalId = null;
    }

    prevButton?.addEventListener('click', () => {
        renderSlides(currentIndex - 1);
    });

    nextButton?.addEventListener('click', () => {
        renderSlides(currentIndex + 1);
    });

    dots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const targetIndex = Number.parseInt(dot.dataset.slide || '0', 10);
            if (Number.isFinite(targetIndex)) {
                renderSlides(targetIndex);
            }
        });
    });

    carouselShell?.addEventListener('mouseenter', stopAutoplay);
    carouselShell?.addEventListener('mouseleave', startAutoplay);
    carouselShell?.addEventListener('focusin', stopAutoplay);
    carouselShell?.addEventListener('focusout', startAutoplay);

    renderSlides(0);
    startAutoplay();
}());
