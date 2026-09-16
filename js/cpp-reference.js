/**
 * Paint Studio - C++ Reference Module
 * C++ course code samples for all algorithms and modal dialog management.
 */
document.addEventListener('DOMContentLoaded', () => {
  const PS = window.PaintStudio;
  const state = PS.state;

  const modalCppCode = document.getElementById('modalCppCode');
  const cppCodeDisplay = document.getElementById('cppCodeDisplay');
  const cppTabBar = document.getElementById('cppTabBar');
  const btnCopyCppCode = document.getElementById('btnCopyCppCode');
  const btnCloseCppModal = document.getElementById('btnCloseCppModal');
  const btnCloseCppModalBtn = document.getElementById('btnCloseCppModalBtn');
  const menuOpenCpp = document.getElementById('menuOpenCpp');
  const menuFileCpp = document.getElementById('menuFileCpp');
  const menuAlgoBresCircle = document.getElementById('menuAlgoBresCircle');
  const circleAlgoSelect = PS.dom.circleAlgoSelect;

  // --- C++ Course Code Reference Modal Data ---
  const CPP_CODE_SAMPLES = {
    bresenhamLine: `// ==========================================
// Bresenham's Line Drawing Algorithm (C++)
// Standard University Computer Graphics Lab
// ==========================================
#include <iostream>
#include <cmath>
#include <vector>

struct Point { int x, y; };

std::vector<Point> bresenhamLine(int x0, int y0, int x1, int y1) {
    std::vector<Point> points;
    int dx = std::abs(x1 - x0);
    int dy = std::abs(y1 - y0);
    int sx = (x0 < x1) ? 1 : -1;
    int sy = (y0 < y1) ? 1 : -1;
    int err = dx - dy;

    int x = x0, y = y0;
    while (true) {
        points.push_back({x, y});
        if (x == x1 && y == y1) break;

        int e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
    return points;
}`,

    midpointCircle: `// ==========================================
// Midpoint Circle Algorithm (C++)
// Standard University Computer Graphics Lab
// Decision Variable: p = 1 - r
// ==========================================
#include <iostream>
#include <vector>

struct Point { int x, y; };

void plot8Symmetric(int xc, int yc, int x, int y, std::vector<Point>& pts) {
    pts.push_back({xc + x, yc + y});
    pts.push_back({xc - x, yc + y});
    pts.push_back({xc + x, yc - y});
    pts.push_back({xc - x, yc - y});
    pts.push_back({xc + y, yc + x});
    pts.push_back({xc - y, yc + x});
    pts.push_back({xc + y, yc - x});
    pts.push_back({xc - y, yc - x});
}

std::vector<Point> midpointCircle(int xc, int yc, int r) {
    std::vector<Point> pts;
    int x = 0;
    int y = r;
    int p = 1 - r; // Initial decision parameter

    plot8Symmetric(xc, yc, x, y, pts);

    while (x < y) {
        x++;
        if (p < 0) {
            p += 2 * x + 1;
        } else {
            y--;
            p += 2 * (x - y) + 1;
        }
        plot8Symmetric(xc, yc, x, y, pts);
    }
    return pts;
}`,

    bresenhamCircle: `// ==========================================
// Bresenham's Circle Drawing Algorithm (C++)
// Standard University Computer Graphics Lab
// Decision Variable: d = 3 - 2r
// ==========================================
#include <iostream>
#include <vector>

struct Point { int x, y; };

void plot8Symmetric(int xc, int yc, int x, int y, std::vector<Point>& pts) {
    pts.push_back({xc + x, yc + y});
    pts.push_back({xc - x, yc + y});
    pts.push_back({xc + x, yc - y});
    pts.push_back({xc - x, yc - y});
    pts.push_back({xc + y, yc + x});
    pts.push_back({xc - y, yc + x});
    pts.push_back({xc + y, yc - x});
    pts.push_back({xc - y, yc - x});
}

std::vector<Point> bresenhamCircle(int xc, int yc, int r) {
    std::vector<Point> pts;
    int x = 0;
    int y = r;
    int d = 3 - 2 * r; // Initial decision parameter

    plot8Symmetric(xc, yc, x, y, pts);

    while (x <= y) {
        if (d < 0) {
            d += 4 * x + 6;
        } else {
            d += 4 * (x - y) + 10;
            y--;
        }
        x++;
        plot8Symmetric(xc, yc, x, y, pts);
    }
    return pts;
}`,

    boundaryFill: `// ==========================================
// Boundary Fill Algorithm (4-Connected & 8-Connected) (C++)
// Standard University Computer Graphics Lab
// ==========================================
#include <vector>
#include <queue>

struct Color { unsigned char r, g, b; };
bool operator==(const Color& a, const Color& b) {
    return a.r == b.r && a.g == b.g && a.b == b.b;
}

// 4-Connected Boundary Fill (Orthogonal neighbors)
void boundaryFill4(int x, int y, Color fillColor, Color boundaryColor,
                   std::vector<std::vector<Color>>& canvas, int W, int H) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    if (canvas[y][x] == boundaryColor || canvas[y][x] == fillColor) return;

    struct Node { int x, y; };
    std::queue<Node> q;
    q.push({x, y});
    canvas[y][x] = fillColor;

    int dx[4] = {1, -1, 0, 0};
    int dy[4] = {0, 0, 1, -1};

    while (!q.empty()) {
        Node curr = q.front();
        q.pop();

        for (int i = 0; i < 4; ++i) {
            int nx = curr.x + dx[i];
            int ny = curr.y + dy[i];
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                if (!(canvas[ny][nx] == boundaryColor) && !(canvas[ny][nx] == fillColor)) {
                    canvas[ny][nx] = fillColor;
                    q.push({nx, ny});
                }
            }
        }
    }
}

// 8-Connected Boundary Fill (Orthogonal + Diagonal neighbors)
void boundaryFill8(int x, int y, Color fillColor, Color boundaryColor,
                   std::vector<std::vector<Color>>& canvas, int W, int H) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    if (canvas[y][x] == boundaryColor || canvas[y][x] == fillColor) return;

    struct Node { int x, y; };
    std::queue<Node> q;
    q.push({x, y});
    canvas[y][x] = fillColor;

    int dx[8] = {1, -1, 0, 0, 1, -1, 1, -1};
    int dy[8] = {0, 0, 1, -1, -1, -1, 1, 1};

    while (!q.empty()) {
        Node curr = q.front();
        q.pop();

        for (int i = 0; i < 8; ++i) {
            int nx = curr.x + dx[i];
            int ny = curr.y + dy[i];
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                if (!(canvas[ny][nx] == boundaryColor) && !(canvas[ny][nx] == fillColor)) {
                    canvas[ny][nx] = fillColor;
                    q.push({nx, ny});
                }
            }
        }
    }
}`,

    floodFill: `// ==========================================
// Flood Fill Algorithm (4-Connected & 8-Connected) (C++)
// Standard University Computer Graphics Lab
// ==========================================
#include <vector>
#include <queue>

struct Color { unsigned char r, g, b; };
bool operator==(const Color& a, const Color& b) {
    return a.r == b.r && a.g == b.g && a.b == b.b;
}

// 4-Connected Flood Fill
void floodFill4(int x, int y, Color fillColor,
                std::vector<std::vector<Color>>& canvas, int W, int H) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    Color targetColor = canvas[y][x];
    if (targetColor == fillColor) return;

    struct Node { int x, y; };
    std::queue<Node> q;
    q.push({x, y});
    canvas[y][x] = fillColor;

    int dx[4] = {1, -1, 0, 0};
    int dy[4] = {0, 0, 1, -1};

    while (!q.empty()) {
        Node curr = q.front();
        q.pop();

        for (int i = 0; i < 4; ++i) {
            int nx = curr.x + dx[i];
            int ny = curr.y + dy[i];
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                if (canvas[ny][nx] == targetColor) {
                    canvas[ny][nx] = fillColor;
                    q.push({nx, ny});
                }
            }
        }
    }
}

// 8-Connected Flood Fill (Passes diagonally through 4-connected boundaries)
void floodFill8(int x, int y, Color fillColor,
                std::vector<std::vector<Color>>& canvas, int W, int H) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    Color targetColor = canvas[y][x];
    if (targetColor == fillColor) return;

    struct Node { int x, y; };
    std::queue<Node> q;
    q.push({x, y});
    canvas[y][x] = fillColor;

    int dx[8] = {1, -1, 0, 0, 1, -1, 1, -1};
    int dy[8] = {0, 0, 1, -1, -1, -1, 1, 1};

    while (!q.empty()) {
        Node curr = q.front();
        q.pop();

        for (int i = 0; i < 8; ++i) {
            int nx = curr.x + dx[i];
            int ny = curr.y + dy[i];
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                if (canvas[ny][nx] == targetColor) {
                    canvas[ny][nx] = fillColor;
                    q.push({nx, ny});
                }
            }
        }
    }
}`,

    scanlineFill: `// ==========================================
// Scanline Polygon Fill Algorithm (ET & AET)
// Standard University Computer Graphics Lab
// ==========================================
#include <vector>
#include <algorithm>

struct Point { int x, y; };
struct Edge {
    int yMax;
    float currentX;
    float invSlope; // 1/m = dx/dy
};

void scanlineFill(const std::vector<Point>& vertices,
                  Color fillColor, std::vector<std::vector<Color>>& canvas,
                  int W, int H) {
    int n = vertices.size();
    if (n < 3) return;

    int yMinGlobal = H, yMaxGlobal = -1;
    std::vector<std::vector<Edge>> edgeTable(H);

    for (int i = 0; i < n; ++i) {
        Point p1 = vertices[i];
        Point p2 = vertices[(i + 1) % n];
        if (p1.y == p2.y) continue; // Ignore horizontal edges

        int yMin = std::min(p1.y, p2.y);
        int yMax = std::max(p1.y, p2.y);
        float xVal = (p1.y < p2.y) ? p1.x : p2.x;
        float invM = (float)(p2.x - p1.x) / (p2.y - p1.y);

        if (yMin >= 0 && yMin < H) {
            edgeTable[yMin].push_back({yMax, xVal, invM});
            yMinGlobal = std::min(yMinGlobal, yMin);
            yMaxGlobal = std::max(yMaxGlobal, yMax);
        }
    }

    std::vector<Edge> AET; // Active Edge Table

    for (int y = yMinGlobal; y <= std::min(yMaxGlobal, H - 1); ++y) {
        // 1. Add edges starting at y
        for (const auto& e : edgeTable[y]) AET.push_back(e);

        // 2. Remove edges where y == yMax
        AET.erase(std::remove_if(AET.begin(), AET.end(), [y](const Edge& e) {
            return e.yMax <= y;
        }), AET.end());

        // 3. Sort AET by currentX
        std::sort(AET.begin(), AET.end(), [](const Edge& a, const Edge& b) {
            return a.currentX < b.currentX;
        });

        // 4. Fill spans between pairs of intersections
        for (size_t i = 0; i + 1 < AET.size(); i += 2) {
            int xStart = std::max(0, (int)std::ceil(AET[i].currentX));
            int xEnd = std::min(W - 1, (int)std::floor(AET[i + 1].currentX));
            for (int x = xStart; x <= xEnd; ++x) {
                canvas[y][x] = fillColor;
            }
        }

        // 5. Update X coordinates for next scanline
        for (auto& e : AET) e.currentX += e.invSlope;
    }
}`,

    bmpExport: `// ==========================================
// 24-bit Uncompressed BMP Image Writer (C++)
// Standard C++ File Output for CG Projects
// ==========================================
#include <fstream>
#include <vector>

#pragma pack(push, 1)
struct BMPHeader {
    uint16_t fileType{0x4D42}; // "BM"
    uint32_t fileSize{0};
    uint16_t reserved1{0}, reserved2{0};
    uint32_t offsetData{54};
    uint32_t size{40};
    int32_t  width{0};
    int32_t  height{0};
    uint16_t planes{1};
    uint16_t bitCount{24};
    uint32_t compression{0};
    uint32_t sizeImage{0};
    int32_t  xPelsPerMeter{0};
    int32_t  yPelsPerMeter{0};
    uint32_t clrUsed{0};
    uint32_t clrImportant{0};
};
#pragma pack(pop)

void saveBMP(const char* filename, int W, int H, const std::vector<std::vector<Color>>& canvas) {
    int rowPadding = (4 - (W * 3) % 4) % 4;
    int dataSize = (W * 3 + rowPadding) * H;
    BMPHeader header;
    header.fileSize = 54 + dataSize;
    header.width = W;
    header.height = H; // Positive = bottom-to-top
    header.sizeImage = dataSize;

    std::ofstream out(filename, std::ios::binary);
    out.write((char*)&header, sizeof(header));

    for (int y = H - 1; y >= 0; --y) { // Write BMP bottom-up
        for (int x = 0; x < W; ++x) {
            out.put(canvas[y][x].b); // BMP stores B, G, R
            out.put(canvas[y][x].g);
            out.put(canvas[y][x].r);
        }
        for (int p = 0; p < rowPadding; ++p) out.put(0);
    }
}`
  };

  function openCppModal(tab = 'bresenhamLine') {
    modalCppCode.classList.add('open');
    loadCppTab(tab);
  }

  function loadCppTab(tab) {
    cppTabBar.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    cppCodeDisplay.textContent = CPP_CODE_SAMPLES[tab] || '// No code available';
  }

  cppTabBar.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => loadCppTab(btn.dataset.tab));
  });

  menuOpenCpp.addEventListener('click', () => openCppModal('bresenhamLine'));
  menuFileCpp.addEventListener('click', () => openCppModal('bresenhamLine'));

  const bindMenu = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  };

  bindMenu('menuAlgoBoundary', () => openCppModal('boundaryFill'));
  bindMenu('menuAlgoFlood', () => openCppModal('floodFill'));

  bindMenu('menuAlgoBoundary4', () => {
    PS.selectTool('fill');
    state.fillAlgorithm = 'boundary';
    state.fillConnectivity = 4;
    const fas = document.getElementById('fillAlgoSelect');
    const fcs = document.getElementById('fillConnectivitySelect');
    if (fas) fas.value = 'boundary';
    if (fcs) fcs.value = '4';
    openCppModal('boundaryFill');
  });

  bindMenu('menuAlgoBoundary8', () => {
    PS.selectTool('fill');
    state.fillAlgorithm = 'boundary';
    state.fillConnectivity = 8;
    const fas = document.getElementById('fillAlgoSelect');
    const fcs = document.getElementById('fillConnectivitySelect');
    if (fas) fas.value = 'boundary';
    if (fcs) fcs.value = '8';
    openCppModal('boundaryFill');
  });

  bindMenu('menuAlgoFlood4', () => {
    PS.selectTool('fill');
    state.fillAlgorithm = 'flood';
    state.fillConnectivity = 4;
    const fas = document.getElementById('fillAlgoSelect');
    const fcs = document.getElementById('fillConnectivitySelect');
    if (fas) fas.value = 'flood';
    if (fcs) fcs.value = '4';
    openCppModal('floodFill');
  });

  bindMenu('menuAlgoFlood8', () => {
    PS.selectTool('fill');
    state.fillAlgorithm = 'flood';
    state.fillConnectivity = 8;
    const fas = document.getElementById('fillAlgoSelect');
    const fcs = document.getElementById('fillConnectivitySelect');
    if (fas) fas.value = 'flood';
    if (fcs) fcs.value = '8';
    openCppModal('floodFill');
  });

  bindMenu('menuAlgoScanline', () => openCppModal('scanlineFill'));
  bindMenu('menuAlgoBresLine', () => openCppModal('bresenhamLine'));
  bindMenu('menuAlgoCircle', () => {
    PS.selectTool('circle');
    state.circleAlgorithm = 'midpoint';
    if (circleAlgoSelect) circleAlgoSelect.value = 'midpoint';
    openCppModal('midpointCircle');
  });
  bindMenu('menuAlgoBresCircle', () => {
    PS.selectTool('circle');
    state.circleAlgorithm = 'bresenham';
    if (circleAlgoSelect) circleAlgoSelect.value = 'bresenham';
    openCppModal('bresenhamCircle');
  });

  btnCloseCppModal.addEventListener('click', () => modalCppCode.classList.remove('open'));
  btnCloseCppModalBtn.addEventListener('click', () => modalCppCode.classList.remove('open'));

  btnCopyCppCode.addEventListener('click', () => {
    navigator.clipboard.writeText(cppCodeDisplay.textContent).then(() => {
      const origText = btnCopyCppCode.textContent;
      btnCopyCppCode.textContent = 'Copied to Clipboard!';
      setTimeout(() => btnCopyCppCode.textContent = origText, 1500);
    });
  });
});
