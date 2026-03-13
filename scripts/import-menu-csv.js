const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const MENU_DATA_PATH = path.join(ROOT_DIR, "data", "menu-data.json");
const PUBLIC_MENU_DATA_JS_PATH = path.join(ROOT_DIR, "Public", "menu-data.js");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === "\"" && next === "\"") {
        cell += "\"";
        index += 1;
        continue;
      }
      if (char === "\"") {
        inQuotes = false;
        continue;
      }
      cell += char;
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((currentRow) => currentRow.some((value) => String(value || "").trim() !== ""));
}

function normalizeText(value, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
}

function normalizePrice(value) {
  const raw = normalizeText(value);
  const match = raw.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!match) return "";
  return `EUR ${Number(match[1]).toFixed(2).replace(".", ",")}`;
}

function getRequiredIndexMap(headerRow) {
  const headerMap = new Map(headerRow.map((cell, index) => [normalizeText(cell).toLowerCase(), index]));
  const requiredHeaders = [
    "category_id",
    "category_label_nl",
    "category_label_en",
    "category_label_fr",
    "item_name_nl",
    "item_name_en",
    "item_name_fr",
    "description_nl",
    "description_en",
    "description_fr",
    "price"
  ];

  const indexMap = {};
  requiredHeaders.forEach((header) => {
    if (!headerMap.has(header)) {
      throw new Error(`Missing required CSV header: ${header}`);
    }
    indexMap[header] = headerMap.get(header);
  });

  return indexMap;
}

function main() {
  const sourcePathArg = process.argv[2];
  if (!sourcePathArg) {
    console.error("Usage: npm run menu:import -- <path-to-csv>");
    process.exit(1);
  }

  const inputPath = path.resolve(ROOT_DIR, sourcePathArg);
  if (!fs.existsSync(inputPath)) {
    console.error(`CSV file not found: ${inputPath}`);
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(inputPath, "utf8"));
  if (rows.length < 2) {
    console.error("CSV file is empty.");
    process.exit(1);
  }

  const indexMap = getRequiredIndexMap(rows[0]);
  const categories = new Map();
  const items = [];

  rows.slice(1).forEach((row, rowIndex) => {
    const categoryId = normalizeText(row[indexMap.category_id]).toLowerCase().replace(/[^a-z0-9-]/g, "");
    const price = normalizePrice(row[indexMap.price]);
    const itemNameNl = normalizeText(row[indexMap.item_name_nl]);
    const itemNameEn = normalizeText(row[indexMap.item_name_en], itemNameNl);
    const itemNameFr = normalizeText(row[indexMap.item_name_fr], itemNameNl);

    if (!categoryId || !price || !itemNameNl) {
      console.warn(`Skipping row ${rowIndex + 2} because category_id, item_name_nl or price is missing.`);
      return;
    }

    if (!categories.has(categoryId)) {
      categories.set(categoryId, {
        id: categoryId,
        label: {
          nl: normalizeText(row[indexMap.category_label_nl], categoryId),
          en: normalizeText(row[indexMap.category_label_en], row[indexMap.category_label_nl] || categoryId),
          fr: normalizeText(row[indexMap.category_label_fr], row[indexMap.category_label_nl] || categoryId)
        }
      });
    }

    items.push({
      category: categoryId,
      name: {
        nl: itemNameNl,
        en: itemNameEn,
        fr: itemNameFr
      },
      description: {
        nl: normalizeText(row[indexMap.description_nl], "Vers bereid."),
        en: normalizeText(row[indexMap.description_en], row[indexMap.description_nl] || "Freshly prepared."),
        fr: normalizeText(row[indexMap.description_fr], row[indexMap.description_nl] || "Prepare frais.")
      },
      price
    });
  });

  if (!categories.size || !items.length) {
    console.error("No valid menu rows found in CSV.");
    process.exit(1);
  }

  const normalizedMenu = { categories: Array.from(categories.values()), items };

  fs.writeFileSync(MENU_DATA_PATH, `${JSON.stringify(normalizedMenu, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    PUBLIC_MENU_DATA_JS_PATH,
    [
      `const MENU_CATEGORIES = ${JSON.stringify(normalizedMenu.categories, null, 2)};`,
      "",
      `const MENU_ITEMS = ${JSON.stringify(normalizedMenu.items, null, 2)};`,
      ""
    ].join("\n"),
    "utf8"
  );

  console.log(`Menu imported into ${MENU_DATA_PATH}`);
}

main();
