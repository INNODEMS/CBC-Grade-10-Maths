
var board = JXG.JSXGraph.initBoard('jsxgraph-complementary', {
    boundingbox: [-2, 10, 12, -5],
    axis: false,
    grid: false,
    showNavigation: false,
    showCopyright: false
});

// Angle Slider (alpha)
var s = board.create('slider', [[1, 9], [5, 9], [10, 30, 80]], {
    name: '&theta;',
    suffixLabel: '&deg;',
    snapWidth: 1
});

// Points & Triangle
// Fixed hypotenuse length for visual consistency
var hypLen = 8; 

var O = board.create('point', [0, 0], { name: 'O', fixed: true, color: 'black' });
var C = board.create('point', [
    function() { return hypLen * Math.cos(s.Value() * Math.PI / 180); },
    0
], { name: 'C', visible: true, color: 'black', size: 2 });

var B = board.create('point', [
    function() { return C.X(); },
    function() { return hypLen * Math.sin(s.Value() * Math.PI / 180); }
], { name: 'B', color: 'red', size: 3 });

var tri = board.create('polygon', [O, C, B], {
    fillColor: '#FFFF00',
    fillOpacity: 0.1,
    borders: { strokeColor: 'black', strokeWidth: 2 }
});

// Angles
// Angle at O (Theta)
var angleTheta = board.create('angle', [C, O, B], {
    name: function() { return '&theta; = ' + s.Value() + '&deg;'; },
    radius: 1.2,
    fillColor: 'blue',
    fillOpacity: 0.2
});

// Angle at B (90 - Theta)
var angleComp = board.create('angle', [O, B, C], {
    name: function() { return '&phi; = ' + (90 - s.Value()) + '&deg;'; },
    radius: 1.2,
    fillColor: 'green',
    fillOpacity: 0.2
});

// Right angle symbol
// board.create('ticks', [board.create('segment', [O, C]), 1], {
//     drawLabels: false,
//     label: { offset: [0, 0] }
// }); // Just a visual helper

// Dynamic Column Text (The "Comparison")

// Column Headers
board.create('text', [0, -1.0, function() {
    return "<b>Angle &theta; = " + s.Value() + "&deg;</b>";
}], { fontSize: 14, color: 'blue' });

board.create('text', [6, -1.0, function() {
    return "<b>Angle &phi; = " + (90 - s.Value()) + "&deg;</b>";
}], { fontSize: 14, color: 'green' });

// SINE COMP
board.create('text', [0, -2.0, function() {
    var val = Math.sin(s.Value() * Math.PI / 180).toFixed(3);
    return "sin(&theta;) = BC / OB = <b>" + val + "</b>";
}], { fontSize: 13 });

board.create('text', [6, -2.0, function() {
    var val = Math.cos((90 - s.Value()) * Math.PI / 180).toFixed(3);
    return "cos(&phi;) = BC / OB = <b>" + val + "</b>";
}], { fontSize: 13 });

// COSINE COMP
board.create('text', [0, -3.0, function() {
    var val = Math.cos(s.Value() * Math.PI / 180).toFixed(3);
    return "cos(&theta;) = OC / OB = <b>" + val + "</b>";
}], { fontSize: 13 });

board.create('text', [6, -3.0, function() {
    var val = Math.sin((90 - s.Value()) * Math.PI / 180).toFixed(3);
    return "sin(&phi;) = OC / OB = <b>" + val + "</b>";
}], { fontSize: 13 });

// Summary Note
// board.create('text', [2, -4.5, function() {
//     return "<i style='color:red;'>Notice: The ratios are identical when the angles sum to 90&deg;!</i>";
// }], { fontSize: 12 });