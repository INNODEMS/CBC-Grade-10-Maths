const board = JXG.JSXGraph.initBoard('jsxgraph-area-of-a-sector', {
        boundingbox: [-12, 16, 15, -12], // Taller top (16) and bottom (-12)
        axis: false,
        showNavigation: false,
        showCopyright: false,
        keepaspectratio: true
    });

    // ---------- 2. SLIDERS ----------
    // Radius Slider (r)
    const sR = board.create('slider', [[1, 14], [6, 14], [1, 7, 10]], {
        name: 'r', withLabel: false, snapWidth: 0.1
    });
    board.create('text', [1, 15, 'Radius (r)'], { fontSize: 13, fontWeight: 'bold' });
    board.create('text', [6.5, 14, () => sR.Value().toFixed(1)], { fontSize: 13 });

    // Angle Slider (θ)
    const sTheta = board.create('slider', [[8.5, 14], [13.5, 14], [0, 90, 360]], {
        name: 'θ', withLabel: false, snapWidth: 1
    });
    board.create('text', [8.5, 15, 'Angle (θ°)'], { fontSize: 13, fontWeight: 'bold' });
    board.create('text', [14, 14, () => sTheta.Value().toFixed(0) + '°'], { fontSize: 13 });

    // ---------- 3. GEOMETRY ----------
    const center = board.create('point', [0, 1], { name: 'C', fixed: true, size: 3, color: 'black' });
    const p1 = board.create('point', [() => sR.Value(), 1], { visible: false });
    
    // Polar coordinates for the second point of the sector
    const p2 = board.create('point', [
        () => sR.Value() * Math.cos(sTheta.Value() * Math.PI / 180),
        () => 1 + sR.Value() * Math.sin(sTheta.Value() * Math.PI / 180)
    ], { visible: false });

    // Ghost Circle for reference
    board.create('circle', [center, () => sR.Value()], {
        strokeColor: '#ccc', dash: 1, strokeWidth: 1
    });

    // The Shaded Sector
    board.create('sector', [center, p1, p2], {
        fillColor: '#ff9800', fillOpacity: 0.4, strokeColor: '#e65100', strokeWidth: 2
    });

    // Central Angle Label
    board.create('angle', [p1, center, p2], { name: 'θ', radius: 1.5 });

    // ---------- 4. CALCULATION PANEL (Now on the same board) ----------
    board.create('text', [-16, -8, function () {
        const r = sR.Value();
        const theta = sTheta.Value();
        const circleArea = (Math.PI * r * r).toFixed(2);
        const sectorArea = ((theta / 360) * Math.PI * r * r).toFixed(2);
        const ratio = (theta / 360).toFixed(3);

        return "<div style='background:#ffffff; padding:15px; border:2px solid #e65100; border-radius:8px; width:550px; font-family:sans-serif; box-shadow: 2px 2px 5px rgba(0,0,0,0.1);'>" +
               "<table style='width:100%; text-align:center; border-collapse: collapse;'>" +
               "<tr>" +
               "<td style='width:33%'><b>Full Area (πr²)</b><br>π × " + r.toFixed(1) + "²<br>≈ " + circleArea + "</td>" +
               "<td style='width:33%; border-left: 1px solid #ccc;'><b>Fraction (θ/360)</b><br>" + theta + "°/360°<br>≈ " + ratio + "</td>" +
               "<td style='width:34%; border-left: 1px solid #e65100; background:#fff3e0;'>" +
               "<b>Sector Area</b><br>" + ratio + " × " + circleArea + "<br>" +
               "<b>A ≈ " + sectorArea + " units²</b></td>" +
               "</tr></table></div>";
    }], { fontSize: 14, fixed: true });