
function randInt(min, max) {
    return Math.floor(min + (max-min+1) * Math.random());
}

function initPosZerg() {
    let margin = 0.2*height
    let nb = randInt(1,4);
    if (nb === 1)
        return createVector(random(-margin, width+margin), random(-margin, 0));
    else if (nb === 2)
        return createVector(random(-margin, 0), random(-margin, height+margin));
    else if (nb === 3)
        return createVector(random(-margin, width+margin), random(height, height+margin));
    else if (nb === 4)
        return createVector(random(width, width+margin), random(-margin, height+margin));
}

class Zerg {
    constructor(targets) {
        this.pos = initPosZerg();
        this.speed = p5.Vector.random2D();
        this.speed.setMag(random(zergSpeed,zergSpeed+2));
        this.acceleration = createVector();
        this.maxForce = 0.4;
        this.maxSpeed = zergSpeed;

        this.targetPos = targets[randInt(0,nbBases-1)].pos;
        this.radius = random(zergSize,zergSize+15);
        this.alive = true;
        this.deadAngle = random(2*Math.PI);
        this.timerDeath = 0;
    }

    align(boids) {
        let steering = createVector(0,0);
        let max_dst = 50;
        let total = 0;
        for (let elt of boids) {
            let d = dist(this.pos.x, this.pos.y, elt.pos.x, elt.pos.y);
            if (d < max_dst && elt != this) {
                steering.add(elt.speed);
                total++;
            }
        }
        if (total != 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.speed);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    cohesion(boids) {
        let steering = createVector(0,0);
        let max_dst = 50;
        let total = 0;

        for (let elt of boids) {
            let d = dist(this.pos.x, this.pos.y, elt.pos.x, elt.pos.y);
            if (d < max_dst && elt != this) {
                steering.add(elt.pos);
                total++;
            }
        }

        if (total != 0) {
            steering.div(total);
            steering.sub(this.pos);
            steering.setMag(this.maxSpeed);
            steering.sub(this.speed);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    separation(boids) {
        let steering = createVector(0,0);
        let max_dst = 50;
        let total = 0;
        for (let elt of boids) {
            let d = dist(this.pos.x, this.pos.y, elt.pos.x, elt.pos.y);
            if (d < max_dst && elt != this) {
                let dir = p5.Vector.sub(this.pos, elt.pos);
                dir.normalize();
                dir.mult(1/d);
                dir.mult(200);
                steering.add(dir);
                total++;
            }
        }
        if (total != 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.speed);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    converge() {
        let desired_dir = p5.Vector.sub(this.targetPos, this.pos);
        let d = desired_dir.mag();

        desired_dir.normalize();
        if(d < sizeBases) {
            let m = map(d,sizeBases/2,sizeBases,0.001,this.maxSpeed);
            desired_dir.mult(m);
        }
        else {
            desired_dir.setMag(this.maxSpeed);
        }

        let steer = p5.Vector.sub(desired_dir, this.speed);
        steer.limit(this.maxForce);
        return steer;
    }

    flock(boids) {
        let d = p5.Vector.sub(this.targetPos, this.pos);
        if (d.mag() > 2*sizeBases) {
            let alignement = this.align(boids);
            let cohesion = this.cohesion(boids);
            let separation = this.separation(boids);
            this.acceleration.add(alignement);
            this.acceleration.add(cohesion);
            this.acceleration.add(separation);
        }
        let converge = this.converge();
        this.acceleration.add(converge);
    }

    update() {
        this.speed.add(this.acceleration);
        this.pos.add(this.speed);
        this.acceleration.mult(0);
    }

    display(sprites) {
        if (this.alive) {
            push();
            translate(this.pos.x, this.pos.y);
            rotate(this.speed.heading());
            //rotate(Math.PI/2);
            image(sprites[0],-this.radius/2, -this.radius/2, this.radius, this.radius);
            pop();
        }
        else {
            push();
            translate(this.pos.x, this.pos.y);
            rotate(this.deadAngle);
            image(sprites[1],-this.radius/2, -this.radius/2, this.radius, this.radius);
            pop();
            this.timerDeath++;
        }
    }

    attack(target) {
        target.life -= 1;
    }
}
