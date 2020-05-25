class Heli {
    constructor(leader,x,y) {
        this.mass = 1;
        this.pos = createVector(x,y);
        this.speed = createVector(0,0);
        this.acceleration = createVector(0,0);

        this.maxForce = maxForceHelis;
        this.maxSpeed = maxSpeedHelis;

        this.angle = 0;
        this.nbKills = 0;
        this.leader = leader;
    }

    align(boids) {
        let steering = createVector(0,0);
        let max_dst = perceptionDist;
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
        let max_dst = perceptionDist;
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
        let max_dst = perceptionDist;
        let total = 0;
        for (let elt of boids) {
            let d = dist(this.pos.x, this.pos.y, elt.pos.x, elt.pos.y);
            if (d < max_dst && elt != this) {
                let dir = p5.Vector.sub(this.pos, elt.pos);
                dir.normalize();
                dir.mult(1/d);
                dir.mult(250);
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

    converge(target) {
        let desired_dir = p5.Vector.sub(target.pos, this.pos);
        let d = desired_dir.mag();

        desired_dir.normalize();
        if(d < 2*sizeShip) {
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

    flock(boids, target) {

        let d = p5.Vector.sub(target.pos, this.pos);
        let alignement = this.align(boids);
        let cohesion = this.cohesion(boids);
        let separation = this.separation(boids);
        this.acceleration.add(alignement);
        //this.acceleration.add(cohesion);
        this.acceleration.add(separation);
        if (d.mag() > 2*sizeShip) {
            let converge = this.converge(target);
            this.acceleration.add(converge);
        }
        this.angle = target.angle;
    }

    applyForce(force) {
        let f = p5.Vector.div(force, this.mass);
        this.acceleration.add(f);
    }

    update() {
        this.acceleration.mult(maxSpeedShip)
        this.speed.add(this.acceleration);
        this.pos.add(this.speed);

        this.acceleration.mult(0);
    }

    shoot(dir, x, y) {
        let bullet = new Bullet(1,x,y);
        bullet.speed = dir.copy();
        bullet.speed.mult(bulletSpeed);
        return bullet;
    }

    display(sprite) {
        fill(255);

        push();
        translate(this.pos.x,this.pos.y);
        if (this.leader) {
            noFill();
            stroke(255, 204, 0);
            strokeWeight(2);
            circle(0, 0, 70);
        }
        rotate(2*Math.PI-this.angle);
        image(sprite, -sizeShip/2, -sizeShip/2, sizeShip, sizeShip);
        pop();

    }

    checkSide() {
        if (this.pos.x > width) {
            this.pos.x = 0;
        }
        else if (this.pos.x < 0) {
            this.pos.x = width;
        }
        else if (this.pos.y > height) {
            this.pos.y = 0;
        }
        else if (this.pos.y < 0){
            this.pos.y = height;
        }
    }

    isInsideFluid(fluid) {
        let inside = false;
        if(this.pos.x > fluid.x && this.pos.x < fluid.x+fluid.w && this.pos.y > fluid.y && this.pos.y < fluid.y+fluid.h) {
            inside = true;
        }
        return inside;
    }

    drag(fluid) {
        let A = 1;
        let rho = fluid.density;
        let v = mv.speed.mag();
        let c = 0.01;

        let drag = p5.Vector.copy(mv.speed);
        drag.normalize();
        drag.mult(-rho*v*v*A*c);

        this.applyForce(drag);
    }
}

class Bullet {
    constructor(m,x,y) {
        this.mass = m;
        this.pos = createVector(x,y);
        this.speed = createVector(0,0);
        this.acceleration = createVector(0,0);

        this.angle = 0;
        this.aSpeed = 0;
        this.aAcceleration = 0;

        this.radius = 10;
    }

    applyForce(force) {
        let f = p5.Vector.div(force, this.mass);
        this.acceleration.add(f);
    }

    update() {
        this.speed.add(this.acceleration);
        this.pos.add(this.speed);

        this.acceleration.mult(0);
    }

    display(sprite) {
        fill(255);
        //ellipse(this.pos.x,this.pos.y,this.radius,this.radius);

        push();
        translate(this.pos.x,this.pos.y);
        rotate(2*Math.PI-this.angle);
        rotate(Math.PI/2);
        image(sprite, -5, 0, 10, 10);
        pop();
    }

    checkHit(targets) {
        let hit = false;
        for(let i = 0; i < targets.length; i++) {
            let v = p5.Vector.sub(this.pos, targets[i].pos);
            if(v.mag() < this.radius + targets[i].radius) {
                hit = true;
                targets[i].alive = false;
                //targets.splice(i, 1);
            }
        }
        return hit;
    }

    isInsideFluid(fluid) {
        let inside = false;
        if(this.pos.x > fluid.x && this.pos.x < fluid.x+fluid.w && this.pos.y > fluid.y && this.pos.y < fluid.y+fluid.h) {
            inside = true;
        }
        return inside;
    }

    isInsideCanvas() {
        let inside = false;
        if(this.pos.x > 0 && this.pos.x < width && this.pos.y > 0 && this.pos.y < height) {
            inside = true;
        }
        return inside;
    }

    drag(fluid) {
        let A = 1;
        let rho = fluid.density;
        let v = mv.speed.mag();
        let c = 0.01;

        let drag = p5.Vector.copy(mv.speed);
        drag.normalize();
        drag.mult(-rho*v*v*A*c);

        this.applyForce(drag);
    }
}
