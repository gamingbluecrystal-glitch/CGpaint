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
  const lineAlgoSelect = document.getElementById('lineAlgoSelect');
  PS.dom.lineAlgoSelect = lineAlgoSelect;
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

  // Line Algorithm Dropdown
  if (lineAlgoSelect) {
    lineAlgoSelect.addEventListener('change', (e) => {
      state.lineAlgorithm = e.target.value;
      const algoLabel = state.lineAlgorithm === 'dda' ? 'DDA' : "Bresenham's";
      optionsTitle.textContent = `Line (${algoLabel})`;
      statusHelpText.textContent = `Line: Click and drag to draw line using ${algoLabel} Algorithm.`;
    });
  }

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

  // --- Right Panel Resizer (Slider + Draggable Handle + Presets) ---
  const rightPanel = document.getElementById('rightPanel');
  const rightPanelResizer = document.getElementById('rightPanelResizer');
  const panelWidthSlider = document.getElementById('panelWidthSlider');
  const lblPanelWidthVal = document.getElementById('lblPanelWidthVal');
  const btnWidthCompact = document.getElementById('btnWidthCompact');
  const btnWidthMedium = document.getElementById('btnWidthMedium');
  const btnWidthWide = document.getElementById('btnWidthWide');

  function setRightPanelWidth(w) {
    const clampedW = Math.max(250, Math.min(850, Math.round(w)));
    if (rightPanel) rightPanel.style.width = `${clampedW}px`;
    if (panelWidthSlider) panelWidthSlider.value = clampedW;
    if (lblPanelWidthVal) lblPanelWidthVal.textContent = `${clampedW}px`;
  }

  if (panelWidthSlider) {
    panelWidthSlider.addEventListener('input', (e) => {
      setRightPanelWidth(parseInt(e.target.value));
    });
  }

  if (btnWidthCompact) btnWidthCompact.addEventListener('click', () => setRightPanelWidth(260));
  if (btnWidthMedium) btnWidthMedium.addEventListener('click', () => setRightPanelWidth(420));
  if (btnWidthWide) btnWidthWide.addEventListener('click', () => setRightPanelWidth(620));

  // Draggable Splitter Handle between Workspace & Right Panel
  if (rightPanelResizer && rightPanel) {
    let isResizing = false;
    let startX = 0;
    let startWidth = 320;

    rightPanelResizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isResizing = true;
      startX = e.clientX;
      startWidth = rightPanel.offsetWidth;
      rightPanelResizer.classList.add('resizing');
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      // Moving mouse left increases right panel width, right decreases
      const deltaX = startX - e.clientX;
      setRightPanelWidth(startWidth + deltaX);
    });

    window.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        rightPanelResizer.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  // --- Solo Table Mode Toggle ---
  // Clicking on Decision Parameter Title Bar or the Solo button makes it the ONLY thing visible in the right panel!
  const btnToggleSoloTable = document.getElementById('btnToggleSoloTable');
  const decisionParamTitleBar = document.getElementById('decisionParamTitleBar');

  function toggleSoloTableMode(e) {
    if (e && e.target && e.target.id === 'btnToggleSoloTable') {
      e.stopPropagation();
    }
    if (!rightPanel) return;
    const isSolo = rightPanel.classList.toggle('solo-param-table');
    if (btnToggleSoloTable) {
      btnToggleSoloTable.textContent = isSolo ? '🗗 Restore All' : '🗖 Solo Table';
      btnToggleSoloTable.title = isSolo ? 'Show all right panel sections' : 'Click to view only this table in right panel';
      btnToggleSoloTable.classList.toggle('active', isSolo);
    }
    // If opening solo table and panel width is narrow, auto-expand to at least 450px for great visibility
    if (isSolo && rightPanel.offsetWidth < 450) {
      setRightPanelWidth(480);
    }
  }

  if (btnToggleSoloTable) {
    btnToggleSoloTable.addEventListener('click', toggleSoloTableMode);
  }
  if (decisionParamTitleBar) {
    decisionParamTitleBar.addEventListener('click', (e) => {
      // Don't double toggle if btnToggleSoloTable was clicked directly
      if (e.target.closest('#btnToggleSoloTable')) return;
      toggleSoloTableMode(e);
    });
  }

  // --- Initial Boot ---
  PS.initPalette();
  PS.updateColorDisplay();
  PS.selectTool('pencil');
  PS.setCanvasSize(32, 32, true); // Default to 32x32 step visualizer
});
