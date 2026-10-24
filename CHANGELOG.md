# Changelog

## 0.2.1 — 2026-10-24

- Interface rebuilt on the project mockup: tab bar with icons, stat tiles, installation diagram, event list, working-rhythm timeline and daily energy bars.
- History sampling carries the last recorded value forward; the line breaks only where the entity was unavailable or unknown, because Recorder stores changes only.
- Fourteen-day energy bars come from daily Recorder `change` statistics; a day without statistics stays empty instead of showing zero.
- Optional roles added: operating mode, DHW valve, electric heater, demand and an existing COP entity feed the diagram, events and timeline.
- History ranges are 6/24/168 hours; the 72-hour range was dropped with the new range selector.
- Escape key handler is attached once per card instead of on every render.

## 0.1.0 — 2026-10-19

- Initial MVP: seven-tab Lovelace card with original responsive interface.
- MELCloud device-scoped discovery and graphical manual entity mapping.
- Local history charts, pointer inspection, reading tables and time-range selection.
- Matched-hour energy statistics, period COP and optional flat-price costs.
- Compressor estimates with explicit sample coverage; optional diagnostics.
- Opt-in temperature service calls with confirmation and capability validation.
- Single-file HACS distribution, MIT license, PL/EN docs, contract/unit tests and build CI.
- Real Home Assistant and hardware acceptance pending; advanced automations are not implemented.
