/* Rotational Symmetry of a Square Prism (3D)
 *
 * A square prism (4×4 base, height 2) has 8 rotational symmetries.
 * Four axes of symmetry are shown:
 *   Z-axis  (vertical)  — 4-fold: 0°, 90°, 180°, 270°
 *   X-axis  (horizontal) — 2-fold: 0°, 180°
 *   Y-axis  (horizontal) — 2-fold: 0°, 180°
 *   Diagonal (1,1,0)     — 2-fold: 0°, 180°
 *
 * Each axis has its own slider.  The student discovers all 8
 * distinct symmetries (the 8th requires combining two sliders).
 */
(function () {
    'use strict';

    var PI = Math.PI;
    var SQ = Math.SQRT1_2;   // 1/√2

    /* ==============================================================
     * Board
     * ============================================================== */
    var board = JXG.JSXGraph.initBoard('jsxgraph-3d-symmetry', {
        boundingbox: [-10, 10, 10, -12],
        keepaspectratio: true,
        axis: false,
        showcopyright: false,
        shownavigation: false,
        movetarget: null,
        pan: { enabled: false },
        browserpan: false,
        zoom: { enabled: false }
    });

    /* ==============================================================
     * 3D View
     * ============================================================== */
    var view = board.create('view3d',
        [[-7, -3], [14, 10],
         [[-7, 7], [-5, 5], [-5, 5]]],
        {
            projection: 'central',
            trackball: { enabled: false },
            depthOrder: { enabled: true },

            axesPosition: 'center',
            xAxis: { visible: false },
            yAxis: { visible: false },
            zAxis: { visible: false },

            xPlaneRear:  { visible: false, mesh3d: { visible: false } },
            yPlaneRear:  { visible: false, mesh3d: { visible: false } },
            zPlaneRear:  { visible: false, mesh3d: { visible: false } },
            xPlaneFront: { visible: false, mesh3d: { visible: false } },
            yPlaneFront: { visible: false, mesh3d: { visible: false } },
            zPlaneFront: { visible: false, mesh3d: { visible: false } },

            xPlaneRearYAxis: { visible: false }, xPlaneRearZAxis: { visible: false },
            yPlaneRearXAxis: { visible: false }, yPlaneRearZAxis: { visible: false },
            zPlaneRearXAxis: { visible: false }, zPlaneRearYAxis: { visible: false },
            xPlaneFrontYAxis: { visible: false }, xPlaneFrontZAxis: { visible: false },
            yPlaneFrontXAxis: { visible: false }, yPlaneFrontZAxis: { visible: false },
            zPlaneFrontXAxis: { visible: false }, zPlaneFrontYAxis: { visible: false },

            az:   { slider: { visible: false } },
            el:   { slider: { visible: false } },
            bank: { slider: { visible: false } }
        }
    );
    view.setView(0.8, 0.3, 0);

    /* ==============================================================
     * Title
     * ============================================================== */
    board.create('text', [0, 8.8,
        'Rotational Symmetry of a Square Prism'], {
        fontSize: 18, fixed: true, anchorX: 'middle'
    });
    board.create('text', [0, 8.0,
        'Use the sliders to rotate about each axis of symmetry'], {
        fontSize: 13, fixed: true, anchorX: 'middle', strokeColor: '#666666'
    });

    /* ==============================================================
     * Square-prism geometry  (base 4×4, height 2)
     *
     *  Vertices (±2, ±2, ±1) — 6 coloured faces.
     * ============================================================== */
    var a = 2, c = 1;
    var verts = [
        [-a, -a, -c], [ a, -a, -c], [ a,  a, -c], [-a,  a, -c],
        [-a, -a,  c], [ a, -a,  c], [ a,  a,  c], [-a,  a,  c]
    ];
    var faces = [
        [0, 1, 2, 3],   // bottom
        [4, 5, 6, 7],   // top
        [0, 1, 5, 4],   // front
        [2, 3, 7, 6],   // back
        [1, 2, 6, 5],   // right
        [0, 3, 7, 4]    // left
    ];
    var faceColors = [
        '#0072b2', '#e69f00', '#f0e442',
        '#009e73', '#56b4e9', '#d55e00'
    ];

    /* ==============================================================
     * Reference prism  (left, semi-transparent)
     * ============================================================== */
    var xOff = 3;
    var refVerts = verts.map(function (v) {
        return [v[0] - xOff, v[1], v[2]];
    });
    var refPrism = view.create('polyhedron3d', [refVerts, faces], {
        fillColorArray: faceColors,
        fillOpacity: 1,
        strokeColor: '#666666',
        strokeWidth: 1
    });

    /* ==============================================================
     * Axis colours  (shared between 3D lines and sliders)
     * ============================================================== */
    var COL = {
        z: '#2980b9',
        x: '#e74c3c',
        y: '#27ae60',
        d: '#8e44ad'
    };

    /* ==============================================================
     * Draw 3D axis lines through the rotating prism centre
     * ============================================================== */
    var axisLen = 4.5;
    var centerPt = view.create('point3d', [xOff, 0, 0],
        { visible: false, fixed: true });

    function drawAxis(dir, color) {
        view.create('line3d', [centerPt, dir, [-axisLen, axisLen]], {
            strokeColor: color,
            strokeWidth: 3,
            dash: 2,
            point: { visible: false },
            layer:50,
            fillOpacity: 0.8
        });
    }

    drawAxis([0, 0, 1],    COL.z);    // z-axis  (vertical)
    drawAxis([1, 0, 0],    COL.x);    // x-axis
    drawAxis([0, 1, 0],    COL.y);    // y-axis
    drawAxis([SQ, SQ, 0],  COL.d);    // diagonal (1,1,0)

    /* ==============================================================
     * Rotation arc-arrows at the positive end of each axis
     *
     * Each arc is a curve3d parametric circle (270° sweep) in the
     * plane perpendicular to the axis, plus a small arrowhead
     * (a second short curve3d).
     *
     * Parameters:
     *   centre  – [x,y,z] position along the axis (near the tip)
     *   u, v    – two unit vectors spanning the perpendicular plane
     *   color   – stroke colour
     *   r       – arc radius
     * ============================================================== */
    var arcR     = 0.5;                    // radius of the arcs
    var arcPos   = axisLen - 0.3;          // distance along axis
    var arcSweep = 1 * PI;              // 270° arc
    var nPts     = 60;                     // curve resolution
    var ahLen    = 0.35;                   // arrowhead size

    function drawArcArrow(centre, u, v, color, r) {
        r = r || arcR;

        /* Arc curve: P(t) = centre + r·cos(t)·u + r·sin(t)·v
           t runs from 0 to arcSweep */
        view.create('curve3d', [
            function (t) { return centre[0] + r * Math.cos(t) * u[0] + r * Math.sin(t) * v[0]; },
            function (t) { return centre[1] + r * Math.cos(t) * u[1] + r * Math.sin(t) * v[1]; },
            function (t) { return centre[2] + r * Math.cos(t) * u[2] + r * Math.sin(t) * v[2]; },
            [0, arcSweep]
        ], {
            strokeColor: color,
            strokeWidth: 2.5,
            numberPointsHigh: nPts,
            numberPointsLow: nPts,
            layer:50,
            fillOpacity: 0.8
        });

        /* Arrowhead: two short lines from the arc tip
           tangent direction at tip and an inward direction */
        var tEnd = arcSweep;
        var tipX = centre[0] + r * Math.cos(tEnd) * u[0] + r * Math.sin(tEnd) * v[0];
        var tipY = centre[1] + r * Math.cos(tEnd) * u[1] + r * Math.sin(tEnd) * v[1];
        var tipZ = centre[2] + r * Math.cos(tEnd) * u[2] + r * Math.sin(tEnd) * v[2];

        /* Tangent at tEnd: d/dt [cos(t)·u + sin(t)·v] = -sin(t)·u + cos(t)·v */
        var tanU = -Math.sin(tEnd), tanV = Math.cos(tEnd);
        var tx3 = tanU * u[0] + tanV * v[0];
        var ty3 = tanU * u[1] + tanV * v[1];
        var tz3 = tanU * u[2] + tanV * v[2];

        /* Inward (toward centre) at tEnd */
        var inU = -Math.cos(tEnd), inV = -Math.sin(tEnd);
        var ix = inU * u[0] + inV * v[0];
        var iy = inU * u[1] + inV * v[1];
        var iz = inU * u[2] + inV * v[2];

        /* Two barb points */
        var mix = 0.5;  // tangent component (higher = shallower angle)
        var barb1 = [tipX + ahLen * (-tx3 * mix + ix * (1 - mix)),
                     tipY + ahLen * (-ty3 * mix + iy * (1 - mix)),
                     tipZ + ahLen * (-tz3 * mix + iz * (1 - mix))];
        var barb2 = [tipX + ahLen * (-tx3 * mix - ix * (1 - mix)),
                     tipY + ahLen * (-ty3 * mix - iy * (1 - mix)),
                     tipZ + ahLen * (-tz3 * mix - iz * (1 - mix))];

        /* Draw each barb as a tiny 2-point curve */
        function drawBarb(bx, by, bz) {
            view.create('curve3d', [
                function (t) { return tipX + t * (bx - tipX); },
                function (t) { return tipY + t * (by - tipY); },
                function (t) { return tipZ + t * (bz - tipZ); },
                [0, 1]
            ], {
                strokeColor: color,
                strokeWidth: 2.5,
                numberPointsHigh: 2,
                numberPointsLow: 2
            });
        }
        drawBarb(barb1[0], barb1[1], barb1[2]);
        drawBarb(barb2[0], barb2[1], barb2[2]);
    }

    /* Z-axis: arc at z = +arcPos, perpendicular plane spanned by (1,0,0) and (0,1,0) */
    drawArcArrow([xOff, 0, arcPos],  [1, 0, 0], [0, 1, 0],  COL.z);

    /* X-axis: arc at x = xOff + arcPos, perpendicular plane spanned by (0,1,0) and (0,0,1) */
    drawArcArrow([xOff + arcPos, 0, 0],  [0, 1, 0], [0, 0, 1],  COL.x);

    /* Y-axis: arc at y = +arcPos, perpendicular plane spanned by (0,0,1) and (1,0,0) */
    drawArcArrow([xOff, arcPos, 0],  [0, 0, 1], [1, 0, 0],  COL.y);

    /* Diagonal (1,1,0): arc positioned along the (SQ,SQ,0) direction,
       perpendicular plane spanned by (-SQ,SQ,0) and (0,0,1) */
    drawArcArrow([xOff + SQ * arcPos, SQ * arcPos, 0],
                 [-SQ, SQ, 0], [0, 0, 1],  COL.d);

    /* ==============================================================
     * Rotation sliders  (5° steps, 0–360°)
     * ============================================================== */
    var sliderBase = {
        baseline: {
            highlight: false, strokeWidth: 10,
            lineCap: 'round', strokeColor: '#eeeeee'
        },
        highline: {
            highlight: false, strokeWidth: 10,
            lineCap: 'round', strokeColor: '#dddddd'
        },
        point1: { frozen: false, fixed: true },
        point2: { frozen: false, fixed: true },
        drawLabel: false,
        face: 'o',
        size: 7,
        snapWidth: PI / 36,   // 5° steps
        strokeWidth: 0,
        highlightStrokeWidth: 4,
        ticks: { visible: false },
        visible: true
    };

    function makeSlider(x1, x2, y, color) {
        return board.create('slider',
            [[x1, y], [x2, y], [0, 0, 2 * PI]],
            Object.assign({}, sliderBase, {
                fillColor: color,
                highlightFillColor: color,
                highlightStrokeColor: color
            })
        );
    }

    var sZ = makeSlider(-8, -2, -7, COL.z);
    var sX = makeSlider(2, 8, -7, COL.x);
    var sY = makeSlider(-8,  -2, -10, COL.y);
    var sD = makeSlider( 2,  8, -10, COL.d);

    // Labels above sliders
    board.create('text', [-5, -6.5, 'Z axis'], {
        fontSize: 12, fixed: true, anchorX: 'middle', strokeColor: COL.z });
    board.create('text', [5, -6.5, 'X axis'], {
        fontSize: 12, fixed: true, anchorX: 'middle', strokeColor: COL.x });
    board.create('text', [-5, -9.5, 'Y axis'], {
        fontSize: 12, fixed: true, anchorX: 'middle', strokeColor: COL.y });
    board.create('text', [5, -9.5, 'Diagonal'], {
        fontSize: 12, fixed: true, anchorX: 'middle', strokeColor: COL.d });

    // Degree read-outs
    function degText(sl) {
        return function () {
            return Math.round(sl.Value() * 180 / PI) % 360 + '\u00B0';
        };
    }
    board.create('text', [-5, -7.6, degText(sZ)], {
        fontSize: 13, fixed: true, anchorX: 'middle', strokeColor: COL.z });
    board.create('text', [5, -7.6, degText(sX)], {
        fontSize: 13, fixed: true, anchorX: 'middle', strokeColor: COL.x });
    board.create('text', [-5, -10.6, degText(sY)], {
        fontSize: 13, fixed: true, anchorX: 'middle', strokeColor: COL.y });
    board.create('text', [5, -10.6, degText(sD)], {
        fontSize: 13, fixed: true, anchorX: 'middle', strokeColor: COL.d });

    /* ==============================================================
     * Reset button
     * ============================================================== */
    board.create('button', [-0.5, -8.5, 'Reset', function () {
        sZ.setValue(0); sX.setValue(0);
        sY.setValue(0); sD.setValue(0);
        board.update();
    }]);

    /* ==============================================================
     * 3D Transforms  (translate to origin → 4 rotations → translate right)
     *
     * Only use rotateX / rotateY / rotateZ (JSXGraph's proven
     * axis-aligned rotation functions).  The diagonal (1,1,0)
     * rotation is decomposed as a basis change:
     *   rotateZ(−π/4) · rotateX(θ) · rotateZ(+π/4)
     * ============================================================== */
    var trToOrigin = view.create('transform3d',
        [xOff, 0, 0], { type: 'translate' });

    /* Z-axis rotation */
    var trZ = view.create('transform3d',
        [function () { return sZ.Value(); }], { type: 'rotateZ' });

    /* X-axis rotation */
    var trX = view.create('transform3d',
        [function () { return sX.Value(); }], { type: 'rotateX' });

    /* Y-axis rotation */
    var trY = view.create('transform3d',
        [function () { return sY.Value(); }], { type: 'rotateY' });

    /* Diagonal (1,1,0) rotation decomposed:
       align diagonal with x-axis, rotate about x, un-align */
    var trDpre  = view.create('transform3d',
        [-PI / 4], { type: 'rotateZ' });
    var trDrot  = view.create('transform3d',
        [function () { return sD.Value(); }], { type: 'rotateX' });
    var trDpost = view.create('transform3d',
        [PI / 4], { type: 'rotateZ' });

    var trToRight = view.create('transform3d',
        [xOff, 0, 0], { type: 'translate' });

    /* Rotating prism (opaque) */
    view.create('polyhedron3d',
        [refPrism, [trToOrigin, trZ, trX, trY, trDpre, trDrot, trDpost, trToRight]], {
        fillColorArray: faceColors,
        fillOpacity: 1,
        strokeColor: 'black',
        strokeWidth: 1
    });

    /* ==============================================================
     * Symmetry detection
     * ============================================================== */
    var totalSym = 8;
    var symCount = 0;
    var seenSym  = {};
    var allFound = false;

    /* Status elements */
    var checkmark = board.create('text', [0, -4.0, '\u2716'], {
        fontSize: 32,
        strokeColor: '#c0392b', fillColor: '#c0392b',
        fixed: true, anchorX: 'middle', anchorY: 'middle'
    });
    var statusLabel = board.create('text', [0, -4.7, ''], {
        fontSize: 14, fixed: true, anchorX: 'middle',
        strokeColor: '#0a8f2c'
    });
    var counterText = board.create('text',
        [0, -5.3, 'Symmetries found: 0'], {
        fontSize: 15, fixed: true, anchorX: 'middle'
    });

    /* ----------------------------------------------------------
     * Rotation-matrix helpers
     * ---------------------------------------------------------- */

    /* Axis-aligned rotation matrices */
    function rotX(t) {
        var c = Math.cos(t), s = Math.sin(t);
        return [[1, 0, 0], [0, c, -s], [0, s, c]];
    }
    function rotY(t) {
        var c = Math.cos(t), s = Math.sin(t);
        return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
    }
    function rotZ(t) {
        var c = Math.cos(t), s = Math.sin(t);
        return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
    }

    /* 3×3 matrix multiply */
    function mulMM(A, B) {
        var C = [[0,0,0],[0,0,0],[0,0,0]];
        for (var i = 0; i < 3; i++)
            for (var j = 0; j < 3; j++)
                for (var k = 0; k < 3; k++)
                    C[i][j] += A[i][k] * B[k][j];
        return C;
    }

    /* Matrix × vector */
    function mulMV(M, v) {
        return [
            M[0][0]*v[0] + M[0][1]*v[1] + M[0][2]*v[2],
            M[1][0]*v[0] + M[1][1]*v[1] + M[1][2]*v[2],
            M[2][0]*v[0] + M[2][1]*v[1] + M[2][2]*v[2]
        ];
    }

    /* Distance-squared */
    function dist2(a, b) {
        var dx = a[0]-b[0], dy = a[1]-b[1], dz = a[2]-b[2];
        return dx*dx + dy*dy + dz*dz;
    }

    /* Does rv match any original vertex? */
    var TOL2 = 0.15 * 0.15;
    function vertexMatches(rv) {
        return verts.some(function (ov) { return dist2(rv, ov) < TOL2; });
    }

    /* Unique key for a rotation (action on two basis vectors) */
    function symKey(M) {
        var r = function (x) { return Math.round(x); };
        return mulMV(M, [1,0,0]).map(r).join(',') + '|' +
               mulMV(M, [0,1,0]).map(r).join(',');
    }

    /* ----------------------------------------------------------
     * Main check  (runs on board update & periodically)
     *
     * Compose:  M = R_diag · R_y · R_x · R_z
     * (same order as the transform chain)
     * ---------------------------------------------------------- */
    function checkSymmetry() {
        var Mz_r = rotZ(sZ.Value());
        var Mx_r = rotX(sX.Value());
        var My_r = rotY(sY.Value());
        /* Diagonal = rotZ(+π/4) · rotX(θ) · rotZ(−π/4) */
        var Md_r = mulMM(rotZ(PI/4), mulMM(rotX(sD.Value()), rotZ(-PI/4)));
        var M  = mulMM(Md_r, mulMM(My_r, mulMM(Mx_r, Mz_r)));

        var matched = verts.every(function (v) {
            return vertexMatches(mulMV(M, v));
        });

        if (matched) {
            checkmark.setText('\u2714');
            checkmark.setAttribute({
                strokeColor: '#0a8f2c', fillColor: '#0a8f2c'
            });

            var k = symKey(M);
            if (!seenSym[k]) {
                seenSym[k] = true;
                symCount++;
                counterText.setText(
                    'Symmetries found: ' + symCount + ' / ' + totalSym);
            }
            if (symCount >= totalSym && !allFound) { allFound = true; }
            statusLabel.setText(allFound
                ? 'All ' + totalSym + ' symmetries found! \uD83C\uDF89'
                : 'Rotational symmetry!');
        } else {
            checkmark.setText('\u2716');
            checkmark.setAttribute({
                strokeColor: '#c0392b', fillColor: '#c0392b'
            });
            if (!allFound) { statusLabel.setText(''); }
        }
    }

    setInterval(checkSymmetry, 150);
    board.on('update', checkSymmetry);

})();
