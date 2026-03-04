
var board = JXG.JSXGraph.initBoard('jxgbox-speed-velocity', {
    boundingbox: [-2, 5, 12, -3],
    axis: true,
    grid: false,
    showNavigation: false,
    showCopyright: false
});

// STATE VARIABLES
var time = 0;
var animationRunning = false;
var startPos = 0;
var carX = 0;
var totalDist = 0;
var lastX = 0;

// CAR ICON
var car = board.create('text', [
    function() { return carX; },
    0.6,
    "🚗"
], {
    fontSize: 34,
    anchorX: 'middle',
    anchorY: 'middle'
});

// KEY LOCATIONS
board.create('point', [0, 0], {
    name: 'Home',
    fixed: true,
    size: 3,
    color: 'blue',
    label: {offset: [-50, 15]}
});

board.create('point', [10, 0], {
    name: 'Turn',
    fixed: true,
    size: 3,
    color: 'red',
    label: {offset: [-10, 15]}
});

// DATA DISPLAY (LEFT SIDE)
var textStyle = {
    fontSize: 16,
    fixed: true,
    anchorX: 'left'
};

board.create('text', [0.5, 4.8, "Motion Data"], {
    fontSize: 18,
    fixed: true,
    fontWeight: 'bold'
});

board.create('text', [0.5, 4.3, function() {
    return "Time: " + time.toFixed(1) + " s";
}], textStyle);

board.create('text', [0.5, 3.7, function() {
    return "Total Distance: " + totalDist.toFixed(2) + " m";
}], { ...textStyle, color: 'green' });

board.create('text', [0.5, 3.1, function() {
    var disp = carX - startPos;
    return "Displacement: " + disp.toFixed(2) + " m";
}], { ...textStyle, color: 'blue' });

// CALCULATIONS (RIGHT SIDE)
board.create('text', [6, 4.8, "Rate Calculations"], {
    fontSize: 18,
    fixed: true,
    fontWeight: 'bold'
});

board.create('text', [6, 4.3, function() {
    if (time === 0) return "Average Speed: 0.00 m/s";
    var speed = totalDist / time;
    return "Average Speed = " + speed.toFixed(2) + " m/s";
}], { ...textStyle, color: 'green' });

board.create('text', [6, 3.7, function() {
    if (time === 0) return "Average Velocity: 0.00 m/s";
    var velocity = (carX - startPos) / time;
    return "Average Velocity = " + velocity.toFixed(2) + " m/s";
}], { ...textStyle, color: 'blue' });


// Animation Logic (Updated with Snapping)
function animate() {
    if (!animationRunning) return;

    time += 0.02; 

    if (time <= 4) {
        carX = 2.5 * time;
    } else if (time < 6) { // Use < instead of <= here
        carX = 10 - (2.5 * (time - 4));
    } else {
        // --- SNAP TO FINAL VALUES ---
        animationRunning = false;
        time = 6.0;      // Force exact time
        carX = 5.0;      // Force exact final position
        totalDist = 15.0; // Force exact total distance
    }

    // Accumulate Distance (only while moving)
    if (animationRunning) {
        totalDist += Math.abs(carX - lastX);
    }
    lastX = carX;

    board.update();
    if (animationRunning) {
        requestAnimationFrame(animate);
    }
}

// CONTROL BUTTONS
// Start Button
board.create('button', [3, -2, '▶ Start Trip', function() {
    time = 0;
    carX = 0;
    lastX = 0;
    totalDist = 0;
    animationRunning = true;
    animate();
}], {
    cssStyle: 'padding: 8px; font-weight: bold; font-size: 15px;'
});

// Restart Button
board.create('button', [6.5, -2, '⟲ Restart', function() {

    animationRunning = false;

    time = 0;
    carX = 0;
    lastX = 0;
    totalDist = 0;

    board.update();

}], {
    cssStyle: 'padding: 8px; font-weight: bold; font-size: 15px;'
});