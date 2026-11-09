import Foundation

// Seats around an oval table on every screen: a phone-shaped table box (portrait), a wide table
// (landscape) and a television. Pure functions of the seat count and the area; nothing here draws.
// Matches web/layout.ts.
//
// Positions are fractions (0 to 1) of the area given. Seat 0 is the viewer's, at the bottom; the
// others follow clockwise on screen. `angle` is how far a seat's plate is turned (radians, clockwise
// on screen) so its foot faces out from the table; it is 0 on portrait and television layouts.
enum TableOrientation: String { case portrait, landscape, tv }

struct TablePoint: Equatable {
    var x: Double
    var y: Double
}

struct SeatSpot {
    let index: Int
    let x: Double
    let y: Double
    let angle: Double
    /// where this seat's hidden cards sit
    let cards: TablePoint
    /// where its open cards and folded cards sit
    let shown: TablePoint
    /// where its stake sits in front of it
    let bet: TablePoint
}

struct TableLayout {
    let orientation: TableOrientation
    let seats: Int
    let width: Double
    let height: Double
    let seatSpots: [SeatSpot]
    /// the felt oval, centre and radii as fractions of the area; seats sit on its rim
    let oval: (cx: Double, cy: Double, rx: Double, ry: Double)
    /// a seat's plate, as fractions of the area
    let plate: (w: Double, h: Double)
    let pot: TablePoint
    let deck: TablePoint
    let burn: TablePoint
    let board: [TablePoint]
    /// card widths in points for hidden and open cards on the table
    let cardWidth: (hidden: Double, shown: Double)
    /// how far the middle row (deck, board, pot) is turned: 0, or a quarter turn on a tall wide table
    let middleAngle: Double
}

enum TableGeometry {
    static let minSeats = 2
    static let maxSeats = 9
    static let portraitAspect = 1.3
    private static let twoPi = Double.pi * 2

    static func clampSeats(_ n: Int) -> Int { min(maxSeats, max(minSeats, n)) }

    // Phones and narrow windows get the portrait column; wider areas the landscape table; a television its own.
    static func screenClass(width: Double, height: Double, tv: Bool = false) -> TableOrientation {
        if tv { return .tv }
        return width < 600 || height >= width ? .portrait : .landscape
    }

    // Seat k counted clockwise from the viewer's own seat.
    static func relativeSeat(_ seat: Int, mySeat: Int, count: Int) -> Int {
        let n = max(minSeats, count)
        return ((seat - mySeat) % n + n) % n
    }

    // How far round the table a seat is, clockwise from straight below (radians).
    static func seatAngle(_ k: Int, _ n: Int) -> Double { .pi / 2 + twoPi * Double(k) / Double(n) }

    // A point on the portrait table's ring of seats at any angle, for a light gliding between seats
    // (the viewer's own seat, straight below, sits a little higher).
    static func ringPoint(_ a: Double) -> TablePoint {
        let lift = pow(max(0, sin(a)), 8) * 0.06
        return TablePoint(x: 0.5 + 0.43 * cos(a), y: 0.5 + (0.44 - lift) * sin(a))
    }

    // The angle to move a light to so every move goes clockwise, however far.
    static func clockwiseTarget(from: Double?, to: Double) -> Double {
        guard let from else { return to }
        return from + ((to - from).truncatingRemainder(dividingBy: twoPi) + twoPi).truncatingRemainder(dividingBy: twoPi)
    }

    // Seven and more get smaller cards on the table; open cards are larger than hidden ones.
    static func tableCardWidth(_ n: Int, faceUp: Bool) -> Double {
        n >= 7 ? (faceUp ? 32 : 24) : (faceUp ? 36 : 29)
    }

    // The portrait table box for a screen, in the same units as the screen.
    static func tableBoxSize(width: Double, height: Double, padding: Double = 12, reserved: Double = 0) -> (width: Double, height: Double) {
        let byWidth = width - 2 * padding
        let byHeight = (height - 2 * padding - reserved) / portraitAspect
        let w = max(0, width > height ? byHeight : min(byWidth, byHeight))
        return (w, w * portraitAspect)
    }

    // The television's fixed seat spots, as fractions of the screen, by seat count.
    static let tvSeats: [Int: [(Double, Double)]] = [
        2: [(0.5, 0.86), (0.5, 0.14)],
        3: [(0.5, 0.86), (0.25, 0.14), (0.75, 0.14)],
        4: [(0.5, 0.86), (0.14, 0.5), (0.5, 0.14), (0.86, 0.5)],
        5: [(0.5, 0.86), (0.14, 0.5), (0.32, 0.14), (0.68, 0.14), (0.86, 0.5)],
        6: [(0.3, 0.86), (0.14, 0.5), (0.3, 0.14), (0.7, 0.14), (0.86, 0.5), (0.7, 0.86)],
        7: [(0.5, 0.86), (0.22, 0.74), (0.14, 0.4), (0.32, 0.14), (0.68, 0.14), (0.86, 0.4), (0.78, 0.74)],
        8: [(0.3, 0.86), (0.14, 0.62), (0.14, 0.36), (0.3, 0.14), (0.7, 0.14), (0.86, 0.36), (0.86, 0.62), (0.7, 0.86)],
        9: [(0.5, 0.86), (0.22, 0.86), (0.14, 0.6), (0.14, 0.34), (0.34, 0.14), (0.66, 0.14), (0.86, 0.34), (0.86, 0.6), (0.78, 0.86)],
    ]

    // A local point (relative to the centre) turned by an angle (clockwise on screen) about the centre.
    fileprivate static func turned(_ p: TablePoint, _ a: Double, about c: TablePoint) -> TablePoint {
        TablePoint(x: c.x + p.x * cos(a) - p.y * sin(a), y: c.y + p.x * sin(a) + p.y * cos(a))
    }

    private static func portrait(_ n: Int) -> TableLayout {
        func placed(_ table: [Int: [(x: Double, y: Double)]], _ k: Int) -> TablePoint {
            let p = table[n].flatMap { k < $0.count ? $0[k] : nil } ?? (x: 0.5, y: 0.7)
            return TablePoint(x: p.x, y: p.y)
        }
        let spots = (0..<n).map { k -> SeatSpot in
            let p = ringPoint(seatAngle(k, n))
            return SeatSpot(index: k, x: p.x, y: p.y, angle: 0, cards: placed(PlacedSeats.hidden, k), shown: placed(PlacedSeats.shown, k), bet: placed(PlacedSeats.bets, k))
        }
        return TableLayout(
            orientation: .portrait, seats: n, width: 1, height: portraitAspect, seatSpots: spots,
            oval: (0.5, 0.5, 0.45, 0.41), plate: (0.24, 0.2),
            pot: TablePoint(x: 0.5, y: 0.63), deck: TablePoint(x: 0.45, y: 0.28), burn: TablePoint(x: 0.55, y: 0.28),
            board: (0..<5).map { TablePoint(x: 0.5 + Double($0 - 2) * 0.11, y: 0.5) },
            cardWidth: (tableCardWidth(n, faceUp: false), tableCardWidth(n, faceUp: true)), middleAngle: 0)
    }

    // Wide and television layouts, in points of the area, sizes in units of a 560 point short side.
    private static func wide(_ n: Int, _ width: Double, _ height: Double, tv: Bool, turn: Double) -> TableLayout {
        let u = tv ? min(min(width, height) / 560, width / 760) : min(width, height) / 560
        let plate = (w: (n >= 8 ? 172.0 : 200.0) * u, h: 60 * u)
        let gap = 6 * u, front = 50 * u
        let rx = max(1, width / 2 - 14 * u - (tv ? plate.w : plate.h) / 2)
        let ry = max(1, height / 2 - (tv ? 72 : 14) * u - plate.h / 2)
        let ring = Ring(rx: rx, ry: ry)
        let centre = TablePoint(x: width / 2, y: height / 2)
        let cardWidth = 26 * u
        let cardsAt = TablePoint(x: -plate.w / 2 + 10 * u + cardWidth + 1.5 * u, y: -3 * u)
        let frontAt = TablePoint(x: 0, y: -(plate.h / 2 + gap + front / 2))
        func f(_ p: TablePoint) -> TablePoint { TablePoint(x: p.x / width, y: p.y / height) }
        let spots = (0..<n).map { i -> SeatSpot in
            let at: TablePoint, angle: Double
            if tv {
                let s = tvSeats[n]![i]
                at = TablePoint(x: s.0 * width, y: s.1 * height)
                angle = 0
            } else {
                let t = ring.angle(turn + Double(i) / Double(n))
                let p = ring.point(t)
                at = TablePoint(x: centre.x + p.x, y: centre.y + p.y)
                angle = ring.outward(t) - .pi / 2
            }
            let cards = f(turned(cardsAt, angle, about: at))
            return SeatSpot(index: i, x: f(at).x, y: f(at).y, angle: angle, cards: cards, shown: cards, bet: f(turned(frontAt, angle, about: at)))
        }
        let middleAngle = !tv && height > width ? Double.pi / 2 : 0
        let reach = plate.h / 2 + gap + front + 16 * u
        let middleWidth = tv ? max(120 * u, width * 0.72 - plate.w - 2 * gap) : 2 * (max(rx, ry) - reach)
        let mu = tv ? u * min(1, middleWidth / (420 * u)) : u
        let rowY = tv ? 25 * mu : 0
        let boardCard = 44 * mu
        func boardX(_ i: Int) -> Double { Double(i - 2) * (boardCard + 6 * mu) }
        let deckX = boardX(0) - boardCard / 2 - 27 * mu
        let burnX = deckX - 38 * mu
        let potX = boardX(4) + boardCard / 2 + 50 * mu
        func mid(_ x: Double) -> TablePoint { f(turned(TablePoint(x: x, y: rowY), middleAngle, about: centre)) }
        return TableLayout(
            orientation: tv ? .tv : .landscape, seats: n, width: width, height: height, seatSpots: spots,
            oval: (0.5, 0.5, rx / width, ry / height), plate: (plate.w / width, plate.h / height),
            pot: mid(potX), deck: mid(deckX), burn: mid(burnX), board: (0..<5).map { mid(boardX($0)) },
            cardWidth: (26 * u, 26 * u), middleAngle: middleAngle)
    }

    // The layout for `seats` seats (2 to 9; others are clamped) in an area of width x height. Portrait
    // ignores the size (positions are fractions of the table box, whose height is 1.3 times its width).
    // `turn` rotates the landscape ring by that fraction of a lap, so the viewer can spin the table.
    static func tableLayout(seats: Int, orientation: TableOrientation, width: Double = 1920, height: Double = 1080, turn: Double = 0) -> TableLayout {
        let n = clampSeats(seats)
        if orientation == .portrait { return portrait(n) }
        precondition(width > 0 && height > 0, "width and height must be above 0")
        return wide(n, width, height, tv: orientation == .tv, turn: orientation == .tv ? 0 : turn)
    }
}

// Points round an ellipse at equal distances along it, from the bottom, clockwise on screen.
struct Ring {
    let rx: Double
    let ry: Double
    private let lengths: [Double]
    static let steps = 240

    init(rx: Double, ry: Double) {
        self.rx = rx
        self.ry = ry
        var out: [Double] = [0]
        var last = (x: 0.0, y: ry)
        for k in 1...Ring.steps {
            let t = Double.pi / 2 + 2 * Double.pi * Double(k) / Double(Ring.steps)
            let p = (x: rx * cos(t), y: ry * sin(t))
            out.append(out[k - 1] + hypot(p.x - last.x, p.y - last.y))
            last = p
        }
        lengths = out
    }

    // The ellipse's angle at a fraction of the way round.
    func angle(_ fraction: Double) -> Double {
        let f = fraction - floor(fraction)
        let target = f * lengths[Ring.steps]
        var lo = 0, hi = Ring.steps
        while hi - lo > 1 {
            let mid = (lo + hi) / 2
            if lengths[mid] <= target { lo = mid } else { hi = mid }
        }
        let span = max(0.0001, lengths[hi] - lengths[lo])
        let k = Double(lo) + (target - lengths[lo]) / span
        return .pi / 2 + 2 * .pi * k / Double(Ring.steps)
    }

    func point(_ t: Double) -> TablePoint { TablePoint(x: rx * cos(t), y: ry * sin(t)) }

    // The fraction of the way round at the edge point in the direction of `p` from the centre `c`.
    func fractionToward(_ p: TablePoint, from c: TablePoint) -> Double {
        let phi = atan2(p.y - c.y, p.x - c.x)
        let t = atan2(rx * sin(phi), ry * cos(phi))
        var k = (t - .pi / 2) / (2 * .pi)
        k -= floor(k)
        let x = k * Double(Ring.steps)
        let i = min(Ring.steps - 1, Int(x))
        let l = lengths[i] + (lengths[i + 1] - lengths[i]) * (x - Double(i))
        return l / lengths[Ring.steps]
    }

    // Straight out from the ellipse at that angle.
    func outward(_ t: Double) -> Double { atan2(sin(t) / ry, cos(t) / rx) }
}
