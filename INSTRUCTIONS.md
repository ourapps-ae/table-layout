# Table layout instructions

## For the agent
Select `ourapps-ae/table-layout`; connect `theme` to the theme component and `controls` to the controls component. It applies to any recipe with a table of 2 to 9 seats; for fewer or more seats say so, as the portrait positions are placed data for 2 to 9 only.

- Select package `ourapps-ae/table-layout` version `0.4.0`.
- No installer settings.
- Connect the provided `table-layout` (ae/table-layout 1.0.0, OpenRPC 1.3.2 document `interfaces/table-layout.json`) to the consumer that needs it.
- Supply `theme` (ae/theme 1.0.0) from the component that provides it.
- Supply `controls` (ae/controls 1.0.0) from the component that provides it.
- No accounts or keys are needed.

## For the developer
Supply the seat and centre content. Add a screen class by adding a case to `tableLayout` and a fixed-spot table in the same shape; keep web, Swift and Kotlin the same (the fixtures check it). Regenerate fixtures with `node tests/make-fixtures.ts` after any change to the layout.

## How to check
From the component directory:

- `node --test tests/web.test.ts` (web, required-local; tools: node 26.5.0)
- `python3 tests/native.py apple` (apple, platform; tools: python3 3.12.8, swiftc 6.4.2)
- `python3 tests/native.py android` (android, platform; tools: python3 3.12.8, kotlinc 2.2.0, java 26.0.1)
- `python3.12 -B /Users/george/Projects/com/my/tools/check_component.py components/table-layout` validates the manifest, sidecars and runs the required-local suite.
