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
   * DDA Line Algorithm (Digital Differential Analyzer)
   * Returns array of integer points [ {x, y}, ... ]
   */
  static ddaLine(x0, y0, x1, y1) {
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    if (steps === 0) return [{ x: x0, y: y0 }];

    const xInc = dx / steps;
    const yInc = dy / steps;
    let x = x0;
    let y = y0;
    const points = [];

    for (let k = 0; k <= steps; k++) {
      points.push({ x: Math.round(x), y: Math.round(y) });
      x += xInc;
      y += yInc;
    }
    return points;
  }

  /**
   * DDA Line Detailed with step-by-step decision & calculation table
   */
  static ddaLineDetailed(x0, y0, x1, y1, color, recordSteps = false) {
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const xInc = steps === 0 ? 0 : dx / steps;
    const yInc = steps === 0 ? 0 : dy / steps;

    let x = x0;
    let y = y0;
    const points = [];
    const stepRecords = [];

    for (let k = 0; k <= steps; k++) {
      const plotX = Math.round(x);
      const plotY = Math.round(y);
      points.push({ x: plotX, y: plotY });

      if (recordSteps) {
        stepRecords.push({
          stepIndex: k,
          type: 'dda_line',
          k: k,
          exactX: x.toFixed(2),
          exactY: y.toFixed(2),
          xInc: (k === 0 ? '-' : (xInc >= 0 ? '+' : '') + xInc.toFixed(2)),
          yInc: (k === 0 ? '-' : (yInc >= 0 ? '+' : '') + yInc.toFixed(2)),
          plotX: plotX,
          plotY: plotY,
          description: `Step k=${k}: Exact (${x.toFixed(2)}, ${y.toFixed(2)}) | Inc: Δx=${xInc.toFixed(2)}, Δy=${yInc.toFixed(2)} | Plotted: (${plotX}, ${plotY})`,
          pixel: { x: plotX, y: plotY, color: [...color] }
        });
      }

      x += xInc;
      y += yInc;
    }

    return { points, steps: stepRecords, modifiedCount: points.length };
  }

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
   * Bresenham Line Detailed with decision parameter table (pk, pk+1)
   */
  static bresenhamLineDetailed(x0, y0, x1, y1, color, recordSteps = false) {
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;

    const points = [];
    const stepRecords = [];
    let currX = x0;
    let currY = y0;

    if (dx >= dy) {
      // Driven by X (|m| <= 1)
      let pk = 2 * dy - dx;
      for (let k = 0; k <= dx; k++) {
        const prevX = currX;
        const prevY = currY;
        const plotX = currX;
        const plotY = currY;
        points.push({ x: plotX, y: plotY });

        let nextPk = '-';
        let condition = '-';

        if (k < dx) {
          if (pk < 0) {
            condition = 'pk < 0';
            nextPk = pk + 2 * dy;
            currX += sx;
          } else {
            condition = 'pk >= 0';
            nextPk = pk + 2 * dy - 2 * dx;
            currX += sx;
            currY += sy;
          }
        }

        if (recordSteps) {
          stepRecords.push({
            stepIndex: k,
            type: 'bresenham_line',
            k: k,
            prevX: prevX,
            prevY: prevY,
            pk: pk,
            condition: condition,
            plotX: plotX,
            plotY: plotY,
            nextPk: nextPk,
            description: `Step k=${k}: Point (${plotX}, ${plotY}) | Decision Parameter pk=${pk} (${condition}) -> next pk+1=${nextPk}`,
            pixel: { x: plotX, y: plotY, color: [...color] }
          });
        }

        pk = nextPk;
      }
    } else {
      // Driven by Y (|m| > 1)
      let pk = 2 * dx - dy;
      for (let k = 0; k <= dy; k++) {
        const prevX = currX;
        const prevY = currY;
        const plotX = currX;
        const plotY = currY;
        points.push({ x: plotX, y: plotY });

        let nextPk = '-';
        let condition = '-';

        if (k < dy) {
          if (pk < 0) {
            condition = 'pk < 0';
            nextPk = pk + 2 * dx;
            currY += sy;
          } else {
            condition = 'pk >= 0';
            nextPk = pk + 2 * dx - 2 * dy;
            currX += sx;
            currY += sy;
          }
        }

        if (recordSteps) {
          stepRecords.push({
            stepIndex: k,
            type: 'bresenham_line',
            k: k,
            prevX: prevX,
            prevY: prevY,
            pk: pk,
            condition: condition,
            plotX: plotX,
            plotY: plotY,
            nextPk: nextPk,
            description: `Step k=${k}: Point (${plotX}, ${plotY}) | Decision Parameter pk=${pk} (${condition}) -> next pk+1=${nextPk}`,
            pixel: { x: plotX, y: plotY, color: [...color] }
          });
        }

        pk = nextPk;
      }
    }

    return { points, steps: stepRecords, modifiedCount: points.length };
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
   * Midpoint Circle Detailed with step-by-step 8-octants decision parameter table
   */
  static midpointCircleDetailed(xc, yc, r, color, recordSteps = false) {
    xc = Math.round(xc);
    yc = Math.round(yc);
    r = Math.max(0, Math.round(r));

    const points = [];
    const stepRecords = [];

    if (r === 0) {
      points.push({ x: xc, y: yc });
      if (recordSteps) {
        stepRecords.push({
          stepIndex: 0,
          type: 'circle_midpoint',
          k: 0,
          prevX: 0,
          prevY: 0,
          pk: '-',
          condition: 'r=0',
          nextPk: '-',
          octants: [{ x: xc, y: yc }],
          pixels: [{ x: xc, y: yc, color: [...color] }],
          description: `Midpoint Circle r=0: Center (${xc}, ${yc})`
        });
      }
      return { points, steps: stepRecords, modifiedCount: 1 };
    }

    let x = 0;
    let y = r;
    let pk = 1 - r;
    let k = 0;

    while (x <= y) {
      const octants = [
        { x: xc + x, y: yc + y },
        { x: xc - x, y: yc + y },
        { x: xc + x, y: yc - y },
        { x: xc - x, y: yc - y },
        { x: xc + y, y: yc + x },
        { x: xc - y, y: yc + x },
        { x: xc + y, y: yc - x },
        { x: xc - y, y: yc - x }
      ];

      octants.forEach(pt => points.push(pt));

      let nextPk, condition, nextX, nextY;
      if (x < y) {
        if (pk < 0) {
          condition = 'pk < 0';
          nextPk = pk + 2 * (x + 1) + 1;
          nextX = x + 1;
          nextY = y;
        } else {
          condition = 'pk >= 0';
          nextPk = pk + 2 * (x + 1) + 1 - 2 * (y - 1);
          nextX = x + 1;
          nextY = y - 1;
        }
      } else {
        condition = 'Stop (x >= y)';
        nextPk = '-';
        nextX = x + 1;
        nextY = y;
      }

      if (recordSteps) {
        stepRecords.push({
          stepIndex: k,
          type: 'circle_midpoint',
          k: k,
          prevX: x,
          prevY: y,
          pk: pk,
          condition: condition,
          nextPk: nextPk,
          octants: octants,
          pixels: octants.map(p => ({ x: p.x, y: p.y, color: [...color] })),
          description: `Iteration k=${k}: (x=${x}, y=${y}) | pk=${pk} (${condition}) -> next pk+1=${nextPk} | 8 Octants Plotted`
        });
      }

      k++;
      x = nextX;
      y = nextY;
      pk = nextPk;
    }

    return { points, steps: stepRecords, modifiedCount: points.length };
  }

  /**
   * Bresenham's Circle Detailed with step-by-step 8-octants decision parameter table
   */
  static bresenhamCircleDetailed(xc, yc, r, color, recordSteps = false) {
    xc = Math.round(xc);
    yc = Math.round(yc);
    r = Math.max(0, Math.round(r));

    const points = [];
    const stepRecords = [];

    if (r === 0) {
      points.push({ x: xc, y: yc });
      if (recordSteps) {
        stepRecords.push({
          stepIndex: 0,
          type: 'circle_bresenham',
          k: 0,
          prevX: 0,
          prevY: 0,
          pk: '-',
          condition: 'r=0',
          nextPk: '-',
          octants: [{ x: xc, y: yc }],
          pixels: [{ x: xc, y: yc, color: [...color] }],
          description: `Bresenham Circle r=0: Center (${xc}, ${yc})`
        });
      }
      return { points, steps: stepRecords, modifiedCount: 1 };
    }

    let x = 0;
    let y = r;
    let dk = 3 - 2 * r;
    let k = 0;

    while (x <= y) {
      const octants = [
        { x: xc + x, y: yc + y },
        { x: xc - x, y: yc + y },
        { x: xc + x, y: yc - y },
        { x: xc - x, y: yc - y },
        { x: xc + y, y: yc + x },
        { x: xc - y, y: yc + x },
        { x: xc + y, y: yc - x },
        { x: xc - y, y: yc - x }
      ];

      octants.forEach(pt => points.push(pt));

      let nextDk, condition, nextX, nextY;
      if (x < y) {
        if (dk < 0) {
          condition = 'dk < 0';
          nextDk = dk + 4 * x + 6;
          nextX = x + 1;
          nextY = y;
        } else {
          condition = 'dk >= 0';
          nextDk = dk + 4 * (x - y) + 10;
          nextX = x + 1;
          nextY = y - 1;
        }
      } else {
        condition = 'Stop (x >= y)';
        nextDk = '-';
        nextX = x + 1;
        nextY = y;
      }

      if (recordSteps) {
        stepRecords.push({
          stepIndex: k,
          type: 'circle_bresenham',
          k: k,
          prevX: x,
          prevY: y,
          pk: dk,
          condition: condition,
          nextPk: nextDk,
          octants: octants,
          pixels: octants.map(p => ({ x: p.x, y: p.y, color: [...color] })),
          description: `Iteration k=${k}: (x=${x}, y=${y}) | dk=${dk} (${condition}) -> next dk+1=${nextDk} | 8 Octants Plotted`
        });
      }

      k++;
      x = nextX;
      y = nextY;
      dk = nextDk;
    }

    return { points, steps: stepRecords, modifiedCount: points.length };
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

      if (recordSteps && scanlinePixels.length > 0) {
        steps.push({
          stepIndex: steps.length,
          type: 'scanline',
          y: y,
          seedX: xc,
          seedY: yc,
          activeEdgesCount: 2,
          description: `Circle Scanline Y=${y}: Span [${xStart}..${xEnd}], ${scanlinePixels.length} px filled`,
          pixels: scanlinePixels
        });
      }
    }

    return { modifiedCount: count, steps, seed: { x: xc, y: yc } };
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
      return { modifiedCount: 0, steps: [], seed: { x: startX, y: startY } };
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
      return { modifiedCount: 0, steps: [], seed: { x: startX, y: startY }, blocked: true };
    }

    const steps = [];
    if (recordSteps) {
      steps.push({
        stepIndex: 0,
        type: 'scanline',
        seedX: startX,
        seedY: startY,
        description: `Seed Point selected at (${startX}, ${startY}) | Starting Scanline Flood Fill`,
        pixel: { x: startX, y: startY, color: [...fillColor] }
      });
    }

    const stack = [{ x: startX, y: startY }];
    const visited = new Uint8Array(width * height);
    let count = 0;

    while (stack.length > 0) {
      const { x, y } = stack.pop();
      if (y < 0 || y >= height) continue;
      if (visited[y * width + x]) continue;

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
          seedX: startX,
          seedY: startY,
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

    return { modifiedCount: count, steps, seed: { x: startX, y: startY } };
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
   * Point-in-polygon test (with boundary proximity tolerance)
   */
  static isPointInPolygon(x, y, vertices) {
    if (!vertices || vertices.length < 3) return false;
    let inside = false;
    const n = vertices.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;
      const intersect = ((yi > y) !== (yj > y)) &&
        (x <= (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    if (inside) return true;

    // Check proximity to polygon boundary edges (within ~1.2 px)
    for (let i = 0; i < n; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % n];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) {
        if (Math.hypot(x - p1.x, y - p1.y) <= 1.2) return true;
        continue;
      }
      const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / lenSq));
      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;
      if (Math.hypot(x - projX, y - projY) <= 1.2) return true;
    }
    return false;
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
      pixelData[idx + 3] = col[3] !== undefined ? col[3] : 255;
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

      let yMin, yMax, xVal, dx, dy, upperVertexIndex;
      if (p1.y < p2.y) {
        yMin = p1.y;
        yMax = p2.y;
        xVal = p1.x;
        dx = p2.x - p1.x;
        dy = p2.y - p1.y;
        upperVertexIndex = (i + 1) % numVertices;
      } else {
        yMin = p2.y;
        yMax = p1.y;
        xVal = p2.x;
        dx = p1.x - p2.x;
        dy = p1.y - p2.y;
        upperVertexIndex = i;
      }

      // Check if vertex at yMax is a local maximum (bottom-most point)
      let nextIdx = (upperVertexIndex + 1) % numVertices;
      while (nextIdx !== upperVertexIndex && vertices[nextIdx].y === yMax) {
        nextIdx = (nextIdx + 1) % numVertices;
      }
      let prevIdx = (upperVertexIndex - 1 + numVertices) % numVertices;
      while (prevIdx !== upperVertexIndex && vertices[prevIdx].y === yMax) {
        prevIdx = (prevIdx - 1 + numVertices) % numVertices;
      }

      // If not a local maximum (monotonic boundary), shorten incoming edge by 1 scanline
      const isLocalMax = (vertices[prevIdx].y < yMax && vertices[nextIdx].y < yMax);
      if (!isLocalMax) {
        yMax = yMax - 1;
      }

      if (yMax >= yMin) {
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

      // 2. Keep active edges where yMax >= y
      activeEdgeTable = activeEdgeTable.filter(edge => edge.yMax >= y);

      // 3. Sort AET by currentX
      activeEdgeTable.sort((a, b) => a.currentX - b.currentX);

      // 4. Fill spans between pairs of intersections (even-odd parity rule)
      const scanlinePixels = [];
      for (let i = 0; i < activeEdgeTable.length - 1; i += 2) {
        let xStart = Math.max(0, Math.round(activeEdgeTable[i].currentX));
        let xEnd = Math.min(width - 1, Math.round(activeEdgeTable[i + 1].currentX));
        if (xStart > xEnd) {
          const tmp = xStart;
          xStart = xEnd;
          xEnd = tmp;
        }

        for (let x = xStart; x <= xEnd; x++) {
          setPixel(x, y, fillColor);
          scanlinePixels.push({ x, y, color: [...fillColor] });
          count++;
        }
      }

      // Record step snapshot for this scanline iteration
      if (recordSteps && scanlinePixels.length > 0) {
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
