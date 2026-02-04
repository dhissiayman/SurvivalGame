class Enemy {
    static debug = false;
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D();
        this.acc = createVector(0, 0);

        this.maxSpeed = 2;
        this.maxForce = 0.1;

        this.r = 15;
        this.damage = 10;
        this.health = 1;
        this.isAlive = true;
        this.scoreValue = 10;

        // Wander
        this.wanderTheta = random(TWO_PI);

        // Obstacle avoidance
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

    // =========================
    // SEEK
    // =========================
    seek(target) {
        let desired = p5.Vector.sub(target, this.pos);
        desired.setMag(this.maxSpeed);

        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);

        return steer;
    }

    // =========================
    // WANDER
    // =========================
    wander() {
        this.wanderTheta += random(-0.3, 0.3);

        let wanderForce = p5.Vector.fromAngle(this.wanderTheta);
        wanderForce.setMag(0.1);

        return wanderForce;
    }

    // =========================
    // OBSTACLE AVOIDANCE
    // =========================
    avoid(obstacles) {


        let ahead = this.vel.copy();
        ahead.setMag(30);

        let ahead2 = ahead.copy().mult(0.5);

        let p1 = this.pos.copy().add(ahead);
        let p2 = this.pos.copy().add(ahead2);

        let obstacle = this.getObstacleLePlusProche(obstacles);
        if (!obstacle) return createVector(0, 0);

        let d1 = p1.dist(obstacle.pos);
        let d2 = p2.dist(obstacle.pos);
        let distance = min(d1, d2);

        if (distance < obstacle.r + this.largeurZoneEvitementDevantVaisseau) {

            let force = (d1 < d2)
                ? p5.Vector.sub(p1, obstacle.pos)
                : p5.Vector.sub(p2, obstacle.pos);

            force.setMag(this.maxSpeed);
            force.sub(this.vel);
            force.limit(this.maxForce / 2);

            return force;
        }
        if (Enemy.debug) {
            // on le dessine avec ma méthode this.drawVector(pos vecteur, color)
            this.drawVector(this.pos, ahead, "yellow");
        }

        return createVector(0, 0);
    }

    getObstacleLePlusProche(obstacles) {
        let record = Infinity;
        let closest = null;

        for (let o of obstacles) {
            let d = this.pos.dist(o.pos);
            if (d < record) {
                record = d;
                closest = o;
            }
        }
        return closest;
    }

    // =========================
    // PHYSICS
    // =========================
    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
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
        pop();
    }

    // =========================
    // SCREEN WRAP
    // =========================
    edges() {
        if (this.pos.x > width + this.r) this.pos.x = -this.r;
        if (this.pos.x < -this.r) this.pos.x = width + this.r;
        if (this.pos.y > height + this.r) this.pos.y = -this.r;
        if (this.pos.y < -this.r) this.pos.y = height + this.r;
    }
    drawVector(pos, v, color) {
        push();
        // Dessin du vecteur vitesse
        // Il part du centre du véhicule et va dans la direction du vecteur vitesse
        strokeWeight(3);
        stroke(color);
        line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
        // dessine une petite fleche au bout du vecteur vitesse
        let arrowSize = 5;
        translate(pos.x + v.x, pos.y + v.y);
        rotate(v.heading());
        translate(-arrowSize / 2, 0);
        triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
        pop();
    }
}
