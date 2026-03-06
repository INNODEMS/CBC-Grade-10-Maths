

// // ---------- 1. BOARDS ----------
// // (Keep your existing board initializations)
// const brdControls = JXG.JSXGraph.initBoard('box_controls_opposite', {
//     boundingbox: [0, 10, 50, 0], axis: false, showCopyright: false, showNavigation: false
// });
// const initialRoadView = [-5, 10, 45, -5];
// const brdRoad = JXG.JSXGraph.initBoard('box_road_opposite', {
//     boundingbox: initialRoadView, axis: false, showCopyright: false
// });
// const brdActions = JXG.JSXGraph.initBoard('box_actions_opposite', {
//     boundingbox: [0, 5, 50, 0], axis: false, showCopyright: false, showNavigation: false
// });
// brdControls.addChild(brdRoad);

// // ---------- 2. STATE ----------
// let time = 0;
// let running = false;
// let animationID = null;
// let meetMessage = null;

// // ---------- 3. CONTROLS ----------
// const s1 = brdControls.create('slider', [[2, 7], [18, 7], [0, 8, 25]], { name: 'Speed A', snapWidth: 0.1 });
// const s2 = brdControls.create('slider', [[2, 4], [18, 4], [0, 8, 25]], { name: 'Speed B', snapWidth: 0.1 });

// brdControls.create('text', [30, 7, () => "Relative Speed: " + (s1.Value() + s2.Value()).toFixed(2) + " m/s"], { fontSize: 16 });
// brdControls.create('text', [30, 4, () => "Time: " + time.toFixed(2) + " s"], { fontSize: 18, fontWeight: 'bold' });

// // ---------- 4. ROAD & AXIS ----------
// const xaxis = brdRoad.create('axis', [[0, 7], [1, 7]], { name: 'Position (m)', withLabel: true });

// // ---------- 5. START POSITIONS (GLIDERS) ----------
// // We initialize them at 5 and 35
// const pA = brdRoad.create('glider', [5, 7, xaxis], { color: 'red', name: 'A' });
// const pB = brdRoad.create('glider', [35, 7, xaxis], { color: 'blue', name: 'B' });

// // Store starting positions when the "Start" button is clicked
// let startX_A = 5;
// let startX_B = 35;

// // ---------- 6. DYNAMIC PHYSICS ----------
// // Car A moves right: start + (speed * time)
// const posA = () => startX_A + s1.Value() * time;
// // Car B moves left: start - (speed * time) 
// const posB = () => startX_B - s2.Value() * time;

// // Visual Representations
// brdRoad.create('text', [() => posA(), 1.2, "🚗"], { fontSize: 55, anchorX: 'middle', anchorY: 'middle',
// cssStyle: 'transform: scaleX(-1);' });
// brdRoad.create('text', [() => posB(), 1.2, "🚙"], { 
//     fontSize: 55, anchorX: 'middle', anchorY: 'middle'
//     // cssStyle: 'transform: scaleX(-1);' // Flip blue car to face left
// });

// // ---------- 7. ACTION BUTTONS ----------
// brdActions.create('button', [5, 2.5, "Start", function () {
//     if (!running) {
//         // Capture the current glider positions as the starting points for the math
//         startX_A = pA.X();
//         startX_B = pB.X();
        
//         // Disable dragging during animation
//         pA.setAttribute({fixed: true});
//         pB.setAttribute({fixed: true});
        
//         running = true;
//         animate();
//     }
// }]);

// brdActions.create('button', [25, 2.5, "Reset", function () {
//     running = false;
//     time = 0;
//     cancelAnimationFrame(animationID);
//     pA.setAttribute({fixed: false});
//     pB.setAttribute({fixed: false});
//     if (meetMessage) { brdRoad.removeObject(meetMessage); meetMessage = null; }
//     brdRoad.setBoundingBox(initialRoadView);
//     brdRoad.update();
// }]);

// // ---------- 8. ANIMATION LOOP ----------
// function animate() {
//     if (!running) return;

//     time += 0.02; // Increment time

//     // Meeting logic
//     if (posA() >= posB()) {
//         running = false;
//         meetMessage = brdRoad.create('text', [posA(), 4.5, "Objects Met!"], {
//             fontSize: 24, fontWeight: 'bold', color: '#D4AF37', anchorX: 'middle'
//         });
//     }

//     brdRoad.update();
//     brdControls.update();
//     animationID = requestAnimationFrame(animate);
// }



// ======================================================
// Relative Speed – Opposite Directions
// Cars move toward each other, meet, then continue
// ======================================================


// ------------------------------------------------------
// 1. BOARDS
// ------------------------------------------------------

const brdControls = JXG.JSXGraph.initBoard('box_controls_opposite', {
    boundingbox: [0,10,50,0],
    axis:false,
    showNavigation:false,
    showCopyright:false
});

const initialRoadView = [-5,10,45,-5];

const brdRoad = JXG.JSXGraph.initBoard('box_road_opposite',{
    boundingbox: initialRoadView,
    axis:false,
    showCopyright:false
});

const brdActions = JXG.JSXGraph.initBoard('box_actions_opposite',{
    boundingbox:[0,5,50,0],
    axis:false,
    showNavigation:false,
    showCopyright:false
});

brdControls.addChild(brdRoad);


// ------------------------------------------------------
// 2. STATE VARIABLES
// ------------------------------------------------------

let time = 0;
let running = false;
let hasMet = false;
let animationID = null;

let meetTime = null;
let meetMessage = null;

let startA = 5;
let startB = 35;


// ------------------------------------------------------
// 3. CONTROLS
// ------------------------------------------------------

const s1 = brdControls.create(
    'slider',
    [[2,7],[18,7],[0,8,25]],
    {name:'Speed A',snapWidth:0.1}
);

const s2 = brdControls.create(
    'slider',
    [[2,4],[18,4],[0,8,25]],
    {name:'Speed B',snapWidth:0.1}
);


// Relative speed display
brdControls.create('text',
[30,7,
()=> "Relative Speed: " + (s1.Value()+s2.Value()).toFixed(2) + " m/s"
],
{fontSize:16});


// Time display
brdControls.create('text',
[30,4,
()=> "Time: " + time.toFixed(2) + " s"
],
{fontSize:18,fontWeight:'bold'});


// ------------------------------------------------------
// 4. ROAD
// ------------------------------------------------------

brdRoad.create('polygon',
[[-10000,2.5],[10000,2.5],[10000,-1],[-10000,-1]],
{
fillColor:'#333',
fillOpacity:1,
borders:{visible:false},
fixed:true
});

brdRoad.create('line',
[[0,0.75],[1,0.75]],
{
strokeColor:'white',
dash:2,
strokeWidth:3,
fixed:true
});

const xaxis = brdRoad.create('axis',
[[0,7],[1,7]],
{
name:'Position (m)',
withLabel:true,
label:{offset:[0,15]}
});


// ------------------------------------------------------
// 5. DRAGGABLE START POINTS
// ------------------------------------------------------

var pA = brdRoad.create('glider',
[startA,7,xaxis],
{color:'red',size:4,fixed:()=>running});

var pB = brdRoad.create('glider',
[startB,7,xaxis],
{color:'blue',size:4,fixed:()=>running});

pA.on('drag',()=>{ if(!running) startA=pA.X(); });
pB.on('drag',()=>{ if(!running) startB=pB.X(); });


// ------------------------------------------------------
// 6. PHYSICS POSITIONS
// ------------------------------------------------------

const posA = ()=> startA + s1.Value()*time;   // right
const posB = ()=> startB - s2.Value()*time;   // left


// ------------------------------------------------------
// 7. DISTANCE COVERED LABELS
// ------------------------------------------------------

brdRoad.create('text',
[()=>posA(),8.3,
()=> "A Dist: "+(posA()-startA).toFixed(1)+" m"],
{anchorX:'middle',fontSize:12,color:'red'}
);

brdRoad.create('text',
[()=>posB(),9.2,
()=> "B Dist: "+(startB-posB()).toFixed(1)+" m"],
{anchorX:'middle',fontSize:12,color:'blue'}
);


// ------------------------------------------------------
// 8. DOTTED PROJECTION LINES
// ------------------------------------------------------

brdRoad.create('segment',
[()=>[posA(),7],()=>[posA(),1.5]],
{dash:1,strokeColor:'red',opacity:0.6});

brdRoad.create('segment',
[()=>[posB(),7],()=>[posB(),1.5]],
{dash:1,strokeColor:'blue',opacity:0.6});


// ------------------------------------------------------
// 9. CAR ICONS
// ------------------------------------------------------

brdRoad.create('text',
[()=>posA(),1.2,"🚗"],
{fontSize:55,anchorX:'middle',anchorY:'middle',
cssStyle:'transform: scaleX(-1);'});

brdRoad.create('text',
[()=>posB(),1.2,"🚙"],
{
fontSize:55,
anchorX:'middle',
anchorY:'middle'
});


//  ACTION BUTTONS

// START
brdActions.create('button',
[5,2.5,"Start",function(){

if(!running){

let distance = startB-startA;
let relSpeed = s1.Value()+s2.Value();

if(relSpeed>0)
meetTime = distance/relSpeed;

running=true;
btnPause.setText("Pause");
animate();
}

}] );


// PAUSE / RESUME
const btnPause = brdActions.create('button',
[15,2.5,"Pause",function(){

if(running){

running=false;
this.setText("Resume");

}else{

running=true;
this.setText("Pause");
animate();

}

}] );


// RESET
brdActions.create('button',
[25,2.5,"Reset",function(){

cancelAnimationFrame(animationID);

running=false;
hasMet=false;
time=0;
meetTime=null;

btnPause.setText("Pause");

if(meetMessage){
brdRoad.removeObject(meetMessage);
meetMessage=null;
}

brdRoad.setBoundingBox(initialRoadView,false);

brdRoad.update();
brdControls.update();

}] );


// ------------------------------------------------------
// 11. ANIMATION LOOP
// ------------------------------------------------------

function animate(){

if(!running) return;

let dt = 0.02;

time += dt;


// Detect meeting
if(!hasMet && meetTime!==null && time>=meetTime){

time = meetTime;
hasMet=true;
running=false;

btnPause.setText("Resume");

let meetX = posA();

meetMessage = brdRoad.create('text',
[meetX,4.5,"Cars Met!"],
{
fontSize:24,
fontWeight:'bold',
color:'#D4AF37',
anchorX:'middle'
});

}


// Camera tracking
let curA = posA();
let curB = posB();

let minX = Math.min(curA,curB,startA,startB);
let maxX = Math.max(curA,curB,startA,startB);

let padding = Math.max(20,(maxX-minX)*0.4);

brdRoad.setBoundingBox([minX-10,10,maxX+padding,-5],false);


brdRoad.update();
brdControls.update();


if(running || hasMet)
animationID = requestAnimationFrame(animate);

}