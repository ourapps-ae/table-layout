import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { FakeElement, installFakeDocument } from "./fake-dom.ts";
import { MAX_SEATS, MIN_SEATS, Ring, clampSeats, clockwiseTarget, relativeSeat, ringPoint, screenClass, seatAngle, tableBoxSize, tableCardWidth, tableLayout } from "../implementation/web/layout.ts";
import type { Orientation, TableLayout } from "../implementation/web/layout.ts";
import { PLACED } from "../implementation/web/placed-seats.ts";
import { boxAspect, seatStyle, tableFor, tableView, tvScreen } from "../implementation/web/table-view.ts";
import { build as buildFixtures, buildKotlin, SCREENS } from "./make-fixtures.ts";
import { nameTable } from "../examples/consumer.ts";

installFakeDocument();
const el = (x: unknown) => x as unknown as FakeElement;
const counts = [2, 3, 4, 5, 6, 7, 8, 9];
const area = (o: Orientation) => SCREENS[o];
const layoutOf = (n: number, o: Orientation): TableLayout => tableLayout({ seats: n, orientation: o, ...area(o) });

test("every seat count from 2 to 9 gives that many seats on every screen, inside the area, seat 0 at the bottom", () => {
  for (const o of ["portrait", "landscape", "tv"] as Orientation[]) for (const n of counts) {
    const l = layoutOf(n, o);
    assert.equal(l.seatSpots.length, n, `${o} ${n}`);
    l.seatSpots.forEach((s, i) => {
      assert.equal(s.index, i);
      for (const p of [s, s.cards, s.shown, s.bet]) assert.ok(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1, `${o} ${n} seat ${i} at ${p.x},${p.y}`);
    });
    const mine = l.seatSpots[0];
    assert.ok(mine.y > 0.8, `${o} ${n}: seat 0 near the bottom`);
    for (const s of l.seatSpots.slice(1)) assert.ok(s.y < mine.y + 1e-9, `${o} ${n}: others not below seat 0`);
  }
});

test("seats go clockwise from the bottom: the second seat is on the left half for 3 or more seats", () => {
  for (const o of ["portrait", "landscape"] as Orientation[]) for (const n of counts.filter((c) => c >= 4)) {
    const l = layoutOf(n, o);
    assert.ok(l.seatSpots[1].x < 0.5, `${o} ${n}`);
    assert.ok(l.seatSpots[n - 1].x > 0.5, `${o} ${n}`);
  }
  const tv = layoutOf(4, "tv");
  assert.deepEqual(tv.seatSpots.map((s) => [s.x, s.y]), [[0.5, 0.86], [0.14, 0.5], [0.5, 0.14], [0.86, 0.5]]);
});

test("seats are mirror images left to right in portrait and landscape, and never share a spot", () => {
  for (const o of ["portrait", "landscape"] as Orientation[]) for (const n of counts) {
    const l = layoutOf(n, o);
    {
      const xs = l.seatSpots.map((s) => s.x).sort((a, b) => a - b);
      const mirrored = xs.map((x) => 1 - x).sort((a, b) => a - b);
      xs.forEach((x, i) => assert.ok(Math.abs(x - mirrored[i]) < 0.02, `${o} ${n}: ${x} vs ${mirrored[i]}`));
    }
  }
  for (const o of ["portrait", "landscape", "tv"] as Orientation[]) for (const n of counts) {
    const spots = layoutOf(n, o).seatSpots;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) assert.ok(Math.hypot(spots[i].x - spots[j].x, spots[i].y - spots[j].y) > 0.08, `${o} ${n}: seats ${i} and ${j} too close`);
  }
});

test("seat plates do not overlap on a landscape or television screen", () => {
  for (const o of ["landscape", "tv"] as Orientation[]) for (const n of counts) {
    const l = layoutOf(n, o);
    const turned = (s: TableLayout["seatSpots"][number]) => {
      // a plate turned by angle: its bounding box
      const c = Math.abs(Math.cos(s.angle)), sn = Math.abs(Math.sin(s.angle));
      const w = (l.plate.w * l.width * c + l.plate.h * l.height * sn) / l.width;
      const h = (l.plate.w * l.width * sn + l.plate.h * l.height * c) / l.height;
      return { x0: s.x - w / 2, x1: s.x + w / 2, y0: s.y - h / 2, y1: s.y + h / 2 };
    };
    const boxes = l.seatSpots.map(turned);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = boxes[i], b = boxes[j];
      const overlap = a.x0 < b.x1 - 1e-9 && b.x0 < a.x1 - 1e-9 && a.y0 < b.y1 - 1e-9 && b.y0 < a.y1 - 1e-9;
      assert.ok(!overlap, `${o} ${n}: plates ${i} and ${j} overlap`);
    }
  }
});

test("portrait positions are the recipe's hand-placed cards and stakes", () => {
  for (const n of counts) {
    const l = layoutOf(n, "portrait");
    l.seatSpots.forEach((s, k) => {
      assert.deepEqual([s.cards.x * 100, s.cards.y * 100].map((v) => Math.round(v * 10) / 10), PLACED[n].hidden[k].map((v) => Math.round(v * 10) / 10));
      assert.deepEqual([s.bet.x, s.bet.y], [PLACED[n].bets[k][0] / 100, PLACED[n].bets[k][1] / 100]);
      assert.equal(s.angle, 0);
    });
  }
  assert.equal(PLACED[2].bets[0][1], 72);
  const four = layoutOf(4, "portrait");
  assert.deepEqual([four.seatSpots[1].shown.x, four.seatSpots[1].shown.y], [0.179, 0.64], "open cards sit lower than hidden ones at the sides");
  assert.deepEqual([four.pot.x, four.pot.y, four.deck.x, four.burn.x], [0.5, 0.63, 0.45, 0.55]);
});

test("the portrait ring is the recipe's: viewer's seat lifted, others on the rim", () => {
  const mine = ringPoint(seatAngle(0, 6));
  assert.ok(Math.abs(mine.x - 0.5) < 1e-9 && Math.abs(mine.y - 0.88) < 1e-9);
  const opposite = ringPoint(seatAngle(3, 6));
  assert.ok(Math.abs(opposite.y - 0.06) < 1e-9);
  const side = ringPoint(seatAngle(1, 4));
  assert.ok(Math.abs(side.x - 0.07) < 1e-9 && Math.abs(side.y - 0.5) < 1e-9);
});

test("the television uses fixed spots, upright, and a landscape ring spaces seats evenly along the oval", () => {
  for (const n of counts) for (const s of layoutOf(n, "tv").seatSpots) assert.equal(s.angle, 0);
  const l = layoutOf(6, "landscape");
  const ring = new Ring(l.oval.rx * l.width, l.oval.ry * l.height);
  const lap = Array.from({ length: 7 }, (_, i) => ring.angle(i / 6) + (i === 6 ? 2 * Math.PI : 0));
  const length = (a: number, b: number) => {
    let sum = 0;
    for (let k = 0; k < 200; k++) {
      const p = ring.point(a + ((b - a) * k) / 200), q = ring.point(a + ((b - a) * (k + 1)) / 200);
      sum += Math.hypot(q.x - p.x, q.y - p.y);
    }
    return sum;
  };
  const arcs = lap.slice(0, 6).map((a, i) => length(a, lap[i + 1]));
  const mean = arcs.reduce((x, y) => x + y) / 6;
  for (const a of arcs) assert.ok(Math.abs(a - mean) / mean < 0.01, `arc ${a} vs ${mean}`);
  // seats are turned so their foot faces out: the bottom seat is upright and the top seat upside down
  assert.ok(Math.abs(l.seatSpots[0].angle) < 1e-9);
  assert.ok(Math.abs(Math.abs(layoutOf(2, "landscape").seatSpots[1].angle) - Math.PI) < 1e-6);
});

test("ring fractions and angles round trip, and turning the table moves every seat", () => {
  const ring = new Ring(400, 250);
  for (const f of [0, 0.1, 0.37, 0.5, 0.83]) {
    const t = ring.angle(f);
    const p = ring.point(t);
    assert.ok(Math.abs(ring.fractionToward(p, { x: 0, y: 0 }) - f) < 0.01, `fraction ${f}`);
  }
  assert.ok(Math.abs(ring.angle(0) - Math.PI / 2) < 1e-9);
  const a = tableLayout({ seats: 5, orientation: "landscape", width: 1280, height: 720 });
  const b = tableLayout({ seats: 5, orientation: "landscape", width: 1280, height: 720, turn: 0.2 });
  assert.notDeepEqual(a.seatSpots[0], b.seatSpots[0]);
  const same = tableLayout({ seats: 5, orientation: "landscape", width: 1280, height: 720, turn: 1 });
  a.seatSpots.forEach((s, i) => { assert.ok(Math.abs(s.x - same.seatSpots[i].x) < 1e-9 && Math.abs(s.y - same.seatSpots[i].y) < 1e-9); });
  const tv = tableLayout({ seats: 5, orientation: "tv", width: 1920, height: 1080, turn: 0.4 });
  assert.deepEqual(tv.seatSpots, layoutOf(5, "tv").seatSpots, "a television does not turn");
});

test("the middle row runs deck, burn pile, board and pot along the long side", () => {
  for (const o of ["landscape", "tv"] as Orientation[]) {
    const l = layoutOf(6, o);
    assert.equal(l.board.length, 5);
    for (let i = 1; i < 5; i++) assert.ok(l.board[i].x > l.board[i - 1].x, `${o}: board runs left to right`);
    assert.ok(l.burn.x < l.deck.x && l.deck.x < l.board[0].x && l.board[4].x < l.pot.x, `${o}: order of the middle row`);
    assert.ok(Math.abs(l.board[2].x - 0.5) < 1e-9);
  }
  const tall = tableLayout({ seats: 6, orientation: "landscape", width: 700, height: 900 });
  assert.equal(tall.middleAngle, Math.PI / 2);
  assert.ok(tall.board[4].y > tall.board[0].y, "a tall wide table runs its middle row downward");
  assert.equal(layoutOf(6, "landscape").middleAngle, 0);
});

test("screen class, relative seats, clamping and sizes", () => {
  assert.equal(screenClass(390, 844), "portrait");
  assert.equal(screenClass(500, 300), "portrait", "narrow windows use the column");
  assert.equal(screenClass(1024, 1366), "portrait");
  assert.equal(screenClass(1280, 720), "landscape");
  assert.equal(screenClass(1280, 720, true), "tv");
  assert.equal(relativeSeat(3, 1, 5), 2);
  assert.equal(relativeSeat(0, 3, 5), 2);
  assert.equal(relativeSeat(1, 1, 5), 0);
  assert.equal(clampSeats(1), MIN_SEATS);
  assert.equal(clampSeats(12), MAX_SEATS);
  assert.equal(clampSeats(4.9), 4);
  assert.equal(layoutOf(1, "portrait").seats, 2);
  assert.equal(tableLayout({ seats: 20, orientation: "tv" }).seatSpots.length, 9);
  assert.throws(() => tableLayout({ seats: 4, orientation: "landscape", width: 0, height: 10 }), /above 0/);
  assert.equal(tableCardWidth(6, false), 29);
  assert.equal(tableCardWidth(6, true), 36);
  assert.equal(tableCardWidth(7, false), 24);
  assert.equal(tableCardWidth(9, true), 32);
  assert.ok(Math.abs(clockwiseTarget(null, 1) - 1) < 1e-12);
  assert.ok(Math.abs(clockwiseTarget(1, 0.5) - (0.5 + 2 * Math.PI)) < 1e-9, "going back goes round the long way");
  assert.ok(Math.abs(clockwiseTarget(1, 2) - 2) < 1e-9);
  const phone = tableBoxSize(390, 844, { reserved: 290 });
  assert.ok(Math.abs(phone.height / phone.width - 1.3) < 1e-9 && phone.width <= 390 - 24 + 1e-9);
  const wideBox = tableBoxSize(1280, 720, { reserved: 58 });
  assert.ok(Math.abs(wideBox.height - (720 - 24 - 58)) < 1e-9);
  assert.equal(tableBoxSize(100, 100, { reserved: 500 }).width, 0);
});

test("a table view places the felt, the centre and one wrapper per seat", () => {
  const l = layoutOf(4, "portrait");
  const t = el(tableView({ layout: l, seat: (i) => `seat ${i}` as unknown as Node, centre: "pot" as unknown as Node }));
  assert.equal(t.dataset.layout, "portrait");
  assert.equal(t.style.aspectRatio, "1 / 1.3");
  const felt = t.find((e) => e.className === "tl-felt")[0];
  assert.deepEqual([felt.style.left, felt.style.top, felt.style.width, felt.style.height], ["5%", "9%", "90%", "82%"]);
  const seats = t.find((e) => e.className === "tl-seat");
  assert.equal(seats.length, 4);
  assert.equal(seats[0].dataset.seat, "0");
  assert.equal(seats[0].style.left, "50%");
  assert.equal(seats[0].style.top, "88%");
  assert.equal(seats[0].style.transform, "translate(-50%, -50%)");
  assert.equal(seats[3].text, "seat 3");
  assert.equal(t.find((e) => e.className === "tl-centre")[0].text, "pot");
  assert.equal(boxAspect(layoutOf(4, "tv")), "1920 / 1080");
  assert.match(seatStyle({ x: 0.1, y: 0.2, angle: 1.5 }).transform, /rotate\(1.5rad\)/);
  assert.equal(el(tableView({ layout: l, seat: () => "x" as unknown as Node })).find((e) => e.className === "tl-centre").length, 0);
});

test("a television screen has a header, a banner and the table", () => {
  const table = tableFor({ seats: 6, width: 1920, height: 1080, tv: true, seat: () => "s" as unknown as Node });
  assert.equal(table.orientation, "tv");
  const screen = el(tvScreen({ title: "Table", banner: "Your turn" as unknown as Node, exit: "Stop" as unknown as Node, table: table.element }));
  assert.equal(screen.attrs["aria-label"], "Table");
  assert.equal(screen.find((e) => e.tagName === "h2")[0].text, "Table");
  assert.equal(screen.find((e) => e.className === "tl-tv-header")[0].text, "TableStop");
  assert.equal(screen.find((e) => e.className === "tl-seat").length, 6);
  assert.equal(tableFor({ seats: 3, width: 390, height: 844, seat: () => "s" as unknown as Node }).orientation, "portrait");
  assert.equal(tableFor({ seats: 3, width: 1280, height: 720, seat: () => "s" as unknown as Node }).orientation, "landscape");
});

test("the native fixtures are the TypeScript layouts", () => {
  assert.equal(readFileSync(new URL("fixtures/layouts.json", import.meta.url), "utf8"), buildFixtures());
  assert.equal(readFileSync(new URL("android/Expected.kt", import.meta.url), "utf8"), buildKotlin());
});

test("a consumer lays names out for any screen without a game", () => {
  const phone = el(nameTable(["A", "B", "C"], { width: 390, height: 844 }).element);
  assert.deepEqual(phone.find((e) => e.className === "tl-seat").map((s) => s.text), ["A", "B", "C"]);
  const tv = nameTable(["A", "B", "C", "D"], { width: 1920, height: 1080, tv: true });
  assert.equal(tv.orientation, "tv");
});

test("the OpenRPC interface describes the layout shape and the exported functions", async () => {
  const doc = JSON.parse(readFileSync(new URL("../interfaces/table-layout.json", import.meta.url), "utf8"));
  assert.equal(doc.openrpc, "1.3.2");
  assert.deepEqual([doc.info.title, doc.info.version], ["ae/table-layout", "1.0.0"]);
  const { TableLayout: shape, SeatSpot, Limits, Orientation } = doc.components.schemas;
  for (const o of Orientation.enum as Orientation[]) {
    const l = layoutOf(5, o);
    assert.deepEqual(Object.keys(l).sort(), [...shape.required].sort(), o);
    assert.deepEqual(Object.keys(l.seatSpots[0]).sort(), [...SeatSpot.required].sort(), o);
    assert.equal(l.board.length, shape.properties.board.minItems);
  }
  assert.deepEqual(Limits.const, { minSeats: MIN_SEATS, maxSeats: MAX_SEATS, portraitAspect: 1.3 });
  const web: Record<string, unknown> = { ...(await import("../implementation/web/layout.ts")), ...(await import("../implementation/web/table-view.ts")) };
  for (const method of doc.methods) {
    const [owner, member] = method.name.split(".");
    assert.equal(typeof web[owner], "function", method.name);
    if (member) assert.equal(typeof (Ring.prototype as unknown as Record<string, unknown>)[member], "function", method.name);
  }
});
