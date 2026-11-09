package ae.tablelayout

import ae.theme.ThemeSet
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Placeable
import kotlin.math.roundToInt

// A table at the size it is given: the felt oval, an optional centre, and one composable per seat
// placed and turned by the layout. What a seat or the centre shows is the caller's.
@Composable
fun OvalTable(
    layout: TableLayout,
    theme: ThemeSet,
    modifier: Modifier = Modifier,
    centre: @Composable () -> Unit = {},
    seat: @Composable (index: Int) -> Unit,
) {
    val ratio = if (layout.orientation == TableOrientation.PORTRAIT) (1.0 / TableGeometry.PORTRAIT_ASPECT).toFloat() else (layout.width / layout.height).toFloat()
    Layout(
        content = {
            Canvas(Modifier.fillMaxSize()) {
                val density = this.density
                val w = size.width
                val h = size.height
                val rx = (w * layout.ovalRx).toFloat()
                val ry = (h * layout.ovalRy).toFloat()
                val c = Offset((w * layout.ovalCx).toFloat(), (h * layout.ovalCy).toFloat())
                val table = Color(theme.colour.table)
                drawOval(Brush.radialGradient(listOf(table, table, Color.Black.copy(alpha = 0.35f)), center = c, radius = maxOf(w, h) * 0.5f), topLeft = Offset(c.x - rx, c.y - ry), size = Size(2 * rx, 2 * ry))
                drawOval(Color(theme.colour.tableEdge), topLeft = Offset(c.x - rx, c.y - ry), size = Size(2 * rx, 2 * ry), style = Stroke(7f * density))
            }
            Box { centre() }
            for (spot in layout.seatSpots) Box(Modifier.rotate(Math.toDegrees(spot.angle).toFloat())) { seat(spot.index) }
        },
        modifier = modifier.aspectRatio(ratio),
    ) { measurables, constraints ->
        val w = constraints.maxWidth
        val h = constraints.maxHeight
        val loose = constraints.copy(minWidth = 0, minHeight = 0)
        val felt = measurables[0].measure(constraints)
        val placeables: List<Placeable> = measurables.drop(1).map { it.measure(loose) }
        layout(w, h) {
            felt.place(0, 0)
            val spots = listOf(TablePoint(0.5, 0.5)) + layout.seatSpots.map { TablePoint(it.x, it.y) }
            placeables.forEachIndexed { i, p ->
                val s = spots[i]
                p.place((w * s.x - p.width / 2.0).roundToInt(), (h * s.y - p.height / 2.0).roundToInt())
            }
        }
    }
}

