(function() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const loadingScreen = document.getElementById('loading-screen');
    
    const isMobile = window.innerWidth < 768;
    canvas.width = isMobile ? 280 : 400;
    canvas.height = isMobile ? 180 : 200;
    
    const PIXEL = isMobile ? 2 : 3;
    
    let audioCtx = null;
    
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    function playShootSound() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.1);
    }
    
    function playExplosionSound() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
    }
    
    function playDeathSound() {
        if (!audioCtx) return;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.8);
        osc2.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(15, audioCtx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        osc1.start(audioCtx.currentTime);
        osc2.start(audioCtx.currentTime);
        osc1.stop(audioCtx.currentTime + 0.8);
        osc2.stop(audioCtx.currentTime + 0.8);
    }
    
    const ship = {
        x: 10,
        y: canvas.height / 2 - 6,
        width: 18,
        height: 12,
        speed: 3,
        direction: 0
    };
    
    const bullets = [];
    const enemies = [];
    const stars = [];
    const explosions = [];
    let score = 0;
    let gameRunning = true;
    let loadingProgress = 0;
    let frame = 0;
    let leaderboard = [];
    let showingNameInput = false;
    
    async function fetchLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            if (response.ok) {
                leaderboard = await response.json();
            }
        } catch (e) {
            console.log('Leaderboard não disponível');
        }
    }
    
    async function saveScore(playerName, playerScore) {
        try {
            const response = await fetch('/api/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: playerName, score: playerScore })
            });
            if (response.ok) {
                const data = await response.json();
                leaderboard = data.leaderboard || [];
            }
        } catch (e) {
            console.log('Erro ao salvar score');
        }
    }
    
    fetchLeaderboard();
    
    for (let i = 0; i < 30; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 0.5 + Math.random() * 1.5,
            size: Math.random() > 0.7 ? 2 : 1
        });
    }
    
    function spawnEnemy() {
        const types = [
            { width: 12, height: 10, points: 10, speed: 1.5, pattern: 'straight' },
            { width: 14, height: 12, points: 20, speed: 1, pattern: 'wave' },
            { width: 16, height: 14, points: 30, speed: 0.8, pattern: 'zigzag' }
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        enemies.push({
            x: canvas.width + 10,
            y: 15 + Math.random() * (canvas.height - 40),
            ...type,
            startY: 0,
            phase: Math.random() * Math.PI * 2
        });
    }
    
    function shoot() {
        if (bullets.length < 5) {
            initAudio();
            playShootSound();
            bullets.push({
                x: ship.x + ship.width,
                y: ship.y + ship.height / 2 - 1,
                width: 6,
                height: 2,
                speed: 6
            });
        }
    }
    
    function createExplosion(x, y) {
        explosions.push({
            x: x,
            y: y,
            frame: 0,
            maxFrames: 8
        });
    }
    
    function drawPixelShip(x, y) {
        ctx.fillStyle = '#00ff00';
        
        ctx.fillRect(x, y + 4, 3, 4);
        ctx.fillRect(x + 3, y + 2, 3, 8);
        ctx.fillRect(x + 6, y + 1, 6, 10);
        ctx.fillRect(x + 12, y + 3, 3, 6);
        ctx.fillRect(x + 15, y + 4, 3, 4);
        
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(x + 3, y, 3, 2);
        ctx.fillRect(x + 3, y + 10, 3, 2);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 9, y + 4, 2, 4);
        
        if (frame % 4 < 2) {
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(x - 3, y + 5, 3, 2);
        }
    }
    
    function drawPixelEnemy(enemy, type) {
        const x = Math.floor(enemy.x);
        const y = Math.floor(enemy.y);
        
        if (type === 0) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(x + 2, y + 2, 8, 6);
            ctx.fillRect(x, y + 3, 2, 4);
            ctx.fillRect(x + 10, y + 3, 2, 4);
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(x + 4, y + 4, 2, 2);
            ctx.fillRect(x + 7, y + 4, 2, 2);
        } else if (type === 1) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(x + 4, y, 6, 12);
            ctx.fillRect(x, y + 2, 4, 8);
            ctx.fillRect(x + 10, y + 2, 4, 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 5, y + 3, 4, 3);
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 6, y + 4, 2, 2);
        } else {
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(x + 2, y + 2, 12, 10);
            ctx.fillRect(x, y + 4, 2, 6);
            ctx.fillRect(x + 14, y + 4, 2, 6);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(x + 4, y + 5, 3, 3);
            ctx.fillRect(x + 9, y + 5, 3, 3);
        }
    }
    
    function drawExplosion(exp) {
        const size = 4 + exp.frame;
        ctx.fillStyle = exp.frame % 2 === 0 ? '#ffff00' : '#ff6600';
        
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + exp.frame * 0.2;
            const dist = exp.frame * 2;
            ctx.fillRect(
                exp.x + Math.cos(angle) * dist - 2,
                exp.y + Math.sin(angle) * dist - 2,
                4, 4
            );
        }
        
        if (exp.frame < 4) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(exp.x - 2, exp.y - 2, 4, 4);
        }
    }
    
    function drawBullet(bullet) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bullet.x + bullet.width - 2, bullet.y, 2, bullet.height);
    }
    
    function drawHUD() {
        ctx.fillStyle = '#00ff00';
        ctx.font = '10px monospace';
        ctx.fillText('SCORE:' + String(score).padStart(5, '0'), 5, 12);
        
        if (leaderboard.length > 0) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '8px monospace';
            ctx.fillText('TOP 5', canvas.width - 70, 12);
            
            ctx.fillStyle = '#888888';
            for (let i = 0; i < Math.min(5, leaderboard.length); i++) {
                const entry = leaderboard[i];
                const name = entry.name.substring(0, 8);
                const scoreText = String(entry.score).padStart(5, '0');
                ctx.fillText(`${i+1}.${name}:${scoreText}`, canvas.width - 95, 22 + (i * 10));
            }
        }
        
        ctx.strokeStyle = '#00ff00';
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
    
    function update() {
        frame++;
        
        ship.y += ship.direction * ship.speed;
        ship.y = Math.max(5, Math.min(canvas.height - ship.height - 5, ship.y));
        
        for (let i = stars.length - 1; i >= 0; i--) {
            stars[i].x -= stars[i].speed;
            if (stars[i].x < 0) {
                stars[i].x = canvas.width;
                stars[i].y = Math.random() * canvas.height;
            }
        }
        
        for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].x += bullets[i].speed;
            if (bullets[i].x > canvas.width) {
                bullets.splice(i, 1);
            }
        }
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            enemy.x -= enemy.speed;
            
            if (enemy.pattern === 'wave') {
                enemy.y += Math.sin(frame * 0.1 + enemy.phase) * 0.8;
            } else if (enemy.pattern === 'zigzag') {
                if (frame % 30 < 15) {
                    enemy.y += 0.5;
                } else {
                    enemy.y -= 0.5;
                }
            }
            
            enemy.y = Math.max(5, Math.min(canvas.height - enemy.height - 5, enemy.y));
            
            if (enemy.x < -20) {
                enemies.splice(i, 1);
            }
        }
        
        for (let i = explosions.length - 1; i >= 0; i--) {
            explosions[i].frame++;
            if (explosions[i].frame >= explosions[i].maxFrames) {
                explosions.splice(i, 1);
            }
        }
        
        for (let i = bullets.length - 1; i >= 0; i--) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (bullets[i] && enemies[j] &&
                    bullets[i].x < enemies[j].x + enemies[j].width &&
                    bullets[i].x + bullets[i].width > enemies[j].x &&
                    bullets[i].y < enemies[j].y + enemies[j].height &&
                    bullets[i].y + bullets[i].height > enemies[j].y) {
                    createExplosion(
                        enemies[j].x + enemies[j].width / 2,
                        enemies[j].y + enemies[j].height / 2
                    );
                    playExplosionSound();
                    score += enemies[j].points;
                    bullets.splice(i, 1);
                    enemies.splice(j, 1);
                    break;
                }
            }
        }
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (ship.x < enemy.x + enemy.width &&
                ship.x + ship.width > enemy.x &&
                ship.y < enemy.y + enemy.height &&
                ship.y + ship.height > enemy.y) {
                createExplosion(ship.x + ship.width / 2, ship.y + ship.height / 2);
                playerDied();
                return;
            }
        }
        
        if (frame % 60 === 0 || (frame % 40 === 0 && score > 50)) {
            spawnEnemy();
        }
    }
    
    function playerDied() {
        gameRunning = false;
        loadingProgress = 100;
        playDeathSound();
        showingNameInput = true;
        
        setTimeout(() => {
            showNameInputDialog();
        }, 500);
    }
    
    function showNameInputDialog() {
        const finalScore = score;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); display: flex; align-items: center;
            justify-content: center; z-index: 10000; font-family: monospace;
        `;
        
        overlay.innerHTML = `
            <div style="background: #111; border: 2px solid #00ff00; padding: 30px; text-align: center; max-width: 320px;">
                <h2 style="color: #ff0000; margin: 0 0 10px; font-size: 24px;">GAME OVER</h2>
                <p style="color: #00ff00; font-size: 28px; margin: 10px 0;">SCORE: ${String(finalScore).padStart(5, '0')}</p>
                <p style="color: #888; margin: 20px 0 10px;">Digite seu nome para o ranking:</p>
                <input type="text" id="playerNameInput" maxlength="20" placeholder="Seu nome" 
                    style="background: #000; border: 1px solid #00ff00; color: #00ff00; 
                    padding: 10px; font-size: 16px; width: 200px; text-align: center; font-family: monospace;">
                <br>
                <button id="saveScoreBtn" style="background: #00ff00; color: #000; border: none;
                    padding: 10px 30px; font-size: 16px; cursor: pointer; margin-top: 15px; font-family: monospace;">
                    SALVAR
                </button>
                <button id="skipScoreBtn" style="background: #333; color: #888; border: none;
                    padding: 10px 20px; font-size: 14px; cursor: pointer; margin-top: 10px; margin-left: 10px; font-family: monospace;">
                    PULAR
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const input = document.getElementById('playerNameInput');
        const saveBtn = document.getElementById('saveScoreBtn');
        const skipBtn = document.getElementById('skipScoreBtn');
        
        input.focus();
        
        async function finishAndContinue(shouldSave) {
            if (shouldSave) {
                const playerName = input.value.trim() || 'Anônimo';
                await saveScore(playerName, finalScore);
            }
            overlay.remove();
            loadingScreen.classList.add('hidden');
            initPortfolio();
        }
        
        saveBtn.addEventListener('click', () => finishAndContinue(true));
        skipBtn.addEventListener('click', () => finishAndContinue(false));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') finishAndContinue(true);
        });
    }
    
    function draw() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        stars.forEach(star => {
            ctx.globalAlpha = star.size === 2 ? 1 : 0.5;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        ctx.globalAlpha = 1;
        
        bullets.forEach(drawBullet);
        
        enemies.forEach((enemy, i) => {
            const type = enemy.points === 10 ? 0 : enemy.points === 20 ? 1 : 2;
            drawPixelEnemy(enemy, type);
        });
        
        explosions.forEach(drawExplosion);
        
        drawPixelShip(ship.x, ship.y);
        
        drawHUD();
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
    
    let lastTouchY = null;
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        lastTouchY = e.touches[0].clientY;
        shoot();
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (lastTouchY !== null) {
            const deltaY = e.touches[0].clientY - lastTouchY;
            ship.y += deltaY * 0.5;
            ship.y = Math.max(5, Math.min(canvas.height - ship.height - 5, ship.y));
            lastTouchY = e.touches[0].clientY;
        }
    });
    
    canvas.addEventListener('touchend', () => {
        lastTouchY = null;
    });
    
    canvas.addEventListener('click', () => {
        shoot();
    });
    
    setInterval(() => {
        if (keys['ArrowUp'] || keys['w']) ship.direction = -1;
        else if (keys['ArrowDown'] || keys['s']) ship.direction = 1;
        else ship.direction = 0;
    }, 16);
    
    spawnEnemy();
    gameLoop();
    
    const loadInterval = setInterval(() => {
        loadingProgress += 1.5 + Math.random() * 2;
        if (loadingProgress >= 100) {
            clearInterval(loadInterval);
        }
    }, 100);
    
    window.addEventListener('load', () => {
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
