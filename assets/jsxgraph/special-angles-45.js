const board = JXG.JSXGraph.initBoard('jsxgraph-special-angles-45-90', {
        boundingbox: [-1, 5, 8, -2],
        axis: false,
        grid: false,
        keepaspectratio: true,
        showNavigation: false,
        showCopyright: false
    });

    // Slider Setup: 3 steps (0, 45, 90)
    // Values: [min, max], [start, current, end]
    const slider = board.create('slider', [[3.5, -1], [5.5, -1], [0, 0, 90]], {
        name: '&theta;',
        snapWidth: 45,
        strokeColor: '#2c3e50',
        fillColor: '#2c3e50'
    });

    const degToRad = Math.PI / 180;
    const scale = 3; // 3 grid boxes = 1 unit for better visibility

    // Point Definitions based on Slider
    // R is the origin (Reference point)
    const R = board.create('point', [0, 0], { name: 'R', fixed: true, color: '#333' });

    // Q is the right-angle vertex
    const Q = board.create('point', [
        function() { 
            let angle = slider.Value();
            if (angle === 90) return 0;
            return scale; 
        }, 
        0
    ], { name: 'Q', visible: false });

    // P is the top vertex
    const P = board.create('point', [
        function() { return Q.X(); },
        function() { 
            let angle = slider.Value();
            if (angle === 0) return 0;
            return scale; 
        }
    ], { name: 'P', color: '#333' });

    // Triangle Sides
    const sideStyle = { strokeColor: '#2c3e50', strokeWidth: 3 };
    const hypotenuse = board.create('segment', [R, P], sideStyle);
    const base = board.create('segment', [R, Q], sideStyle);
    const height = board.create('segment', [Q, P], sideStyle);

    // Dynamic Labels (Shown specifically for the 45 degree state)
    board.create('text', [function() { return Q.X()/2; }, -0.4, 
        function() { return slider.Value() === 45 ? "1 unit" : ""; }
    ], { fontSize: 14, color: 'blue' });

    board.create('text', [function() { return Q.X() + 0.2; }, function() { return P.Y()/2; }, 
        function() { return slider.Value() === 45 ? "1 unit" : ""; }
    ], { fontSize: 14, color: 'red' });

    board.create('text', [function() { return Q.X()/2 - 0.5; }, function() { return P.Y()/2 + 0.5; }, 
        function() { return slider.Value() === 45 ? "&radic;2" : ""; }
    ], { fontSize: 14, color: 'green' });

    // Angle Markers
    board.create('angle', [Q, R, P], { 
        radius: 0.8, 
        name: function() { return slider.Value() + "&deg;"; } 
    });
    
    // Right angle at Q
    board.create('angle', [R, Q, P], { 
        type: 'square', 
        radius: 0.3, 
        visible: function() { return slider.Value() === 45; } 
    });

    // Calculation Display Panel
    board.create('text', [3.5, 3.5, function () {
        const theta = slider.Value();
        let sinCalc, cosCalc, tanCalc;

        if (theta === 0) {
            sinCalc = "0 / 1 = 0";
            cosCalc = "1 / 1 = 1";
            tanCalc = "0 / 1 = 0";
        } else if (theta === 45) {
            sinCalc = "1 / &radic;2";
            cosCalc = "1 / &radic;2";
            tanCalc = "1 / 1 = 1";
        } else if (theta === 90) {
            sinCalc = "1 / 1 = 1";
            cosCalc = "0 / 1 = 0";
            tanCalc = "1 / 0 = Undefined";
        }

        return "<div style='background-color: #f9f9f9; padding: 15px; border: 2px solid #2c3e50; border-radius: 8px; width: 200px;'>" +
               "<b style='font-size:18px;'>Angle: " + theta + "&deg;</b><hr>" +
               "sin(" + theta + "&deg;) = " + sinCalc + "<br><br>" +
               "cos(" + theta + "&deg;) = " + cosCalc + "<br><br>" +
               "tan(" + theta + "&deg;) = " + tanCalc + "</div>";
    }], { fontSize: 16, fixed: true });