// Puts a layout on a page: a positioned box with the felt oval, one absolutely placed wrapper per
// seat, and a centre. What a seat or the centre shows is the caller's (it passes nodes in).
import { screenClass, tableLayout } from "./layout.ts";
import type { Orientation, TableLayout } from "./layout.ts";

type Child = Node | string | null | undefined | false;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, style: Record<string, string> = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  Object.assign(node.style, style);
  for (const c of children) if (c) node.append(c);
  return node;
}

const percent = (v: number) => `${Math.round(v * 10000) / 100}%`;

// The CSS for one seat's wrapper: its centre at the seat's spot, turned to face out.
export function seatStyle(spot: { x: number; y: number; angle: number }): Record<string, string> {
  return {
    left: percent(spot.x), top: percent(spot.y),
    transform: spot.angle ? `translate(-50%, -50%) rotate(${Math.round(spot.angle * 1e4) / 1e4}rad)` : "translate(-50%, -50%)",
  };
}

// The box's aspect ratio (width / height) for CSS: 1 : 1.3 for portrait, the area's for others.
export function boxAspect(layout: TableLayout): string {
  return layout.orientation === "portrait" ? "1 / 1.3" : `${layout.width} / ${layout.height}`;
}

export type TableViewOptions = {
  layout: TableLayout;
  /** the node for seat `index` (0 is the viewer's) */
  seat: (index: number) => Node;
  /** the middle of the table, such as the board and the pot */
  centre?: Node;
};

// A table at the size of its container. Seat wrappers carry data-seat and the layout's orientation
// is the box's data-layout, for stylesheets.
export function tableView(o: TableViewOptions): HTMLElement {
  const { layout } = o;
  const box = el("div", "tl-table", { aspectRatio: boxAspect(layout) });
  box.dataset.layout = layout.orientation;
  const { cx, cy, rx, ry } = layout.oval;
  box.append(el("div", "tl-felt", { left: percent(cx - rx), top: percent(cy - ry), width: percent(2 * rx), height: percent(2 * ry) }));
  if (o.centre) box.append(el("div", "tl-centre", { left: "50%", top: "50%" }, o.centre));
  for (const spot of layout.seatSpots) {
    const wrap = el("div", "tl-seat", seatStyle(spot), o.seat(spot.index));
    wrap.dataset.seat = String(spot.index);
    box.append(wrap);
  }
  return box;
}

// A television screen: a header with a title, an optional status banner (the controls component's
// `banner`) and an optional exit control, then the table filling the rest.
export function tvScreen(o: { title: string; banner?: Node | null; exit?: Node | null; table: Node }): HTMLElement {
  const header = el("header", "tl-tv-header", {}, el("h2", "tl-tv-title", {}, o.title), o.exit);
  const screen = el("section", "tl-tv", {}, header, o.banner, el("div", "tl-tv-table", {}, o.table));
  screen.setAttribute("aria-label", o.title);
  return screen;
}

// Chooses the layout for a screen and builds the table in one call.
export function tableFor(o: { seats: number; width: number; height: number; tv?: boolean; turn?: number; seat: (index: number) => Node; centre?: Node }): { orientation: Orientation; element: HTMLElement } {
  const orientation = screenClass(o.width, o.height, o.tv);
  const layout = tableLayout({ seats: o.seats, orientation, width: o.width, height: o.height, turn: o.turn });
  return { orientation, element: tableView({ layout, seat: o.seat, centre: o.centre }) };
}
