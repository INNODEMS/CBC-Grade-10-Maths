
// --- BOARD 1: SLIDER ---
var b1 = JXG.JSXGraph.initBoard('jxgbox-slider', {
    boundingbox: [0, 2, 8, -2],
    axis: false, showNavigation: false, showCopyright: false,
    pan: {enabled: false}, zoom: {enabled: false}
});

var alphaSlider = b1.create('slider', [[1, 0], [6, 0], [0, 52.7, 90]], {
    name: '&alpha;',
    suffixLabel: '&deg;',
    snapWidth: 0.1,
    strokeColor: '#333',
    fillColor: '#333'
});

// --- BOARD 2: CALCULATIONS ---
var b2 = JXG.JSXGraph.initBoard('jxgbox-calc', {
    boundingbox: [0, 10, 12, 0],
    axis: false, showNavigation: false, showCopyright: false
});

var textStyle = { fontSize: 16, fixed: true, fontFamily: 'serif' };

b2.create('text', [1, 8, function() {
    var a = alphaSlider.Value();
    var val = Math.sin(a * Math.PI / 180);
    return "sin(&alpha;) = sin(" + a.toFixed(1) + "°) = <b>" + val.toFixed(4) + "</b>";
}], textStyle);

b2.create('text', [1, 6, function() {
    var a = alphaSlider.Value();
    var val = Math.cos(a * Math.PI / 180);
    return "cos(&alpha;) = cos(" + a.toFixed(1) + "°) = <b>" + val.toFixed(4) + "</b>";
}], textStyle);

b2.create('text', [1, 4, function() {
    var a = alphaSlider.Value();
    if (a >= 89.9) return "tan(&alpha;) = tan(90°) = <b style='color:red;'>Math Error</b>";
    var val = Math.tan(a * Math.PI / 180);
    return "tan(&alpha;) = tan(" + a.toFixed(1) + "°) = <b>" + val.toFixed(4) + "</b>";
}], textStyle);

// --- BOARD 3: TRIANGLE ---
var b3 = JXG.JSXGraph.initBoard('jxgbox-triangle', {
    boundingbox: [-1, 11, 11, -2], 
    axis: false, showNavigation: false, showCopyright: false
});

var hypLength = 9;
var origin = b3.create('point', [0, 0], { visible: false, fixed: true });

var B = b3.create('point', [
    function() { return hypLength * Math.cos(alphaSlider.Value() * Math.PI / 180); },
    0
], { visible: false });

var C = b3.create('point', [
    function() { return B.X(); },
    function() { return hypLength * Math.sin(alphaSlider.Value() * Math.PI / 180); }
], { size: 3, color: '#333', name: '', withLabel: false });

var sideStyle = { strokeColor: '#2c3e50', strokeWidth: 3 };

// Side c: Hypotenuse
b3.create('segment', [origin, C], { 
    ...sideStyle, 
    name: function() { return "c = " + hypLength.toFixed(2); }, 
    withLabel: true, 
    label: { position: 'top', offset: [-40, 30], fontSize: 14 } 
});

// Side b: Base
b3.create('segment', [origin, B], { 
    ...sideStyle, 
    name: function() { return "b = " + B.X().toFixed(2); }, 
    withLabel: true, 
    label: { position: 'bottom', offset: [0, -20], fontSize: 14 } 
});

// Side a: Opposite
b3.create('segment', [B, C], { 
    ...sideStyle, 
    name: function() { return "a = " + C.Y().toFixed(2); }, 
    withLabel: true, 
    label: { position: 'right', offset: [15, 0], fontSize: 14 } 
});

// 90 degree sign - set with no name to remove the stray alpha
b3.create('angle', [origin, B, C], { 
    type: 'square', 
    radius: 0.7, 
    strokeColor: '#333', 
    name: '' 
});

// Alpha arc - only one labeled alpha at the origin
b3.create('angle', [B, origin, C], { 
    radius: 1.5, 
    name: '&alpha;', 
    label: { fontSize: 16, color: '#2c3e50', offset: [5, 5] } 
});

b1.addChild(b2);
b1.addChild(b3);


