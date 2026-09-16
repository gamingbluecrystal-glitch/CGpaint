/**
 * Paint Studio - UI Events Module
 * All UI event listeners: tool buttons, brush size, polygon/circle/fill dropdowns,
 * canvas size listbox, menu actions, keyboard shortcuts, and initial boot sequence.
 */
document.addEventListener('DOMContentLoaded', () => {
  const PS = window.PaintStudio;
  const state = PS.state;
  const ctx = PS.dom.ctx;

  const brushSizeOptions = document.getElementById('brushSizeOptions');
  const polygonSelect = document.getElementById('polygonSelect');
  const polygonCustomBadge = document.getElementById('polygonCustomBadge');
  const lblCustomN = document.getElementById('lblCustomN');
  const circleAlgoSelect = document.getElementById('circleAlgoSelect');
  PS.dom.circleAlgoSelect = circleAlgoSelect;
  const optionsTitle = document.getElementById('optionsTitle');
  const boundaryColorSelect = document.getElementById('boundaryColorSelect');
  const fillAlgoSelect = document.getElementById('fillAlgoSelect');
  const fillConnectivitySelect = document.getElementById('fillConnectivitySelect');
  const fillConnectivityRow = document.getElementById('fillConnectivityRow');
  const boundaryFillColorRow = document.getElementById('boundaryFillColorRow');
  const statusHelpText = document.getElementById('statusHelpText');
  const canvasSizeListBox = document.getElementById('canvasSizeListBox');

  // Modal elements
  const modalOtherPolygon = document.getElementById('modalOtherPolygon');
  const inputCustomN = document.getElementById('inputCustomN');
  const btnApplyCustomN = document.getElementById('btnApplyCustomN');
  const btnCancelCustomN = document.getElementById('btnCancelCustomN');
  const btnCloseOtherModal = document.getElementById('btnCloseOtherModal');

  // --- Tool Button Click Listeners ---
  Object.keys(PS.dom.toolButtons).forEach(tool => {
    PS.dom.toolButtons[tool].addEventListener('click', () => PS.selectTool(tool));
  });

  // Brush Size Selection
  brushSizeOptions.querySelectorAll('.size-option-item').forEach(item => {
    item.addEventListener('click', () => {
      brushSizeOptions.querySelectorAll('.size-option-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      state.brushSize = parseInt(item.dataset.size);
    });
  });

  // Polygon Selection Dropdown
  polygonSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'other') {
      modalOtherPolygon.classList.add('open');
      inputCustomN.focus();
    } else {
      state.polygonType = val;
      polygonCustomBadge.style.display = 'none';
      PS.updatePolygonHelpText();
    }
  });

  // "Other" Polygon Modal Actions
  btnApplyCustomN.addEventListener('click', () => {
    const n = Math.max(3, parseInt(inputCustomN.value) || 9);
    state.customPolygonN = n;
    state.polygonType = 'other';
    lblCustomN.textContent = n;
    polygonCustomBadge.style.display = 'block';
    modalOtherPolygon.classList.remove('open');
    PS.updatePolygonHelpText();
  });

  btnCancelCustomN.addEventListener('click', () => {
    modalOtherPolygon.classList.remove('open');
    polygonSelect.value = state.polygonType;
  });

  btnCloseOtherModal.addEventListener('click', () => {
    modalOtherPolygon.classList.remove('open');
    polygonSelect.value = state.polygonType;
  });

  // Circle Algorithm Dropdown
  if (circleAlgoSelect) {
    circleAlgoSelect.addEventListener('change', (e) => {
      state.circleAlgorithm = e.target.value;
      const algoLabel = state.circleAlgorithm === 'bresenham' ? "Bresenham's" : 'Midpoint';
      optionsTitle.textContent = `Circle (${algoLabel})`;
      statusHelpText.textContent = `Circle: Click and drag to draw circle using ${algoLabel} Algorithm.`;
    });
  }

  // Boundary Fill Stop Color Dropdown
  if (boundaryColorSelect) {
    boundaryColorSelect.addEventListener('change', (e) => {
      state.boundaryColorMode = e.target.value;
    });
  }

  // Fill Connectivity Selection Dropdown (4-conn vs 8-conn)
  if (fillConnectivitySelect) {
    fillConnectivitySelect.addEventListener('change', (e) => {
      state.fillConnectivity = parseInt(e.target.value) || 4;
      statusHelpText.textContent = `Fill Tool: ${state.fillAlgorithm.toUpperCase()} (${state.fillConnectivity}-connected) active. Click canvas seed point to fill.`;
    });
  }

  // Fill Algorithm Selection Dropdown
  fillAlgoSelect.addEventListener('change', (e) => {
    state.fillAlgorithm = e.target.value;
    if (fillConnectivityRow) {
      fillConnectivityRow.style.display = (state.fillAlgorithm === 'boundary' || state.fillAlgorithm === 'flood') ? 'flex' : 'none';
    }
    if (boundaryFillColorRow) {
      boundaryFillColorRow.style.display = state.fillAlgorithm === 'boundary' ? 'flex' : 'none';
    }
    const connStr = (state.fillAlgorithm === 'boundary' || state.fillAlgorithm === 'flood') ? ` (${state.fillConnectivity}-conn)` : '';
    statusHelpText.textContent = `Fill Tool: Click seed point to execute ${state.fillAlgorithm.toUpperCase()}${connStr} algorithm.`;
  });

  // Canvas Size Listbox Selection
  canvasSizeListBox.querySelectorAll('.win-list-item').forEach(item => {
    item.addEventListener('click', () => {
      canvasSizeListBox.querySelectorAll('.win-list-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      const w = parseInt(item.dataset.w);
      const h = parseInt(item.dataset.h);
      const isStep = item.dataset.mode === 'step';
      PS.setCanvasSize(w, h, isStep);
    });
  });

  // Edit / Menu Actions
  document.getElementById('menuEditUndo').addEventListener('click', () => {
    if (state.undoStack.length > 1) {
      state.redoStack.push(state.undoStack.pop());
      const previous = state.undoStack[state.undoStack.length - 1];
      PS.restoreImageData(previous);
      PS.resetIterationState();
    }
  });

  document.getElementById('menuEditRedo').addEventListener('click', () => {
    if (state.redoStack.length > 0) {
      const next = state.redoStack.pop();
      state.undoStack.push(next);
      PS.restoreImageData(next);
      PS.resetIterationState();
    }
  });

  document.getElementById('menuEditClear').addEventListener('click', () => {
    PS.saveState();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);
    PS.resetIterationState();
  });

  document.getElementById('menuFileNew').addEventListener('click', () => {
    PS.saveState();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);
    PS.resetIterationState();
  });

  document.getElementById('menuFileSave').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `paint_cg_${state.canvasWidth}x${state.canvasHeight}.png`;
    link.href = PS.dom.canvas.toDataURL('image/png');
    link.click();
  });

  document.getElementById('menuFileExit').addEventListener('click', () => {
    alert('Thank you for using Windows 95 Computer Graphics Paint Studio!');
  });

  document.getElementById('menuHelpAbout').addEventListener('click', () => {
    alert('Paint (Computer Graphics Studio) - Windows 95 Edition\nDeveloped for university Computer Graphics curriculum.\nAlgorithms: Bresenham Line & Circle, Boundary Fill, Flood Fill, Scanline Fill.\nPalette: Minecraft 16 Colors.');
  });

  // Shortcuts: Ctrl+Z, Ctrl+Y, Ctrl+S
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      document.getElementById('menuEditUndo').click();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      document.getElementById('menuEditRedo').click();
    } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      document.getElementById('menuFileSave').click();
    }
  });

  // --- Initial Boot ---
  PS.initPalette();
  PS.updateColorDisplay();
  PS.selectTool('pencil');
  PS.setCanvasSize(32, 32, true); // Default to 32x32 step visualizer
});
