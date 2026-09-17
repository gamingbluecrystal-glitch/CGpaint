/**
 * Paint Studio - State Module
 * Defines the shared namespace, Minecraft color palette, and application state.
 */
window.PaintStudio = window.PaintStudio || {};

(function (PS) {
  // --- Minecraft 16 Colors (Canonical Dye / Wool Palette) ---
  PS.MC_COLORS = [
    { name: 'White', hex: '#F9FFFE', rgb: [249, 255, 254, 255] },
    { name: 'Light Gray', hex: '#9D9D97', rgb: [157, 157, 151, 255] },
    { name: 'Gray', hex: '#474F52', rgb: [71, 79, 82, 255] },
    { name: 'Black', hex: '#1D1D21', rgb: [29, 29, 33, 255] },
    { name: 'Brown', hex: '#835432', rgb: [131, 84, 50, 255] },
    { name: 'Red', hex: '#B02E26', rgb: [176, 46, 38, 255] },
    { name: 'Orange', hex: '#F9801D', rgb: [249, 128, 29, 255] },
    { name: 'Yellow', hex: '#FED83D', rgb: [254, 216, 61, 255] },
    { name: 'Lime', hex: '#80C71F', rgb: [128, 199, 31, 255] },
    { name: 'Green', hex: '#5E7C16', rgb: [94, 124, 22, 255] },
    { name: 'Cyan', hex: '#169C9C', rgb: [22, 156, 156, 255] },
    { name: 'Light Blue', hex: '#3AB3DA', rgb: [58, 179, 218, 255] },
    { name: 'Blue', hex: '#3C44AA', rgb: [60, 68, 170, 255] },
    { name: 'Purple', hex: '#8932B8', rgb: [137, 50, 184, 255] },
    { name: 'Magenta', hex: '#C74EBD', rgb: [199, 78, 189, 255] },
    { name: 'Pink', hex: '#F38BAA', rgb: [243, 139, 170, 255] }
  ];

  // --- State Variables ---
  PS.state = {
    canvasWidth: 32,
    canvasHeight: 32,
    displayScale: 15,
    isStepMode: true, // Enabled for 16x16 and 32x32

    currentTool: 'pencil', // 'pencil', 'eraser', 'line', 'circle', 'polygon', 'fill'
    brushSize: 1,

    lineAlgorithm: 'dda', // 'dda', 'bresenham'
    circleAlgorithm: 'midpoint', // 'midpoint', 'bresenham'
    showDecisionParams: true,
    lastCircle: null,
    lastStrokeColor: PS.MC_COLORS[3].rgb, // Default Black

    polygonType: '3', // '3'..'8', or 'other'
    customPolygonN: 9,
    lastPolygonVertices: null,

    fillAlgorithm: 'boundary', // 'boundary', 'flood', 'scanline'
    fillConnectivity: 4, // 4 or 8 connected
    boundaryColorMode: 'auto', // 'auto', 'primary', 'secondary', 'black'
    lastSeedPoint: null, // { x, y }

    primaryColor: PS.MC_COLORS[3], // Black
    secondaryColor: PS.MC_COLORS[0], // White

    isDrawing: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,

    undoStack: [],
    redoStack: [],

    // Step-by-Step Visualization Data
    recordedSteps: [],
    currentStepIndex: 0,
    baseCanvasSnapshot: null, // Snapshot before algorithm ran
    isPlaying: false,
    playIntervalId: null,
    stepSpeedMs: 150
  };

  // Shared DOM element cache (populated by modules on DOMContentLoaded)
  PS.dom = {};

})(window.PaintStudio);
