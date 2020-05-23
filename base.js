class Base {
    constructor(x, y) {
        this.pos = createVector(random(0.2*width,0.8*width), random(0.2*height,0.8*height));
        this.radius = sizeBases;
        this.lifeTotal = lifeBases;
        this.life = this.lifeTotal;
        this.destroyed = false;
    }

    isDestroyed() {
        return this.life <= 0;
    }

    display(sprites) {
        let lengthBar = 50;
        if (!this.isDestroyed()) {
            push();
            translate(this.pos.x, this.pos.y);
            image(sprites[0], -this.radius/2, -this.radius/2, this.radius*1.25, this.radius);
            rect(-lengthBar/2,-60,lengthBar,5);
            fill(0,255,0);
            rect(-lengthBar/2,-60,(lengthBar/this.lifeTotal)*this.life,5);
            textSize(8);
            text(this.life + '/' + this.lifeTotal + 'PV', -lengthBar/2,-65);
            pop();
        }
        else {
            this.destroyed = true;
            push();
            translate(this.pos.x, this.pos.y);
            image(sprites[1], -this.radius/2, -this.radius/2, this.radius, this.radius);
            pop();
        }
    }
}
