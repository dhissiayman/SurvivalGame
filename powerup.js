// Base PowerUp class
class PowerUp extends Vehicle {
    constructor(x, y, type) {
        super(x, y);
        this.type = type;
        this.r = 12;
        this.isAlive = true;
        this.lifespan = 600; // Disappears after 10 seconds if not collected

        // Physics properties for magnet effect
        this.maxSpeed = 8; // Fast attraction
        this.maxForce = 0.5; // Strong pull
        this.friction = 0.95; // Air resistance

        // Floating animation
        this.floatOffset = random(TWO_PI);

        // PERMANENT - no duration limit!
        this.isPermanent = true;
    }

    update() {
        // Magnet Effect: Seek player if close
        if (player && player.isAlive) {
            let d = p5.Vector.dist(this.pos, player.pos);
            let magnetRange = 150;

            if (d < magnetRange) {
                // Stronger pull when closer
                let force = this.seek(player.pos);
                // Ramp up force as distance decreases
                let strength = map(d, 0, magnetRange, 2, 0.5);
                force.mult(strength);
                this.applyForce(force);
            }
        }

        // Apply physics
        super.update();

        // Apply friction (drag) so it doesn't float away forever
        this.vel.mult(this.friction);

        this.lifespan--;
        if (this.lifespan <= 0) {
            this.isAlive = false;
        }
    }

    checkCollection(player) {
        let d = p5.Vector.dist(this.pos, player.pos);
        if (d < this.r + player.r) {
            this.activate(player);
            return true;
        }
        return false;
    }

    activate(player) {
        // Override in subclasses
    }

    show() {
        push();

        // Floating effect
        let floatY = sin(frameCount * 0.05 + this.floatOffset) * 5;

        // Glow
        noStroke();
        fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], 50);
        circle(this.pos.x, this.pos.y + floatY, this.r * 3);

        // Main circle
        fill(this.color);
        stroke(255);
        strokeWeight(2);
        circle(this.pos.x, this.pos.y + floatY, this.r * 2);

        // Icon (override in subclasses)
        this.showIcon(floatY);

        pop();
    }

    showIcon(floatY) {
        // Override in subclasses
    }
}

// Speed Boost - PERMANENT
class SpeedPowerUp extends PowerUp {
    constructor(x, y) {
        super(x, y, 'speed');
        this.color = color(0, 255, 255);
        this.speedBoost = 1; // Additive boost
    }

    activate(player) {
        player.applyPermanentPowerUp('speed', this.speedBoost);
    }

    showIcon(floatY) {
        push();
        fill(255);
        stroke(0);
        strokeWeight(1);
        textAlign(CENTER, CENTER);
        textSize(16);
        text('S', this.pos.x, this.pos.y + floatY);
        pop();
    }
}

// Fire Rate Boost - PERMANENT
class FireRatePowerUp extends PowerUp {
    constructor(x, y) {
        super(x, y, 'firerate');
        this.color = color(255, 100, 0);
        this.fireRateReduction = 2; // Reduces delay by 2 frames
    }

    activate(player) {
        player.applyPermanentPowerUp('firerate', this.fireRateReduction);
    }

    showIcon(floatY) {
        push();
        fill(255);
        stroke(0);
        strokeWeight(1);
        textAlign(CENTER, CENTER);
        textSize(16);
        text('F', this.pos.x, this.pos.y + floatY);
        pop();
    }
}

// Multi-Shot - PERMANENT (adds 1 more shot)
class MultiShotPowerUp extends PowerUp {
    constructor(x, y) {
        super(x, y, 'multishot');
        this.color = color(255, 255, 0);
    }

    activate(player) {
        player.applyPermanentPowerUp('multishot', 1);
    }

    showIcon(floatY) {
        push();
        fill(255);
        stroke(0);
        strokeWeight(1);
        textAlign(CENTER, CENTER);
        textSize(16);
        text('M', this.pos.x, this.pos.y + floatY);
        pop();
    }
}

// Shield - PERMANENT
class ShieldPowerUp extends PowerUp {
    constructor(x, y) {
        super(x, y, 'shield');
        this.color = color(0, 200, 255);
    }

    activate(player) {
        player.hasShield = true;
        player.shieldCount = (player.shieldCount || 0) + 1;
    }

    showIcon(floatY) {
        push();
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(20);
        text('🛡', this.pos.x, this.pos.y + floatY);
        pop();
    }
}

// Health Restore
class HealthPowerUp extends PowerUp {
    constructor(x, y) {
        super(x, y, 'health');
        this.color = color(0, 255, 0);
        this.healAmount = 30;
    }

    activate(player) {
        player.health = min(player.health + this.healAmount, player.maxHealth);
    }

    showIcon(floatY) {
        push();
        fill(255);
        stroke(0);
        strokeWeight(2);
        // Draw cross
        line(this.pos.x - 6, this.pos.y + floatY,
            this.pos.x + 6, this.pos.y + floatY);
        line(this.pos.x, this.pos.y + floatY - 6,
            this.pos.x, this.pos.y + floatY + 6);
        pop();
    }
}

class WanderPowerUp extends PowerUp {
    constructor(x, y) {
        super(x, y, 'wander');
        this.color = color(255, 0, 0);
    }

    activate(player) {
        player.applyPermanentPowerUp('wander', 1);
    }

    showIcon(floatY) {
        push();
        fill(255);
        stroke(0);
        strokeWeight(1);
        textAlign(CENTER, CENTER);
        textSize(16);
        text('W', this.pos.x, this.pos.y + floatY);
        pop();
    }
}

// Factory function to create random power-ups
function createRandomPowerUp(x, y) {
    let types = [];

    // Permanent Upgrades (LIMIT to ~13 pickups each)
    // Speed: +1 per pickup -> Max 16 total speed (Base 10 + 6)
    if (player && player.speedBonus < 6) {
        types.push(SpeedPowerUp);
    }
    // Fire Rate: +2 per pickup -> Max 26
    if (player && player.fireRateBonus < 26) {
        types.push(FireRatePowerUp);
    }
    // MultiShot: +1 per pickup -> Max 13
    if (player && player.shotBonus < 13) {
        types.push(MultiShotPowerUp);
    }

    // Always available (Consumables / Survival)
    types.push(ShieldPowerUp);
    types.push(HealthPowerUp);

    // Make utility items slightly more common if upgrades are maxed?
    // For now, equal probability among available types

    let PowerUpClass = random(types);
    return new PowerUpClass(x, y);
}
