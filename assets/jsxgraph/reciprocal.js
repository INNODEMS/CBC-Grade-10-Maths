/* reciprocal-grid.js
   f(x)=1/x with grid lines every 0.1 units.
   Uses explicit axes (axis:false) and a grid tied to those axes.
*/
JXG.Options.text.useMathJax = true;
(function () {
    "use strict";
    // ----------------------------
    // Board configuration
    // ----------------------------
    var BOARD_ID = "jsxgraph-reciprocal-grid";
    var X_MIN = -0.5, X_MAX = 3.5;
    var Y_MIN = -0.5, Y_MAX = 3.5;

    var board = JXG.JSXGraph.initBoard(BOARD_ID, {
        boundingbox: [X_MIN, Y_MAX, X_MAX, Y_MIN],
        keepAspectRatio: true,
        axis: false,              // IMPORTANT: we build axes ourselves
        grid:false,
        showCopyright: false,
        showNavigation: false
    });

    // ----------------------------
    // Axes with ticks:
    // major tick every 1 unit, 9 minor ticks -> 0.1-unit subdivisions
    // ----------------------------
    // Standard x-axis through the origin
    var xAxis = board.create('axis', [[0, 0], [1, 0]], {
        ticks: {
            strokeColor: '#666',
            strokeWidth: 1,
            minorTicks: 9,
            majorHeight: 20,
            minorHeight: 10,
            ticksDistance: 1,
            drawZero: false,
            drawLabels: true
        }
    });
    // Standard y-axis through the origin
    var yAxis = board.create('axis', [[0, 0], [0, 1]], {
        ticks: {
            strokeColor: '#666',
            strokeWidth: 1,
            minorTicks: 9,
            majorHeight: 20,
            minorHeight: 10,
            ticksDistance: 1,
            drawZero: false,
            drawLabels: true,
            // draw ticks on the left side of the vertical axis
            majorTickEndings: [0, 1],
            tickEndings: [0, 1],
            label: {
                anchorX: 'right',
                offset: [-6, 0]
            }
        }
    });

    // ----------------------------
    // Grid: major lines every 1 unit, minor lines every 0.1 unit
    // minorElements: 9 means 9 minor elements between each major
    // => minorStep = majorStep / (minorElements + 1) = 1/10 = 0.1
    // ----------------------------
    var grid = board.create('grid', [xAxis, yAxis], {
        majorStep: 1,
        minorElements: 9,
        major: {
            face: 'line',
            strokeColor: '#bbb',
            strokeOpacity: 1
        },
        minor: {
            face: 'line',
            strokeColor: '#ddd',
            strokeOpacity: 0.8
        },
        includeBoundaries: false
    });

    // ----------------------------
    // Function: f(x) = 1/x (split at x=0)
    // ----------------------------
    function recip(x) {
        return 1 / x;
    }

    var EPS = 0.1; // gap around x=0 so the curve does not draw across the asymptote

    board.create("functiongraph", [recip, X_MIN, -EPS], {
        strokeColor: "#1f77b4",
        strokeWidth: 3,
        withLabel: false
    });

    var fPos = board.create("functiongraph", [recip, EPS, X_MAX], {
        strokeColor: "#1f77b4",
        strokeWidth: 3,
        withLabel: false
    });

    board.create("text", [0.5, 4.8, '\\[f(x)=\\frac{1}{x}\\]'], {
        fontSize: 16,
        fixed: true,
        anchorX: "left",
        anchorY: "top",
        useMathJax: true
    });

    // ----------------------------
    // Draggable point P as glider on f(x)=1/x
    // ----------------------------
    var P = board.create('glider', [2, 0.5, fPos], {
        name: 'P',
        size: 4,
        strokeColor: '#e74c3c',
        fillColor: '#e74c3c'
    });

    // Projection points: Px on x-axis, Py on y-axis
    var Px = board.create('point', [
        function () { return P.X(); },
        function () { return 0; }
    ], {
        visible: false
    });

    var Py = board.create('point', [
        function () { return 0; },
        function () { return P.Y(); }
    ], {
        visible: false
    });

    var O = board.create('point', [0, 0], {
        visible: false
    });

    // Rectangle: O -> Px -> P -> Py -> O
    board.create('polygon', [O, Px, P, Py], {
        fillColor: 'rgba(277, 0, 0, 0.15)',
        borders: {
            strokeColor: '#E30000',
            strokeWidth: 1.5
        },
        vertices: { visible: false },
        hasInnerPoints: false,
        fixed: true
    });

    board.create('polygon', [[0, 0], [2, 0], [2, 0.5], [0, 0.5]], {
                fillColor: 'grey',
        fillOpacity: 0.1,
        borders: {
            strokeColor: 'black',
            strokeWidth: 0.8
        },
        vertices: { visible: false },
        hasInnerPoints: false,
        fixed: true
     });

    board.create('polygon', [[0, 0], [3, 0], [3, 0.3333], [0, 0.3333]], {
        fillColor: 'grey',
        fillOpacity: 0.1,
        borders: {
            strokeColor: 'black',
            strokeWidth: 0.8
        },
        vertices: { visible: false },
        hasInnerPoints: false,
        fixed: true
     });

     board.create('polygon', [[0, 0], [1, 0], [1, 1], [0, 1]], {
        fillColor: 'grey',
        fillOpacity: 0.1,
        borders: {
            strokeColor: 'black',
            strokeWidth: 0.8
        },
        vertices: { visible: false },
        hasInnerPoints: false,
        fixed: true
     });

        board.create('polygon', [[0, 0], [0, 2], [0.5, 2], [0.5, 0]], {
        fillColor: 'grey',
        fillOpacity: 0.1,
        borders: {
            strokeColor: 'black',
            strokeWidth: 0.8
        },
        vertices: { visible: false },
        hasInnerPoints: false,
        fixed: true
     });

    // Labels showing coordinates on the axes
    board.create('text', [
        function () { return P.X(); },
        -0.3,
        function () { return 'x = ' + P.X().toFixed(3); }
    ], {
        fontSize: 14,
        anchorX: 'middle',
        color: '#2980b9',
        fixed: true
    });

    // Area label in the centre of the rectangle
    board.create('text', [
        function () { return P.X() / 2; },
        function () { return P.Y() / 2; },
        function () {
            var area = Math.abs(P.X() * P.Y());
            return 'Area = ' + area.toFixed(2);
        }
    ], {
        fontSize: 14,
        anchorX: 'middle',
        anchorY: 'middle',
        color: '#E30000',
        fixed: true
    });
    
})();