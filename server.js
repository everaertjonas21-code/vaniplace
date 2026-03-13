const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, "Public");
const DATA_DIR = path.join(ROOT_DIR, "data");
const ENV_PATH = path.join(ROOT_DIR, ".env");
const MENU_DATA_PATH = path.join(DATA_DIR, "menu-data.json");
const TRANSLATION_CACHE_PATH = path.join(DATA_DIR, "translation-cache.json");
const AUDIT_LOG_PATH = path.join(DATA_DIR, "audit-log.jsonl");
const ORDERS_DIR = path.join(DATA_DIR, "bestellingen");

function loadEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return;
  const content = fs.readFileSync(ENV_PATH, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = String(process.env.NODE_ENV || "development").trim().toLowerCase();
const RAW_PAYMENT_MODE = String(process.env.PAYMENT_MODE || "mock").trim().toLowerCase();
const PAYMENT_MODE = "mock";
const PAYMENT_CURRENCY = String(process.env.PAYMENT_CURRENCY || "EUR").trim().toUpperCase() || "EUR";
const GOOGLE_SHEETS_CSV_URL = String(process.env.GOOGLE_SHEETS_CSV_URL || "").trim();
const GOOGLE_SHEETS_SIZES_URL = String(process.env.GOOGLE_SHEETS_SIZES_URL || "").trim();
const GOOGLE_SHEETS_EXTRAS_URL = String(process.env.GOOGLE_SHEETS_EXTRAS_URL || "").trim();
const GOOGLE_SHEETS_REFRESH_MS = Math.max(30 * 1000, Number(process.env.GOOGLE_SHEETS_REFRESH_MS) || 5 * 60 * 1000);
const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || "").trim();
const OPENAI_TRANSLATE_MODEL = String(process.env.OPENAI_TRANSLATE_MODEL || "gpt-4o-mini").trim();

const REQUEST_BODY_LIMIT = 2 * 1024 * 1024;
const MAX_TEXT_LEN = 300;
const MAX_MENU_CATEGORIES = 30;
const MAX_MENU_ITEMS = 800;
const MAX_ITEMS_PER_ORDER = 50;
const ORDER_WINDOW_MS = 60 * 1000;
const ORDER_MAX_ATTEMPTS = 30;
const STATUS_WINDOW_MS = 60 * 1000;
const STATUS_MAX_ATTEMPTS = 120;
const PICKUP_MIN_LEAD_MINUTES = 10;
const PICKUP_MAX_DAYS_AHEAD = 2;
const REMOTE_MENU_FETCH_LIMIT_BYTES = 1024 * 1024;
const REMOTE_MENU_FETCH_TIMEOUT_MS = 8000;

const RATE_LIMITS = new Map();
let translationCacheState = null;
const MENU_CACHE = {
  data: null,
  source: "local",
  fetchedAt: 0,
  inFlight: null,
  lastError: "",
  lastSuccessAt: 0
};
const ORDER_OPTIONS_CACHE = {
  data: null,
  source: "default",
  fetchedAt: 0,
  inFlight: null,
  lastError: "",
  lastSuccessAt: 0
};

const DEFAULT_ORDER_OPTIONS = {
  sizes: [
    {
      id: "small",
      label: { nl: "Klein", en: "Small", fr: "Petit" },
      delta: 0
    },
    {
      id: "large",
      label: { nl: "Groot", en: "Large", fr: "Grand" },
      delta: 1
    }
  ],
  extraGroups: [
    {
      id: "sauzen-en-toppings",
      title: { nl: "Saus en toppings", en: "Sauces and toppings", fr: "Sauces et toppings" },
      options: [
        { id: "smos", label: { nl: "Smos", en: "Smos", fr: "Smos" }, price: 1 },
        { id: "sla", label: { nl: "Seldersla", en: "Celery salad", fr: "Salade de celeri" }, price: 0.5 },
        { id: "boter", label: { nl: "Boter", en: "Butter", fr: "Beurre" }, price: 0 },
        { id: "ajuin", label: { nl: "Ajuin", en: "Onion", fr: "Oignon" }, price: 0.3 },
        { id: "gedroogde-ajuin", label: { nl: "Gedroogde ajuin", en: "Dried onion", fr: "Oignon seche" }, price: 0.3 },
        { id: "spek", label: { nl: "Spek", en: "Bacon", fr: "Lard" }, price: 1 },
        { id: "honing", label: { nl: "Honing", en: "Honey", fr: "Miel" }, price: 0.5 },
        { id: "extra-pikant", label: { nl: "Extra pikant", en: "Extra spicy", fr: "Extra epicé" }, price: 0 },
        { id: "mayonaise", label: { nl: "Mayonaise", en: "Mayonnaise", fr: "Mayonnaise" }, price: 0.5 },
        { id: "tomaten-ketchup", label: { nl: "Tomaten ketchup", en: "Tomato ketchup", fr: "Ketchup tomate" }, price: 0.5 },
        { id: "curry-ketchup", label: { nl: "Curry ketchup", en: "Curry ketchup", fr: "Ketchup curry" }, price: 0.5 },
        { id: "andalouse", label: { nl: "Andalouse", en: "Andalouse", fr: "Andalouse" }, price: 0.5 },
        { id: "tartare", label: { nl: "Tartare", en: "Tartare", fr: "Tartare" }, price: 0.5 },
        { id: "barbecue", label: { nl: "Barbecue", en: "Barbecue", fr: "Barbecue" }, price: 0.5 },
        { id: "curry", label: { nl: "Curry", en: "Curry", fr: "Curry" }, price: 0.5 },
        { id: "currymayonaise", label: { nl: "Currymayonaise", en: "Curry mayonnaise", fr: "Mayonnaise curry" }, price: 0.5 },
        { id: "bicky-geel", label: { nl: "Bicky saus geel", en: "Bicky yellow sauce", fr: "Sauce Bicky jaune" }, price: 0.5 },
        { id: "bicky-bruin", label: { nl: "Bicky saus bruin", en: "Bicky brown sauce", fr: "Sauce Bicky brune" }, price: 0.5 },
        { id: "samourai", label: { nl: "Samourai", en: "Samourai", fr: "Samourai" }, price: 0.5 },
        { id: "mosterd", label: { nl: "Mosterd", en: "Mustard", fr: "Moutarde" }, price: 0.5 },
        { id: "mammouth", label: { nl: "Mammouth", en: "Mammouth", fr: "Mammouth" }, price: 0.5 },
        { id: "hot-shot", label: { nl: "Hot shot", en: "Hot shot", fr: "Hot shot" }, price: 0.5 },
        { id: "americaine", label: { nl: "Americaine", en: "American sauce", fr: "Americaine" }, price: 0.5 },
        { id: "cocktail", label: { nl: "Cocktail", en: "Cocktail", fr: "Cocktail" }, price: 0.5 },
        { id: "joppie", label: { nl: "Joppie", en: "Joppie", fr: "Joppie" }, price: 0.5 }
      ]
    },
    {
      id: "broodjes",
      title: { nl: "Broodjes", en: "Bread options", fr: "Options de pain" },
      options: [
        { id: "bruin-broodje", label: { nl: "Bruin broodje", en: "Brown roll", fr: "Petit pain brun" }, price: 0.5 },
        {
          id: "glutenvrij-rond",
          label: { nl: "Glutenvrij rond broodje", en: "Gluten-free round roll", fr: "Petit pain rond sans gluten" },
          price: 1.5
        }
      ]
    }
  ]
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const OPENING_HOURS_BY_DAY = {
  0: null,
  1: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  2: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  3: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  4: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  5: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  6: { openMinutes: 8 * 60, closeMinutes: 14 * 60 + 30 }
};

function sanitizeOrderInput(value, maxLength = MAX_TEXT_LEN) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeMenuText(value, maxLength = 180) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeCategoryId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
}

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

function getCsvIndexMap(headerRow) {
  const headerMap = getHeaderMap(headerRow);
  return {
    ...requireHeaders(headerMap, ["category_id", "category_label_nl", "item_name_nl", "description_nl", "price"]),
    category_label_en: headerMap.get("category_label_en"),
    category_label_fr: headerMap.get("category_label_fr"),
    item_name_en: headerMap.get("item_name_en"),
    item_name_fr: headerMap.get("item_name_fr"),
    description_en: headerMap.get("description_en"),
    description_fr: headerMap.get("description_fr"),
    status_nl: headerMap.get("status_nl"),
    status_en: headerMap.get("status_en"),
    status_fr: headerMap.get("status_fr"),
    available: headerMap.get("available")
  };
}

function normalizePriceDisplay(value) {
  const raw = sanitizeMenuText(value, 20);
  const match = raw.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!match) return "";
  return `EUR ${Number(match[1]).toFixed(2).replace(".", ",")}`;
}

function parseAvailabilityFlag(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return true;
  if (["no", "nee", "false", "0", "off", "n"].includes(normalized)) return false;
  return true;
}

function loadTranslationCache() {
  if (translationCacheState) return translationCacheState;
  try {
    if (fs.existsSync(TRANSLATION_CACHE_PATH)) {
      translationCacheState = JSON.parse(fs.readFileSync(TRANSLATION_CACHE_PATH, "utf8"));
    } else {
      translationCacheState = {};
    }
  } catch (error) {
    translationCacheState = {};
  }
  return translationCacheState;
}

function saveTranslationCache() {
  try {
    fs.mkdirSync(path.dirname(TRANSLATION_CACHE_PATH), { recursive: true });
    fs.writeFileSync(TRANSLATION_CACHE_PATH, `${JSON.stringify(loadTranslationCache(), null, 2)}\n`, "utf8");
  } catch (error) {
    console.warn(`Translation cache write failed: ${error.message}`);
  }
}

function getTranslationCacheKey(contextType, targetLang, text) {
  return `${contextType}:${targetLang}:${String(text || "").trim()}`;
}

function requestOpenAiJson(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = https.request(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        timeout: REMOTE_MENU_FETCH_TIMEOUT_MS
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          const statusCode = Number(response.statusCode) || 0;
          if (statusCode < 200 || statusCode >= 300) {
            reject(new Error(`OpenAI gaf status ${statusCode}`));
            return;
          }

          try {
            resolve(JSON.parse(raw));
          } catch (error) {
            reject(new Error("OpenAI response is geen geldige JSON."));
          }
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("OpenAI request timeout."));
    });
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

async function translateMissingTextsWithOpenAi(texts, targetLang, contextType) {
  const cache = loadTranslationCache();
  const normalizedTexts = Array.from(
    new Set(
      texts
        .map((text) => sanitizeMenuText(text, 220))
        .filter(Boolean)
    )
  );

  if (!normalizedTexts.length || !OPENAI_API_KEY) {
    return new Map();
  }

  const uncachedTexts = normalizedTexts.filter((text) => !cache[getTranslationCacheKey(contextType, targetLang, text)]);
  if (!uncachedTexts.length) {
    return new Map(
      normalizedTexts.map((text) => [text, cache[getTranslationCacheKey(contextType, targetLang, text)]])
    );
  }

  const chunks = [];
  for (let index = 0; index < uncachedTexts.length; index += 20) {
    chunks.push(uncachedTexts.slice(index, index + 20));
  }

  for (const chunk of chunks) {
    const response = await requestOpenAiJson({
      model: OPENAI_TRANSLATE_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You translate Dutch menu/shop interface text. Keep product names natural. Return strict JSON with key translations as an array of strings in the same order."
        },
        {
          role: "user",
          content: JSON.stringify({
            target_language: targetLang,
            context: contextType,
            texts: chunk
          })
        }
      ]
    });

    const content = response?.choices?.[0]?.message?.content;
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error("OpenAI vertaalresponse kon niet gelezen worden.");
    }

    const translations = Array.isArray(parsed?.translations) ? parsed.translations : [];
    if (translations.length !== chunk.length) {
      throw new Error("OpenAI gaf een onvolledige vertaalset terug.");
    }

    chunk.forEach((sourceText, index) => {
      cache[getTranslationCacheKey(contextType, targetLang, sourceText)] = sanitizeMenuText(translations[index], 220);
    });
  }

  saveTranslationCache();
  return new Map(
    normalizedTexts.map((text) => [text, cache[getTranslationCacheKey(contextType, targetLang, text)] || text])
  );
}

async function autoTranslateLocalizedEntries(entries, contextType) {
  if (!Array.isArray(entries) || !entries.length || !OPENAI_API_KEY) return entries;

  const needsEn = entries.some((entry) => {
    const nl = sanitizeMenuText(entry.nl, 220);
    const en = sanitizeMenuText(entry.en, 220);
    return !en || en === nl;
  });
  const needsFr = entries.some((entry) => {
    const nl = sanitizeMenuText(entry.nl, 220);
    const fr = sanitizeMenuText(entry.fr, 220);
    return !fr || fr === nl;
  });
  const baseTexts = entries.map((entry) => sanitizeMenuText(entry.nl, 220)).filter(Boolean);

  const [enMap, frMap] = await Promise.all([
    needsEn ? translateMissingTextsWithOpenAi(baseTexts, "English", contextType) : Promise.resolve(new Map()),
    needsFr ? translateMissingTextsWithOpenAi(baseTexts, "French", contextType) : Promise.resolve(new Map())
  ]);

  return entries.map((entry) => {
    const nl = sanitizeMenuText(entry.nl, 220);
    const currentEn = sanitizeMenuText(entry.en, 220);
    const currentFr = sanitizeMenuText(entry.fr, 220);
    return {
      nl,
      en: !currentEn || currentEn === nl ? enMap.get(nl) || nl : currentEn,
      fr: !currentFr || currentFr === nl ? frMap.get(nl) || nl : currentFr
    };
  });
}

function buildMenuDataFromCsv(csvText) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    throw new Error("Google Sheets CSV bevat geen menu-rijen.");
  }

  const indexMap = getCsvIndexMap(rows[0]);
  const categories = new Map();
  const items = [];

  rows.slice(1).forEach((row) => {
    const categoryId = sanitizeCategoryId(row[indexMap.category_id]);
    const itemNameNl = sanitizeMenuText(row[indexMap.item_name_nl], 80);
    const itemNameEn = sanitizeMenuText(row[indexMap.item_name_en] || itemNameNl, 80);
    const itemNameFr = sanitizeMenuText(row[indexMap.item_name_fr] || itemNameNl, 80);
    const price = normalizePriceDisplay(row[indexMap.price]);

    if (!categoryId || !itemNameNl || !price) return;

    if (!categories.has(categoryId)) {
      categories.set(categoryId, {
        id: categoryId,
        label: {
          nl: sanitizeMenuText(row[indexMap.category_label_nl] || categoryId, 60),
          en: sanitizeMenuText(row[indexMap.category_label_en] || row[indexMap.category_label_nl] || categoryId, 60),
          fr: sanitizeMenuText(row[indexMap.category_label_fr] || row[indexMap.category_label_nl] || categoryId, 60)
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
        nl: sanitizeMenuText(row[indexMap.description_nl] || "Vers bereid.", 220),
        en: sanitizeMenuText(row[indexMap.description_en] || row[indexMap.description_nl] || "Freshly prepared.", 220),
        fr: sanitizeMenuText(row[indexMap.description_fr] || row[indexMap.description_nl] || "Prepare frais.", 220)
      },
      price,
      status: {
        nl: sanitizeMenuText(parseOptionalCell(row, indexMap, "status_nl", ""), 60),
        en: sanitizeMenuText(parseOptionalCell(row, indexMap, "status_en", ""), 60),
        fr: sanitizeMenuText(parseOptionalCell(row, indexMap, "status_fr", ""), 60)
      },
      available: parseAvailabilityFlag(parseOptionalCell(row, indexMap, "available", "yes"))
    });
  });

  return normalizeMenuData({
    categories: Array.from(categories.values()),
    items
  });
}

async function autoTranslateMenuData(data) {
  if (!OPENAI_API_KEY) return data;

  const categories = Array.isArray(data.categories) ? data.categories : [];
  const items = Array.isArray(data.items) ? data.items : [];

  const translatedCategoryLabels = await autoTranslateLocalizedEntries(
    categories.map((category) => category.label),
    "menu-category-label"
  );

  const translatedItemNames = await autoTranslateLocalizedEntries(
    items.map((item) => item.name),
    "menu-item-name"
  );

  const translatedDescriptions = await autoTranslateLocalizedEntries(
    items.map((item) => item.description),
    "menu-item-description"
  );

  const translatedStatuses = await autoTranslateLocalizedEntries(
    items.map((item) => item.status || { nl: "", en: "", fr: "" }),
    "menu-item-status"
  );

  return {
    categories: categories.map((category, index) => ({
      ...category,
      label: translatedCategoryLabels[index]
    })),
    items: items.map((item, index) => ({
      ...item,
      name: translatedItemNames[index],
      description: translatedDescriptions[index],
      status: translatedStatuses[index]
    }))
  };
}

function parseOptionalCell(row, indexMap, key, fallback = "") {
  const columnIndex = indexMap[key];
  if (typeof columnIndex !== "number") return fallback;
  return row[columnIndex] ?? fallback;
}

function getHeaderMap(headerRow) {
  return new Map(headerRow.map((cell, index) => [String(cell || "").trim().toLowerCase(), index]));
}

function requireHeaders(headerMap, requiredHeaders) {
  const indexMap = {};
  requiredHeaders.forEach((header) => {
    if (!headerMap.has(header)) {
      throw new Error(`Missing required CSV header: ${header}`);
    }
    indexMap[header] = headerMap.get(header);
  });
  return indexMap;
}

function parseMoneyNumber(value) {
  const normalized = String(value || "").replace(",", ".");
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return amount;
}

function normalizeOrderOptionsData(data) {
  const sizes = Array.isArray(data?.sizes) ? data.sizes : [];
  const extraGroups = Array.isArray(data?.extraGroups) ? data.extraGroups : [];
  if (!sizes.length || !extraGroups.length) {
    throw new Error("Order options zijn onvolledig.");
  }

  const normalizedSizes = sizes
    .map((size) => {
      const id = sanitizeCategoryId(size?.id);
      if (!id) return null;
      const labelNl = sanitizeMenuText(size?.label?.nl || size?.label || id, 60);
      const labelEn = sanitizeMenuText(size?.label?.en || labelNl, 60);
      const labelFr = sanitizeMenuText(size?.label?.fr || labelNl, 60);
      const delta = parseMoneyNumber(size?.delta);
      const available = size?.available !== false;
      return {
        id,
        label: { nl: labelNl, en: labelEn, fr: labelFr },
        delta,
        available
      };
    })
    .filter(Boolean);

  const normalizedGroups = extraGroups
    .map((group) => {
      const id = sanitizeCategoryId(group?.id || group?.title?.nl || group?.title);
      if (!id) return null;
      const titleNl = sanitizeMenuText(group?.title?.nl || group?.title || id, 80);
      const titleEn = sanitizeMenuText(group?.title?.en || titleNl, 80);
      const titleFr = sanitizeMenuText(group?.title?.fr || titleNl, 80);
      const options = Array.isArray(group?.options)
        ? group.options
            .map((option) => {
              const optionId = sanitizeCategoryId(option?.id || option?.label?.nl || option?.label);
              if (!optionId) return null;
              const labelNl = sanitizeMenuText(option?.label?.nl || option?.label || optionId, 80);
              const labelEn = sanitizeMenuText(option?.label?.en || labelNl, 80);
              const labelFr = sanitizeMenuText(option?.label?.fr || labelNl, 80);
              const available = option?.available !== false;
              return {
                id: optionId,
                label: { nl: labelNl, en: labelEn, fr: labelFr },
                price: parseMoneyNumber(option?.price),
                available
              };
            })
            .filter(Boolean)
        : [];

      if (!options.length) return null;
      return {
        id,
        title: { nl: titleNl, en: titleEn, fr: titleFr },
        options
      };
    })
    .filter(Boolean);

  if (!normalizedSizes.length || !normalizedGroups.length) {
    throw new Error("Order options bevatten geen geldige rijen.");
  }

  return {
    sizes: normalizedSizes,
    extraGroups: normalizedGroups
  };
}

async function autoTranslateOrderOptionsData(data) {
  if (!OPENAI_API_KEY) return data;

  const sizes = Array.isArray(data.sizes) ? data.sizes : [];
  const groups = Array.isArray(data.extraGroups) ? data.extraGroups : [];

  const translatedSizeLabels = await autoTranslateLocalizedEntries(
    sizes.map((size) => size.label),
    "size-label"
  );

  const translatedGroupTitles = await autoTranslateLocalizedEntries(
    groups.map((group) => group.title),
    "extra-group-title"
  );

  const groupOptionLabelSets = await Promise.all(
    groups.map((group) => autoTranslateLocalizedEntries(group.options.map((option) => option.label), `extra-option-label:${group.id}`))
  );

  return {
    sizes: sizes.map((size, index) => ({
      ...size,
      label: translatedSizeLabels[index]
    })),
    extraGroups: groups.map((group, groupIndex) => ({
      ...group,
      title: translatedGroupTitles[groupIndex],
      options: group.options.map((option, optionIndex) => ({
        ...option,
        label: groupOptionLabelSets[groupIndex][optionIndex]
      }))
    }))
  };
}

function buildSizesFromCsv(csvText) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    throw new Error("Sizes CSV bevat geen rijen.");
  }
  const headerMap = getHeaderMap(rows[0]);
  const indexMap = {
    ...requireHeaders(headerMap, ["id", "label_nl", "delta"]),
    label_en: headerMap.get("label_en"),
    label_fr: headerMap.get("label_fr"),
    available: headerMap.get("available")
  };

  return rows.slice(1).map((row) => ({
    id: sanitizeCategoryId(row[indexMap.id]),
    label: {
      nl: sanitizeMenuText(row[indexMap.label_nl], 60),
      en: sanitizeMenuText(parseOptionalCell(row, indexMap, "label_en", row[indexMap.label_nl]), 60),
      fr: sanitizeMenuText(parseOptionalCell(row, indexMap, "label_fr", row[indexMap.label_nl]), 60)
    },
    delta: parseMoneyNumber(row[indexMap.delta]),
    available: parseAvailabilityFlag(parseOptionalCell(row, indexMap, "available", "yes"))
  }));
}

function buildExtraGroupsFromCsv(csvText) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    throw new Error("Extras CSV bevat geen rijen.");
  }
  const headerMap = getHeaderMap(rows[0]);
  const indexMap = {
    ...requireHeaders(headerMap, ["group_id", "group_label_nl", "id", "label_nl", "price"]),
    group_label_en: headerMap.get("group_label_en"),
    group_label_fr: headerMap.get("group_label_fr"),
    label_en: headerMap.get("label_en"),
    label_fr: headerMap.get("label_fr"),
    available: headerMap.get("available")
  };

  const groups = new Map();
  rows.slice(1).forEach((row) => {
    const groupId = sanitizeCategoryId(row[indexMap.group_id]);
    const optionId = sanitizeCategoryId(row[indexMap.id]);
    if (!groupId || !optionId) return;

    if (!groups.has(groupId)) {
      groups.set(groupId, {
        id: groupId,
        title: {
          nl: sanitizeMenuText(row[indexMap.group_label_nl], 80),
          en: sanitizeMenuText(parseOptionalCell(row, indexMap, "group_label_en", row[indexMap.group_label_nl]), 80),
          fr: sanitizeMenuText(parseOptionalCell(row, indexMap, "group_label_fr", row[indexMap.group_label_nl]), 80)
        },
        options: []
      });
    }

    groups.get(groupId).options.push({
      id: optionId,
      label: {
        nl: sanitizeMenuText(row[indexMap.label_nl], 80),
        en: sanitizeMenuText(parseOptionalCell(row, indexMap, "label_en", row[indexMap.label_nl]), 80),
        fr: sanitizeMenuText(parseOptionalCell(row, indexMap, "label_fr", row[indexMap.label_nl]), 80)
      },
      price: parseMoneyNumber(row[indexMap.price]),
      available: parseAvailabilityFlag(parseOptionalCell(row, indexMap, "available", "yes"))
    });
  });

  return Array.from(groups.values());
}

function getHostHeader(req) {
  return String(req.headers.host || "").trim().toLowerCase();
}

function getHostName(hostValue) {
  return String(hostValue || "").split(":")[0].trim().toLowerCase();
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

function getRequestBaseUrl(req) {
  const host = getHostHeader(req) || "localhost:3000";
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
  const proto = forwardedProto || (req.socket.encrypted ? "https" : "http");
  return `${proto}://${host}`;
}

function appendAuditLog(eventType, req, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    eventType: sanitizeOrderInput(eventType, 80),
    ip: sanitizeOrderInput(getClientIp(req), 80),
    host: sanitizeOrderInput(getHostHeader(req), 120),
    path: sanitizeOrderInput((req.url || "").split("?")[0], 160),
    userAgent: sanitizeOrderInput(req.headers["user-agent"] || "", 200),
    details
  };

  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG_PATH), { recursive: true });
    fs.appendFileSync(AUDIT_LOG_PATH, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (error) {
    console.error("Audit log write failed:", error.message);
  }
}

function applySecurityHeaders(req, res) {
  const host = getHostHeader(req) || "localhost";
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https://www.google.com https://maps.gstatic.com https://*.googleapis.com",
    "connect-src 'self'",
    "frame-src https://www.google.com https://maps.google.com https://www.google.be",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join("; ");

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Origin-Agent-Cluster", "?1");
  if (NODE_ENV !== "production") {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  res.setHeader("Content-Security-Policy", csp);

  const hostName = getHostName(host);
  if (hostName === "localhost" || hostName === "127.0.0.1" || hostName === "::1") return;
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
}

function sendJson(req, res, statusCode, payload) {
  applySecurityHeaders(req, res);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function secureCompare(valueA, valueB) {
  const a = Buffer.from(String(valueA || ""), "utf8");
  const b = Buffer.from(String(valueB || ""), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function isTrustedOrigin(req) {
  const origin = String(req.headers.origin || "").trim();
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const originHost = `${originUrl.hostname}${originUrl.port ? `:${originUrl.port}` : ""}`.toLowerCase();
    return originHost === getHostHeader(req);
  } catch (error) {
    return false;
  }
}

function requireTrustedOrigin(req, res, eventName) {
  if (isTrustedOrigin(req)) return true;
  appendAuditLog(eventName, req, { origin: sanitizeOrderInput(req.headers.origin || "", 160) });
  sendJson(req, res, 403, { error: "Forbidden origin" });
  return false;
}

function getRateLimitKey(req, scope) {
  return `${scope}:${getClientIp(req)}`;
}

function isRateLimited(req, scope, maxAttempts, windowMs) {
  const now = Date.now();
  const key = getRateLimitKey(req, scope);
  const entry = RATE_LIMITS.get(key);
  if (!entry || now > entry.expiresAt) {
    RATE_LIMITS.set(key, { count: 1, expiresAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  RATE_LIMITS.set(key, entry);
  return entry.count > maxAttempts;
}

function isValidMenuData(data) {
  return Boolean(data && Array.isArray(data.categories) && Array.isArray(data.items));
}

function normalizeMenuData(data) {
  if (!isValidMenuData(data)) {
    throw new Error("Invalid menu data format");
  }

  if (data.categories.length > MAX_MENU_CATEGORIES || data.items.length > MAX_MENU_ITEMS) {
    throw new Error("Menu data exceeds allowed limits");
  }

  const categoryIds = new Set();
  const categories = data.categories
    .map((category) => {
      const id = sanitizeCategoryId(category?.id);
      if (!id) return null;

      const labelNl = sanitizeMenuText(category?.label?.nl || category?.label || id, 60);
      const labelEn = sanitizeMenuText(category?.label?.en || labelNl, 60);
      const labelFr = sanitizeMenuText(category?.label?.fr || labelNl, 60);
      if (!labelNl || !labelEn || !labelFr) return null;
      if (categoryIds.has(id)) return null;

      categoryIds.add(id);
      return {
        id,
        label: {
          nl: labelNl,
          en: labelEn,
          fr: labelFr
        }
      };
    })
    .filter(Boolean);

  if (!categories.length) {
    throw new Error("No valid menu categories");
  }

  const items = data.items
    .map((item) => {
      const category = sanitizeCategoryId(item?.category);
      if (!category || !categoryIds.has(category)) return null;

      const nameNl = sanitizeMenuText(item?.name?.nl || item?.name, 80);
      const nameEn = sanitizeMenuText(item?.name?.en || nameNl, 80);
      const nameFr = sanitizeMenuText(item?.name?.fr || nameNl, 80);
      if (!nameNl || !nameEn || !nameFr) return null;

      const descriptionNl = sanitizeMenuText(item?.description?.nl || item?.description || "Vers bereid.", 220);
      const descriptionEn = sanitizeMenuText(item?.description?.en || descriptionNl, 220);
      const descriptionFr = sanitizeMenuText(item?.description?.fr || descriptionNl, 220);
      const rawStatus = item?.status;
      const rawStatusNl = rawStatus && typeof rawStatus === "object" ? rawStatus.nl : rawStatus;
      const rawStatusEn = rawStatus && typeof rawStatus === "object" ? rawStatus.en : "";
      const rawStatusFr = rawStatus && typeof rawStatus === "object" ? rawStatus.fr : "";
      const statusNl = sanitizeMenuText(rawStatusNl || "", 60);
      const statusEn = sanitizeMenuText(rawStatusEn || statusNl, 60);
      const statusFr = sanitizeMenuText(rawStatusFr || statusNl, 60);
      const available = item?.available !== false;

      const rawPrice = sanitizeMenuText(item?.price || "", 20).replace(/\s+/g, " ");
      const priceMatch = rawPrice.match(/(\d{1,3}(?:[.,]\d{2})?)/);
      if (!priceMatch) return null;

      return {
        category,
        name: { nl: nameNl, en: nameEn, fr: nameFr },
        description: { nl: descriptionNl, en: descriptionEn, fr: descriptionFr },
        price: `EUR ${priceMatch[1].replace(".", ",")}`,
        status: { nl: statusNl, en: statusEn, fr: statusFr },
        available
      };
    })
    .filter(Boolean);

  return { categories, items };
}

function readLocalMenuData() {
  const raw = fs.readFileSync(MENU_DATA_PATH, "utf8");
  return normalizeMenuData(JSON.parse(raw));
}

function writeLocalMenuData(data) {
  fs.mkdirSync(path.dirname(MENU_DATA_PATH), { recursive: true });
  fs.writeFileSync(MENU_DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalizeGoogleSheetsCsvUrl(rawUrl) {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return "";

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (error) {
    throw new Error("GOOGLE_SHEETS_CSV_URL is geen geldige URL.");
  }

  if (!/docs\.google\.com$/i.test(parsed.hostname)) {
    return parsed.toString();
  }

  const pathMatch = parsed.pathname.match(/\/spreadsheets\/d\/([^/]+)/i);
  if (!pathMatch) {
    return parsed.toString();
  }

  const spreadsheetId = pathMatch[1];
  const gidFromHash = (parsed.hash.match(/gid=(\d+)/i) || [])[1];
  const gid = parsed.searchParams.get("gid") || gidFromHash || "0";
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${encodeURIComponent(gid)}`;
}

function fetchRemoteText(urlValue, redirectCount = 0) {
  const targetUrl = normalizeGoogleSheetsCsvUrl(urlValue);
  const client = targetUrl.startsWith("https://") ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.get(
      targetUrl,
      {
        headers: {
          "User-Agent": "vanis-place-menu-sync"
        },
        timeout: REMOTE_MENU_FETCH_TIMEOUT_MS
      },
      (response) => {
        const statusCode = Number(response.statusCode) || 0;
        if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
          if (redirectCount >= 3) {
            response.resume();
            reject(new Error("Te veel redirects bij Google Sheets request."));
            return;
          }
          const redirectUrl = new URL(response.headers.location, targetUrl).toString();
          response.resume();
          fetchRemoteText(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
          return;
        }
        if (statusCode < 200 || statusCode >= 300) {
          response.resume();
          reject(new Error(`Google Sheets gaf status ${statusCode}`));
          return;
        }

        const chunks = [];
        let totalBytes = 0;
        response.on("data", (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes > REMOTE_MENU_FETCH_LIMIT_BYTES) {
            request.destroy(new Error("Google Sheets CSV is te groot."));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("Google Sheets request timeout."));
    });
    request.on("error", reject);
  });
}

async function refreshMenuFromGoogleSheets(force = false) {
  if (!GOOGLE_SHEETS_CSV_URL) {
    return null;
  }

  const now = Date.now();
  const cacheIsFresh = !force && MENU_CACHE.data && now - MENU_CACHE.fetchedAt < GOOGLE_SHEETS_REFRESH_MS;
  if (cacheIsFresh) {
    return MENU_CACHE.data;
  }

  if (MENU_CACHE.inFlight) {
    return MENU_CACHE.inFlight;
  }

  MENU_CACHE.inFlight = fetchRemoteText(GOOGLE_SHEETS_CSV_URL)
    .then(async (csvText) => {
      const data = await autoTranslateMenuData(buildMenuDataFromCsv(csvText));
      MENU_CACHE.data = data;
      MENU_CACHE.source = "google_sheets";
      MENU_CACHE.fetchedAt = Date.now();
      MENU_CACHE.lastSuccessAt = MENU_CACHE.fetchedAt;
      MENU_CACHE.lastError = "";
      writeLocalMenuData(data);
      return data;
    })
    .catch((error) => {
      MENU_CACHE.lastError = sanitizeOrderInput(error.message, 180);
      throw error;
    })
    .finally(() => {
      MENU_CACHE.inFlight = null;
    });

  return MENU_CACHE.inFlight;
}

async function readMenuData() {
  if (!GOOGLE_SHEETS_CSV_URL) {
    return autoTranslateMenuData(readLocalMenuData());
  }

  try {
    return await refreshMenuFromGoogleSheets();
  } catch (error) {
    return autoTranslateMenuData(readLocalMenuData());
  }
}

async function readOrderOptions() {
  const useGoogleSheets = GOOGLE_SHEETS_SIZES_URL && GOOGLE_SHEETS_EXTRAS_URL;
  if (!useGoogleSheets) {
    return autoTranslateOrderOptionsData(normalizeOrderOptionsData(DEFAULT_ORDER_OPTIONS));
  }

  const now = Date.now();
  const cacheIsFresh = ORDER_OPTIONS_CACHE.data && now - ORDER_OPTIONS_CACHE.fetchedAt < GOOGLE_SHEETS_REFRESH_MS;
  if (cacheIsFresh) {
    return ORDER_OPTIONS_CACHE.data;
  }

  if (ORDER_OPTIONS_CACHE.inFlight) {
    return ORDER_OPTIONS_CACHE.inFlight;
  }

  ORDER_OPTIONS_CACHE.inFlight = Promise.all([
    fetchRemoteText(GOOGLE_SHEETS_SIZES_URL),
    fetchRemoteText(GOOGLE_SHEETS_EXTRAS_URL)
  ])
    .then(async ([sizesCsv, extrasCsv]) => {
      const data = await autoTranslateOrderOptionsData(normalizeOrderOptionsData({
        sizes: buildSizesFromCsv(sizesCsv),
        extraGroups: buildExtraGroupsFromCsv(extrasCsv)
      }));
      ORDER_OPTIONS_CACHE.data = data;
      ORDER_OPTIONS_CACHE.source = "google_sheets";
      ORDER_OPTIONS_CACHE.fetchedAt = Date.now();
      ORDER_OPTIONS_CACHE.lastSuccessAt = ORDER_OPTIONS_CACHE.fetchedAt;
      ORDER_OPTIONS_CACHE.lastError = "";
      return data;
    })
    .catch((error) => {
      ORDER_OPTIONS_CACHE.lastError = sanitizeOrderInput(error.message, 180);
      ORDER_OPTIONS_CACHE.source = "default";
      ORDER_OPTIONS_CACHE.data = normalizeOrderOptionsData(DEFAULT_ORDER_OPTIONS);
      ORDER_OPTIONS_CACHE.fetchedAt = Date.now();
      return ORDER_OPTIONS_CACHE.data;
    })
    .finally(() => {
      ORDER_OPTIONS_CACHE.inFlight = null;
    });

  return ORDER_OPTIONS_CACHE.inFlight;
}

function ensureOrdersDir() {
  fs.mkdirSync(ORDERS_DIR, { recursive: true });
}

function buildOrderFileName(orderId, isoDate) {
  const safeIso = String(isoDate || "").replaceAll(":", "-");
  return `${safeIso}__${orderId}.json`;
}

function writeOrderToDirectory(order) {
  ensureOrdersDir();
  const filePath = path.join(ORDERS_DIR, buildOrderFileName(order.id, order.createdAt));
  fs.writeFileSync(filePath, JSON.stringify(order, null, 2), "utf8");
}

function findOrderFilePathById(orderId) {
  ensureOrdersDir();
  const files = fs
    .readdirSync(ORDERS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => entry.name);

  const match = files.find((fileName) => fileName.includes(`__${orderId}.json`));
  return match ? path.join(ORDERS_DIR, match) : null;
}

function readOrderById(orderId) {
  const filePath = findOrderFilePathById(orderId);
  if (!filePath) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return { filePath, order: parsed };
  } catch (error) {
    return null;
  }
}

function parseDateTimeLocalValue(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute
  ) {
    return null;
  }

  return parsed;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function validatePickupTime(pickupTime) {
  const parsed = parseDateTimeLocalValue(pickupTime);
  if (!parsed) {
    return "Kies een geldige datum en tijd voor afhaling.";
  }

  const todayStart = startOfLocalDay(new Date());
  const pickupStart = startOfLocalDay(parsed);
  const dayDiff = Math.round((pickupStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
  if (dayDiff < 0) {
    return "Kies een ophaaltijd in de toekomst.";
  }

  if (dayDiff > PICKUP_MAX_DAYS_AHEAD) {
    return `Kies een ophaaldag binnen ${PICKUP_MAX_DAYS_AHEAD + 1} dagen.`;
  }

  const now = new Date();
  const minimum = new Date(now.getTime() + PICKUP_MIN_LEAD_MINUTES * 60 * 1000);
  if (parsed.getTime() < minimum.getTime()) {
    return `Kies een ophaaltijd minstens ${PICKUP_MIN_LEAD_MINUTES} minuten in de toekomst.`;
  }

  const schedule = OPENING_HOURS_BY_DAY[parsed.getDay()];
  if (!schedule) {
    return "Op zondag zijn we gesloten. Kies een andere dag.";
  }

  const minutesInDay = parsed.getHours() * 60 + parsed.getMinutes();
  if (minutesInDay < schedule.openMinutes || minutesInDay > schedule.closeMinutes) {
    return "Kies een ophaaltijd binnen de openingsuren.";
  }

  return "";
}

function normalizeOrderPayload(payload) {
  const customerName = sanitizeOrderInput(payload?.customer?.name);
  const customerPhone = sanitizeOrderInput(payload?.customer?.phone);
  const customerEmail = sanitizeOrderInput(payload?.customer?.email);
  const pickupTime = sanitizeOrderInput(payload?.pickupTime);
  const notes = sanitizeOrderInput(payload?.notes);
  const items = Array.isArray(payload?.items) ? payload.items : null;

  if (!items || !items.length) return null;
  if (items.length > MAX_ITEMS_PER_ORDER) return null;

  const normalizedItems = items
    .map((item) => {
      const quantityRaw = Number(item?.quantity) || 1;
      const quantity = Math.max(1, Math.min(quantityRaw, 100));
      const nameValue = item?.name;
      const hasNameObject = nameValue && typeof nameValue === "object";

      const normalizedName = hasNameObject
        ? {
            nl: sanitizeOrderInput(nameValue.nl),
            en: sanitizeOrderInput(nameValue.en),
            fr: sanitizeOrderInput(nameValue.fr)
          }
        : sanitizeOrderInput(nameValue);

      const hasValidName = hasNameObject
        ? normalizedName.nl || normalizedName.en || normalizedName.fr
        : Boolean(normalizedName);

      if (!hasValidName) return null;

      return {
        category: sanitizeOrderInput(item?.category, 60),
        name: normalizedName,
        price: sanitizeOrderInput(item?.price, 20),
        quantity,
        changeRequest: sanitizeOrderInput(item?.changeRequest)
      };
    })
    .filter(Boolean);

  if (!normalizedItems.length || !customerName || !customerPhone || !pickupTime) {
    return null;
  }

  const pickupError = validatePickupTime(pickupTime);
  if (pickupError) {
    return { error: pickupError };
  }

  return {
    customer: {
      name: customerName,
      phone: customerPhone,
      email: customerEmail
    },
    pickupTime,
    notes,
    items: normalizedItems
  };
}

function parsePriceToCents(value) {
  const normalized = String(value || "").replace(",", ".");
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * 100);
}

function getOrderItemName(item) {
  if (!item) return "Broodje";
  if (item.name && typeof item.name === "object") {
    return item.name.nl || item.name.en || item.name.fr || "Broodje";
  }
  return String(item.name || "Broodje");
}

function buildOrderTotals(items) {
  const subtotalCents = items.reduce((sum, item) => sum + parsePriceToCents(item.price) * (Number(item.quantity) || 0), 0);
  return {
    subtotalCents,
    subtotalDisplay: `${PAYMENT_CURRENCY} ${(subtotalCents / 100).toFixed(2).replace(".", ",")}`,
    currency: PAYMENT_CURRENCY
  };
}

function createBaseOrder(validOrder, paymentMethod) {
  const orderId = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const paymentStatus = paymentMethod === "online" ? "paid" : "unpaid";
  const publicStatusToken = paymentMethod === "online" ? crypto.randomBytes(16).toString("hex") : "";

  return {
    id: orderId,
    createdAt: new Date().toISOString(),
    ...validOrder,
    totals: buildOrderTotals(validOrder.items),
    payment: {
      method: paymentMethod,
      status: paymentStatus,
      currency: PAYMENT_CURRENCY,
      provider: PAYMENT_MODE,
      publicStatusToken,
      paidAt: paymentMethod === "online" ? new Date().toISOString() : ""
    }
  };
}

function collectRequestBody(req, callback) {
  let body = "";
  let tooLarge = false;

  req.on("data", (chunk) => {
    if (tooLarge) return;
    body += chunk;
    if (body.length > REQUEST_BODY_LIMIT) {
      tooLarge = true;
      body = "";
    }
  });

  req.on("end", () => callback({ tooLarge, body }));
}

function parseQueryParams(req) {
  const urlValue = String(req.url || "");
  const queryString = urlValue.includes("?") ? urlValue.slice(urlValue.indexOf("?") + 1) : "";
  return new URLSearchParams(queryString);
}

function readJsonBody(req, res, errorEventName, callback) {
  collectRequestBody(req, ({ tooLarge, body }) => {
    if (tooLarge) {
      appendAuditLog(errorEventName, req, { reason: "payload-too-large" });
      sendJson(req, res, 413, { error: "Payload te groot." });
      return;
    }

    try {
      const parsed = body ? JSON.parse(body) : {};
      callback(parsed);
    } catch (error) {
      appendAuditLog(errorEventName, req, { reason: "invalid-json" });
      sendJson(req, res, 400, { error: "Ongeldige JSON." });
    }
  });
}

function createMockCheckoutUrl(req, order) {
  const base = getRequestBaseUrl(req);
  const url = new URL("/order.html", base);
  url.searchParams.set("payment", "success");
  url.searchParams.set("orderId", order.id);
  url.searchParams.set("token", order.payment.publicStatusToken);
  return url.toString();
}

function handleApi(req, res) {
  const requestPath = String(req.url || "").split("?")[0];

  if (requestPath === "/api/menu-data" && req.method === "GET") {
    readMenuData()
      .then((data) => {
        sendJson(req, res, 200, data);
      })
      .catch((error) => {
        appendAuditLog("menu-read-failed", req, { reason: sanitizeOrderInput(error.message, 160) });
        sendJson(req, res, 500, { error: "Menu kon niet geladen worden." });
      });
    return true;
  }

  if (requestPath === "/api/menu-source" && req.method === "GET") {
    sendJson(req, res, 200, {
      configured: Boolean(GOOGLE_SHEETS_CSV_URL),
      source: MENU_CACHE.source,
      refreshMs: GOOGLE_SHEETS_REFRESH_MS,
      lastSuccessAt: MENU_CACHE.lastSuccessAt ? new Date(MENU_CACHE.lastSuccessAt).toISOString() : "",
      lastError: MENU_CACHE.lastError || ""
    });
    return true;
  }

  if (requestPath === "/api/order-options" && req.method === "GET") {
    readOrderOptions()
      .then((data) => {
        sendJson(req, res, 200, data);
      })
      .catch((error) => {
        appendAuditLog("order-options-read-failed", req, { reason: sanitizeOrderInput(error.message, 160) });
        sendJson(req, res, 500, { error: "Order opties konden niet geladen worden." });
      });
    return true;
  }

  if (requestPath === "/api/order-options-source" && req.method === "GET") {
    sendJson(req, res, 200, {
      configured: Boolean(GOOGLE_SHEETS_SIZES_URL && GOOGLE_SHEETS_EXTRAS_URL),
      source: ORDER_OPTIONS_CACHE.source,
      refreshMs: GOOGLE_SHEETS_REFRESH_MS,
      lastSuccessAt: ORDER_OPTIONS_CACHE.lastSuccessAt ? new Date(ORDER_OPTIONS_CACHE.lastSuccessAt).toISOString() : "",
      lastError: ORDER_OPTIONS_CACHE.lastError || ""
    });
    return true;
  }

  if (requestPath === "/api/public/orders/status" && req.method === "GET") {
    if (isRateLimited(req, "order-status", STATUS_MAX_ATTEMPTS, STATUS_WINDOW_MS)) {
      appendAuditLog("order-status-rate-limited", req);
      sendJson(req, res, 429, { error: "Te veel aanvragen." });
      return true;
    }

    const params = parseQueryParams(req);
    const orderId = sanitizeOrderInput(params.get("orderId"), 80);
    const token = sanitizeOrderInput(params.get("token"), 80);
    if (!orderId || !token) {
      sendJson(req, res, 400, { error: "OrderId en token zijn verplicht." });
      return true;
    }

    const found = readOrderById(orderId);
    if (!found || !found.order || !found.order.payment) {
      sendJson(req, res, 404, { error: "Bestelling niet gevonden." });
      return true;
    }

    const expected = sanitizeOrderInput(found.order.payment.publicStatusToken, 80);
    if (!expected || !secureCompare(expected, token)) {
      appendAuditLog("order-status-token-mismatch", req, { orderId });
      sendJson(req, res, 403, { error: "Ongeldige status token." });
      return true;
    }

    sendJson(req, res, 200, {
      orderId: found.order.id,
      paymentMethod: found.order.payment.method,
      paymentStatus: found.order.payment.status,
      pickupTime: found.order.pickupTime
    });
    return true;
  }

  if (requestPath === "/api/public/bestellingen" && req.method === "POST") {
    if (!requireTrustedOrigin(req, res, "order-create-forbidden-origin")) return true;
    if (isRateLimited(req, "order-create", ORDER_MAX_ATTEMPTS, ORDER_WINDOW_MS)) {
      appendAuditLog("order-create-rate-limited", req);
      sendJson(req, res, 429, { error: "Te veel bestellingen. Probeer zo opnieuw." });
      return true;
    }

    readJsonBody(req, res, "order-create-invalid-payload", (payload) => {
      const validOrder = normalizeOrderPayload(payload);
      if (!validOrder) {
        sendJson(req, res, 400, { error: "Bestelling is onvolledig of ongeldig." });
        return;
      }
      if (validOrder.error) {
        sendJson(req, res, 400, { error: validOrder.error });
        return;
      }

      const order = createBaseOrder(validOrder, "cash");
      writeOrderToDirectory(order);
      appendAuditLog("order-created", req, {
        orderId: order.id,
        paymentMethod: "cash",
        total: order.totals.subtotalDisplay
      });

      sendJson(req, res, 201, {
        success: true,
        orderId: order.id,
        paymentStatus: order.payment.status
      });
    });
    return true;
  }

  if (requestPath === "/api/public/checkout" && req.method === "POST") {
    if (!requireTrustedOrigin(req, res, "checkout-forbidden-origin")) return true;
    if (isRateLimited(req, "checkout-create", ORDER_MAX_ATTEMPTS, ORDER_WINDOW_MS)) {
      appendAuditLog("checkout-rate-limited", req);
      sendJson(req, res, 429, { error: "Te veel checkout-aanvragen. Probeer zo opnieuw." });
      return true;
    }

    readJsonBody(req, res, "checkout-invalid-payload", (payload) => {
      const validOrder = normalizeOrderPayload(payload);
      if (!validOrder) {
        sendJson(req, res, 400, { error: "Bestelling is onvolledig of ongeldig." });
        return;
      }
      if (validOrder.error) {
        sendJson(req, res, 400, { error: validOrder.error });
        return;
      }

      const order = createBaseOrder(validOrder, "online");
      order.payment.checkoutUrl = createMockCheckoutUrl(req, order);
      writeOrderToDirectory(order);
      appendAuditLog("checkout-created", req, {
        orderId: order.id,
        paymentMethod: "online",
        total: order.totals.subtotalDisplay
      });

      sendJson(req, res, 200, {
        checkoutUrl: order.payment.checkoutUrl,
        orderId: order.id
      });
    });
    return true;
  }

  return false;
}

function resolveStaticPath(baseDir, requestPath) {
  const relativeRequestPath = String(requestPath || "").startsWith("/") ? `.${requestPath}` : requestPath;
  const resolvedPath = path.resolve(baseDir, relativeRequestPath);
  const relativePath = path.relative(baseDir, resolvedPath);

  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) return null;
  if (!fs.existsSync(resolvedPath)) return null;
  return resolvedPath;
}

function serveStaticFile(req, res) {
  const fullUrl = String(req.url || "/");
  const rawPath = fullUrl.split("?")[0];
  let requestPath;

  try {
    requestPath = decodeURIComponent(rawPath || "/");
  } catch (error) {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }

  if (requestPath === "/" || requestPath === "/index.html") {
    requestPath = "/home.html";
  }

  const lowered = requestPath.toLowerCase();
  const adminRequest =
    lowered === "/admin" ||
    lowered === "/admin/" ||
    lowered.startsWith("/admin-") ||
    lowered.startsWith("/admin/") ||
    lowered === "/index";

  if (adminRequest) {
    res.writeHead(302, { Location: "/home.html" });
    res.end();
    return;
  }

  const blocked =
    lowered.includes("..") ||
    lowered.startsWith("/.") ||
    lowered.startsWith("/data") ||
    lowered.startsWith("/read me") ||
    lowered.startsWith("/scripts") ||
    lowered.endsWith(".md") ||
    lowered.endsWith(".env") ||
    lowered.endsWith(".log") ||
    lowered === "/server.js" ||
    lowered === "/package.json" ||
    lowered === "/package-lock.json" ||
    lowered === "/menu new import" ||
    lowered.startsWith("/menu-import");

  if (blocked) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  let filePath = resolveStaticPath(PUBLIC_DIR, requestPath);
  if (!filePath && !path.extname(requestPath)) {
    filePath = resolveStaticPath(PUBLIC_DIR, `${requestPath}.html`);
  }

  if (!filePath) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext];
  if (!contentType) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  fs.readFile(filePath, (error, fileBuffer) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    applySecurityHeaders(req, res);
    if (ext === ".html") {
      res.setHeader("Cache-Control", "no-store");
    } else {
      res.setHeader("Cache-Control", "public, max-age=86400");
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(fileBuffer);
  });
}

const server = http.createServer((req, res) => {
  if (handleApi(req, res)) return;
  serveStaticFile(req, res);
});

server.listen(PORT, () => {
  console.log(`Public-only mode active. Payment mode: ${PAYMENT_MODE}`);
  console.log(`Server running on http://localhost:${PORT}`);

  if (RAW_PAYMENT_MODE && RAW_PAYMENT_MODE !== "mock") {
    console.warn(`Unsupported PAYMENT_MODE "${RAW_PAYMENT_MODE}" detected. Falling back to mock checkout.`);
  }

  if (NODE_ENV === "production") {
    console.log("Security headers enabled for production traffic.");
  }

  if (GOOGLE_SHEETS_CSV_URL) {
    console.log(`Google Sheets menu sync enabled. Refresh window: ${GOOGLE_SHEETS_REFRESH_MS} ms`);
    refreshMenuFromGoogleSheets(true).catch((error) => {
      console.warn(`Google Sheets sync failed at startup: ${error.message}`);
    });
  } else {
    console.log("Google Sheets menu sync disabled. Using local menu-data.json");
  }

  if (GOOGLE_SHEETS_SIZES_URL && GOOGLE_SHEETS_EXTRAS_URL) {
    console.log("Google Sheets order options sync enabled.");
    readOrderOptions().catch((error) => {
      console.warn(`Google Sheets order options sync failed at startup: ${error.message}`);
    });
  } else {
    console.log("Google Sheets order options sync disabled. Using default sizes and extras.");
  }
});
