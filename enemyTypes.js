// Fast Enemy - Quick but weak
class FastEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.maxSpeed = 4;
        this.maxForce = 0.15;
        this.r = 12;
        this.damage = 5;
        this.health = 1;
        this.scoreValue = 15;
        this.color = color(255, 100, 0); // Orange
    }

    show() {
        push();
        fill(this.color);
        stroke(255);
        strokeWeight(2);
        circle(this.pos.x, this.pos.y, this.r * 2);

        // Speed indicator (multiple lines)
        if (this.vel.mag() > 0) {
            let vel = this.vel.copy().normalize();
            stroke(255, 150);
            strokeWeight(2);
            for (let i = 1; i <= 3; i++) {
                let offset = vel.copy().mult(this.r * i * 0.5);
                line(this.pos.x, this.pos.y,
                    this.pos.x + offset.x, this.pos.y + offset.y);
            }
        }
        pop();
    }
}

// Tank Enemy - Slow but strong
class TankEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.maxSpeed = 1;
        this.maxForce = 0.05;
        this.r = 25;
        this.damage = 25;
        this.health = 3;
        this.scoreValue = 30;
        this.color = color(150, 150, 150); // Gray
    }

    show() {
        push();

        // Draw skeleton sprite (much bigger!)
        imageMode(CENTER);
        image(skeletonSprite, this.pos.x, this.pos.y, this.r * 6, this.r * 6);

        pop();
    }
}

// Splitter Enemy - Splits into smaller enemies when destroyed
class SplitterEnemy extends Enemy {
    constructor(x, y, generation = 0) {
        super(x, y);
        this.generation = generation;
        this.maxSpeed = 2.5;
        this.maxForce = 0.12;
        this.r = 18 - (generation * 5);
        this.damage = 8;
        this.health = 1;
        this.scoreValue = 20;
        this.color = color(255, 0, 255); // Magenta
    }

    show() {
        push();

        // Draw vampire sprite (much bigger!)
        imageMode(CENTER);
        image(vampireSprite, this.pos.x, this.pos.y, this.r * 6, this.r * 6);

        pop();
    }

    split(enemies) {
        // Vampire turns into bats when killed!
        if (this.generation < 2) {
            for (let i = 0; i < 2; i++) {
                let offset = p5.Vector.random2D().mult(20);
                // Spawn regular Enemy (bat) instead of SplitterEnemy
                let bat = new Enemy(
                    this.pos.x + offset.x,
                    this.pos.y + offset.y
                );
                enemies.push(bat);
            }
        }
    }
}

// Flocking Bat Enemy - Wanders in groups, doesn't seek player, despawns off-screen
class FlockingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.maxSpeed = 3;
        this.maxForce = 0.1;
        this.r = 10;
        this.damage = 5;
        this.health = 1;
        this.scoreValue = 5;
        this.color = color(100, 100, 255); // Blue-ish

        // Flocking weights
        this.alignWeight = 1.0;
        this.cohesionWeight = 1.0;
        this.separationWeight = 1.5;
        this.wanderWeight = 1.0;

        this.perceptionRadius = 50;
    }

    applyBehaviors(target, wanderInfluence, enemies) {
        // Flocking behaviors
        let alignment = this.align(enemies);
        let cohesion = this.cohesion(enemies);
        let separation = this.separation(enemies);
        let wander = this.wander();

        alignment.mult(this.alignWeight);
        cohesion.mult(this.cohesionWeight);
        separation.mult(this.separationWeight);
        wander.mult(this.wanderWeight);

        // Avoid obstacles (walls)
        let avoidForce = this.avoid(obstacles);
        avoidForce.mult(2.5);

        this.applyForce(alignment);
        this.applyForce(cohesion);
        this.applyForce(separation);
        this.applyForce(wander);
        this.applyForce(avoidForce);
    }

    // Reuse alignment/cohesion/separation logic from Boid/Vehicle
    // Since Vehicle only has separate, we implement align/cohesion here or assume strict Vehicle inheritance
    // But Vehicle doesn't have align/cohesion implemented in the provided file? 
    // Let's implement them here to be safe and self-contained.

    // Optimized flocking logic
    align(boids) {
        let steering = createVector();
        let total = 0;
        let neighbors = 0;

        for (let other of boids) {
            if (neighbors > 10) break; // Optimization: Only check nearest 10

            if (!(other instanceof FlockingEnemy)) continue;

            // Manual distance squared check to avoid Math.sqrt
            let dx = this.pos.x - other.pos.x;
            let dy = this.pos.y - other.pos.y;
            let dSq = dx * dx + dy * dy;

            let rSq = this.perceptionRadius * this.perceptionRadius;

            if (other != this && dSq < rSq) {
                steering.add(other.vel);
                total++;
                neighbors++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.vel);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    cohesion(boids) {
        let steering = createVector();
        let total = 0;
        let neighbors = 0;

        for (let other of boids) {
            if (neighbors > 10) break;

            if (!(other instanceof FlockingEnemy)) continue;

            let dx = this.pos.x - other.pos.x;
            let dy = this.pos.y - other.pos.y;
            let dSq = dx * dx + dy * dy;
            let rSq = this.perceptionRadius * this.perceptionRadius;

            if (other != this && dSq < rSq) {
                steering.add(other.pos);
                total++;
                neighbors++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.sub(this.pos);
            steering.setMag(this.maxSpeed);
            steering.sub(this.vel);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    separation(boids) {
        let steering = createVector();
        let total = 0;
        let neighbors = 0;

        for (let other of boids) {
            if (neighbors > 15) break; // Slightly higher limit for separation

            // Separate from ALL enemies, not just flock
            let dx = this.pos.x - other.pos.x;
            let dy = this.pos.y - other.pos.y;
            let dSq = dx * dx + dy * dy;

            let r = this.perceptionRadius / 2;
            let rSq = r * r;

            // Protect against zero distance and optimize
            if (other != this && dSq < rSq && dSq > 0.01) {
                let diff = p5.Vector.sub(this.pos, other.pos);
                diff.div(dSq); // Weight by distance squared (already squared!)
                // Wait, logic check: classic separation divides by distance (d) or d^2?
                // Usually d. But dividing by d^2 makes close objects push WAY harder.
                // Keeping original logic behavior but using optimized dSq.

                steering.add(diff);
                total++;
                neighbors++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.vel);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    // Override edges to despawn instead of wrap/bounce
    edges() {
        // Buffer must be larger than spawn distance (which is ~150)
        let buffer = 300;
        if (this.pos.x < -buffer || this.pos.x > width + buffer ||
            this.pos.y < -buffer || this.pos.y > height + buffer) {
            this.isAlive = false;
        }
    }

    show() {
        push();
        imageMode(CENTER);
        // Use bat sprite
        if (batSprite) {
            image(batSprite, this.pos.x, this.pos.y, this.r * 4, this.r * 4);
        } else {
            fill(this.color);
            circle(0, 0, this.r * 2);
        }
        pop();
    }
}
