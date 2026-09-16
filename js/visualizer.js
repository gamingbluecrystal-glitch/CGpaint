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

  // --- Step-by-Step Iteration Visualizer Engine ---
  PS.setupIterationVisualizer = function (steps) {
    state.recordedSteps = steps;
    const maxStep = steps.length - 1;

    // Configure vertical slider
    vIterationSlider.min = 0;
    vIterationSlider.max = maxStep;
    vIterationSlider.value = maxStep; // Start at final state
    state.currentStepIndex = maxStep;

    vSliderTopLabel.textContent = `MAX (${maxStep})`;
    vSliderValue.textContent = `${maxStep} / ${maxStep}`;

    updateStepUI(maxStep);
  };

  PS.resetIterationState = function () {
    stopPlayback();
    state.recordedSteps = [];
    state.currentStepIndex = 0;
    vIterationSlider.min = 0;
    vIterationSlider.max = 0;
    vIterationSlider.value = 0;
    vSliderValue.textContent = '0 / 0';
    vSliderTopLabel.textContent = 'MAX';
    badgeAlgoName.textContent = 'Ready';
    stepInfoBox.textContent = state.isStepMode ?
      '16×16 / 32×32 mode active. Draw and Fill to scrub through iterations.' :
      'Normal resolution mode.';
  };

  function goToStep(stepIndex) {
    if (!state.recordedSteps || state.recordedSteps.length === 0) return;

    stepIndex = Math.max(0, Math.min(state.recordedSteps.length - 1, stepIndex));
    state.currentStepIndex = stepIndex;
    vIterationSlider.value = stepIndex;

    // Restore base image
    if (state.baseCanvasSnapshot) {
      ctx.putImageData(state.baseCanvasSnapshot, 0, 0);
    }

    const imgData = ctx.getImageData(0, 0, state.canvasWidth, state.canvasHeight);
    const pixelData = imgData.data;

    // Replay pixels up to stepIndex
    for (let i = 0; i <= stepIndex; i++) {
      const step = state.recordedSteps[i];
      if (step.pixels && Array.isArray(step.pixels)) {
        step.pixels.forEach(p => {
          const idx = (p.y * state.canvasWidth + p.x) * 4;
          pixelData[idx] = p.color[0];
          pixelData[idx + 1] = p.color[1];
          pixelData[idx + 2] = p.color[2];
          pixelData[idx + 3] = p.color[3] || 255;
        });
      } else if (step.pixel) {
        const p = step.pixel;
        const idx = (p.y * state.canvasWidth + p.x) * 4;
        pixelData[idx] = p.color[0];
        pixelData[idx + 1] = p.color[1];
        pixelData[idx + 2] = p.color[2];
        pixelData[idx + 3] = p.color[3] || 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    updateStepUI(stepIndex);
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
  }

  // Vertical Slider User Event
  vIterationSlider.addEventListener('input', (e) => {
    stopPlayback();
    goToStep(parseInt(e.target.value));
  });

  // Playback Controls
  btnStepFirst.addEventListener('click', () => { stopPlayback(); goToStep(0); });
  btnStepLast.addEventListener('click', () => { stopPlayback(); goToStep(state.recordedSteps.length - 1); });
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

    state.playIntervalId = setInterval(() => {
      if (state.currentStepIndex < state.recordedSteps.length - 1) {
        goToStep(state.currentStepIndex + 1);
      } else {
        stopPlayback();
      }
    }, state.stepSpeedMs);
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
});
