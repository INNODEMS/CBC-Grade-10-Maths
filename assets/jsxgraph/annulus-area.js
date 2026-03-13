
    const GEOM_BBOX = [-12, 12, 15, -12];
    const CALC_BBOX = [0, 5, 10, 0];

    // ==========================================================
    // 1. GEOMETRY BOARD
    // ==========================================================
    const board = JXG.JSXGraph.initBoard('jsxboard', {
        boundingbox: GEOM_BBOX,
        axis: false,
        showNavigation: false,
        showCopyright: false
    });

    // ==========================================================
    // 2. CALCULATION BOARD
    // ==========================================================
    const boardCalc = JXG.JSXGraph.initBoard('jsxboard_calc', {
        boundingbox: CALC_BBOX,
        axis: false,
        showNavigation: false,
        showCopyright: false
    });

    // ==========================================================
    // 3. SLIDERS
    // ==========================================================

    // Outer Radius Slider
    const sR = board.create('slider', [[1, 11], [6, 11], [1, 10, 12]], {
        name: 'R',
        withLabel: true,
        snapWidth: 0.1
    });

    // Inner Radius Slider
    const sr = board.create('slider', [[9, 11], [14, 11], [0, 5, 12]], {
        name: 'r',
        withLabel: true,
        snapWidth: 0.1
    });

    // ==========================================================
    // 4. GEOMETRIC CONSTRUCTION
    // ==========================================================

    const center = board.create('point', [0, 0], {
        name: 'C',
        fixed: true,
        size: 3,
        color: 'black'
    });

    // Ensure inner radius never exceeds outer radius
    const safe_r = function () {
        return Math.min(sr.Value(), sR.Value() - 0.2);
    };

    // Outer circle
    const outerCircle = board.create('circle', [center, function () {
        return sR.Value();
    }], {
        strokeColor: '#2c3e50',
        fillColor: '#00bcd4',
        fillOpacity: 0.3
    });

    // Inner circle
    const innerCircle = board.create('circle', [center, safe_r], {
        strokeColor: '#2c3e50',
        fillColor: '#ffffff',
        fillOpacity: 1,
        dash: 2
    });

    // Radius segments
    board.create('segment', [
        center,
        function () { return [sR.Value(), 0]; }
    ], {
        name: 'R',
        strokeColor: '#00838f',
        strokeWidth: 3
    });

    board.create('segment', [
        center,
        function () { return [0, -safe_r()]; }
    ], {
        name: 'r',
        strokeColor: '#e74c3c',
        strokeWidth: 3
    });

    // ==========================================================
    // 5. CALCULATION PANEL
    // ==========================================================

    boardCalc.create('text', [0.2, 4.5, function () {

        const R = sR.Value();
        const r = safe_r();

        const areaOuter = Math.PI * R * R;
        const areaInner = Math.PI * r * r;
        const annulusArea = areaOuter - areaInner;

        return "<div style='background:#ffffff; padding:12px; border:2px solid #2c3e50; border-radius:8px; width:480px; font-family:sans-serif;'>" +

            "<table style='width:100%; text-align:center; border-collapse:collapse;'>" +

            "<tr>" +

            "<td style='width:33%'><b>Step 1</b><br>Outer Circle<br>π(" +
            R.toFixed(1) + ")²<br>≈ " + areaOuter.toFixed(2) + "</td>" +

            "<td style='width:33%; border-left:1px solid #ccc;'><b>Step 2</b><br>Inner Circle<br>π(" +
            r.toFixed(1) + ")²<br>≈ " + areaInner.toFixed(2) + "</td>" +

            "<td style='width:34%; border-left:1px solid #2c3e50; background:#e0f7fa;'><b>Step 3</b><br>Annulus Area<br>" +
            areaOuter.toFixed(2) + " − " + areaInner.toFixed(2) +
            "<br><b>A ≈ " + annulusArea.toFixed(2) + " units²</b></td>" +

            "</tr></table></div>";

    }], {
        fixed: true,
        fontSize: 14
    });