
const board = JXG.JSXGraph.initBoard('jsxgraph-acceleration', {
    boundingbox: [-5, 10, 100, -5],
    axis: false,
    grid: false,
    showNavigation: false,
    showCopyright: false
});

//  STATE VARIABLES

let time = 0;
let running = false;
let animationID = null;


// ---Sliders with Labels Below ---

// Initial Velocity (u)
const sU = board.create('slider', [[10, -2], [40, -2], [0, 5, 20]], {
    name: 'u', // Internal name
    withLabel: false, // Hide the default label to prevent overlap
    snapWidth: 0.1
});

// Custom label for u - positioned below the slider segment
board.create('text', [10, -2.8, 'Initial velocity u (m/s)'], {
    fontSize: 14,
    color: '#2c3e50'
});

// Acceleration (a)
const sA = board.create('slider', [[60, -2], [90, -2], [0, 2, 10]], {
    name: 'a',
    withLabel: false,
    snapWidth: 0.1
});

// Custom label for a - positioned below the slider segment
board.create('text', [60, -2.8, 'Acceleration a (m/s²)'], {
    fontSize: 14,
    color: '#2c3e50'
});

// --- Value Display ---
// Since we turned off the internal label, we can add a dynamic text 
// to show the current values near the sliders
board.create('text', [41, -2, () => sU.Value().toFixed(1)], {fontSize: 14});
board.create('text', [91, -2, () => sA.Value().toFixed(1)], {fontSize: 14});


// PHYSICS FUNCTIONS

// position
const getPos = () => sU.Value()*time + 0.5*sA.Value()*time*time;

// velocity
const getVel = () => sU.Value() + sA.Value()*time;

// AXIS

const xaxis = board.create(
    'axis',
    [[0,2],[1,2]],
    { name:'Position (m)', withLabel:true }
);

// CAR

board.create('text',
[()=>getPos(),3,"🏎️"],
{
fontSize:50,
anchorX:'middle',
anchorY:'middle',
cssStyle:'transform: scaleX(-1);'
});

// VELOCITY VECTOR

board.create('arrow',
[
[()=>getPos(),4],
[()=>getPos()+getVel(),4]
],
{
strokeColor:'green',
strokeWidth:3
});

// POSITION PROJECTION LINE

board.create('segment',
[
()=>[getPos(),3],
()=>[getPos(),2]
],
{
dash:1,
strokeColor:'gray'
});

// DISTANCE LABEL

board.create('text',
[()=>getPos(),5,
()=> "Distance: " + getPos().toFixed(2) + " m"
],
{anchorX:'middle',fontSize:14}
);

// DATA DISPLAY

board.create('text',
[10,8,function(){
return "<div style='background:white;padding:10px;border:1px solid #333;border-radius:6px;width:200px'>" +
"<b>Motion Data</b><br>" +
"Time: "+time.toFixed(2)+" s<br>" +
"Velocity: "+getVel().toFixed(2)+" m/s<br>" +
"Position: "+getPos().toFixed(2)+" m<br>" +
"Acceleration: "+sA.Value().toFixed(2)+" m/s²</div>";
}],
{fixed:true}
);

// ANIMATION LOOP

function animate(){

if(!running) return;

time += 0.03;

// stop if car exits screen
if(getPos() > 100){
running=false;
btnPause.setText("Resume");
}

board.update();

animationID = requestAnimationFrame(animate);

}

// CONTROL BUTTONS

board.create('button',
[10,5.7,"Start",function(){

if(!running){
running=true;
btnPause.setText("Pause");
animate();
}

}],
{fixed:true}
);

const btnPause = board.create('button',
[25,5.7,"Pause",function(){

if(running){

running=false;
this.setText("Resume");

}else{

running=true;
this.setText("Pause");
animate();

}

}],
{fixed:true}
);

board.create('button',
[40,5.7,"Reset",function(){

running=false;
time=0;

cancelAnimationFrame(animationID);

btnPause.setText("Pause");

board.update();

}],
{fixed:true}
);