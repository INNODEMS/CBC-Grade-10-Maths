JXG.Options.text.useMathJax = true;
(function () {
    'use strict';

    const BOARD_ID = 'jsxgraph-equation-mirror-line';
    const BOUNDING_BOX = [-7, 7, 7, -7];

    const board = JXG.JSXGraph.initBoard(BOARD_ID, {
        boundingbox: BOUNDING_BOX,
        axis: true,
        grid: true,
        keepAspectRatio: true,
        showNavigation: false,
        showCopyright: false,
        pan: { enabled: false },
        zoom: { enabled: false }
    });

    // translucent white box in top-left to prevent axis/grid cutting through labels and sliders
    // create fixed, hidden vertices so the box cannot be moved
    const _boxP1 = board.create('point', [-6.8, 6.9], { fixed: true, visible: false });
    const _boxP2 = board.create('point', [-2.3, 6.9], { fixed: true, visible: false });
    const _boxP3 = board.create('point', [-2.3, 4.8], { fixed: true, visible: false });
    const _boxP4 = board.create('point', [-6.8, 4.8], { fixed: true, visible: false });

    board.create('polygon', [_boxP1, _boxP2, _boxP3, _boxP4], {
        fillColor: '#ffffff',
        fillOpacity: 0.50,
        strokeColor: '#ffffff',
        strokeWidth: 0,
        fixed: true,
        highlight: false,
        layer: 5
    });

    // Replace sliders with input fields so users can type m and c
    var inputM = board.create('input', [-6.4, 5.3, '-0.5', 'm = '], { fontSize: 16 , cssStyle: 'width: 40px'});

    var inputC = board.create('input', [-4.2, 5.3, '-0.5', 'c = '], { fontSize: 16 , cssStyle: 'width: 40px'});
    // ensure the board updates when either input value changes
    if (inputM.rendNodeInput) {
        inputM.rendNodeInput.addEventListener('change', function () { board.update(); });
    }
    if (inputC.rendNodeInput) {
        inputC.rendNodeInput.addEventListener('change', function () { board.update(); });
    }

    var l1 = board.create('line',
        [
            [0, function () { return parseFloat(inputC.Value()) || 0; }],
            [1, function () { return (parseFloat(inputM.Value()) || 0) + (parseFloat(inputC.Value()) || 0); }]
        ],
        {
            strokeColor: '#000000',
            strokeWidth: 4,
            dash: 2,
            name: 'Mirror Line',
            withLabel: true,
            layer: 5,
            label: { fontSize: 18, offset: [50, -50] }
        }
    );

    function reflectPoint(point) {
        return [
            function () {
                const x = point.X();
                const y = point.Y();
                const m = parseFloat(inputM.Value()) || 0;
                const c = parseFloat(inputC.Value()) || 0;
                const a = m, b = -1, d = c;
                const denom = a * a + b * b;
                const factor = (a * x + b * y + d) / denom;
                return x - 2 * a * factor;
            },
            function () {
                const x = point.X();
                const y = point.Y();
                const m = parseFloat(inputM.Value()) || 0;
                const c = parseFloat(inputC.Value()) || 0;
                const a = m, b = -1, d = c;
                const denom = a * a + b * b;
                const factor = (a * x + b * y + d) / denom;
                return y - 2 * b * factor;
            }
        ];
    }

    const A = board.create('point', [2, 5], { name: 'A', size: 4 });
    const B = board.create('point', [2, 3], { name: 'B', size: 4 });
    const C = board.create('point', [4, 2], { name: 'C', size: 4 });
    const D = board.create('point', [0, 0], { name: 'D', size: 4 });

    board.create('polygon',
        [A, B, C, D],
        {
            fillColor: '#1d4ed8',
            fillOpacity: 0.25,
            strokeColor: '#1d4ed8',
            strokeWidth: 3
        }
    );

    const Aprime = board.create('point', reflectPoint(A), { name: "A'", fixed: true });
    const Bprime = board.create('point', reflectPoint(B), { name: "B'", fixed: true });
    const Cprime = board.create('point', reflectPoint(C), { name: "C'", fixed: true });
    const Dprime = board.create('point', reflectPoint(D), { name: "D'", fixed: true });

    board.create('polygon',
        [Aprime, Bprime, Cprime, Dprime],
        {
            fillColor: '#d62828',
            fillOpacity: 0.25,
            strokeColor: '#d62828',
            strokeWidth: 3
        }
    );
    var line = board.create('text', [-4.55, 6.5, 'Equation of Mirror Line'], { fixed: true, anchorX: 'middle', anchorY: 'middle', fontSize: 16 });

    var eqn = board.create('text',
    [
        -6.3, 6,
            function () {
            const m = (parseFloat(inputM.Value()) || 0).toFixed(2);
            const cnum = parseFloat(inputC.Value()) || 0;
            const c = cnum.toFixed(2);

            // Handle sign formatting cleanly
            const sign = (cnum >= 0) ? '+' : '-';
            const absC = Math.abs(cnum).toFixed(2);

            return '\\[y = ' + m + 'x ' + sign + ' ' + absC + '\\]';
        }
    ],
    {
        fixed: true,
        anchorX: 'left',
        anchorY: 'middle',
        fontSize: 16
    }
    );

    const connect = board.create('segment', [A, Aprime], { dash: 2 });

    
    

})();