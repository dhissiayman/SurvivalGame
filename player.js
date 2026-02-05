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
        }
    }

    update() {
        // Keyboard movement with arrow keys or WASD
        // Instead of setting pos directly, we set velocity
        // Vehicle.update() will handle pos.add(vel)

        let currentSpeed = this.baseSpeed + this.speedBonus;
        // Reset velocity every frame for responsive arcade controls (no drift)
        this.vel.mult(0);
        this.acc.mult(0); // Clear forces unless we want some recoil later

        // Check arrow keys (or WASD)
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // A
            this.vel.x = -currentSpeed;
        }
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // D
            this.vel.x = currentSpeed;
        }
        if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // W
            this.vel.y = -currentSpeed;
        }
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // S
            this.vel.y = currentSpeed;
        }

        // Normalize diagonal movement
        if (this.vel.mag() > 0) {
            this.vel.normalize();
            this.vel.mult(currentSpeed);
        }

        // Apply physics (Vehicle update)
        // pos += vel
        super.update();

        // Keep player on screen (Constraint layout instead of Vehicle.edges wrapping)
        this.pos.x = constrain(this.pos.x, this.r, width - this.r);
        this.pos.y = constrain(this.pos.y, this.r, height - this.r);

        // Update cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
    }

    shoot(projectiles) {
        let shootDelay = max(3, this.baseShootDelay - this.fireRateBonus); // Min 3 frames

        if (this.shootCooldown <= 0) {
            // Shoot toward mouse
            let direction = createVector(mouseX - this.pos.x, mouseY - this.pos.y);
            direction.normalize();

            let totalShots = 1 + this.shotBonus;

            if (totalShots === 1) {
                // Single shot
                let projectile = new Projectile(this.pos.x, this.pos.y, direction);
                projectiles.push(projectile);
            } else {
                // Multi-shot (spread)
                let spreadAngle = PI / 6; // 30 degrees spread
                for (let i = 0; i < totalShots; i++) {
                    let angle = direction.heading() +
                        map(i, 0, totalShots - 1, -spreadAngle, spreadAngle);
                    let dir = p5.Vector.fromAngle(angle);
                    let projectile = new Projectile(this.pos.x, this.pos.y, dir);
                    projectiles.push(projectile);
                }
            }

            this.shootCooldown = shootDelay;
        }
    }

    takeDamage(amount) {
        if (this.hasShield && this.shieldCount > 0) {
            // Shield absorbs damage and loses 1 charge
            this.shieldCount--;

            // Deactivate shield if no charges left
            if (this.shieldCount <= 0) {
                this.hasShield = false;
                this.shieldCount = 0;
            }
            return; // No damage taken
        }

        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
        }
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);

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

    showUI() {
        push();

        // Health text
        fill(255);
        textSize(20);
        textAlign(LEFT);
        text(`Health: ${this.health}`, 20, height - 30);

        // Power-up bonuses (PERMANENT!)
        textSize(14);
        let yOffset = 0;

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
