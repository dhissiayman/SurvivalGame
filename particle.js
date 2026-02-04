class Particle {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D();
        this.vel.mult(random(2, 5));
        this.acc = createVector(0, 0);
        this.r = random(3, 8);
        this.lifespan = 255;
        this.isAlive = true;
    }

    update() {
        this.vel.add(this.acc);
        this.vel.mult(0.95); // friction
        this.pos.add(this.vel);
        this.lifespan -= 5;

        if (this.lifespan <= 0) {
            this.isAlive = false;
        }
    }

    show() {
        push();

        noStroke();
        fill(255, 100, 0, this.lifespan);
        circle(this.pos.x, this.pos.y, this.r);

        pop();
    }
}

// Function to create explosion particles
function createExplosion(x, y, particles) {
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(x, y));
    }
}
