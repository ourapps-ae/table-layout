# Table layout component

## Purpose and facilities
`table-layout` puts people around a table. Given a seat count (2 to 9) and an area it returns where each seat, its hidden cards, its open cards and its stake go, where the deck, burn pile, five board cards and pot go, and how big the cards are, for three screen classes: a phone-shaped portrait table box (positions placed so nothing overlaps at any count), a wide landscape table whose seats sit at equal distances round an oval and are turned to face out, and a television layout with fixed upright seats. Seat 0 is always the viewer's, at the bottom, and the others follow clockwise. The geometry is pure and has no game words; seats and the middle show whatever the application passes in.

Facilities: `table-layout` (Seat, card, stake and middle-row positions for 2 to 9 seats on portrait, landscape and television screens).

## User inputs
No installer settings. The application passes the seat count, the screen size, whether it is a television, and optionally a turn (a fraction of a lap) to spin a landscape table.

## Artefacts and dependencies
`component.json` maps every `implementation/` source into `components/table-layout/`:

- `implementation/android/src/main/java/ae/tablelayout/OvalTable.kt` -> `components/table-layout/android/src/main/java/ae/tablelayout/OvalTable.kt`
- `implementation/android/src/main/java/ae/tablelayout/PlacedSeats.kt` -> `components/table-layout/android/src/main/java/ae/tablelayout/PlacedSeats.kt`
- `implementation/android/src/main/java/ae/tablelayout/TableLayout.kt` -> `components/table-layout/android/src/main/java/ae/tablelayout/TableLayout.kt`
- `implementation/apple/Sources/PlacedSeats.swift` -> `components/table-layout/apple/Sources/PlacedSeats.swift`
- `implementation/apple/Sources/TableLayout.swift` -> `components/table-layout/apple/Sources/TableLayout.swift`
- `implementation/apple/Sources/TableView.swift` -> `components/table-layout/apple/Sources/TableView.swift`
- `implementation/web/layout.ts` -> `components/table-layout/web/layout.ts`
- `implementation/web/placed-seats.ts` -> `components/table-layout/web/placed-seats.ts`
- `implementation/web/table-layout.css` -> `components/table-layout/web/table-layout.css`
- `implementation/web/table-view.ts` -> `components/table-layout/web/table-view.ts`

Dependencies: none.
`tools.lock.json` pins verification tools: node 26.5, python3 3.12, swiftc 6.4, kotlinc 2.2, java 26.0. Licence wording remains deferred.

## Provided interfaces
- `interfaces/table-layout.json` defines `table-layout` (ae/table-layout) version 1.0.0 as an OpenRPC 1.3.2 document: one method per web function (`Ring` and its methods as `Ring.angle` and so on), each description naming the Swift and Kotlin form or saying it is web only, with `TableLayout`, `SeatSpot`, `Point`, `PlacedSeats` and the seat limits as JSON Schema 2020-12 under `components.schemas`. Seat callbacks and DOM nodes are described as host values, not serialised.

## Required interfaces
- `theme` (ae/theme) version 1.0.0, supplied by the recipe or application. Its interface document is a copy of the theme component's OpenRPC document; table-layout reads the theme's `--table` and `--table-edge` CSS variables (web) and `ThemeSet` colours (Swift, Kotlin).
- `controls` (ae/controls) version 1.0.0, supplied by the recipe or application. Its interface document is a copy of the controls component's OpenRPC document; `tvScreen` takes the node its `banner` builds and table-layout calls no controls function itself.

## Integration
Web: call `tableLayout` (or `tableFor`, which also chooses the class from the screen size) and `tableView` from `web/table-view.ts`, passing a function that returns the node for each seat and a centre node; link `web/table-layout.css` after the theme's CSS (it reads `--table` and `--table-edge`). `tvScreen` wraps a table with a title, the controls component's `banner` and an exit control. Use `relativeSeat` to turn a server seat number into a position relative to the viewer. Apple: compile `PlacedSeats.swift` and `TableLayout.swift` anywhere, and `TableView.swift` (`OvalTable`, `TelevisionTable`) in UIKit targets with the theme's Swift files. Android: add `PlacedSeats.kt`, `TableLayout.kt` and `OvalTable.kt` to a Compose module with the theme's Kotlin files. Betting controls, cards, chips and poker text are not here: seats and the centre are the caller's, usually built from `card-graphics`, `chip-graphics` and `controls`.

## Visual definition and connected examples
`visual/definition.json` maps its ports to the provided and required interfaces. `visual/examples/connected.json` connects the component to an illustrative application consumer. Both image formats and a text description are retained under `visual/output/`.

## Infrastructure
None. Pure geometry and local drawing; no accounts, network or deployment.

## Verification
Node tests check, for every seat count from 2 to 9 on portrait, landscape and television areas, that there is one seat per player, all seat, card and stake points lie inside the area, seat 0 is at the bottom and the others go clockwise, left and right are mirror images, no two seats share a spot, landscape and television plates never overlap (turned bounding boxes), portrait positions equal the recipe's placed data, landscape seats are evenly spaced along the oval's arc length, the middle row runs in order, and screen class, clamping, relative seats, box sizing and clockwise light targets, and that the OpenRPC interface's layout shape and seat limits match the code and every method it lists is an exported web function. The page builders are tested against a stand-in page. The Apple check compiles and runs `tests/apple/main.swift` for macOS, comparing all 25 fixture layouts (137 seat spots) with the TypeScript output to 1e-9, then type-checks all Swift with the theme's against the iOS simulator SDK. The Android check compiles the pure Kotlin and compares the same layouts in `tests/android/Expected.kt`; kotlinc was not available where this was written, so it has not been run, and `OvalTable.kt` (Compose) is only compiled by the application's Gradle build. Nothing is checked pixel by pixel.

- `node --test tests/web.test.ts` (web, required-local; tools: node 26.5)
- `python3 tests/native.py apple` (apple, platform; tools: python3 3.12, swiftc 6.4)
- `python3 tests/native.py android` (android, platform; tools: python3 3.12, kotlinc 2.2, java 26.0)

## Scenarios and presentation
A six-seat game on a phone shows the portrait table with six seats around the oval; rotate the phone and the landscape table appears with seats turned to face outward; a television shows the same game upright with fixed spots and a banner; a two-seat game and a nine-seat game use the same code path. A viewer can spin a landscape table by passing `turn`.

## Updates and removal
Patch updates replace files only. The component keeps no data; removal deletes its files and the application's imports of them.
