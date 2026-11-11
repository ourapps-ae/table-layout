# Source mapping

Reference revision: `19905b75dbea89fbfd424d67fe26c81aaed0e018`. Extracted from the `recipe/` folder of `ourapps-ae/OurPoker`; paths and line ranges are of the files there.

## Web

- `implementation/web/placed-seats.ts` <- `web/src/layout.ts:1-11`. Same data (percent of the table box); renamed `LAYOUT` to `PLACED`.
- `implementation/web/layout.ts` <- `web/src/table.ts:129-141` (`POT`, `angle`, `seatPos`), `143-148` (`ringPos` -> `ringPoint`, now fractions not percent), `150-170` (turn-light angle logic -> `clockwiseTarget`), `173-190` (`layoutPos`, `seatIndex` -> `relativeSeat`), `192-208` (`DECK`, `BURN`, `boardPos`, `tableCard` -> `tableCardWidth`), `623-624` (table box size from the screen -> `tableBoxSize`); and the wide and television layout from `ios/OurPoker/Sources/DisplayScreen.swift:125-290` (`Ring`, `ViewerGeometry`, `uprightSeats`, middle row), which the recipe has only on Apple; the web part is `generated-platform` (the recipe's web board screen, `web/src/board.ts`, is a list of seat cards, not an oval). `screenClass` is the width rule at `ios/OurPoker/Sources/TableScreen.swift:26-71` (under 600 wide or taller than wide: portrait column; otherwise wide). Generalised: everything returned as fractions of the area, and a single `tableLayout` call returns seats, cards, stakes, deck, burn, board, pot, card widths, felt oval and plate size. Left behind: the turn light element (`web/src/table.ts:150-180`, belongs to the recipe's seat drawing; its angle maths is kept), flights (`209-330`), showcase and challenge layout (`440-530`), seat contents (`709-860`), betting controls, poker text, timers and video.
- `implementation/web/table-view.ts` <- the markup the recipe builds for the felt and seats, `web/src/table.ts:590-660` and `web/src/style.css:143-146, 164-170`. New `tableView`, `tableFor`, `seatStyle`, `boxAspect`; `tvScreen` is the header-banner-table frame of `web/src/board.ts:23-50` with the poker content removed (`generated-platform` for the oval-based television).
- `implementation/web/table-layout.css` <- `web/src/style.css:143-145` (`.table`, `.felt`, `.centre`) and `164-167` (`.seatwrap`, `.seat` placement only). `--felt` and `--felt-edge` became the theme's `--table` and `--table-edge`. Seat looks (`.seat`, `.avatar`, `.name`, `.stack`) left behind.

## Apple

- `implementation/apple/Sources/PlacedSeats.swift` <- `ios/OurPoker/Sources/Layout.swift:1-35` (same data; generated from the web table by script; tuples instead of `CGPoint` so it has no UI framework dependency).
- `implementation/apple/Sources/TableLayout.swift` <- `ios/OurPoker/Sources/Chips.swift:64-94` (`Spots`: angle, seat, ring, cards, shown, bet, tableCard, board, seatIndex) and `ios/OurPoker/Sources/DisplayScreen.swift:111-290` (`Ring` and `ViewerGeometry`), with `TableScreen.swift:26-71` for the screen class. Generalised: `PlayerView` and `GameView` arguments became seat counts and indices; `Platform.uprightBoard` became the `tv` orientation; one `tableLayout` function; `CGPoint` replaced by `TablePoint` so the geometry compiles and is tested without UIKit. Left behind: `FlightSpots`, `Flight`, `Showdown`, `TableEffects`, `GrowingClock`, `TurnLight` (`Chips.swift:96-455`) and everything poker in `TableScreen.swift` and `DisplayScreen.swift`.
- `implementation/apple/Sources/TableView.swift` <- the felt and seat placement in `TableScreen.swift:257-400` (`PokerTable`) and `DisplayScreen.swift:317-358` (`ViewerTable`, `RingPlace`). New `OvalTable`, `TelevisionTable` (`generated-platform` for the generic parts), seats and centre come from closures.

## Android

- `implementation/android/src/main/java/ae/tablelayout/PlacedSeats.kt` <- `android/app/src/main/java/app/ourapps/ourpoker/ui/Layout.kt:1-35` (same data, `Pair` instead of `FloatArray`, doubles).
- `implementation/android/src/main/java/ae/tablelayout/TableLayout.kt` <- `ui/Chips.kt:98-131` (`Spots`) for the portrait part; the landscape ring and television layout are `generated-platform`, translated from the Swift (the recipe's Android has only the portrait table, `ui/TableScreen.kt:212` `aspectRatio(1f / 1.3f)`).
- `implementation/android/src/main/java/ae/tablelayout/OvalTable.kt` <- new Compose view (`generated-platform`) over the placement in `ui/TableScreen.kt:212-400`.

## Tests

`tests/web.test.ts`, `tests/fake-dom.ts`, `tests/make-fixtures.ts`, `tests/fixtures/layouts.json`, `tests/apple/main.swift`, `tests/android/Main.kt`, `tests/android/Expected.kt`, `tests/native.py`, `examples/consumer.ts` are new. `Expected.kt` and `layouts.json` are generated from the TypeScript; the web test fails if they drift.
