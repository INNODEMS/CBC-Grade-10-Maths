/* =========================================================
 * Rotation and Congruence – Grade 10
 * ---------------------------------------------------------
 * - Triangle ABC rotated interactively about draggable centre D.
 * - Slider allows both positive (anticlockwise) and negative (clockwise) angles.
 * - Shows transformation lines A–D–A', etc.
 * - Demonstrates congruence under rotation.
 * ========================================================= */

// ---------------------------------------------------------
// 1. Board Setup
// ---------------------------------------------------------
var board = JXG.JSXGraph.initBoard('jsxgraph-rotation-congruence', {
    boundingbox: [-8, 6, 6, -6], // Expanded slightly to fit the slider
    axis: true,
    grid: true,
    showNavigation: false,
    showCopyright: false
});

var DEG_TO_RAD = Math.PI / 180;

// ---------------------------------------------------------
// 2. Original Triangle ABC
// ---------------------------------------------------------
var A = board.create('point', [-5, 3], { name: 'A', size: 4, strokeColor: 'blue', fillColor: 'blue' });
var B = board.create('point', [-5, 0], { name: 'B', size: 4, strokeColor: 'blue', fillColor: 'blue' });
var C = board.create('point', [-2, 0], { name: 'C', size: 4, strokeColor: 'blue', fillColor: 'blue' });

board.create('polygon', [A, B, C], {
    fillColor: 'blue',
    fillOpacity: 0.3,
    borders: { strokeColor: 'blue', strokeWidth: 2 }
});

// ---------------------------------------------------------
// 3. Centre of Rotation (Draggable)
// ---------------------------------------------------------
var D = board.create('point', [-3, -3], {
    name: 'D',
    size: 5,
    strokeColor: 'red',
    fillColor: 'red'
});

// ---------------------------------------------------------
// 4. Interactive Rotation Angle Slider
// ---------------------------------------------------------
// Slider range: [-360, default -90, 360]
var angleSlider = board.create('slider', [[-6, 4.5], [1, 4.5], [-360, -90, 360]], {
    name: 'Angle',
    postLabel: '°',
    snapWidth: 5,
    strokeColor: 'black',
    fillColor: 'black'
});

var rotationTransform = board.create('transform', [
    function () { return angleSlider.Value() * DEG_TO_RAD; },
    D
], { type: 'rotate' });

// ---------------------------------------------------------
// 5. Rotated Image A'B'C'
// ---------------------------------------------------------
var A1 = board.create('point', [A, rotationTransform], { name: "A'", strokeColor: 'blue', fillColor: 'blue' });
var B1 = board.create('point', [B, rotationTransform], { name: "B'", strokeColor: 'blue', fillColor: 'blue' });
var C1 = board.create('point', [C, rotationTransform], { name: "C'", strokeColor: 'blue', fillColor: 'blue' });

board.create('polygon', [A1, B1, C1], {
    fillColor: 'green', // Changed to green to distinguish image from object
    fillOpacity: 0.3,
    borders: { strokeColor: 'green', strokeWidth: 2 }
});

// ---------------------------------------------------------
// 6. Transformation Lines (Dashed)
// ---------------------------------------------------------
board.create('segment', [A, D], { dash: 2, strokeColor: 'red' });
board.create('segment', [D, A1], { dash: 2, strokeColor: 'red' });

board.create('segment', [B, D], { dash: 2, strokeColor: 'orange' });
board.create('segment', [D, B1], { dash: 2, strokeColor: 'orange' });

board.create('segment', [C, D], { dash: 2, strokeColor: 'purple' });
board.create('segment', [D, C1], { dash: 2, strokeColor: 'purple' });

// ---------------------------------------------------------
// 7. Congruence Indicator Text
// ---------------------------------------------------------
board.create('text', [-7.5, 5.5, function () {
    return "Rotation: " + angleSlider.Value() + "° about D → Triangles are congruent";
}], { fontSize: 16, strokeColor: 'black' });