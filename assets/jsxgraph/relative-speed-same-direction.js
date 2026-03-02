// --- 1. INITIALIZE BOARDS ---
const brdControls = JXG.JSXGraph.initBoard('box_controls', {
    boundingbox: [0, 10, 50, 0], axis: false, showCopyright: false, showNavigation: false
});

const initialRoadView = [-5, 10, 45, -5];
const brdRoad = JXG.JSXGraph.initBoard('box_road', {
    boundingbox: initialRoadView, axis: false, showCopyright: false
});

const brdActions = JXG.JSXGraph.initBoard('box_actions', {
    boundingbox: [0, 5, 50, 0], axis: false, showCopyright: false, showNavigation: false
});

brdControls.addChild(brdRoad);

// --- 2. STATE ---
let time = 0;
let running = false;
let hasMet = false;
let animationID = null;
let meetMessage = null;
let startA = 5;  // Initial position of Red Car
let startB = 20; // Initial position of Blue Car

// --- 3. TOP PANEL: CONTROLS ---
const s1 = brdControls.create('slider', [[2, 7], [18, 7], [0, 10, 25]], { name: 'S1 (Red)', snapWidth: 0.1 });
const s2 = brdControls.create('slider', [[2, 4], [18, 4], [0, 5, 25]], { name: 'S2 (Blue)', snapWidth: 0.1 });

brdControls.create('text', [30, 7, () => "Relative Speed: " + Math.abs(s1.Value() - s2.Value()).toFixed(2) + " m/s"], { fontSize: 16 });
brdControls.create('text', [30, 4, () => "Time: " + time.toFixed(2) + " s"], { fontSize: 18, fontWeight: 'bold' });

// --- 4. MIDDLE PANEL: THE HIGHWAY ---
brdRoad.create('polygon', [[-10000, 2.5], [10000, 2.5], [10000, -1], [-10000, -1]], {
    fillColor: '#333', fillOpacity: 1, borders: { visible: false }, fixed: true
});
brdRoad.create('line', [[0, 0.75], [1, 0.75]], { strokeColor: 'white', dash: 2, strokeWidth: 3, fixed: true });

const xaxis = brdRoad.create('axis', [[0, 7], [1, 7]], { name: 'Position (m)', withLabel: true, label: { offset: [0, 15] } });

var pA = brdRoad.create('glider', [startA, 7, xaxis], { name: '', color: 'red',  size: 4, fixed: () => running });
var pB = brdRoad.create('glider', [startB, 7, xaxis], { name: '', color: 'blue', size: 4, fixed: () => running });

pA.on('drag', () => { if (!running) startA = pA.X(); });
pB.on('drag', () => { if (!running) startB = pB.X(); });

// PHYSICS EQUATIONS
const posA = () => startA + s1.Value() * time;
const posB = () => startB + s2.Value() * time;

// CORRECTED LABELS: Distance Covered = Current Position - Start Position
brdRoad.create('text', [() => posA(), 8.3, () => "A Dist: " + (posA() - startA).toFixed(1) + " m"], { anchorX: 'middle', fontSize: 12, color: 'red' });
brdRoad.create('text', [() => posB(), 9.2, () => "B Dist: " + (posB() - startB).toFixed(1) + " m"], { anchorX: 'middle', fontSize: 12, color: 'blue' });

// Meeting indicators (dotted lines)
brdRoad.create('segment', [() => [posA(), 7], () => [posA(), 1.5]], { dash: 1, strokeColor: 'red', opacity: 0.5 });
brdRoad.create('segment', [() => [posB(), 7], () => [posB(), 1.5]], { dash: 1, strokeColor: 'blue', opacity: 0.5 });

brdRoad.create('text', [() => posA(), 1.2, "🚗"], { fontSize: 55, anchorX: 'middle', anchorY: 'middle', cssStyle: 'transform: scaleX(-1);' });
brdRoad.create('text', [() => posB(), 1.2, "🚙"], { fontSize: 55, anchorX: 'middle', anchorY: 'middle', cssStyle: 'transform: scaleX(-1);' });

// --- 5. BOTTOM PANEL: ACTIONS ---
brdActions.create('button', [5, 2.5, "Start", function () { 
    if (!running) { running = true; btnPause.setText("Pause"); animate(); } 
}]);

const btnPause = brdActions.create('button', [15, 2.5, "Pause", function () {
    if (running) { running = false; this.setText("Resume"); } 
    else { running = true; this.setText("Pause"); animate(); }
}]);

brdActions.create('button', [25, 2.5, "Reset", function () {
    cancelAnimationFrame(animationID);
    running = false; hasMet = false; time = 0;
    btnPause.setText("Pause");
    if (meetMessage) { brdRoad.removeObject(meetMessage); meetMessage = null; }
    brdRoad.setBoundingBox(initialRoadView, false);
    brdRoad.update();
    brdControls.update();
}]);

// --- 6. ANIMATION ---
function animate() {
    if (!running) return;
    
    let dt = 0.02;
    let nextTime = time + dt;
    
    // Check if they WILL meet in the next frame
    let nextGap = (startB + s2.Value() * nextTime) - (startA + s1.Value() * nextTime);

    // EXACT MEETING LOGIC
    if (!hasMet && nextGap <= 0 && s1.Value() > s2.Value()) {
        // Calculate the exact time of collision: t = (xB0 - xA0) / (vA - vB)
        time = (startB - startA) / (s1.Value() - s2.Value());
        hasMet = true;
        running = false;
        btnPause.setText("Resume");
        
        meetMessage = brdRoad.create('text', [posA(), 4.5, "Cars Met!"], {
            color: '#D4AF37', fontWeight: 'bold', fontSize: 24, strokeColor: 'black', strokeWidth: 1, anchorX: 'middle'
        });
    } else {
        time = nextTime;
    }

    // Camera Tracking
    let curA = posA();
    let curB = posB();
    let minX = Math.min(curA, curB, startA, startB);
    let maxX = Math.max(curA, curB, startA, startB);
    let padding = Math.max(20, (maxX - minX) * 0.4);
    brdRoad.setBoundingBox([minX - 10, 10, maxX + padding, -5], false);

    brdRoad.update();
    brdControls.update();
    if (running || hasMet) animationID = requestAnimationFrame(animate);
}