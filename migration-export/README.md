# Partial migration export

Read-only export from the old Sites deployment on 2026-09-29.

## Content files

- `menu.json`: effective deployed default menu, 4 categories and 6 dishes. The old `menu_content` database table has no saved rows.
- `content.json`: complete marketing content returned by the old content API, saved version 3.
- `seo.json`: effective deployed defaults; `seo_content` has no saved rows.
- `operations.json`: effective deployed defaults; `operations_config` has no saved rows.
- `campaigns.json`: empty array; `marketing_campaigns` has no saved rows.
- `media-list.json`: keys actually downloaded, currently an empty array. NOT a full bucket inventory.
- `media/`: destination for uploaded files, preserving bucket keys. Currently empty.
- `export-manifest.json`: source, provenance, counts, checksums and incomplete-media warning.

## Important limitation

The available Sites tools expose read-only database tables, but no R2 bucket-list or bucket-export operation. The deployed media endpoint retrieves an object only when its exact key is known. None of the exported content references `/api/media/` objects. Unreferenced uploads may still exist and have NOT been enumerated or exported. Do not delete old storage based on this export.

Bundled assets such as `/bailamos-logo.jpg` and `/table-terrace.webp` are code assets, not R2 uploads. External image/video URLs remain unchanged in the JSON and were not downloaded.

No reservation, reservation-event or newsletter-subscriber table rows were read or exported. No old-site content, configuration or deployment was modified. The original keys, URLs and text in exported API content have not been rewritten.

To finish: obtain a read-only full R2 object listing/export from the old hosting provider, download each key, then reconcile object counts before deleting or disabling the old storage.
