# Google Sheets

The site can now read the menu automatically from Google Sheets.

If Google Sheets is unavailable, the site falls back to `data/menu-data.json`.

The same setup can also be used for:

- sizes
- extras
- automatic EN/FR translation via OpenAI when those texts are empty or still identical to NL

## What you need

Use one Google Sheet tab as the menu source.

Minimum required columns for `menu`:

- `category_id`
- `category_label_nl`
- `item_name_nl`
- `description_nl`
- `price`

Optional columns for `menu`:

- `category_label_en`
- `category_label_fr`
- `item_name_en`
- `item_name_fr`
- `description_en`
- `description_fr`
- `status_nl`
- `status_en`
- `status_fr`
- `available`

For dynamic popup options, create 2 extra tabs:

- `sizes`
- `extras`

### Minimum required columns for `sizes`

- `id`
- `label_nl`
- `delta`

Optional columns for `sizes`:

- `label_en`
- `label_fr`

### Minimum required columns for `extras`

- `group_id`
- `group_label_nl`
- `id`
- `label_nl`
- `price`

Optional columns for `extras`:

- `group_label_en`
- `group_label_fr`
- `label_en`
- `label_fr`

## Step by step

### 1. Export the current menu once

```bash
node scripts/export-menu-csv.js
```

This creates:

- `data/exports/menu.csv`

### 2. Import that CSV into Google Sheets

In Google Sheets:

1. Create a new spreadsheet.
2. Open `File` > `Import`.
3. Upload `data/exports/menu.csv`.
4. Import it as a new sheet.

### 3. Keep the header row unchanged

Do not rename the required column names.

You can change:

- categories
- product names
- descriptions
- prices

## 4. Make the sheet readable by the website

You have 2 simple choices.

### Option A: easiest

Share the sheet as viewer with link access.

### Option B: older Google Sheets flow

Publish the tab to the web as CSV.

Either way, this project can work with:

- a normal Google Sheets URL
- a CSV export URL

## 5. Copy the sheet URL

Example normal URL:

```text
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=0
```

Example CSV URL:

```text
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0
```

## 6. Put it in `.env`

Add these lines:

```env
GOOGLE_SHEETS_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=0
GOOGLE_SHEETS_SIZES_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=111111111
GOOGLE_SHEETS_EXTRAS_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=222222222
GOOGLE_SHEETS_REFRESH_MS=300000
OPENAI_API_KEY=your_openai_api_key
OPENAI_TRANSLATE_MODEL=gpt-4o-mini
```

`300000` means every 5 minutes.

If you want faster updates while testing:

```env
GOOGLE_SHEETS_REFRESH_MS=60000
```

That means every 1 minute.

## 7. Restart the server

```bash
npm start
```

After restart, the website will try to load the menu from Google Sheets automatically.

## 8. Change the menu later

When the manager edits the Google Sheet:

- save the changes in Google Sheets
- wait until the refresh window passes
- refresh `menu.html`

No admin page is needed anymore.

For sizes and extras:

- edit the `sizes` tab
- edit the `extras` tab
- wait for the refresh window
- refresh the website

The add-to-cart popup and order edit popup will update automatically.

If `OPENAI_API_KEY` is set:

- Dutch remains the main source text
- EN and FR can be left empty
- EN and FR columns may even be omitted from the Google Sheet
- the server can auto-fill those translations when loading the data

### Availability control

You can optionally add:

- `status_nl`
- `available`

Examples:

- `status_nl = Tijdelijk op`
- `available = no`

Effect:

- the product shows a visible badge
- the order button is disabled

## Simple daily use

Use the sheet like this:

- `menu` = all products on the website
- `sizes` = format choices in the popup
- `extras` = extra options in the popup

For normal daily work, you usually only fill Dutch:

### `menu`

- `category_id`
- `category_label_nl`
- `item_name_nl`
- `description_nl`
- `price`
- optional: `status_nl`
- optional: `available`

### `sizes`

- `id`
- `label_nl`
- `delta`
- optional: `available`

### `extras`

- `group_id`
- `group_label_nl`
- `id`
- `label_nl`
- `price`
- optional: `available`

If `OPENAI_API_KEY` is set, the server can translate missing EN/FR automatically.

That means:

- you may keep EN/FR columns empty
- or remove EN/FR columns completely
- Dutch stays the main source

## Availability examples

### Product temporarily unavailable

In `menu`:

- `status_nl = Tijdelijk op`
- `available = no`

Result:

- the product shows a badge
- the button changes to unavailable
- customers cannot click it

### Product available again

In `menu`:

- clear `status_nl`
- set `available = yes` or leave it empty

Result:

- badge disappears
- button works again

### Size temporarily unavailable

In `sizes`:

- `available = no`

Result:

- that size disappears from the popup

### Extra temporarily unavailable

In `extras`:

- `available = no`

Result:

- that extra disappears from the popup

## Quick manager workflow

1. Open Google Sheets.
2. Change a product, size, or extra.
3. Wait about 1 minute if `GOOGLE_SHEETS_REFRESH_MS=60000`.
4. Refresh the website.

## Good rules

- Keep row 1 unchanged.
- Use 1 item per row.
- Do not merge cells.
- Use `yes` or `no` for `available`.
- Leave `available` empty if the item is available.
- Use `status_nl` only when you want to show a visible label on a product card.

## Debugging

The site exposes a status endpoint:

```text
/api/menu-source
```

It shows:

- whether Google Sheets sync is configured
- whether the current source is `google_sheets` or local fallback
- the last success time
- the last sync error

Extra popup options can be checked here:

```text
/api/order-options-source
```

## Manual fallback still exists

If you want to stop live sync temporarily, remove `GOOGLE_SHEETS_CSV_URL` from `.env`.

You can still manage the menu with CSV:

Export:

```bash
npm run menu:export
```

Import:

```bash
npm run menu:import -- path/to/menu.csv
```
