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
