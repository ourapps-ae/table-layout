// A consumer that needs no game: seats that are just names, in the layout for the screen.
import { tableFor } from "../implementation/web/table-view.ts";

export function nameTable(names: string[], screen: { width: number; height: number; tv?: boolean }) {
  return tableFor({
    seats: names.length, ...screen,
    seat: (i) => { const s = document.createElement("span"); s.append(names[i]); return s; },
    centre: (() => { const c = document.createElement("span"); c.append("pot"); return c; })(),
  });
}
