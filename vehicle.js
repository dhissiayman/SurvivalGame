class Vehicle {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);

        this.maxSpeed = 4;
        this.maxForce = 0.1;
        this.r = 16;

        // Wander properties
        this.wanderTheta = 0;
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    // Steering Behaviors

    seek(target) {
        let desired = p5.Vector.sub(target, this.pos);
        desired.setMag(this.maxSpeed);

        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);

        return steer;
    }

    arrive(target, slowingRadius = 100) {
        let desired = p5.Vector.sub(target, this.pos);
        let distance = desired.mag();

        if (distance < slowingRadius) {
            let m = map(distance, 0, slowingRadius, 0, this.maxSpeed);
            desired.setMag(m);
        } else {
            desired.setMag(this.maxSpeed);
        }

        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);

        return steer;
    }

    wander() {
        // Wander point projected ahead
        let wanderPoint = this.vel.copy();
        wanderPoint.setMag(100); // dist ahead
        wanderPoint.add(this.pos);

        // Small circle around wander point
        let wanderRadius = 50;

        // Update theta
        this.wanderTheta += random(-0.3, 0.3);

        // Calculate new point on the circle
        let theta = this.wanderTheta + this.vel.heading();

        let x = wanderRadius * cos(theta);
        let y = wanderRadius * sin(theta);

        wanderPoint.add(x, y);

        // Steering force towards wander point
        let steer = this.seek(wanderPoint);
        return steer;
    }

    // Avoid obstacles logic (from generic implementation)
    avoid(obstacles) {
        // Look ahead vector
        let ahead = this.vel.copy();
        ahead.setMag(50); // Dynamic lookahead could be based on speed
        let ahead2 = ahead.copy().mult(0.5);

        let p1 = this.pos.copy().add(ahead);
        let p2 = this.pos.copy().add(ahead2);

        let obstacle = this.getMostThreateningObstacle(obstacles, p1, p2);

        if (!obstacle) return createVector(0, 0);

        let avoidanceForce = p5.Vector.sub(p1, obstacle.pos); // Avoid center of obstacle
        avoidanceForce.normalize();
        avoidanceForce.mult(this.maxSpeed); // Full speed away
        avoidanceForce.sub(this.vel);
        avoidanceForce.limit(this.maxForce);

        return avoidanceForce;
    }

    getMostThreateningObstacle(obstacles, p1, p2) {
        let mostThreatening = null;
        let closestDist = Infinity;

        for (let obstacle of obstacles) {
            // Simpler verification: is the obstacle close enough to either point?
            let d1 = p1.dist(obstacle.pos);
            let d2 = p2.dist(obstacle.pos);

            // Check if obstacle is close to the "whisker" line
            if (d1 <= obstacle.r + this.r || d2 <= obstacle.r + this.r) {
                if (d1 < closestDist) {
                    closestDist = d1;
                    mostThreatening = obstacle;
                }
            }
        }
        return mostThreatening;
    }

    // Utility for boundaries
    edges() {
        if (this.pos.x > width + this.r) this.pos.x = -this.r;
        if (this.pos.x < -this.r) this.pos.x = width + this.r;
        if (this.pos.y > height + this.r) this.pos.y = -this.r;
        if (this.pos.y < -this.r) this.pos.y = height + this.r;
    }
}
