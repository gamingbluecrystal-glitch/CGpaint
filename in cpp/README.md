# Paint Studio - Native C++ Edition

This folder contains the complete C++ implementation of the **Computer Graphics Paint Studio**, matching the algorithms, features, and user interface of the web version.

---

## Files in this Folder

1. **`paint_studio_gui.cpp` (Recommended - Native Windows Desktop GUI)**:
   - Opens a **real graphical desktop window** with mouse drawing, buttons, and sliders.
   - **Interactive Mouse Drawing**: Click and drag on the canvas with real-time live preview for lines, circles, and polygons.
   - **Left Toolbar**: Pencil, Line (DDA & Bresenham), Circle (Midpoint & Bresenham), Polygon ($N$-gon), Fill (Boundary & Scanline), and Eraser.
   - **Center Canvas**: $32 \times 32$ zoomable pixel grid with grid overlay and live coordinate tracking.
   - **Vertical Iteration Slider**: Scrub through iteration steps. At iteration $k$, **only the points up to iteration $k$ are drawn on screen!**
   - **Algorithm Iteration Controls**: Play/Pause (`▶` / `⏸`), Step First (`|<`), Prev (`<`), Next (`>`), Last (`>|`).
   - **Decision Parameters Table**: Complete live data grid showing $k$, exact coordinates, decision parameters ($p_k, p_{k+1}$), conditions, plotted points, and 8-octants symmetry. Includes **Solo Table** mode.
   - **Color Palette**: 16 Minecraft color swatches for Primary (Left Click) and Secondary (Right Click) colors.

2. **`paint_studio.cpp` (Console & Automated Suite)**:
   - Self-contained console simulation that runs algorithms, prints formatted ASCII decision tables to the terminal, and exports native Windows `.bmp` files.

---

## How to Compile & Run the GUI Application

### Using MinGW / GCC (g++):
```powershell
g++ -std=c++17 -O2 paint_studio_gui.cpp -o paint_studio_gui.exe -mwindows -lgdi32 -lcomctl32 -lmsimg32
.\paint_studio_gui.exe
```

### Using MSVC (Visual Studio Developer Command Prompt):
```cmd
cl /EHsc /std:c++17 /O2 paint_studio_gui.cpp /link user32.lib gdi32.lib comctl32.lib msimg32.lib
paint_studio_gui.exe
```

---

## How to Compile & Run the Console Version

```powershell
g++ -std=c++17 -O2 paint_studio.cpp -o paint_studio.exe
.\paint_studio.exe
```
