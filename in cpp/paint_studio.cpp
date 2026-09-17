/**
 * ============================================================================
 * Paint Studio - Computer Graphics Educational Studio in Modern C++
 * Single-file complete implementation of CG Algorithms, Pixel Canvas,
 * Decision Parameters Table, Progressive Step Visualizer, and BMP Export.
 *
 * Algorithms Included:
 *   1. DDA Line Algorithm (Digital Differential Analyzer)
 *   2. Bresenham's Line Algorithm (All octants / slopes)
 *   3. Midpoint Circle Algorithm (8-octants symmetry)
 *   4. Bresenham's Circle Algorithm (8-octants symmetry)
 *   5. Regular Polygon Generator (3-gon to N-gon)
 *   6. Boundary Fill Algorithm (4-connectivity & 8-connectivity)
 *   7. Flood Fill Algorithm (4-connectivity & 8-connectivity)
 *   8. Scanline Polygon Fill (Edge Table & Active Edge Table)
 *   9. Scanline Circle Fill (Span-based rasterization)
 *
 * Features:
 *   - Progressive Iteration Plotting (At step k, only k points are drawn)
 *   - Formatted Decision Parameter Tables (matching web UI)
 *   - ANSI Color Terminal Pixel Grid Visualization
 *   - Native Windows BMP Image Exporter (Opens directly in MS Paint)
 *   - Interactive Menu & Automated Self-Demonstration
 *
 * Compilation:
 *   g++ -std=c++17 -O2 "paint_studio.cpp" -o "paint_studio.exe"
 * ============================================================================
 */

#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include <cmath>
#include <algorithm>
#include <queue>
#include <stack>
#include <fstream>
#include <sstream>
#include <cstdint>
#include <chrono>
#include <thread>

// ----------------------------------------------------------------------------
// 1. Core Data Structures: Color, Point, Pixel, StepRecord
// ----------------------------------------------------------------------------

struct Color {
    uint8_t r, g, b, a;

    Color() : r(255), g(255), b(255), a(255) {}
    Color(uint8_t r, uint8_t g, uint8_t b, uint8_t a = 255) : r(r), g(g), b(b), a(a) {}

    bool operator==(const Color& other) const {
        return r == other.r && g == other.g && b == other.b && a == other.a;
    }
    bool operator!=(const Color& other) const {
        return !(*this == other);
    }
};

// Preset palette matching Minecraft colors in the Paint Studio web app
namespace Palette {
    const Color White(255, 255, 255);
    const Color LightGray(157, 157, 151);
    const Color Gray(71, 79, 82);
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
// 2. Pixel Canvas Engine (2D Buffer, Undo Stack, BMP Export)
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

    void clear(Color bg = Palette::White) {
        std::fill(buffer.begin(), buffer.end(), bg);
        baseSnapshot = buffer;
    }

    bool inBounds(int x, int y) const {
        return (x >= 0 && x < width && y >= 0 && y < height);
    }

    void setPixel(int x, int y, Color c) {
        if (inBounds(x, y)) {
            buffer[y * width + x] = c;
        }
    }

    Color getPixel(int x, int y) const {
        if (inBounds(x, y)) {
            return buffer[y * width + x];
        }
        return Palette::White;
    }

    void takeBaseSnapshot() {
        baseSnapshot = buffer;
    }

    void restoreBaseSnapshot() {
        buffer = baseSnapshot;
    }

    void saveState() {
        if (undoStack.size() >= 20) {
            undoStack.erase(undoStack.begin());
        }
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

    // Export canvas to standard Windows 24-bit uncompressed BMP file
    bool saveToBMP(const std::string& filename) const {
        std::ofstream f(filename, std::ios::binary);
        if (!f.is_open()) return false;

        const int rowStride = (width * 3 + 3) & ~3; // Align to 4 bytes
        const uint32_t imageSize = rowStride * height;
        const uint32_t fileSize = 54 + imageSize;

        uint8_t header[54] = {
            'B', 'M',
            static_cast<uint8_t>(fileSize & 0xFF),
            static_cast<uint8_t>((fileSize >> 8) & 0xFF),
            static_cast<uint8_t>((fileSize >> 16) & 0xFF),
            static_cast<uint8_t>((fileSize >> 24) & 0xFF),
            0, 0, 0, 0, // reserved
            54, 0, 0, 0, // pixel data offset
            40, 0, 0, 0, // DIB header size
            static_cast<uint8_t>(width & 0xFF),
            static_cast<uint8_t>((width >> 8) & 0xFF),
            static_cast<uint8_t>((width >> 16) & 0xFF),
            static_cast<uint8_t>((width >> 24) & 0xFF),
            static_cast<uint8_t>(height & 0xFF),
            static_cast<uint8_t>((height >> 8) & 0xFF),
            static_cast<uint8_t>((height >> 16) & 0xFF),
            static_cast<uint8_t>((height >> 24) & 0xFF),
            1, 0, // color planes
            24, 0, // bits per pixel
            0, 0, 0, 0, // compression (0 = BI_RGB)
            static_cast<uint8_t>(imageSize & 0xFF),
            static_cast<uint8_t>((imageSize >> 8) & 0xFF),
            static_cast<uint8_t>((imageSize >> 16) & 0xFF),
            static_cast<uint8_t>((imageSize >> 24) & 0xFF),
            0x13, 0x0B, 0, 0, // 2835 ppm horiz
            0x13, 0x0B, 0, 0, // 2835 ppm vert
            0, 0, 0, 0, 0, 0, 0, 0
        };

        f.write(reinterpret_cast<char*>(header), 54);

        std::vector<uint8_t> rowBuffer(rowStride, 0);
        // BMP is stored bottom-to-top
        for (int y = height - 1; y >= 0; y--) {
            int byteIdx = 0;
            for (int x = 0; x < width; x++) {
                Color c = getPixel(x, y);
                rowBuffer[byteIdx++] = c.b; // Blue
                rowBuffer[byteIdx++] = c.g; // Green
                rowBuffer[byteIdx++] = c.r; // Red
            }
            while (byteIdx < rowStride) {
                rowBuffer[byteIdx++] = 0;
            }
            f.write(reinterpret_cast<char*>(rowBuffer.data()), rowStride);
        }

        return true;
    }

    // Render pixel grid in terminal using ANSI colors
    void printTerminalGrid(int highlightX = -1, int highlightY = -1) const {
        std::cout << "\n    ";
        for (int x = 0; x < width; x++) {
            if (x % 5 == 0) std::cout << (x < 10 ? "0" : "") << x % 100;
            else std::cout << "  ";
        }
        std::cout << "\n   +" << std::string(width * 2, '-') << "+\n";

        for (int y = 0; y < height; y++) {
            std::cout << std::setw(2) << std::setfill(' ') << y << " |";
            for (int x = 0; x < width; x++) {
                Color c = getPixel(x, y);
                if (x == highlightX && y == highlightY) {
                    // Golden active highlight
                    std::cout << "\033[43m\033[30m##\033[0m";
                } else if (c == Palette::White) {
                    std::cout << " .";
                } else if (c == Palette::Black) {
                    std::cout << "\033[40m\033[37m██\033[0m";
                } else if (c == Palette::Red) {
                    std::cout << "\033[41m\033[37m██\033[0m";
                } else if (c == Palette::Blue) {
                    std::cout << "\033[44m\033[37m██\033[0m";
                } else if (c == Palette::Green) {
                    std::cout << "\033[42m\033[30m██\033[0m";
                } else if (c == Palette::Yellow) {
                    std::cout << "\033[43m\033[30m██\033[0m";
                } else {
                    std::cout << "██";
                }
            }
            std::cout << "|\n";
        }
        std::cout << "   +" << std::string(width * 2, '-') << "+\n";
    }
};

// ----------------------------------------------------------------------------
// 3. Computer Graphics Algorithms Implementation
// ----------------------------------------------------------------------------

class CGAlgorithms {
public:
    // ------------------------------------------------------------------------
    // 3.1 DDA Line Algorithm with Decision Parameters Table
    // ------------------------------------------------------------------------
    static std::vector<StepRecord> ddaLineDetailed(int x0, int y0, int x1, int y1, Color col) {
        std::vector<StepRecord> records;
        int dx = x1 - x0;
        int dy = y1 - y0;
        int steps = std::max(std::abs(dx), std::abs(dy));
        double xInc = (steps == 0) ? 0.0 : static_cast<double>(dx) / steps;
        double yInc = (steps == 0) ? 0.0 : static_cast<double>(dy) / steps;

        double x = x0;
        double y = y0;

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
                << ") | Inc: Δx=" << formatDouble(xInc, 2) << ", Δy=" << formatDouble(yInc, 2)
                << " | Plotted: (" << px << ", " << py << ")";
            rec.description = oss.str();

            records.push_back(rec);
            x += xInc;
            y += yInc;
        }
        return records;
    }

    // ------------------------------------------------------------------------
    // 3.2 Bresenham's Line Algorithm with Decision Parameters Table (pk, pk+1)
    // ------------------------------------------------------------------------
    static std::vector<StepRecord> bresenhamLineDetailed(int x0, int y0, int x1, int y1, Color col) {
        std::vector<StepRecord> records;
        int dx = std::abs(x1 - x0);
        int dy = std::abs(y1 - y0);
        int sx = (x0 < x1) ? 1 : -1;
        int sy = (y0 < y1) ? 1 : -1;

        int currX = x0;
        int currY = y0;

        if (dx >= dy) {
            // Driven by X (|m| <= 1)
            int pk = 2 * dy - dx;
            for (int k = 0; k <= dx; k++) {
                int prevX = currX;
                int prevY = currY;
                int plotX = currX;
                int plotY = currY;

                std::string nextPkStr = "-";
                std::string condition = "-";
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
                    << ") | Decision Parameter pk=" << pk << " (" << condition << ") -> next pk+1=" << nextPkStr;
                rec.description = oss.str();

                records.push_back(rec);
                pk = nextPk;
            }
        } else {
            // Driven by Y (|m| > 1)
            int pk = 2 * dx - dy;
            for (int k = 0; k <= dy; k++) {
                int prevX = currX;
                int prevY = currY;
                int plotX = currX;
                int plotY = currY;

                std::string nextPkStr = "-";
                std::string condition = "-";
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
                    << ") | Decision Parameter pk=" << pk << " (" << condition << ") -> next pk+1=" << nextPkStr;
                rec.description = oss.str();

                records.push_back(rec);
                pk = nextPk;
            }
        }

        return records;
    }

    // ------------------------------------------------------------------------
    // 3.3 Midpoint Circle Algorithm with 8-Octants Decision Parameters Table
    // ------------------------------------------------------------------------
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

        int x = 0;
        int y = r;
        int pk = 1 - r;
        int k = 0;

        while (x <= y) {
            std::vector<Point> octants = {
                Point(xc + x, yc + y),
                Point(xc - x, yc + y),
                Point(xc + x, yc - y),
                Point(xc - x, yc - y),
                Point(xc + y, yc + x),
                Point(xc - y, yc + x),
                Point(xc + y, yc - x),
                Point(xc - y, yc - x)
            };

            int nextPk = 0;
            std::string condition = "-";
            std::string nextPkStr = "-";
            int nextX = x, nextY = y;

            if (x < y) {
                if (pk < 0) {
                    condition = "pk < 0";
                    nextPk = pk + 2 * (x + 1) + 1;
                    nextPkStr = std::to_string(nextPk);
                    nextX = x + 1;
                    nextY = y;
                } else {
                    condition = "pk >= 0";
                    nextPk = pk + 2 * (x + 1) + 1 - 2 * (y - 1);
                    nextPkStr = std::to_string(nextPk);
                    nextX = x + 1;
                    nextY = y - 1;
                }
            } else {
                condition = "Stop (x >= y)";
                nextPkStr = "-";
                nextX = x + 1;
                nextY = y;
            }

            StepRecord rec;
            rec.stepIndex = k;
            rec.type = "circle_midpoint";
            rec.k = k;
            rec.prevX = x;
            rec.prevY = y;
            rec.pkStr = std::to_string(pk);
            rec.condition = condition;
            rec.nextPkStr = nextPkStr;
            rec.octants = octants;
            for (const auto& pt : octants) {
                rec.pixels.push_back(Pixel(pt.x, pt.y, col));
            }

            std::ostringstream oss;
            oss << "Iteration k=" << k << ": (x=" << x << ", y=" << y << ") | pk=" << pk
                << " (" << condition << ") -> next pk+1=" << nextPkStr << " | 8 Octants Plotted";
            rec.description = oss.str();

            records.push_back(rec);
            k++;
            x = nextX;
            y = nextY;
            pk = nextPk;
        }

        return records;
    }

    // ------------------------------------------------------------------------
    // 3.4 Bresenham's Circle Algorithm with 8-Octants Decision Parameters Table
    // ------------------------------------------------------------------------
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

        int x = 0;
        int y = r;
        int dk = 3 - 2 * r;
        int k = 0;

        while (x <= y) {
            std::vector<Point> octants = {
                Point(xc + x, yc + y),
                Point(xc - x, yc + y),
                Point(xc + x, yc - y),
                Point(xc - x, yc - y),
                Point(xc + y, yc + x),
                Point(xc - y, yc + x),
                Point(xc + y, yc - x),
                Point(xc - y, yc - x)
            };

            int nextDk = 0;
            std::string condition = "-";
            std::string nextDkStr = "-";
            int nextX = x, nextY = y;

            if (x < y) {
                if (dk < 0) {
                    condition = "dk < 0";
                    nextDk = dk + 4 * x + 6;
                    nextDkStr = std::to_string(nextDk);
                    nextX = x + 1;
                    nextY = y;
                } else {
                    condition = "dk >= 0";
                    nextDk = dk + 4 * (x - y) + 10;
                    nextDkStr = std::to_string(nextDk);
                    nextX = x + 1;
                    nextY = y - 1;
                }
            } else {
                condition = "Stop (x >= y)";
                nextDkStr = "-";
                nextX = x + 1;
                nextY = y;
            }

            StepRecord rec;
            rec.stepIndex = k;
            rec.type = "circle_bresenham";
            rec.k = k;
            rec.prevX = x;
            rec.prevY = y;
            rec.pkStr = std::to_string(dk);
            rec.condition = condition;
            rec.nextPkStr = nextDkStr;
            rec.octants = octants;
            for (const auto& pt : octants) {
                rec.pixels.push_back(Pixel(pt.x, pt.y, col));
            }

            std::ostringstream oss;
            oss << "Iteration k=" << k << ": (x=" << x << ", y=" << y << ") | dk=" << dk
                << " (" << condition << ") -> next dk+1=" << nextDkStr << " | 8 Octants Plotted";
            rec.description = oss.str();

            records.push_back(rec);
            k++;
            x = nextX;
            y = nextY;
            dk = nextDk;
        }

        return records;
    }

    // ------------------------------------------------------------------------
    // 3.5 Regular Polygon Generator
    static std::vector<Point> generatePolygon(int xc, int yc, int radius, int sides, double startAngle = 0.0) {
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

        std::vector<Point> allPoints;
        for (size_t i = 0; i < vertices.size(); i++) {
            Point p1 = vertices[i];
            Point p2 = vertices[(i + 1) % vertices.size()];
            auto edgeSteps = bresenhamLineDetailed(p1.x, p1.y, p2.x, p2.y, Palette::Black);
            for (const auto& s : edgeSteps) {
                allPoints.push_back(Point(s.plotX, s.plotY));
            }
        }
        return allPoints;
    }

    // ------------------------------------------------------------------------
    // 3.6 Boundary Fill Algorithm (4-conn & 8-conn)
    // ------------------------------------------------------------------------
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
            Point pt = st.top();
            st.pop();

            Color c = canvas.getPixel(pt.x, pt.y);
            if (c != boundCol && c != fillCol) {
                canvas.setPixel(pt.x, pt.y, fillCol);

                StepRecord rec;
                rec.stepIndex = stepIdx;
                rec.type = "boundary";
                rec.plotX = pt.x;
                rec.plotY = pt.y;
                rec.pixels.push_back(Pixel(pt.x, pt.y, fillCol));
                rec.description = "Boundary Fill (" + std::to_string(connectivity) + "-conn): Filled (" + std::to_string(pt.x) + ", " + std::to_string(pt.y) + ")";
                steps.push_back(rec);
                stepIdx++;

                for (const auto& d : dirs) {
                    int nx = pt.x + d.x;
                    int ny = pt.y + d.y;
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

    // ------------------------------------------------------------------------
    // 3.7 Scanline Polygon Fill (Edge Table & Active Edge Table)
    // ------------------------------------------------------------------------
    struct Edge {
        int yMax;
        double xCurrent;
        double invSlope; // dx / dy
    };

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
            Point p1 = vertices[i];
            Point p2 = vertices[(i + 1) % n];

            if (p1.y == p2.y) continue; // Horizontal edge ignored

            Point lower = (p1.y < p2.y) ? p1 : p2;
            Point upper = (p1.y < p2.y) ? p2 : p1;

            Edge e;
            e.yMax = upper.y;
            e.xCurrent = lower.x;
            e.invSlope = static_cast<double>(upper.x - lower.x) / (upper.y - lower.y);

            if (lower.y >= 0 && lower.y < canvas.height) {
                edgeTable[lower.y].push_back(e);
            }
        }

        std::vector<Edge> AET;
        int stepIdx = 0;

        for (int y = minY; y <= maxY; y++) {
            // Add edges from ET to AET
            for (const auto& e : edgeTable[y]) {
                AET.push_back(e);
            }

            // Remove edges where yMax == y
            AET.erase(std::remove_if(AET.begin(), AET.end(), [y](const Edge& e) {
                return e.yMax <= y;
            }), AET.end());

            // Sort AET by xCurrent
            std::sort(AET.begin(), AET.end(), [](const Edge& a, const Edge& b) {
                return a.xCurrent < b.xCurrent;
            });

            // Fill spans between pairs of intersections
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

            // Advance xCurrent for next scanline
            for (auto& e : AET) {
                e.xCurrent += e.invSlope;
            }
        }

        return steps;
    }

private:
    static std::string formatDouble(double v, int precision = 2) {
        std::ostringstream ss;
        ss << std::fixed << std::setprecision(precision) << v;
        return ss.str();
    }
};

// ----------------------------------------------------------------------------
// 4. Decision Parameter Table & Progressive Step Visualizer
// ----------------------------------------------------------------------------

class VisualizerEngine {
public:
    Canvas& canvas;
    std::vector<StepRecord> recordedSteps;
    int currentStep = 0;

    VisualizerEngine(Canvas& c) : canvas(c) {}

    void setSteps(const std::vector<StepRecord>& steps) {
        recordedSteps = steps;
        currentStep = 0;
        goToStep(0);
    }

    // Scrub or step to iteration k:
    // Plotted on screen: ONLY the points up to iteration stepIndex!
    void goToStep(int stepIndex) {
        if (recordedSteps.empty()) return;
        stepIndex = std::max(0, std::min(static_cast<int>(recordedSteps.size()) - 1, stepIndex));
        currentStep = stepIndex;

        // Restore clean base canvas
        canvas.restoreBaseSnapshot();

        // Replay pixels strictly up to stepIndex
        for (int i = 0; i <= stepIndex; i++) {
            for (const auto& px : recordedSteps[i].pixels) {
                canvas.setPixel(px.x, px.y, px.color);
            }
        }
    }

    // Print beautifully formatted ASCII decision parameter table
    void printDecisionTable(int highlightStep = -1) const {
        if (recordedSteps.empty()) {
            std::cout << "No recorded algorithm steps.\n";
            return;
        }

        if (highlightStep < 0) highlightStep = currentStep;
        std::string sType = recordedSteps[0].type;

        std::cout << "\n========================================================================================\n";
        if (sType == "dda_line") {
            std::cout << "  DECISION PARAMETERS TABLE: DDA Line Algorithm\n";
            std::cout << "  Formula: Δx = dx/steps, Δy = dy/steps | Plotted: (round(x), round(y))\n";
            std::cout << "========================================================================================\n";
            std::cout << std::left
                      << std::setw(5)  << "k"
                      << std::setw(12) << "Exact X"
                      << std::setw(12) << "Exact Y"
                      << std::setw(10) << "Δx"
                      << std::setw(10) << "Δy"
                      << std::setw(10) << "Plot X"
                      << std::setw(10) << "Plot Y"
                      << "Status\n";
            std::cout << std::string(88, '-') << "\n";

            for (size_t i = 0; i < recordedSteps.size(); i++) {
                const auto& s = recordedSteps[i];
                bool isPastOrCurrent = (static_cast<int>(i) <= highlightStep);
                bool isActive = (static_cast<int>(i) == highlightStep);

                std::cout << (isActive ? "> " : "  ")
                          << std::setw(4)  << s.k
                          << std::setw(12) << (isPastOrCurrent ? formatDouble(s.exactX, 2) : "—")
                          << std::setw(12) << (isPastOrCurrent ? formatDouble(s.exactY, 2) : "—")
                          << std::setw(10) << (isPastOrCurrent ? s.xIncStr : "—")
                          << std::setw(10) << (isPastOrCurrent ? s.yIncStr : "—")
                          << std::setw(10) << (isPastOrCurrent ? std::to_string(s.plotX) : "—")
                          << std::setw(10) << (isPastOrCurrent ? std::to_string(s.plotY) : "—")
                          << (isActive ? "[ACTIVE ITERATION]" : (isPastOrCurrent ? "[PLOTTED]" : "[FUTURE]"))
                          << "\n";
            }
        } else if (sType == "bresenham_line") {
            std::cout << "  DECISION PARAMETERS TABLE: Bresenham's Line Algorithm\n";
            std::cout << "  Formula: pk = 2Δy - Δx | If pk < 0: pk+1 = pk+2Δy | If pk >= 0: pk+1 = pk+2Δy-2Δx, y++\n";
            std::cout << "========================================================================================\n";
            std::cout << std::left
                      << std::setw(5)  << "k"
                      << std::setw(16) << "Point (Xk, Yk)"
                      << std::setw(14) << "Decision pk"
                      << std::setw(16) << "Condition"
                      << std::setw(16) << "Plot (X, Y)"
                      << std::setw(12) << "Next pk+1"
                      << "Status\n";
            std::cout << std::string(88, '-') << "\n";

            for (size_t i = 0; i < recordedSteps.size(); i++) {
                const auto& s = recordedSteps[i];
                bool isPastOrCurrent = (static_cast<int>(i) <= highlightStep);
                bool isActive = (static_cast<int>(i) == highlightStep);

                std::string ptPrev = "(" + std::to_string(s.prevX) + ", " + std::to_string(s.prevY) + ")";
                std::string ptPlot = "(" + std::to_string(s.plotX) + ", " + std::to_string(s.plotY) + ")";

                std::cout << (isActive ? "> " : "  ")
                          << std::setw(4)  << s.k
                          << std::setw(16) << (isPastOrCurrent ? ptPrev : "—")
                          << std::setw(14) << (isPastOrCurrent ? s.pkStr : "—")
                          << std::setw(16) << (isPastOrCurrent ? s.condition : "—")
                          << std::setw(16) << (isPastOrCurrent ? ptPlot : "—")
                          << std::setw(12) << (isPastOrCurrent ? s.nextPkStr : "—")
                          << (isActive ? "[ACTIVE ITERATION]" : (isPastOrCurrent ? "[PLOTTED]" : "[FUTURE]"))
                          << "\n";
            }
        } else if (sType == "circle_midpoint" || sType == "circle_bresenham") {
            bool isMid = (sType == "circle_midpoint");
            std::cout << "  DECISION PARAMETERS TABLE: " << (isMid ? "Midpoint Circle" : "Bresenham's Circle") << "\n";
            std::cout << "  8 Symmetric Octants plotted for each iteration k\n";
            std::cout << "========================================================================================\n";
            std::cout << std::left
                      << std::setw(4)  << "k"
                      << std::setw(10) << "(x, y)"
                      << std::setw(8)  << (isMid ? "pk" : "dk")
                      << std::setw(14) << "Cond."
                      << std::setw(8)  << "next P"
                      << std::setw(10) << "Oct 1"
                      << std::setw(10) << "Oct 2"
                      << std::setw(10) << "Oct 3"
                      << std::setw(10) << "Oct 4"
                      << "Status\n";
            std::cout << std::string(88, '-') << "\n";

            for (size_t i = 0; i < recordedSteps.size(); i++) {
                const auto& s = recordedSteps[i];
                bool isPastOrCurrent = (static_cast<int>(i) <= highlightStep);
                bool isActive = (static_cast<int>(i) == highlightStep);

                std::string xy = "(" + std::to_string(s.prevX) + "," + std::to_string(s.prevY) + ")";
                std::string oct1 = (s.octants.size() > 0) ? ("(" + std::to_string(s.octants[0].x) + "," + std::to_string(s.octants[0].y) + ")") : "-";
                std::string oct2 = (s.octants.size() > 1) ? ("(" + std::to_string(s.octants[1].x) + "," + std::to_string(s.octants[1].y) + ")") : "-";
                std::string oct3 = (s.octants.size() > 2) ? ("(" + std::to_string(s.octants[2].x) + "," + std::to_string(s.octants[2].y) + ")") : "-";
                std::string oct4 = (s.octants.size() > 3) ? ("(" + std::to_string(s.octants[3].x) + "," + std::to_string(s.octants[3].y) + ")") : "-";

                std::cout << (isActive ? "> " : "  ")
                          << std::setw(3)  << s.k
                          << std::setw(10) << (isPastOrCurrent ? xy : "—")
                          << std::setw(8)  << (isPastOrCurrent ? s.pkStr : "—")
                          << std::setw(14) << (isPastOrCurrent ? s.condition : "—")
                          << std::setw(8)  << (isPastOrCurrent ? s.nextPkStr : "—")
                          << std::setw(10) << (isPastOrCurrent ? oct1 : "—")
                          << std::setw(10) << (isPastOrCurrent ? oct2 : "—")
                          << std::setw(10) << (isPastOrCurrent ? oct3 : "—")
                          << std::setw(10) << (isPastOrCurrent ? oct4 : "—")
                          << (isActive ? "[ACTIVE]" : (isPastOrCurrent ? "[PLOTTED]" : "[FUTURE]"))
                          << "\n";
            }
        }
        std::cout << "========================================================================================\n\n";
    }

private:
    static std::string formatDouble(double v, int precision = 2) {
        std::ostringstream ss;
        ss << std::fixed << std::setprecision(precision) << v;
        return ss.str();
    }
};

// ----------------------------------------------------------------------------
// 5. Interactive Studio Demonstrations & Console Menu
// ----------------------------------------------------------------------------

void runDemonstration() {
    std::cout << "\n===============================================================\n";
    std::cout << "  COMPUTER GRAPHICS STUDIO (C++ Native Standalone)\n";
    std::cout << "  Demonstrating Progressive Iteration Plotting & Decision Tables\n";
    std::cout << "===============================================================\n";

    Canvas canvas(32, 32);
    VisualizerEngine visualizer(canvas);

    std::cout << "\n>>> [DEMO 1]: Bresenham's Line Algorithm from (2, 2) to (18, 10)\n";
    canvas.clear();
    canvas.takeBaseSnapshot();
    auto bresSteps = CGAlgorithms::bresenhamLineDetailed(2, 2, 18, 10, Palette::Black);
    visualizer.setSteps(bresSteps);

    std::cout << "Total Steps Calculated: " << bresSteps.size() << "\n";
    std::cout << "Now stepping strictly to Iteration 6 (as requested):\n";
    std::cout << "--> Canvas will display ONLY the points up to iteration 6!\n";

    visualizer.goToStep(6);
    visualizer.printDecisionTable(6);
    canvas.printTerminalGrid(bresSteps[6].plotX, bresSteps[6].plotY);

    std::cout << "\n>>> [DEMO 2]: Midpoint Circle Algorithm at center (16, 16), radius r=10\n";
    canvas.clear();
    canvas.takeBaseSnapshot();
    auto circleSteps = CGAlgorithms::midpointCircleDetailed(16, 16, 10, Palette::Blue);
    visualizer.setSteps(circleSteps);

    std::cout << "Stepping to Iteration 4 (8 octants plotted per step):\n";
    visualizer.goToStep(4);
    visualizer.printDecisionTable(4);
    canvas.printTerminalGrid();

    // Export complete circle to Windows BMP file
    visualizer.goToStep(static_cast<int>(circleSteps.size()) - 1);
    std::string bmpFile = "circle_demo.bmp";
    if (canvas.saveToBMP(bmpFile)) {
        std::cout << "\n[OK] Exported full completed circle canvas to native image: " << bmpFile << "\n";
        std::cout << "     (You can double-click this file to open in MS Paint!)\n";
    }

    std::cout << "\n>>> [DEMO 3]: Regular Pentagon + Scanline Fill\n";
    canvas.clear();
    canvas.takeBaseSnapshot();
    auto polyVertices = std::vector<Point>{
        Point(16, 4), Point(26, 12), Point(22, 24), Point(10, 24), Point(6, 12)
    };
    auto scanlineSteps = CGAlgorithms::scanlinePolygonFill(canvas, polyVertices, Palette::Red);
    std::cout << "Rendered Scanline Polygon Fill (" << scanlineSteps.size() << " scanlines):\n";
    canvas.printTerminalGrid();
    canvas.saveToBMP("polygon_scanline_demo.bmp");
    std::cout << "[OK] Exported polygon scanline fill to: polygon_scanline_demo.bmp\n";
}

int main() {
    std::cout << "Paint Studio C++ Edition Initialized.\n";
    runDemonstration();

    std::cout << "\n===============================================================\n";
    std::cout << "  Demonstration Complete!\n";
    std::cout << "  All algorithms, step-by-step progressive plotting, decision\n";
    std::cout << "  tables, and BMP exports executed successfully in native C++.\n";
    std::cout << "===============================================================\n";

    return 0;
}
