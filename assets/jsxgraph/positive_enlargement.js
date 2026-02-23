/* * Interactive Enlargement (Dilation) Demonstration
 * Features a draggable center of enlargement, draggable vertices, and a scale factor slider.
 */

// 1. Initialize the board
var board = JXG.JSXGraph.initBoard('jsxgraph-enlargement', {
    boundingbox: [-5, 10, 15, -4], // [left, top, right, bottom]
    axis: true,
    grid: true,
    showCopyright: false,
    showNavigation: false
});

// 2. Create the Scale Factor Slider
// range is [0, 4] with a default starting value of 2
var k = board.create('slider', [[-4, 9], [1, 9], [0, 2, 4]], {
    name: 'Scale Factor (k)',
    snapWidth: 0.1,
    label: {fontSize: 16, strokeColor: 'black'}
});

// 3. Create the Center of Enlargement (Draggable Origin)
var O = board.create('point', [0, 0], {
    name: 'O',
    color: '#FF007F', // Pinkish-red
    size: 4,
    fixed: false // Allows the student to shift the origin
});

// 4. Create the Original Triangle Points (Draggable)
var A = board.create('point', [2, 3], {name: 'A', color: 'blue'});
var B = board.create('point', [1, 1], {name: 'B', color: 'blue'});
var C = board.create('point', [4, 1], {name: 'C', color: 'blue'});

// 5. Create the Original Polygon
var polyABC = board.create('polygon', [A, B, C], {
    fillColor: '#AAAAAA',
    fillOpacity: 0.3,
    borders: {strokeColor: 'black', strokeWidth: 2}
});

// 6. Create Construction Lines (Rays passing from O through A, B, C)
var lineA = board.create('line', [O, A], {dash: 2, strokeColor: '#FF66B2'});
var lineB = board.create('line', [O, B], {dash: 2, strokeColor: '#FF66B2'});
var lineC = board.create('line', [O, C], {dash: 2, strokeColor: '#FF66B2'});

// 7. Calculate and Create the Enlarged Points (A', B', C')
// The math: P' = O + k * (P - O)
var A_prime = board.create('point', [
    function() { return O.X() + k.Value() * (A.X() - O.X()); },
    function() { return O.Y() + k.Value() * (A.Y() - O.Y()); }
], {name: "A'", color: '#6666FF'});

var B_prime = board.create('point', [
    function() { return O.X() + k.Value() * (B.X() - O.X()); },
    function() { return O.Y() + k.Value() * (B.Y() - O.Y()); }
], {name: "B'", color: '#6666FF'});

var C_prime = board.create('point', [
    function() { return O.X() + k.Value() * (C.X() - O.X()); },
    function() { return O.Y() + k.Value() * (C.Y() - O.Y()); }
], {name: "C'", color: '#6666FF'});

// 8. Create the Enlarged Polygon
var polyAprime = board.create('polygon', [A_prime, B_prime, C_prime], {
    fillColor: '#0000FF',
    fillOpacity: 0.1,
    borders: {strokeColor: 'blue', strokeWidth: 2}
});

// 9. Educational Text (Optional, but highly recommended)
// Dynamically displays the ratio calculations requested in the image prompt
// board.create('text', [6, 8.5, function() {
//     return "k = " + k.Value().toFixed(2);
// }], {fontSize: 16});

board.create('text', [6, 7.5, function() {
    var OA = O.Dist(A);
    var OA_prime = O.Dist(A_prime);
    var ratio = (OA === 0) ? 0 : (OA_prime / OA);
    return "OA' / OA = " + ratio.toFixed(2);
}], {fontSize: 16});