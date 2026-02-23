/* reflect-polygon-multi.js
   Students drag individual vertices of an asymmetric polygon.
   The reflection across a labeled vertical mirror line is shown dynamically.

   Vertices may cross the mirror line freely.
*/

/* global JXG */
(function () {
  'use strict';

  const BOARD_ID = 'jsxgraph-reflect-polygon-multi';
  const BB = [-5, 5, 5, -5];
  const MIRROR_X = 0;

  const STYLE_ORIGINAL = {
    fillColor: '#2b6cb0',
    fillOpacity: 0.25,
    strokeColor: '#2b6cb0',
    strokeWidth: 3
  };

  const STYLE_REFLECTION = {
    fillColor: '#30c54e',
    fillOpacity: 0.18,
    strokeColor: '#30c54e',
    strokeWidth: 3,
    dash: 1
  };

  function reflectX(x) {
    return 2 * MIRROR_X - x;
  }

  const board = JXG.JSXGraph.initBoard(BOARD_ID, {
    boundingbox: BB,
    axis: false,
    grid: false,
    keepAspectRatio: true,
    showNavigation: false,
    showCopyright: false,
    pan: { enabled: false },
    zoom: { enabled: false }
  });

  board.renderer.container.style.backgroundColor = '#fbfbfb';

  // --- Mirror Line x = 0 ---
  // Title for the interactive
  board.create('text', [
    function () { return (BB[0] + BB[2]) / 2; },
    function () { return BB[1] - 0.3; },
    "Move around the blue triangle to see its reflection"
  ], {
    fixed: true,
    anchorX: 'middle',
    anchorY: 'top',
    fontSize: 16
  });
  // leave some space at the top so the mirror line doesn't touch the title
  const MIRROR_TOP_OFFSET = 0.8;
  const topPoint = board.create('point', [MIRROR_X, BB[1] - MIRROR_TOP_OFFSET], { visible: false, fixed: true });
  const botPoint = board.create('point', [MIRROR_X, BB[3]], { visible: false, fixed: true });

  board.create('line', [topPoint, botPoint], {
    straightFirst: false,
    straightLast: false,
    strokeColor: '#222',
    strokeWidth: 2,
    dash: 2,
    fixed: true,
    name: 'x = 0',
    withLabel: true,
    label: {
      position: 'rt',
      offset: [10, -10]
    }
  });

  // --- Asymmetric starting polygon ---
  const originalVertices = [
    board.create('point', [-2, 3.1], { name: 'A', size: 4 }),
    board.create('point', [-4.1,  0], { name: 'B', size: 4 }),
    board.create('point', [-0.9,  -2.1], { name: 'C', size: 4 })
  ];

  board.create('polygon', originalVertices, STYLE_ORIGINAL);

  // --- Reflected vertices (dynamic) ---
  const reflectedVertices = originalVertices.map(function (pt, i) {
    const labelNames = ["A'", "B'", "C'", "D'", "E'", "F'", "G'", "H'", "I'", "J'"];
    return board.create('point', [
      function () { return reflectX(pt.X()); },
      function () { return pt.Y(); }
    ], {
      name: labelNames[i] || (String.fromCharCode(65 + i) + "'"),
      size: 4,
      visible: true,
      fixed: true,
      withLabel: true,
      label: {
        position: 'rt',
        offset: [10, -10]
      }
    });
  });

  board.create('polygon', reflectedVertices, STYLE_REFLECTION);

})();