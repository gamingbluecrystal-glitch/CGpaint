/**
 * Paint Studio - Drawing Module
 * Mouse event handlers, drawing drag preview, shape finalization,
 * boundary color detection, and fill execution.
 */
document.addEventListener('DOMContentLoaded', () => {
  const PS = window.PaintStudio;
  const state = PS.state;

  const canvas = PS.dom.canvas;
  const ctx = PS.dom.ctx;

  const lblCursorCoord = document.getElementById('lblCursorCoord');
  const lblStartCoord = document.getElementById('lblStartCoord');
  const lblDeltaCoord = document.getElementById('lblDeltaCoord');
  const lblDistCoord = document.getElementById('lblDistCoord');
  const statusCoord = document.getElementById('statusCoord');
  const stepInfoBox = document.getElementById('stepInfoBox');
  const badgeAlgoName = document.getElementById('badgeAlgoName');

  let tempCanvasSnapshot = null;

  // --- Mouse & Drawing Event Handlers ---
  canvas.addEventListener('mousemove', (e) => {
    const coords = PS.getCanvasCoords(e);

    // Live Coordinate Inspector Update
    lblCursorCoord.textContent = `${coords.x}, ${coords.y}`;
    statusCoord.textContent = `${coords.x}, ${coords.y} px`;

    if (state.isDrawing) {
      const dx = coords.x - state.startX;
      const dy = coords.y - state.startY;
      const dist = Math.round(Math.sqrt(dx * dx + dy * dy));

      lblDeltaCoord.textContent = `${dx}, ${dy}`;
      lblDistCoord.textContent = `${dist} px`;

      // Live drag rendering
      handleDrawingDrag(coords);
    }
  });

  canvas.addEventListener('mouseleave', () => {
    lblCursorCoord.textContent = '-- , --';
    statusCoord.textContent = '-- , -- px';
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 && e.button !== 2) return;
    e.preventDefault();

    // If previous visualizer was active, finalize it so canvas has the full completed shape
    if (state.recordedSteps && state.recordedSteps.length > 0) {
      if (state.isPlaying && PS.stopPlayback) {
        PS.stopPlayback();
      }
      if (state.currentStepIndex < state.recordedSteps.length - 1 && PS.goToStep) {
        PS.goToStep(state.recordedSteps.length - 1);
        PS.saveState();
      }
    }

    const coords = PS.getCanvasCoords(e);
    const color = (e.button === 2) ? state.secondaryColor.rgb : state.primaryColor.rgb;

    state.isDrawing = true;
    state.startX = coords.x;
    state.startY = coords.y;
    state.lastX = coords.x;
    state.lastY = coords.y;

    // Update Coordinate Inspector Start Point
    lblStartCoord.textContent = `${coords.x}, ${coords.y}`;
    lblDeltaCoord.textContent = `0, 0`;
    lblDistCoord.textContent = `0 px`;

    // Save snapshot for drag preview
    tempCanvasSnapshot = ctx.getImageData(0, 0, state.canvasWidth, state.canvasHeight);

    if (state.currentTool === 'pencil' || state.currentTool === 'eraser') {
      state.lastPolygonVertices = null;
      state.lastCircle = null;
      const drawCol = (state.currentTool === 'eraser') ? state.secondaryColor.rgb : color;
      PS.setPixel(coords.x, coords.y, drawCol, state.brushSize);
    } else if (state.currentTool === 'fill') {
      state.isDrawing = false;
      executeFill(coords.x, coords.y, color);
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (!state.isDrawing) return;
    state.isDrawing = false;

    // CRITICAL: restore clean base canvas before dragging preview occurred
    if (tempCanvasSnapshot) {
      ctx.putImageData(tempCanvasSnapshot, 0, 0);
      state.baseCanvasSnapshot = tempCanvasSnapshot;
      tempCanvasSnapshot = null;
    } else {
      state.baseCanvasSnapshot = ctx.getImageData(0, 0, state.canvasWidth, state.canvasHeight);
    }

    const coords = PS.getCanvasCoords(e);
    const color = (e.button === 2) ? state.secondaryColor.rgb : state.primaryColor.rgb;

    // Finalize shape
    finalizeShape(coords, color);
  });

  // Handle Dragging Preview
  function handleDrawingDrag(coords) {
    const color = state.primaryColor.rgb;

    if (state.currentTool === 'pencil' || state.currentTool === 'eraser') {
      const drawCol = (state.currentTool === 'eraser') ? state.secondaryColor.rgb : color;
      // Connect last point and current point with Bresenham line for smooth stroke
      const linePts = CGAlgorithms.bresenhamLine(state.lastX, state.lastY, coords.x, coords.y);
      linePts.forEach(pt => PS.setPixel(pt.x, pt.y, drawCol, state.brushSize));
      state.lastX = coords.x;
      state.lastY = coords.y;
    } else if (state.currentTool === 'line' || state.currentTool === 'circle' || state.currentTool === 'polygon') {
      // Restore clean base canvas during drag
      if (tempCanvasSnapshot) {
        ctx.putImageData(tempCanvasSnapshot, 0, 0);
      }

      if (state.currentTool === 'line') {
        const linePts = PS.getLinePoints(state.startX, state.startY, coords.x, coords.y);
        linePts.forEach(pt => PS.setPixel(pt.x, pt.y, color, state.brushSize));
      } else if (state.currentTool === 'circle') {
        const dx = coords.x - state.startX;
        const dy = coords.y - state.startY;
        const radius = Math.round(Math.sqrt(dx * dx + dy * dy));
        const circlePts = PS.getCirclePoints(state.startX, state.startY, radius);
        circlePts.forEach(pt => PS.setPixel(pt.x, pt.y, color, state.brushSize));
      } else if (state.currentTool === 'polygon') {
        renderPolygonPreview(coords, color);
      }
    }
  }

  function renderPolygonPreview(coords, color) {
    const pType = state.polygonType;
    const sides = (pType === 'other') ? state.customPolygonN : parseInt(pType);
    const dx = coords.x - state.startX;
    const dy = coords.y - state.startY;
    const radius = Math.max(1, Math.round(Math.sqrt(dx * dx + dy * dy)));
    const startAngle = Math.atan2(dy, dx);

    const poly = CGAlgorithms.generatePolygon(state.startX, state.startY, radius, sides, startAngle);
    poly.points.forEach(pt => PS.setPixel(pt.x, pt.y, color, state.brushSize));
  }

  function finalizeShape(coords, color) {
    state.lastStrokeColor = color;
    const shouldRecord = state.isStepMode;

    if (state.currentTool === 'line') {
      state.lastCircle = null;
      state.lastPolygonVertices = null;

      let result;
      if (state.lineAlgorithm === 'dda') {
        result = CGAlgorithms.ddaLineDetailed(state.startX, state.startY, coords.x, coords.y, color, shouldRecord);
        badgeAlgoName.textContent = 'DDA Line';
      } else {
        result = CGAlgorithms.bresenhamLineDetailed(state.startX, state.startY, coords.x, coords.y, color, shouldRecord);
        badgeAlgoName.textContent = "Bresenham's Line";
      }

      if (shouldRecord && result.steps && result.steps.length > 0) {
        PS.setupIterationVisualizer(result.steps);
      } else {
        result.points.forEach(pt => PS.setPixel(pt.x, pt.y, color, state.brushSize));
        stepInfoBox.textContent = `Drawn line from (${state.startX}, ${state.startY}) to (${coords.x}, ${coords.y}) [${result.points.length} px].`;
        PS.saveState();
      }
    } else if (state.currentTool === 'circle') {
      const dx = coords.x - state.startX;
      const dy = coords.y - state.startY;
      const radius = Math.round(Math.sqrt(dx * dx + dy * dy));

      state.lastCircle = { xc: state.startX, yc: state.startY, r: radius, color: color };
      state.lastPolygonVertices = null;

      let result;
      if (state.circleAlgorithm === 'bresenham') {
        result = CGAlgorithms.bresenhamCircleDetailed(state.startX, state.startY, radius, color, shouldRecord);
        badgeAlgoName.textContent = "Bresenham's Circle";
      } else {
        result = CGAlgorithms.midpointCircleDetailed(state.startX, state.startY, radius, color, shouldRecord);
        badgeAlgoName.textContent = 'Midpoint Circle';
      }

      if (shouldRecord && result.steps && result.steps.length > 0) {
        PS.setupIterationVisualizer(result.steps);
      } else {
        result.points.forEach(pt => PS.setPixel(pt.x, pt.y, color, state.brushSize));
        stepInfoBox.textContent = `Drawn circle at (${state.startX}, ${state.startY}) with radius r=${radius} [${result.points.length} px].`;
        PS.saveState();
      }
    } else if (state.currentTool === 'polygon') {
      state.lastCircle = null;
      const pType = state.polygonType;
      const sides = (pType === 'other') ? state.customPolygonN : parseInt(pType);
      const dx = coords.x - state.startX;
      const dy = coords.y - state.startY;
      const radius = Math.max(1, Math.round(Math.sqrt(dx * dx + dy * dy)));
      const startAngle = Math.atan2(dy, dx);

      const poly = CGAlgorithms.generatePolygon(state.startX, state.startY, radius, sides, startAngle);
      poly.points.forEach(pt => PS.setPixel(pt.x, pt.y, color, state.brushSize));
      state.lastPolygonVertices = poly.vertices;
      stepInfoBox.textContent = `Drawn regular ${sides}-gon at (${state.startX}, ${state.startY}) with radius r=${radius}.`;
      PS.saveState();
    }
  }

  // Auto-detect boundary color surrounding seed point (x, y)
  function detectBoundaryColor(pixelData, width, height, startX, startY) {
    const getPixel = (x, y) => {
      const idx = (y * width + x) * 4;
      return [pixelData[idx], pixelData[idx + 1], pixelData[idx + 2], pixelData[idx + 3]];
    };
    const seedColor = getPixel(startX, startY);

    // Search outward in 8 directions to find the enclosing border color
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [-1, -1], [1, -1], [-1, 1]
    ];
    for (const [dx, dy] of directions) {
      let cx = startX + dx;
      let cy = startY + dy;
      while (cx >= 0 && cx < width && cy >= 0 && cy < height) {
        const c = getPixel(cx, cy);
        if (!CGAlgorithms.colorsMatch(c, seedColor, 12)) {
          return c; // Found boundary pixel color
        }
        cx += dx;
        cy += dy;
      }
    }
    return state.lastStrokeColor || [29, 29, 33, 255];
  }

  // --- Fill Execution & Step-by-Step Visualization ---
  function executeFill(startX, startY, fillColor) {
    PS.saveState();

    // Snapshot base state before fill algorithm runs
    state.baseCanvasSnapshot = ctx.getImageData(0, 0, state.canvasWidth, state.canvasHeight);

    const imgData = ctx.getImageData(0, 0, state.canvasWidth, state.canvasHeight);
    const pixelData = imgData.data;

    let result = null;
    const shouldRecordSteps = state.isStepMode; // Record iterations on 16x16 and 32x32
    state.lastSeedPoint = { x: startX, y: startY };

    if (state.fillAlgorithm === 'boundary') {
      badgeAlgoName.textContent = `Boundary Fill (${state.fillConnectivity}-conn)`;
      let boundaryColor;
      if (state.boundaryColorMode === 'primary') {
        boundaryColor = state.primaryColor.rgb;
      } else if (state.boundaryColorMode === 'secondary') {
        boundaryColor = state.secondaryColor.rgb;
      } else if (state.boundaryColorMode === 'black') {
        boundaryColor = [29, 29, 33, 255];
      } else {
        // Auto-detect boundary from enclosing stroke
        boundaryColor = detectBoundaryColor(pixelData, state.canvasWidth, state.canvasHeight, startX, startY);
      }

      result = CGAlgorithms.boundaryFill(
        pixelData, state.canvasWidth, state.canvasHeight,
        startX, startY, fillColor, boundaryColor, shouldRecordSteps, state.fillConnectivity
      );
    } else if (state.fillAlgorithm === 'flood') {
      badgeAlgoName.textContent = `Flood Fill (${state.fillConnectivity}-conn)`;
      result = CGAlgorithms.floodFill(
        pixelData, state.canvasWidth, state.canvasHeight,
        startX, startY, fillColor, shouldRecordSteps, state.fillConnectivity
      );
    } else if (state.fillAlgorithm === 'scanline') {
      badgeAlgoName.textContent = 'Scanline Fill';
      let vertices = state.lastPolygonVertices;
      const isInsidePoly = vertices && vertices.length >= 3 && CGAlgorithms.isPointInPolygon(startX, startY, vertices);
      const isInsideCircle = state.lastCircle && (
        Math.hypot(startX - state.lastCircle.xc, startY - state.lastCircle.yc) <= state.lastCircle.r + 1.2
      );

      if (isInsidePoly) {
        // Scanline Polygon Fill (Edge Table & Active Edge Table)
        result = CGAlgorithms.scanlinePolygonFill(
          pixelData, state.canvasWidth, state.canvasHeight,
          vertices, fillColor, shouldRecordSteps
        );
        state.lastPolygonVertices = null;
      } else if (isInsideCircle) {
        // Scanline Circle Fill
        result = CGAlgorithms.scanlineCircleFill(
          pixelData, state.canvasWidth, state.canvasHeight,
          state.lastCircle.xc, state.lastCircle.yc, state.lastCircle.r,
          fillColor, shouldRecordSteps
        );
        state.lastCircle = null;
      } else {
        // Scanline Raster Seed / Span Fill for arbitrary enclosed areas
        result = CGAlgorithms.scanlineFloodFill(
          pixelData, state.canvasWidth, state.canvasHeight,
          startX, startY, fillColor, shouldRecordSteps
        );
      }
    }

    if (!result) return;

    if (result.blocked) {
      stepInfoBox.innerHTML = `<span style="color:#b22222; font-weight:bold;">Seed point (${startX}, ${startY}) cannot be filled: Already matches boundary or target color.</span>`;
      return;
    }

    // If 16x16 or 32x32: Initialize Step Visualizer & Vertical Slider (progressive plotting)
    if (shouldRecordSteps && result.steps && result.steps.length > 0) {
      PS.setupIterationVisualizer(result.steps);
    } else {
      // Normal mode: Apply all modified pixels to canvas immediately
      ctx.putImageData(imgData, 0, 0);
      const connStr = (state.fillAlgorithm === 'boundary' || state.fillAlgorithm === 'flood') ? ` (${state.fillConnectivity}-conn)` : '';
      stepInfoBox.textContent = `Completed ${state.fillAlgorithm.toUpperCase()}${connStr} algorithm from seed (${startX}, ${startY}). Modified ${result.modifiedCount} pixels.`;
      PS.saveState();
    }
  }
});
