/*
    Key takeaway — rotation produces congruent figures
    --------------------------------------------------
    Blue triangle ABC is fixed (the object). Red triangle A'B'C' rotates steadily
    anticlockwise about the centre D and loops forever. As it turns, the live
    readout of corresponding side lengths never changes: rotation is rigid, so
    object and image stay congruent throughout.

    PreTeXt notes:
      - initBoard's first argument is the slate xml:id string (NOT `divid`).
      - The animation is driven by a JSXGraph slider whose value is advanced from
        a requestAnimationFrame loop. The image is a rotate-transform of the
        object about D by the slider's angle, so it is rigid by construction.
        (The earlier setInterval + board.update() pattern did not run inside
        PreTeXt; a slider + rAF is the reliable approach.)
*/

JXG.Options.text.useMathJax = true;
JXG.Options.text.fontSize = 15;

var board = JXG.JSXGraph.initBoard('jsxgraph-rotation-congruence-keytakeaway', {
    boundingbox: [-8, 8, 8, -8],
    keepaspectratio: true,
    showCopyright: false,
    showNavigation: false,
    axis: true,
    defaultAxes: {
        x: { ticks: { ticksDistance: 1, minorTicks: 0, drawLabels: true,
                      label: { offset: [0, -12], fontSize: 11 } } },
        y: { ticks: { ticksDistance: 1, minorTicks: 0, drawLabels: true,
                      label: { offset: [-14, 0], fontSize: 11 } } }
    }
});

board.create('grid', [], { gridX: 1, gridY: 1, strokeColor: '#e0e0e0', strokeOpacity: 0.9 });

// --- Object triangle and centre of rotation ---------------------------------
var D = board.create('point', [0, 0], {
    name: 'D', fixed: true, size: 4,
    strokeColor: '#c62828', fillColor: '#c62828',
    label: { offset: [-14, -14] }
});

var A = board.create('point', [2, 1], { name: 'A', fixed: true, size: 3, strokeColor: '#1565c0', fillColor: '#1565c0', label: { offset: [-14, 6] } });
var B = board.create('point', [5, 2], { name: 'B', fixed: true, size: 3, strokeColor: '#1565c0', fillColor: '#1565c0', label: { offset: [8, 6] } });
var C = board.create('point', [3, 4], { name: 'C', fixed: true, size: 3, strokeColor: '#1565c0', fillColor: '#1565c0', label: { offset: [-6, 10] } });

board.create('polygon', [A, B, C], {
    fillColor: '#64b5f6', fillOpacity: 0.35,
    borders: { strokeColor: '#1565c0', strokeWidth: 2 }
});

// --- Angle driver: a hidden slider, advanced by the animation loop ----------
// Slider value is the rotation angle in radians, 0 .. 2*pi.
var angle = board.create('slider',
    [[-7, -7.7], [-3, -7.7], [0, 0, 2 * Math.PI]],
    { visible: false, name: 'angle' });

// The rotation, driven by the slider. Image points are a transform of the object.
var tRot = board.create('transform', [function () { return angle.Value(); }, D], { type: 'rotate' });

var Aim = board.create('point', [A, tRot], { name: "A'", size: 3, strokeColor: '#c62828', fillColor: '#c62828', label: { offset: [8, 6] } });
var Bim = board.create('point', [B, tRot], { name: "B'", size: 3, strokeColor: '#c62828', fillColor: '#c62828', label: { offset: [8, 6] } });
var Cim = board.create('point', [C, tRot], { name: "C'", size: 3, strokeColor: '#c62828', fillColor: '#c62828', label: { offset: [8, 6] } });

board.create('polygon', [Aim, Bim, Cim], {
    fillColor: '#ef9a9a', fillOpacity: 0.4,
    borders: { strokeColor: '#c62828', strokeWidth: 2 }
});

board.create('segment', [D, A],   { dash: 2, strokeColor: '#bdbdbd', strokeWidth: 1, fixed: true });
board.create('segment', [D, Aim], { dash: 2, strokeColor: '#ef9a9a', strokeWidth: 1 });

board.create('angle', [A, D, Aim], {
    type: 'sector', radius: 1.3, selection: 'minor',
    fillColor: '#ffb74d', fillOpacity: 0.3, strokeColor: '#ef6c00',
    name: function () {
        var d = angle.Value() * 180 / Math.PI;
        d = ((d % 360) + 360) % 360;
        return d.toFixed(0) + '\u00b0';
    }
});

// --- Live congruence evidence -----------------------------------------------
board.create('text', [-7.5, -5.6, function () {
    return '\\(AB = ' + A.Dist(B).toFixed(2) + '\\quad A\'B\' = ' + Aim.Dist(Bim).toFixed(2) + '\\)';
}], { anchorX: 'left', fixed: true });
board.create('text', [-7.5, -6.4, function () {
    return '\\(BC = ' + B.Dist(C).toFixed(2) + '\\quad B\'C\' = ' + Bim.Dist(Cim).toFixed(2) + '\\)';
}], { anchorX: 'left', fixed: true });
board.create('text', [-7.5, -7.2, function () {
    return '\\(CA = ' + C.Dist(A).toFixed(2) + '\\quad C\'A\' = ' + Cim.Dist(Aim).toFixed(2) + '\\)';
}], { anchorX: 'left', fixed: true });

board.create('text', [-7.5, 7.3,
    'Rotation about \\(D\\) keeps every side length \\(\\Rightarrow\\) object and image stay congruent'
], { anchorX: 'left', fixed: true });

// --- Auto-loop --------------------------------------------------------------
// Advance the slider every frame. We use the browser's own requestAnimationFrame
// (driven by the paint cycle), which runs reliably inside PreTeXt — unlike a bare
// setInterval that mutates a closure variable, which did not animate here.
// setValue + board.update() keeps every dependent object (image, sector, the
// length readouts) in sync each frame.
var SPEED = 2 * Math.PI / 9000;   // full turn every 9 seconds (radians per ms)
var last = null;

// Prefer the global rAF; fall back to JXG's, then to a timer, so the figure
// animates whatever the host page exposes.
var raf = (typeof requestAnimationFrame === 'function')
    ? requestAnimationFrame
    : (JXG && JXG.requestAnimationFrame
        ? function (cb) { return JXG.requestAnimationFrame(cb); }
        : function (cb) { return setTimeout(function () { cb(Date.now()); }, 16); });

function step(now) {
    if (now === undefined) { now = Date.now(); }
    if (last === null) { last = now; }
    var dt = now - last;
    last = now;

    var v = angle.Value() + SPEED * dt;
    while (v > 2 * Math.PI) { v -= 2 * Math.PI; }
    angle.setValue(v);
    board.update();

    raf(step);
}

raf(step);