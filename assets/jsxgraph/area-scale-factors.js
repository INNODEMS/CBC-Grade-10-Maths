
var board = JXG.JSXGraph.initBoard('jsxgraph-area-scale-factors', {
    boundingbox: [-5, 30, 55, -10],
    axis: false,
    grid: false,
    showNavigation: false,
    showCopyright: false
});

/* ----------------------------
   1. Scale Factor Slider (1 → 5)
---------------------------- */
var k = board.create('slider', [[1, 26], [18, 26], [1, 2, 5]], {
    name: 'linear scale factor (k)',
    snapWidth: 0.1,
    size: 6,
    label: {fontSize: 16}
});

/* ----------------------------
   2. Original Parallelogram (Draggable)
---------------------------- */

var P = board.create('point', [0, 0], {name: 'P'});
var Q = board.create('point', [6, 0], {name: 'Q'});
var R = board.create('point', [8, 4], {name: 'R'});

var S = board.create('point', [
    function(){ return P.X() + (R.X() - Q.X()); },
    function(){ return P.Y() + (R.Y() - Q.Y()); }
], {name: 'S', fixed: true});

var polyOriginal = board.create('polygon', [P, Q, R, S], {
    fillColor: '#FFFF99',
    fillOpacity: 0.5,
    borders: {strokeWidth: 2}
});

/* ----------------------------
   3. Perpendicular Height (Original)
---------------------------- */

var H = board.create('point', [
    function(){ return R.X(); },
    function(){ return P.Y(); }
], {visible: false});

board.create('segment', [R, H], {
    strokeWidth: 3,
    dash: 2
});

board.create('segment', [H, P], {
    strokeWidth: 2,
    dash: 1
});

board.create('angle', [Q, H, R], {
    type: 'square',
    radius: 0.7
});

/* ----------------------------
   4. Measurement Labels (Original)
---------------------------- */

board.create('text', [
    function(){ return (P.X()+Q.X())/2; },
    -2,
    function(){ return "b = " + P.Dist(Q).toFixed(2); }
], {fontSize: 18});

board.create('text', [
    function(){ return R.X()+1; },
    function(){ return (R.Y()+H.Y())/2; },
    function(){ return "h = " + R.Dist(H).toFixed(2); }
], {fontSize: 18});

/* ----------------------------
   5. Scaled Image
---------------------------- */

var Pp = board.create('point', [25, 0], {name: "P'", fixed: true});

var Qp = board.create('point', [
    function(){ return 25 + k.Value()*(Q.X()-P.X()); },
    function(){ return k.Value()*(Q.Y()-P.Y()); }
], {name: "Q'", fixed: true});

var Rp = board.create('point', [
    function(){ return 25 + k.Value()*(R.X()-P.X()); },
    function(){ return k.Value()*(R.Y()-P.Y()); }
], {name: "R'", fixed: true});

var Sp = board.create('point', [
    function(){ return 25 + k.Value()*(S.X()-P.X()); },
    function(){ return k.Value()*(S.Y()-P.Y()); }
], {name: "S'", fixed: true});

var polyImage = board.create('polygon', [Pp, Qp, Rp, Sp], {
    fillColor: '#ADD8E6',
    fillOpacity: 0.5,
    borders: {strokeWidth: 2}
});

/* ----------------------------
   6. Perpendicular Height (Image)
---------------------------- */

var Hp = board.create('point', [
    function(){ return Rp.X(); },
    function(){ return 0; }
], {visible:false});

board.create('segment', [Rp, Hp], {
    strokeWidth: 3,
    dash: 2
});

board.create('segment', [Hp, Pp], {
    strokeWidth: 2,
    dash: 1
});

board.create('angle', [Qp, Hp, Rp], {
    type: 'square',
    radius: 0.7
});

/* ----------------------------
   7. Measurement Labels (Image)
---------------------------- */

board.create('text', [30, -3,
    function(){ return "b' = " + Pp.Dist(Qp).toFixed(2); }
], {fontSize:18, color:'blue'});

board.create('text', [
    function(){ return Rp.X()+1; },
    function(){ return Rp.Y()/2; },
    function(){ return "h' = " + Rp.Dist(Hp).toFixed(2); }
], {fontSize:18, color:'blue'});

/* ----------------------------
   8. Area Scale Factor Display (Moved Left)
---------------------------- */

board.create('text', [2, 22,
    function(){
        var ratio = polyImage.Area()/polyOriginal.Area();
        return "Area Scale Factor = " + ratio.toFixed(2);
}], {fontSize:20});

board.create('text', [2, 19,
    function(){
        return "k² = " + (k.Value()*k.Value()).toFixed(2);
}], {fontSize:20, color:'#cc0000'});

board.create('text', [
    function(){ return (P.X()+Q.X())/2 - 1; },
    -7,
    function(){
        return "Area = " + polyOriginal.Area().toFixed(2);
}], {fontSize:18});

board.create('text', [
    function(){ return (Pp.X()+Qp.X())/2 - 2; },
    -7,
    function(){
        return "Area = " + polyImage.Area().toFixed(2);
}], {fontSize:18, color:'blue'});