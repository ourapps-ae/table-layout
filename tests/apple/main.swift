import Foundation

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data("FAIL: \(message)\n".utf8))
    exit(1)
}
func check(_ condition: Bool, _ message: @autoclosure () -> String) { if !condition { fail(message()) } }
func near(_ a: Double, _ b: Double, _ what: String) { check(abs(a - b) < 1e-9, "\(what): \(a) vs \(b)") }
func near(_ a: TablePoint, _ b: [String: Double], _ what: String) { near(a.x, b["x"]!, what + ".x"); near(a.y, b["y"]!, what + ".y") }

guard let data = FileManager.default.contents(atPath: "tests/fixtures/layouts.json"), let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { fail("cannot read layouts.json") }

// Every layout equals the one the TypeScript produced: seat spots, cards, stakes, the middle row, sizes.
var layoutsChecked = 0, spotsChecked = 0
for item in json["layouts"] as! [[String: Any]] {
    let orientation = TableOrientation(rawValue: item["orientation"] as! String)!
    let n = item["seats"] as! Int
    let l = TableGeometry.tableLayout(seats: n, orientation: orientation, width: item["width"] as! Double, height: item["height"] as! Double, turn: item["turn"] as? Double ?? 0)
    let e = item["layout"] as! [String: Any]
    let what = "\(orientation) \(n)"
    check(l.seatSpots.count == n && l.orientation == orientation, "\(what): count")
    for (i, s) in (e["seatSpots"] as! [[String: Any]]).enumerated() {
        near(l.seatSpots[i].x, s["x"] as! Double, "\(what) seat \(i) x")
        near(l.seatSpots[i].y, s["y"] as! Double, "\(what) seat \(i) y")
        near(l.seatSpots[i].angle, s["angle"] as! Double, "\(what) seat \(i) angle")
        near(l.seatSpots[i].cards, s["cards"] as! [String: Double], "\(what) seat \(i) cards")
        near(l.seatSpots[i].shown, s["shown"] as! [String: Double], "\(what) seat \(i) shown")
        near(l.seatSpots[i].bet, s["bet"] as! [String: Double], "\(what) seat \(i) bet")
        spotsChecked += 1
    }
    near(l.pot, e["pot"] as! [String: Double], "\(what) pot")
    near(l.deck, e["deck"] as! [String: Double], "\(what) deck")
    near(l.burn, e["burn"] as! [String: Double], "\(what) burn")
    for (i, b) in (e["board"] as! [[String: Double]]).enumerated() { near(l.board[i], b, "\(what) board \(i)") }
    let oval = e["oval"] as! [String: Double]
    near(l.oval.rx, oval["rx"]!, "\(what) oval rx"); near(l.oval.ry, oval["ry"]!, "\(what) oval ry")
    near(l.middleAngle, e["middleAngle"] as! Double, "\(what) middle angle")
    let cards = e["cardWidth"] as! [String: Double]
    near(l.cardWidth.hidden, cards["hidden"]!, "\(what) hidden width"); near(l.cardWidth.shown, cards["shown"]!, "\(what) shown width")
    layoutsChecked += 1
}

// The ring.
let ringFixture = json["ring"] as! [String: Any]
let ring = Ring(rx: ringFixture["rx"] as! Double, ry: ringFixture["ry"] as! Double)
for r in ringFixture["rings"] as! [[String: Double]] {
    near(ring.angle(r["fraction"]!), r["angle"]!, "ring angle")
    near(ring.fractionToward(ring.point(ring.angle(r["fraction"]!)), from: TablePoint(x: 0, y: 0)), r["toward"]!, "ring fraction")
}

// Helpers.
check(TableGeometry.screenClass(width: 390, height: 844) == .portrait, "phone is portrait")
check(TableGeometry.screenClass(width: 1280, height: 720) == .landscape, "wide is landscape")
check(TableGeometry.screenClass(width: 1280, height: 720, tv: true) == .tv, "tv")
check(TableGeometry.relativeSeat(0, mySeat: 3, count: 5) == 2 && TableGeometry.relativeSeat(1, mySeat: 1, count: 5) == 0, "relative seat")
check(TableGeometry.clampSeats(1) == 2 && TableGeometry.clampSeats(12) == 9 && TableGeometry.clampSeats(6) == 6, "clamp")
check(TableGeometry.tableCardWidth(6, faceUp: false) == 29 && TableGeometry.tableCardWidth(7, faceUp: true) == 32, "card widths")
near(TableGeometry.clockwiseTarget(from: 1, to: 0.5), 0.5 + 2 * Double.pi, "clockwise the long way")
near(TableGeometry.clockwiseTarget(from: nil, to: 1), 1, "first light")
let box = TableGeometry.tableBoxSize(width: 390, height: 844, reserved: 290)
near(box.height / box.width, 1.3, "box aspect")
check(box.width <= 390 - 24 + 1e-9, "box fits the width")

print("\(layoutsChecked) layouts, \(spotsChecked) seat spots matched the TypeScript")
