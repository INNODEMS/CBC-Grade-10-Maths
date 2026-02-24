


var board = JXG.JSXGraph.initBoard('jsxgraph-similarity-intro', {
    boundingbox: [-2, 25, 35, -5],
    axis: false,
    grid: true,
    showCopyright: false,
    showNavigation: false,
    pan: { enabled: false },
    zoom: { enabled: false }
});

/* ----------------------------
   1. Scale Factor Slider
---------------------------- */

var k = board.create('slider', [[2, 22], [15, 22], [0.5, 2, 4]], {
    name: 'k',
    size: 6,
    baseline: { strokeWidth: 4 },
    highline: { strokeWidth: 4 },
    label: { fontSize: 16 }
});

/* ----------------------------
   2. Original Triangle ABC
---------------------------- */
// FIX: Removed "fixed: true" so the student can drag the vertices
var A = board.create('point', [0, 0], {name: 'A', color: 'blue', size: 4});
var B = board.create('point', [7, 0], {name: 'B', color: 'blue', size: 4});
var C = board.create('point', [30/7, (6 * Math.sqrt(24)) / 7], {name: 'C', color: 'blue', size: 4});

var polyABC = board.create('polygon', [A, B, C], {
    fillColor: '#aaddff',
    hasInnerArea: true, // Allows dragging the entire triangle by clicking its center
    borders: {strokeColor: 'blue', strokeWidth: 2}
});

/* ----------------------------
   3. Similar Triangle PQR
---------------------------- */

var P = board.create('point', [
    function() { return A.X() + 12; },
    function() { return A.Y(); }
], {name: 'P', color: 'red', fixed: true});

var Q = board.create('point', [
    function() { return P.X() + k.Value() * (B.X() - A.X()); },
    function() { return P.Y() + k.Value() * (B.Y() - A.Y()); }
], {name: 'Q', color: 'red', fixed: true});

var R = board.create('point', [
    function() { return P.X() + k.Value() * (C.X() - A.X()); },
    function() { return P.Y() + k.Value() * (C.Y() - A.Y()); }
], {name: 'R', color: 'red', fixed: true});

var polyPQR = board.create('polygon', [P, Q, R], {
    fillColor: '#ffddaa',
    borders: {strokeColor: 'red', strokeWidth: 2}
});

/* ----------------------------
   4. Side Length & Angle Labels
---------------------------- */

function lengthText(pt1, pt2) {
    return function() {
        return pt1.Dist(pt2).toFixed(1) + " cm";
    };
}

// Helper function to calculate angles in degrees dynamically
function angleText(pt1, pt2, pt3) {
    return function() {
        var rad = JXG.Math.Geometry.rad(pt1, pt2, pt3);
        return (rad * 180 / Math.PI).toFixed(0) + "°";
    };
}

/* --- Original Triangle Labels --- */

board.create('text', [
    function(){ return (A.X() + B.X())/2; }, 
    function(){ return (A.Y() + B.Y())/2 - 1; },
    lengthText(A,B)
], {fontSize: 14, color: 'blue'});

board.create('text', [
    function(){ return (A.X() + C.X())/2 - 1; }, 
    function(){ return (A.Y() + C.Y())/2 + 0.5; },
    lengthText(A,C)
], {fontSize: 14, color: 'blue'});

board.create('text', [
    function(){ return (B.X() + C.X())/2 + 0.5; }, 
    function(){ return (B.Y() + C.Y())/2 + 0.5; },
    lengthText(B,C)
], {fontSize: 14, color: 'blue'});

// Interior angles for ABC
board.create('angle', [B, A, C], {name: angleText(B, A, C), radius: 1, fillColor: '#00FF00'});
board.create('angle', [C, B, A], {name: angleText(C, B, A), radius: 1, fillColor: '#00FF00'});
board.create('angle', [A, C, B], {name: angleText(A, C, B), radius: 1, fillColor: '#00FF00'});

/* --- Similar Triangle Labels --- */

board.create('text', [
    function(){ return (P.X() + Q.X())/2; }, 
    function(){ return (P.Y() + Q.Y())/2 - 1; },
    lengthText(P,Q)
], {fontSize: 14, color: 'red'});

board.create('text', [
    function(){ return (P.X() + R.X())/2 - 1; }, 
    function(){ return (P.Y() + R.Y())/2 + 0.5; },
    lengthText(P,R)
], {fontSize: 14, color: 'red'});

board.create('text', [
    function(){ return (Q.X() + R.X())/2 + 0.5; }, 
    function(){ return (Q.Y() + R.Y())/2 + 0.5; },
    lengthText(Q,R)
], {fontSize: 14, color: 'red'});

// Corresponding interior angles for PQR
board.create('angle', [Q, P, R], {name: angleText(Q, P, R), radius: 1, fillColor: '#FFD700'});
board.create('angle', [R, Q, P], {name: angleText(R, Q, P), radius: 1, fillColor: '#FFD700'});
board.create('angle', [P, R, Q], {name: angleText(P, R, Q), radius: 1, fillColor: '#FFD700'});

/* ----------------------------
   5. Smooth Slider Update
---------------------------- */

k.on('drag', function() {
    board.update();
});