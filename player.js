class Player extends Vehicle {
    constructor(x, y) {
        super(x, y);
        this.r = 20;
        this.baseSpeed = 10;
        this.maxSpeed = 10; // Sync with baseSpeed
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.isAlive = true;

        // Shooting properties
        this.shootCooldown = 0;
        this.baseShootDelay = 15; // frames between shots
        this.shotCount = 1; // Number of projectiles per shot

        // Permanent power-up bonuses (stack forever!)
        this.speedBonus = 0;
        this.fireRateBonus = 0;
        this.shotBonus = 0;
        this.hasShield = false;
        this.shieldCount = 0;

        // Wall spawn ability
        this.wallCooldown = 0;
        this.wallMaxCooldown = 360; // 6 seconds (60fps)

        // Steering configuration for player
        this.maxForce = 1.5; // High max force for responsive controls
        this.friction = 0.1; // To stop when no keys pressed

        // Limit number of projectiles to avoid clutter
        this.maxProjectilesOnScreen = 30;

        // Audio
        this.shootSound = new Audio('assets/audio/shoot.m4a');
        this.shootSound.volume = 0.4; // Adjusted for better mix

        // Invulnerability Logic
        this.invulnerabilityTimer = 0;
        this.invulnerabilityDuration = 60; // 1 second of i-frames
    }

    applyPermanentPowerUp(type, value) {
        switch (type) {
            case 'speed':
                this.speedBonus += value;
                // Update max speed
                this.maxSpeed = this.baseSpeed + this.speedBonus;
                break;
            case 'firerate':
                this.fireRateBonus += value;
                break;
            case 'multishot':
                this.shotBonus += value;
                break;
            case 'wander':
                // Handled in behavior logic
                break;
        }
    }

    spawnWall(obstacles) {
        if (this.wallCooldown <= 0) {
            // Direction based on mouse (where player is looking)
            let dir = createVector(mouseX - this.pos.x, mouseY - this.pos.y);
            dir.normalize();

            // Spawn distance in front of player
            let spawnDist = 60;
            let spawnPos = p5.Vector.add(this.pos, p5.Vector.mult(dir, spawnDist));

            // Create Wall
            obstacles.push(new Wall(spawnPos.x, spawnPos.y));

            // Start cooldown
            this.wallCooldown = this.wallMaxCooldown;
        }
    }

    update() {
        // Keyboard movement - Force based (Steering Behavior)
        // Desired velocity based on input
        let currentSpeed = this.baseSpeed + this.speedBonus;
        let input = createVector(0, 0);

        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // A
            input.x = -1;
        }
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // D
            input.x = 1;
        }
        if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // W
            input.y = -1;
        }
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // S
            input.y = 1;
        }

        // Normalize input to get direction and apply speed
        if (input.mag() > 0) {
            input.normalize();
            input.mult(currentSpeed); // This is our DESIRED velocity

            // Reynolds Steering Formula: Steer = Desired - Velocity
            let steer = p5.Vector.sub(input, this.vel);
            steer.limit(this.maxForce);
            this.applyForce(steer);
        } else {
            // Braking force (Friction) when no input
            let brake = this.vel.copy();
            brake.normalize();
            brake.mult(-1); // Opposite to velocity
            brake.setMag(this.maxForce); // Brake with max force

            // Limit braking to not overshoot 0 (simple damping)
            if (this.vel.mag() < this.maxForce) {
                this.vel.mult(0);
            } else {
                this.applyForce(brake);
            }
        }

        // Apply boundary force instead of hard constrain
        // boundaries(bx, by, bw, bh, d)
        let boundaryForce = this.boundaries(0, 0, width, height, 40);
        boundaryForce.mult(2); // Stronger boundary force for player
        this.applyForce(boundaryForce);

        // Physics update (Vehicle)
        super.update();

        // Update cooldowns
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        if (this.wallCooldown > 0) {
            this.wallCooldown--;
        }
        if (this.invulnerabilityTimer > 0) {
            this.invulnerabilityTimer--;
        }
    }

    shoot(projectiles) {
        // Calculate available slots
        let availableSlots = this.maxProjectilesOnScreen - projectiles.length;
        if (availableSlots <= 0) {
            return;
        }

        let shootDelay = max(3, this.baseShootDelay - this.fireRateBonus); // Min 3 frames

        if (this.shootCooldown <= 0) {
            // Shoot toward mouse
            if (projectiles.length >= this.maxProjectilesOnScreen) {
                return;
            }

            let direction = createVector(mouseX - this.pos.x, mouseY - this.pos.y);
            direction.normalize();

            // Calculate potential shots
            let desiredShots = 1 + this.shotBonus;

            // Limit by available slots
            let totalShots = min(desiredShots, availableSlots);

            if (totalShots > 0) {
                if (totalShots === 1) {
                    // Single shot
                    let projectile = new Projectile(this.pos.x, this.pos.y, direction);
                    projectiles.push(projectile);
                } else {
                    // Multi-shot (spread)
                    let spreadAngle = PI / 6; // 30 degrees spread
                    for (let i = 0; i < totalShots; i++) {
                        // Avoid division by zero if totalShots is 1 (though handled by if/else above)
                        let angleOffset = map(i, 0, totalShots - 1, -spreadAngle, spreadAngle);
                        let angle = direction.heading() + angleOffset;

                        let dir = p5.Vector.fromAngle(angle);
                        let projectile = new Projectile(this.pos.x, this.pos.y, dir);
                        projectiles.push(projectile);
                    }
                }

                // Play shoot sound
                if (this.shootSound) {
                    // Use cloneNode to allow overlapping sounds
                    let soundClone = this.shootSound.cloneNode(true);
                    soundClone.volume = this.shootSound.volume;
                    soundClone.play().catch(e => { /* Ignore autoplay errors */ });
                }

                this.shootCooldown = shootDelay;
            }
        }
    }

    takeDamage(amount) {
        // Check invulnerability
        if (this.invulnerabilityTimer > 0) {
            return;
        }

        if (this.hasShield && this.shieldCount > 0) {
            // Shield absorbs damage and loses 1 charge
            this.shieldCount--;

            // Deactivate shield if no charges left
            if (this.shieldCount <= 0) {
                this.hasShield = false;
                this.shieldCount = 0;
            }
            // Trigger i-frames even on shield hit to prevent instant shield drain
            this.invulnerabilityTimer = this.invulnerabilityDuration;
            return; // No damage taken
        }

        this.health -= amount;

        // Trigger invulnerability
        this.invulnerabilityTimer = this.invulnerabilityDuration;

        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
        }
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);

        // Invulnerability Flash (don't draw every frame)
        if (this.invulnerabilityTimer > 0 && frameCount % 4 < 2) {
            // Skip drawing sprite to create flash effect
            // But still draw health bar?
            // Actually, usually the whole sprite flashes.
        } else {

            // Shield effect
            if (this.hasShield) {
                noFill();
                stroke(0, 255, 255);
                strokeWeight(3);
                let shieldSize = this.r * 3 + sin(frameCount * 0.1) * 5;
                circle(0, 0, shieldSize);
            }

            // Draw Player Sprite
            if (playerSprite) {
                imageMode(CENTER);
                // Draw slightly larger than hit circle for visual appeal
                let displaySize = this.r * 2.5;

                // Flip sprite if moving left
                if (this.vel.x < 0) {
                    push();
                    scale(-1, 1);
                    image(playerSprite, 0, 0, displaySize, displaySize);
                    pop();
                } else {
                    image(playerSprite, 0, 0, displaySize, displaySize);
                }
            } else {
                // Fallback if sprite not loaded (debug)
                fill(0, 255, 0);
                circle(0, 0, this.r * 2);
            }
        }

        // Draw health bar above character (modern design)
        let barWidth = 60;
        let barHeight = 10;
        let barY = -this.r - 15;

        // Shadow effect
        fill(0, 100);
        noStroke();
        rect(-barWidth / 2 + 2, barY + 2, barWidth, barHeight, 5);

        // Background (darker with border)
        fill(40);
        stroke(255, 100);
        strokeWeight(1.5);
        rect(-barWidth / 2, barY, barWidth, barHeight, 5);

        // Health fill with gradient effect
        let healthWidth = map(this.health, 0, this.maxHealth, 0, barWidth);
        noStroke();

        // Color based on health percentage
        let healthPercent = this.health / this.maxHealth;
        if (healthPercent > 0.6) {
            // Green gradient
            fill(0, 255, 100);
        } else if (healthPercent > 0.3) {
            // Yellow/Orange
            fill(255, 200, 0);
        } else {
            // Red (critical)
            fill(255, 50, 50);
        }
        rect(-barWidth / 2, barY, healthWidth, barHeight, 5);

        // Shine effect on top
        fill(255, 255, 255, 80);
        rect(-barWidth / 2, barY, healthWidth, barHeight / 2, 5);

        // Heart icon next to bar
        fill(255, 50, 80);
        noStroke();
        // Simple heart shape
        circle(-barWidth / 2 - 10, barY + 3, 6);
        circle(-barWidth / 2 - 6, barY + 3, 6);
        triangle(-barWidth / 2 - 13, barY + 4,
            -barWidth / 2 - 3, barY + 4,
            -barWidth / 2 - 8, barY + 10);

        pop();
    }

    showUI(projectileCount = 0) {
        push();



        // Power-up bonuses (PERMANENT!)
        textSize(14);
        let yOffset = 0;

        // AMMO BAR (Projectiles)
        // Show remaining capacity
        let currentAmmo = max(0, this.maxProjectilesOnScreen - projectileCount);
        let maxAmmo = this.maxProjectilesOnScreen;
        let ammoRatio = currentAmmo / maxAmmo;

        let barW = 150;
        let barH = 10;
        let barX = 20;
        let barY = height - 90; // Position above other UI elements

        // Label
        fill(255);
        noStroke();
        text(`MISSILES: ${currentAmmo}/${maxAmmo}`, barX, barY - 5);

        // Background bar
        fill(50);
        stroke(100);
        rect(barX, barY, barW, barH);

        // Fill bar
        noStroke();
        if (ammoRatio > 0.5) fill(0, 255, 255); // Cyan
        else if (ammoRatio > 0.2) fill(255, 200, 0); // Warning
        else fill(255, 50, 50); // Critical

        rect(barX, barY, barW * ammoRatio, barH);

        yOffset += 70; // Shift other elements up significantly to clear the Ammo Bar

        // Wall Ability Status
        let wallStatus = this.wallCooldown <= 0 ? "READY [E]" : `COOLDOWN (${ceil(this.wallCooldown / 60)}s)`;
        let wallColor = this.wallCooldown <= 0 ? color(0, 255, 0) : color(255, 0, 0);
        fill(wallColor);
        text(`WALL: ${wallStatus}`, 20, height - 60 - yOffset);
        yOffset += 20;

        if (this.speedBonus > 0) {
            fill(0, 255, 255);
            text(`SPEED +${this.speedBonus}`, 20, height - 60 - yOffset);
            yOffset += 20;
        }

        if (this.fireRateBonus > 0) {
            fill(255, 150, 0);
            text(`FIRE RATE +${this.fireRateBonus}`, 20, height - 60 - yOffset);
            yOffset += 20;
        }

        if (this.shotBonus > 0) {
            fill(255, 255, 0);
            text(`SHOTS: ${1 + this.shotBonus}`, 20, height - 60 - yOffset);
            yOffset += 20;
        }

        if (this.hasShield) {
            fill(0, 200, 255);
            text(`SHIELD x${this.shieldCount}`, 20, height - 60 - yOffset);
            yOffset += 20;
        }

        pop();
    }
}
