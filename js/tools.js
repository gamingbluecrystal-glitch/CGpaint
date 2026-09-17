/**
 * Paint Studio - Tools Module
 * Tool switching, circle algorithm delegation, and polygon help text.
 */
document.addEventListener('DOMContentLoaded', () => {
  const PS = window.PaintStudio;
  const state = PS.state;

  const toolButtons = {
    pencil: document.getElementById('toolPencil'),
    eraser: document.getElementById('toolEraser'),
    line: document.getElementById('toolLine'),
    circle: document.getElementById('toolCircle'),
    polygon: document.getElementById('toolPolygon'),
    fill: document.getElementById('toolFill')
  };
  PS.dom.toolButtons = toolButtons;

  const optionsTitle = document.getElementById('optionsTitle');
  const brushSizeOptions = document.getElementById('brushSizeOptions');
  const lineOptions = document.getElementById('lineOptions');
  const circleOptions = document.getElementById('circleOptions');
  const polygonOptions = document.getElementById('polygonOptions');
  const fillOptions = document.getElementById('fillOptions');
  const fillConnectivityRow = document.getElementById('fillConnectivityRow');
  const boundaryFillColorRow = document.getElementById('boundaryFillColorRow');
  const statusHelpText = document.getElementById('statusHelpText');

  // --- Tool Switching ---
  PS.selectTool = function (toolName) {
    state.currentTool = toolName;
    Object.keys(toolButtons).forEach(t => {
      if (toolButtons[t]) {
        toolButtons[t].classList.toggle('active', t === toolName);
      }
    });

    // Update options panel
    brushSizeOptions.style.display = 'none';
    if (lineOptions) lineOptions.style.display = 'none';
    circleOptions.style.display = 'none';
    polygonOptions.style.display = 'none';
    fillOptions.style.display = 'none';

    if (toolName === 'pencil' || toolName === 'eraser') {
      optionsTitle.textContent = toolName === 'pencil' ? 'Pencil' : 'Eraser';
      brushSizeOptions.style.display = 'flex';
      statusHelpText.textContent = `${toolName === 'pencil' ? 'Pencil' : 'Eraser'}: Drag mouse on canvas to draw freehand.`;
    } else if (toolName === 'line') {
      const algoLabel = state.lineAlgorithm === 'dda' ? 'DDA' : "Bresenham's";
      optionsTitle.textContent = `Line (${algoLabel})`;
      brushSizeOptions.style.display = 'flex';
      if (lineOptions) lineOptions.style.display = 'flex';
      statusHelpText.textContent = `Line Tool: Click and drag to draw straight line using ${algoLabel} Algorithm.`;
    } else if (toolName === 'circle') {
      const algoLabel = state.circleAlgorithm === 'bresenham' ? "Bresenham's" : 'Midpoint';
      optionsTitle.textContent = `Circle (${algoLabel})`;
      brushSizeOptions.style.display = 'flex';
      circleOptions.style.display = 'flex';
      statusHelpText.textContent = `Circle: Click and drag to draw circle using ${algoLabel} Algorithm.`;
    } else if (toolName === 'polygon') {
      optionsTitle.textContent = 'Polygon Tool';
      polygonOptions.style.display = 'flex';
      PS.updatePolygonHelpText();
    } else if (toolName === 'fill') {
      optionsTitle.textContent = 'Fill Algorithm';
      fillOptions.style.display = 'flex';
      if (fillConnectivityRow) {
        fillConnectivityRow.style.display = (state.fillAlgorithm === 'boundary' || state.fillAlgorithm === 'flood') ? 'flex' : 'none';
      }
      if (boundaryFillColorRow) {
        boundaryFillColorRow.style.display = state.fillAlgorithm === 'boundary' ? 'flex' : 'none';
      }
      const connStr = (state.fillAlgorithm === 'boundary' || state.fillAlgorithm === 'flood') ? ` (${state.fillConnectivity}-conn)` : '';
      statusHelpText.textContent = `Fill Tool: Click seed point to execute ${state.fillAlgorithm.toUpperCase()}${connStr} algorithm.`;
    }
  };

  PS.getCirclePoints = function (xc, yc, r) {
    if (state.circleAlgorithm === 'bresenham') {
      return CGAlgorithms.bresenhamCircle(xc, yc, r);
    }
    return CGAlgorithms.midpointCircle(xc, yc, r);
  };

  PS.getLinePoints = function (x0, y0, x1, y1) {
    if (state.lineAlgorithm === 'dda') {
      return CGAlgorithms.ddaLine(x0, y0, x1, y1);
    }
    return CGAlgorithms.bresenhamLine(x0, y0, x1, y1);
  };

  PS.updatePolygonHelpText = function () {
    const pType = state.polygonType;
    if (pType === 'other') statusHelpText.textContent = `Polygon: Drag to draw regular ${state.customPolygonN}-sided polygon.`;
    else statusHelpText.textContent = `Polygon: Drag to draw regular ${pType}-sided polygon.`;
  };
});
