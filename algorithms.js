/**
 * Computer Graphics Algorithms Module
 * Implements core university CG algorithms:
 * 1. Bresenham's Line Algorithm
 * 2. Midpoint Circle Algorithm (Bresenham Circle)
 * 3. Regular Polygon Generation (1 to 8 & N-gon)
 * 4. Boundary Fill Algorithm (4-connected)
 * 5. Flood Fill Algorithm (4-connected)
 * 6. Scanline Polygon Fill Algorithm (Edge Table & Active Edge Table)
 */

class CGAlgorithms {
  /**
   * Bresenham's Line Algorithm
   * Yields/returns array of integer points [ {x, y}, ... ]
   */
  static bresenhamLine(x0, y0, x1, y1) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);

    const points = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    let currX = x0;
    let currY = y0;

    while (true) {
      points.push({ x: currX, y: currY });
      if (currX === x1 && currY === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currX += sx;
      }
      if (e2 < dx) {
        err += dx;
        currY += sy;
      }
    }

    return points;
  }

  /**
   * Midpoint Circle Algorithm
   * Decision parameter: p = 1 - r
   * Plots 8 symmetric octants around center (xc, yc) with radius r.
   */
  static midpointCircle(xc, yc, r) {
    xc = Math.round(xc);
    yc = Math.round(yc);
    r = Math.max(0, Math.round(r));

    const points = [];
    if (r === 0) {
      points.push({ x: xc, y: yc });
      return points;
    }

    let x = 0;
    let y = r;
    let d = 1 - r; // Decision parameter

    const plotSymmetric = (cx, cy, px, py) => {
      points.push({ x: cx + px, y: cy + py });
      points.push({ x: cx - px, y: cy + py });
      points.push({ x: cx + px, y: cy - py });
      points.push({ x: cx - px, y: cy - py });
      points.push({ x: cx + py, y: cy + px });
      points.push({ x: cx - py, y: cy + px });
      points.push({ x: cx + py, y: cy - px });
      points.push({ x: cx - py, y: cy - px });
    };

    plotSymmetric(xc, yc, x, y);

    while (x < y) {
      x++;
      if (d < 0) {
        d += 2 * x + 1;
      } else {
        y--;
        d += 2 * (x - y) + 1;
      }
      plotSymmetric(xc, yc, x, y);
    }

    return points;
  }

  /**
   * Bresenham's Circle Algorithm
   * Decision parameter: d = 3 - 2r
   * If d < 0: d = d + 4x + 6, x++
   * Else:     d = d + 4(x - y) + 10, x++, y--
   */
  static bresenhamCircle(xc, yc, r) {
    xc = Math.round(xc);
    yc = Math.round(yc);
    r = Math.max(0, Math.round(r));

    const points = [];
    if (r === 0) {
      points.push({ x: xc, y: yc });
      return points;
    }

    let x = 0;
    let y = r;
    let d = 3 - 2 * r; // Initial decision parameter

    const plotSymmetric = (cx, cy, px, py) => {
      points.push({ x: cx + px, y: cy + py });
      points.push({ x: cx - px, y: cy + py });
      points.push({ x: cx + px, y: cy - py });
      points.push({ x: cx - px, y: cy - py });
      points.push({ x: cx + py, y: cy + px });
      points.push({ x: cx - py, y: cy + px });
      points.push({ x: cx + py, y: cy - px });
      points.push({ x: cx - py, y: cy - px });
    };

    plotSymmetric(xc, yc, x, y);

    while (x <= y) {
      if (d < 0) {
        d += 4 * x + 6;
      } else {
        d += 4 * (x - y) + 10;
        y--;
      }
      x++;
      plotSymmetric(xc, yc, x, y);
    }

    return points;
  }

  /**
   * Regular Polygon Generator (Sides 1 to 8 or custom N)
   * Connects vertices using Bresenham's line algorithm.
   */
  static generatePolygon(cx, cy, r, sides, startAngle = -Math.PI / 2) {
    cx = Math.round(cx);
    cy = Math.round(cy);
    r = Math.max(1, Math.round(r));
    sides = Math.max(1, parseInt(sides) || 3);

    // Case 1: Point
    if (sides === 1) {
      return {
        vertices: [{ x: cx, y: cy }],
        points: [{ x: cx, y: cy }]
      };
    }

    // Compute vertices
    const vertices = [];
    const angleStep = (2 * Math.PI) / sides;
    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      const vx = Math.round(cx + r * Math.cos(angle));
      const vy = Math.round(cy + r * Math.sin(angle));
      vertices.push({ x: vx, y: vy });
    }

    // Connect vertices with Bresenham's lines
    const points = [];
    const pointSet = new Set();
    const addPt = (p) => {
      const key = `${p.x},${p.y}`;
      if (!pointSet.has(key)) {
        pointSet.add(key);
        points.push(p);
      }
    };

    // Case 2: Single line segment
    if (sides === 2) {
      const linePts = this.bresenhamLine(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y);
      linePts.forEach(addPt);
      return { vertices, points };
    }

    // Case 3+: Closed polygon
    for (let i = 0; i < sides; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % sides];
      const edgePts = this.bresenhamLine(v1.x, v1.y, v2.x, v2.y);
      edgePts.forEach(addPt);
    }

    return { vertices, points };
  }

  /**
   * Helper: Compare two RGBA colors with tolerance
   */
  static colorsMatch(c1, c2, tolerance = 12) {
    if (!c1 || !c2) return false;
    return (
      Math.abs(c1[0] - c2[0]) <= tolerance &&
      Math.abs(c1[1] - c2[1]) <= tolerance &&
      Math.abs(c1[2] - c2[2]) <= tolerance &&
      (c1[3] === undefined || c2[3] === undefined || Math.abs(c1[3] - c2[3]) <= tolerance)
    );
  }

  /**
   * Scanline Circle Fill Algorithm
   * Fills a circle line-by-line horizontally.
   * For each scanline y: span [xStart..xEnd] = xc +/- sqrt(r^2 - dy^2).
   */
  static scanlineCircleFill(pixelData, width, height, xc, yc, r, fillColor, recordSteps = false) {
    xc = Math.round(xc);
    yc = Math.round(yc);
    r = Math.max(0, Math.round(r));

    const setPixel = (x, y, col) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const idx = (y * width + x) * 4;
      pixelData[idx] = col[0];
      pixelData[idx + 1] = col[1];
      pixelData[idx + 2] = col[2];
      pixelData[idx + 3] = col[3] !== undefined ? col[3] : 255;
    };

    const steps = [];
    let count = 0;
    const yMin = Math.max(0, yc - r);
    const yMax = Math.min(height - 1, yc + r);

    for (let y = yMin; y <= yMax; y++) {
      const dy = y - yc;
      const dx = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
      const xStart = Math.max(0, xc - dx);
      const xEnd = Math.min(width - 1, xc + dx);

      const scanlinePixels = [];
      for (let x = xStart; x <= xEnd; x++) {
        setPixel(x, y, fillColor);
        scanlinePixels.push({ x, y, color: [...fillColor] });
        count++;
      }

      if (recordSteps) {
        steps.push({
          stepIndex: steps.length,
          type: 'scanline',
          y: y,
          activeEdgesCount: 2,
          description: `Circle Scanline Y=${y}: Span [${xStart}..${xEnd}], ${scanlinePixels.length} px filled`,
          pixels: scanlinePixels
        });
      }
    }

    return { modifiedCount: count, steps };
  }

  /**
   * Scanline Flood / Span Fill Algorithm
   * Classic raster scanline seed fill:
   * Fills horizontal spans on each scanline and checks adjacent scanlines.
   */
  static scanlineFloodFill(pixelData, width, height, startX, startY, fillColor, recordSteps = false) {
    startX = Math.round(startX);
    startY = Math.round(startY);

    if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
      return { modifiedCount: 0, steps: [] };
    }

    const getPixel = (x, y) => {
      const idx = (y * width + x) * 4;
      return [pixelData[idx], pixelData[idx + 1], pixelData[idx + 2], pixelData[idx + 3]];
    };

    const setPixel = (x, y, col) => {
      const idx = (y * width + x) * 4;
      pixelData[idx] = col[0];
      pixelData[idx + 1] = col[1];
      pixelData[idx + 2] = col[2];
      pixelData[idx + 3] = col[3] !== undefined ? col[3] : 255;
    };

    const targetColor = getPixel(startX, startY);
    if (this.colorsMatch(targetColor, fillColor)) {
      return { modifiedCount: 0, steps: [] };
    }

    const steps = [];
    const stack = [{ x: startX, y: startY }];
    const visited = new Uint8Array(width * height);
    let count = 0;

    while (stack.length > 0) {
      const { x, y } = stack.pop();
      if (y < 0 || y >= height) continue;

      let lx = x;
      while (lx >= 0 && !visited[y * width + lx] && this.colorsMatch(getPixel(lx, y), targetColor)) {
        lx--;
      }
      lx++; // First matching pixel on the left

      let rx = x;
      while (rx < width && !visited[y * width + rx] && this.colorsMatch(getPixel(rx, y), targetColor)) {
        rx++;
      }
      rx--; // Last matching pixel on the right

      if (lx > rx) continue;

      const spanPixels = [];
      for (let cx = lx; cx <= rx; cx++) {
        const idx = y * width + cx;
        if (!visited[idx]) {
          visited[idx] = 1;
          setPixel(cx, y, fillColor);
          spanPixels.push({ x: cx, y, color: [...fillColor] });
          count++;
        }
      }

      if (recordSteps && spanPixels.length > 0) {
        steps.push({
          stepIndex: steps.length,
          type: 'scanline',
          y: y,
          description: `Scanline Y=${y}: Span [${lx}..${rx}], ${spanPixels.length} px filled`,
          pixels: spanPixels
        });
      }

      // Check scanlines above and below
      const checkLine = (checkY) => {
        if (checkY < 0 || checkY >= height) return;
        let inSpan = false;
        for (let cx = lx; cx <= rx; cx++) {
          const idx = checkY * width + cx;
          if (!visited[idx] && this.colorsMatch(getPixel(cx, checkY), targetColor)) {
            if (!inSpan) {
              stack.push({ x: cx, y: checkY });
              inSpan = true;
            }
          } else {
            inSpan = false;
          }
        }
      };

      checkLine(y - 1);
      checkLine(y + 1);
    }

    return { modifiedCount: count, steps };
  }

  /**
   * Boundary Fill Algorithm (4-connected or 8-connected, radiating queue-based BFS)
   * Continues filling outward from seed point until hitting the boundaryColor or already filled color.
   */
  static boundaryFill(pixelData, width, height, startX, startY, fillColor, boundaryColor, recordSteps = false, connectivity = 4) {
    startX = Math.round(startX);
    startY = Math.round(startY);
    connectivity = parseInt(connectivity) === 8 ? 8 : 4;

    if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
      return { modifiedCount: 0, steps: [], seed: { x: startX, y: startY } };
    }

    const getPixel = (x, y) => {
      const idx = (y * width + x) * 4;
      return [
        pixelData[idx],
        pixelData[idx + 1],
        pixelData[idx + 2],
        pixelData[idx + 3]
      ];
    };

    const setPixel = (x, y, col) => {
      const idx = (y * width + x) * 4;
      pixelData[idx] = col[0];
      pixelData[idx + 1] = col[1];
      pixelData[idx + 2] = col[2];
      pixelData[idx + 3] = col[3] !== undefined ? col[3] : 255;
    };

    const seedColor = getPixel(startX, startY);
    if (this.colorsMatch(seedColor, boundaryColor) || this.colorsMatch(seedColor, fillColor)) {
      return { modifiedCount: 0, steps: [], seed: { x: startX, y: startY }, blocked: true };
    }

    const steps = [];
    const queue = [{ x: startX, y: startY }];
    const visited = new Uint8Array(width * height);
    visited[startY * width + startX] = 1;
    setPixel(startX, startY, fillColor);
    let count = 1;

    // Record Step 0: explicitly mark and color seed point
    if (recordSteps) {
      steps.push({
        stepIndex: 0,
        type: 'boundary',
        seedX: startX,
        seedY: startY,
        connectivity,
        description: `Seed Point selected at (${startX}, ${startY}) | Starting ${connectivity}-connected Boundary Fill`,
        pixel: { x: startX, y: startY, color: [...fillColor] }
      });
    }

    const neighbors4 = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];
    const neighbors8 = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: -1 },  // Top-Right
      { dx: -1, dy: -1 }, // Top-Left
      { dx: 1, dy: 1 },   // Bottom-Right
      { dx: -1, dy: 1 }   // Bottom-Left
    ];
    const offsets = (connectivity === 8) ? neighbors8 : neighbors4;

    let head = 0;
    while (head < queue.length) {
      const { x, y } = queue[head++];

      for (let i = 0; i < offsets.length; i++) {
        const nx = x + offsets[i].dx;
        const ny = y + offsets[i].dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          if (!visited[nIdx]) {
            visited[nIdx] = 1;
            const currentColor = getPixel(nx, ny);
            if (!this.colorsMatch(currentColor, boundaryColor) && !this.colorsMatch(currentColor, fillColor)) {
              setPixel(nx, ny, fillColor);
              count++;
              queue.push({ x: nx, y: ny });

              if (recordSteps) {
                steps.push({
                  stepIndex: steps.length,
                  type: 'boundary',
                  seedX: startX,
                  seedY: startY,
                  connectivity,
                  description: `Filled (${nx}, ${ny}) from (${x}, ${y}) [${connectivity}-conn] | Queue: ${queue.length - head}`,
                  pixel: { x: nx, y: ny, color: [...fillColor] }
                });
              }
            }
          }
        }
      }
    }

    return { modifiedCount: count, steps, seed: { x: startX, y: startY } };
  }

  /**
   * Flood Fill Algorithm (4-connected or 8-connected, radiating queue-based)
   * Replaces target connected region of seed color with fillColor.
   */
  static floodFill(pixelData, width, height, startX, startY, fillColor, recordSteps = false, connectivity = 4) {
    startX = Math.round(startX);
    startY = Math.round(startY);
    connectivity = parseInt(connectivity) === 8 ? 8 : 4;

    if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
      return { modifiedCount: 0, steps: [], seed: { x: startX, y: startY } };
    }

    const getPixel = (x, y) => {
      const idx = (y * width + x) * 4;
      return [
        pixelData[idx],
        pixelData[idx + 1],
        pixelData[idx + 2],
        pixelData[idx + 3]
      ];
    };

    const setPixel = (x, y, col) => {
      const idx = (y * width + x) * 4;
      pixelData[idx] = col[0];
      pixelData[idx + 1] = col[1];
      pixelData[idx + 2] = col[2];
      pixelData[idx + 3] = col[3] !== undefined ? col[3] : 255;
    };

    const targetColor = getPixel(startX, startY);
    if (this.colorsMatch(targetColor, fillColor)) {
      return { modifiedCount: 0, steps: [], seed: { x: startX, y: startY }, blocked: true };
    }

    const steps = [];
    const queue = [{ x: startX, y: startY }];
    const visited = new Uint8Array(width * height);
    visited[startY * width + startX] = 1;
    setPixel(startX, startY, fillColor);
    let count = 1;

    // Record Step 0: explicitly mark and color seed point
    if (recordSteps) {
      steps.push({
        stepIndex: 0,
        type: 'flood',
        seedX: startX,
        seedY: startY,
        connectivity,
        description: `Seed Point selected at (${startX}, ${startY}) [Target: RGB(${targetColor[0]},${targetColor[1]},${targetColor[2]})] | Starting ${connectivity}-connected Flood Fill`,
        pixel: { x: startX, y: startY, color: [...fillColor] }
      });
    }

    const neighbors4 = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];
    const neighbors8 = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: -1 },  // Top-Right
      { dx: -1, dy: -1 }, // Top-Left
      { dx: 1, dy: 1 },   // Bottom-Right
      { dx: -1, dy: 1 }   // Bottom-Left
    ];
    const offsets = (connectivity === 8) ? neighbors8 : neighbors4;

    let head = 0;
    while (head < queue.length) {
      const { x, y } = queue[head++];

      for (let i = 0; i < offsets.length; i++) {
        const nx = x + offsets[i].dx;
        const ny = y + offsets[i].dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          if (!visited[nIdx]) {
            visited[nIdx] = 1;
            if (this.colorsMatch(getPixel(nx, ny), targetColor)) {
              setPixel(nx, ny, fillColor);
              count++;
              queue.push({ x: nx, y: ny });

              if (recordSteps) {
                steps.push({
                  stepIndex: steps.length,
                  type: 'flood',
                  seedX: startX,
                  seedY: startY,
                  connectivity,
                  description: `Filled (${nx}, ${ny}) from (${x}, ${y}) [${connectivity}-conn] | Queue: ${queue.length - head}`,
                  pixel: { x: nx, y: ny, color: [...fillColor] }
                });
              }
            }
          }
        }
      }
    }

    return { modifiedCount: count, steps, seed: { x: startX, y: startY } };
  }

  /**
   * Scanline Polygon Fill Algorithm
   * Uses Edge Table (ET) and Active Edge Table (AET).
   * Works on any polygon defined by vertices [ {x, y}, ... ].
   * Can record step-by-step scanline passes (one iteration per scanline Y).
   */
  static scanlinePolygonFill(pixelData, width, height, vertices, fillColor, recordSteps = false) {
    if (!vertices || vertices.length < 3) {
      return { modifiedCount: 0, steps: [] };
    }

    const setPixel = (x, y, col) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const idx = (y * width + x) * 4;
      pixelData[idx] = col[0];
      pixelData[idx + 1] = col[1];
      pixelData[idx + 2] = col[2];
      pixelData[idx + 3] = col[3];
    };

    // 1. Build Edge Table
    // Each edge has: yMax, xAtYmin, invSlope (1/m = dx/dy)
    let globalYmin = Infinity;
    let globalYmax = -Infinity;

    const edgeTable = {}; // Key: yMin -> Array of edge objects

    const numVertices = vertices.length;
    for (let i = 0; i < numVertices; i++) {
      let p1 = vertices[i];
      let p2 = vertices[(i + 1) % numVertices];

      // Ignore horizontal edges in ET
      if (p1.y === p2.y) continue;

      let yMin, yMax, xVal, dx, dy;
      if (p1.y < p2.y) {
        yMin = p1.y;
        yMax = p2.y;
        xVal = p1.x;
        dx = p2.x - p1.x;
        dy = p2.y - p1.y;
      } else {
        yMin = p2.y;
        yMax = p1.y;
        xVal = p2.x;
        dx = p1.x - p2.x;
        dy = p1.y - p2.y;
      }

      const invSlope = dx / dy;

      if (!edgeTable[yMin]) edgeTable[yMin] = [];
      edgeTable[yMin].push({
        yMax: yMax,
        currentX: xVal,
        invSlope: invSlope
      });

      if (yMin < globalYmin) globalYmin = yMin;
      if (yMax > globalYmax) globalYmax = yMax;
    }

    if (globalYmin === Infinity) {
      return { modifiedCount: 0, steps: [] };
    }

    globalYmin = Math.max(0, globalYmin);
    globalYmax = Math.min(height - 1, globalYmax);

    let activeEdgeTable = [];
    const steps = [];
    let count = 0;

    // Scan from minimum scanline to maximum scanline
    for (let y = globalYmin; y <= globalYmax; y++) {
      // 1. Add edges from Edge Table where yMin == y
      if (edgeTable[y]) {
        activeEdgeTable.push(...edgeTable[y]);
      }

      // 2. Remove edges from AET where y == yMax
      activeEdgeTable = activeEdgeTable.filter(edge => edge.yMax > y);

      // 3. Sort AET by currentX
      activeEdgeTable.sort((a, b) => a.currentX - b.currentX);

      // 4. Fill spans between pairs of intersections (even-odd parity rule)
      const scanlinePixels = [];
      for (let i = 0; i < activeEdgeTable.length - 1; i += 2) {
        const xStart = Math.max(0, Math.ceil(activeEdgeTable[i].currentX));
        const xEnd = Math.min(width - 1, Math.floor(activeEdgeTable[i + 1].currentX));

        for (let x = xStart; x <= xEnd; x++) {
          setPixel(x, y, fillColor);
          scanlinePixels.push({ x, y, color: [...fillColor] });
          count++;
        }
      }

      // Record step snapshot for this scanline iteration
      if (recordSteps) {
        steps.push({
          stepIndex: steps.length,
          type: 'scanline',
          y: y,
          activeEdgesCount: activeEdgeTable.length,
          description: `Scanline Y=${y}: ${activeEdgeTable.length} active edges, ${scanlinePixels.length} px filled`,
          pixels: scanlinePixels
        });
      }

      // 5. Update currentX for each edge in AET for next scanline: x = x + 1/m
      for (let edge of activeEdgeTable) {
        edge.currentX += edge.invSlope;
      }
    }

    return { modifiedCount: count, steps };
  }
}

// Attach to window
window.CGAlgorithms = CGAlgorithms;
