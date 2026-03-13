const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const MENU_DATA_PATH = path.join(ROOT_DIR, "data", "menu-data.json");
const EXPORT_DIR = path.join(ROOT_DIR, "data", "exports");
const EXPORT_PATH = path.join(EXPORT_DIR, "menu.csv");

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function getLocalizedValue(value, lang) {
  if (value && typeof value === "object") {
    return value[lang] ?? value.nl ?? value.en ?? value.fr ?? "";
  }
  return value ?? "";
}

function main() {
  const raw = fs.readFileSync(MENU_DATA_PATH, "utf8");
  const data = JSON.parse(raw);
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const items = Array.isArray(data.items) ? data.items : [];

  const categoryMap = new Map(
    categories.map((category) => [
      String(category.id || ""),
      {
        nl: getLocalizedValue(category.label, "nl"),
        en: getLocalizedValue(category.label, "en"),
        fr: getLocalizedValue(category.label, "fr")
      }
    ])
  );

  const lines = [
    [
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
    ].join(",")
  ];

  items.forEach((item) => {
    const categoryId = String(item.category || "");
    const category = categoryMap.get(categoryId) || { nl: "", en: "", fr: "" };
    const row = [
      categoryId,
      category.nl,
      category.en,
      category.fr,
      getLocalizedValue(item.name, "nl"),
      getLocalizedValue(item.name, "en"),
      getLocalizedValue(item.name, "fr"),
      getLocalizedValue(item.description, "nl"),
      getLocalizedValue(item.description, "en"),
      getLocalizedValue(item.description, "fr"),
      item.price || ""
    ].map(csvEscape);

    lines.push(row.join(","));
  });

  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  fs.writeFileSync(EXPORT_PATH, `${lines.join("\n")}\n`, "utf8");
  console.log(`Menu exported to ${EXPORT_PATH}`);
}

main();
