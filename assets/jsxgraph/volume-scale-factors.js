/* * Interactive Volume Scale Factors
 * Demonstrates the relationship between Linear Scale Factor (k) and Volume Scale Factor (k^3).
 * Uses two similar cones to illustrate scaling in 3 dimensions.
 */

var board = JXG.JSXGraph.initBoard('jsxgraph-volume-scale', {
    boundingbox: [-2, 35, 50, -10], // Expanded bottom from -8 to -10 to fit the lower labels
    axis: false,
    grid: false,
    showNavigation: false,
    showCopyright: false,
    pan: { enabled: false }, 
    zoom: { enabled: false }
});

/* ----------------------------
   1. Linear Scale Factor Slider (1 → 4)
---------------------------- */
var k = board.create('slider', [[1, 32], [15, 32], [1, 2, 4]], {
    name: 'Linear Scale Factor (k)',
    snapWidth: 0.1,
    size: 6,
    baseline: { strokeWidth: 4 },
    highline: { strokeWidth: 4 },
    label: {fontSize: 16}
});

/* ----------------------------
   2. Original Cone (Cone A)
---------------------------- */
var r1 = 3; // Initial radius
var h1 = 6; // Initial height
var xA = 18; // X-coordinate center of Cone A

// Simulate 3D with a polygon (triangle) and an ellipse for the base
var pA1 = board.create('point', [xA - r1, 0], {visible: false});
var pA2 = board.create('point', [xA + r1, 0], {visible: false});
var pA3 = board.create('point', [xA, h1], {visible: false});

// Cone Body
board.create('polygon', [pA1, pA2, pA3], {
    fillColor: '#FFCCCC', 
    fillOpacity: 0.7,
    borders: {strokeWidth: 2, strokeColor: '#CC0000'}
});

// Cone Base (Ellipse)
board.create('curve', [
    function(t){ return xA + r1 * Math.cos(t); },
    function(t){ return 0 + 0.8 * Math.sin(t); }, 
    0, 2 * Math.PI
], {strokeWidth: 2, strokeColor: '#CC0000', fillColor: '#FF9999', fillOpacity: 0.9});

// Labels for Cone A
board.create('segment', [[xA, 0], [xA, h1]], {dash: 2, strokeColor: 'black', strokeWidth: 2});
board.create('segment', [[xA, 0], [xA + r1, 0]], {strokeColor: 'black', strokeWidth: 2});
board.create('text', [xA + 0.5, h1 / 2, "h = " + h1], {fontSize: 16});
board.create('text', [xA + r1 / 2 - 1, -1.5, "r = " + r1], {fontSize: 16});

// PUSHED DOWN to y = -4.5
board.create('text', [xA - 2.5, -4.5, "Original Cone"], {fontSize: 16, color: '#CC0000'});

/* ----------------------------
   3. Scaled Cone (Cone B)
---------------------------- */
var xB = 36; // X-coordinate center of Cone B

var pB1 = board.create('point', [function(){ return xB - k.Value() * r1; }, 0], {visible: false});
var pB2 = board.create('point', [function(){ return xB + k.Value() * r1; }, 0], {visible: false});
var pB3 = board.create('point', [function(){ return xB; }, function(){ return k.Value() * h1; }], {visible: false});

// Scaled Cone Body
board.create('polygon', [pB1, pB2, pB3], {
    fillColor: '#CCE5FF', 
    fillOpacity: 0.7,
    borders: {strokeWidth: 2, strokeColor: '#0000CC'}
});

// Scaled Cone Base (Ellipse)
board.create('curve', [
    function(t){ return xB + k.Value() * r1 * Math.cos(t); },
    function(t){ return 0 + k.Value() * 0.8 * Math.sin(t); },
    0, 2 * Math.PI
], {strokeWidth: 2, strokeColor: '#0000CC', fillColor: '#99CCFF', fillOpacity: 0.9});

// Labels for Cone B
board.create('segment', [[xB, 0], function(){ return [xB, k.Value() * h1]; }], {dash: 2, strokeColor: 'black', strokeWidth: 2});
board.create('segment', [[xB, 0], function(){ return [xB + k.Value() * r1, 0]; }], {strokeColor: 'black', strokeWidth: 2});

board.create('text', [
    xB + 0.5, 
    function(){ return (k.Value() * h1) / 2; }, 
    function(){ return "h' = " + (k.Value() * h1).toFixed(1); }
], {fontSize: 16, color: 'blue'});

board.create('text', [
    function(){ return xB + (k.Value() * r1) / 2 - 1; }, 
    function(){ return -1.5 * k.Value(); }, 
    function(){ return "r' = " + (k.Value() * r1).toFixed(1); }
], {fontSize: 16, color: 'blue'});

// PUSHED DOWN dynamically so it stays below the moving radius label
board.create('text', [
    xB - 2.5, 
    function(){ return -1.5 * k.Value() - 2.5; }, 
    "Image Cone"
], {fontSize: 16, color: '#0000CC'});


/* ----------------------------
   4. Dynamic Math & Text Display (Left Side)
---------------------------- */
function calcVol(radius, height) {
    return (1/3) * Math.PI * Math.pow(radius, 2) * height;
}

board.create('text', [1, 26, function(){
    var volA = calcVol(r1, h1);
    return "Volume of Original = ⅓πr²h = " + volA.toFixed(1) + " units³";
}], {fontSize: 16, color: '#CC0000'});

board.create('text', [1, 23, function(){
    var r2 = k.Value() * r1;
    var h2 = k.Value() * h1;
    var volB = calcVol(r2, h2);
    return "Volume of Image = ⅓π(r')²(h') = " + volB.toFixed(1) + " units³";
}], {fontSize: 16, color: '#0000CC'});

board.create('text', [1, 19, function(){
    var volA = calcVol(r1, h1);
    var r2 = k.Value() * r1;
    var h2 = k.Value() * h1;
    var volB = calcVol(r2, h2);
    var vsf = volB / volA;
    return "Volume Scale Factor = " + vsf.toFixed(1);
}], {fontSize: 20, color: 'black'});

board.create('text', [1, 16, function(){
    var kVal = k.Value();
    return "k³ = " + kVal.toFixed(1) + "³ = " + Math.pow(kVal, 3).toFixed(1);
}], {fontSize: 20, color: '#008000'}); 

/* ----------------------------
   5. Smooth Slider Update
---------------------------- */
k.on('drag', function() {
    board.update();
});