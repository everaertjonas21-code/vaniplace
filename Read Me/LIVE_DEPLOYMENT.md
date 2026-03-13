# Live Deployment

This is the practical checklist for putting Vani's Place online or handing it over to a buyer.

## What must exist on the live server

The live environment must run the Node server:

```bash
npm start
```

This project is not just static HTML.

If someone uploads only the `Public/` folder, these features will not work correctly:

- Google Sheets menu sync
- Google Sheets sizes sync
- Google Sheets extras sync
- live availability (`available = no`)
- product badges (`status_nl`)
- OpenAI auto-translation
- order endpoints

## Hosting requirements

Use hosting that supports:

- Node.js
- environment variables
- persistent file storage if you want to keep local order files and caches

Good fit:

- VPS
- Railway
- Render
- DigitalOcean
- a Node-capable hosting provider

Not ideal:

- static-only hosting
- shared hosting without Node support

## Required environment variables

At minimum, set these on the live server:

```env
PORT=3000
NODE_ENV=production
GOOGLE_SHEETS_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=MENU_GID
GOOGLE_SHEETS_SIZES_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=SIZES_GID
GOOGLE_SHEETS_EXTRAS_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=EXTRAS_GID
GOOGLE_SHEETS_REFRESH_MS=60000
PAYMENT_MODE=mock
```

If you want automatic EN/FR translation too:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_TRANSLATE_MODEL=gpt-4o-mini
```

`NODE_ENV=production` is important on the live server. In development mode the server keeps `noindex` headers on responses.

## Google Sheets settings

The Google Sheet must remain:

- `Anyone with the link`
- `Viewer`

If those sharing settings change, the website can stop reading the sheet.

## What still works when the site is live

If the deployment is correct, all of this keeps working online:

- menu items from Google Sheets
- sizes from Google Sheets
- extras from Google Sheets
- `status_nl` badges on products
- `available = no` for products
- `available = no` for sizes
- `available = no` for extras
- automatic EN/FR translation if OpenAI is configured

## Recommended pre-launch check

Before going live, test these:

1. Open `/api/menu-source`
2. Confirm `source` is `google_sheets`
3. Open `/api/order-options-source`
4. Confirm `source` is `google_sheets`
5. Change 1 product in Google Sheets
6. Wait for the refresh window
7. Refresh the site
8. Confirm the change is visible
9. Test 1 unavailable product
10. Test 1 unavailable size
11. Test 1 unavailable extra

## Important risk points

The most common reasons this breaks after deployment:

- `.env` values were not copied to production
- `NODE_ENV` was not set to `production`
- Google Sheet is no longer shared publicly as viewer
- hosting runs only static files and not `server.js`
- OpenAI key is missing, so translation no longer fills EN/FR
- the server has no write access to local data folders

## If you sell or hand over the site

Make sure the buyer receives:

- the full project, not only `Public/`
- the Google Sheet link
- the production environment variables
- instructions for Google Sheets editing
- this file
- [GOOGLE_SHEETS.md](/c:/Users/Jonas/Documents/Vani's Place Test/Read Me/GOOGLE_SHEETS.md)

## My safe handover checklist

- Verify `npm start` works on the target server
- Verify Google Sheets sync works
- Verify one test order can be placed
- Verify one item can be disabled with `available = no`
- Verify one extra can be disabled with `available = no`
- Verify one size can be disabled with `available = no`
- Rotate secrets if the project changes owner

## Secret handling

If this project is sold or moved to another owner:

- change the OpenAI API key
- change any payment secrets if those are later enabled
- do not send `.env` in public messages or screenshots

## Practical conclusion

Yes, this setup can keep working online exactly like it works locally now.

But only if the live server runs the full Node project and keeps the same Google Sheets and environment variable setup.
