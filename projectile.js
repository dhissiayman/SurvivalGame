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
        this.health = 10;
    }

    // Seek implemented in Vehicle

    // ApplyForce implemented in Vehicle

    // Seek implemented in Vehicle

    // ApplyForce implemented in Vehicle

    // Apply behaviors: Homing (Seek) and Separation
    applyBehaviors(projectiles, enemies) {
        if (!this.homingEnabled) return;

        // 1. Separation from other projectiles (User requested force 0.1)
        let separation = this.separation(projectiles);
        separation.mult(0.1);
        this.applyForce(separation);

        // 2. Homing (Track nearest enemy)
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
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());

        // Neon Glow Effect (simulated with layers for performance or shadowBlur if small count)
        // Since projectiles are few, shadowBlur might be okay, but let's use layers for safety
        // Core
        noStroke();
        fill(200, 255, 255); // White-cyan core
        ellipse(0, 0, this.r * 4, this.r * 1.5);

        // Outer Glow
        fill(0, 255, 255, 100);
        ellipse(0, 0, this.r * 6, this.r * 3);

        // Trail/Engine flare
        fill(0, 100, 255, 150);
        triangle(-this.r * 2, -this.r, -this.r * 2, this.r, -this.r * 6, 0);

        pop();
    }
}
