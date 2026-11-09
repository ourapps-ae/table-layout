// A very small stand-in for the browser page: elements with classes, styles, data attributes and children.
export class FakeElement {
  tagName: string;
  children: (FakeElement | string)[] = [];
  attrs: Record<string, string> = {};
  className = "";
  style: Record<string, string> = {};
  dataset: Record<string, string> = {};
  constructor(tagName: string) { this.tagName = tagName; }
  setAttribute(k: string, v: string) { this.attrs[k] = v; }
  append(...nodes: (FakeElement | string)[]) { this.children.push(...nodes); }
  get text(): string { return this.children.map((c) => (typeof c === "string" ? c : c.text)).join(""); }
  find(predicate: (e: FakeElement) => boolean): FakeElement[] {
    const out: FakeElement[] = [];
    for (const c of this.children) if (typeof c !== "string") { if (predicate(c)) out.push(c); out.push(...c.find(predicate)); }
    return out;
  }
}
export function installFakeDocument() {
  (globalThis as any).document = { createElement: (tag: string) => new FakeElement(tag) };
}
