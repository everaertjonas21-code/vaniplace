# Vani's Place

This project is now a public-only site:

- `Public/` contains the website and ordering pages
- `data/menu-data.json` is the single menu source
- `data/bestellingen/` stores one JSON file per order
- `data/audit-log.jsonl` stores security/audit events

## Run

```bash
npm start
```

Open `http://localhost:3000/home.html`.

## Checks

```bash
npm run health-check
```

## Google Sheets workflow

You now have 2 options:

1. Automatic sync from Google Sheets
2. Manual CSV import/export fallback

### Automatic sync

Set `GOOGLE_SHEETS_CSV_URL` in `.env`.

The server will then:

- read the Google Sheet automatically
- refresh it on a timer
- store the last good version in `data/menu-data.json`
- fall back to the local file if Google Sheets is temporarily unavailable
- optionally read sizes and extras from separate Google Sheets tabs

You can use either:

- a Google Sheets CSV export URL
- a normal Google Sheets tab URL

Details are in [Read Me/GOOGLE_SHEETS.md](c:/Users/Jonas/Documents/Vani's Place Test/Read Me/GOOGLE_SHEETS.md).

### Manual fallback

If you do not want live sync yet, use the CSV scripts:

```bash
npm run menu:export
```

This creates `data/exports/menu.csv`, which you can import into Google Sheets.

After editing in Google Sheets, download the sheet as CSV and import it back:

```bash
npm run menu:import -- path/to/menu.csv
```

## Documentation

- Customer flow: [Read Me/KLANT_README.md](c:/Users/Jonas/Documents/Vani's Place Test/Read Me/KLANT_README.md)
- Google Sheets notes: [Read Me/GOOGLE_SHEETS.md](c:/Users/Jonas/Documents/Vani's Place Test/Read Me/GOOGLE_SHEETS.md)
- Live deployment notes: [Read Me/LIVE_DEPLOYMENT.md](c:/Users/Jonas/Documents/Vani's Place Test/Read Me/LIVE_DEPLOYMENT.md)
- Terms page: [Public/algemene-voorwaarden.html](c:/Users/Jonas/Documents/Vani's Place Test/Public/algemene-voorwaarden.html)
- Privacy page: [Public/privacybeleid.html](c:/Users/Jonas/Documents/Vani's Place Test/Public/privacybeleid.html)
- Cookie page: [Public/cookiebeleid.html](c:/Users/Jonas/Documents/Vani's Place Test/Public/cookiebeleid.html)
