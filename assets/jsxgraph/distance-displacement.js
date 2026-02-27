var board = JXG.JSXGraph.initBoard('jxgbox-anim-dist-disp', {
    boundingbox: [-4, 5, 7, -2],
    axis: true,
    grid: false,
    showNavigation: false,
    showCopyright: false,
    zoom: true
});

// Key Locations
var pStart = board.create('point', [-3, 0], {
    name: 'Home',
    fixed: true,
    size: 4,
    color: 'blue',
    label: {offset: [-40, 15], anchorX: 'left', anchorY: 'top'}
});

var pTurn = board.create('point', [6, 0], {
    name: 'Market',
    fixed: true,
    size: 4,
    color: 'blue',
    visible: true,
    label: {offset: [10, 15], anchorX: 'left', anchorY: 'top'}
});

var pEnd = board.create('point', [6, 3], {
    name: 'School',
    fixed: true,
    size: 4,
    color: 'blue',
    visible: false,
    label: {offset: [10, 10], anchorX: 'left', anchorY: 'top'}
});

// Progress Variable
var progress = 0;
var animationRunning = false;

// Car Icon
var carX = -3;
var carY = 0;

var car = board.create('text', [
    function () { return carX; },
    function () { return carY; },
    "🚗"
], {
    fontSize: 28,
    anchorX: 'middle',
    anchorY: 'middle',
    cssStyle: 'transform: scaleX(-1);' // Flip the car icon to face right
});

// Rotation state: false = facing right; true = rotated anticlockwise (upwards)
var rotated = false;

// Distance Path (Red)
var pathTrace = board.create('curve', [[-3], [0]], {
    strokeColor: 'red',
    strokeWidth: 4,
    strokeOpacity: 0.7
});

pathTrace.updateDataArray = function () {

    this.dataX = [-3];
    this.dataY = [0];

    if (progress > 0) {
        if (progress > 1) {
            this.dataX.push(6);
            this.dataY.push(0);
        }

        this.dataX.push(carX);
        this.dataY.push(carY);
    }
};

// Distance Text (Top)
board.create('text', [0.5, 4.6, function () {

    var dist = 0;

    if (progress <= 1) {
        dist = 9 * progress;
    } else {
        dist = 9 + 3 * (progress - 1);
    }

    return "Distance Travelled: " + dist.toFixed(2) + " km";

}], {
    color: 'red',
    fontSize: 16,
    anchorX: 'left' 
});

// Displacement Text (Below Distance)
board.create('text', [0.5, 4.2, function () {

    if (progress < 2) return "";

    var dx = pEnd.X() - pStart.X();
    var dy = pEnd.Y() - pStart.Y();
    var mag = Math.sqrt(dx * dx + dy * dy);

    return "Displacement: " + mag.toFixed(2) + " km";

}], {
    color: 'blue',
    fontSize: 16,
    anchorX: 'left'
});

// Displacement Line
board.create('segment', [pStart, pEnd], {
    strokeColor: 'blue',
    strokeWidth: 3,
    dash: 2,
    visible: function () {
        return progress >= 2;
    }
});

// Animation Loop
function animate() {

    if (!animationRunning) return;

    progress += 0.004;

    if (progress > 2) {
        progress = 2;
        animationRunning = false;
        pEnd.setAttribute({ visible: true });
    }

    if (progress <= 1) {
        carX = -3 + 9 * progress;
        carY = 0;
        if (rotated) {
            car.setAttribute({ cssStyle: 'transform: scaleX(-1);' });
            rotated = false;
        }
    } else {
        carX = 6;
        carY = 3 * (progress - 1);
        if (!rotated) {
            car.setAttribute({ cssStyle: 'transform: scaleX(-1) rotate(-270deg);' });
            rotated = true;
        }
    }

    board.update();
    requestAnimationFrame(animate);
}

// Play Button
board.create('button', [-4, -1, '▶ Start Journey', function () {

    progress = 0;
    carX = -3;
    carY = 0;
    pEnd.setAttribute({ visible: false });

    // ensure car faces right at start
    rotated = false;
    car.setAttribute({ cssStyle: 'transform: scaleX(-1);' });

    animationRunning = true;
    animate();

}], {
    cssStyle: 'padding: 8px; font-size: 16px; font-weight: bold;'
});


// Restart Button
board.create('button', [1.5, -1, '⟲ Restart', function () {

    // Stop animation
    animationRunning = false;

    // Reset progress
    progress = 0;

    // Move car back to Home
    carX = -3;
    carY = 0;

    // ensure car faces right after restart
    rotated = false;
    car.setAttribute({ cssStyle: 'transform: scaleX(-1);' });

    // Hide destination
    pEnd.setAttribute({ visible: false });

    // Clear path trace
    pathTrace.dataX = [-3];
    pathTrace.dataY = [0];

    board.update();

}], {
    cssStyle: 'padding: 1px; font-size: 16px; font-weight: bold;'
});