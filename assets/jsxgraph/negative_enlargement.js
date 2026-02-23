/* * Interactive Negative Enlargement (Dilation) Demonstration
 * Features a draggable center of enlargement, a dynamic rectangle, 
 * and a scale factor slider that includes negative values.
 */

// 1. Initialize the board
var board = JXG.JSXGraph.initBoard('jsxgraph-negative-enlargement', {
    boundingbox: [-10, 10, 10, -10], // Expanded board to fit negative reflections
    axis: true,
    grid: true,
    showCopyright: false,
    showNavigation: false
});

// 2. Create the Scale Factor Slider
// Range is [-3, 3] with a default starting value of -1 to immediately show negative enlargement
var k = board.create('slider', [[-8, 8.5], [-3, 8.5], [-3, -1, 3]], {
    name: 'Scale Factor (k)',
    snapWidth: 0.1,
    label: {fontSize: 16, strokeColor: 'black'}
});

// 3. Create the Center of Enlargement (Draggable Origin)
var O = board.create('point', [0, 0], {
    name: 'O',
    color: '#FF007F', // Pinkish-red
    size: 4
});

// 4. Create the Original Rectangle Points
// We make A and C draggable. B and D will auto-align to keep it a perfect rectangle.
var A = board.create('point', [1, 2], {name: 'A', color: 'blue'});
var C = board.create('point', [4, 4], {name: 'C', color: 'blue'});

// B shares X with C, and Y with A
var B = board.create('point', [
    function() { return C.X(); }, 
    function() { return A.Y(); }
], {name: 'B', color: 'blue', fixed: true, size: 2});

// D shares X with A, and Y with C
var D = board.create('point', [
    function() { return A.X(); }, 
    function() { return C.Y(); }
], {name: 'D', color: 'blue', fixed: true, size: 2});

// 5. Create the Original Polygon (Rectangle)
var polyABCD = board.create('polygon', [A, B, C, D], {
    fillColor: '#AAAAAA',
    fillOpacity: 0.3,
    borders: {strokeColor: 'black', strokeWidth: 2}
});

// 6. Create Construction Lines (Rays passing from O through A, B, C, D)
// Using lines instead of rays so they extend in both directions (vital for negative k)
var lineA = board.create('line', [O, A], {dash: 2, strokeColor: '#FF66B2'});
var lineB = board.create('line', [O, B], {dash: 2, strokeColor: '#FF66B2'});
var lineC = board.create('line', [O, C], {dash: 2, strokeColor: '#FF66B2'});
var lineD = board.create('line', [O, D], {dash: 2, strokeColor: '#FF66B2'});

// 7. Calculate and Create the Enlarged Points (A', B', C', D')
// Formula: P' = O + k * (P - O)
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

var D_prime = board.create('point', [
    function() { return O.X() + k.Value() * (D.X() - O.X()); },
    function() { return O.Y() + k.Value() * (D.Y() - O.Y()); }
], {name: "D'", color: '#6666FF'});

// 8. Create the Enlarged Polygon
var polyAprime = board.create('polygon', [A_prime, B_prime, C_prime, D_prime], {
    fillColor: '#0000FF',
    fillOpacity: 0.1,
    borders: {strokeColor: 'blue', strokeWidth: 2}
});

// 9. Educational Text Displaying Current Scale Factor
// board.create('text', [3, 8.5, function() {
//     return "Scale Factor (k) = " + k.Value().toFixed(2);
// }], {fontSize: 16});