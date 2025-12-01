const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const filePath = path.join(__dirname, "..", "data", "accessories.json");

function loadJsonFromFile(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadPreviousVersion() {
  try {
    const output = execSync("git show HEAD~1:data/accessories.json", {
      cwd: path.join(__dirname, ".."),
      encoding: "utf8",
    });
    return JSON.parse(output);
  } catch (err) {
    console.error("Önceki versiyon okunamadı (git show HEAD~1).", err.message);
    process.exit(1);
  }
}

function buildOldPriceMap(oldJson) {
  const map = new Map();
  const accessories = oldJson.accessories || {};

  for (const [category, items] of Object.entries(accessories)) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const key = `${category}|${item.stock_code || ""}|${item.description || ""}`;
      if (typeof item.price === "string") {
        map.set(key, item.price);
      }
    }
  }

  return map;
}

function restorePrices(currentJson, oldPriceMap) {
  const accessories = currentJson.accessories || {};

  for (const [category, items] of Object.entries(accessories)) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      if (item.price === "0") {
        const key = `${category}|${item.stock_code || ""}|${item.description || ""}`;
        const oldPrice = oldPriceMap.get(key);
        if (oldPrice && oldPrice !== "0") {
          item.price = oldPrice;
        }
      }
    }
  }

  return currentJson;
}

function main() {
  try {
    const current = loadJsonFromFile(filePath);
    const previous = loadPreviousVersion();
    const oldPriceMap = buildOldPriceMap(previous);

    const updated = restorePrices(current, oldPriceMap);

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + "\n", "utf8");
    console.log("accessories.json içindeki hatalı '0' fiyatlar önceki değerlere geri alındı.");
  } catch (err) {
    console.error("İşlem sırasında hata oluştu:", err);
    process.exit(1);
  }
}

main();


