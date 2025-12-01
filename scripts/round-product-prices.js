const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "data", "product-prices.json");

function roundPriceString(value) {
  if (typeof value !== "string") return value;
  const num = Number(value.replace(",", "."));
  if (Number.isNaN(num)) return value;
  return num.toFixed(2);
}

function traverseAndRoundPrices(node) {
  if (Array.isArray(node)) {
    return node.map(traverseAndRoundPrices);
  }
  if (node && typeof node === "object") {
    const result = {};
    for (const [key, val] of Object.entries(node)) {
      if (key === "price") {
        result[key] = roundPriceString(val);
      } else {
        result[key] = traverseAndRoundPrices(val);
      }
    }
    return result;
  }
  return node;
}

function main() {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(raw);

    const updated = traverseAndRoundPrices(json);

    const pretty = JSON.stringify(updated, null, 2);
    fs.writeFileSync(filePath, pretty + "\n", "utf8");

    console.log("product-prices.json fiyatları 2 haneye yuvarlandı.");
  } catch (err) {
    console.error("Hata:", err);
    process.exit(1);
  }
}

main();


