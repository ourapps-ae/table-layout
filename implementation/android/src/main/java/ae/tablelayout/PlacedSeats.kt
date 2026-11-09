package ae.tablelayout

// Where each seat's hidden cards, open cards and stake sit on the portrait table, as fractions of the table box,
// by seat count (2 to 9) and seat index (0 is the viewer's at the bottom, then clockwise). Same data as web/placed-seats.ts.
object PlacedSeats {
    val HIDDEN: Map<Int, List<Pair<Double, Double>>> = mapOf(
        2 to listOf(0.609 to 0.88, 0.609 to 0.06),
        3 to listOf(0.609 to 0.88, 0.237 to 0.28, 0.763 to 0.28),
        4 to listOf(0.609 to 0.88, 0.179 to 0.5, 0.609 to 0.06, 0.821 to 0.5),
        5 to listOf(0.609 to 0.88, 0.2 to 0.636, 0.357 to 0.144, 0.643 to 0.144, 0.8 to 0.636),
        6 to listOf(0.609 to 0.88, 0.237 to 0.72, 0.237 to 0.28, 0.609 to 0.06, 0.763 to 0.28, 0.763 to 0.72),
        7 to listOf(0.609 to 0.88, 0.273 to 0.773, 0.19 to 0.402, 0.204 to 0.104, 0.796 to 0.104, 0.81 to 0.402, 0.727 to 0.773),
        8 to listOf(0.609 to 0.88, 0.305 to 0.808, 0.179 to 0.5, 0.305 to 0.189, 0.609 to 0.06, 0.695 to 0.189, 0.821 to 0.5, 0.695 to 0.808),
        9 to listOf(0.609 to 0.88, 0.333 to 0.832, 0.186 to 0.576, 0.237 to 0.28, 0.244 to 0.087, 0.756 to 0.087, 0.763 to 0.28, 0.814 to 0.576, 0.667 to 0.832),
    )
    val SHOWN: Map<Int, List<Pair<Double, Double>>> = mapOf(
        2 to listOf(0.609 to 0.88, 0.609 to 0.06),
        3 to listOf(0.609 to 0.88, 0.237 to 0.28, 0.763 to 0.28),
        4 to listOf(0.609 to 0.88, 0.179 to 0.64, 0.609 to 0.06, 0.821 to 0.36),
        5 to listOf(0.609 to 0.88, 0.2 to 0.64, 0.357 to 0.144, 0.643 to 0.144, 0.8 to 0.64),
        6 to listOf(0.609 to 0.88, 0.237 to 0.72, 0.237 to 0.28, 0.609 to 0.06, 0.763 to 0.28, 0.763 to 0.72),
        7 to listOf(0.609 to 0.88, 0.273 to 0.773, 0.19 to 0.36, 0.204 to 0.104, 0.796 to 0.104, 0.81 to 0.36, 0.727 to 0.773),
        8 to listOf(0.609 to 0.88, 0.305 to 0.808, 0.179 to 0.64, 0.305 to 0.189, 0.609 to 0.06, 0.695 to 0.189, 0.821 to 0.36, 0.695 to 0.808),
        9 to listOf(0.609 to 0.88, 0.333 to 0.832, 0.186 to 0.64, 0.237 to 0.28, 0.244 to 0.087, 0.756 to 0.087, 0.763 to 0.28, 0.814 to 0.64, 0.667 to 0.832),
    )
    val BETS: Map<Int, List<Pair<Double, Double>>> = mapOf(
        2 to listOf(0.5 to 0.72, 0.5 to 0.38),
        3 to listOf(0.5 to 0.72, 0.14 to 0.47, 0.86 to 0.47),
        4 to listOf(0.5 to 0.72, 0.3 to 0.62, 0.5 to 0.38, 0.7 to 0.62),
        5 to listOf(0.5 to 0.72, 0.36 to 0.6, 0.36 to 0.38, 0.64 to 0.38, 0.64 to 0.6),
        6 to listOf(0.5 to 0.72, 0.33 to 0.6, 0.32 to 0.38, 0.5 to 0.38, 0.68 to 0.38, 0.67 to 0.6),
        7 to listOf(0.5 to 0.72, 0.37 to 0.62, 0.26 to 0.62, 0.4 to 0.36, 0.6 to 0.36, 0.74 to 0.62, 0.63 to 0.62),
        8 to listOf(0.5 to 0.72, 0.36 to 0.62, 0.22 to 0.64, 0.3 to 0.39, 0.5 to 0.38, 0.7 to 0.39, 0.78 to 0.64, 0.64 to 0.62),
        9 to listOf(0.5 to 0.72, 0.36 to 0.6, 0.25 to 0.64, 0.3 to 0.38, 0.44 to 0.38, 0.56 to 0.38, 0.7 to 0.38, 0.75 to 0.64, 0.64 to 0.6),
    )
}
