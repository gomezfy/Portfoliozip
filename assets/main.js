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
    
    function playBossExplosionSound() {
        if (!audioCtx) return;
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200 - i * 50, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.5);
                gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                osc.start(audioCtx.currentTime);
                osc.stop(audioCtx.currentTime + 0.5);
            }, i * 150);
        }
    }
    
    function playBossWarningSound() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(220, audioCtx.currentTime + 0.2);
        osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.01, audioCtx.currentTime + 0.6);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.6);
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
    
    let currentPhase = 1;
    let enemiesKilledInPhase = 0;
    let enemiesToKillForBoss = 10;
    let boss = null;
    let bossActive = false;
    let phaseTransition = false;
    let phaseTransitionTimer = 0;
    
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
        if (bossActive || phaseTransition) return;
        
        const speedMod = 1 + (currentPhase - 1) * 0.15;
        const types = [
            { width: 12, height: 10, points: 10 * currentPhase, speed: 1.5 * speedMod, pattern: 'straight' },
            { width: 14, height: 12, points: 20 * currentPhase, speed: 1 * speedMod, pattern: 'wave' },
            { width: 16, height: 14, points: 30 * currentPhase, speed: 0.8 * speedMod, pattern: 'zigzag' }
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        enemies.push({
            x: canvas.width + 10,
            y: 15 + Math.random() * (canvas.height - 40),
            ...type,
            startY: 0,
            phase: Math.random() * Math.PI * 2,
            isBoss: false
        });
    }
    
    function spawnBoss() {
        playBossWarningSound();
        bossActive = true;
        
        const bossHealth = 5 + currentPhase * 3;
        boss = {
            x: canvas.width + 10,
            y: canvas.height / 2 - 25,
            width: 40,
            height: 50,
            speed: 0.5,
            health: bossHealth,
            maxHealth: bossHealth,
            points: 100 * currentPhase,
            pattern: 'boss',
            phase: 0,
            isBoss: true,
            targetY: canvas.height / 2 - 25,
            shootTimer: 0
        };
    }
    
    function drawBoss() {
        if (!boss) return;
        const x = Math.floor(boss.x);
        const y = Math.floor(boss.y);
        
        const flash = boss.health < boss.maxHealth && frame % 4 < 2;
        
        ctx.fillStyle = flash ? '#ffffff' : '#ff0066';
        ctx.fillRect(x + 10, y + 5, 20, 40);
        ctx.fillRect(x + 5, y + 10, 30, 30);
        ctx.fillRect(x, y + 15, 40, 20);
        
        ctx.fillStyle = flash ? '#ffaaaa' : '#aa0044';
        ctx.fillRect(x + 15, y, 10, 10);
        ctx.fillRect(x + 15, y + 40, 10, 10);
        
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(x + 5, y + 20, 6, 6);
        ctx.fillRect(x + 5, y + 28, 6, 6);
        
        if (frame % 6 < 3) {
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(x + 40, y + 22, 5, 6);
        }
        
        const healthWidth = 36;
        const healthHeight = 4;
        const healthX = x + 2;
        const healthY = y - 8;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(healthX, healthY, healthWidth, healthHeight);
        
        const healthPercent = boss.health / boss.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(healthX, healthY, healthWidth * healthPercent, healthHeight);
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
        
        ctx.fillStyle = '#00ffff';
        ctx.fillText('FASE ' + currentPhase, 5, 24);
        
        if (!bossActive && !phaseTransition) {
            const progress = Math.min(enemiesKilledInPhase / enemiesToKillForBoss, 1);
            ctx.fillStyle = '#333';
            ctx.fillRect(5, 28, 50, 4);
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(5, 28, 50 * progress, 4);
        }
        
        if (bossActive) {
            ctx.fillStyle = '#ff0066';
            ctx.font = '10px monospace';
            if (frame % 30 < 15) {
                ctx.fillText('!! BOSS !!', 5, 38);
            }
        }
        
        if (phaseTransition) {
            ctx.fillStyle = '#00ff00';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('FASE ' + (currentPhase + 1) + ' !', canvas.width / 2, canvas.height / 2);
            ctx.textAlign = 'left';
        }
        
        if (leaderboard.length > 0 && !bossActive) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '8px monospace';
            ctx.fillText('TOP 3', canvas.width - 70, 12);
            
            ctx.fillStyle = '#888888';
            for (let i = 0; i < Math.min(3, leaderboard.length); i++) {
                const entry = leaderboard[i];
                const name = entry.name.substring(0, 6);
                const scoreText = String(entry.score).padStart(5, '0');
                ctx.fillText(`${i+1}.${name}:${scoreText}`, canvas.width - 85, 22 + (i * 10));
            }
        }
        
        ctx.strokeStyle = bossActive ? '#ff0066' : '#00ff00';
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
                    enemiesKilledInPhase++;
                    bullets.splice(i, 1);
                    enemies.splice(j, 1);
                    
                    if (!bossActive && enemiesKilledInPhase >= enemiesToKillForBoss) {
                        spawnBoss();
                    }
                    break;
                }
            }
        }
        
        if (boss) {
            if (boss.x > canvas.width - 60) {
                boss.x -= boss.speed;
            } else {
                boss.phase += 0.03;
                boss.targetY = canvas.height / 2 + Math.sin(boss.phase) * (canvas.height / 3 - 30);
                if (boss.y < boss.targetY) boss.y += 1;
                else if (boss.y > boss.targetY) boss.y -= 1;
            }
            
            for (let i = bullets.length - 1; i >= 0; i--) {
                if (bullets[i].x < boss.x + boss.width &&
                    bullets[i].x + bullets[i].width > boss.x &&
                    bullets[i].y < boss.y + boss.height &&
                    bullets[i].y + bullets[i].height > boss.y) {
                    boss.health--;
                    bullets.splice(i, 1);
                    playExplosionSound();
                    
                    if (boss.health <= 0) {
                        for (let e = 0; e < 5; e++) {
                            createExplosion(
                                boss.x + Math.random() * boss.width,
                                boss.y + Math.random() * boss.height
                            );
                        }
                        playBossExplosionSound();
                        score += boss.points;
                        boss = null;
                        bossActive = false;
                        phaseTransition = true;
                        phaseTransitionTimer = 120;
                    }
                }
            }
            
            if (boss && ship.x < boss.x + boss.width &&
                ship.x + ship.width > boss.x &&
                ship.y < boss.y + boss.height &&
                ship.y + ship.height > boss.y) {
                createExplosion(ship.x + ship.width / 2, ship.y + ship.height / 2);
                playerDied();
                return;
            }
        }
        
        if (phaseTransition) {
            phaseTransitionTimer--;
            if (phaseTransitionTimer <= 0) {
                currentPhase++;
                enemiesKilledInPhase = 0;
                enemiesToKillForBoss = 10 + currentPhase * 2;
                phaseTransition = false;
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
            const basePoints = Math.round(enemy.points / currentPhase);
            const type = basePoints === 10 ? 0 : basePoints === 20 ? 1 : 2;
            drawPixelEnemy(enemy, type);
        });
        
        if (boss) {
            drawBoss();
        }
        
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
    let mobileUp = false;
    let mobileDown = false;
    let mobileFireInterval = null;
    
    if (isMobile) {
        createMobileControls();
    }
    
    function createMobileControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'mobile-controls';
        controlsContainer.style.cssText = `
            position: fixed; bottom: 20px; left: 0; right: 0;
            display: flex; justify-content: space-between; padding: 0 20px;
            z-index: 1000; pointer-events: none;
        `;
        
        const leftControls = document.createElement('div');
        leftControls.style.cssText = 'display: flex; flex-direction: column; gap: 10px; pointer-events: auto;';
        
        const btnUp = document.createElement('button');
        btnUp.innerHTML = '&#9650;';
        btnUp.style.cssText = `
            width: 60px; height: 60px; font-size: 24px; border-radius: 50%;
            background: rgba(0, 255, 0, 0.3); border: 2px solid #00ff00;
            color: #00ff00; touch-action: manipulation; user-select: none;
        `;
        
        const btnDown = document.createElement('button');
        btnDown.innerHTML = '&#9660;';
        btnDown.style.cssText = btnUp.style.cssText;
        
        const rightControls = document.createElement('div');
        rightControls.style.cssText = 'display: flex; align-items: center; pointer-events: auto;';
        
        const btnFire = document.createElement('button');
        btnFire.innerHTML = 'FIRE';
        btnFire.style.cssText = `
            width: 80px; height: 80px; font-size: 16px; border-radius: 50%;
            background: rgba(255, 0, 0, 0.3); border: 3px solid #ff0000;
            color: #ff0000; font-weight: bold; touch-action: manipulation; user-select: none;
        `;
        
        btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); mobileUp = true; });
        btnUp.addEventListener('touchend', (e) => { e.preventDefault(); mobileUp = false; });
        btnUp.addEventListener('touchcancel', () => { mobileUp = false; });
        
        btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); mobileDown = true; });
        btnDown.addEventListener('touchend', (e) => { e.preventDefault(); mobileDown = false; });
        btnDown.addEventListener('touchcancel', () => { mobileDown = false; });
        
        btnFire.addEventListener('touchstart', (e) => {
            e.preventDefault();
            initAudio();
            shoot();
            mobileFireInterval = setInterval(() => { if (gameRunning) shoot(); }, 200);
        });
        btnFire.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (mobileFireInterval) { clearInterval(mobileFireInterval); mobileFireInterval = null; }
        });
        btnFire.addEventListener('touchcancel', () => {
            if (mobileFireInterval) { clearInterval(mobileFireInterval); mobileFireInterval = null; }
        });
        
        leftControls.appendChild(btnUp);
        leftControls.appendChild(btnDown);
        rightControls.appendChild(btnFire);
        
        controlsContainer.appendChild(leftControls);
        controlsContainer.appendChild(rightControls);
        
        loadingScreen.appendChild(controlsContainer);
    }
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        lastTouchY = e.touches[0].clientY;
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
        if (!isMobile) shoot();
    });
    
    setInterval(() => {
        if (keys['ArrowUp'] || keys['w'] || mobileUp) ship.direction = -1;
        else if (keys['ArrowDown'] || keys['s'] || mobileDown) ship.direction = 1;
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
