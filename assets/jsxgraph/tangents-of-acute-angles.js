/* =========================================================
 * Tangents of Acute Angles – Trigonometry 1
 * ---------------------------------------------------------
 * - Dynamic ray representing the hypotenuse.
 * - Draggable points A, B, C along the adjacent line (x-axis).
 * - Real-time calculation of Opposite / Adjacent ratios.
 * - Proves that tan(x) remains constant for similar triangles.
 * ========================================================= */

var board = JXG.JSXGraph.initBoard('jsxgraph-tangents', {
    boundingbox: [-1, 10, 11, -3],
    axis: false,
    grid: true,
    showNavigation: false,
    showCopyright: false
});

// ---------------------------------------------------------
// 1. Base Line & Origin
// ---------------------------------------------------------
var xAxis = board.create('axis', [[0, 0], [1, 0]]);
var O = board.create('point', [0, 0], { name: 'O', fixed: true, size: 4, color: 'black' });

// ---------------------------------------------------------
// 2. Angle Slider
// ---------------------------------------------------------
var angleSlider = board.create('slider', [[1, 9], [4, 9], [10, 35, 60]], {
    name: '&theta;',
    suffixLabel: '&deg;',
    snapWidth: 1,
    strokeColor: 'black',
    fillColor: 'black'
});

// ---------------------------------------------------------
// 3. Inclined Line & Angle Arc
// ---------------------------------------------------------
var rayPt = board.create('point', [
    10, 
    function() { return 10 * Math.tan(angleSlider.Value() * Math.PI / 180); }
], { visible: false });

var ray = board.create('segment', [O, rayPt], { strokeWidth: 2, strokeColor: 'black' });

board.create('angle', [xAxis.point2, O, rayPt], {
    name: function() { return angleSlider.Value() + '&deg;'; },
    radius: 1.5,
    fillColor: '#FFD700',
    fillOpacity: 0.3,
    strokeColor: '#FFA500'
});

// ---------------------------------------------------------
// 4. Draggable Points on the Adjacent Side (A, B, C)
// ---------------------------------------------------------
var A = board.create('glider', [3, 0, xAxis], { name: 'A', color: 'blue', size: 4 });
var B = board.create('glider', [6, 0, xAxis], { name: 'B', color: 'purple', size: 4 });
var C = board.create('glider', [9, 0, xAxis], { name: 'C', color: 'green', size: 4 });

// ---------------------------------------------------------
// 5. Projected Points on the Hypotenuse (P, Q, R)
// ---------------------------------------------------------
var P = board.create('point', [
    function(){ return A.X(); }, 
    function(){ return A.X() * Math.tan(angleSlider.Value() * Math.PI / 180); }
], { name: 'P', color: 'blue', size: 3 });

var Q = board.create('point', [
    function(){ return B.X(); }, 
    function(){ return B.X() * Math.tan(angleSlider.Value() * Math.PI / 180); }
], { name: 'Q', color: 'purple', size: 3 });

var R = board.create('point', [
    function(){ return C.X(); }, 
    function(){ return C.X() * Math.tan(angleSlider.Value() * Math.PI / 180); }
], { name: 'R', color: 'green', size: 3 });

// ---------------------------------------------------------
// 6. Vertical Segments (Opposite Sides)
// ---------------------------------------------------------
board.create('segment', [A, P], { strokeColor: 'blue', dash: 2, strokeWidth: 2 });
board.create('segment', [B, Q], { strokeColor: 'purple', dash: 2, strokeWidth: 2 });
board.create('segment', [C, R], { strokeColor: 'green', dash: 2, strokeWidth: 2 });

// ---------------------------------------------------------
// 7. Dynamic Ratio Calculations (Live Text)
// ---------------------------------------------------------
board.create('text', [6, 8.5, function() {
    var tanVal = Math.tan(angleSlider.Value() * Math.PI / 180).toFixed(3);
    return "<b>tan(" + angleSlider.Value() + "&deg;) = " + tanVal + "</b>";
}], {fontSize: 18, color: 'black'});

// Triangle OPA Output
board.create('text', [0.5, -1.2, function() {
    var opp = P.Y().toFixed(2);
    var adj = A.X().toFixed(2);
    var ratio = (P.Y() / A.X()).toFixed(3);
    return "Triangle OPA: PA / OA = " + opp + " / " + adj + " = <b>" + ratio + "</b>";
}], {fontSize: 14, color: 'blue'});

// Triangle OQB Output
board.create('text', [0.5, -1.8, function() {
    var opp = Q.Y().toFixed(2);
    var adj = B.X().toFixed(2);
    var ratio = (Q.Y() / B.X()).toFixed(3);
    return "Triangle OQB: QB / OB = " + opp + " / " + adj + " = <b>" + ratio + "</b>";
}], {fontSize: 14, color: 'purple'});

// Triangle ORC Output
board.create('text', [0.5, -2.4, function() {
    var opp = R.Y().toFixed(2);
    var adj = C.X().toFixed(2);
    var ratio = (R.Y() / C.X()).toFixed(3);
    return "Triangle ORC: RC / OC = " + opp + " / " + adj + " = <b>" + ratio + "</b>";
}], {fontSize: 14, color: 'green'});