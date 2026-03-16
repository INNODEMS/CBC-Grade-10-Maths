
const board = JXG.JSXGraph.initBoard('jsxboard-annular-sector', {
    boundingbox: [-12, 18, 15, -12],
    axis: false,
    showNavigation: false,
    showCopyright: false,
    keepaspectratio: true
});

// ---------- 2. SLIDERS ----------
// Outer Radius (R)
const sR = board.create('slider', [[-10, 15], [-2, 15], [1, 9, 12]], {
    name: 'R', withLabel: false, snapWidth: 0.1
});
board.create('text', [-10, 16, 'Outer Radius (R)'], { fontSize: 12, fontWeight: 'bold' });
board.create('text', [-1.5, 15, () => sR.Value().toFixed(1)], { fontSize: 12,fixed: true });

// Inner Radius (r)
const sr = board.create('slider', [[2, 15], [10, 15], [0, 5, 12]], {
    name: 'r', withLabel: false, snapWidth: 0.1
});
board.create('text', [2, 16, 'Inner Radius (r)'], { fontSize: 12, fontWeight: 'bold' });
board.create('text', [10.5, 15, () => sr.Value().toFixed(1)], { fontSize: 12,fixed: true});

// Angle (θ)
const sTheta = board.create('slider', [[-4, 13], [4, 13], [0, 90, 360]], {
    name: 'θ', withLabel: false, snapWidth: 1
});
board.create('text', [-4, 14, 'Central Angle (θ°)'], { fontSize: 12, fontWeight: 'bold' });
board.create('text', [4.5, 13, () => sTheta.Value().toFixed(0) + '°'], { fontSize: 12,fixed: true });

// ---------- 3. GEOMETRY ----------
const center = board.create('point', [0, 1], { name: 'C', fixed: true, size: 3, color: 'black' });

// Constraint: Ensure r is always smaller than R for the drawing
const safe_r = () => Math.min(sr.Value(), sR.Value() - 0.3);
const thetaRad = () => sTheta.Value() * Math.PI / 180;

// Define points for the outer sector
const pR1 = board.create('point', [() => sR.Value(), 1], { visible: false });
const pR2 = board.create('point', [
    () => sR.Value() * Math.cos(thetaRad()),
    () => 1 + sR.Value() * Math.sin(thetaRad())
], { visible: false });

// Define points for the inner sector
const pr1 = board.create('point', [safe_r, 1], { visible: false });
const pr2 = board.create('point', [
    () => safe_r() * Math.cos(thetaRad()),
    () => 1 + safe_r() * Math.sin(thetaRad())
], { visible: false });

// The Outer Sector (Filled)
board.create('sector', [center, pR1, pR2], {
    fillColor: '#9c27b0', fillOpacity: 0.4, strokeColor: '#4a148c', strokeWidth: 2
});

// The Inner Sector (Masked with White)
board.create('sector', [center, pr1, pr2], {
    fillColor: '#ffffff', fillOpacity: 1, strokeColor: '#4a148c', strokeWidth: 2, dash: 2
});

// Central Angle Arc
board.create('angle', [pR1, center, pR2], { name: 'θ', radius: 2 });

// ---------- 4. CALCULATION PANEL ----------
board.create('text', [-19, -8, function () {
    const R = sR.Value();
    const r = safe_r();
    const theta = sTheta.Value();
    
    const annulusArea = (Math.PI * (R*R - r*r)).toFixed(2);
    const fraction = (theta / 360).toFixed(3);
    const finalArea = (fraction * annulusArea).toFixed(2);

    return "<div style='background:#ffffff; padding:12px; border:2px solid #4a148c; border-radius:8px; width:580px; font-family:sans-serif;'>" +
            "<table style='width:100%; text-align:center; border-collapse: collapse;'>" +
            "<tr>" +
            "<td style='width:30%'><b>Full Annulus Area</b><br>π(" + R.toFixed(1) + "² - " + r.toFixed(1) + "²)<br>≈ " + annulusArea + "</td>" +
            "<td style='width:30%; border-left: 1px solid #ccc;'><b>Angle Fraction</b><br>" + theta + "° / 360°<br>≈ " + fraction + "</td>" +
            "<td style='width:40%; border-left: 1px solid #4a148c; background:#f3e5f5;'>" +
            "<b>Annular Sector Area</b><br>" + fraction + " × " + annulusArea + "<br>" +
            "<b>A ≈ " + finalArea + " units²</b></td>" +
            "</tr></table></div>";
}], { fontSize: 14, fixed: true });
