# Paint Studio - C++ Edition

A standalone, single-file modern C++ implementation of the **Computer Graphics Paint Studio**.

## Features Included
1. **DDA Line Algorithm**: Full step-by-step float increments & rounded integer plotting.
2. **Bresenham's Line Algorithm**: Decision parameter ($p_k, p_{k+1}$) table for all octants/slopes.
3. **Midpoint Circle Algorithm**: Decision parameter ($p_k$) tracking with 8-octants symmetry.
4. **Bresenham's Circle Algorithm**: Decision parameter ($d_k$) tracking with 8-octants symmetry.
5. **Regular Polygon Generator**: Generates regular $N$-gons (triangle to octagon/custom) with Bresenham edges.
6. **Boundary Fill Algorithm**: 4-connectivity and 8-connectivity stack-based fill.
7. **Flood Fill Algorithm**: 4-connectivity and 8-connectivity raster fill.
8. **Scanline Polygon Fill**: Full Edge Table (ET) & Active Edge Table (AET) rasterizer.
9. **Scanline Circle Fill**: Horizontal span rasterizer.
10. **Progressive Step Visualizer**: At step $k$, **only the first $k$ points** are plotted on the canvas.
11. **Decision Parameters Table**: Formatted ASCII table matching the web application UI.
12. **Native Windows BMP Export**: Saves generated canvases to `.bmp` image files that open directly in Windows MS Paint or Photoshop.

---

## How to Compile & Run

### Using GCC / MinGW (g++):
```bash
g++ -std=c++17 -O2 paint_studio.cpp -o paint_studio.exe
.\paint_studio.exe
```

### Using MSVC (Visual Studio Developer Command Prompt):
```cmd
cl /EHsc /std:c++17 /O2 paint_studio.cpp
paint_studio.exe
```

### Using Clang++:
```bash
clang++ -std=c++17 -O2 paint_studio.cpp -o paint_studio.exe
.\paint_studio.exe
```
