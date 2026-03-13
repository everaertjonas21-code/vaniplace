const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT_DIR = path.resolve(__dirname, "..");

const REQUIRED_FILES = [
  "server.js",
  "package.json",
  ".env.example",
  "Public/home.html",
  "Public/menu.html",
  "Public/menu-data.js",
  "Public/order.html",
  "Public/order.js",
  "Public/algemene-voorwaarden.html",
  "Public/privacybeleid.html",
  "Public/cookiebeleid.html",
  "Public/legal.js",
  "data/menu-data.json",
  "scripts/export-menu-csv.js",
  "scripts/import-menu-csv.js",
  "scripts/sync-menu-public.js"
];

const REQUIRED_ENV_KEYS = [
  "PORT",
  "NODE_ENV",
  "PAYMENT_MODE",
  "PAYMENT_CURRENCY"
];

function logOk(message) {
  console.log(`[OK] ${message}`);
}

function logWarn(message) {
  console.warn(`[WARN] ${message}`);
}

function logFail(message) {
  console.error(`[FAIL] ${message}`);
}

function getJsFilesRecursive(dirPath, results = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      getJsFilesRecursive(fullPath, results);
      continue;
    }
    if (entry.isFile() && fullPath.endsWith(".js")) {
      results.push(fullPath);
    }
  }
  return results;
}

function parseEnvExample(envExamplePath) {
  if (!fs.existsSync(envExamplePath)) return [];
  const raw = fs.readFileSync(envExamplePath, "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => line.split("=")[0].trim())
    .filter(Boolean);
}

function runSyntaxCheck(jsFilePath) {
  const source = fs.readFileSync(jsFilePath, "utf8");
  new vm.Script(source, { filename: jsFilePath });
}

let failed = false;

console.log("Running project health check...");

for (const relativePath of REQUIRED_FILES) {
  const absolutePath = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failed = true;
    logFail(`Missing required file: ${relativePath}`);
  } else {
    logOk(`Found: ${relativePath}`);
  }
}

const envExampleKeys = parseEnvExample(path.join(ROOT_DIR, ".env.example"));
for (const key of REQUIRED_ENV_KEYS) {
  if (!envExampleKeys.includes(key)) {
    failed = true;
    logFail(`Missing key in .env.example: ${key}`);
  } else {
    logOk(`.env.example key present: ${key}`);
  }
}

const jsFiles = getJsFilesRecursive(ROOT_DIR).sort();
if (!jsFiles.length) {
  failed = true;
  logFail("No JS files found.");
} else {
  logOk(`Checking syntax for ${jsFiles.length} JS files...`);
}

for (const filePath of jsFiles) {
  const relative = path.relative(ROOT_DIR, filePath);
  try {
    runSyntaxCheck(filePath);
  } catch (error) {
    failed = true;
    logFail(`Syntax error in ${relative}`);
    console.error(String(error && error.message ? error.message : error));
  }
}

const envPath = path.join(ROOT_DIR, ".env");
if (!fs.existsSync(envPath)) {
  logWarn(".env not found. Local run can still work if env vars are injected externally.");
} else {
  logOk(".env found.");
}

const legacyOrderFilePath = path.join(ROOT_DIR, "data", "bestellingen.json");
if (fs.existsSync(legacyOrderFilePath)) {
  logWarn("Legacy file data/bestellingen.json still exists but is no longer used.");
}

if (failed) {
  console.error("Health check finished with errors.");
  process.exit(1);
}

console.log("Health check passed.");
