export interface ChartRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

const PALETTE = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

function colorFor(index: number): string {
  return PALETTE[index % PALETTE.length] ?? "#2563eb";
}

/** Horizontal bar chart — labels are frequently long department/employee names, so horizontal
 * bars (unlike the frontend's vertical Recharts bars) keep them legible without rotation. */
export function drawBarChart(doc: PDFKit.PDFDocument, rect: ChartRect, data: ChartPoint[]): void {
  const points = data.slice(0, 10);
  if (points.length === 0) return;
  const max = Math.max(...points.map((p) => p.value), 1);
  const rowHeight = rect.height / points.length;
  const labelWidth = 130;
  const barAreaWidth = rect.width - labelWidth - 50;

  points.forEach((point, index) => {
    const y = rect.y + index * rowHeight + rowHeight * 0.15;
    const barHeight = rowHeight * 0.7;
    const barWidth = Math.max(2, (point.value / max) * barAreaWidth);

    doc
      .fontSize(8)
      .fillColor("#334155")
      .text(point.label, rect.x, y + barHeight / 2 - 4, { width: labelWidth - 8, ellipsis: true });
    doc.rect(rect.x + labelWidth, y, barWidth, barHeight).fill(colorFor(index));
    doc
      .fontSize(8)
      .fillColor("#0f172a")
      .text(String(point.value), rect.x + labelWidth + barWidth + 4, y + barHeight / 2 - 4);
  });
}

/** Line/area chart — a simple polyline over evenly-spaced points; area charts additionally fill
 * down to the baseline. */
export function drawLineChart(
  doc: PDFKit.PDFDocument,
  rect: ChartRect,
  data: ChartPoint[],
  options: { filled?: boolean } = {},
): void {
  const points = data.slice(0, 24);
  if (points.length < 2) return;
  const max = Math.max(...points.map((p) => p.value), 1);
  const stepX = rect.width / (points.length - 1);
  const baselineY = rect.y + rect.height;

  const coords = points.map((point, index) => ({
    x: rect.x + index * stepX,
    y: baselineY - (point.value / max) * rect.height,
  }));
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (!first || !last) return;

  if (options.filled) {
    doc.moveTo(first.x, baselineY);
    coords.forEach((c) => doc.lineTo(c.x, c.y));
    doc.lineTo(last.x, baselineY);
    doc.closePath().fillOpacity(0.25).fill(colorFor(0)).fillOpacity(1);
  }

  doc.moveTo(first.x, first.y);
  coords.slice(1).forEach((c) => doc.lineTo(c.x, c.y));
  doc.strokeColor(colorFor(0)).lineWidth(1.5).stroke();

  coords.forEach((c) => doc.circle(c.x, c.y, 2).fill(colorFor(0)));

  doc.fontSize(7).fillColor("#64748b");
  points.forEach((point, index) => {
    if (points.length > 8 && index % Math.ceil(points.length / 8) !== 0) return;
    const coord = coords[index];
    if (!coord) return;
    doc.text(point.label, coord.x - 15, baselineY + 4, { width: 30, align: "center" });
  });
}

/** Pie/donut chart — slices are approximated as polygon fans (many short line segments around
 * the arc) rather than a true circular-arc primitive; PDFKit has no direct arc-fill method, and at
 * 2-degree segments the approximation is visually indistinguishable from a true arc. A donut is
 * the same fan with a white circle punched over the center. */
export function drawPieChart(
  doc: PDFKit.PDFDocument,
  rect: ChartRect,
  data: ChartPoint[],
  options: { donut?: boolean } = {},
): void {
  const points = data.filter((p) => p.value > 0);
  const total = points.reduce((sum, p) => sum + p.value, 0);
  if (total <= 0) return;

  const cx = rect.x + rect.height / 2;
  const cy = rect.y + rect.height / 2;
  const radius = rect.height / 2 - 4;
  const segmentStep = (2 * Math.PI) / 180;

  let angle = -Math.PI / 2;
  points.forEach((point, index) => {
    const sweep = (point.value / total) * 2 * Math.PI;
    doc.moveTo(cx, cy);
    for (let a = angle; a <= angle + sweep; a += segmentStep) {
      doc.lineTo(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
    }
    doc.lineTo(cx + radius * Math.cos(angle + sweep), cy + radius * Math.sin(angle + sweep));
    doc.closePath().fill(colorFor(index));
    angle += sweep;
  });

  if (options.donut) {
    doc.circle(cx, cy, radius * 0.55).fill("#ffffff");
  }

  const legendX = rect.x + rect.height + 16;
  let legendY = rect.y + 4;
  doc.fontSize(8);
  points.forEach((point, index) => {
    const pct = Math.round((point.value / total) * 1000) / 10;
    doc.rect(legendX, legendY, 8, 8).fill(colorFor(index));
    doc
      .fillColor("#334155")
      .text(`${point.label} — ${point.value} (${pct}%)`, legendX + 12, legendY - 1, {
        width: rect.width - rect.height - 30,
        ellipsis: true,
      });
    legendY += 14;
  });
}
