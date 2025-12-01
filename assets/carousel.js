(function() {
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    let currentSlide = 0;
    
    function goToSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        
        currentSlide = index;
        
        track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }
    
    prevBtn.addEventListener('click', function() {
        goToSlide(currentSlide - 1);
    });
    
    nextBtn.addEventListener('click', function() {
        goToSlide(currentSlide + 1);
    });
    
    dots.forEach(function(dot, index) {
        dot.addEventListener('click', function() {
            goToSlide(index);
        });
    });
    
    let startX = 0;
    let endX = 0;
    const carousel = document.querySelector('.carousel-container');
    
    carousel.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
    });
    
    carousel.addEventListener('touchend', function(e) {
        endX = e.changedTouches[0].clientX;
        if (startX - endX > 50) goToSlide(currentSlide + 1);
        if (endX - startX > 50) goToSlide(currentSlide - 1);
    });
})();
