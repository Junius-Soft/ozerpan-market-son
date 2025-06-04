import fs from "fs";
import path from "path";

// Dosya yolu
const filePath = path.join(__dirname, "../data/accessories.json");

try {
  // Dosyayı oku
  let fileContent = fs.readFileSync(filePath, "utf8");

  // Noktalı fiyatları virgüllü formata çevir
  fileContent = fileContent.replace(
    /"price": "(\d+)\,(\d+)"/g,
    '"price": "$1.$2"'
  );

  // Dosyayı yaz
  fs.writeFileSync(filePath, fileContent);

  console.log("Fiyat formatları başarıyla dönüştürüldü!");
} catch (error) {
  console.error("Bir hata oluştu:", error);
}
