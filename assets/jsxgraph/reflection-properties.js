/* * Interactive Properties of Reflection
 * Demonstrates lateral inversion, perpendicular bisectors, and equidistant properties.
 */

var board = JXG.JSXGraph.initBoard('jsxgraph-reflection-properties', {
    boundingbox: [-10, 10, 10, -10],
    axis: true,
    grid: true,
    showNavigation: false,
    showCopyright: false
});

/* ----------------------------
   1. The Mirror Line (Draggable)
---------------------------- */
// Students can drag M1 or M2 to create slanted reflections
var m1 = board.create('point', [0, 6], {name: 'M1', color: 'red', size: 4});
var m2 = board.create('point', [0, -6], {name: 'M2', color: 'red', size: 4});
var mirrorLine = board.create('line', [m1, m2], {
    strokeColor: '#CC0000', 
    strokeWidth: 3,
    name: 'Mirror Line'
});

/* ----------------------------
   2. Original Shape (Draggable Scalene Triangle)
---------------------------- */
var A = board.create('point', [2, 2], {name: 'A', color: 'blue'});
var B = board.create('point', [7, 2], {name: 'B', color: 'blue'});
var C = board.create('point', [4, 7], {name: 'C', color: 'blue'});

var polyOriginal = board.create('polygon', [A, B, C], {
    fillColor: '#ADD8E6',
    fillOpacity: 0.6,
    borders: {strokeColor: 'blue', strokeWidth: 2},
    hasInnerArea: true
});

/* ----------------------------
   3. Transformation & Reflected Shape
---------------------------- */
// JSXGraph's built-in reflection transformation binds the image to the mirror line
var refTrans = board.create('transform', [mirrorLine.id], {type: 'reflect'});

var A_prime = board.create('point', [A, refTrans], {name: "A'", color: '#008000'});
var B_prime = board.create('point', [B, refTrans], {name: "B'", color: '#008000'});
var C_prime = board.create('point', [C, refTrans], {name: "C'", color: '#008000'});

var polyImage = board.create('polygon', [A_prime, B_prime, C_prime], {
    fillColor: '#90EE90',
    fillOpacity: 0.6,
    borders: {strokeColor: '#008000', strokeWidth: 2}
});

/* ----------------------------
   4. Construction Lines & Properties
---------------------------- */
// Dashed lines connecting corresponding points to prove they are perpendicular to the mirror
var sA = board.create('segment', [A, A_prime], {dash: 2, strokeColor: 'gray'});
var sB = board.create('segment', [B, B_prime], {dash: 2, strokeColor: 'gray'});
var sC = board.create('segment', [C, C_prime], {dash: 2, strokeColor: 'gray'});

// Find the intersection points on the mirror line to measure distances
var iA = board.create('intersection', [sA, mirrorLine, 0], {visible: false});

// Display Right Angle to prove perpendicularity
board.create('angle', [A, iA, m1], {
    radius: 0.8, 
    type: 'square',
    color: '#CC0000'
});

/* ----------------------------
   5. Dynamic Math Labels
---------------------------- */
board.create('text', [-9.5, 9], [function(){
    return "Distance from A to Mirror: " + A.Dist(iA).toFixed(2) + " units";
}], {fontSize: 16, color: 'blue'});

board.create('text', [-9.5, 8], [function(){
    return "Distance from A' to Mirror: " + A_prime.Dist(iA).toFixed(2) + " units";
}], {fontSize: 16, color: '#008000'});

board.create('text', [-9.5, 6.5], [function(){
    if (A.Dist(iA).toFixed(2) === A_prime.Dist(iA).toFixed(2)) {
        return "Properties: Equidistant & Perpendicular!";
    }
}], {fontSize: 16, color: '#CC0000', cssClass: 'bold'});



