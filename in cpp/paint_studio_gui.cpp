/**
 * ============================================================================
 * Paint Studio - Native Windows Desktop GUI Edition (Modern C++)
 * Single-file complete implementation of Computer Graphics Studio with
 * Win32 GDI GUI, mouse drawing, tools, pixel canvas, live decision tables,
 * progressive step visualizer, playback animation, and BMP export.
 *
 * Compilation:
 *   g++ -std=c++17 -O2 paint_studio_gui.cpp -o paint_studio_gui.exe -mwindows -lgdi32 -lcomctl32 -lmsimg32
 * ============================================================================
 */

#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif

#include <windows.h>
#include <commctrl.h>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <cmath>
#include <algorithm>
#include <stack>
#include <queue>
#include <fstream>
#include <cstdint>

#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "gdi32.lib")
#pragma comment(lib, "msimg32.lib")

// ----------------------------------------------------------------------------
// 1. Core Structures
// ----------------------------------------------------------------------------

struct Color {
    uint8_t r, g, b, a;
    Color() : r(255), g(255), b(255), a(255) {}
    Color(uint8_t r, uint8_t g, uint8_t b, uint8_t a = 255) : r(r), g(g), b(b), a(a) {}
    COLORREF toCOLORREF() const { return RGB(r, g, b); }
    bool operator==(const Color& o) const { return r == o.r && g == o.g && b == o.b; }
    bool operator!=(const Color& o) const { return !(*this == o); }
};

namespace Palette {
    const Color White(255, 255, 255);
    const Color LightGray(192, 192, 192);
    const Color Gray(128, 128, 128);
    const Color Black(29, 29, 33);
    const Color Brown(131, 84, 50);
    const Color Red(176, 46, 38);
    const Color Orange(249, 128, 29);
    const Color Yellow(254, 216, 61);
    const Color Lime(128, 199, 31);
    const Color Green(94, 124, 22);
    const Color Cyan(22, 156, 156);
    const Color LightBlue(58, 179, 218);
    const Color Blue(60, 68, 170);
    const Color Purple(137, 50, 184);
    const Color Magenta(199, 78, 189);
    const Color Pink(243, 139, 170);

    const std::vector<Color> Swatches = {
        White, LightGray, Gray, Black,
        Brown, Red, Orange, Yellow,
        Lime, Green, Cyan, LightBlue,
        Blue, Purple, Magenta, Pink
    };
}

struct Point {
    int x, y;
    Point() : x(0), y(0) {}
    Point(int x, int y) : x(x), y(y) {}
    bool operator==(const Point& o) const { return x == o.x && y == o.y; }
};

struct Pixel {
    int x, y;
    Color color;
    Pixel() : x(0), y(0), color(Palette::Black) {}
    Pixel(int x, int y, Color c) : x(x), y(y), color(c) {}
};

struct StepRecord {
    int stepIndex = 0;
    std::string type;
    int k = 0;
    double exactX = 0.0, exactY = 0.0;
    std::string xIncStr = "-", yIncStr = "-";
    int prevX = 0, prevY = 0;
    std::string pkStr = "-";
    std::string condition = "-";
    std::string nextPkStr = "-";
    int plotX = 0, plotY = 0;
    std::vector<Point> octants;
    std::vector<Pixel> pixels;
    std::string description;
};

// ----------------------------------------------------------------------------
// 2. Pixel Canvas
// ----------------------------------------------------------------------------

class Canvas {
public:
    int width, height;
    std::vector<Color> buffer;
    std::vector<Color> baseSnapshot;
    std::vector<std::vector<Color>> undoStack;

    Canvas(int w = 32, int h = 32, Color bg = Palette::White) : width(w), height(h) {
        buffer.assign(w * h, bg);
        baseSnapshot = buffer;
        saveState();
    }

    void reset(int w, int h, Color bg = Palette::White) {
        width = w;
        height = h;
        buffer.assign(w * h, bg);
        baseSnapshot = buffer;
        undoStack.clear();
        saveState();
    }

    void clear(Color bg = Palette::White) {
        std::fill(buffer.begin(), buffer.end(), bg);
        baseSnapshot = buffer;
    }

    bool inBounds(int x, int y) const {
        return (x >= 0 && x < width && y >= 0 && y < height);
    }

    void setPixel(int x, int y, Color c, int brushSize = 1) {
        if (brushSize <= 1) {
            if (inBounds(x, y)) buffer[y * width + x] = c;
        } else {
            int half = brushSize / 2;
            for (int dy = -half; dy < -half + brushSize; dy++) {
                for (int dx = -half; dx < -half + brushSize; dx++) {
                    int nx = x + dx;
                    int ny = y + dy;
                    if (inBounds(nx, ny)) buffer[ny * width + nx] = c;
                }
            }
        }
    }

    Color getPixel(int x, int y) const {
        if (inBounds(x, y)) return buffer[y * width + x];
        return Palette::White;
    }

    void takeBaseSnapshot() { baseSnapshot = buffer; }
    void restoreBaseSnapshot() { buffer = baseSnapshot; }

    void saveState() {
        if (undoStack.size() >= 20) undoStack.erase(undoStack.begin());
        undoStack.push_back(buffer);
    }

    bool undo() {
        if (undoStack.size() > 1) {
            undoStack.pop_back();
            buffer = undoStack.back();
            baseSnapshot = buffer;
            return true;
        }
        return false;
    }

    bool saveToBMP(const std::string& filename) const {
        std::ofstream f(filename, std::ios::binary);
        if (!f.is_open()) return false;

        const int rowStride = (width * 3 + 3) & ~3;
        const uint32_t imageSize = rowStride * height;
        const uint32_t fileSize = 54 + imageSize;

        uint8_t header[54] = {
            'B', 'M',
            static_cast<uint8_t>(fileSize & 0xFF),
            static_cast<uint8_t>((fileSize >> 8) & 0xFF),
            static_cast<uint8_t>((fileSize >> 16) & 0xFF),
            static_cast<uint8_t>((fileSize >> 24) & 0xFF),
            0, 0, 0, 0,
            54, 0, 0, 0,
            40, 0, 0, 0,
            static_cast<uint8_t>(width & 0xFF),
            static_cast<uint8_t>((width >> 8) & 0xFF),
            static_cast<uint8_t>((width >> 16) & 0xFF),
            static_cast<uint8_t>((width >> 24) & 0xFF),
            static_cast<uint8_t>(height & 0xFF),
            static_cast<uint8_t>((height >> 8) & 0xFF),
            static_cast<uint8_t>((height >> 16) & 0xFF),
            static_cast<uint8_t>((height >> 24) & 0xFF),
            1, 0, 24, 0, 0, 0, 0, 0,
            static_cast<uint8_t>(imageSize & 0xFF),
            static_cast<uint8_t>((imageSize >> 8) & 0xFF),
            static_cast<uint8_t>((imageSize >> 16) & 0xFF),
            static_cast<uint8_t>((imageSize >> 24) & 0xFF),
            0x13, 0x0B, 0, 0, 0x13, 0x0B, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        };

        f.write(reinterpret_cast<char*>(header), 54);

        std::vector<uint8_t> rowBuffer(rowStride, 0);
        for (int y = height - 1; y >= 0; y--) {
            int byteIdx = 0;
            for (int x = 0; x < width; x++) {
                Color c = getPixel(x, y);
                rowBuffer[byteIdx++] = c.b;
                rowBuffer[byteIdx++] = c.g;
                rowBuffer[byteIdx++] = c.r;
            }
            while (byteIdx < rowStride) rowBuffer[byteIdx++] = 0;
            f.write(reinterpret_cast<char*>(rowBuffer.data()), rowStride);
        }
        return true;
    }
};

// ----------------------------------------------------------------------------
// 3. Algorithms Implementation
// ----------------------------------------------------------------------------

class CGAlgorithms {
public:
    static std::string formatDouble(double v, int prec = 2) {
        std::ostringstream ss;
        ss << std::fixed << std::setprecision(prec) << v;
        return ss.str();
    }

    static std::vector<StepRecord> ddaLineDetailed(int x0, int y0, int x1, int y1, Color col) {
        std::vector<StepRecord> records;
        int dx = x1 - x0;
        int dy = y1 - y0;
        int steps = std::max(std::abs(dx), std::abs(dy));
        double xInc = (steps == 0) ? 0.0 : static_cast<double>(dx) / steps;
        double yInc = (steps == 0) ? 0.0 : static_cast<double>(dy) / steps;
        double x = x0, y = y0;

        for (int k = 0; k <= steps; k++) {
            int px = static_cast<int>(std::round(x));
            int py = static_cast<int>(std::round(y));

            StepRecord rec;
            rec.stepIndex = k;
            rec.type = "dda_line";
            rec.k = k;
            rec.exactX = x;
            rec.exactY = y;
            rec.xIncStr = (k == 0) ? "-" : ((xInc >= 0 ? "+" : "") + formatDouble(xInc, 2));
            rec.yIncStr = (k == 0) ? "-" : ((yInc >= 0 ? "+" : "") + formatDouble(yInc, 2));
            rec.plotX = px;
            rec.plotY = py;
            rec.pixels.push_back(Pixel(px, py, col));

            std::ostringstream oss;
            oss << "Step k=" << k << ": Exact (" << formatDouble(x, 2) << ", " << formatDouble(y, 2)
                << ") | Inc: dx=" << formatDouble(xInc, 2) << ", dy=" << formatDouble(yInc, 2)
                << " | Plotted: (" << px << ", " << py << ")";
            rec.description = oss.str();
            records.push_back(rec);

            x += xInc;
            y += yInc;
        }
        return records;
    }

    static std::vector<StepRecord> bresenhamLineDetailed(int x0, int y0, int x1, int y1, Color col) {
        std::vector<StepRecord> records;
        int dx = std::abs(x1 - x0);
        int dy = std::abs(y1 - y0);
        int sx = (x0 < x1) ? 1 : -1;
        int sy = (y0 < y1) ? 1 : -1;
        int currX = x0, currY = y0;

        if (dx >= dy) {
            int pk = 2 * dy - dx;
            for (int k = 0; k <= dx; k++) {
                int prevX = currX, prevY = currY;
                int plotX = currX, plotY = currY;
                std::string nextPkStr = "-", condition = "-";
                int nextPk = 0;

                if (k < dx) {
                    if (pk < 0) {
                        condition = "pk < 0";
                        nextPk = pk + 2 * dy;
                        nextPkStr = std::to_string(nextPk);
                        currX += sx;
                    } else {
                        condition = "pk >= 0";
                        nextPk = pk + 2 * dy - 2 * dx;
                        nextPkStr = std::to_string(nextPk);
                        currX += sx;
                        currY += sy;
                    }
                }

                StepRecord rec;
                rec.stepIndex = k;
                rec.type = "bresenham_line";
                rec.k = k;
                rec.prevX = prevX;
                rec.prevY = prevY;
                rec.pkStr = std::to_string(pk);
                rec.condition = condition;
                rec.plotX = plotX;
                rec.plotY = plotY;
                rec.nextPkStr = nextPkStr;
                rec.pixels.push_back(Pixel(plotX, plotY, col));

                std::ostringstream oss;
                oss << "Step k=" << k << ": Point (" << plotX << ", " << plotY
                    << ") | Decision pk=" << pk << " (" << condition << ") -> next pk+1=" << nextPkStr;
                rec.description = oss.str();
                records.push_back(rec);
                pk = nextPk;
            }
        } else {
            int pk = 2 * dx - dy;
            for (int k = 0; k <= dy; k++) {
                int prevX = currX, prevY = currY;
                int plotX = currX, plotY = currY;
                std::string nextPkStr = "-", condition = "-";
                int nextPk = 0;

                if (k < dy) {
                    if (pk < 0) {
                        condition = "pk < 0";
                        nextPk = pk + 2 * dx;
                        nextPkStr = std::to_string(nextPk);
                        currY += sy;
                    } else {
                        condition = "pk >= 0";
                        nextPk = pk + 2 * dx - 2 * dy;
                        nextPkStr = std::to_string(nextPk);
                        currX += sx;
                        currY += sy;
                    }
                }

                StepRecord rec;
                rec.stepIndex = k;
                rec.type = "bresenham_line";
                rec.k = k;
                rec.prevX = prevX;
                rec.prevY = prevY;
                rec.pkStr = std::to_string(pk);
                rec.condition = condition;
                rec.plotX = plotX;
                rec.plotY = plotY;
                rec.nextPkStr = nextPkStr;
                rec.pixels.push_back(Pixel(plotX, plotY, col));

                std::ostringstream oss;
                oss << "Step k=" << k << ": Point (" << plotX << ", " << plotY
                    << ") | Decision pk=" << pk << " (" << condition << ") -> next pk+1=" << nextPkStr;
                rec.description = oss.str();
                records.push_back(rec);
                pk = nextPk;
            }
        }
        return records;
    }

    static std::vector<StepRecord> midpointCircleDetailed(int xc, int yc, int r, Color col) {
        std::vector<StepRecord> records;
        if (r <= 0) {
            StepRecord rec;
            rec.stepIndex = 0;
            rec.type = "circle_midpoint";
            rec.k = 0;
            rec.octants.push_back(Point(xc, yc));
            rec.pixels.push_back(Pixel(xc, yc, col));
            rec.description = "Midpoint Circle r=0: Center (" + std::to_string(xc) + ", " + std::to_string(yc) + ")";
            records.push_back(rec);
            return records;
        }

        int x = 0, y = r, pk = 1 - r, k = 0;
        while (x <= y) {
            std::vector<Point> octants = {
                Point(xc + x, yc + y), Point(xc - x, yc + y),
                Point(xc + x, yc - y), Point(xc - x, yc - y),
                Point(xc + y, yc + x), Point(xc - y, yc + x),
                Point(xc + y, yc - x), Point(xc - y, yc - x)
            };

            int nextPk = 0, nextX = x, nextY = y;
            std::string condition = "-", nextPkStr = "-";

            if (x < y) {
                if (pk < 0) {
                    condition = "pk < 0";
                    nextPk = pk + 2 * (x + 1) + 1;
                    nextPkStr = std::to_string(nextPk);
                    nextX = x + 1; nextY = y;
                } else {
                    condition = "pk >= 0";
                    nextPk = pk + 2 * (x + 1) + 1 - 2 * (y - 1);
                    nextPkStr = std::to_string(nextPk);
                    nextX = x + 1; nextY = y - 1;
                }
            } else {
                condition = "Stop (x >= y)";
                nextX = x + 1; nextY = y;
            }

            StepRecord rec;
            rec.stepIndex = k;
            rec.type = "circle_midpoint";
            rec.k = k;
            rec.prevX = x; rec.prevY = y;
            rec.pkStr = std::to_string(pk);
            rec.condition = condition;
            rec.nextPkStr = nextPkStr;
            rec.octants = octants;
            for (const auto& pt : octants) rec.pixels.push_back(Pixel(pt.x, pt.y, col));

            std::ostringstream oss;
            oss << "Iteration k=" << k << ": (" << x << ", " << y << ") | pk=" << pk
                << " (" << condition << ") -> next pk+1=" << nextPkStr << " | 8 Octants";
            rec.description = oss.str();
            records.push_back(rec);

            k++; x = nextX; y = nextY; pk = nextPk;
        }
        return records;
    }

    static std::vector<StepRecord> bresenhamCircleDetailed(int xc, int yc, int r, Color col) {
        std::vector<StepRecord> records;
        if (r <= 0) {
            StepRecord rec;
            rec.stepIndex = 0;
            rec.type = "circle_bresenham";
            rec.k = 0;
            rec.octants.push_back(Point(xc, yc));
            rec.pixels.push_back(Pixel(xc, yc, col));
            rec.description = "Bresenham Circle r=0: Center (" + std::to_string(xc) + ", " + std::to_string(yc) + ")";
            records.push_back(rec);
            return records;
        }

        int x = 0, y = r, dk = 3 - 2 * r, k = 0;
        while (x <= y) {
            std::vector<Point> octants = {
                Point(xc + x, yc + y), Point(xc - x, yc + y),
                Point(xc + x, yc - y), Point(xc - x, yc - y),
                Point(xc + y, yc + x), Point(xc - y, yc + x),
                Point(xc + y, yc - x), Point(xc - y, yc - x)
            };

            int nextDk = 0, nextX = x, nextY = y;
            std::string condition = "-", nextDkStr = "-";

            if (x < y) {
                if (dk < 0) {
                    condition = "dk < 0";
                    nextDk = dk + 4 * x + 6;
                    nextDkStr = std::to_string(nextDk);
                    nextX = x + 1; nextY = y;
                } else {
                    condition = "dk >= 0";
                    nextDk = dk + 4 * (x - y) + 10;
                    nextDkStr = std::to_string(nextDk);
                    nextX = x + 1; nextY = y - 1;
                }
            } else {
                condition = "Stop (x >= y)";
                nextX = x + 1; nextY = y;
            }

            StepRecord rec;
            rec.stepIndex = k;
            rec.type = "circle_bresenham";
            rec.k = k;
            rec.prevX = x; rec.prevY = y;
            rec.pkStr = std::to_string(dk);
            rec.condition = condition;
            rec.nextPkStr = nextDkStr;
            rec.octants = octants;
            for (const auto& pt : octants) rec.pixels.push_back(Pixel(pt.x, pt.y, col));

            std::ostringstream oss;
            oss << "Iteration k=" << k << ": (" << x << ", " << y << ") | dk=" << dk
                << " (" << condition << ") -> next dk+1=" << nextDkStr << " | 8 Octants";
            rec.description = oss.str();
            records.push_back(rec);

            k++; x = nextX; y = nextY; dk = nextDk;
        }
        return records;
    }

    static std::vector<Point> getPolygonVertices(int xc, int yc, int radius, int sides, double startAngle = 0.0) {
        sides = std::max(3, sides);
        std::vector<Point> vertices;
        const double PI = 3.14159265358979323846;
        double angleStep = (2.0 * PI) / sides;
        for (int i = 0; i < sides; i++) {
            double a = startAngle + i * angleStep;
            int vx = static_cast<int>(std::round(xc + radius * std::cos(a)));
            int vy = static_cast<int>(std::round(yc + radius * std::sin(a)));
            vertices.push_back(Point(vx, vy));
        }
        return vertices;
    }

    static std::vector<StepRecord> boundaryFill(Canvas& canvas, int sx, int sy, Color fillCol, Color boundCol, int connectivity = 4) {
        std::vector<StepRecord> steps;
        if (!canvas.inBounds(sx, sy)) return steps;
        Color current = canvas.getPixel(sx, sy);
        if (current == fillCol || current == boundCol) return steps;

        std::stack<Point> st;
        st.push(Point(sx, sy));
        std::vector<std::vector<bool>> visited(canvas.height, std::vector<bool>(canvas.width, false));
        visited[sy][sx] = true;

        const std::vector<Point> dirs4 = { {0, -1}, {0, 1}, {-1, 0}, {1, 0} };
        const std::vector<Point> dirs8 = {
            {0, -1}, {0, 1}, {-1, 0}, {1, 0},
            {-1, -1}, {1, -1}, {-1, 1}, {1, 1}
        };
        const auto& dirs = (connectivity == 8) ? dirs8 : dirs4;

        int stepIdx = 0;
        while (!st.empty()) {
            Point pt = st.top(); st.pop();
            Color c = canvas.getPixel(pt.x, pt.y);
            if (c != boundCol && c != fillCol) {
                canvas.setPixel(pt.x, pt.y, fillCol);
                StepRecord rec;
                rec.stepIndex = stepIdx++;
                rec.type = "boundary";
                rec.plotX = pt.x; rec.plotY = pt.y;
                rec.pixels.push_back(Pixel(pt.x, pt.y, fillCol));
                rec.description = "Boundary Fill: (" + std::to_string(pt.x) + ", " + std::to_string(pt.y) + ")";
                steps.push_back(rec);

                for (const auto& d : dirs) {
                    int nx = pt.x + d.x, ny = pt.y + d.y;
                    if (canvas.inBounds(nx, ny) && !visited[ny][nx]) {
                        Color nc = canvas.getPixel(nx, ny);
                        if (nc != boundCol && nc != fillCol) {
                            visited[ny][nx] = true;
                            st.push(Point(nx, ny));
                        }
                    }
                }
            }
        }
        return steps;
    }

    struct Edge { int yMax; double xCurrent, invSlope; };
    static std::vector<StepRecord> scanlinePolygonFill(Canvas& canvas, const std::vector<Point>& vertices, Color fillCol) {
        std::vector<StepRecord> steps;
        if (vertices.size() < 3) return steps;

        int minY = canvas.height, maxY = 0;
        for (const auto& v : vertices) {
            minY = std::min(minY, v.y);
            maxY = std::max(maxY, v.y);
        }
        minY = std::max(0, minY);
        maxY = std::min(canvas.height - 1, maxY);

        std::vector<std::vector<Edge>> edgeTable(canvas.height);
        size_t n = vertices.size();
        for (size_t i = 0; i < n; i++) {
            Point p1 = vertices[i], p2 = vertices[(i + 1) % n];
            if (p1.y == p2.y) continue;
            Point lower = (p1.y < p2.y) ? p1 : p2;
            Point upper = (p1.y < p2.y) ? p2 : p1;
            Edge e;
            e.yMax = upper.y;
            e.xCurrent = lower.x;
            e.invSlope = static_cast<double>(upper.x - lower.x) / (upper.y - lower.y);
            if (lower.y >= 0 && lower.y < canvas.height) edgeTable[lower.y].push_back(e);
        }

        std::vector<Edge> AET;
        int stepIdx = 0;
        for (int y = minY; y <= maxY; y++) {
            for (const auto& e : edgeTable[y]) AET.push_back(e);
            AET.erase(std::remove_if(AET.begin(), AET.end(), [y](const Edge& e) { return e.yMax <= y; }), AET.end());
            std::sort(AET.begin(), AET.end(), [](const Edge& a, const Edge& b) { return a.xCurrent < b.xCurrent; });

            StepRecord rec;
            rec.stepIndex = stepIdx++;
            rec.type = "scanline_poly";
            std::ostringstream oss;
            oss << "Scanline y=" << y << ": ";

            for (size_t i = 0; i + 1 < AET.size(); i += 2) {
                int xStart = std::max(0, static_cast<int>(std::round(AET[i].xCurrent)));
                int xEnd = std::min(canvas.width - 1, static_cast<int>(std::round(AET[i + 1].xCurrent)));
                oss << "[" << xStart << ".." << xEnd << "] ";
                for (int x = xStart; x <= xEnd; x++) {
                    canvas.setPixel(x, y, fillCol);
                    rec.pixels.push_back(Pixel(x, y, fillCol));
                }
            }
            rec.description = oss.str();
            steps.push_back(rec);
            for (auto& e : AET) e.xCurrent += e.invSlope;
        }
        return steps;
    }
};

// ----------------------------------------------------------------------------
// 4. GUI Window Application State & Engine
// ----------------------------------------------------------------------------

enum ToolType { TOOL_PENCIL, TOOL_LINE, TOOL_CIRCLE, TOOL_POLYGON, TOOL_FILL, TOOL_ERASER };
enum LineAlgorithm { LINE_DDA, LINE_BRESENHAM };
enum CircleAlgorithm { CIRCLE_MIDPOINT, CIRCLE_BRESENHAM };
enum FillAlgorithm { FILL_BOUNDARY, FILL_FLOOD, FILL_SCANLINE };

class PaintApp {
public:
    HWND hwndMain = NULL;
    HWND hwndCanvasArea = NULL;
    HWND hwndTrackbar = NULL;
    HWND hwndListView = NULL;
    HWND hwndStepInfo = NULL;

    Canvas canvas;
    ToolType currentTool = TOOL_PENCIL;
    LineAlgorithm lineAlgo = LINE_DDA;
    CircleAlgorithm circleAlgo = CIRCLE_MIDPOINT;
    FillAlgorithm fillAlgo = FILL_BOUNDARY;
    int polygonSides = 5;
    int brushSize = 1;

    Color primaryColor = Palette::Black;
    Color secondaryColor = Palette::White;

    bool isDrawing = false;
    int startX = 0, startY = 0;
    int currentCursorX = 0, currentCursorY = 0;
    std::vector<Point> lastPolyVertices;

    // Visualizer State
    std::vector<StepRecord> recordedSteps;
    int currentStep = 0;
    bool isPlaying = false;
    int playSpeedMs = 150;
    bool soloTable = false;

    // Zoom & display
    int zoomFactor = 15; // 15 screen pixels per canvas pixel

    PaintApp() : canvas(32, 32) {}

    void setTool(ToolType t) {
        currentTool = t;
        InvalidateRect(hwndMain, NULL, TRUE);
    }

    void startDrawing(int cx, int cy, bool isRightClick) {
        isDrawing = true;
        startX = cx;
        startY = cy;
        currentCursorX = cx;
        currentCursorY = cy;

        // If a previous shape visualization was active, commit it fully
        if (!recordedSteps.empty() && currentStep < static_cast<int>(recordedSteps.size()) - 1) {
            goToStep(static_cast<int>(recordedSteps.size()) - 1);
            canvas.saveState();
        }

        canvas.takeBaseSnapshot();
        Color col = isRightClick ? secondaryColor : primaryColor;

        if (currentTool == TOOL_PENCIL || currentTool == TOOL_ERASER) {
            Color drawCol = (currentTool == TOOL_ERASER) ? secondaryColor : col;
            canvas.setPixel(cx, cy, drawCol, brushSize);
            InvalidateRect(hwndCanvasArea, NULL, FALSE);
        } else if (currentTool == TOOL_FILL) {
            isDrawing = false;
            executeFill(cx, cy, col);
        }
    }

    void dragDrawing(int cx, int cy) {
        if (!isDrawing) return;
        currentCursorX = cx;
        currentCursorY = cy;

        Color col = primaryColor;
        if (currentTool == TOOL_PENCIL || currentTool == TOOL_ERASER) {
            Color drawCol = (currentTool == TOOL_ERASER) ? secondaryColor : col;
            auto linePts = CGAlgorithms::bresenhamLineDetailed(startX, startY, cx, cy, drawCol);
            for (const auto& s : linePts) canvas.setPixel(s.plotX, s.plotY, drawCol, brushSize);
            startX = cx; startY = cy;
            InvalidateRect(hwndCanvasArea, NULL, FALSE);
        } else if (currentTool == TOOL_LINE || currentTool == TOOL_CIRCLE || currentTool == TOOL_POLYGON) {
            // Live Preview: restore clean base snapshot
            canvas.restoreBaseSnapshot();
            if (currentTool == TOOL_LINE) {
                auto pts = (lineAlgo == LINE_DDA) ?
                    CGAlgorithms::ddaLineDetailed(startX, startY, cx, cy, col) :
                    CGAlgorithms::bresenhamLineDetailed(startX, startY, cx, cy, col);
                for (const auto& s : pts) canvas.setPixel(s.plotX, s.plotY, col, brushSize);
            } else if (currentTool == TOOL_CIRCLE) {
                int dx = cx - startX, dy = cy - startY;
                int r = static_cast<int>(std::round(std::sqrt(dx * dx + dy * dy)));
                auto pts = (circleAlgo == CIRCLE_MIDPOINT) ?
                    CGAlgorithms::midpointCircleDetailed(startX, startY, r, col) :
                    CGAlgorithms::bresenhamCircleDetailed(startX, startY, r, col);
                for (const auto& s : pts) {
                    for (const auto& px : s.pixels) canvas.setPixel(px.x, px.y, col, brushSize);
                }
            } else if (currentTool == TOOL_POLYGON) {
                int dx = cx - startX, dy = cy - startY;
                int r = std::max(1, static_cast<int>(std::round(std::sqrt(dx * dx + dy * dy))));
                double angle = std::atan2(dy, dx);
                auto vertices = CGAlgorithms::getPolygonVertices(startX, startY, r, polygonSides, angle);
                for (size_t i = 0; i < vertices.size(); i++) {
                    Point p1 = vertices[i], p2 = vertices[(i + 1) % vertices.size()];
                    auto edge = CGAlgorithms::bresenhamLineDetailed(p1.x, p1.y, p2.x, p2.y, col);
                    for (const auto& s : edge) canvas.setPixel(s.plotX, s.plotY, col, brushSize);
                }
            }
            InvalidateRect(hwndCanvasArea, NULL, FALSE);
        }
    }

    void finishDrawing(int cx, int cy, bool isRightClick) {
        if (!isDrawing) return;
        isDrawing = false;
        canvas.restoreBaseSnapshot(); // Clean canvas before finalizing

        Color col = isRightClick ? secondaryColor : primaryColor;

        if (currentTool == TOOL_LINE) {
            lastPolyVertices.clear();
            auto result = (lineAlgo == LINE_DDA) ?
                CGAlgorithms::ddaLineDetailed(startX, startY, cx, cy, col) :
                CGAlgorithms::bresenhamLineDetailed(startX, startY, cx, cy, col);
            setupVisualizer(result);
        } else if (currentTool == TOOL_CIRCLE) {
            lastPolyVertices.clear();
            int dx = cx - startX, dy = cy - startY;
            int r = static_cast<int>(std::round(std::sqrt(dx * dx + dy * dy)));
            auto result = (circleAlgo == CIRCLE_MIDPOINT) ?
                CGAlgorithms::midpointCircleDetailed(startX, startY, r, col) :
                CGAlgorithms::bresenhamCircleDetailed(startX, startY, r, col);
            setupVisualizer(result);
        } else if (currentTool == TOOL_POLYGON) {
            int dx = cx - startX, dy = cy - startY;
            int r = std::max(1, static_cast<int>(std::round(std::sqrt(dx * dx + dy * dy))));
            double angle = std::atan2(dy, dx);
            lastPolyVertices = CGAlgorithms::getPolygonVertices(startX, startY, r, polygonSides, angle);
            for (size_t i = 0; i < lastPolyVertices.size(); i++) {
                Point p1 = lastPolyVertices[i], p2 = lastPolyVertices[(i + 1) % lastPolyVertices.size()];
                auto edge = CGAlgorithms::bresenhamLineDetailed(p1.x, p1.y, p2.x, p2.y, col);
                for (const auto& s : edge) canvas.setPixel(s.plotX, s.plotY, col, brushSize);
            }
            canvas.saveState();
            InvalidateRect(hwndCanvasArea, NULL, FALSE);
        } else if (currentTool == TOOL_PENCIL || currentTool == TOOL_ERASER) {
            canvas.saveState();
            InvalidateRect(hwndCanvasArea, NULL, FALSE);
        }
    }

    void executeFill(int sx, int sy, Color col) {
        canvas.takeBaseSnapshot();
        if (fillAlgo == FILL_SCANLINE && lastPolyVertices.size() >= 3) {
            auto steps = CGAlgorithms::scanlinePolygonFill(canvas, lastPolyVertices, col);
            setupVisualizer(steps);
            lastPolyVertices.clear();
        } else {
            auto steps = CGAlgorithms::boundaryFill(canvas, sx, sy, col, Palette::Black, 4);
            setupVisualizer(steps);
        }
    }

    void setupVisualizer(const std::vector<StepRecord>& steps) {
        stopPlayback();
        recordedSteps = steps;
        currentStep = 0;
        int maxStep = std::max(0, static_cast<int>(steps.size()) - 1);

        if (hwndTrackbar) {
            SendMessage(hwndTrackbar, TBM_SETRANGEMIN, TRUE, 0);
            SendMessage(hwndTrackbar, TBM_SETRANGEMAX, TRUE, maxStep);
            SendMessage(hwndTrackbar, TBM_SETPOS, TRUE, 0);
        }

        updateListViewHeaders();
        populateListView();
        goToStep(0);
        startPlayback();
    }

    // Scrub or step to iteration k:
    // Plotted on screen: ONLY the points up to iteration stepIndex!
    void goToStep(int stepIndex) {
        if (recordedSteps.empty()) return;
        stepIndex = std::max(0, std::min(static_cast<int>(recordedSteps.size()) - 1, stepIndex));
        currentStep = stepIndex;

        if (hwndTrackbar) {
            SendMessage(hwndTrackbar, TBM_SETPOS, TRUE, stepIndex);
        }

        // Restore clean base canvas before shape was started
        canvas.restoreBaseSnapshot();

        // Replay pixels strictly up to stepIndex
        for (int i = 0; i <= stepIndex; i++) {
            const auto& s = recordedSteps[i];
            for (const auto& px : s.pixels) {
                canvas.setPixel(px.x, px.y, px.color, brushSize);
            }
        }

        updateStepInfo();
        syncListView(stepIndex);
        InvalidateRect(hwndCanvasArea, NULL, FALSE);
    }

    void startPlayback() {
        if (recordedSteps.empty()) return;
        isPlaying = true;
        if (currentStep >= static_cast<int>(recordedSteps.size()) - 1) {
            goToStep(0);
        }
        SetTimer(hwndMain, 1, playSpeedMs, NULL);
    }

    void stopPlayback() {
        isPlaying = false;
        KillTimer(hwndMain, 1);
    }

    void updateStepInfo() {
        if (!hwndStepInfo || recordedSteps.empty()) return;
        std::wostringstream wss;
        wss << L"Iteration " << currentStep << L" / " << (recordedSteps.size() - 1) << L":\n";
        std::string desc = recordedSteps[currentStep].description;
        wss << std::wstring(desc.begin(), desc.end());
        SetWindowText(hwndStepInfo, wss.str().c_str());
    }

    void updateListViewHeaders() {
        if (!hwndListView || recordedSteps.empty()) return;
        SendMessage(hwndListView, LVM_DELETEALLITEMS, 0, 0);
        while (SendMessage(hwndListView, LVM_DELETECOLUMN, 0, 0));

        std::string sType = recordedSteps[0].type;
        std::vector<std::pair<std::wstring, int>> cols;

        if (sType == "dda_line") {
            cols = { {L"k", 35}, {L"Exact X", 60}, {L"Exact Y", 60}, {L"Δx", 45}, {L"Δy", 45}, {L"Plot X", 50}, {L"Plot Y", 50} };
        } else if (sType == "bresenham_line") {
            cols = { {L"k", 35}, {L"Point (X,Y)", 75}, {L"pk", 45}, {L"Condition", 70}, {L"Plot (X,Y)", 75}, {L"next pk+1", 65} };
        } else if (sType == "circle_midpoint" || sType == "circle_bresenham") {
            cols = { {L"k", 30}, {L"(x,y)", 55}, {L"pk", 40}, {L"Cond.", 65}, {L"next P", 50},
                     {L"Oct 1", 55}, {L"Oct 2", 55}, {L"Oct 3", 55}, {L"Oct 4", 55} };
        } else {
            cols = { {L"Step", 40}, {L"Description", 250} };
        }

        for (size_t i = 0; i < cols.size(); i++) {
            LVCOLUMN lvc;
            lvc.mask = LVCF_TEXT | LVCF_WIDTH | LVCF_SUBITEM;
            lvc.cx = cols[i].second;
            lvc.pszText = const_cast<LPWSTR>(cols[i].first.c_str());
            SendMessage(hwndListView, LVM_INSERTCOLUMN, i, (LPARAM)&lvc);
        }
    }

    void populateListView() {
        if (!hwndListView || recordedSteps.empty()) return;
        SendMessage(hwndListView, LVM_DELETEALLITEMS, 0, 0);

        for (size_t i = 0; i < recordedSteps.size(); i++) {
            LVITEM lvi;
            lvi.mask = LVIF_TEXT;
            lvi.iItem = static_cast<int>(i);
            lvi.iSubItem = 0;
            std::wstring kStr = std::to_wstring(recordedSteps[i].k);
            lvi.pszText = const_cast<LPWSTR>(kStr.c_str());
            SendMessage(hwndListView, LVM_INSERTITEM, 0, (LPARAM)&lvi);

            // Populate dummy dashes initially
            for (int sub = 1; sub < 10; sub++) {
                ListView_SetItemText(hwndListView, i, sub, const_cast<LPWSTR>(L"—"));
            }
        }
    }

    void syncListView(int stepIndex) {
        if (!hwndListView || recordedSteps.empty()) return;
        std::string sType = recordedSteps[0].type;

        for (size_t i = 0; i < recordedSteps.size(); i++) {
            const auto& s = recordedSteps[i];
            bool reached = (static_cast<int>(i) <= stepIndex);

            if (reached) {
                if (sType == "dda_line") {
                    std::wstring exX = s2ws(CGAlgorithms::formatDouble(s.exactX, 2));
                    std::wstring exY = s2ws(CGAlgorithms::formatDouble(s.exactY, 2));
                    std::wstring dx = s2ws(s.xIncStr);
                    std::wstring dy = s2ws(s.yIncStr);
                    std::wstring px = std::to_wstring(s.plotX);
                    std::wstring py = std::to_wstring(s.plotY);
                    ListView_SetItemText(hwndListView, i, 1, const_cast<LPWSTR>(exX.c_str()));
                    ListView_SetItemText(hwndListView, i, 2, const_cast<LPWSTR>(exY.c_str()));
                    ListView_SetItemText(hwndListView, i, 3, const_cast<LPWSTR>(dx.c_str()));
                    ListView_SetItemText(hwndListView, i, 4, const_cast<LPWSTR>(dy.c_str()));
                    ListView_SetItemText(hwndListView, i, 5, const_cast<LPWSTR>(px.c_str()));
                    ListView_SetItemText(hwndListView, i, 6, const_cast<LPWSTR>(py.c_str()));
                } else if (sType == "bresenham_line") {
                    std::wstring ptPrev = L"(" + std::to_wstring(s.prevX) + L"," + std::to_wstring(s.prevY) + L")";
                    std::wstring pk = s2ws(s.pkStr);
                    std::wstring cond = s2ws(s.condition);
                    std::wstring ptPlot = L"(" + std::to_wstring(s.plotX) + L"," + std::to_wstring(s.plotY) + L")";
                    std::wstring nextPk = s2ws(s.nextPkStr);
                    ListView_SetItemText(hwndListView, i, 1, const_cast<LPWSTR>(ptPrev.c_str()));
                    ListView_SetItemText(hwndListView, i, 2, const_cast<LPWSTR>(pk.c_str()));
                    ListView_SetItemText(hwndListView, i, 3, const_cast<LPWSTR>(cond.c_str()));
                    ListView_SetItemText(hwndListView, i, 4, const_cast<LPWSTR>(ptPlot.c_str()));
                    ListView_SetItemText(hwndListView, i, 5, const_cast<LPWSTR>(nextPk.c_str()));
                } else if (sType == "circle_midpoint" || sType == "circle_bresenham") {
                    std::wstring xy = L"(" + std::to_wstring(s.prevX) + L"," + std::to_wstring(s.prevY) + L")";
                    std::wstring pk = s2ws(s.pkStr);
                    std::wstring cond = s2ws(s.condition);
                    std::wstring nextP = s2ws(s.nextPkStr);
                    ListView_SetItemText(hwndListView, i, 1, const_cast<LPWSTR>(xy.c_str()));
                    ListView_SetItemText(hwndListView, i, 2, const_cast<LPWSTR>(pk.c_str()));
                    ListView_SetItemText(hwndListView, i, 3, const_cast<LPWSTR>(cond.c_str()));
                    ListView_SetItemText(hwndListView, i, 4, const_cast<LPWSTR>(nextP.c_str()));
                    for (int o = 0; o < 4 && o < static_cast<int>(s.octants.size()); o++) {
                        std::wstring oct = L"(" + std::to_wstring(s.octants[o].x) + L"," + std::to_wstring(s.octants[o].y) + L")";
                        ListView_SetItemText(hwndListView, i, 5 + o, const_cast<LPWSTR>(oct.c_str()));
                    }
                } else {
                    std::wstring desc = s2ws(s.description);
                    ListView_SetItemText(hwndListView, i, 1, const_cast<LPWSTR>(desc.c_str()));
                }
            } else {
                for (int sub = 1; sub < 10; sub++) {
                    ListView_SetItemText(hwndListView, i, sub, const_cast<LPWSTR>(L"—"));
                }
            }
        }
        ListView_EnsureVisible(hwndListView, stepIndex, FALSE);
    }

private:
    static std::wstring s2ws(const std::string& s) {
        return std::wstring(s.begin(), s.end());
    }
};

static PaintApp g_App;

// ----------------------------------------------------------------------------
// 5. Win32 Custom Controls & Window Procedures
// ----------------------------------------------------------------------------

#define ID_TOOL_PENCIL     1001
#define ID_TOOL_LINE       1002
#define ID_TOOL_CIRCLE     1003
#define ID_TOOL_POLYGON    1004
#define ID_TOOL_FILL       1005
#define ID_TOOL_ERASER     1006

#define ID_BTN_PLAY        2001
#define ID_BTN_FIRST       2002
#define ID_BTN_LAST        2003
#define ID_BTN_PREV        2004
#define ID_BTN_NEXT        2005
#define ID_BTN_SOLO_TABLE  2006

#define ID_CMB_LINE_ALGO   3001
#define ID_CMB_CIRC_ALGO   3002
#define ID_CMB_POLY_SIDES  3003
#define ID_CMB_SPEED       3004

#define ID_CANVAS_AREA     4001
#define ID_TRACKBAR        4002
#define ID_LISTVIEW        4003

LRESULT CALLBACK CanvasWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_PAINT: {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hwnd, &ps);

            RECT clientRect;
            GetClientRect(hwnd, &clientRect);
            int clientW = clientRect.right - clientRect.left;
            int clientH = clientRect.bottom - clientRect.top;

            // Double buffering
            HDC memDC = CreateCompatibleDC(hdc);
            HBITMAP memBM = CreateCompatibleBitmap(hdc, clientW, clientH);
            HBITMAP oldBM = (HBITMAP)SelectObject(memDC, memBM);

            // Fill background
            HBRUSH bgBrush = CreateSolidBrush(RGB(192, 192, 192));
            FillRect(memDC, &clientRect, bgBrush);
            DeleteObject(bgBrush);

            // Canvas positioning (centered)
            int canvasScreenW = g_App.canvas.width * g_App.zoomFactor;
            int canvasScreenH = g_App.canvas.height * g_App.zoomFactor;
            int offsetX = (clientW - canvasScreenW) / 2;
            int offsetY = (clientH - canvasScreenH) / 2;
            offsetX = std::max(10, offsetX);
            offsetY = std::max(10, offsetY);

            // Draw Sunken 3D border around canvas
            RECT borderRect = { offsetX - 2, offsetY - 2, offsetX + canvasScreenW + 2, offsetY + canvasScreenH + 2 };
            DrawEdge(memDC, &borderRect, BDR_SUNKENOUTER | BDR_SUNKENINNER, BF_RECT);

            // Render Pixels
            for (int y = 0; y < g_App.canvas.height; y++) {
                for (int x = 0; x < g_App.canvas.width; x++) {
                    Color c = g_App.canvas.getPixel(x, y);
                    RECT pxRect = {
                        offsetX + x * g_App.zoomFactor,
                        offsetY + y * g_App.zoomFactor,
                        offsetX + (x + 1) * g_App.zoomFactor,
                        offsetY + (y + 1) * g_App.zoomFactor
                    };

                    HBRUSH pxBrush = CreateSolidBrush(c.toCOLORREF());
                    FillRect(memDC, &pxRect, pxBrush);
                    DeleteObject(pxBrush);
                }
            }

            // Draw Thin Pixel Grid lines
            HPEN gridPen = CreatePen(PS_SOLID, 1, RGB(220, 220, 220));
            HPEN oldPen = (HPEN)SelectObject(memDC, gridPen);

            for (int x = 0; x <= g_App.canvas.width; x++) {
                int px = offsetX + x * g_App.zoomFactor;
                MoveToEx(memDC, px, offsetY, NULL);
                LineTo(memDC, px, offsetY + canvasScreenH);
            }
            for (int y = 0; y <= g_App.canvas.height; y++) {
                int py = offsetY + y * g_App.zoomFactor;
                MoveToEx(memDC, offsetX, py, NULL);
                LineTo(memDC, offsetX + canvasScreenW, py);
            }
            SelectObject(memDC, oldPen);
            DeleteObject(gridPen);

            BitBlt(hdc, 0, 0, clientW, clientH, memDC, 0, 0, SRCCOPY);
            SelectObject(memDC, oldBM);
            DeleteObject(memBM);
            DeleteDC(memDC);

            EndPaint(hwnd, &ps);
            return 0;
        }

        case WM_LBUTTONDOWN:
        case WM_RBUTTONDOWN: {
            RECT clientRect;
            GetClientRect(hwnd, &clientRect);
            int canvasScreenW = g_App.canvas.width * g_App.zoomFactor;
            int canvasScreenH = g_App.canvas.height * g_App.zoomFactor;
            int offsetX = std::max(10, (int)(clientRect.right - canvasScreenW) / 2);
            int offsetY = std::max(10, (int)(clientRect.bottom - canvasScreenH) / 2);

            int mouseX = LOWORD(lParam) - offsetX;
            int mouseY = HIWORD(lParam) - offsetY;

            int gridX = mouseX / g_App.zoomFactor;
            int gridY = mouseY / g_App.zoomFactor;

            if (g_App.canvas.inBounds(gridX, gridY)) {
                SetCapture(hwnd);
                g_App.startDrawing(gridX, gridY, msg == WM_RBUTTONDOWN);
            }
            return 0;
        }

        case WM_MOUSEMOVE: {
            RECT clientRect;
            GetClientRect(hwnd, &clientRect);
            int canvasScreenW = g_App.canvas.width * g_App.zoomFactor;
            int canvasScreenH = g_App.canvas.height * g_App.zoomFactor;
            int offsetX = std::max(10, (int)(clientRect.right - canvasScreenW) / 2);
            int offsetY = std::max(10, (int)(clientRect.bottom - canvasScreenH) / 2);

            int mouseX = LOWORD(lParam) - offsetX;
            int mouseY = HIWORD(lParam) - offsetY;

            int gridX = std::max(0, std::min(g_App.canvas.width - 1, mouseX / g_App.zoomFactor));
            int gridY = std::max(0, std::min(g_App.canvas.height - 1, mouseY / g_App.zoomFactor));

            if (g_App.isDrawing) {
                g_App.dragDrawing(gridX, gridY);
            }
            return 0;
        }

        case WM_LBUTTONUP:
        case WM_RBUTTONUP: {
            if (g_App.isDrawing) {
                ReleaseCapture();
                RECT clientRect;
                GetClientRect(hwnd, &clientRect);
                int canvasScreenW = g_App.canvas.width * g_App.zoomFactor;
                int canvasScreenH = g_App.canvas.height * g_App.zoomFactor;
                int offsetX = std::max(10, (int)(clientRect.right - canvasScreenW) / 2);
                int offsetY = std::max(10, (int)(clientRect.bottom - canvasScreenH) / 2);

                int mouseX = LOWORD(lParam) - offsetX;
                int mouseY = HIWORD(lParam) - offsetY;

                int gridX = std::max(0, std::min(g_App.canvas.width - 1, mouseX / g_App.zoomFactor));
                int gridY = std::max(0, std::min(g_App.canvas.height - 1, mouseY / g_App.zoomFactor));

                g_App.finishDrawing(gridX, gridY, msg == WM_RBUTTONUP);
            }
            return 0;
        }
    }
    return DefWindowProc(hwnd, msg, wParam, lParam);
}

// Main Window Procedure
LRESULT CALLBACK MainWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_CREATE: {
            g_App.hwndMain = hwnd;

            // 1. Tool Buttons (Left Panel)
            const wchar_t* tools[] = { L"Pencil", L"Line", L"Circle", L"Polygon", L"Fill", L"Eraser" };
            int toolIds[] = { ID_TOOL_PENCIL, ID_TOOL_LINE, ID_TOOL_CIRCLE, ID_TOOL_POLYGON, ID_TOOL_FILL, ID_TOOL_ERASER };

            for (int i = 0; i < 6; i++) {
                CreateWindow(L"BUTTON", tools[i], WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                    10 + (i % 2) * 55, 10 + (i / 2) * 35, 50, 30, hwnd, (HMENU)(INT_PTR)toolIds[i], NULL, NULL);
            }

            // Algorithm Options Dropdowns
            CreateWindow(L"STATIC", L"Line Algorithm:", WS_CHILD | WS_VISIBLE, 10, 125, 110, 16, hwnd, NULL, NULL, NULL);
            HWND hLineCombo = CreateWindow(L"COMBOBOX", NULL, WS_CHILD | WS_VISIBLE | CBS_DROPDOWNLIST, 10, 145, 110, 100, hwnd, (HMENU)ID_CMB_LINE_ALGO, NULL, NULL);
            SendMessage(hLineCombo, CB_ADDSTRING, 0, (LPARAM)L"DDA Line");
            SendMessage(hLineCombo, CB_ADDSTRING, 0, (LPARAM)L"Bresenham Line");
            SendMessage(hLineCombo, CB_SETCURSEL, 0, 0);

            CreateWindow(L"STATIC", L"Circle Algorithm:", WS_CHILD | WS_VISIBLE, 10, 175, 110, 16, hwnd, NULL, NULL, NULL);
            HWND hCircCombo = CreateWindow(L"COMBOBOX", NULL, WS_CHILD | WS_VISIBLE | CBS_DROPDOWNLIST, 10, 195, 110, 100, hwnd, (HMENU)ID_CMB_CIRC_ALGO, NULL, NULL);
            SendMessage(hCircCombo, CB_ADDSTRING, 0, (LPARAM)L"Midpoint Circle");
            SendMessage(hCircCombo, CB_ADDSTRING, 0, (LPARAM)L"Bresenham Circle");
            SendMessage(hCircCombo, CB_SETCURSEL, 0, 0);

            CreateWindow(L"STATIC", L"Polygon Edges:", WS_CHILD | WS_VISIBLE, 10, 225, 110, 16, hwnd, NULL, NULL, NULL);
            HWND hPolyCombo = CreateWindow(L"COMBOBOX", NULL, WS_CHILD | WS_VISIBLE | CBS_DROPDOWNLIST, 10, 245, 110, 100, hwnd, (HMENU)ID_CMB_POLY_SIDES, NULL, NULL);
            SendMessage(hPolyCombo, CB_ADDSTRING, 0, (LPARAM)L"3: Triangle");
            SendMessage(hPolyCombo, CB_ADDSTRING, 0, (LPARAM)L"4: Square");
            SendMessage(hPolyCombo, CB_ADDSTRING, 0, (LPARAM)L"5: Pentagon");
            SendMessage(hPolyCombo, CB_ADDSTRING, 0, (LPARAM)L"6: Hexagon");
            SendMessage(hPolyCombo, CB_ADDSTRING, 0, (LPARAM)L"8: Octagon");
            SendMessage(hPolyCombo, CB_SETCURSEL, 2, 0);

            // 2. Canvas Child Window (Center)
            g_App.hwndCanvasArea = CreateWindow(L"PaintCanvasClass", NULL, WS_CHILD | WS_VISIBLE | WS_BORDER,
                130, 10, 500, 500, hwnd, (HMENU)ID_CANVAS_AREA, NULL, NULL);

            // Vertical Trackbar / Slider next to canvas
            g_App.hwndTrackbar = CreateWindow(TRACKBAR_CLASS, NULL, WS_CHILD | WS_VISIBLE | TBS_VERT | TBS_AUTOTICKS,
                635, 10, 35, 500, hwnd, (HMENU)ID_TRACKBAR, NULL, NULL);
            SendMessage(g_App.hwndTrackbar, TBM_SETRANGE, TRUE, MAKELPARAM(0, 0));

            // 3. Right Panel (Controls, Decision Table)
            CreateWindow(L"STATIC", L"Iteration Playback:", WS_CHILD | WS_VISIBLE, 680, 10, 150, 18, hwnd, NULL, NULL, NULL);
            CreateWindow(L"BUTTON", L"|<", WS_CHILD | WS_VISIBLE, 680, 30, 35, 26, hwnd, (HMENU)ID_BTN_FIRST, NULL, NULL);
            CreateWindow(L"BUTTON", L"<", WS_CHILD | WS_VISIBLE, 720, 30, 35, 26, hwnd, (HMENU)ID_BTN_PREV, NULL, NULL);
            CreateWindow(L"BUTTON", L"Play", WS_CHILD | WS_VISIBLE, 760, 30, 45, 26, hwnd, (HMENU)ID_BTN_PLAY, NULL, NULL);
            CreateWindow(L"BUTTON", L">", WS_CHILD | WS_VISIBLE, 810, 30, 35, 26, hwnd, (HMENU)ID_BTN_NEXT, NULL, NULL);
            CreateWindow(L"BUTTON", L">|", WS_CHILD | WS_VISIBLE, 850, 30, 35, 26, hwnd, (HMENU)ID_BTN_LAST, NULL, NULL);

            CreateWindow(L"BUTTON", L"[ ] Solo Table", WS_CHILD | WS_VISIBLE, 900, 30, 100, 26, hwnd, (HMENU)ID_BTN_SOLO_TABLE, NULL, NULL);

            // Step Description Box
            g_App.hwndStepInfo = CreateWindow(L"STATIC", L"Ready. Draw on canvas to run step visualizer.",
                WS_CHILD | WS_VISIBLE | WS_BORDER, 680, 65, 320, 45, hwnd, NULL, NULL, NULL);

            // Decision Parameters Table (ListView)
            g_App.hwndListView = CreateWindow(WC_LISTVIEW, NULL,
                WS_CHILD | WS_VISIBLE | LVS_REPORT | LVS_SINGLESEL | WS_BORDER | WS_VSCROLL,
                680, 120, 380, 390, hwnd, (HMENU)ID_LISTVIEW, NULL, NULL);
            ListView_SetExtendedListViewStyle(g_App.hwndListView, LVS_EX_FULLROWSELECT | LVS_EX_GRIDLINES);

            // Initial demo line to populate UI immediately
            auto initialDemo = CGAlgorithms::bresenhamLineDetailed(2, 2, 18, 10, Palette::Black);
            g_App.setupVisualizer(initialDemo);
            g_App.goToStep(6); // Step strictly to iteration 6 as requested!

            return 0;
        }

        case WM_COMMAND: {
            int wmId = LOWORD(wParam);
            switch (wmId) {
                case ID_TOOL_PENCIL:  g_App.setTool(TOOL_PENCIL); break;
                case ID_TOOL_LINE:    g_App.setTool(TOOL_LINE); break;
                case ID_TOOL_CIRCLE:  g_App.setTool(TOOL_CIRCLE); break;
                case ID_TOOL_POLYGON: g_App.setTool(TOOL_POLYGON); break;
                case ID_TOOL_FILL:    g_App.setTool(TOOL_FILL); break;
                case ID_TOOL_ERASER:  g_App.setTool(TOOL_ERASER); break;

                case ID_BTN_PLAY:
                    if (g_App.isPlaying) g_App.stopPlayback();
                    else g_App.startPlayback();
                    SetDlgItemText(hwnd, ID_BTN_PLAY, g_App.isPlaying ? L"Pause" : L"Play");
                    break;
                case ID_BTN_FIRST: g_App.stopPlayback(); g_App.goToStep(0); break;
                case ID_BTN_LAST:  g_App.stopPlayback(); g_App.goToStep(g_App.recordedSteps.size() - 1); break;
                case ID_BTN_PREV:  g_App.stopPlayback(); g_App.goToStep(g_App.currentStep - 1); break;
                case ID_BTN_NEXT:  g_App.stopPlayback(); g_App.goToStep(g_App.currentStep + 1); break;

                case ID_BTN_SOLO_TABLE:
                    g_App.soloTable = !g_App.soloTable;
                    if (g_App.soloTable) {
                        MoveWindow(g_App.hwndListView, 680, 30, 420, 480, TRUE);
                    } else {
                        MoveWindow(g_App.hwndListView, 680, 120, 380, 390, TRUE);
                    }
                    break;

                case ID_CMB_LINE_ALGO:
                    if (HIWORD(wParam) == CBN_SELCHANGE) {
                        int sel = (int)SendMessage((HWND)lParam, CB_GETCURSEL, 0, 0);
                        g_App.lineAlgo = (sel == 0) ? LINE_DDA : LINE_BRESENHAM;
                    }
                    break;

                case ID_CMB_CIRC_ALGO:
                    if (HIWORD(wParam) == CBN_SELCHANGE) {
                        int sel = (int)SendMessage((HWND)lParam, CB_GETCURSEL, 0, 0);
                        g_App.circleAlgo = (sel == 0) ? CIRCLE_MIDPOINT : CIRCLE_BRESENHAM;
                    }
                    break;

                case ID_CMB_POLY_SIDES:
                    if (HIWORD(wParam) == CBN_SELCHANGE) {
                        int sel = (int)SendMessage((HWND)lParam, CB_GETCURSEL, 0, 0);
                        int sidesArr[] = { 3, 4, 5, 6, 8 };
                        if (sel >= 0 && sel < 5) g_App.polygonSides = sidesArr[sel];
                    }
                    break;
            }
            return 0;
        }

        case WM_VSCROLL: {
            if ((HWND)lParam == g_App.hwndTrackbar) {
                g_App.stopPlayback();
                int pos = (int)SendMessage(g_App.hwndTrackbar, TBM_GETPOS, 0, 0);
                g_App.goToStep(pos);
            }
            return 0;
        }

        case WM_TIMER: {
            if (wParam == 1 && g_App.isPlaying) {
                if (g_App.currentStep < static_cast<int>(g_App.recordedSteps.size()) - 1) {
                    g_App.goToStep(g_App.currentStep + 1);
                } else {
                    g_App.stopPlayback();
                    SetDlgItemText(hwnd, ID_BTN_PLAY, L"Play");
                }
            }
            return 0;
        }

        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
    }
    return DefWindowProc(hwnd, msg, wParam, lParam);
}

// ----------------------------------------------------------------------------
// 6. Application Entry Point
// ----------------------------------------------------------------------------

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    INITCOMMONCONTROLSEX icex;
    icex.dwSize = sizeof(INITCOMMONCONTROLSEX);
    icex.dwICC = ICC_WIN95_CLASSES | ICC_LISTVIEW_CLASSES;
    InitCommonControlsEx(&icex);

    // Register Canvas Child Window Class
    WNDCLASSEX wcCanvas = {0};
    wcCanvas.cbSize = sizeof(WNDCLASSEX);
    wcCanvas.lpfnWndProc = CanvasWndProc;
    wcCanvas.hInstance = hInstance;
    wcCanvas.lpszClassName = L"PaintCanvasClass";
    wcCanvas.hCursor = LoadCursor(NULL, IDC_CROSS);
    RegisterClassEx(&wcCanvas);

    // Register Main Window Class
    WNDCLASSEX wc = {0};
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.lpfnWndProc = MainWndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = L"PaintStudioAppClass";
    wc.hbrBackground = (HBRUSH)(COLOR_BTNFACE + 1);
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.lpszMenuName = NULL;
    RegisterClassEx(&wc);

    // Create Main Window (1100x570)
    HWND hwnd = CreateWindowEx(
        0, L"PaintStudioAppClass",
        L"Paint Studio - Computer Graphics Educational Studio (Native C++ GUI)",
        WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_MINIMIZEBOX,
        CW_USEDEFAULT, CW_USEDEFAULT, 1120, 570,
        NULL, NULL, hInstance, NULL
    );

    if (!hwnd) return 0;

    ShowWindow(hwnd, nCmdShow);
    UpdateWindow(hwnd);

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    return (int)msg.wParam;
}
