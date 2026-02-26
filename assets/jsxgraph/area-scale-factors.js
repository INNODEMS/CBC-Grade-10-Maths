JXG.Options.text.useMathJax = true;
var board = JXG.JSXGraph.initBoard('jsxgraph-area-scale-factors', {
    boundingbox: [-5, 30, 35, -10],
    axis: false,
    grid: false,
    showNavigation: false,
    showCopyright: false
});

/* ----------------------------
   1. Scale Factor Slider (1 → 5)
---------------------------- */
var k = board.create('slider', [[-1, 26], [16, 26], [1, 2, 5]], {
    name: 'Linear Scale Factor (k)',
    snapWidth: 0.1,
    size: 6,
    label: {fontSize: 16}
});

/* ----------------------------
   2. Original Parallelogram (Draggable)
---------------------------- */

var P = board.create('point', [0, -5], {name: 'P'});
var Q = board.create('point', [6, -5], {name: 'Q'});
var R = board.create('point', [6, 1], {name: 'R', fixed: true});

var S = board.create('point', [0, 1], {name: 'S', fixed: true});

var polyOriginal = board.create('polygon', [P, Q, R, S], {
    fillColor: '#FFFF99',
    fillOpacity: 0.5,
    borders: {strokeWidth: 2}
});

/* Perpendicular height removed for square demo */

/* ----------------------------
   4. Measurement Labels (Original)
---------------------------- */

board.create('midpoint', [P, Q], 
    {name: 'b = ' + P.Dist(Q).toFixed(2), 
    label: {fontSize:14, anchorX:'middle', anchorY:'top', offset: [0, -10]}, size:0}
); // Midpoint for base label


board.create('midpoint', [Q, R], {name: 'h = ' + R.Dist(Q).toFixed(2), label: {fontSize:14, anchorX:'left', anchorY:'middle', offset: [10, 0]}, size:0}); // Midpoint for base label

// height label removed for square demo

/* ----------------------------
   5. Scaled Image
---------------------------- */

var Pp = board.create('point', [11, -5], {name: "P'", fixed: true});

var Qp = board.create('point', [
    function(){ return 11 + k.Value()*(Q.X()-P.X()); },
    function(){ return k.Value()*(Q.Y()-P.Y()) - 5; }
], {name: "Q'", fixed: true});

var Rp = board.create('point', [
    function(){ return 11 + k.Value()*(R.X()-P.X()); },
    function(){ return k.Value()*(R.Y()-P.Y()) - 5; }
], {name: "R'", fixed: true});

var Sp = board.create('point', [
    function(){ return 11 + k.Value()*(S.X()-P.X()); },
    function(){ return k.Value()*(S.Y()-P.Y()) -5; }
], {name: "S'", fixed: true});

var polyImage = board.create('polygon', [Pp, Qp, Rp, Sp], {
    fillColor: '#ADD8E6',
    fillOpacity: 0.5,
    borders: {strokeWidth: 2}
});

/* Image perpendicular removed for square demo */

/* ----------------------------
   7. Measurement Labels (Image)
---------------------------- */

board.create('midpoint', [Pp, Qp], 
    {name: () => "b' = " + Pp.Dist(Qp).toFixed(2), 
    label: {fontSize:14, anchorX:'middle', anchorY:'top', offset: [0, -10]}, size:0}
); // Midpoint for base label


board.create('midpoint', [Qp, Rp], {name: () => "h' = " + Rp.Dist(Qp).toFixed(2), label: {fontSize:14, anchorX:'left', anchorY:'middle', offset: [10, 0]}, size:0}); // Midpoint for base label

// image height label removed for square demo

/* ----------------------------
   8. Area Scale Factor Display (Moved Left)
---------------------------- */

board.create('text', [2, 22,
    function(){
        var ratio = polyImage.Area()/polyOriginal.Area();
        return "\\(\\text{Area Scale Factor} = \\frac{\\text{Area of Image}}{\\text{Area of Original}}" + "= \\frac{" + polyImage.Area().toFixed(2) + "}{" + polyOriginal.Area().toFixed(2) + "} = " + ratio.toFixed(2) + "\\)";
}], {fontSize:16});

board.create('text', [9.9, 19,
        () => "\\(k^2 = " + (k.Value()*k.Value()).toFixed(2) + "\\)"], {fontSize:16});

board.create('midpoint', [P, R], 
    {name: () => polyOriginal.Area().toFixed(2), 
    label: {fontSize:16, anchorX:'middle', anchorY:'top'}, size:0}
);

board.create('midpoint', [Pp, Rp], 
    {name: () => polyImage.Area().toFixed(2), 
    label: {fontSize:16, anchorX:'middle', anchorY:'top'}, size:0}
);