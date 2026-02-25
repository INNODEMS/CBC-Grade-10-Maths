/* * Interactive Activity 1: Properties of Rotation
 * Allows students to systematically check the distances and angles 
 * from the vertices to the center of rotation using checkboxes.
 */

var board = JXG.JSXGraph.initBoard('jsxgraph-properties-rotation-act', {
    boundingbox: [-10, 10, 10, -10], 
    axis: true,
    grid: true,
    showNavigation: false,
    showCopyright: false
});

// Controls
var angleSlider = board.create('slider', [[-8, 8], [-2, 8], [-180, 90, 180]], {
    name: 'Angle', suffixLabel: '°', snapWidth: 5
});
var O = board.create('point', [0, 0], {name: 'O', color: 'red', size: 5});

// Original Triangle
var A = board.create('point', [2, 5], {name: 'A', color: 'blue'});
var B = board.create('point', [6, 2], {name: 'B', color: 'blue'});
var C = board.create('point', [3, 1], {name: 'C', color: 'blue'});
var polyObj = board.create('polygon', [A, B, C], {
    fillColor: '#ADD8E6', fillOpacity: 0.6, borders: {strokeWidth: 2}
});

// Rotation Transform & Image Triangle
var rotTransform = board.create('transform', [
    function() { return angleSlider.Value() * Math.PI / 180.0; }, O
], {type: 'rotate'});

var A_prime = board.create('point', [A, rotTransform], {name: "A'", color: '#008000'});
var B_prime = board.create('point', [B, rotTransform], {name: "B'", color: '#008000'});
var C_prime = board.create('point', [C, rotTransform], {name: "C'", color: '#008000'});
var polyImg = board.create('polygon', [A_prime, B_prime, C_prime], {
    fillColor: '#90EE90', fillOpacity: 0.6, borders: {strokeColor: '#008000', strokeWidth: 2}
});

// Interactive Checkboxes for the Activity Steps
var cbA = board.create('checkbox', [-9, -6, "Measure A to O"]);
var cbB = board.create('checkbox', [-9, -7, "Measure B to O"]);
var cbC = board.create('checkbox', [-9, -8, "Measure C to O"]);

// Helper function to create the dynamic lines and measurement text
function createMeasurements(pt1, pt2, checkbox, yOffset, color) {
    // Distance lines
    board.create('segment', [O, pt1], {dash: 2, strokeColor: color, visible: function(){return checkbox.Value();}});
    board.create('segment', [O, pt2], {dash: 2, strokeColor: color, visible: function(){return checkbox.Value();}});
    
    // Angle Arc
    board.create('angle', [pt1, O, pt2], {
        radius: 1.5, fillColor: color, fillOpacity: 0.2,
        visible: function(){return checkbox.Value();}
    });

    // Measurement Text
    board.create('text', [2, yOffset, function() {
        var d1 = pt1.Dist(O).toFixed(1);
        var d2 = pt2.Dist(O).toFixed(1);
        return pt1.name + "O = " + d1 + " | " + pt2.name + "O = " + d2 + "  (Equal Distance!)";
    }], {fontSize: 14, color: color, visible: function(){return checkbox.Value();}});
}

createMeasurements(A, A_prime, cbA, -6, '#CC0000');
createMeasurements(B, B_prime, cbB, -7, '#0000CC');
createMeasurements(C, C_prime, cbC, -8, '#D2691E');