/* =========================================================
 * Sines and Cosines of Acute Angles – Trigonometry 1
 * ---------------------------------------------------------
 * - Draggable points A, B, C along the adjacent line.
 * - Real-time calculation of Opp/Hyp (Sine) and Adj/Hyp (Cosine).
 * - Proves that sin(x) and cos(x) remain constant for similar triangles.
 * ========================================================= */

var board = JXG.JSXGraph.initBoard('jsxgraph-sine-cosine', {
    boundingbox: [-1, 11, 12, -4],
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
var angleSlider = board.create('slider', [[1, 10], [4, 10], [10, 30, 60]], {
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
// 6. Triangle Boundaries (Opposites and Hypotenuses)
// ---------------------------------------------------------
// Vertical Lines (Opposite)
board.create('segment', [A, P], { strokeColor: 'blue', dash: 2, strokeWidth: 2 });
board.create('segment', [B, Q], { strokeColor: 'purple', dash: 2, strokeWidth: 2 });
board.create('segment', [C, R], { strokeColor: 'green', dash: 2, strokeWidth: 2 });

// Hypotenuse Lines
board.create('segment', [O, P], { strokeColor: 'blue', strokeWidth: 2, strokeOpacity: 0.5 });
board.create('segment', [O, Q], { strokeColor: 'purple', strokeWidth: 2, strokeOpacity: 0.5 });
board.create('segment', [O, R], { strokeColor: 'green', strokeWidth: 2, strokeOpacity: 0.5 });

// // ---------------------------------------------------------
board.create('text', [5, 9.5, function() {
    var sinVal = Math.sin(angleSlider.Value() * Math.PI / 180).toFixed(3);
    var cosVal = Math.cos(angleSlider.Value() * Math.PI / 180).toFixed(3);
    return "<b>sin(" + angleSlider.Value() + "&deg;) = " + sinVal + "  |  cos(" + angleSlider.Value() + "&deg;) = " + cosVal + "</b>";
}], {fontSize: 16, color: 'black'});

// --- SINE RATIOS (Opposite / Hypotenuse) STACKED ON THE LEFT ---
board.create('text', [0, -1.0, "<b>Sine Ratios (Opp / Hyp):</b>"], {fontSize: 14});

board.create('text', [0, -1.6, function() {
    var opp = P.Y().toFixed(2);
    var hyp = P.Dist(O).toFixed(2);
    var ratio = (P.Y() / P.Dist(O)).toFixed(3);
    return "AP / OP = " + opp + " / " + hyp + " = <b>" + ratio + "</b>";
}], {fontSize: 14, color: 'blue'});

board.create('text', [0, -2.2, function() {
    var opp = Q.Y().toFixed(2);
    var hyp = Q.Dist(O).toFixed(2);
    var ratio = (Q.Y() / Q.Dist(O)).toFixed(3);
    return "BQ / OQ = " + opp + " / " + hyp + " = <b>" + ratio + "</b>";
}], {fontSize: 14, color: 'purple'});

board.create('text', [0, -2.8, function() {
    var opp = R.Y().toFixed(2);
    var hyp = R.Dist(O).toFixed(2);
    var ratio = (R.Y() / R.Dist(O)).toFixed(3);
    return "CR / OR = " + opp + " / " + hyp + " = <b>" + ratio + "</b>";
}], {fontSize: 14, color: 'green'});

// --- COSINE RATIOS (Adjacent / Hypotenuse) STACKED ON THE RIGHT ---
board.create('text', [6, -1.0, "<b>Cosine Ratios (Adj / Hyp):</b>"], {fontSize: 14});

board.create('text', [6, -1.6, function() {
    var adj = A.X().toFixed(2);
    var hyp = P.Dist(O).toFixed(2);
    var ratio = (A.X() / P.Dist(O)).toFixed(3);
    return "OA / OP = " + adj + " / " + hyp + " = <b>" + ratio + "</b>";
}], {fontSize: 14, color: 'blue'});

board.create('text', [6, -2.2, function() {
    var adj = B.X().toFixed(2);
    var hyp = Q.Dist(O).toFixed(2);
    var ratio = (B.X() / Q.Dist(O)).toFixed(3);
    return "OB / OQ = " + adj + " / " + hyp + " = <b>" + ratio + "</b>";
}], {fontSize: 14, color: 'purple'});

board.create('text', [6, -2.8, function() {
    var adj = C.X().toFixed(2);
    var hyp = R.Dist(O).toFixed(2);
    var ratio = (C.X() / R.Dist(O)).toFixed(3);
    return "OC / OR = " + adj + " / " + hyp + " = <b>" + ratio + "</b>";
}], {fontSize: 14, color: 'green'});