import ae.tablelayout.*
import kotlin.math.PI
import kotlin.math.abs

// Mirrors tests/apple/main.swift: layouts are compared with rows the TypeScript produced (Expected.kt).
fun check(condition: Boolean, message: String) { if (!condition) { System.err.println("FAIL: $message"); System.exit(1) } }
fun near(a: Double, b: Double, what: String) = check(abs(a - b) < 1e-9, "$what: $a vs $b")

fun main() {
    for (row in EXPECTED) {
        val o = TableOrientation.valueOf((row[0] as String).uppercase())
        val n = row[1] as Int
        val l = TableGeometry.tableLayout(n, o, (row[2] as Number).toDouble(), (row[3] as Number).toDouble(), (row[4] as Number).toDouble())
        val what = "$o $n"
        check(l.seatSpots.size == n, "$what count")
        near(l.seatSpots[1].x, row[5] as Double, "$what seat1 x"); near(l.seatSpots[1].y, row[6] as Double, "$what seat1 y")
        near(l.seatSpots[1].angle, row[7] as Double, "$what seat1 angle")
        near(l.seatSpots.last().x, row[8] as Double, "$what last x"); near(l.seatSpots.last().y, row[9] as Double, "$what last y")
        near(l.pot.x, row[10] as Double, "$what pot x"); near(l.pot.y, row[11] as Double, "$what pot y")
        near(l.board[4].x, row[12] as Double, "$what board x"); near(l.deck.x, row[13] as Double, "$what deck x")
    }
    check(TableGeometry.screenClass(390.0, 844.0) == TableOrientation.PORTRAIT && TableGeometry.screenClass(1280.0, 720.0) == TableOrientation.LANDSCAPE, "screen class")
    check(TableGeometry.clampSeats(1) == 2 && TableGeometry.clampSeats(12) == 9, "clamp")
    check(TableGeometry.relativeSeat(0, 3, 5) == 2, "relative seat")
    near(TableGeometry.clockwiseTarget(1.0, 0.5), 0.5 + 2 * PI, "clockwise the long way")
    val ring = Ring(400.0, 250.0)
    near(ring.angle(0.0), PI / 2, "ring start")
    near(ring.fractionToward(ring.point(ring.angle(0.37)), TablePoint(0.0, 0.0)), 0.37, "ring round trip")
    println("android table-layout checks passed (${EXPECTED.size} layouts)")
}
