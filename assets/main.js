(function() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const loadingScreen = document.getElementById('loading-screen');
    
    const isMobile = window.innerWidth < 768;
    canvas.width = isMobile ? 300 : 400;
    canvas.height = isMobile ? 250 : 300;
    
    const fish = {
        x: 30,
        y: canvas.height / 2,
        width: 24,
        height: 16,
        speed: 4,
        direction: 0
    };
    
    const bullets = [];
    const aliens = [];
    const bubbles = [];
    const particles = [];
    let score = 0;
    let gameRunning = true;
    let loadingProgress = 0;
    
    function spawnAlien() {
        const types = ['squid', 'crab', 'octopus'];
        aliens.push({
            x: canvas.width + 20,
            y: 20 + Math.random() * (canvas.height - 60),
            width: 20,
            height: 16,
            speed: 1 + Math.random() * 1.5,
            type: types[Math.floor(Math.random() * types.length)],
            frame: 0
        });
    }
    
    function spawnBubble() {
        bubbles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + 10,
            size: 2 + Math.random() * 4,
            speed: 0.5 + Math.random() * 1
        });
    }
    
    function shoot() {
        bullets.push({
            x: fish.x + fish.width,
            y: fish.y + fish.height / 2,
            width: 8,
            height: 3,
            speed: 7
        });
    }
    
    function createExplosion(x, y) {
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 20,
                color: Math.random() > 0.5 ? '#00d4ff' : '#ff6b6b'
            });
        }
    }
    
    function drawFish() {
        ctx.save();
        ctx.translate(fish.x + fish.width / 2, fish.y + fish.height / 2);
        
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.ellipse(0, 0, fish.width / 2, fish.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#0099cc';
        ctx.beginPath();
        ctx.moveTo(-fish.width / 2, 0);
        ctx.lineTo(-fish.width / 2 - 8, -6);
        ctx.lineTo(-fish.width / 2 - 8, 6);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#001a1a';
        ctx.beginPath();
        ctx.arc(fish.width / 4, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fish.width / 4 + 1, -3, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    function drawAlien(alien) {
        ctx.save();
        ctx.translate(alien.x + alien.width / 2, alien.y + alien.height / 2);
        
        const bounce = Math.sin(Date.now() / 200 + alien.x) * 2;
        ctx.translate(0, bounce);
        
        if (alien.type === 'squid') {
            ctx.fillStyle = '#9b59b6';
            ctx.fillRect(-8, -6, 16, 12);
            ctx.fillRect(-10, 2, 4, 6);
            ctx.fillRect(6, 2, 4, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-6, -4, 4, 4);
            ctx.fillRect(2, -4, 4, 4);
        } else if (alien.type === 'crab') {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-8, -4, 16, 8);
            ctx.fillRect(-12, -2, 4, 4);
            ctx.fillRect(8, -2, 4, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-5, -2, 3, 3);
            ctx.fillRect(2, -2, 3, 3);
        } else {
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-6, -3, 4, 4);
            ctx.fillRect(2, -3, 4, 4);
            ctx.fillStyle = '#2ecc71';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(-8 + i * 5, 6, 3, 4);
            }
        }
        
        ctx.restore();
    }
    
    function drawBullet(bullet) {
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 5;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    }
    
    function drawBubble(bubble) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    function drawParticle(particle) {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 20;
        ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        ctx.globalAlpha = 1;
    }
    
    function drawScore() {
        ctx.fillStyle = '#00d4ff';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText(`SCORE: ${score}`, 10, 20);
        
        ctx.fillStyle = '#666';
        ctx.fillText(`${Math.min(100, Math.floor(loadingProgress))}%`, canvas.width - 40, 20);
    }
    
    function drawSeaFloor() {
        ctx.fillStyle = '#0a1628';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
        
        ctx.fillStyle = '#1a2a4a';
        for (let i = 0; i < canvas.width; i += 15) {
            const h = 5 + Math.sin(i * 0.1) * 3;
            ctx.fillRect(i, canvas.height - 20, 8, -h);
        }
    }
    
    function update() {
        fish.y += fish.direction * fish.speed;
        fish.y = Math.max(10, Math.min(canvas.height - fish.height - 30, fish.y));
        
        for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].x += bullets[i].speed;
            if (bullets[i].x > canvas.width) {
                bullets.splice(i, 1);
            }
        }
        
        for (let i = aliens.length - 1; i >= 0; i--) {
            aliens[i].x -= aliens[i].speed;
            if (aliens[i].x < -30) {
                aliens.splice(i, 1);
            }
        }
        
        for (let i = bubbles.length - 1; i >= 0; i--) {
            bubbles[i].y -= bubbles[i].speed;
            bubbles[i].x += Math.sin(bubbles[i].y * 0.05) * 0.3;
            if (bubbles[i].y < -10) {
                bubbles.splice(i, 1);
            }
        }
        
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].x += particles[i].vx;
            particles[i].y += particles[i].vy;
            particles[i].life--;
            if (particles[i].life <= 0) {
                particles.splice(i, 1);
            }
        }
        
        for (let i = bullets.length - 1; i >= 0; i--) {
            for (let j = aliens.length - 1; j >= 0; j--) {
                if (bullets[i] && aliens[j] &&
                    bullets[i].x < aliens[j].x + aliens[j].width &&
                    bullets[i].x + bullets[i].width > aliens[j].x &&
                    bullets[i].y < aliens[j].y + aliens[j].height &&
                    bullets[i].y + bullets[i].height > aliens[j].y) {
                    createExplosion(aliens[j].x + aliens[j].width / 2, aliens[j].y + aliens[j].height / 2);
                    bullets.splice(i, 1);
                    aliens.splice(j, 1);
                    score += 10;
                    break;
                }
            }
        }
        
        if (Math.random() < 0.02) spawnAlien();
        if (Math.random() < 0.05) spawnBubble();
    }
    
    function draw() {
        ctx.fillStyle = '#000810';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0, 50, 80, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 20, 40, 0.5)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        bubbles.forEach(drawBubble);
        drawSeaFloor();
        bullets.forEach(drawBullet);
        aliens.forEach(drawAlien);
        particles.forEach(drawParticle);
        drawFish();
        drawScore();
    }
    
    function gameLoop() {
        if (!gameRunning) return;
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
    
    let keys = {};
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
        }
        if (e.key === ' ') shoot();
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        shoot();
    });
    
    canvas.addEventListener('click', () => {
        shoot();
    });
    
    setInterval(() => {
        if (keys['ArrowUp'] || keys['w']) fish.direction = -1;
        else if (keys['ArrowDown'] || keys['s']) fish.direction = 1;
        else fish.direction = 0;
    }, 16);
    
    gameLoop();
    
    const loadInterval = setInterval(() => {
        loadingProgress += 2 + Math.random() * 3;
        if (loadingProgress >= 100) {
            clearInterval(loadInterval);
        }
    }, 100);
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            loadingProgress = 100;
            setTimeout(() => {
                gameRunning = false;
                loadingScreen.classList.add('hidden');
                initPortfolio();
            }, 500);
        }, 2000);
    });
    
    function initPortfolio() {
        const navToggle = document.querySelector('.nav-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (navToggle && navLinks) {
            navToggle.addEventListener('click', function() {
                navLinks.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    if (navLinks) navLinks.classList.remove('active');
                    if (navToggle) navToggle.classList.remove('active');
                    
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        const contactForm = document.getElementById('contactForm');
        
        if (contactForm) {
            contactForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const submitBtn = contactForm.querySelector('.btn-submit');
                const originalText = submitBtn.innerHTML;
                
                submitBtn.innerHTML = '<span>Sending...</span>';
                submitBtn.disabled = true;
                
                const formData = {
                    name: document.getElementById('name').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    message: document.getElementById('message').value.trim()
                };
                
                try {
                    const response = await fetch('/api/contact', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        contactForm.innerHTML = `
                            <div class="success-message">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                                <h3>Message Sent!</h3>
                                <p>Thank you for reaching out. I'll get back to you soon.</p>
                            </div>
                        `;
                    } else {
                        throw new Error(result.error || 'Failed to send message');
                    }
                } catch (error) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    alert(error.message || 'An error occurred. Please try again.');
                }
            });
        }

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.section').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(section);
        });

        const style = document.createElement('style');
        style.textContent = '.section.visible { opacity: 1 !important; transform: translateY(0) !important; }';
        document.head.appendChild(style);

        const nav = document.querySelector('.nav');
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                nav.style.background = 'rgba(10, 10, 10, 0.95)';
            } else {
                nav.style.background = 'rgba(10, 10, 10, 0.8)';
            }
        });

        console.log('Portfolio loaded successfully');
    }
})();
