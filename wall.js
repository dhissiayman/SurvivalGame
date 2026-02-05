class Wall {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.r = 30; // Collision radius
        this.lifespan = 600; // 10 seconds (60fps)
        this.isAlive = true;
    }

    update() {
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.isAlive = false;
        }
    }

    show() {
        push();
        imageMode(CENTER);
        if (typeof wallSprite !== 'undefined' && wallSprite) {
            // Draw wall sprite
            // Assuming square or fitting in circle
            image(wallSprite, this.pos.x, this.pos.y, this.r * 2.5, this.r * 2.5);
        } else {
            // Fallback
            fill(100);
            stroke(255);
            strokeWeight(2);
            rectMode(CENTER);
            rect(this.pos.x, this.pos.y, this.r * 2, this.r * 2);
        }
        pop();
    }
}
