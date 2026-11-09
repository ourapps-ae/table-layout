package ae.tablelayout

import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin

// Seats around an oval table on every screen: a phone-shaped table box (portrait), a wide table
// (landscape) and a television. Pure functions of the seat count and the area; nothing here draws.
// Matches web/layout.ts.
//
// Positions are fractions (0 to 1) of the area given. Seat 0 is the viewer's, at the bottom; the
// others follow clockwise on screen. `angle` is how far a seat's plate is turned (radians, clockwise
// on screen) so its foot faces out from the table; it is 0 on portrait and television layouts.
enum class TableOrientation { PORTRAIT, LANDSCAPE, TV }

data class TablePoint(val x: Double, val y: Double)

class SeatSpot(
    val index: Int, val x: Double, val y: Double, val angle: Double,
    /** where this seat's hidden cards sit */ val cards: TablePoint,
    /** where its open cards and folded cards sit */ val shown: TablePoint,
    /** where its stake sits in front of it */ val bet: TablePoint,
)

class TableLayout(
    val orientation: TableOrientation, val seats: Int, val width: Double, val height: Double, val seatSpots: List<SeatSpot>,
    /** the felt oval, centre and radii as fractions of the area; seats sit on its rim */
    val ovalCx: Double, val ovalCy: Double, val ovalRx: Double, val ovalRy: Double,
    /** a seat's plate, as fractions of the area */ val plateW: Double, val plateH: Double,
    val pot: TablePoint, val deck: TablePoint, val burn: TablePoint, val board: List<TablePoint>,
    /** card widths in points for hidden and open cards on the table */ val hiddenCardWidth: Double, val shownCardWidth: Double,
    /** how far the middle row (deck, board, pot) is turned: 0, or a quarter turn on a tall wide table */ val middleAngle: Double,
)

object TableGeometry {
    const val MIN_SEATS = 2
    const val MAX_SEATS = 9
    const val PORTRAIT_ASPECT = 1.3
    private const val TWO_PI = PI * 2

    fun clampSeats(n: Int): Int = n.coerceIn(MIN_SEATS, MAX_SEATS)

    // Phones and narrow windows get the portrait column; wider areas the landscape table; a television its own.
    fun screenClass(width: Double, height: Double, tv: Boolean = false): TableOrientation =
        if (tv) TableOrientation.TV else if (width < 600 || height >= width) TableOrientation.PORTRAIT else TableOrientation.LANDSCAPE

    // Seat k counted clockwise from the viewer's own seat.
    fun relativeSeat(seat: Int, mySeat: Int, count: Int): Int {
        val n = max(MIN_SEATS, count)
        return ((seat - mySeat) % n + n) % n
    }

    // How far round the table a seat is, clockwise from straight below (radians).
    fun seatAngle(k: Int, n: Int): Double = PI / 2 + TWO_PI * k / n

    // A point on the portrait table's ring of seats at any angle, for a light gliding between seats
    // (the viewer's own seat, straight below, sits a little higher).
    fun ringPoint(a: Double): TablePoint {
        val lift = max(0.0, sin(a)).pow(8) * 0.06
        return TablePoint(0.5 + 0.43 * cos(a), 0.5 + (0.44 - lift) * sin(a))
    }

    // The angle to move a light to so every move goes clockwise, however far.
    fun clockwiseTarget(from: Double?, to: Double): Double = if (from == null) to else from + (((to - from) % TWO_PI) + TWO_PI) % TWO_PI

    // Seven and more get smaller cards on the table; open cards are larger than hidden ones.
    fun tableCardWidth(n: Int, faceUp: Boolean): Double = if (n >= 7) (if (faceUp) 32.0 else 24.0) else if (faceUp) 36.0 else 29.0

    // The portrait table box for a screen, in the same units as the screen: (width, height).
    fun tableBoxSize(width: Double, height: Double, padding: Double = 12.0, reserved: Double = 0.0): Pair<Double, Double> {
        val byWidth = width - 2 * padding
        val byHeight = (height - 2 * padding - reserved) / PORTRAIT_ASPECT
        val w = max(0.0, if (width > height) byHeight else min(byWidth, byHeight))
        return w to w * PORTRAIT_ASPECT
    }

    // The television's fixed seat spots, as fractions of the screen, by seat count.
    val TV_SEATS: Map<Int, List<Pair<Double, Double>>> = mapOf(
        2 to listOf(0.5 to 0.86, 0.5 to 0.14),
        3 to listOf(0.5 to 0.86, 0.25 to 0.14, 0.75 to 0.14),
        4 to listOf(0.5 to 0.86, 0.14 to 0.5, 0.5 to 0.14, 0.86 to 0.5),
        5 to listOf(0.5 to 0.86, 0.14 to 0.5, 0.32 to 0.14, 0.68 to 0.14, 0.86 to 0.5),
        6 to listOf(0.3 to 0.86, 0.14 to 0.5, 0.3 to 0.14, 0.7 to 0.14, 0.86 to 0.5, 0.7 to 0.86),
        7 to listOf(0.5 to 0.86, 0.22 to 0.74, 0.14 to 0.4, 0.32 to 0.14, 0.68 to 0.14, 0.86 to 0.4, 0.78 to 0.74),
        8 to listOf(0.3 to 0.86, 0.14 to 0.62, 0.14 to 0.36, 0.3 to 0.14, 0.7 to 0.14, 0.86 to 0.36, 0.86 to 0.62, 0.7 to 0.86),
        9 to listOf(0.5 to 0.86, 0.22 to 0.86, 0.14 to 0.6, 0.14 to 0.34, 0.34 to 0.14, 0.66 to 0.14, 0.86 to 0.34, 0.86 to 0.6, 0.78 to 0.86),
    )

    // A local point (relative to the centre) turned by an angle (clockwise on screen) about the centre.
    private fun turned(p: TablePoint, a: Double, c: TablePoint) = TablePoint(c.x + p.x * cos(a) - p.y * sin(a), c.y + p.x * sin(a) + p.y * cos(a))

    private fun portrait(n: Int): TableLayout {
        fun placed(table: Map<Int, List<Pair<Double, Double>>>, k: Int): TablePoint {
            val p = table[n]?.getOrNull(k) ?: (0.5 to 0.7)
            return TablePoint(p.first, p.second)
        }
        val spots = List(n) { k ->
            val p = ringPoint(seatAngle(k, n))
            SeatSpot(k, p.x, p.y, 0.0, placed(PlacedSeats.HIDDEN, k), placed(PlacedSeats.SHOWN, k), placed(PlacedSeats.BETS, k))
        }
        return TableLayout(
            TableOrientation.PORTRAIT, n, 1.0, PORTRAIT_ASPECT, spots, 0.5, 0.5, 0.45, 0.41, 0.24, 0.2,
            TablePoint(0.5, 0.63), TablePoint(0.45, 0.28), TablePoint(0.55, 0.28), List(5) { TablePoint(0.5 + (it - 2) * 0.11, 0.5) },
            tableCardWidth(n, false), tableCardWidth(n, true), 0.0,
        )
    }

    // Wide and television layouts, in points of the area, sizes in units of a 560 point short side.
    private fun wide(n: Int, width: Double, height: Double, tv: Boolean, turn: Double): TableLayout {
        val u = if (tv) min(min(width, height) / 560, width / 760) else min(width, height) / 560
        val plateW = (if (n >= 8) 172.0 else 200.0) * u
        val plateH = 60 * u
        val gap = 6 * u
        val front = 50 * u
        val rx = max(1.0, width / 2 - 14 * u - (if (tv) plateW else plateH) / 2)
        val ry = max(1.0, height / 2 - (if (tv) 72 else 14) * u - plateH / 2)
        val ring = Ring(rx, ry)
        val centre = TablePoint(width / 2, height / 2)
        val cardWidth = 26 * u
        val cardsAt = TablePoint(-plateW / 2 + 10 * u + cardWidth + 1.5 * u, -3 * u)
        val frontAt = TablePoint(0.0, -(plateH / 2 + gap + front / 2))
        fun f(p: TablePoint) = TablePoint(p.x / width, p.y / height)
        val spots = List(n) { i ->
            val at: TablePoint
            val angle: Double
            if (tv) {
                val s = TV_SEATS.getValue(n)[i]
                at = TablePoint(s.first * width, s.second * height)
                angle = 0.0
            } else {
                val t = ring.angle(turn + i.toDouble() / n)
                val p = ring.point(t)
                at = TablePoint(centre.x + p.x, centre.y + p.y)
                angle = ring.outward(t) - PI / 2
            }
            val cards = f(turned(cardsAt, angle, at))
            SeatSpot(i, f(at).x, f(at).y, angle, cards, cards, f(turned(frontAt, angle, at)))
        }
        val middleAngle = if (!tv && height > width) PI / 2 else 0.0
        val reach = plateH / 2 + gap + front + 16 * u
        val middleWidth = if (tv) max(120 * u, width * 0.72 - plateW - 2 * gap) else 2 * (max(rx, ry) - reach)
        val mu = if (tv) u * min(1.0, middleWidth / (420 * u)) else u
        val rowY = if (tv) 25 * mu else 0.0
        val boardCard = 44 * mu
        fun boardX(i: Int) = (i - 2) * (boardCard + 6 * mu)
        val deckX = boardX(0) - boardCard / 2 - 27 * mu
        val burnX = deckX - 38 * mu
        val potX = boardX(4) + boardCard / 2 + 50 * mu
        fun mid(x: Double) = f(turned(TablePoint(x, rowY), middleAngle, centre))
        return TableLayout(
            if (tv) TableOrientation.TV else TableOrientation.LANDSCAPE, n, width, height, spots,
            0.5, 0.5, rx / width, ry / height, plateW / width, plateH / height,
            mid(potX), mid(deckX), mid(burnX), List(5) { mid(boardX(it)) }, 26 * u, 26 * u, middleAngle,
        )
    }

    // The layout for `seats` seats (2 to 9; others are clamped) in an area of width x height. Portrait
    // ignores the size (positions are fractions of the table box, whose height is 1.3 times its width).
    // `turn` rotates the landscape ring by that fraction of a lap, so the viewer can spin the table.
    fun tableLayout(seats: Int, orientation: TableOrientation, width: Double = 1920.0, height: Double = 1080.0, turn: Double = 0.0): TableLayout {
        val n = clampSeats(seats)
        if (orientation == TableOrientation.PORTRAIT) return portrait(n)
        require(width > 0 && height > 0) { "width and height must be above 0" }
        return wide(n, width, height, orientation == TableOrientation.TV, if (orientation == TableOrientation.TV) 0.0 else turn)
    }
}

// Points round an ellipse at equal distances along it, from the bottom, clockwise on screen.
class Ring(val rx: Double, val ry: Double) {
    private val lengths: DoubleArray

    init {
        val out = DoubleArray(STEPS + 1)
        var lastX = 0.0
        var lastY = ry
        for (k in 1..STEPS) {
            val t = PI / 2 + 2 * PI * k / STEPS
            val px = rx * cos(t)
            val py = ry * sin(t)
            out[k] = out[k - 1] + hypot(px - lastX, py - lastY)
            lastX = px
            lastY = py
        }
        lengths = out
    }

    // The ellipse's angle at a fraction of the way round.
    fun angle(fraction: Double): Double {
        val f = fraction - floor(fraction)
        val target = f * lengths[STEPS]
        var lo = 0
        var hi = STEPS
        while (hi - lo > 1) {
            val mid = (lo + hi) / 2
            if (lengths[mid] <= target) lo = mid else hi = mid
        }
        val span = max(0.0001, lengths[hi] - lengths[lo])
        val k = lo + (target - lengths[lo]) / span
        return PI / 2 + 2 * PI * k / STEPS
    }

    fun point(t: Double) = TablePoint(rx * cos(t), ry * sin(t))

    // The fraction of the way round at the edge point in the direction of `p` from the centre `c`.
    fun fractionToward(p: TablePoint, c: TablePoint): Double {
        val phi = atan2(p.y - c.y, p.x - c.x)
        val t = atan2(rx * sin(phi), ry * cos(phi))
        var k = (t - PI / 2) / (2 * PI)
        k -= floor(k)
        val x = k * STEPS
        val i = min(STEPS - 1, floor(x).toInt())
        val l = lengths[i] + (lengths[i + 1] - lengths[i]) * (x - i)
        return l / lengths[STEPS]
    }

    // Straight out from the ellipse at that angle.
    fun outward(t: Double): Double = atan2(sin(t) / ry, cos(t) / rx)

    companion object {
        const val STEPS = 240
    }
}
