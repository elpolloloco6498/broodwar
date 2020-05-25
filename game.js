
//fonctions
function randInt(min, max) {
    return Math.floor(min + (max-min+1) * Math.random());
}
function timer() {
    time += 0.05;
}

function initPosHeli() {
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

function spawnZergs() {
    for (let i = 0; i < nbZerglings; i++) {
        zergs.push(new Zerg(bases));
    }

    if (zergs.length < 100) {
        nbZerglings += 5;
    }
}

function spawnSquadron() {
    if (squadron.length < 40) {
        let pos = initPosHeli();
        squadron.push(new Heli(false, pos.x, pos.y));
    }
}

function isGameOver() {
    let gameover = true;
    for (let base of bases) {
        if (!base.destroyed) {
            gameover = false;
        }
    }
    return gameover;
}

function resetGame() {
    gameOver = false;
    bases = [];
    zergs = [];
    for (let i = 0; i < nbBases; i++) {
        bases.push(new Base());
    }

    for (let i = 0; i < nbZerglings; i++) {
        zergs.push(new Zerg(bases));
    }
    //reset score
    heli.nbKills = 0;
    //reset clock
    time = 0;
    resetbutton.hide();
}

let gameOver = false;

let zergs = [];
let bases = [];
let bullets = [];
let squadron = [];
let baseSprites, zergSprites;

let heli, mouse, dir, axisX;
let zergImg, zergDeadImg, heliImg, spaceshipImg, bulletImg, terrainImg, baseImg, baseDestroyedImg;
let cursorSC;
let gameoverImg, startingScreenImg, keysImg;

let song, underattack;

let time = 0;
//change before commit
let firstLaunch = true;

function preload() {
    //LOADING SPRITES
    zergImg = loadImage('images/alien.png');
    zergDeadImg = loadImage('images/zerg_dead.png');
    heliImg = loadImage('images/heli.gif');
    spaceshipImg = loadImage('images/terranship.png');
    bulletImg = loadImage('images/bullet.png');
    terrainImg = loadImage('images/terrain2.jpg');
    baseImg = loadImage('images/commandcenter.png');
    baseDestroyedImg = loadImage('images/base_destroyed.png');
    gameoverImg = loadImage('images/gameover.jpg');
    startingScreenImg = loadImage('images/mainmenu.jpg');
    cursorSC = loadImage('images/cursorSC.png');
    keysImg = loadImage('images/wqsdkeys.png');

    baseSprites = [baseImg, baseDestroyedImg];
    zergSprites = [zergImg, zergDeadImg];

    song = loadSound('sounds/theme.mp3');
    underattack = loadSound('sounds/underattack.mp3');
}

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    background(125);
    //shooting interval
    setInterval(timer, 50);
    //spawning interval
    setInterval(spawnZergs, 5000);
    //spawning squadron member
    setInterval(spawnSquadron, 20000);

    //initialization of the game
    for (let i = 0; i < nbBases; i++) {
        bases.push(new Base());
    }

    for (let i = 0; i < nbZerglings; i++) {
        zergs.push(new Zerg(bases));
    }
    //create player
    heli = new Heli(true,300,400);
    //create followers
    for (let i = 0; i < nbSquadron; i++) {
        squadron.push(new Heli(false,random(width),random(height)));
    }
    //BUTTONS
    startbutton = createButton('start game');
    startbutton.position(width/2-startbutton.width/2, height/2 + 50);
    startbutton.mousePressed(function () {
        startbutton.hide();
        firstLaunch = false;
    });

    resetbutton = createButton('play again');
    resetbutton.position(width/2-resetbutton.width/2, height/2 + 50);
    resetbutton.mousePressed(resetGame);
    resetbutton.hide();

    //custom starcraft cursor mouse
    cursor('images/cursor.png');
    //song.play();
    //underattack.play();
}

function draw() {
    //menu start game
    if (firstLaunch) {
        image(startingScreenImg, 0, 0, width, height);
        image(keysImg, width/2 + 0.16*width, height/2, 120, 100);

        textFont('scFont');
        textSize(80);
        fill(255,20,30);
        let title = 'ZERG RUSH';
        let ctitle = textWidth(title);
        text(title, width/2 - ctitle/2, height/2 - 0.2*height);

        let message = 'control the spaceship with the WASD keys';
        textFont('arial');
        textSize(25);
        fill(255);
        text(message, width/2 - 0.12*width, height/2 + 0.2*height);
    }
    else {
        if (!gameOver) {
            gameOver = isGameOver();
            if(keyIsDown(90)) {//Z
                heli.acceleration.add(createVector(0,-0.02));
            }
            else if(keyIsDown(83)) {//S
                heli.acceleration.add(createVector(0,0.02));
            }
            else if(keyIsDown(81)) {//Q
                heli.acceleration.add(createVector(-0.02,0));
            }
            else if(keyIsDown(68)) {//D
                heli.acceleration.add(createVector(0.02,0));
            }

            mouse = createVector(mouseX, mouseY);
            dir = p5.Vector.sub(mouse, heli.pos);
            dir.normalize();

            heli.angle = -dir.heading();
            //creating squad for shooting
            let squad = [...squadron];
            squad.push(heli);
            if(mouseIsPressed) {
                if(time > 0.05) {
                    for (let aircraft of squad) {
                        let bullet = heli.shoot(dir, aircraft.pos.x, aircraft.pos.y);
                        bullet.angle = aircraft.angle;
                        bullets.push(bullet);
                    }
                    time = 0;
                }
            }
            //display and update
            clear();
            image(terrainImg, 0, 0, width, height);

            //flocking zergs
            for (let i = 0; i < zergs.length; i++) {
                if (zergs[i].alive) {
                    zergs[i].flock(zergs);
                    for (let j = 0; j < bases.length; j++) {
                        let vdist = p5.Vector.sub(bases[j].pos, zergs[i].pos);
                        let d = vdist.mag();
                        if (d < sizeBases+5 && !bases[j].isDestroyed()) {
                            zergs[i].attack(bases[j]);
                        }
                        else if (d < sizeBases+5 && bases[j].isDestroyed()) {
                            zergs[i].targetPos = bases[randInt(0, bases.length-1)].pos;
                        }
                    }
                    zergs[i].update();
                }
                zergs[i].display(zergSprites);
                //deleting sprites
                if (!zergs[i].alive && zergs[i].timerDeath > delete_time) {
                    zergs.splice(i,1);
                }
            }

            for (let i = 0; i < bullets.length; i++) {
                bullets[i].update();
                bullets[i].display(bulletImg);

                if(bullets[i].checkHit(zergs)) {
                    //console.log('we got a hit !');
                    heli.nbKills++;
                }

                if(!bullets[i].isInsideCanvas()) {
                    bullets.splice(i, 1);
                }
            }

            for (let base of bases) {
                base.display(baseSprites);
            }

            //flocking squadron
            for (let i = 0; i < squadron.length; i++) {
                squadron[i].flock(squad, heli);
                squadron[i].update();
                squadron[i].display(spaceshipImg);
                squadron[i].checkSide();
            }

            heli.update();
            heli.display(spaceshipImg);
            heli.checkSide();

            //PRINT score
            text('Score : ' + heli.nbKills, 0.9*width, 20);
        }

        else {
            resetbutton.show();
            image(gameoverImg, 0, 0, width, height);
            push();
            translate(width/2, height/2);
            textFont('scFont');
            textSize(40);
            fill(255,0,0);
            let message = 'GAME OVER';
            let cWidth = textWidth(message);
            text(message, -cWidth/2, -20);
            text('score : ' + heli.nbKills, -cWidth/2, 0.2*height);
            pop();
        }
    }
}
