

var board = JXG.JSXGraph.initBoard('jsxgraph-finding-centre-act', {
    boundingbox: [-10, 10, 10, -10], 
    axis: true,
    grid: true,
    showNavigation: false,
    showCopyright: false
});

// A hidden controller point for the true center to allow for dragging
var hiddenCenter = board.create('point', [1, 1], {visible: false});
var angleSlider = board.create('slider', [[-8, 9], [-2, 9], [-180, -90, 180]], {name: 'Angle'});

// Original Triangle
var A = board.create('point', [2, 5], {name: 'A', color: 'blue'});
var B = board.create('point', [6, 2], {name: 'B', color: 'blue'});
var C = board.create('point', [3, 1], {name: 'C', color: 'blue'});
var polyObj = board.create('polygon', [A, B, C], {
    fillColor: '#ADD8E6', fillOpacity: 0.6, borders: {strokeWidth: 2}
});

// Transform & Image Triangle
var rotTransform = board.create('transform', [
    function() { return angleSlider.Value() * Math.PI / 180.0; }, hiddenCenter
], {type: 'rotate'});

var A_prime = board.create('point', [A, rotTransform], {name: "A'", color: '#008000'});
var B_prime = board.create('point', [B, rotTransform], {name: "B'", color: '#008000'});
var C_prime = board.create('point', [C, rotTransform], {name: "C'", color: '#008000'});
var polyImg = board.create('polygon', [A_prime, B_prime, C_prime], {
    fillColor: '#90EE90', fillOpacity: 0.6, borders: {strokeWidth: 2}
});

// Checkboxes mapping the steps of the activity
var cbLineA = board.create('checkbox', [-9, -5, "1. Join A to A'"]);
var cbBisectA = board.create('checkbox', [-9, -6, "2. Draw Perpendicular Bisector of AA'"]);
var cbLineB = board.create('checkbox', [-9, -7, "3. Join B to B'"]);
var cbBisectB = board.create('checkbox', [-9, -8, "4. Draw Perpendicular Bisector of BB'"]);
var cbShowO = board.create('checkbox', [-9, -9, "5. Mark Intersection as Centre (O)"]);

// Step 1 & 2 Constructions (AA')
var segA = board.create('segment', [A, A_prime], {
    dash: 2, strokeColor: 'gray', visible: function(){return cbLineA.Value();}
});
var midA = board.create('midpoint', [A, A_prime], {visible: false});
var bisectA = board.create('perpendicular', [segA, midA], {
    strokeColor: 'red', strokeWidth: 2, visible: function(){return cbBisectA.Value();}
});

// Step 3 & 4 Constructions (BB')
var segB = board.create('segment', [B, B_prime], {
    dash: 2, strokeColor: 'gray', visible: function(){return cbLineB.Value();}
});
var midB = board.create('midpoint', [B, B_prime], {visible: false});
var bisectB = board.create('perpendicular', [segB, midB], {
    strokeColor: 'purple', strokeWidth: 2, visible: function(){return cbBisectB.Value();}
});

// Step 5: The Intersection (The found Center)
var centerO = board.create('intersection', [bisectA, bisectB, 0], {
    name: 'Centre O', color: 'black', size: 6,
    visible: function(){return cbShowO.Value();}
});