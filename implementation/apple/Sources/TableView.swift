#if canImport(UIKit)
import SwiftUI

// A table at the size it is given: the felt oval, an optional centre, and one view per seat placed
// and turned by the layout. What a seat or the centre shows is the caller's.
struct OvalTable<Seat: View, Centre: View>: View {
    let layout: TableLayout
    let theme: ThemeSet
    @ViewBuilder let seat: (Int) -> Seat
    @ViewBuilder let centre: () -> Centre

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width, h = geo.size.height
            ZStack {
                Ellipse()
                    .fill(RadialGradient(colors: [Color(theme.colour.table), Color(theme.colour.table), .black.opacity(0.35)], center: .center, startRadius: 0, endRadius: max(w, h) * 0.5))
                    .overlay(Ellipse().stroke(Color(theme.colour.tableEdge), lineWidth: 7))
                    .shadow(color: .black.opacity(0.6), radius: 10, y: 6)
                    .frame(width: w * layout.oval.rx * 2, height: h * layout.oval.ry * 2)
                    .position(x: w * layout.oval.cx, y: h * layout.oval.cy)
                centre().position(x: w * 0.5, y: h * 0.5)
                ForEach(layout.seatSpots, id: \.index) { spot in
                    seat(spot.index)
                        .rotationEffect(.radians(spot.angle))
                        .position(x: w * spot.x, y: h * spot.y)
                }
            }
        }
        .aspectRatio(layout.orientation == .portrait ? 1 / TableGeometry.portraitAspect : layout.width / layout.height, contentMode: .fit)
    }
}

extension OvalTable where Centre == EmptyView {
    init(layout: TableLayout, theme: ThemeSet, @ViewBuilder seat: @escaping (Int) -> Seat) {
        self.init(layout: layout, theme: theme, seat: seat, centre: { EmptyView() })
    }
}

// A television screen's table: the layout for the area the view is given, an upright table whose
// seats do not turn. Pass the screen's size to `layout` so seats keep their place as it changes.
struct TelevisionTable<Seat: View, Centre: View>: View {
    let seats: Int
    let theme: ThemeSet
    @ViewBuilder let seat: (Int) -> Seat
    @ViewBuilder let centre: () -> Centre

    var body: some View {
        GeometryReader { geo in
            let layout = TableGeometry.tableLayout(seats: seats, orientation: .tv, width: max(1, geo.size.width), height: max(1, geo.size.height))
            OvalTable(layout: layout, theme: theme, seat: seat, centre: centre)
        }
    }
}
#endif
