const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const MENU_DATA_PATH = path.join(ROOT_DIR, "data", "menu-data.json");
const PUBLIC_MENU_DATA_JS_PATH = path.join(ROOT_DIR, "Public", "menu-data.js");

function main() {
  const raw = fs.readFileSync(MENU_DATA_PATH, "utf8");
  const parsed = JSON.parse(raw);
  const categories = Array.isArray(parsed.categories) ? parsed.categories : [];
  const items = Array.isArray(parsed.items) ? parsed.items : [];

  const output = [
    `const MENU_CATEGORIES = ${JSON.stringify(categories, null, 2)};`,
    "",
    `const MENU_ITEMS = ${JSON.stringify(items, null, 2)};`,
    ""
  ].join("\n");

  fs.writeFileSync(PUBLIC_MENU_DATA_JS_PATH, output, "utf8");
  console.log(`Public menu fallback written to ${PUBLIC_MENU_DATA_JS_PATH}`);
}

main();
