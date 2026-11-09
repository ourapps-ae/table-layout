// Seats around an oval table on every screen: a phone-shaped table box (portrait), a wide table
// (landscape) and a television. Pure functions of the seat count and the area; nothing here draws.
//
// Positions are fractions (0 to 1) of the area given. Seat 0 is the viewer's, at the bottom; the
// others follow clockwise on screen. `angle` is how far a seat's plate is turned (radians, clockwise
// on screen) so its foot faces out from the table; it is 0 on portrait and television layouts.
import { PLACED } from "./placed-seats.ts";

export type Orientation = "portrait" | "landscape" | "tv";
export type Point = { x: number; y: number };
export type SeatSpot = {
  index: number;
  x: number;
  y: number;
  angle: number;
  /** where this seat's hidden cards sit */
  cards: Point;
  /** where its open cards and folded cards sit */
  shown: Point;
  /** where its stake sits in front of it */
  bet: Point;
};
export type TableLayout = {
  orientation: Orientation;
  seats: number;
  width: number;
  height: number;
  seatSpots: SeatSpot[];
  /** the felt oval, centre and radii as fractions of the area; seats sit on its rim */
  oval: { cx: number; cy: number; rx: number; ry: number };
  /** a seat's plate, as fractions of the area */
  plate: { w: number; h: number };
  pot: Point;
  deck: Point;
  burn: Point;
  board: Point[];
  /** card widths in points for hidden and open cards on the table */
  cardWidth: { hidden: number; shown: number };
  /** how far the middle row (deck, board, pot) is turned: 0, or a quarter turn on a tall wide table */
  middleAngle: number;
};

export const MIN_SEATS = 2;
export const MAX_SEATS = 9;
export const PORTRAIT_ASPECT = 1.3;
const TWO_PI = Math.PI * 2;

export const clampSeats = (n: number): number => Math.min(MAX_SEATS, Math.max(MIN_SEATS, Math.floor(n)));

// Phones and narrow windows get the portrait column; wider areas the landscape table; a television its own.
export function screenClass(width: number, height: number, tv = false): Orientation {
  if (tv) return "tv";
  return width < 600 || height >= width ? "portrait" : "landscape";
}

// Seat k counted clockwise from the viewer's own seat.
export function relativeSeat(seat: number, mySeat: number, count: number): number {
  const n = Math.max(MIN_SEATS, count);
  return (((seat - mySeat) % n) + n) % n;
}

// How far round the table a seat is, clockwise from straight below (radians).
export const seatAngle = (k: number, n: number): number => Math.PI / 2 + (TWO_PI * k) / n;

// A point on the portrait table's ring of seats at any angle, for a light gliding between seats
// (the viewer's own seat, straight below, sits a little higher).
export function ringPoint(a: number): Point {
  const lift = Math.max(0, Math.sin(a)) ** 8 * 0.06;
  return { x: 0.5 + 0.43 * Math.cos(a), y: 0.5 + (0.44 - lift) * Math.sin(a) };
}

// The angle to move a light to so every move goes clockwise, however far.
export function clockwiseTarget(from: number | null, to: number): number {
  return from === null ? to : from + ((((to - from) % TWO_PI) + TWO_PI) % TWO_PI);
}

// Seven and more get smaller cards on the table; open cards are larger than hidden ones.
export function tableCardWidth(n: number, faceUp: boolean): number {
  return n >= 7 ? (faceUp ? 32 : 24) : faceUp ? 36 : 29;
}

// The portrait table box for a screen: its size in the same units as the screen. A tall screen fits
// the table as large as leaves `reserved` height for the rest; a wide one gives it the full height.
export function tableBoxSize(width: number, height: number, o: { padding?: number; reserved?: number } = {}): { width: number; height: number } {
  const padding = o.padding ?? 12;
  const reserved = o.reserved ?? 0;
  const byWidth = width - 2 * padding;
  const byHeight = (height - 2 * padding - reserved) / PORTRAIT_ASPECT;
  const w = Math.max(0, width > height ? byHeight : Math.min(byWidth, byHeight));
  return { width: w, height: w * PORTRAIT_ASPECT };
}

// Points round an ellipse at equal distances along it, from the bottom, clockwise on screen.
export class Ring {
  static readonly steps = 240;
  private lengths: number[];

  readonly rx: number;
  readonly ry: number;

  constructor(rx: number, ry: number) {
    this.rx = rx;
    this.ry = ry;
    const out = [0];
    let last = { x: 0, y: ry };
    for (let k = 1; k <= Ring.steps; k++) {
      const t = Math.PI / 2 + (TWO_PI * k) / Ring.steps;
      const p = { x: rx * Math.cos(t), y: ry * Math.sin(t) };
      out.push(out[k - 1] + Math.hypot(p.x - last.x, p.y - last.y));
      last = p;
    }
    this.lengths = out;
  }

  // The ellipse's angle at a fraction of the way round.
  angle(fraction: number): number {
    const f = fraction - Math.floor(fraction);
    const target = f * this.lengths[Ring.steps];
    let lo = 0, hi = Ring.steps;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.lengths[mid] <= target) lo = mid; else hi = mid;
    }
    const span = Math.max(0.0001, this.lengths[hi] - this.lengths[lo]);
    const k = lo + (target - this.lengths[lo]) / span;
    return Math.PI / 2 + (TWO_PI * k) / Ring.steps;
  }

  point(t: number): Point {
    return { x: this.rx * Math.cos(t), y: this.ry * Math.sin(t) };
  }

  // The fraction of the way round at the edge point in the direction of `p` from the centre `c`.
  fractionToward(p: Point, c: Point): number {
    const phi = Math.atan2(p.y - c.y, p.x - c.x);
    const t = Math.atan2(this.rx * Math.sin(phi), this.ry * Math.cos(phi));
    let k = (t - Math.PI / 2) / TWO_PI;
    k -= Math.floor(k);
    const x = k * Ring.steps;
    const i = Math.min(Ring.steps - 1, Math.floor(x));
    const l = this.lengths[i] + (this.lengths[i + 1] - this.lengths[i]) * (x - i);
    return l / this.lengths[Ring.steps];
  }

  // Straight out from the ellipse at that angle.
  outward(t: number): number {
    return Math.atan2(Math.sin(t) / this.ry, Math.cos(t) / this.rx);
  }
}

// A local point (relative to the centre) turned by an angle (clockwise on screen) about the centre.
function turned(p: Point, a: number, c: Point): Point {
  return { x: c.x + p.x * Math.cos(a) - p.y * Math.sin(a), y: c.y + p.x * Math.sin(a) + p.y * Math.cos(a) };
}

// The television's fixed seat spots, as fractions of the screen, by seat count.
const TV_SEATS: Record<number, [number, number][]> = {
  2: [[0.5, 0.86], [0.5, 0.14]],
  3: [[0.5, 0.86], [0.25, 0.14], [0.75, 0.14]],
  4: [[0.5, 0.86], [0.14, 0.5], [0.5, 0.14], [0.86, 0.5]],
  5: [[0.5, 0.86], [0.14, 0.5], [0.32, 0.14], [0.68, 0.14], [0.86, 0.5]],
  6: [[0.3, 0.86], [0.14, 0.5], [0.3, 0.14], [0.7, 0.14], [0.86, 0.5], [0.7, 0.86]],
  7: [[0.5, 0.86], [0.22, 0.74], [0.14, 0.4], [0.32, 0.14], [0.68, 0.14], [0.86, 0.4], [0.78, 0.74]],
  8: [[0.3, 0.86], [0.14, 0.62], [0.14, 0.36], [0.3, 0.14], [0.7, 0.14], [0.86, 0.36], [0.86, 0.62], [0.7, 0.86]],
  9: [[0.5, 0.86], [0.22, 0.86], [0.14, 0.6], [0.14, 0.34], [0.34, 0.14], [0.66, 0.14], [0.86, 0.34], [0.86, 0.6], [0.78, 0.86]],
};

const pct = (pair: number[]): Point => ({ x: pair[0] / 100, y: pair[1] / 100 });

function portrait(n: number): TableLayout {
  const placed = PLACED[n];
  const seatSpots: SeatSpot[] = Array.from({ length: n }, (_, k) => {
    const p = ringPoint(seatAngle(k, n));
    return {
      index: k, x: p.x, y: p.y, angle: 0,
      cards: pct(placed.hidden[k] ?? [50, 70]), shown: pct(placed.shown[k] ?? [50, 70]), bet: pct(placed.bets[k] ?? [50, 70]),
    };
  });
  return {
    orientation: "portrait", seats: n, width: 1, height: PORTRAIT_ASPECT, seatSpots,
    oval: { cx: 0.5, cy: 0.5, rx: 0.45, ry: 0.41 },
    plate: { w: 0.24, h: 0.2 },
    pot: { x: 0.5, y: 0.63 }, deck: { x: 0.45, y: 0.28 }, burn: { x: 0.55, y: 0.28 },
    board: [0, 1, 2, 3, 4].map((i) => ({ x: 0.5 + (i - 2) * 0.11, y: 0.5 })),
    cardWidth: { hidden: tableCardWidth(n, false), shown: tableCardWidth(n, true) },
    middleAngle: 0,
  };
}

// Wide and television layouts, in points of the area, sizes in units of a 560 point short side.
function wide(n: number, width: number, height: number, tv: boolean, turn: number): TableLayout {
  const u = tv ? Math.min(Math.min(width, height) / 560, width / 760) : Math.min(width, height) / 560;
  const plate = { w: (n >= 8 ? 172 : 200) * u, h: 60 * u };
  const gap = 6 * u, front = 50 * u;
  const rx = Math.max(1, width / 2 - 14 * u - (tv ? plate.w : plate.h) / 2);
  const ry = Math.max(1, height / 2 - (tv ? 72 : 14) * u - plate.h / 2);
  const ring = new Ring(rx, ry);
  const centre = { x: width / 2, y: height / 2 };
  const cardWidth = 26 * u;
  const cardsAt = { x: -plate.w / 2 + 10 * u + cardWidth + 1.5 * u, y: -3 * u };
  const frontAt = { x: 0, y: -(plate.h / 2 + gap + front / 2) };
  const f = (p: Point): Point => ({ x: p.x / width, y: p.y / height });
  const seatSpots: SeatSpot[] = Array.from({ length: n }, (_, i) => {
    let at: Point, angle: number;
    if (tv) {
      const [px, py] = TV_SEATS[n][i];
      at = { x: px * width, y: py * height };
      angle = 0;
    } else {
      const t = ring.angle(turn + i / n);
      const p = ring.point(t);
      at = { x: centre.x + p.x, y: centre.y + p.y };
      angle = ring.outward(t) - Math.PI / 2;
    }
    const cards = f(turned(cardsAt, angle, at));
    return { index: i, ...f(at), angle, cards, shown: cards, bet: f(turned(frontAt, angle, at)) };
  });
  // The middle: deck and burn pile, five board cards, the pot ring, along the long sides.
  const middleAngle = !tv && height > width ? Math.PI / 2 : 0;
  const reach = plate.h / 2 + gap + front + 16 * u;
  const middleWidth = tv ? Math.max(120 * u, width * 0.72 - plate.w - 2 * gap) : 2 * (Math.max(rx, ry) - reach);
  const mu = tv ? u * Math.min(1, middleWidth / (420 * u)) : u;
  const rowY = tv ? 25 * mu : 0;
  const boardCard = 44 * mu;
  const boardX = (i: number) => (i - 2) * (boardCard + 6 * mu);
  const deckX = boardX(0) - boardCard / 2 - 27 * mu;
  const burnX = deckX - 38 * mu;
  const potX = boardX(4) + boardCard / 2 + 50 * mu;
  const mid = (x: number) => f(turned({ x, y: rowY }, middleAngle, centre));
  return {
    orientation: tv ? "tv" : "landscape", seats: n, width, height, seatSpots,
    oval: { cx: 0.5, cy: 0.5, rx: rx / width, ry: ry / height },
    plate: { w: plate.w / width, h: plate.h / height },
    pot: mid(potX), deck: mid(deckX), burn: mid(burnX), board: [0, 1, 2, 3, 4].map((i) => mid(boardX(i))),
    cardWidth: { hidden: 26 * u, shown: 26 * u },
    middleAngle,
  };
}

// The layout for `seats` seats (2 to 9; others are clamped) in an area of width x height. Portrait
// ignores the size (positions are fractions of the table box, whose height is 1.3 times its width).
// `turn` rotates the landscape ring by that fraction of a lap, so the viewer can spin the table.
export function tableLayout(o: { seats: number; orientation: Orientation; width?: number; height?: number; turn?: number }): TableLayout {
  const n = clampSeats(o.seats);
  if (o.orientation === "portrait") return portrait(n);
  const width = o.width ?? 1920, height = o.height ?? 1080;
  if (!(width > 0 && height > 0)) throw new Error("width and height must be above 0");
  return wide(n, width, height, o.orientation === "tv", o.orientation === "tv" ? 0 : o.turn ?? 0);
}
