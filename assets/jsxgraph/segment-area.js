(function () {
    // ---------- 1. THE BOARD ----------
    const board = JXG.JSXGraph.initBoard('jsxboard-segment-area', {
        boundingbox: [-12, 18, 15, -12],
        axis: false,
        showNavigation: false,
        showCopyright: false,
        keepaspectratio: true
    });

    // ---------- 2. SLIDERS ----------
    // Radius Slider (r)
    const sR = board.create('slider', [[-10, 15], [-2, 15], [1, 7, 10]], {
        name: 'r', withLabel: false, snapWidth: 0.1
    });
    board.create('text', [-10, 16, 'Radius (r)'], { fontSize: 13, fontWeight: 'bold' });
    board.create('text', [-1.5, 15, () => sR.Value().toFixed(1)], { fontSize: 13 });

    // Angle Slider (θ) - Focused on 0-180 for minor segments
    const sTheta = board.create('slider', [[2, 15], [10, 15], [0, 90, 180]], {
        name: 'θ', withLabel: false, snapWidth: 1
    });
    board.create('text', [2, 16, 'Angle (θ°)'], { fontSize: 13, fontWeight: 'bold' });
    board.create('text', [10.5, 15, () => sTheta.Value().toFixed(0) + '°'], { fontSize: 13 });

    // ---------- 3. GEOMETRY ----------
    const center = board.create('point', [0, 1], { name: 'C', fixed: true, size: 3, color: 'black' });
    const p1 = board.create('point', [() => sR.Value(), 1], { visible: false });
    
    // Polar coordinates for the second point
    const thetaRad = () => sTheta.Value() * Math.PI / 180;
    const p2 = board.create('point', [
        () => sR.Value() * Math.cos(thetaRad()),
        () => 1 + sR.Value() * Math.sin(thetaRad())
    ], { visible: false });

    // 1. Draw the Sector (The full piece)
    board.create('sector', [center, p1, p2], {
        fillColor: '#4CAF50', fillOpacity: 0.5, strokeColor: '#2E7D32', strokeWidth: 2
    });

    // 2. Draw the Triangle (Layered on top in white to "cut" the segment)
    board.create('polygon', [center, p1, p2], {
        fillColor: '#ffffff', fillOpacity: 1, strokeColor: '#2c3e50', strokeWidth: 1, dash: 2
    });

    // The Chord (Line between p1 and p2)
    board.create('segment', [p1, p2], { strokeColor: '#e91e63', strokeWidth: 3, name: 'chord', withLabel: true });

    // Central Angle Label
    board.create('angle', [p1, center, p2], { name: 'θ', radius: 1.5 });

    // ---------- 4. CALCULATION PANEL ----------
    board.create('text', [-18, -8, function () {
        const r = sR.Value();
        const theta = sTheta.Value();
        const rad = thetaRad();

        const areaSector = ((theta / 360) * Math.PI * r * r).toFixed(2);
        const areaTriangle = (0.5 * r * r * Math.sin(rad)).toFixed(2);
        const areaSegment = (areaSector - areaTriangle).toFixed(2);

        return "<div style='background:#ffffff; padding:15px; border:2px solid #2E7D32; border-radius:8px; width:530px; font-family:sans-serif;'>" +
               "<table style='width:80%; text-align:center; border-collapse: collapse;'>" +
               "<tr>" +
               "<td style='width:30%'><b>Sector Area</b><br> ≈ " + areaSector + "</td>" +
               "<td style='width:30%; border-left: 1px solid #ccc;'><b>Triangle Area</b><br>½ r² sin(θ)<br>≈ " + areaTriangle + "</td>" +
               "<td style='width:30%; border-left: 2px solid #2E7D32; background:#E8F5E9;'>" +
               "<b>Segment Area</b><br>" + areaSector + " - " + areaTriangle + "<br>" +
               "<b>A ≈ " + areaSegment + " units²</b></td>" +
               "</tr></table></div>";
    }], { fontSize: 14, fixed: true });

})();