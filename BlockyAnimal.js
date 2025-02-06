// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    void main() {
        gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    }`

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_FragColor; 
    void main() {
        gl_FragColor = u_FragColor;
    }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGl(){
        // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    // gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true})
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    gl.enable(gl.DEPTH_TEST);
    // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
}

function connectVariablesToGLSL(){
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    // get storage location of u_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix')
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log("Failed to get the storage location of u_GlobalRotateMatrix");
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

    // u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    // if (!u_Size) {
    //     console.log('Failed to get the storage location of u_Size');
    //     return;
    // }
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// GLobal related UI elements
let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=5;
let g_selectedType=POINT;
let g_segments=5;
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_headAngle = 0;
let g_magentaAngle = 0;
let g_walkAngle1 = 0;
let g_walkAngle2 = 0;
let g_tailAngle1 = 0;
let g_tailAngle2 = 0;
let g_tailAngle3 = 0;
let g_walkAnimation1 = false;
let g_magentaAnimation = false;
let g_speed = 1;
let pigSoung = new Audio("pigSound.mp3");
let shiftClick = false;
let carrotScale = 0;
let carrotTranslate = -14;


// Set up actions for the HTML UI Elements
function addActionsForHtmlUI(){
    // Button Events (Shape Type)

    document.getElementById('animationWalkOnButton').onclick = function() { g_walkAnimation1 = true; renderAllShapes();};
    document.getElementById('animationWalkOffButton').onclick = function() { g_walkAnimation1 = false; renderAllShapes();};


    // // Slider Events
    
    
    document.getElementById('headSlide').addEventListener('mousemove', function() { g_headAngle = this.value; renderAllShapes(); });

    document.getElementById('tailSlide1').addEventListener('mousemove', function() { g_tailAngle1 = this.value; renderAllShapes(); });
    document.getElementById('tailSlide2').addEventListener('mousemove', function() { g_tailAngle2 = this.value; renderAllShapes(); });
    document.getElementById('tailSlide3').addEventListener('mousemove', function() { g_tailAngle3 = this.value; renderAllShapes(); });

    document.getElementById('speedSlide').addEventListener('mousemove', function() { g_speed = this.value; renderAllShapes(); });
    
    document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngleX = this.value; renderAllShapes(); });
    // document.getElementById('segmentSlide').addEventListener('mouseup', function() { g_segments= this.value; });

    document.addEventListener('mousedown', function(event) {if (event.shiftKey) {
                                                                shiftClick = true;
                                                            } else {
                                                                shiftClick = false;
                                                            } });
    
    document.addEventListener('mouseup', function() {shiftClick = false;});                                                        
    

}   

function main() {
  
    setupWebGl();
    connectVariablesToGLSL();
    // Set up actions for the HTML UI elements 
    addActionsForHtmlUI();
    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    //canvas.onmousemove = click;
    
    canvas.onmousemove = function(ev){ if(ev.buttons == 1) {click(ev)} };


    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Clear <canvas>
    // gl.clear(gl.COLOR_BUFFER_BIT);
    // drawCap();
    //renderAllShapes();
    requestAnimationFrame(tick)
}


var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick(){
    // Print some debug info so we know we are running
    g_seconds = performance.now() / 1000.0 - g_startTime;
    // console.log(g_seconds);


    updateAnimationAngles();
    // Draw everthing
    renderAllShapes();

    // Tell the browser to update again when it has time
    requestAnimationFrame(tick);
}


var g_shapesList = [];
// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];


function click(ev) {
    if (!shiftClick){let [x,y] = convertCoordinatesEventToGL(ev);

        g_globalAngleX = x * 180;
        g_globalAngleY = y * 90;


        // Draw every shape that is supposed to be in the canvas
        renderAllShapes();
    }
}

function convertCoordinatesEventToGL(ev){
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return ([x,y]);
}

function updateAnimationAngles() {
    // if (g_yellowAnimation) {
    //     g_yellowAngle = (45 * Math.sin(g_seconds));
    // }
    // if (g_magentaAnimation) {
    //     g_magentaAngle = (45 * Math.sin(3 * g_seconds));
    // }
    if (g_walkAnimation1) {
        g_walkAngle1 = (45 * Math.sin(g_speed * g_seconds));
        g_walkAngle2 = (1 - 45 * Math.sin(g_speed * g_seconds));
        g_tailAngle1 = (30 * Math.sin(g_speed * g_seconds));
        g_tailAngle2 = (30 * Math.sin(g_speed * g_seconds));
        g_tailAngle3 = (30 * Math.sin(g_speed * g_seconds));
        if (g_speed > 16){
            g_headAngle = (45 * Math.sin(g_speed / 2 * g_seconds));
            pigSoung.play();
        } else {
            g_headAngle = 45 * Math.sin(g_speed / 5 * g_seconds);
        }
    }
    if (shiftClick) {
        carrotScale = 0.07;
        carrotTranslate = 1.5 * Math.sin(1.5 * g_speed * g_seconds) + 6;
    } else {
        carrotScale = 0;
        carrotTranslate = 0;
    }
    
    // if (g_walkAnimation1) {
    //     g_walkAngle2 = (1 - 45 * Math.sin(3 * g_seconds));
    // }
    // if (g_walkAnimation1) {
    //     g_tailAngle = (30 * Math.sin(4 * g_seconds));
    // }
}



function renderAllShapes(){
    // Check the time at the start of the function
    var startTime = performance.now();

    var globalRotMat = new Matrix4().rotate(g_globalAngleX,0,1,0);
    globalRotMat.rotate(g_globalAngleY, 1,0,0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //var len = g_points.length;

    var len = g_shapesList.length;
 

    skinPinkColor = [233/255,163/255,162/255,1];
    hoofColor = [100/255,52/255,50/255,1];
    snoutColor = [100/255,52/255,49/255,1];
    tailColor2 = [203/255,131/255,120/255,1];
    neon = [57/255, 1, 20/255, 1];
    purp = [1,0,1,1];
    // Draw acube body cube

    var head = new Cube();
    head.color = skinPinkColor;
    head.matrix.translate(-0.5 , 0.1, 0.0);
    head.matrix.scale(-1, 1, 1);
    var headCoordinatesMat1 = new Matrix4(head.matrix);
    head.matrix.rotate(- g_headAngle, 0,0, 1);
    var headCoordinatesMat2 = new Matrix4(head.matrix);
    var headCoordinatesMatEyeR = new Matrix4(head.matrix); 
    var headCoordinatesMatEyeL = new Matrix4(head.matrix); 
    var headCoordinatesMatCarrot = new Matrix4(head.matrix); 
    head.matrix.scale(0.39, 0.39, 0.39);
    head.render();

    rightEyeWhite = new Cube();
    rightEyeWhite.color = [1,1,1,1];
    rightEyeWhite.matrix = headCoordinatesMatEyeR;
    rightEyeWhite.matrix.scale(0.05, 0.05, 0.05);
    rightEyeWhite.matrix.translate(7.2, 3.64, 0.86);
    var rightEyeWhiteCoordinatesMat = new Matrix4(rightEyeWhite.matrix);
    rightEyeWhite.render();

    rightEyeBlack = new Cube();
    rightEyeBlack.color = [0,0,0,1];
    rightEyeBlack.matrix = rightEyeWhiteCoordinatesMat;
    rightEyeBlack.matrix.translate(0, 0, -0.86)
    rightEyeBlack.render();

    leftEyeWhite = new Cube();
    leftEyeWhite.color = [1,1,1,1];
    leftEyeWhite.matrix = headCoordinatesMatEyeL;
    leftEyeWhite.matrix.scale(0.05, 0.05, 0.05);
    leftEyeWhite.matrix.translate(7.2, 3.64, 6.8);
    leftEyeWhite.matrix.scale(1, 1, -1);
    var leftEyeWhiteCoordinatesMat = new Matrix4(leftEyeWhite.matrix);
    leftEyeWhite.render();

    leftEyeBlack = new Cube();
    leftEyeBlack.color = [0,0,0,1];
    leftEyeBlack.matrix = leftEyeWhiteCoordinatesMat;
    leftEyeBlack.matrix.translate(0, 0, -0.86)
    leftEyeBlack.render();

    var nose = new Cube();
    nose.color = skinPinkColor;
    nose.matrix = headCoordinatesMat2;
    nose.matrix.translate(0.3, 0.05, 0.1)
    nose.matrix.scale(0.136, 0.13, 0.19);
    var noseCoordinatesMatR = new Matrix4(nose.matrix);
    var noseCoordinatesMatL = new Matrix4(nose.matrix);
    nose.render();

    var snoutR = new Cube();
    snoutR.color = snoutColor;
    snoutR.matrix = noseCoordinatesMatR;
    snoutR.matrix.scale(0.3, 0.3, 0.2);
    snoutR.matrix.translate(2.6, 0.9, 0.15);
    snoutR.render();

    var snoutL = new Cube();
    snoutL.color = snoutColor;
    snoutL.matrix = noseCoordinatesMatL;
    snoutL.matrix.scale(0.3, 0.3, 0.2);
    snoutL.matrix.translate(2.6, 0.9, 3.91);
    snoutL.render();

    var body = new Cube();
    body.color = skinPinkColor;
    body.matrix = headCoordinatesMat1;
    body.matrix.translate(-0.58 , -0.1, -0.03);
    body.matrix.rotate(0, 0,0, 1);
    var bodyCoordinatesMatFR = new Matrix4(body.matrix);
    var bodyCoordinatesMatBL = new Matrix4(body.matrix);
    var bodyCoordinatesMatFL = new Matrix4(body.matrix);
    var bodyCoordinatesMatBR = new Matrix4(body.matrix);
    var bodyCoordinatesMatTail = new Matrix4(body.matrix);
    body.matrix.scale(0.7, 0.39, 0.45);
    body.render();

    // top initial tail seg
    var tail1 = new Cube();
    tail1.color = skinPinkColor;
    tail1.matrix = bodyCoordinatesMatTail;
    tail1.matrix.scale(0.05, 0.05, 0.05);
    tail1.matrix.translate(0.02 , 4, 2.02);
    tail1.matrix.scale(-1, -1, 1);
    var tail1CoordinatesMat = new Matrix4(tail1.matrix);
    // tail1.matrix.rotate(g_walkAngle1, 0,0, 1);
    tail1.render();

    var tail2 = new Cube();
    tail2.color = skinPinkColor;
    tail2.matrix = tail1CoordinatesMat;
    tail2.matrix.translate(0, 1, 0);
    var tail2CoordinatesMat = new Matrix4(tail2.matrix);
    tail2.render();
    
    var tail3 = new Cube();
    //tail3.color = skinPinkColor;
    tail3.color = skinPinkColor;
    tail3.matrix = tail2CoordinatesMat;
    tail3.matrix.translate(1, 1, 0);
    tail1.matrix.scale(-1, -1, 1);
    tail3.matrix.rotate(g_tailAngle1, 0,1, 0);
    var tail3CoordinatesMat = new Matrix4(tail3.matrix);
    tail3.render();

    var tail4 = new Cube();
    tail4.color = tailColor2;
    tail4.matrix = tail3CoordinatesMat;
    tail4.matrix.translate(0, 1, 1.2);
    tail4.matrix.rotate(g_tailAngle1, 1,0, 0);
    var tail4CoordinatesMat = new Matrix4(tail4.matrix);
    tail4.render();

    var tail5 = new Cube();
    tail5.color = tailColor2;
    tail5.matrix = tail3CoordinatesMat;
    tail5.matrix.translate(1, -1, 1);
    tail5.matrix.rotate(g_tailAngle2, 0,1, 0);
    var tail5CoordinatesMat = new Matrix4(tail5.matrix);
    tail5.render();

    var tail6 = new Cube();
    tail6.color = skinPinkColor;
    tail6.matrix = tail3CoordinatesMat;
    tail6.matrix.translate(1, -1, 1);
    var tail6CoordinatesMat = new Matrix4(tail6.matrix);
    tail6.matrix.rotate(g_tailAngle2, 0,0, 1);
    tail6.render();

    var tail7 = new Cube();
    tail7.color = tailColor2;
    tail7.matrix = tail6CoordinatesMat;
    tail7.matrix.scale(1, -1, -1);
    tail7.matrix.translate(-1, 0, 0);
    tail7.matrix.rotate(g_tailAngle3, 0,1,0);
    var tail7CoordinatesMat = new Matrix4(tail7.matrix);
    tail7.render();

    var frontRghtLeg = new Cube();
    frontRghtLeg.color = skinPinkColor;
    frontRghtLeg.matrix = bodyCoordinatesMatFR;
    frontRghtLeg.matrix.scale(1, -1, -1);
    frontRghtLeg.matrix.translate(0.5 , -0.1, -0.45);
    frontRghtLeg.matrix.rotate(g_walkAngle1, 0,0, 1);
    frontRghtLegMat1 = new Matrix4(frontRghtLeg.matrix);
    frontRghtLegMat2 = new Matrix4(frontRghtLeg.matrix);
    frontRghtLeg.matrix.scale(0.2, 0.4, 0.18);
    frontRghtLeg.render();

    var hoofFR1 = new Cube();
    hoofFR1.color = hoofColor;
    hoofFR1.matrix = frontRghtLegMat1;
    hoofFR1.matrix.translate(0.2 , 0.34, 0.001);
    // hoofFR1.matrix.rotate(g_walkAngle1, 0,0, 1);
    hoofFR1.matrix.scale(0.025, 0.06, 0.06);
    hoofFR1.render();

    var hoofFR2 = new Cube();
    hoofFR2.color = hoofColor;
    hoofFR2.matrix = frontRghtLegMat2;
    hoofFR2.matrix.translate(0.2 , 0.34, 0.1);
    // hoofFR1.matrix.rotate(g_walkAngle1, 0,0, 1);
    hoofFR2.matrix.scale(0.025, 0.06, 0.06);
    hoofFR2.render();

    var frontLeftLeg = new Cube();
    frontLeftLeg.color = skinPinkColor;
    frontLeftLeg.matrix = bodyCoordinatesMatFL;
    frontLeftLeg.matrix.scale(1, -1, 1);
    frontLeftLeg.matrix.translate(0.5 , -0.1, 0.001);
    frontLeftLeg.matrix.rotate(g_walkAngle2, 0,0, 1);
    frontLeftLegMat1 = new Matrix4(frontLeftLeg.matrix);
    frontLeftLegMat2 = new Matrix4(frontLeftLeg.matrix);
    frontLeftLeg.matrix.scale(0.2, 0.4, 0.18);
    frontLeftLeg.render();

    var hoofFL1 = new Cube();
    hoofFL1.color = hoofColor;
    hoofFL1.matrix = frontLeftLegMat1;
    hoofFL1.matrix.translate(0.2 , 0.34, 0.001);
    // hoofFR1.matrix.rotate(g_walkAngle1, 0,0, 1);
    hoofFL1.matrix.scale(0.025, 0.06, 0.06);
    hoofFL1.render();

    var hoofFL2 = new Cube();
    hoofFL2.color = hoofColor;
    hoofFL2.matrix = frontLeftLegMat2;
    hoofFL2.matrix.translate(0.2 , 0.34, 0.1);
    // hoofFR1.matrix.rotate(g_walkAngle1, 0,0, 1);
    hoofFL2.matrix.scale(0.025, 0.06, 0.06);
    hoofFL2.render();


    var backRightLeg = new Cube();
    backRightLeg.color = skinPinkColor;
    backRightLeg.matrix = bodyCoordinatesMatBR;
    backRightLeg.matrix.scale(1, -1, 1);
    backRightLeg.matrix.translate(0.002 , -0.1, 0.27);
    backRightLeg.matrix.rotate(g_walkAngle2, 0,0, 1);
    backRightLegMat1 = new Matrix4(backRightLeg.matrix);
    backRightLegMat2 = new Matrix4(backRightLeg.matrix);
    backRightLeg.matrix.scale(0.2, 0.4, 0.18);
    backRightLeg.render();

    var hoofFL1 = new Cube();
    hoofFL1.color = hoofColor;
    hoofFL1.matrix = backRightLegMat1;
    hoofFL1.matrix.translate(0.2 , 0.34, 0.001);
    // hoofFR1.matrix.rotate(g_walkAngle1, 0,0, 1);
    hoofFL1.matrix.scale(0.025, 0.06, 0.06);
    hoofFL1.render();

    var hoofFL2 = new Cube();
    hoofFL2.color = hoofColor;
    hoofFL2.matrix = backRightLegMat2;
    hoofFL2.matrix.translate(0.2 , 0.34, 0.1);
    // hoofFR1.matrix.rotate(g_walkAngle1, 0,0, 1);
    hoofFL2.matrix.scale(0.025, 0.06, 0.06);
    hoofFL2.render();


    var backLeftLeg = new Cube();
    backLeftLeg.color = skinPinkColor;
    backLeftLeg.matrix = bodyCoordinatesMatBL;
    backLeftLeg.matrix.scale(1, -1, 1);
    // frontRghtLeg.matrix.scale(0.01, 0.01, 0.18);
    backLeftLeg.matrix.translate(0.002 , -0.1, 0.0001);
    //var bodyCoordinatesMatBL = new Matrix4(backLeftLeg.matrix);
    backLeftLeg.matrix.rotate(g_walkAngle1, 0,0, 1);
    backLeftLegMat1 = new Matrix4(backLeftLeg.matrix);
    backLeftLegMat2 = new Matrix4(backLeftLeg.matrix);
    backLeftLeg.matrix.scale(0.2, 0.4, 0.18);
    backLeftLeg.render();


    var hoofBL1 = new Cube();
    hoofBL1.color = hoofColor;
    hoofBL1.matrix = backLeftLegMat1;
    hoofBL1.matrix.translate(0.2 , 0.34, 0.001);
    // hoofFR1.matrix.rotate(g_walkAngle1, 0,0, 1);
    hoofBL1.matrix.scale(0.025, 0.06, 0.06);
    hoofBL1.render();

    var hoofBL2 = new Cube();
    hoofBL2.color = hoofColor;
    hoofBL2.matrix = backLeftLegMat2;
    hoofBL2.matrix.translate(0.2 , 0.34, 0.1);
    // hoofFR1.matrix.rotate(g_walkAngle1, 0,0, 1);
    hoofBL2.matrix.scale(0.025, 0.06, 0.06);
    hoofBL2.render();
 

    let carrot = new Cone(30, 1.5, 0.7);
    carrot.color = [1.0, 0.5, 0.2, 1.0];
    carrot.height = 5;
    carrot.matrix = headCoordinatesMatCarrot;
    carrot.matrix.scale(carrotScale, -carrotScale, carrotScale);
    carrot.matrix.translate(carrotTranslate, -2 ,0);
    carrot.matrix.rotate(75, 1,0,0)
    carrot.render();
    console.log(shiftClick);


    

    // Check the time at the end of the function, and show on the webpage
    var duration = performance.now() - startTime;
    sendTextToHTML("nusendmdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");

}

// Set the text of a HTML element
function sendTextToHTML(text, htmlID){
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm){
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}


// function carrotAnimation() {
//     let carrot = new Cone(30, 1.5, 0.7);
//     carrot.color = [1.0, 0.5, 0.2, 1.0];
//     carrot.height = 5;

//     // Start position (adjust based on your model)
//     let startX = -12;  // A little in front of the mouth
//     let startY = -1;   // Slightly below the mouth
//     let startZ = 0;    // Same depth as the character

//     // Target position (mouth)
//     let targetX = -14;
//     let targetY = 0;
//     let targetZ = 0;

//     carrot.matrix.translate(startX, startY, startZ);
//     carrot.matrix.scale(0.5, 0.5, 0.5); // Adjust size

//     function animate() {
//         // Move towards the mouth slowly
//         let dx = (targetX - startX) * 0.05; // Move 10% of the way each frame
//         let dy = (targetY - startY) * 0.05;
//         let dz = (targetZ - startZ) * 0.05;

//         startX += dx;
//         startY += dy;
//         startZ += dz;

//         carrot.matrix.setTranslate(startX, startY, startZ);
//         gl.clear(gl.COLOR_BUFFER_BIT);
//         renderAllShapes();
//         carrot.render();

//         // If close enough to mouth, stop animation
//         if (Math.abs(startX - targetX) > 0.1 && Math.abs(startY - targetY) > 0.1) {
//             requestAnimationFrame(animate);
//         }
//     }

//     animate(); // Start animation
// }

