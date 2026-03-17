// ---------- 1. THE BOARD ----------
const board = JXG.JSXGraph.initBoard('jxgbox', {
    boundingbox: [-12, 18, 18, -15],
    axis: false,
    showNavigation: false,
    showCopyright: false,
    keepaspectratio: true
});

// ---------- 2. PARAMETERS ----------
const SLIDER_STEP = 0.1;

// ---------- 3. SLIDERS ----------
const sr1 = board.create('slider', [[-10, 15], [-2, 15], [1, 5, 15]], { name: 'r₁', withLabel: false, snapWidth: SLIDER_STEP });
const sr2 = board.create('slider', [[2, 15], [10, 15], [1, 5, 15]], { name: 'r₂', withLabel: false, snapWidth: SLIDER_STEP });
const sd = board.create('slider', [[-4, 13], [4, 13], [1, 15, 20]], { name: 'd', withLabel: false, snapWidth: SLIDER_STEP });

// ---------- 4. SLIDER LABELS ----------
board.create('text', [-10, 16, 'Radius 1 (r₁)'], { fontWeight: 'bold' });
board.create('text', [-1.5, 15, () => sr1.Value().toFixed(1)]);
board.create('text', [2, 16, 'Radius 2 (r₂)'], { fontWeight: 'bold' });
board.create('text', [10.5, 15, () => sr2.Value().toFixed(1)]);
board.create('text', [-4, 14, 'Distance (P₁P₂)'], { fontWeight: 'bold' });
board.create('text', [4.5, 13, () => sd.Value().toFixed(1)]);

// ---------- 5. GEOMETRY ----------
const p1 = board.create('point', [0, 0], { name: 'P₁', fixed: true, size: 3, color: 'black' });
const p2 = board.create('point', [() => sd.Value(), 0], { name: 'P₂', size: 3, color: 'black' });

const c1 = board.create('circle', [p1, () => sr1.Value()], { strokeColor: '#2c3e50', dash: 2, strokeWidth: 1 });
const c2 = board.create('circle', [p2, () => sr2.Value()], { strokeColor: '#2c3e50', dash: 2, strokeWidth: 1 });

// ---------- 6. INTERSECTION ----------
// FIX 1: Explicitly create point 0 (P) and point 1 (Q) so they are defined
const i1 = board.create('intersection', [c1, c2, 0], { name: 'P', size: 3, color: 'black' });
const i2 = board.create('intersection', [c1, c2, 1], { name: 'Q', size: 3, color: 'black' });

board.create('curveintersection', [c1, c2], {
    fillColor: 'cyan', fillOpacity: 0.5, strokeColor: 'darkcyan', strokeWidth: 2, hasInnerPoints: true
});

board.create('segment', [p1, p2], { strokeColor: '#999', dash: 1 });

// Use the explicitly defined points here
board.create('segment', [i1, i2], { strokeColor: 'black', strokeWidth: 2 });

// ---------- 7. ANGLES ----------
const angleTheta = board.create('angle', [i2, p1, i1], { name: 'θ', radius: 2, fillColor: 'yellow', fillOpacity: 0.3 });
const angleAlpha = board.create('angle', [i1, p2, i2], { name: 'α', radius: 2, fillColor: 'orange', fillOpacity: 0.3 });

// ---------- 8. STATUS TEXT ----------
board.create('text', [-11, -11, function () {
    const r1 = sr1.Value();
    const r2 = sr2.Value();
    const d = sd.Value();

    if (d > r1 + r2) return "<b style='color:red'>No intersection: circles are separate.</b>";
    if (d < Math.abs(r1 - r2)) return "<b style='color:red'>One circle is inside the other (no lens).</b>";
    return "<b style='color:green'>Circles intersect → a common (lens) region is formed.</b>";
}], { fixed: true });

// ---------- 9. CALCULATION PANEL ----------
// FIX 2: Anchor moved from [1, 1] to [-11, -12] to sit below the geometry cleanly
// [-11, -9
board.create('text', [11, -9, function () {
    const r1 = sr1.Value();
    const r2 = sr2.Value();
    const d = sd.Value();

    if (d >= r1 + r2 || d <= Math.abs(r1 - r2)) {
        return "<div style='background:#fff;padding:10px;border:2px solid red;border-radius:6px;'>No shared region</div>";
    }

    const radTheta = angleTheta.Value();
    const radAlpha = angleAlpha.Value();

    const areaSeg1 = 0.5 * r1 * r1 * (radTheta - Math.sin(radTheta));
    const areaSeg2 = 0.5 * r2 * r2 * (radAlpha - Math.sin(radAlpha));
    const total = (areaSeg1 + areaSeg2).toFixed(2);

    // FIX 3: Removed the invalid '// background:white;' CSS comment
    return `
    <div style="
        background:white; 
        padding:12px;
        border:2px solid #00acc1;
        border-radius:8px;
        width:260px;
        font-family:sans-serif;
    ">
        <b style="color:#008b8b;">Shared Area (Lens)</b><br><br>

        θ ≈ ${(radTheta * 180 / Math.PI).toFixed(1)}°<br>
        α ≈ ${(radAlpha * 180 / Math.PI).toFixed(1)}°<br><br>

        <div style="background:#e0ffff;padding:6px;border-radius:4px;">
            <b>Total ≈ ${total} units²</b>
        </div>
    </div>
    `;
}], {
    fixed: true,
    display: 'html'
});