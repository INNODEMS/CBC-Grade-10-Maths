
var board = JXG.JSXGraph.initBoard('jsxgraph-elevation', {
    boundingbox: [-2, 12, 14, -2], // Adjusted viewport for standard elevation problems
    axis: false,
    grid: false,
    showNavigation: false,
    showCopyright: false
});

// Controls & Base Constructions
var degToRad = Math.PI / 180;

// Angle Slider (theta)
var angleSlider = board.create('slider', [[-1, 11], [5, 11], [10, 30, 70]], {
    name: '&theta;',
    suffixLabel: '&deg;',
    snapWidth: 1,
    strokeColor: 'black',
    fillColor: 'black'
});

// Ground line (x-axis)
var groundLine = board.create('axis', [[0, 0], [1, 0]], { visible: false });

// Key Points and Object Geometry
// Fixed Horizontal Position of the Object base
var objX = 12;

// Observer Eye P (Draggable glider restricted to ground line)
var P = board.create('glider', [2, 0, groundLine], { name: 'Eye', color: 'blue', size: 5, label: {offset: [0, -20]} });

// Base of the object Q on ground (fixed horizontally relative to P)
var Q = board.create('point', [objX, 0], { name: 'Base', fixed: true, visible: true, size: 2, color: 'black', label: {offset: [0, -15]} });

// Top of the object R (Calculated dynamically based on distance PQ and angle theta)
var R = board.create('point', [
    objX,
    function() {
        var d = Q.X() - P.X(); // Use Q.X() so it works regardless of P's position
        var h = d * Math.tan(angleSlider.Value() * degToRad);
        return (h > 0) ? h : 0.001; // Avoid negative heights if P dragged past Q (handled by slider bounds)
    }
], { name: 'Top', visible: true, size: 3, color: 'red', label: {offset: [0, 15]} });

// Drawing the Triangle Elements
// Ground Line (Adjacent)
var segPQ = board.create('segment', [P, Q], { strokeWidth: 2, strokeColor: 'black' });
// Object (Opposite) - Make it thick
var segQR = board.create('segment', [Q, R], { strokeWidth: 5, strokeColor: 'black' });
// Line of Sight (Hypotenuse)
var segPR = board.create('segment', [P, R], { strokeWidth: 3, strokeColor: 'blue', dash: 2, strokeOpacity: 0.6 });

// Angle of Elevation (defined by Q, P, R)
board.create('angle', [Q, P, R], {
    name: function() { return angleSlider.Value() + '&deg;'; },
    radius: 1.5,
    fillColor: '#FFD700',
    fillOpacity: 0.3,
    strokeColor: '#FFA500'
});

// Right Angle Symbol at Q
board.create('angle', [P, Q, R], {
    type: 'square', radius: 0.7, fillColor: 'none', strokeColor: 'black', strokeWidth: 1.5
});

// Observer Icon (Visual flair)
board.create('text', [function(){ return P.X() - 0.4; }, 0.5, "👁"], { fontSize: 24, fixed:true });

// Moving Labels (These labels 'rise' and move with the geometry)
var labelStyle = { fontSize: 13, color: 'black', fontWeight: 'bold' };

// Adjacent Side (Distance)
board.create('text', [
    function() { return (P.X() + Q.X()) / 2 - 0.8; }, 
    -0.5, 
    "Horizontal (Adjacent)"
], labelStyle);

// Opposite Side (Height)
board.create('text', [
    function() { return Q.X() + 0.1; }, 
    function() { return R.Y() / 2; }, 
    "Height (Opposite)"
], labelStyle);

// Hypotenuse (Line of Sight)
board.create('text', [
    function() { return (P.X() + R.X()) / 2 - 1.2; }, 
    function() { return R.Y() / 2 + 0.5; }, 
    "Line of Sight (Hypotenuse)"
], { 
    ...labelStyle, 
    color: 'blue', 
    rotate: function() { 
        var dx = Q.X() - P.X();
        var dy = R.Y();
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }
});

// Numerical Calculations (Static readouts glued to screen)
var textYPos = 9;
var outputStyle = { fontSize: 16, color: 'black', fixed: true };

board.create('text', [-1, textYPos, function() {
    var d = Q.X() - P.X();
    var theta = angleSlider.Value();
    var h = d * Math.tan(theta * degToRad);
    return "Distance (d): " + d.toFixed(1) + " m<br>" +
           "Angle (&theta;): " + theta + "&deg;<br>" +
           "Height (h): <b>" + h.toFixed(2) + " m</b>";
}], outputStyle);

board.create('text', [-1, textYPos - 2.5, function() {
    var theta = angleSlider.Value();
    var tanVal = Math.tan(theta * degToRad);
    return "tan(&theta;) = Opp / Adj<br>" + 
           "tan(" + theta + "&deg;) = " + tanVal.toFixed(3);
}], { ...outputStyle, color: '#FFA500' });
