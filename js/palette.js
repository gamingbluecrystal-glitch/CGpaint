/**
 * Paint Studio - Palette Module
 * Handles Minecraft 16-color palette initialization and color display updates.
 */
document.addEventListener('DOMContentLoaded', () => {
  const PS = window.PaintStudio;
  const state = PS.state;
  const MC_COLORS = PS.MC_COLORS;

  const minecraftPaletteGrid = document.getElementById('minecraftPaletteGrid');
  const boxPrimaryColor = document.getElementById('boxPrimaryColor');
  const boxSecondaryColor = document.getElementById('boxSecondaryColor');
  const lblPrimaryHex = document.getElementById('lblPrimaryHex');
  const lblSecondaryHex = document.getElementById('lblSecondaryHex');

  PS.initPalette = function () {
    minecraftPaletteGrid.innerHTML = '';
    MC_COLORS.forEach((c, index) => {
      const swatch = document.createElement('div');
      swatch.className = 'mc-color-swatch' + (c === state.primaryColor ? ' active-primary' : '');
      swatch.style.backgroundColor = c.hex;
      swatch.title = `${c.name} (${c.hex})\nLeft-click: Primary\nRight-click: Secondary`;

      // Left Click -> Primary
      swatch.addEventListener('click', (e) => {
        e.preventDefault();
        state.primaryColor = c;
        PS.updateColorDisplay();
      });

      // Right Click -> Secondary
      swatch.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        state.secondaryColor = c;
        PS.updateColorDisplay();
      });

      minecraftPaletteGrid.appendChild(swatch);
    });
  };

  PS.updateColorDisplay = function () {
    boxPrimaryColor.style.backgroundColor = state.primaryColor.hex;
    boxSecondaryColor.style.backgroundColor = state.secondaryColor.hex;
    lblPrimaryHex.textContent = `${state.primaryColor.name} (${state.primaryColor.hex})`;
    lblSecondaryHex.textContent = `${state.secondaryColor.name} (${state.secondaryColor.hex})`;

    // Update active primary indicator
    const swatches = minecraftPaletteGrid.querySelectorAll('.mc-color-swatch');
    swatches.forEach((swatch, i) => {
      if (MC_COLORS[i] === state.primaryColor) {
        swatch.classList.add('active-primary');
      } else {
        swatch.classList.remove('active-primary');
      }
    });
  };
});
