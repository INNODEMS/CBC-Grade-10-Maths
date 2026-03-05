    const board = JXG.JSXGraph.initBoard('jsxgraph-special-angles-30-60', {
        boundingbox: [-1, 5, 10, -2],
        axis: false,
        grid: false,
        keepaspectratio: true,
        showNavigation: false,
        showCopyright: false
    });

    // Slider Setup: 2 steps (30 and 60)
    const slider = board.create('slider', [[5, -1], [6, -1], [30, 30, 60]], {
        name: '&theta;',
        snapWidth: 30,
        strokeColor: '#2c3e50',
        fillColor: '#2c3e50'
    });

    const scale = 2; // Scaling factor for visibility
    const sqrt3 = Math.sqrt(3);

    // Point Definitions
    const R = board.create('point', [0, 0], { name: 'R', fixed: true, color: '#333',label: { offset: [-15, -2]} });

    // Q is the right-angle vertex
    const Q = board.create('point', [
        function() { 
            return slider.Value() === 30 ? sqrt3 * scale : 1 * scale; 
        }, 
        0
    ], { name: 'Q', visible: false });

    // P is the top vertex
    const P = board.create('point', [
        function() { return Q.X(); },
        function() { 
            return slider.Value() === 30 ? 1 * scale : sqrt3 * scale; 
        }
    ], { name: 'P', color: '#333' });

    // Triangle Sides
    const sideStyle = { strokeColor: '#2c3e50', strokeWidth: 3 };
    board.create('segment', [R, P], sideStyle); // Hypotenuse
    board.create('segment', [R, Q], sideStyle); // Base
    board.create('segment', [Q, P], sideStyle); // Height

    // Side Labels
    // Base Label
    board.create('text', [function() { return Q.X()/2; }, -0.4, 
        function() { return slider.Value() === 30 ? "&radic;3" : "1"; }
    ], { fontSize: 16, color: '#1f77b4', anchorX: 'middle' });

    // Height Label
    board.create('text', [function() { return Q.X() + 0.2; }, function() { return P.Y()/2; }, 
        function() { return slider.Value() === 30 ? "1" : "&radic;3"; }
    ], { fontSize: 16, color: '#d62728' });

    // Hypotenuse Label
    board.create('text', [function() { return Q.X()/2 - 0.3; }, function() { return P.Y()/2 + 0.2; }, 
        "2"
    ], { fontSize: 16, color: '#27ae60' });

    // 5. Angle Markers
    board.create('angle', [Q, R, P], { 
        radius: 0.8, 
        name: function() { return slider.Value() + "&deg;"; } 
    });


    // board.create('angle', [R, P, Q], { 
    //     radius: 0.8, 
    //     name: function() { return (90 - slider.Value()) + "&deg;"; } 
    // });

    board.create('angle', [P, R, Q], { visible: false }); // Helper for 90 deg
    board.create('angle', [R, Q, P], { type: 'square', radius: 0.4, name: '', withLabel: false });

    // Calculation Display
    board.create('text', [5, 2.5, function () {
        const theta = slider.Value();
        let sinVal, cosVal, tanVal;

        if (theta === 30) {
            sinVal = "1 / 2";
            cosVal = "&radic;3 / 2";
            tanVal = "1 / &radic;3";
        } else {
            sinVal = "&radic;3 / 2";
            cosVal = "1 / 2";
            tanVal = "&radic;3 / 1 = &radic;3";
        }

        return "<div style='background-color: #ffffff; padding: 15px; border: 2px solid #2c3e50; border-radius: 8px; width: 180px; font-family: sans-serif;'>" +
               "<b style='font-size:18px;'>Angle: " + theta + "&deg;</b><hr>" +
               "sin(" + theta + "&deg;) = " + sinVal + "<br><br>" +
               "cos(" + theta + "&deg;) = " + cosVal + "<br><br>" +
               "tan(" + theta + "&deg;) = " + tanVal + "</div>";
    }], { fontSize: 16, fixed: true });