/**
 * Paint Studio - Canvas Module
 * Canvas sizing, pixel operations, undo state management, and coordinate helpers.
 */
document.addEventListener('DOMContentLoaded', () => {
  const PS = window.PaintStudio;
  const state = PS.state;

  // Cache shared canvas DOM elements
  const canvas = document.getElementById('paintCanvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  PS.dom.canvas = canvas;
  PS.dom.ctx = ctx;

  const pixelGridOverlay = document.getElementById('pixelGridOverlay');
  const vSliderContainer = document.getElementById('vSliderContainer');
  const iterationPanel = document.getElementById('iterationPanel');
  const statusSize = document.getElementById('statusSize');
  const statusHelpText = document.getElementById('statusHelpText');
  PS.dom.statusHelpText = statusHelpText;

  // --- Canvas Sizing & Setup ---
  PS.setCanvasSize = function (w, h, isStepMode) {
    state.canvasWidth = w;
    state.canvasHeight = h;
    state.isStepMode = isStepMode;

    canvas.width = w;
    canvas.height = h;

    // Determine viewport display scaling
    if (w <= 16 && h <= 16) {
      state.displayScale = 28;
    } else if (w <= 32 && h <= 32) {
      state.displayScale = 14;
    } else if (w <= 64 && h <= 64) {
      state.displayScale = 7;
    } else if (w <= 100 && h <= 100) {
      state.displayScale = 4.5;
    } else {
      state.displayScale = 1;
    }

    const displayW = Math.round(w * state.displayScale);
    const displayH = Math.round(h * state.displayScale);
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;

    // Configure Thin Pixel Grid Overlay
    if (isStepMode) {
      pixelGridOverlay.classList.add('active');
      pixelGridOverlay.style.setProperty('--grid-cols', w);
      pixelGridOverlay.style.setProperty('--grid-rows', h);

      // Show Vertical Slider & Iteration Panel
      vSliderContainer.classList.add('active');
      iterationPanel.classList.add('active');
    } else {
      pixelGridOverlay.classList.remove('active');
      vSliderContainer.classList.remove('active');
      iterationPanel.classList.remove('active');
    }

    // Initialize white canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Save initial state for undo
    PS.saveState();
    PS.resetIterationState();

    statusSize.textContent = `${w} × ${h} px`;
    statusHelpText.textContent = `Canvas ready (${w}×${h}). Selected tool: ${state.currentTool.toUpperCase()}`;
  };

  // --- Pixel & Canvas Helpers ---
  PS.saveState = function () {
    if (state.undoStack.length >= 20) state.undoStack.shift();
    state.undoStack.push(ctx.getImageData(0, 0, state.canvasWidth, state.canvasHeight));
    state.redoStack = [];
  };

  PS.restoreImageData = function (imgData) {
    ctx.putImageData(imgData, 0, 0);
  };

  PS.getCanvasCoords = function (e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const pxX = Math.floor((clientX / rect.width) * state.canvasWidth);
    const pxY = Math.floor((clientY / rect.height) * state.canvasHeight);

    return {
      x: Math.max(0, Math.min(state.canvasWidth - 1, pxX)),
      y: Math.max(0, Math.min(state.canvasHeight - 1, pxY))
    };
  };

  PS.setPixel = function (x, y, colorRgba, size = 1) {
    if (x < 0 || x >= state.canvasWidth || y < 0 || y >= state.canvasHeight) return;

    const alpha = (colorRgba.length > 3 && colorRgba[3] !== undefined) ? (colorRgba[3] / 255) : 1;
    ctx.fillStyle = `rgba(${colorRgba[0]}, ${colorRgba[1]}, ${colorRgba[2]}, ${alpha})`;

    if (size <= 1) {
      ctx.fillRect(x, y, 1, 1);
    } else {
      const half = Math.floor(size / 2);
      ctx.fillRect(x - half, y - half, size, size);
    }
  };
});
