# Open Ecodan Dashboard

Free, MIT-licensed Lovelace card for existing Mitsubishi Ecodan entities in Home Assistant. [Polski](README.md).

**0.2.1: implemented software, running on one real Home Assistant installation; readings are not yet cross-checked against hardware counters.** No affiliation with Mitsubishi Electric. No proprietary code, assets or private account data are included.

## Features

Seven tabs: Overview, Temperatures, Energy, Compressor, DHW, Diagnostics and Settings, with an installation diagram, event list and a working-rhythm timeline. Responsive native Web Component, graphical configuration, registry-based discovery scoped to a device, manual overrides and Polish/English navigation. Some diagnostic/editor labels are bilingual in this MVP.

Local history charts show 6/24/168 hours with pointer inspection and accessible reading tables. Recorder stores state changes only, so a sample is carried forward until the next change; the line breaks where the entity was unavailable or unknown. Separate temperature plots share a time range; overlay comparisons and drag zoom are not implemented. Current values come only from HA states. Missing, unknown and unavailable states never become fake numeric measurements.

Energy uses manually paired counters for the SAME circuit and measurement scope. Hourly Recorder `sum` deltas are converted to kWh and checked for matching, continuous hourly boundaries. COP is total heat divided by total electricity, never the arithmetic mean of hourly COP. Missing hours, null sums or negative deltas invalidate the result. Zero consumption means no COP. The displayed interval accounts for statistics rows representing an hour ending one hour after their `start`. The last incomplete hour is excluded. This does not guarantee physical sampling synchrony in the manufacturer's cloud. This is period COP, not certified SCOP.

Cost is an estimate using one configured flat price per kWh. No price means no cost result. Changing the price re-prices the entire viewed period. There is no dynamic tariff accounting. Compressor runtime and observed starts are estimates from frequency samples; gaps above 15 minutes are excluded and coverage is shown.

## Requirements and compatibility

Existing working `melcloud` integration; `history` and `recorder` enabled and recording selected entities. Target: HA 2026.10. Minimum compatible HA version has not been established. Air-to-Water Ecodan systems are the target; no individual hardware model has been certified. Availability varies with device and HA version. Discovery also recognizes `melcloud_home`, without separate compatibility validation. Other sources can be mapped manually.

Energy sensors must have energy device class, `total` or `total_increasing` state class and Wh/kWh/MWh units. Do not set misleading sensor classes just to enable COP. Do not pair whole-system consumption with DHW-only production. Whole-system aggregates require correctly synchronized HA sensors; this card does not automatically aggregate heating, cooling and DHW.

## Manual installation

1. Copy `dist/open-ecodan-dashboard.js` to `/config/www/open-ecodan-dashboard.js`.
2. Add dashboard resource `/local/open-ecodan-dashboard.js?v=0.2.1`, type **JavaScript module**.
3. Reload the frontend, add Open Ecodan Dashboard from the picker or use:

```yaml
type: custom:open-ecodan-dashboard
language: en
controls: false
entities: {}
```

4. Open the graphical card editor and check mappings. Select a device when multiple pumps exist. Auto discovers only unambiguous roles; None disables a role. Energy is always manually assigned.
5. Confirm matching energy scope only after checking both sensors. Configure a flat tariff if desired.

## HACS custom repository

The repository has **not been published**. After approving publication, upload the complete project to a public GitHub repository named `open-ecodan-dashboard`, retaining `hacs.json` and `dist` on the default branch. In HACS → Custom repositories add that actual URL, type **Dashboard** (Plugin in some versions), then download. Check resource `/hacsfiles/open-ecodan-dashboard/open-ecodan-dashboard.js` as a JavaScript module. Add it manually if necessary. Do not load both local and HACS copies. This is not approval for the HACS default repository list.

Updates: download through HACS and reload, or replace the manual JS file and bump the resource `?v=` query. Back up card configuration before upgrading. Removal does not delete Recorder history.

## Controls and privacy

Temperature commands for `climate` and `water_heater` are disabled by default. Enable `controls: true`; commands validate supported features and min/max temperature and require confirmation. Successful submission is not displayed as a measured temperature. No power controls: MELCloud power can stop the entire system, including all zones and DHW.

No project backend, fees, third-party accounts, credentials, external JS imports, CDN, analytics or project telemetry. Runtime calls only the existing HA session through `hass`. MELCloud itself still relies on Mitsubishi's cloud. Permissions remain enforced by HA. No changes to anti-legionella or device safety settings are made.

An absent defrost/error entity means unknown capability, not “no defrost” or “no fault.” Chart lines connect actual readings; they do not imply intermediate samples or uninterrupted cloud reporting.

## Build and validation

Node 22+, no npm dependencies: `npm run build`, `npm test`, `npm run check`. CI performs these checks, verifies distribution reproducibility and uploads a build artifact. It does not publish releases or push code. Tests cover calculations, missing data, resets, discovery, control validation and HA request contracts with a minimal DOM adapter. Real HA/browser/hardware acceptance remains required: [acceptance guide](docs/ACCEPTANCE.md).

Not implemented: certified SCOP, dynamic tariffs, schedule editor, background notifications, PV automation, Summer ECO, night mode, remote service-code polling or public reports. Use HA backend automations for schedules and alerts; a card cannot run these reliably while closed. See [architecture](docs/ARCHITECTURE.md).
