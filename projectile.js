class Projectile extends Vehicle {
    constructor(x, y, direction) {
        super(x, y);
        this.vel = direction.copy();
        this.vel.mult(8); // initial projectile speed

        this.r = 5;
        this.isAlive = true;

        // Homing properties
        this.maxSpeed = 10;
        this.maxForce = 0.3;
        this.homingEnabled = true;
    }

    // Seek implemented in Vehicle

    // ApplyForce implemented in Vehicle

    // Find and track nearest enemy (only on screen)
    trackEnemy(enemies) {
        if (!this.homingEnabled) return;

        // Find nearest target that is ON SCREEN
        let nearest = null;
        let minDist = Infinity;

        // Check all enemies, but only if they're visible on screen
        for (let enemy of enemies) {
            // Check if enemy is on screen
            let onScreen = enemy.pos.x >= 0 && enemy.pos.x <= width &&
                enemy.pos.y >= 0 && enemy.pos.y <= height;

            if (onScreen) {
                let d = p5.Vector.dist(this.pos, enemy.pos);
                if (d < minDist) {
                    minDist = d;
                    nearest = enemy;
                }
            }
        }

        // Seek nearest on-screen target
        if (nearest) {
            let seekForce = this.seek(nearest.pos);
            this.applyForce(seekForce);
        }
    }

    update() {
        // Vehicle update (physics)
        super.update();

        // Remove if off screen (Override behavior: delete instead of wrap or constraint)
        if (this.pos.x < 0 || this.pos.x > width ||
            this.pos.y < 0 || this.pos.y > height) {
            this.isAlive = false;
        }
    }

    checkCollision(enemy) {
        let d = p5.Vector.dist(this.pos, enemy.pos);
        if (d < this.r + enemy.r) {
            return true;
        }
        return false;
    }

    show() {
        push();

        fill(255);
        noStroke();
        circle(this.pos.x, this.pos.y, this.r * 2);

        // Trail effect
        fill(255, 150);
        circle(this.pos.x - this.vel.x * 0.1, this.pos.y - this.vel.y * 0.1, this.r * 1.5);

        // Draw velocity vector (direction indicator)
        if (this.vel.mag() > 0) {
            stroke(255, 100);
            strokeWeight(2);
            let vel = this.vel.copy().normalize().mult(10);
            line(this.pos.x, this.pos.y, this.pos.x + vel.x, this.pos.y + vel.y);
        }

        pop();
    }
}
