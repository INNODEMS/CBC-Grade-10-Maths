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
var A = board.create('point', [0, 0], {name: 'A', color: 'blue', size: 4, label: {offset: [-15, -15]}});
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
], {name: 'P', color: 'red', fixed: true, label: {offset: [-15, -15]}});

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

board.create('midpoint', [A, B], {name: lengthText(A,B), size: 0, label: {offset: [-20, -20]}, fontSize:14, color:'blue'}); // Invisible point to help position the label

board.create('midpoint', [A, C], {name: lengthText(A,C), size: 0, label: {offset: [-40, 10]}, fontSize:14, color:'blue'}); // Invisible point to help position the label

board.create('midpoint', [B, C], {name: lengthText(B,C), size: 0, label: {offset: [10, 10]}, fontSize:14, fontColor:'blue'}); // Invisible point to help position the label

// Interior angles for ABC
board.create('angle', [B, A, C], {name: angleText(B, A, C), radius: 1.3, fillColor: '#00FF00', fontSize: 10});
board.create('angle', [C, B, A], {name: angleText(C, B, A), radius: 1.3, fillColor: '#00FF00', fontSize: 10});
board.create('angle', [A, C, B], {name: angleText(A, C, B), radius: 1.3, fillColor: '#00FF00', fontSize: 10});

/* --- Similar Triangle Labels --- */

board.create('midpoint', [P, Q], {name: lengthText(P,Q), size: 0, label: {offset: [-20, -20]}, fontSize:16, color:'red', anchorX:'middle'}); // Invisible point to help position the label

board.create('midpoint', [P, R], {name: lengthText(P,R), size: 0, label: {offset: [-40, 10]}, fontSize:16, color:'red'}); // Invisible point to help position the label

board.create('midpoint', [Q, R], {name: lengthText(Q,R), size: 0, label: {offset: [10, 10]}, fontSize:16, fontColor:'red'}); // Invisible point to help position the label
// Corresponding interior angles for PQR
board.create('angle', [Q, P, R], {name: angleText(Q, P, R), radius: function() { return k.Value(); }, fillColor: '#FFD700'});
board.create('angle', [R, Q, P], {name: angleText(R, Q, P), radius: function() { return k.Value(); }, fillColor: '#FFD700'});
board.create('angle', [P, R, Q], {name: angleText(P, R, Q), radius: function() { return k.Value(); }, fillColor: '#FFD700'});

/* ----------------------------
   5. Smooth Slider Update
---------------------------- */

k.on('drag', function() {
    board.update();
});