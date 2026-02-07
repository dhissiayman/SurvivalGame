// Infinite Level Progression System
class StageManager {
    constructor() {
        this.currentLevel = 1;
        this.totalKills = 0;
        this.killsThisLevel = 0;
        this.killsRequiredForLevel = 20; // Kills needed for level 1

        // Boss system
        this.bossActive = false;
        this.currentBoss = null;

        // Difficulty scaling
        this.baseEnemySpeed = 2;
        this.baseSpawnRate = 60;
        this.difficultyMultiplier = 1.0;

        // Horde System
        this.hordeTimer = 0;
        this.nextHordeTime = 600; // First horde after 10 seconds
        this.hordeTriggered = false;
        // Audio
        this.levelUpSound = new Audio('assets/audio/final-fantasy-vii-victory-fanfare-1.mp3');
        this.levelUpSound.volume = 0.6; // Louder for victory event

        this.bossMusic = new Audio('assets/audio/Final_Fantasy_Final_Boss_Music_-_Final_Fantasy_X_Jecht_KLICKAUD.mp3');
        this.bossMusic.volume = 0.5;
        this.bossMusic.loop = true;
    }

    getEnemyTypes() {
        // Unlock more enemy types as player progresses
        // Removed FlockingEnemy from here - they are now special events
        let types = [Enemy];

        if (this.currentLevel >= 10) {
            types.push(TankEnemy, SplitterEnemy);
        } else if (this.currentLevel >= 5) {
            types.push(TankEnemy);
        }

        return types;
    }

    update() {
        // Manage periodic events like Hordes
        if (!this.bossActive) {
            this.hordeTimer++;
            if (this.hordeTimer >= this.nextHordeTime) {
                this.triggerHorde();
                this.hordeTimer = 0;
                this.nextHordeTime = random(600, 1200); // Random interval 10-20 seconds
            }
        }

        this.updateLevelUpFlash();
    }

    triggerHorde() {
        this.hordeTriggered = true;
        // Silent spawn - no visual warning requested
    }

    checkHordeTriggered() {
        if (this.hordeTriggered) {
            this.hordeTriggered = false;
            return true;
        }
        return false;
    }

    spawnBatHorde() {
        // Called by sketch when a horde triggers
        let hordeSize = floor(random(7, 12)); // Reduced from 15-25 for performance
        let horde = [];

        // Pick a random side for the WHOLE horde to enter from
        let edge = floor(random(4));
        let startX, startY;

        for (let i = 0; i < hordeSize; i++) {
            // Scatter them around a center point off-screen
            switch (edge) {
                case 0: startX = random(width); startY = -50 - random(100); break;
                case 1: startX = width + 50 + random(100); startY = random(height); break;
                case 2: startX = random(width); startY = height + 50 + random(100); break;
                case 3: startX = -50 - random(100); startY = random(height); break;
            }

            let enemy = new FlockingEnemy(startX, startY);

            // Aim them roughly towards center so they cross the screen
            let center = createVector(width / 2, height / 2);
            let dir = p5.Vector.sub(center, createVector(startX, startY));
            enemy.vel = dir.copy().normalize().mult(enemy.maxSpeed);

            horde.push(enemy);
        }
        return horde;
    }

    spawnEnemy() {
        // Spawn at random edge
        let x, y;
        let edge = floor(random(4));

        switch (edge) {
            case 0: x = random(width); y = -20; break;
            case 1: x = width + 20; y = random(height); break;
            case 2: x = random(width); y = height + 20; break;
            case 3: x = -20; y = random(height); break;
        }

        // Select random enemy type for this level
        let enemyTypes = this.getEnemyTypes();
        let EnemyClass = random(enemyTypes);

        let enemy = new EnemyClass(x, y);

        // Scale enemy difficulty
        enemy.maxSpeed *= this.difficultyMultiplier;
        enemy.damage = floor(enemy.damage * this.difficultyMultiplier);
        enemy.health = floor(enemy.health * (1 + (this.currentLevel - 1) * 0.1));

        return enemy;
    }

    spawnBoss() {
        // Spawn at center
        let x = width / 2;
        let y = height / 2;

        // Cycle through bosses (levels 5, 10, 15, 20 => Boss1-4, then repeat)
        let bossIndex = floor((this.currentLevel / 5) - 1) % 4;

        switch (bossIndex) {
            case 0: this.currentBoss = new Boss1(x, y); break;
            case 1: this.currentBoss = new Boss2(x, y); break;
            case 2: this.currentBoss = new Boss3(x, y); break;
            case 3: this.currentBoss = new Boss4(x, y); break;
        }

        this.bossActive = true;

        // Switch music to Boss Theme
        if (this.levelUpSound) {
            this.levelUpSound.pause();
            this.levelUpSound.currentTime = 0;
        }
        if (typeof window.battleTheme !== 'undefined' && window.battleTheme) {
            window.battleTheme.pause();
        }
        if (this.bossMusic) {
            this.bossMusic.currentTime = 0;
            this.bossMusic.play().catch(e => console.log("Boss music failed:", e));
        }

        // Boss announcement flash
        this.showLevelUpFlash = true;
        this.levelUpFlashTimer = 120; // 2 seconds
    }

    onEnemyKilled() {
        this.killsThisLevel++;
        this.totalKills++;

        // Check if level complete (BUT ONLY IF NO BOSS ACTIVE)
        // If boss is active, level up happens when boss dies (onBossDefeated)
        if (!this.bossActive && this.killsThisLevel >= this.getKillsRequired()) {
            this.levelUp();
        }
    }

    onBossDefeated() {
        this.bossActive = false;
        this.currentBoss = null;

        // Stop Boss Theme
        if (this.bossMusic) {
            this.bossMusic.pause();
            this.bossMusic.currentTime = 0;
        }
        // Note: Battle theme will resume after levelUp calls (which happens after this? No, wait)
        // onBossDefeated is called, THEN what? 
        // In sketch.js: stageManager.onBossDefeated() is called. 
        // Then loop continues.
        // We probably need to trigger levelUp() here OR play victory sound here?
        // Ah, in sketch.js, after onBossDefeated(), nothing calls levelUp().
        // BUT, usually boss kill = level completed?
        // Let's check sketch.js logic.
        // If boss dead -> score++, explosion, powerup, onBossDefeated().
        // Does onBossDefeated call levelUp? No.
        // Wait, Boss IS the level. Beating boss SHOULD trigger level UP.
        // I should call levelUp() inside onBossDefeated() or right after.
        // Let's look at levelUp(). It increments level.
        // YES. So beating boss -> Level Up.

        this.levelUp(); // Trigger level up (which plays fanfare + resumes normal theme later)

        // Boss defeated flash
        this.showLevelUpFlash = true;
        this.levelUpFlashTimer = 90;
    }

    getKillsRequired() {
        // Kills required scales: 20, 25, 30, 35...
        return floor(this.killsRequiredForLevel + (this.currentLevel - 1) * 5);
    }

    getLevelProgress() {
        // Return 0-1 progress through current level
        return this.killsThisLevel / this.getKillsRequired();
    }

    levelUp() {
        this.currentLevel++;
        this.killsThisLevel = 0;

        // Play victory sound ONLY if NOT a boss level
        // (If boss level, we want immediate transition to Boss Music)
        if (this.currentLevel % 5 !== 0 && this.levelUpSound) {
            // STOP ALL OTHER MUSIC
            if (this.bossMusic) {
                this.bossMusic.pause();
                this.bossMusic.currentTime = 0;
            }
            if (typeof window.battleTheme !== 'undefined' && window.battleTheme) {
                window.battleTheme.pause();
            }

            this.levelUpSound.currentTime = 0;
            this.levelUpSound.play().catch(e => console.log("Audio play failed:", e));

            // Resume battle theme when victory sound ends
            this.levelUpSound.onended = () => {
                // Ensure boss music is definitely off
                if (this.bossMusic) this.bossMusic.pause();

                // Resume Standard Theme
                if (typeof window.battleTheme !== 'undefined' && window.battleTheme) {
                    window.battleTheme.play().catch(e => console.log("Resume theme failed:", e));
                }
            };
        }

        // Increase difficulty
        this.difficultyMultiplier = 1 + (this.currentLevel - 1) * 0.15;

        // Check if boss level (every 5 levels)
        if (this.currentLevel % 5 === 0) {
            this.spawnBoss();
        } else {
            // Visual feedback (flash)
            this.showLevelUpFlash = true;
            this.levelUpFlashTimer = 60; // 1 second
        }
    }

    updateLevelUpFlash() {
        if (this.showLevelUpFlash) {
            this.levelUpFlashTimer--;

            if (this.levelUpFlashTimer <= 0) {
                this.showLevelUpFlash = false;
            }
        }
    }

    getSpawnInterval() {
        // Spawn rate increases with level
        return max(20, this.baseSpawnRate - this.currentLevel * 2);
    }

    showLevelBar() {
        push();

        // Level number (top center)
        fill(255, 215, 0);
        textSize(28);
        textAlign(CENTER, CENTER);

        if (this.bossActive) {
            text(`LEVEL ${this.currentLevel} - BOSS FIGHT!`, width / 2, 25);
        } else {
            text(`LEVEL ${this.currentLevel}`, width / 2, 25);
        }

        // Progress bar (only show if not boss active)
        if (!this.bossActive) {
            let barWidth = 400;
            let barHeight = 25;
            let barX = width / 2 - barWidth / 2;
            let barY = 50;

            // Background
            fill(30);
            stroke(255, 215, 0);
            strokeWeight(2);
            rect(barX, barY, barWidth, barHeight);

            // Progress fill
            let progress = this.getLevelProgress();
            noStroke();
            fill(255, 215, 0);
            rect(barX, barY, barWidth * progress, barHeight);

            // Text (kills)
            fill(0);
            textSize(16);
            text(`${this.killsThisLevel} / ${this.getKillsRequired()}`,
                width / 2, barY + barHeight / 2);
        }

        // Level up / Boss flash
        if (this.showLevelUpFlash) {
            let alpha = map(this.levelUpFlashTimer, 0, 120, 0, 200);
            fill(255, 215, 0, alpha);
            rect(0, 0, width, height);

            fill(255, alpha * 2);
            textSize(64);
            if (this.bossActive && this.levelUpFlashTimer > 60) {
                text('BOSS INCOMING!', width / 2, height / 2);
            } else if (!this.bossActive && this.levelUpFlashTimer < 30) {
                text('BOSS DEFEATED!', width / 2, height / 2);
            } else {
                text('LEVEL UP!', width / 2, height / 2);
            }
        }

        pop();
    }

    reset() {
        this.currentLevel = 1;
        this.totalKills = 0;
        this.killsThisLevel = 0;
        this.difficultyMultiplier = 1.0;
        this.showLevelUpFlash = false;
        this.bossActive = false;
        this.currentBoss = null;
        this.hordeTimer = 0;

        // Reset Audio
        if (this.bossMusic) {
            this.bossMusic.pause();
            this.bossMusic.currentTime = 0;
        }
    }
}
