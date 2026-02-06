// Sprite assets
let batSprite;
let skeletonSprite;
let vampireSprite;
let skeltonBossSprite;
let boss2Sprite;
let boss3Sprite;
let boss4Sprite;
let playerSprite;
let wallSprite;

// Game objects
let player;
let enemies = [];
let projectiles = [];
let particles = [];
let powerUps = [];
let obstacles = [];

// Systems
let stageManager;

// UI Sliders
let enemyCountSlider;
let enemySpeedSlider;
let enemyForceSlider;
let wanderInfluenceSlider;

// Game state
let gameState = 'menu'; // 'menu', 'playing', 'gameover'
let score = 0;
let gameOver = false;
let spawnTimer = 0;
let bgLayer; // Cache for static background elements

function preload() {
    // Load enemy sprites
    batSprite = loadImage('assets/bat.png');
    skeletonSprite = loadImage('assets/skelton.png');
    vampireSprite = loadImage('assets/vampire.png');

    // Load boss sprites
    skeltonBossSprite = loadImage('assets/skelton_boss.png');
    boss2Sprite = loadImage('assets/boss2.png');
    boss3Sprite = loadImage('assets/boss3.png');
    boss3Sprite = loadImage('assets/boss3.png');
    boss4Sprite = loadImage('assets/boss4.png');

    // Load player sprite
    playerSprite = loadImage('assets/player.png');

    // Load wall sprite
    wallSprite = loadImage('assets/wall.png');
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    createSliders();
    createBackgroundCache(); // Re-create cache on resize
}

function mousePressed() {
    // Start game from menu
    if (gameState === 'menu') {
        // Check if clicked on start button
        let buttonW = 250;
        let buttonH = 60;
        let buttonX = width / 2 - buttonW / 2;
        let buttonY = height / 2 + 130;

        if (mouseX > buttonX && mouseX < buttonX + buttonW &&
            mouseY > buttonY && mouseY < buttonY + buttonH) {
            startGame();
        }
    }
}

function startGame() {
    gameState = 'playing';
    // Game already initialized in setup()
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    textFont('Orbitron');
    createBackgroundCache(); // Create static background cache

    // Create player at center
    player = new Player(width / 2, height / 2);

    // Create stage manager
    stageManager = new StageManager();

    // Create UI sliders
    createSliders();

    // Spawn initial enemies
    spawnEnemies(5);
}

function createSliders() {
    let sliderX = 20;
    let startY = 20;
    let spacing = 70;

    // Enemy count slider (kept for manual adjustment if needed)
    createLabel('Enemy Spawn Rate', sliderX, startY);
    enemyCountSlider = createSlider(3, 15, 8, 1);
    enemyCountSlider.position(sliderX, startY + 25);
    enemyCountSlider.style('width', '200px');
    enemyCountSlider.style('accent-color', 'red');

    // Wander influence slider
    createLabel('Random Walk Influence', sliderX, startY + spacing);
    wanderInfluenceSlider = createSlider(0, 1, 0.2, 0.05);
    wanderInfluenceSlider.position(sliderX, startY + spacing + 25);
    wanderInfluenceSlider.style('width', '200px');
    wanderInfluenceSlider.style('accent-color', 'red');
}

function createLabel(text, x, y) {
    let label = createP(text);
    label.position(x, y);
    label.style('color', 'white');
    label.style('font-size', '14px');
    label.style('margin', '0');
}

////////////

//////////////
function draw() {
    // 1. Draw High-Performance Background
    drawCyberBackground();

    // 2. Enable NEON GLOW effect... REMOVED FOR PERFORMANCE
    // drawingContext.shadowBlur = 15;
    // drawingContext.shadowColor = color(0, 200, 255);

    // Show main menu
    if (gameState === 'menu') {
        // drawingContext.shadowBlur = 20; // Keep slightly for menu if ok, else remove
        showMainMenu();
        // Reset glow for performance/style if needed, but menu usually looks good with it
        return;
    }

    if (gameOver) {
        showGameOver();
        return;
    }

    // Obstacles (Walls)
    // drawingContext.shadowBlur = 10;
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let o = obstacles[i];

        // Update physics/lifespan if method exists (Walls)
        if (o.update) {
            o.update();
        }

        // drawingContext.shadowColor = o.color || 'green';
        o.show();

        // Remove dead obstacles (Walls)
        if (o.isAlive === false) {
            obstacles.splice(i, 1);
        }
    }

    // Reset Default Glow for game entities
    // drawingContext.shadowBlur = 10;
    // drawingContext.shadowColor = 'rgba(255, 255, 255, 0.5)';

    // Update level up flash
    stageManager.updateLevelUpFlash();

    // Update and show player
    player.update();
    player.show();
    player.showUI(projectiles.length);

    // Spawn enemies continuously (unless boss active)
    if (!stageManager.bossActive) {
        maintainEnemyCount();
    }

    // Handle boss if active
    if (stageManager.bossActive && stageManager.currentBoss) {
        let boss = stageManager.currentBoss;

        boss.applyBehaviors(player.pos, wanderInfluenceSlider.value());
        boss.update();
        boss.show();

        // Check collision with player
        if (boss.checkCollision(player)) {
            player.takeDamage(boss.damage);
            if (!player.isAlive) {
                gameOver = true;
            }
        }
    }

    // Update and show enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];

        enemy.applyBehaviors(player.pos, wanderInfluenceSlider.value());
        enemy.update();
        enemy.edges();
        enemy.show();

        // Check collision with player
        if (enemy.checkCollision(player)) {
            player.takeDamage(enemy.damage);
            createExplosion(enemy.pos.x, enemy.pos.y, particles);
            enemies.splice(i, 1);

            if (!player.isAlive) {
                gameOver = true;
            }
        }
    }

    // Update and show projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let projectile = projectiles[i];

        // Homing behavior - track nearest enemy or boss
        let targets = [...enemies];
        if (stageManager.bossActive && stageManager.currentBoss) {
            targets.push(stageManager.currentBoss);
        }
        projectile.trackEnemy(targets);

        projectile.update();
        projectile.show();

        // Check boss collision first
        if (stageManager.bossActive && stageManager.currentBoss) {
            let boss = stageManager.currentBoss;
            if (projectile.checkCollision(boss)) {
                boss.takeDamage(1);
                createExplosion(boss.pos.x, boss.pos.y, particles);
                projectiles.splice(i, 1);

                // Check if boss defeated
                if (!boss.isAlive) {
                    score += boss.scoreValue;
                    createExplosion(boss.pos.x, boss.pos.y, particles);

                    // Drop power-up
                    let powerUp = createRandomPowerUp(boss.pos.x, boss.pos.y);
                    powerUps.push(powerUp);

                    stageManager.onBossDefeated();
                }
                continue;
            }
        }

        if (!projectile.isAlive) {
            projectiles.splice(i, 1);
            continue;
        }

        // Check collision with enemies (AND WALLS?)
        // Projectiles should probably hit walls? 
        // User didn't specify. Assuming walls block enemies. 
        // If projectiles hit walls, they disappear.
        // Let's keep it simple for now (Projectiles pass through Walls? Or hit them?)
        // Standard game logic: Projectiles hit obstacles.
        // But let's verify what 'enemies' collision loop does.

        // ... (no changes to projectile logic requested, sticking to existing flow)

        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            let enemy = enemies[j];

            if (projectile.checkCollision(enemy)) {
                enemy.takeDamage(1);
                createExplosion(enemy.pos.x, enemy.pos.y, particles);
                projectiles.splice(i, 1);

                // If enemy is dead
                if (!enemy.isAlive) {
                    score += enemy.scoreValue;

                    // Splitter enemy special behavior
                    if (enemy instanceof SplitterEnemy) {
                        enemy.split(enemies);
                    }

                    // Drop power-up (20% chance)
                    if (random(1) < 0.2) {
                        let powerUp = createRandomPowerUp(enemy.pos.x, enemy.pos.y);
                        powerUps.push(powerUp);
                    }

                    enemies.splice(j, 1);
                    stageManager.onEnemyKilled();
                }
                break;
            }
        }
    }

    // Update and show particles
    // drawingContext.shadowBlur = 0;
    for (let i = particles.length - 1; i >= 0; i--) {
        let particle = particles[i];

        particle.update();
        particle.show();

        if (!particle.isAlive) {
            particles.splice(i, 1);
        }
    }
    // drawingContext.shadowBlur = 0;

    // Update and show power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        let powerUp = powerUps[i];

        powerUp.update();
        powerUp.show();

        if (!powerUp.isAlive) {
            powerUps.splice(i, 1);
            continue;
        }

        // Check collection
        if (powerUp.checkCollection(player)) {
            powerUps.splice(i, 1);
        }
    }

    // Show UI

    stageManager.showLevelBar(); // Show level progress bar at top
    showControls();
    showBorder(); // Draw border around game area
}

function maintainEnemyCount() {
    let targetCount = enemyCountSlider.value();

    if (enemies.length < targetCount) {
        spawnTimer++;

        // Use dynamic spawn interval from stage manager
        let spawnInterval = stageManager.getSpawnInterval();

        if (spawnTimer >= spawnInterval) {
            spawnEnemies(1);
            spawnTimer = 0;
        }
    }
}

function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        let enemy = stageManager.spawnEnemy();
        enemies.push(enemy);
    }
}



function showControls() {
    push();
    fill(255, 200);
    textSize(14);
    textAlign(RIGHT);
    text('Move: Arrow Keys / WASD', width - 20, height - 80);
    text('Aim: Mouse', width - 20, height - 60);
    text('Shoot: SPACE', width - 20, height - 40);
    text('Spawn Wall: E', width - 20, height - 20);
    text('Restart: R', width - 20, height - 0); // Adjusted Y
    pop();
}

function showBorder() {
    push();
    noFill();
    stroke(100, 100, 255);
    strokeWeight(5);
    rect(2.5, 2.5, width - 5, height - 5);
    pop();
}

function showMainMenu() {
    push();

    // Background handled by drawCyberBackground()

    // Title with glow
    textAlign(CENTER, CENTER);

    // Glow effect
    fill(0, 200, 255, 100);
    textSize(80);
    text('SURVIVAL', width / 2 + 2, height / 2 - 102);
    text('SURVIVAL', width / 2 - 2, height / 2 - 98);

    // Main title
    fill(0, 255, 255);
    textSize(80);
    text('SURVIVAL', width / 2, height / 2 - 100);

    // Subtitle
    fill(255, 215, 0);
    textSize(32);
    text('INFINITE ARENA', width / 2, height / 2 - 40);

    // Instructions
    fill(200);
    textSize(18);
    text('Move: Arrow Keys / WASD', width / 2, height / 2 + 40);
    text('Aim: Mouse  •  Shoot: SPACE', width / 2, height / 2 + 70);

    // Start button
    let buttonW = 250;
    let buttonH = 60;
    let buttonX = width / 2 - buttonW / 2;
    let buttonY = height / 2 + 130;

    // Button hover effect
    let hover = mouseX > buttonX && mouseX < buttonX + buttonW &&
        mouseY > buttonY && mouseY < buttonY + buttonH;

    // Button shadow
    fill(0, 150);
    rect(buttonX + 4, buttonY + 4, buttonW, buttonH, 10);

    // Button background
    if (hover) {
        fill(0, 255, 150);
    } else {
        fill(0, 200, 100);
    }
    stroke(255);
    strokeWeight(3);
    rect(buttonX, buttonY, buttonW, buttonH, 10);

    // Button text
    fill(0);
    noStroke();
    textSize(32);
    text('START GAME', width / 2, buttonY + buttonH / 2);

    // Version / credits
    fill(100);
    textSize(14);
    text('Reach the highest level!', width / 2, height - 30);

    pop();
}

function showGameOver() {
    push();

    // Semi-transparent overlay
    fill(0, 200);
    rect(0, 0, width, height);

    // Game Over text
    fill(255, 0, 0);
    textSize(64);
    textAlign(CENTER, CENTER);
    text('GAME OVER', width / 2, height / 2 - 50);

    // Score
    fill(255);
    textSize(32);
    text(`Final Score: ${score}`, width / 2, height / 2 + 20);
    text(`Reached Level ${stageManager.currentLevel}`, width / 2, height / 2 + 60);

    // Restart instruction
    textSize(20);
    text('Press R to Restart', width / 2, height / 2 + 110);

    pop();
}

function showVictory() {
    push();

    // Semi-transparent overlay
    fill(0, 220);
    rect(0, 0, width, height);

    // Victory text with glow
    fill(255, 215, 0);
    textSize(72);
    textAlign(CENTER, CENTER);
    text('VICTORY!', width / 2, height / 2 - 100);

    // You beat the game
    fill(255);
    textSize(36);
    text('You defeated all 5 bosses!', width / 2, height / 2);

    // Final score
    textSize(48);
    fill(0, 255, 0);
    text(`Final Score: ${score}`, width / 2, height / 2 + 60);

    // Restart
    fill(255, 200);
    textSize(20);
    text('Press R to Play Again', width / 2, height / 2 + 120);

    // Congratulations
    fill(255, 215, 0, 150 + sin(frameCount * 0.1) * 100);
    textSize(24);
    text('🎉 Congratulations! 🎉', width / 2, height / 2 + 170);

    pop();
}

function keyPressed() {
    // Shoot projectile on SPACE
    if (key === ' ' && !gameOver) {
        player.shoot(projectiles);
    }

    // Spawn Wall on E
    if ((key === 'e' || key === 'E') && !gameOver) {
        player.spawnWall(obstacles);
    }

    // Restart on R
    if (key === 'r' || key === 'R') {
        restartGame();
    }
    if (key === 'd' || key === 'D') {
        Vehicle.debug = !Vehicle.debug;
        // console.log("Debug mode:", Vehicle.debug);
    }
}

function restartGame() {
    // Reset game state
    player = new Player(width / 2, height / 2);
    enemies = [];
    projectiles = [];
    particles = [];
    powerUps = [];
    score = 0;
    gameOver = false;
    spawnTimer = 0;

    // Reset stage manager
    stageManager.reset();

    // Spawn initial enemies
    spawnEnemies(5);
}

function createBackgroundCache() {
    bgLayer = createGraphics(width, height);
    bgLayer.noStroke();

    // Deep dark blue background
    bgLayer.background(5, 5, 16);

    // Pre-render Vignette
    let ctx = bgLayer.drawingContext;
    let gradient = ctx.createRadialGradient(width / 2, height / 2, height / 3, width / 2, height / 2, height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)'); // Transparent center
    gradient.addColorStop(1, 'rgba(0,0,0,0.85)'); // Dark edges

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function drawCyberBackground() {
    // 1. Draw cached static background (fast!)
    image(bgLayer, 0, 0);

    push();
    // Grid settings (Dynamic part)
    stroke(30, 60, 100, 50); // Faint blue lines
    strokeWeight(1);

    let gridSize = 60;

    // Draw Grid
    for (let x = 0; x <= width; x += gridSize) {
        line(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
        line(0, y, width, y);
    }

    // Moving Scanline effect
    let scanY = (frameCount * 2) % height;
    stroke(0, 255, 255, 30);
    strokeWeight(2);
    line(0, scanY, width, scanY);

    pop();
}
