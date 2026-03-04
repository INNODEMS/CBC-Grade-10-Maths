
var board = JXG.JSXGraph.initBoard('jsxgraph-depression', {
    boundingbox: [-3, 13, 22, -3], // Wide view to accommodate shallow angles
    axis: false,
    grid: false,
    showNavigation: false,
    showCopyright: false
});

var degToRad = Math.PI / 180;

// Controls
// Angle Slider (theta) - constrained to 20 to 75 to keep target on screen
var angleSlider = board.create('slider', [[1, 11], [6, 11], [20, 35, 75]], {
    name: '&theta; (Depression)',
    suffixLabel: '&deg;',
    snapWidth: 1,
    strokeColor: 'black',
    fillColor: 'black'
});

// Key Points and Geometry
// Origin (Base of the cliff/building)
var O = board.create('point', [0, 0], { name: 'Base', fixed: true, size: 2, color: 'black', label: {offset: [-20, -15]} });

// Invisible y-axis and x-axis to constrain points
var yAxis = board.create('axis', [[0,0], [0,1]], { visible: false });
var xAxis = board.create('axis', [[0,0], [1,0]], { visible: false });

// Observer P (Draggable up and down the y-axis)
var P = board.create('glider', [0, 8, yAxis], { 
    name: 'Observer', color: 'blue', size: 5, label: {offset: [-30, 29]} 
});

// Horizontal Reference Point (Always directly to the right of P)
var H = board.create('point', [
    function() { return P.X() + 5; }, 
    function() { return P.Y(); }
], { visible: false });

// Target Q on the ground (Calculated dynamically: x = h / tan(theta))
var Q = board.create('point', [
    function() { 
        var h = P.Y();
        var theta = angleSlider.Value();
        return h / Math.tan(theta * degToRad); 
    },
    0
], { name: 'Target', visible: true, size: 4, color: 'red', label: {offset: [0, -15]} });

// Drawing the Elements
// Horizontal Line of Sight (Dashed)
board.create('line', [P, H], { strokeWidth: 2, strokeColor: 'gray', dash: 2, straightFirst: false, straightLast: true });

// Height (Cliff/Building)
board.create('segment', [O, P], { strokeWidth: 4, strokeColor: 'black' });

// Ground (Distance)
board.create('segment', [O, Q], { strokeWidth: 2, strokeColor: 'black' });

// Line of Sight (Hypotenuse)
board.create('segment', [P, Q], { strokeWidth: 3, strokeColor: 'blue' });

// Right Angle Symbol at O
board.create('angle', [Q, O, P], {
    type: 'square', radius: 0.8, fillColor: 'none', strokeColor: 'black', strokeWidth: 1.5
});

// Angle of Depression (Top)
board.create('angle', [Q, P, H], {
    name: function() { return angleSlider.Value() + '&deg;'; },
    radius: 2.0,
    fillColor: '#FF6347',
    fillOpacity: 0.3,
    strokeColor: '#FF4500'
});

// Alternate Interior Angle (Bottom)
board.create('angle', [P, Q, O], {
    name: function() { return angleSlider.Value() + '&deg;'; },
    radius: 2.0,
    fillColor: '#87CEFA',
    fillOpacity: 0.3,
    strokeColor: '#4682B4'
});

// Observer Icon
board.create('text', [function(){ return P.X() - 0.8; }, function(){ return P.Y() + 0.5; }, "👁"], { fontSize: 24, fixed:true });

// Moving Labels
var labelStyle = { fontSize: 13, color: 'black', fontWeight: 'bold' };

board.create('text', [
    function() { return P.X() - 2.5; }, 
    function() { return P.Y() / 2; }, 
    "Height (Opp)"
], labelStyle);

board.create('text', [
    function() { return Q.X() / 2 - 1; }, 
    -0.8, 
    "Distance (Adj)"
], labelStyle);

board.create('text', [
    function() { return (P.X() + Q.X()) / 2 + 0.5; }, 
    function() { return (P.Y() + Q.Y()) / 2 + 0.5; }, 
    "Line of Sight"
], { 
    ...labelStyle, 
    color: 'blue',
    rotate: function() { 
        var dx = Q.X() - P.X();
        var dy = Q.Y() - P.Y();
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }
});

// Numerical Calculations Output
var outputStyle = { fontSize: 15, color: 'black', fixed: true };

board.create('text', [10, 11, function() {
    var h = P.Y();
    var theta = angleSlider.Value();
    var d = h / Math.tan(theta * degToRad);
    return "Height (h): " + h.toFixed(1) + " m<br>" +
           "Angle (&theta;): " + theta + "&deg;<br>" +
           "Distance (d): <b>" + d.toFixed(2) + " m</b>";
}], outputStyle);

// Notice about Alternate Interior Angles
board.create('text', [10, 9, function() {
    return "<i style='color:#4682B4;'>Notice: The Angle of Depression equals<br>the Angle of Elevation from the Target!</i>";
}], { fontSize: 13, fixed: true });