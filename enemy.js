class Enemy extends Vehicle {
    static debug = false;
    constructor(x, y) {
        super(x, y);
        this.maxSpeed = 2;
        this.maxForce = 0.1;

        this.r = 15;
        this.damage = 10;
        this.health = 1;
        this.isAlive = true;
        this.scoreValue = 10;

        // Obstacle avoidance specific
        this.largeurZoneEvitementDevantVaisseau = 20;
    }

    // =========================
    // BEHAVIORS
    // =========================
    applyBehaviors(target, wanderInfluence) {
        let seekForce = this.seek(target);
        seekForce.mult(1 - wanderInfluence);

        let wanderForce = this.wander();
        wanderForce.mult(wanderInfluence);

        let avoidForce = this.avoid(obstacles);
        avoidForce.mult(2.5);

        this.applyForce(seekForce);
        this.applyForce(wanderForce);
        this.applyForce(avoidForce);
    }

    // Use Vehicle's seek, wander, update, edges, applyForce

    // Custom avoid to keep debug visualization if needed, or override Vehicle's
    // For now, let's keep the specific avoidance logic of Enemy as it seems tuned
    // But we should rename helper methods or move them to Vehicle if generic.
    // Actually, let's use the Vehicle's avoid! It is cleaner.
    // If we want debug, we can add it to Vehicle or override here.

    // Let's override avoid to match the previous specific implementation ensuring consistency
    // or just trust Vehicle. 

    // I will replace reuse Vehicle methods where possible.
    // The previous avoid code in Enemy had debug drawing.
    // I will keep avoid here for now to preserve the specific logic and debug drawing
    // but duplicate code is 'bad'.
    // The user explicitly asked to "remove duplicate code".
    // Vehicle.avoid is generic. Enemy.avoid is specific.
    // I will COMMENT OUT existing physics methods to rely on Parent.

    avoid(obstacles) {
        // We can use super.avoid(obstacles) if it works well.
        // Let's try to use the Vehicle implementation which I wrote to be similar!
        // But the Vehicle one doesn't have the debug drawing.

        // Let's stick to the plan: remove duplicates.
        // I will rely on Vehicle methods.
        // If debug is needed, I should add it to Vehicle or override show/update.
        return super.avoid(obstacles);
    }

    // =========================
    // COLLISION
    // =========================
    checkCollision(player) {
        let d = this.pos.dist(player.pos);
        return d < this.r + player.r;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.isAlive = false;
        }
    }

    // =========================
    // DISPLAY
    // =========================
    show() {
        push();
        imageMode(CENTER);
        image(batSprite, this.pos.x, this.pos.y, this.r * 6, this.r * 6);

        if (Enemy.debug) {
            // Debug drawings
            noFill();
            stroke(0, 255, 0);
            circle(this.pos.x, this.pos.y, this.r * 2);

            // Draw velocity
            this.drawVector(this.pos, this.vel.copy().mult(10), "green");
        }
        pop();
    }

    drawVector(pos, v, color) {
        push();
        strokeWeight(3);
        stroke(color);
        line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
        pop();
    }
}
