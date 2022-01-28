/*
 * This program will have 3 flashlights.
 * 2 lenses, one convex and one concave
 * 1 mirror that will be flat and always in the same place
 * 
 * it will also display reflect angles and other such data.
 */

//set up the play feild 
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = innerWidth-20;
canvas.height = innerHeight-20;

ctx.beginPath();
ctx.rect(0, 0, innerWidth-20, innerHeight-20);
ctx.fillStyle = "white";
ctx.fill();

var img = new Image();
img.src = "light.png"; 


//creates a really short class for the walls
class wall {
    constructor (side) {
        this.side = side;
    }

    //find the distance to the input point
    distance(x,y) {
        var dist;

        switch (this.side) {
            case 1: dist = x; break; // right
            case 2: dist = canvas.width - x; break; // left
            case 3: dist = y; break; // top
            case 4: dist = canvas.height - y; break; // bottom
        }

        return dist;
    }

    hit(x, y, angle) {
        return [angle, false];
    }
}

//flash light class
class flashlight {
    //set intitial variables
    constructor(x,y,angle,beams) {
        this.posX = x;
        this.posY = y;
        this.angle = angle;
        this.beams = beams;
        this.height = 100;
        this.width = 100;
    }

    //draws the beams and the flashlight head
    draw() {
        //find where it should be on a rotated canvas
        var shiftX = Math.sin(this.angle * Math.PI / 180) * (this.posY - Math.sin(this.angle * Math.PI / 180) * this.width/2);
        var shiftY = Math.cos(this.angle * Math.PI / 180) * (this.posY - Math.sin(this.angle * Math.PI / 180) * this.width/2);

        shiftX += Math.cos(this.angle * Math.PI / 180) * (this.posX - Math.cos(this.angle * Math.PI / 180) * this.width/2);
        shiftY -= Math.sin(this.angle * Math.PI / 180) * (this.posX - Math.cos(this.angle * Math.PI / 180) * this.width/2);
        
        //draw the light
        ctx.rotate(this.angle * Math.PI / 180);
        ctx.drawImage(img, shiftX, shiftY, this.width, this.height);
        ctx.rotate(this.angle * Math.PI / -180);

        //draw the beem
        this.beam(this.posX, this.posY, this.angle);
    }

    beam (x, y, angle) {
        //set everything up
        var bouncing = true;
        var smallest;
        var contact = -1;
        var last = -1;
        var exit = [0, true];
        
        //goes until the beam hits a wall
        while (bouncing) {
            //use ray marching for the light ray
            //find smallest distance before it hits anything
            smallest = 10000;
            
            for (var i = 0; i < blocks.length; i++) {
                if (blocks[i].distance(x,y) < smallest && i != last) {
                    smallest = blocks[i].distance(x,y);
                    contact = i;
                }
            }
            
            //draw a line that distance in the forward direction
            ctx.strokeStyle = "#F2D800";
            ctx.lineWidth = 3;
 
            ctx.beginPath();

            ctx.moveTo(x,y);
        
            var shiftX = Math.sin(angle * Math.PI / 180) * smallest;
            var shiftY = Math.cos(angle * Math.PI / 180) * smallest;

            ctx.lineTo(x + shiftX, y - shiftY);

            ctx.stroke();
            
            //move the point the beam comes from
            x = x + shiftX;
            y = y - shiftY;
            
            //find if the beam hit anything
            if (smallest <= 5) {
                //if yes calculate where it should go from there
                exit = blocks[contact].hit(x,y,angle);

                angle = exit[0];

                bouncing = exit[1];

                last = contact;
                
            } else {
                last = -1;
            }
        }
    }

    //update the lens when it's moved or rotated
    move() {
        //find the distance of the object from the mouse
        var dist = (this.posX - mosX) * (this.posX - mosX) + (this.posY - mosY) * (this.posY - mosY);
        dist = Math.sqrt(dist);

        //tell if the light is rotating
        if (pressedKeys[82] == true) {
            this.rotating = true;
        } else {
            this.rotating = false;
        }

        //find if the light is moving
        if (this.moving == true) {
            //find if the light is rotating
            if (this.rotating == true) {
                //if yes choose the method
                if (keyboard == true) {
                    this.angle += 1;
                }

                else if ( ( this.posX - mosX) != 0 ) {
                    //point toward the mouse
                    this.angle = Math.atan((this.posY - mosY)/( this.posX - mosX)) * 180 / Math.PI;
                    this.angle += 90;
                    
                    if (this.posX - mosX > 0) {
                        this.angle += 180;
                    }
                    
                }

            }
            else {
                //move to the mouse position
                this.posX = mosX;
                this.posY = mosY;
            }

            //find if the moving state changed
            if (click == true && dist < this.width/2) {
                this.moving = false;
            }
        } else if (click == true && dist < this.width/2) {
            this.moving = true;
        }

    } 
}

//convex lens class
class vexLens { //lens class with position, width, angle, and focal length
    //position is from the center
    //set intitial variables
    constructor(x, y, width, focal, angle) {
        this.len = focal;
        this.posX = x;
        this.posY = y;
        this.width = width;
        this.angle = angle;
        this.slope =  Math.sin(angle * Math.PI / 180) / Math.cos(angle * Math.PI / 180);
        this.b = y - (this.slope * x);
        this.moving = false;
        this.rotating = false;
    }
    
    //draw the lens as a line
    draw() {
        ctx.strokeStyle = "#64AEEE";
        ctx.lineWidth = 10;
        
        ctx.beginPath();

        ctx.moveTo(this.posX - (this.width/2) * Math.cos(this.angle * Math.PI / 180), this.posY - (this.width/2) * Math.sin(this.angle * Math.PI / 180));
        
        ctx.lineTo(this.posX + (this.width/2) * Math.cos(this.angle * Math.PI / 180), this.posY + (this.width/2) * Math.sin(this.angle * Math.PI / 180));

        ctx.stroke();
    }

    //find the distance to the input point
    distance(x,y) {
        //determine the closest point of the lens, which will be just a straight line
        var lensX = [this.posX - (this.width/2) * Math.cos(this.angle * Math.PI / 180), this.posX + (this.width/2) * Math.cos(this.angle * Math.PI / 180)];
        var lensY = [this.posY - (this.width/2) * Math.sin(this.angle * Math.PI / 180), this.posY + (this.width/2) * Math.sin(this.angle * Math.PI / 180)];

        var points = [[lensX[0], lensY[0]], [x, y], [lensX[1], lensY[1]]];

        //find side lengths of the triangle
        var base = dist(points[0], points[2]);
        var sideA = dist(points[1], points[2]);
        var sideB = dist(points[0], points[1]);

        //find the height of the triangle
        //uses heron's formula
        var s = (sideA+base+sideB) / 2;
        var area = Math.sqrt(s * (s - sideA) * (s - base) * (s - sideB));
        var height = (2 * area) / base;

        //find if the height it the right line to use
        var angleA = (sideB * sideB) + (base * base) - (sideA * sideA);
        angleA = angleA/ (sideB * base * 2);
        angleA = (Math.acos(angleA) * 180) / Math.PI;

        var angleB = (sideA * sideA) + (base * base) - (sideB * sideB);
        angleB = angleB/ (sideA * base * 2);
        angleB = (Math.acos(angleB) * 180) / Math.PI;

        if (angleB > 90) {
            height = sideA;
        } else if (angleA > 90) {
            height = sideB;
        }
        
        return height;
    }

    hit(x, y, angle) {
        //set up needed variables
        var lightDist = 100;
        var imageDist, height, offset, imageHeight;

        //find the length from the side of the lense that the contact happened
        var lenseSide = [this.posX - (this.width/2) * Math.cos(this.angle * Math.PI / 180),this.posY - (this.width/2) * Math.sin(this.angle * Math.PI / 180)];
        var sideDist = dist([x,y],lenseSide);

        //figure out all the needed pieces of data for the output angle
        imageDist = 1 / ((1/this.len) + (1/lightDist));

        offset = dist([x,y],[this.posX, this.posY]);

        angle -= this.angle;

        height = Math.tan(angle * (Math.PI / 180)) * lightDist;
        height += offset;

        imageHeight = (imageDist/lightDist) * height;

        //combine all the data to find the output angle
        var angleOut = Math.atan((imageHeight - offset)/imageDist);
        angleOut = angleOut * (180/Math.PI);

        //change the angle based on the input angle so it goes out the correct side
        if (this.posY < light.posY) {
            //mirror around input angle
            if (sideDist < this.width/2) {
                angleOut = Math.abs(angle - angleOut) + angle;
            }
            
        } else {
            if (sideDist > this.width/2) {
                //mirror around the input angle
                angleOut = Math.abs(angle - angleOut) + angle;
            }

            angleOut += 180;
        }

        return [angleOut, true];
    }

    //update the lens when it's moved or rotated
    update() {
        //find the distance of the object from the mouse
        var dist = (this.posX - mosX) * (this.posX - mosX) + (this.posY - mosY) * (this.posY - mosY);
        dist = Math.sqrt(dist);

        //determine if the object is rotating
        if (pressedKeys[82] == true) {
            this.rotating = true;
        } else {
            this.rotating = false;
        }

        //move the object to the mouse if moving is true
        if (this.moving == true) {
            //if the object is rotating don't move it and only rotate it
            if (this.rotating == true && this.moving == true) {
                
                if (keyboard == true) {
                    //slowlly rotate the object
                    this.angle += 1;
                } else if (this.posX - mosX != 0 ) {
                    //make it look at the mouse
                    this.angle = Math.atan((this.posY - mosY)/( this.posX - mosX)) * 180 / Math.PI;

                    if (this.posX - mosX > 0) {
                        this.angle += 180;
                    }
                }
                    
            }
            else {
                //move the object
                this.posX = mosX;
                this.posY = mosY;
            }

            if (click == true) {
                //if click stop moving
                this.moving = false;
            }
        } else if (click == true && dist < this.width/2) {
            //if click inside the zone start moving
            this.moving = true;
        }
    }
}

//animation loop
function animate() {
    //update everything
    requestAnimationFrame(animate);
    
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    ctx.fillStyle = "white";
    ctx.lineWidth = 10;
        
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();

    vex.update();
    vex.draw();

    vex2.update();
    vex2.draw();
    

    light.draw();
    light.move();

    click = false;
    
}

//find the distance between 2 points
function dist(point1, point2) {
    distance = (point1[0] - point2[0]) * (point1[0] - point2[0]) + (point1[1] - point2[1]) * (point1[1] - point2[1])
    return Math.sqrt(distance);
}

//variables for mouse position
var mosX = 0;
var mosY = 0;
var click = true;

//listen get clicks and mouse position
addEventListener("click", () => { click = true;});
addEventListener('mousemove', (e) => {mosX = e.clientX; mosY = e.clientY; }, false);

//get the pressed keys at any given time
var pressedKeys = {};
var keyboard = false;
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false;};
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; if (e.keyCode == 83) { if (keyboard == true) {keyboard = false;} else {keyboard = true;}}};

//set up the convex lens
vex = new vexLens(canvas.width/2,canvas.height/2,100,100,0);

vex2 = new vexLens(canvas.width/2 - 350,canvas.height/2 + 350, 100, 100,0);

//sets up all the walls
topWall = new wall(3);

rightWall = new wall(1);

bottomWall = new wall(4);

leftWall = new wall(2);

//set up array of interactive objects
var blocks = [vex, vex2, topWall, bottomWall, rightWall, leftWall]

//set up first flashlight
light = new flashlight(200,200,180,1)

//animation loop
animate();