// Base Boss Class
class Boss extends Enemy {
    constructor(x, y, level) {
        super(x, y);
        this.level = level;
        this.isBoss = true;
        this.maxHealth = 100 + (level * 50);
        this.health = this.maxHealth;
        this.r = 40;
        this.damage = 20;
        this.scoreValue = 500 * level;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
        }
    }

    showHealthBar() {
        push();
        let barWidth = 100;
        let barHeight = 10;
        let barY = this.pos.y - this.r - 20;

        // Background
        fill(50);
        stroke(255);
        strokeWeight(2);
        rect(this.pos.x - barWidth / 2, barY, barWidth, barHeight);

        // Health
        let healthWidth = map(this.health, 0, this.maxHealth, 0, barWidth);
        noStroke();
        fill(255, 0, 0);
        rect(this.pos.x - barWidth / 2, barY, healthWidth, barHeight);

        // Boss label
        fill(255, 255, 0);
        textAlign(CENTER);
        textSize(12);
        text(`BOSS ${this.level}`, this.pos.x, barY - 5);

        pop();
    }
}

// Boss 1: Fast Swarm Leader
class Boss1 extends Boss {
    constructor(x, y) {
        super(x, y, 1);
        this.maxSpeed = 3;
        this.maxForce = 0.2;
        this.color = color(255, 150, 0);
    }

    show() {
        this.drawSprite(skeltonBossSprite, this.r * 4, this.r * 4);
        this.showHealthBar();
    }
}

// Boss 2: Tank Commander
class Boss2 extends Boss {
    constructor(x, y) {
        super(x, y, 2);
        this.maxSpeed = 1.5;
        this.maxForce = 0.1;
        this.maxHealth = 200;
        this.health = this.maxHealth;
        this.r = 50;
        this.color = color(100, 100, 150);
    }

    show() {
        this.drawSprite(boss2Sprite, this.r * 4, this.r * 4);
        this.showHealthBar();
    }
}

// Boss 3: Teleporting Assassin
class Boss3 extends Boss {
    constructor(x, y) {
        super(x, y, 3);
        this.maxSpeed = 5;
        this.maxForce = 0.3;
        this.teleportTimer = 0;
        this.teleportCooldown = 180; // 3 seconds
        this.color = color(150, 0, 255);
    }

    update() {
        super.update();

        // Teleport mechanic
        this.teleportTimer++;
        if (this.teleportTimer >= this.teleportCooldown) {
            this.teleport();
            this.teleportTimer = 0;
        }
    }

    teleport() {
        // Random position near player
        let angle = random(TWO_PI);
        let distance = random(150, 300);
        this.pos.x = constrain(
            width / 2 + cos(angle) * distance,
            this.r, width - this.r
        );
        this.pos.y = constrain(
            height / 2 + sin(angle) * distance,
            this.r, height - this.r
        );
    }

    show() {
        this.drawSprite(boss3Sprite, this.r * 4, this.r * 4);
        this.showHealthBar();
    }
}

// Boss 4: Shield Boss
class Boss4 extends Boss {
    constructor(x, y) {
        super(x, y, 4);
        this.maxSpeed = 2;
        this.maxForce = 0.15;
        this.maxHealth = 300;
        this.health = this.maxHealth;
        this.shieldActive = true;
        this.shieldTimer = 0;
        this.shieldCooldown = 300; // 5 seconds
        this.color = color(0, 200, 255);
    }

    takeDamage(amount) {
        if (!this.shieldActive) {
            super.takeDamage(amount);
        }
    }

    update() {
        super.update();

        // Shield mechanic
        if (this.shieldActive) {
            this.shieldTimer++;
            if (this.shieldTimer >= this.shieldCooldown) {
                this.shieldActive = false;
                this.shieldTimer = 0;
            }
        } else {
            this.shieldTimer++;
            if (this.shieldTimer >= 120) { // 2 seconds down
                this.shieldActive = true;
                this.shieldTimer = 0;
            }
        }
    }

    show() {
        push();

        // Draw boss4 sprite
        imageMode(CENTER);
        image(boss4Sprite, this.pos.x, this.pos.y, this.r * 4, this.r * 4);

        // Shield effect overlay (if active)
        if (this.shieldActive) {
            noFill();
            stroke(0, 255, 255);
            strokeWeight(4);
            let shieldSize = this.r * 5 + sin(frameCount * 0.1) * 10;
            circle(this.pos.x, this.pos.y, shieldSize);
        }

        pop();
        this.showHealthBar();
    }
}

// Boss 5: Final Boss (Multi-phase)
class Boss5 extends Boss {
    constructor(x, y) {
        super(x, y, 5);
        this.maxSpeed = 2.5;
        this.maxForce = 0.2;
        this.maxHealth = 500;
        this.health = this.maxHealth;
        this.r = 60;
        this.phase = 1;
        this.color = color(255, 0, 0);
    }

    update() {
        super.update();

        // Phase transitions
        if (this.health < this.maxHealth * 0.66 && this.phase === 1) {
            this.phase = 2;
            this.maxSpeed = 3.5;
            this.color = color(255, 100, 0);
        }
        if (this.health < this.maxHealth * 0.33 && this.phase === 2) {
            this.phase = 3;
            this.maxSpeed = 5;
            this.color = color(255, 0, 255);
        }
    }

    show() {
        push();

        // Rotating aura
        let rotation = frameCount * 0.05;

        // Core
        fill(this.color);
        stroke(255);
        strokeWeight(4);
        circle(this.pos.x, this.pos.y, this.r * 2);

        // Phase indicators (orbiting spheres)
        for (let i = 0; i < this.phase + 2; i++) {
            let angle = rotation + (TWO_PI / (this.phase + 2)) * i;
            let orbitRadius = this.r * 1.5;
            let x = this.pos.x + cos(angle) * orbitRadius;
            let y = this.pos.y + sin(angle) * orbitRadius;

            fill(255, 215, 0);
            noStroke();
            circle(x, y, 12);
        }

        // Energy field
        noFill();
        stroke(this.color.levels[0], this.color.levels[1], this.color.levels[2], 100);
        strokeWeight(2);
        circle(this.pos.x, this.pos.y, this.r * 3 + sin(frameCount * 0.1) * 10);

        pop();
        this.showHealthBar();
    }
}
