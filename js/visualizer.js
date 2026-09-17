/**
 * Paint Studio - Visualizer Module
 * Step-by-step iteration visualizer engine with playback controls.
 */
document.addEventListener('DOMContentLoaded', () => {
  const PS = window.PaintStudio;
  const state = PS.state;
  const ctx = PS.dom.ctx;

  const vIterationSlider = document.getElementById('vIterationSlider');
  const vSliderValue = document.getElementById('vSliderValue');
  const vSliderTopLabel = document.getElementById('vSliderTopLabel');
  const stepInfoBox = document.getElementById('stepInfoBox');
  const badgeAlgoName = document.getElementById('badgeAlgoName');

  const btnStepFirst = document.getElementById('btnStepFirst');
  const btnStepPrev = document.getElementById('btnStepPrev');
  const btnStepPlay = document.getElementById('btnStepPlay');
  const btnStepNext = document.getElementById('btnStepNext');
  const btnStepLast = document.getElementById('btnStepLast');
  const selStepSpeed = document.getElementById('selStepSpeed');

  const chkShowDecisionParams = document.getElementById('chkShowDecisionParams');
  const decisionParamPanel = document.getElementById('decisionParamPanel');
  const paramTableTitle = document.getElementById('paramTableTitle');
  const paramTableAlgoBadge = document.getElementById('paramTableAlgoBadge');
  const paramTableFormula = document.getElementById('paramTableFormula');
  const paramTableHeadRow = document.getElementById('paramTableHeadRow');
  const paramTableBody = document.getElementById('paramTableBody');

  function updateTableVisibility() {
    if (!decisionParamPanel) return;
    const shouldShow = state.isStepMode && (chkShowDecisionParams ? chkShowDecisionParams.checked : true);
    decisionParamPanel.style.display = shouldShow ? 'flex' : 'none';
  }

  if (chkShowDecisionParams) {
    chkShowDecisionParams.addEventListener('change', (e) => {
      state.showDecisionParams = e.target.checked;
      updateTableVisibility();
    });
  }

  // --- Step-by-Step Iteration Visualizer Engine ---
  PS.setupIterationVisualizer = function (steps, autoPlay = true) {
    stopPlayback();
    state.recordedSteps = steps;
    const maxStep = steps.length - 1;

    // Configure vertical slider
    vIterationSlider.min = 0;
    vIterationSlider.max = maxStep;
    vIterationSlider.value = 0; // Start at step 0
    state.currentStepIndex = 0;

    vSliderTopLabel.textContent = `MAX (${maxStep})`;
    vSliderValue.textContent = `0 / ${maxStep}`;

    initDecisionTable(steps);
    goToStep(0);

    if (autoPlay && steps.length > 1) {
      startPlayback();
    }
  };

  PS.resetIterationState = function () {
    stopPlayback();
    state.recordedSteps = [];
    state.currentStepIndex = 0;
    state.lastPolygonVertices = null;
    state.lastCircle = null;
    vIterationSlider.min = 0;
    vIterationSlider.max = 0;
    vIterationSlider.value = 0;
    vSliderValue.textContent = '0 / 0';
    vSliderTopLabel.textContent = 'MAX';
    badgeAlgoName.textContent = 'Ready';
    stepInfoBox.textContent = state.isStepMode ?
      '16×16 / 32×32 mode active. Draw and Fill to scrub through iterations.' :
      'Normal resolution mode.';

    if (paramTableBody) paramTableBody.innerHTML = '';
    if (paramTableHeadRow) paramTableHeadRow.innerHTML = '';
    if (paramTableFormula) paramTableFormula.textContent = 'Draw a line or circle in 16×16 or 32×32 to view step-by-step decision parameters.';
    if (paramTableTitle) paramTableTitle.textContent = 'Decision Parameters Table';
    if (paramTableAlgoBadge) paramTableAlgoBadge.textContent = 'Table';
    updateTableVisibility();
  };

  function initDecisionTable(steps) {
    if (!paramTableHeadRow || !paramTableBody || !steps || steps.length === 0) return;
    updateTableVisibility();

    const firstStep = steps[0];
    const sType = firstStep.type;
    paramTableHeadRow.innerHTML = '';
    paramTableBody.innerHTML = '';

    let headers = [];
    if (sType === 'dda_line') {
      paramTableTitle.textContent = 'DDA Line Parameters';
      paramTableAlgoBadge.textContent = 'Δx = dx/steps, Δy = dy/steps';
      paramTableFormula.textContent = 'steps = max(|dx|, |dy|) | x(k+1) = xk + Δx, y(k+1) = yk + Δy | Plotted: (round(x), round(y))';
      headers = ['k', 'Exact X', 'Exact Y', 'Δx', 'Δy', 'Plot X', 'Plot Y'];
    } else if (sType === 'bresenham_line') {
      paramTableTitle.textContent = "Bresenham's Line Parameters";
      paramTableAlgoBadge.textContent = 'pk = 2Δy - Δx';
      paramTableFormula.textContent = 'If pk < 0: pk+1 = pk + 2Δy, same y | If pk >= 0: pk+1 = pk + 2Δy - 2Δx, step y';
      headers = ['k', 'Point (Xk, Yk)', 'Decision pk', 'Condition', 'Plot (X, Y)', 'Next pk+1'];
    } else if (sType === 'circle_midpoint') {
      paramTableTitle.textContent = 'Midpoint Circle Parameters';
      paramTableAlgoBadge.textContent = 'p0 = 1 - r';
      paramTableFormula.textContent = 'If pk < 0: pk+1 = pk + 2(x+1) + 1 | If pk >= 0: pk+1 = pk + 2(x+1) + 1 - 2(y-1), y-- | 8 Octants plotted';
      headers = ['k', '(x, y)', 'pk', 'Cond.', 'pk+1', 'Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Oct 5', 'Oct 6', 'Oct 7', 'Oct 8'];
    } else if (sType === 'circle_bresenham') {
      paramTableTitle.textContent = "Bresenham's Circle Parameters";
      paramTableAlgoBadge.textContent = 'd0 = 3 - 2r';
      paramTableFormula.textContent = 'If dk < 0: dk+1 = dk + 4x + 6 | If dk >= 0: dk+1 = dk + 4(x-y) + 10, y-- | 8 Octants plotted';
      headers = ['k', '(x, y)', 'dk', 'Cond.', 'dk+1', 'Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Oct 5', 'Oct 6', 'Oct 7', 'Oct 8'];
    } else {
      paramTableTitle.textContent = 'Algorithm Parameters';
      paramTableAlgoBadge.textContent = sType.toUpperCase();
      paramTableFormula.textContent = `Iteration step log for ${sType} algorithm.`;
      headers = ['Step', 'Type', 'Description', 'Pixels'];
    }

    headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      paramTableHeadRow.appendChild(th);
    });

    // Create table rows for each step
    steps.forEach((step, idx) => {
      const tr = document.createElement('tr');
      tr.id = `paramRow_${idx}`;
      tr.className = 'param-row';

      for (let c = 0; c < headers.length; c++) {
        const td = document.createElement('td');
        td.textContent = '—';
        tr.appendChild(td);
      }
      paramTableBody.appendChild(tr);
    });
  }

  function syncDecisionTable(currentIndex) {
    if (!paramTableBody || !state.recordedSteps || state.recordedSteps.length === 0) return;

    state.recordedSteps.forEach((step, idx) => {
      const tr = document.getElementById(`paramRow_${idx}`);
      if (!tr) return;

      const cells = tr.querySelectorAll('td');
      if (idx <= currentIndex) {
        tr.classList.remove('future-row');
        tr.classList.toggle('active-row', idx === currentIndex);

        // Fill cell values when reached
        if (step.type === 'dda_line') {
          cells[0].textContent = step.k;
          cells[1].textContent = step.exactX;
          cells[2].textContent = step.exactY;
          cells[3].textContent = step.xInc;
          cells[4].textContent = step.yInc;
          cells[5].textContent = step.plotX;
          cells[6].textContent = step.plotY;
        } else if (step.type === 'bresenham_line') {
          cells[0].textContent = step.k;
          cells[1].textContent = `(${step.prevX}, ${step.prevY})`;
          cells[2].textContent = step.pk;
          cells[3].textContent = step.condition;
          cells[4].textContent = `(${step.plotX}, ${step.plotY})`;
          cells[5].textContent = step.nextPk;
        } else if (step.type === 'circle_midpoint' || step.type === 'circle_bresenham') {
          cells[0].textContent = step.k;
          cells[1].textContent = `(${step.prevX}, ${step.prevY})`;
          cells[2].textContent = step.pk;
          cells[3].textContent = step.condition;
          cells[4].textContent = step.nextPk;
          if (step.octants && step.octants.length >= 8) {
            for (let o = 0; o < 8; o++) {
              cells[5 + o].textContent = `(${step.octants[o].x}, ${step.octants[o].y})`;
            }
          } else if (step.octants && step.octants.length > 0) {
            cells[5].textContent = `(${step.octants[0].x}, ${step.octants[0].y})`;
          }
        } else {
          cells[0].textContent = idx;
          cells[1].textContent = step.type;
          cells[2].textContent = step.description;
          cells[3].textContent = step.pixels ? step.pixels.length : (step.pixel ? 1 : 0);
        }
      } else {
        // Not reached yet: clear values and mark as future row
        tr.classList.add('future-row');
        tr.classList.remove('active-row');
        cells.forEach(td => td.textContent = '—');
      }
    });

    // Auto-scroll active row into view
    const activeTr = document.getElementById(`paramRow_${currentIndex}`);
    if (activeTr) {
      activeTr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function goToStep(stepIndex) {
    if (!state.recordedSteps || state.recordedSteps.length === 0) return;

    stepIndex = Math.max(0, Math.min(state.recordedSteps.length - 1, stepIndex));
    state.currentStepIndex = stepIndex;
    vIterationSlider.value = stepIndex;

    // Restore clean base canvas before this shape/fill algorithm was started
    if (state.baseCanvasSnapshot) {
      ctx.putImageData(state.baseCanvasSnapshot, 0, 0);
    }

    const bSize = state.brushSize || 1;

    // Replay pixels strictly up to stepIndex
    for (let i = 0; i <= stepIndex; i++) {
      const step = state.recordedSteps[i];
      if (step.pixels && Array.isArray(step.pixels)) {
        const isFill = (step.type === 'boundary' || step.type === 'flood' || (typeof step.type === 'string' && step.type.startsWith('scanline')));
        step.pixels.forEach(p => {
          PS.setPixel(p.x, p.y, p.color, isFill ? 1 : bSize);
        });
      } else if (step.pixel) {
        const p = step.pixel;
        PS.setPixel(p.x, p.y, p.color, bSize);
      }
    }

    updateStepUI(stepIndex);
    syncDecisionTable(stepIndex);
  }

  function updateStepUI(stepIndex) {
    const max = state.recordedSteps.length - 1;
    vSliderValue.textContent = `${stepIndex} / ${max}`;

    const step = state.recordedSteps[stepIndex];
    if (step) {
      if (stepIndex === 0 && (step.seedX !== undefined || step.type === 'boundary' || step.type === 'flood')) {
        const sx = step.seedX !== undefined ? step.seedX : (step.pixel ? step.pixel.x : '?');
        const sy = step.seedY !== undefined ? step.seedY : (step.pixel ? step.pixel.y : '?');
        const conn = step.connectivity ? ` [${step.connectivity}-conn]` : '';
        stepInfoBox.innerHTML = `<b>Iteration 0 / ${max} ${conn}</b><br><span style="color: #000080; font-weight: bold;">📍 Seed Point: (${sx}, ${sy})</span><br>${step.description}`;
      } else {
        stepInfoBox.innerHTML = `<b>Iteration ${stepIndex} / ${max}:</b><br>${step.description}`;
      }
    }
    syncDecisionTable(stepIndex);
  }

  // Vertical Slider User Event
  vIterationSlider.addEventListener('input', (e) => {
    stopPlayback();
    goToStep(parseInt(e.target.value));
  });

  // Playback Controls
  btnStepFirst.addEventListener('click', () => { stopPlayback(); goToStep(0); });
  btnStepLast.addEventListener('click', () => { stopPlayback(); goToStep(state.recordedSteps.length - 1); PS.saveState(); });
  btnStepPrev.addEventListener('click', () => { stopPlayback(); goToStep(state.currentStepIndex - 1); });
  btnStepNext.addEventListener('click', () => { stopPlayback(); goToStep(state.currentStepIndex + 1); });

  btnStepPlay.addEventListener('click', () => {
    if (state.isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  });

  function startPlayback() {
    if (!state.recordedSteps || state.recordedSteps.length === 0) return;
    state.isPlaying = true;
    btnStepPlay.textContent = '⏸';

    if (state.currentStepIndex >= state.recordedSteps.length - 1) {
      goToStep(0);
    }

    if (state.playIntervalId) {
      clearInterval(state.playIntervalId);
      state.playIntervalId = null;
    }

    state.playIntervalId = setInterval(() => {
      if (state.currentStepIndex < state.recordedSteps.length - 1) {
        goToStep(state.currentStepIndex + 1);
      } else {
        stopPlayback();
        PS.saveState();
      }
    }, state.stepSpeedMs || 150);
  }

  function stopPlayback() {
    state.isPlaying = false;
    btnStepPlay.textContent = '▶';
    if (state.playIntervalId) {
      clearInterval(state.playIntervalId);
      state.playIntervalId = null;
    }
  }

  selStepSpeed.addEventListener('change', (e) => {
    state.stepSpeedMs = parseInt(e.target.value);
    if (state.isPlaying) {
      stopPlayback();
      startPlayback();
    }
  });

  // Expose methods on PS namespace
  PS.goToStep = goToStep;
  PS.startPlayback = startPlayback;
  PS.stopPlayback = stopPlayback;
});
