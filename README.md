# Calgary-Shaw Live Election Map

Live GeoIntel map for the September 14, 2026 Calgary-Shaw provincial by-election.

## Purpose

This is a standalone, public election-night viewer built from lessons and reusable cartographic patterns in `csmith-platform/geointel-UCP`. The source repo remains unchanged.

The application is designed to:

- poll Elections Alberta unofficial results for event `8486`
- show riding-level totals and reporting progress
- map ordinary Election Day voting areas as they report
- colour reported voting areas by leading party and winning margin
- clearly distinguish unreported voting areas
- keep advance, mobile, and special-ballot totals at riding level rather than assigning them to neighbourhood polygons
- link back to `https://claytonsmith.ca` and `https://geointel.claytonsmith.ca`

## Live results source

Elections Alberta endpoint discovered from the official results application's network traffic:

`https://results.elections.ab.ca/data/8486?version=3.0.0&wards=23`

The official viewer defaults to a 60-second refresh and supports 30, 60, and 90 second refresh intervals. This project targets a 30-second refresh through a same-origin proxy.

## Geometry note

Do **not** blindly reuse the 2023 Calgary-Shaw voting-area polygons. The published 2023 map contains 66 ordinary voting areas, while the September 14, 2026 by-election result feed contains 68. Current-event geometry must be validated before the live poll choropleth is considered authoritative.

## Stack

- React
- Vite
- MapLibre GL JS
- Cloudflare Pages / Pages Functions

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

Designed for Cloudflare Pages. A Pages Function under `functions/api/results.js` proxies and normalizes the Elections Alberta feed to avoid relying on undocumented cross-origin browser access.
