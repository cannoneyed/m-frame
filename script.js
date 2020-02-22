const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const SCALE = 50;
const CENTER_X = 400;
const CENTER_Y = 200;
const MI = 0.4;
let FRAME_SIZE = 0.25;

var slider = document.getElementById("slider");
slider.oninput = function() {
  FRAME_SIZE = this.value;
  drawM();
};

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Line {
  constructor(m, b, start, end) {
    this.m = m;
    this.b = b;
    this.start = start;
    this.end = end;
  }
}

const tl = new Point(-4, -2);
const tr = new Point(4, -2);

const itcc = new Point(0, -2 + MI);
const itcl = new Point(0 - MI, -2);
const itcr = new Point(0 + MI, -2);

const br = new Point(6, 2);
const bl = new Point(-6, 2);

const iblc = new Point(-2, 2 - MI);
const ibll = new Point(-2 - MI, 2);
const iblr = new Point(-2 + MI, 2);

const ibrc = new Point(2, 2 - MI);
const ibrl = new Point(2 - MI, 2);
const ibrr = new Point(2 + MI, 2);

function makeLine(a, b) {
  const slope = (b.y - a.y) / (b.x - a.x);
  const intercept = a.y - slope * a.x;
  return new Line(slope, intercept, a, b);
}

function drawPoints(path, color) {
  ctx.beginPath();
  path.forEach((point, index) => {
    const fn =
      index === 0 ? (x, y) => ctx.moveTo(x, y) : (x, y) => ctx.lineTo(x, y);
    const x = point.x * SCALE + CENTER_X;
    const y = point.y * SCALE + CENTER_Y;
    fn(x, y);
  });
  ctx.strokeStyle = color;
  ctx.stroke();
}

function getLineIntercept(a, b) {
  const x = (b.b - a.b) / (a.m - b.m);
  const y = a.m * x + a.b;
  return new Point(x, y);
}

function isPointWithin(point, start, end) {
  if (start.x > end.x) {
    return point.x < start.x && point.x > end.x;
  } else {
    return point.x > start.x && point.x < end.x;
  }
}

function isPointInside(point, vs) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  const x = point.x;
  const y = point.y;

  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x;
    let yi = vs[i].y;
    let xj = vs[j].x;
    let yj = vs[j].y;

    let intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

// prettier-ignore
const path = [ tl, itcl, itcc, itcr, tr, br, ibrr, ibrc, ibrl, iblr, iblc, ibll, bl, tl];

function makeLines() {
  const lines = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const line = makeLine(a, b);
    lines.push(line);
  }

  const expandedLines = [];
  const contractedLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const theta = Math.atan(1 / line.m);
    const deltaSlope = (0.5 * FRAME_SIZE) / Math.sin(theta);
    const lineA = new Line(line.m, line.b + deltaSlope);
    const lineB = new Line(line.m, line.b - deltaSlope);

    const midpointX = (line.end.x + line.start.x) / 2;
    const lineAMidpointY = lineA.m * midpointX + lineA.b;
    const midpoint = new Point(midpointX, lineAMidpointY);
    const isInterceptWithin = isPointInside(midpoint, path);

    if (!isInterceptWithin) {
      expandedLines.push(lineA);
      contractedLines.push(lineB);
    } else {
      expandedLines.push(lineB);
      contractedLines.push(lineA);
    }
  }
  return [expandedLines, contractedLines];
}

function makePathFromLines(lines) {
  const path = [];
  for (let i = 0; i < lines.length; i++) {
    const a = lines[i];
    const b = i === lines.length - 1 ? lines[0] : lines[i + 1];
    const intercept = getLineIntercept(a, b);
    path.push(intercept);
  }
  path.push(path[0]);
  return path;
}

function drawM() {
  const [expandedLines, contractedLines] = makeLines();
  const expandedPath = makePathFromLines(expandedLines);
  const contractedPath = makePathFromLines(contractedLines);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPoints(path, "black");
  drawPoints(expandedPath, "red");
  drawPoints(contractedPath, "blue");
}

drawM();
