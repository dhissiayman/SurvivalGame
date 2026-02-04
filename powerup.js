// Base PowerUp class
class PowerUp {
    constructor(x, y, type) {
        this.pos = createVector(x, y);
        this.type = type;
        this.r = 12;
        this.isAlive = true;
        this.lifespan = 600; // Disappears after 10 seconds if not collected

        // Floating animation
        this.floatOffset = random(TWO_PI);

        // PERMANENT - no duration limit!
        this.isPermanent = true;
    }

    update() {
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
        this.speedBoost = 2; // Additive boost
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
    let types = [
        SpeedPowerUp,
        FireRatePowerUp,
        MultiShotPowerUp,
        ShieldPowerUp,
        HealthPowerUp
    ];

    let PowerUpClass = random(types);
    return new PowerUpClass(x, y);
}
