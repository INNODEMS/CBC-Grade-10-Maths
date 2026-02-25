/* * Interactive Rotating Objects on a Cartesian Plane
 * Allows students to rotate a triangle around the origin using a slider.
 * Dynamically displays the coordinate mapping to help students discover rules.
 */

// var board = JXG.JSXGraph.initBoard('jsxgraph-rotating-objects-plane', {
//     boundingbox: [-8, 8, 8, -8], 
//     axis: true,
//     grid: true,
//     showNavigation: false,
//     showCopyright: false
// });

// /* ----------------------------
//    1. Controls: Angle Slider
// ---------------------------- */
// // Slider from -180 to 180 degrees, snapping to 90-degree increments
// var angleSlider = board.create('slider', [[-5, -6.5], [2, -6.5], [-180, 90, 180]], {
//     name: 'Angle',
//     suffixLabel: '°',
//     snapWidth: 90,
//     strokeColor: '#000000',
//     fillColor: '#000000'
// });

// /* ----------------------------
//    2. Center of Rotation (Origin)
// ---------------------------- */
// var O = board.create('point', [0, 0], {
//     name: 'Origin', 
//     fixed: true, 
//     size: 4, 
//     color: 'black'
// });

// /* ----------------------------
//    3. Original Triangle ABC (Draggable)
// ---------------------------- */
// // Initialized to the exact coordinates from the textbook activity
// var A = board.create('point', [2, 1], {name: 'A', color: 'blue'});
// var B = board.create('point', [4, 1], {name: 'B', color: 'blue'});
// var C = board.create('point', [3, 3], {name: 'C', color: 'blue'});

// var polyObj = board.create('polygon', [A, B, C], {
//     fillColor: '#ADD8E6', 
//     fillOpacity: 0.6,
//     borders: {strokeColor: 'blue', strokeWidth: 2},
//     hasInnerArea: true // Allows moving the whole triangle at once
// });

// /* ----------------------------
//    4. Rotation Transformation
// ---------------------------- */
// // Convert slider degrees to radians
// var rotTransform = board.create('transform', [
//     function() { return angleSlider.Value() * Math.PI / 180.0; },
//     O
// ], {type: 'rotate'});

// /* ----------------------------
//    5. Rotated Triangle A'B'C'
// ---------------------------- */
// var A_prime = board.create('point', [A, rotTransform], {name: "A'", color: '#008000'});
// var B_prime = board.create('point', [B, rotTransform], {name: "B'", color: '#008000'});
// var C_prime = board.create('point', [C, rotTransform], {name: "C'", color: '#008000'});

// var polyImg = board.create('polygon', [A_prime, B_prime, C_prime], {
//     fillColor: '#90EE90', 
//     fillOpacity: 0.6,
//     borders: {strokeColor: '#008000', strokeWidth: 2}
// });

// /* ----------------------------
//    6. Visual Aids & Coordinate Text
// ---------------------------- */
// // Dashed lines showing distance from Origin to A and A'
// board.create('segment', [O, A], {dash: 2, strokeColor: 'gray', strokeWidth: 1.5});
// board.create('segment', [O, A_prime], {dash: 2, strokeColor: 'gray', strokeWidth: 1.5});

// // Arc showing the angle of rotation
// board.create('angle', [A, O, A_prime], {
//     name: function() { return angleSlider.Value() + '°'; },
//     radius: 2,
//     fillColor: '#FFD700',
//     fillOpacity: 0.3,
//     strokeColor: '#FFA500'
// });

// // Dynamic Text readout for Coordinates to help discover the rules
// board.create('text', [-7.5, 7, function() {
//     var ax = A.X().toFixed(0);
//     var ay = A.Y().toFixed(0);
//     var apx = A_prime.X().toFixed(0);
//     var apy = A_prime.Y().toFixed(0);
//     return "Coordinate Rule: A(" + ax + ", " + ay + ") \u2192 A'(" + apx + ", " + apy + ")";
// }], {fontSize: 18, color: 'black', cssClass: 'bold'});


var board = JXG.JSXGraph.initBoard('jsxgraph-rotating-objects-plane', {
    boundingbox: [-8, 8, 8, -8],
    axis: true,
    grid: true,
    showNavigation: false,
    showCopyright: false
});

var DEG_TO_RAD = Math.PI / 180;

var O = board.create('point', [0, 0], { name: 'O', size: 5 });

var angleSlider = board.create('slider',
    [[-6, -7], [2, -7], [0, 0, 270]],
    { name: 'Angle', suffixLabel: '°', snapWidth: 90 }
);

var A = board.create('point', [2, 1], { name: 'A' });
var B = board.create('point', [4, 1], { name: 'B' });
var C = board.create('point', [3, 3], { name: 'C' });

board.create('polygon', [A, B, C], { fillOpacity: 0.2 });

var rotationTransform = board.create('transform', [
    function () { return angleSlider.Value() * DEG_TO_RAD; },
    O
], { type: 'rotate' });

var A1 = board.create('point', [A, rotationTransform], { name: "A'" });
var B1 = board.create('point', [B, rotationTransform], { name: "B'" });
var C1 = board.create('point', [C, rotationTransform], { name: "C'" });

board.create('polygon', [A1, B1, C1], { fillOpacity: 0.2 });

board.create('text', [-7.5, 7, function () {
    function r(x){ return Math.round(x); }
    return "A(" + r(A.X()) + "," + r(A.Y()) + ") → A'(" + r(A1.X()) + "," + r(A1.Y()) + ")<br/>" +
           "B(" + r(B.X()) + "," + r(B.Y()) + ") → B'(" + r(B1.X()) + "," + r(B1.Y()) + ")<br/>" +
           "C(" + r(C.X()) + "," + r(C.Y()) + ") → C'(" + r(C1.X()) + "," + r(C1.Y()) + ")";
}]);