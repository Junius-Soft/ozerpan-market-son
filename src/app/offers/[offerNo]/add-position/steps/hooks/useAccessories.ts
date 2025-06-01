import { PanjurSelections } from "@/types/panjur";
import {
  getBoxHeight,
  getDikmeGenisligi,
  getLamelDusmeValue,
} from "@/utils/panjur";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Accessory {
  description: string;
  stock_code: string;
  uretici_kodu: string;
  type: string;
  color: string;
  unit: string;
  price: string;
  quantity?: number;
}

interface AccessoryResult {
  accessories: Accessory[];
  totalPrice: number;
}

export function useAccessories(selections: PanjurSelections): AccessoryResult {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const searchParams = useSearchParams();

  const sectionCount = searchParams.get("typeId");

  const dikmeCount = Number(sectionCount) * 2;

  useEffect(() => {
    const fetchAndCalculateAccessories = async () => {
      try {
        // Fetch accessories from API
        const response = await fetch(
          `/api/accessories?productId=${selections.productId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch accessories");
        }
        const data = await response.json();
        const allAccessories: Accessory[] = data;
        const neededAccessories: Accessory[] = [];
        if (allAccessories && selections.productId === "panjur") {
          // Kutu Aksesuarları hesaplama
          let yanKapakDesc: string;
          switch (selections.boxType) {
            case "137mm":
              yanKapakDesc = "137 yan kapak 45 pimli";
              break;
            case "165mm":
              yanKapakDesc = "165 yan kapak 45 pimli";
              break;
            case "205mm":
              yanKapakDesc = "205 yan kapak 45 pimli";
              break;
            case "250mm":
              yanKapakDesc = "250 yan kapak 45 motor";
              break;
            default:
              yanKapakDesc = "";
          }

          if (yanKapakDesc) {
            const yanKapak = allAccessories.find((acc) =>
              acc.description.toLowerCase().includes(yanKapakDesc.toLowerCase())
            );
            if (yanKapak) {
              const yanKapakAccessory = {
                ...yanKapak,
                quantity: 1, // Her kutu için bir takım
              };
              neededAccessories.push(yanKapakAccessory);
            }
          }

          // Tambur Profili ve Aksesuarları hesaplama
          const tamburType =
            selections.movementType === "manuel"
              ? "40mm Sekizgen Boru 0,40"
              : "60mm Sekizgen Boru 0,60";

          const tamburProfili = allAccessories.find((acc) =>
            acc.description.toLowerCase().includes(tamburType.toLowerCase())
          );

          if (tamburProfili) {
            const tamburAccessory = {
              ...tamburProfili,
              quantity: selections.width, // Genişlik kadar tambur profili gerekir
            };
            neededAccessories.push(tamburAccessory);

            if (selections.movementType === "motorlu") {
              // Boru Başı Rulmanlı
              const boruBasi = allAccessories.find((acc) =>
                acc.description
                  .toLowerCase()
                  .includes("60 boru başı rulmanlı siyah")
              );

              if (boruBasi) {
                neededAccessories.push({ ...boruBasi, quantity: 1 });
              }

              // Rulman 12x28
              const rulman = allAccessories.find((acc) =>
                acc.description.toLowerCase().includes("rulman 12x28")
              );

              if (rulman) {
                neededAccessories.push({ ...rulman, quantity: 1 });
              }

              // Plaket 100x100 12 mm Pimli Galvaniz - only for 250mm box

              if (selections.boxType === "250mm") {
                console.log("hehe");

                const plaket = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes("plaket 100x100 12 mm pimli galvaniz")
                );
                if (plaket) {
                  neededAccessories.push({ ...plaket, quantity: 1 });
                }
              }
            }

            if (selections.movementType === "manuel") {
              if (selections.manuelSekli === "makarali") {
                // Boru Başı Rulmanlı
                const boruBasi = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes("40 boru başı rulmanlı siyah")
                );
                if (boruBasi) {
                  neededAccessories.push({ ...boruBasi, quantity: 1 });
                }

                // Kasnak Rulmanlı
                const kasnakDesc =
                  selections.boxType === "137mm"
                    ? "40x125 kasnak rulmanlı siyah"
                    : "40x140 kasnak rulmanlı siyah";

                const kasnak = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes(kasnakDesc.toLowerCase())
                );
                if (kasnak) {
                  neededAccessories.push({ ...kasnak, quantity: 1 });
                }

                // Rulman 12x28 for Makaralı
                const rulmanMakarali = allAccessories.find((acc) =>
                  acc.description.toLowerCase().includes("rulman 12x28")
                );
                if (rulmanMakarali) {
                  neededAccessories.push({ ...rulmanMakarali, quantity: 2 });
                }

                // Winde Otomatik Makara
                const windeMakara = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes("winde otomatik makara")
                );
                if (windeMakara) {
                  neededAccessories.push({ ...windeMakara, quantity: 1 });
                }

                // Kordon Geçme Makarası
                const kordonMakara = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes("kordon geçme makarası 14 mm pvc")
                );
                if (kordonMakara) {
                  neededAccessories.push({ ...kordonMakara, quantity: 1 });
                }
              } else if (selections.manuelSekli === "reduktorlu") {
                // Boru Başı Rulmanlı
                const boruBasiReduktor = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes("40 boru başı rulmanlı siyah")
                );
                if (boruBasiReduktor) {
                  neededAccessories.push({ ...boruBasiReduktor, quantity: 1 });
                }

                // Rulman 12x28 for Redüktörlü
                const rulmanReduktor = allAccessories.find((acc) =>
                  acc.description.toLowerCase().includes("rulman 12x28")
                );
                if (rulmanReduktor) {
                  neededAccessories.push({ ...rulmanReduktor, quantity: 1 });
                }

                // Panjur Redüktörü Beyaz
                const reduktor = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes("panjur redüktörü beyaz")
                );
                if (reduktor) {
                  neededAccessories.push({ ...reduktor, quantity: 1 });
                }

                // Redüktör Boru Başı
                const reduktorBoruBasi = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes("redüktör boru başı 40 mm-C 371 uyumlu")
                );
                if (reduktorBoruBasi) {
                  neededAccessories.push({ ...reduktorBoruBasi, quantity: 1 });
                }

                // Panjur Redüktörü Ara Kol
                const araKol = allAccessories.find((acc) =>
                  acc.description.toLowerCase().includes("Ara kol-C 371 uyumlu")
                );
                if (araKol) {
                  neededAccessories.push({ ...araKol, quantity: 1 });
                }

                // Panjur Redüktörü Çevirme Kolu
                const cevirmeKol = allAccessories.find((acc) =>
                  acc.description.toLowerCase().includes("Çevirme kolu-1200 mm")
                );
                if (cevirmeKol) {
                  neededAccessories.push({ ...cevirmeKol, quantity: 1 });
                }
              }
            }
          }

          // Lamel tipine göre PVC TAPA ve Zımba Teli hesaplama

          const tapaType = selections.dikmeType.startsWith("mini_")
            ? "SL-39"
            : "SL-55";
          const searchTapaKey = `pvc tapa ${tapaType}`.toLowerCase();
          // PVC TAPA hesaplama
          const pvcTapa = allAccessories.find((acc) =>
            acc.description.toLowerCase().includes(searchTapaKey)
          );

          if (pvcTapa) {
            let systemHeight = selections.height;
            if (selections.kutuOlcuAlmaSekli === "kutu_haric") {
              systemHeight =
                selections.height + getBoxHeight(selections.boxType);
            }

            const lamelHeight = Number(selections.lamelTickness.split("_")[0]);

            const dikmeYuksekligiKertmeHaric =
              systemHeight - getBoxHeight(selections.boxType);
            const lamelSayisi = Math.ceil(
              dikmeYuksekligiKertmeHaric / lamelHeight
            );
            const lamelCount = lamelSayisi + 1;

            // Tek sayı ise bir artırıp ikiye böl, çift ise direkt ikiye böl
            const tapaQuantity =
              lamelCount % 2 === 0 ? lamelCount / 2 : (lamelCount + 1) / 2;
            const tapaAccessory = { ...pvcTapa, quantity: tapaQuantity };
            neededAccessories.push(tapaAccessory);

            // Zımba Teli 5mm (PVC tapa miktarı kadar)
            const zimbaTeli = allAccessories.find((acc) =>
              acc.description.toLowerCase().includes("zımba teli 5")
            );
            if (zimbaTeli) {
              const zimbaTeliAccessory = {
                ...zimbaTeli,
                quantity: tapaQuantity,
              };
              neededAccessories.push(zimbaTeliAccessory);
            }
          }

          // Çelik Askı hesaplama
          const dikmeGenisligi = getDikmeGenisligi(selections.dikmeType);

          let systemWidth = selections.width;
          switch (selections.dikmeOlcuAlmaSekli) {
            case "dikme_haric":
              systemWidth = selections.width + 2 * dikmeGenisligi - 10;
              break;
            case "tek_dikme":
              systemWidth = selections.width + dikmeGenisligi - 10;
              break;
            case "dikme_dahil":
              systemWidth = selections.width - 10;
              break;
          }
          const lamelDusmeValue = getLamelDusmeValue(selections.dikmeType);
          const lamelGenisligi = systemWidth - lamelDusmeValue;
          const askiType = selections.dikmeType.startsWith("mini_")
            ? "130 mm ( SL 39 )"
            : "170 mm ( SL 55 )";

          const celikAski = allAccessories.find((acc) =>
            acc.description
              .toLowerCase()
              .includes(`çelik askı ${askiType}`.toLowerCase())
          );

          if (celikAski) {
            let askiQuantity = 2; // Default miktar

            if (lamelGenisligi > 1000 && lamelGenisligi <= 1500) {
              askiQuantity = 4;
            } else if (lamelGenisligi > 1500 && lamelGenisligi <= 2250) {
              askiQuantity = 6;
            } else if (lamelGenisligi > 2250 && lamelGenisligi <= 3500) {
              askiQuantity = 8;
            } else if (lamelGenisligi > 3500) {
              askiQuantity = 10;
            }

            const askiAccessory = { ...celikAski, quantity: askiQuantity };
            neededAccessories.push(askiAccessory);
          }

          // Alt Parça Aksesuarları (Tüm lamel tipleri için)

          // Alt Parça Lastiği hesaplama
          const lastikType = selections.dikmeType.startsWith("mini_")
            ? "39'luk alt parça lastiği gri"
            : "55'lik alt parça lastiği gri";

          const altParcaLastigi = allAccessories.find((acc) =>
            acc.description.toLowerCase().includes(lastikType.toLowerCase())
          );
          if (altParcaLastigi) {
            const lastikAccessory = {
              ...altParcaLastigi,
              quantity: 1, // Her kutu için bir lastik
            };
            neededAccessories.push(lastikAccessory);
          }

          // Stoper Konik (Sadece SL-39 ve SE-45 için makaralı seçiminde)
          if (
            (selections.lamelTickness === "39_sl" ||
              selections.lamelTickness === "45_se") &&
            selections.manuelSekli === "makarali"
          ) {
            const stoperKonik = allAccessories.find((acc) =>
              acc.description.toLowerCase().includes("stoper konik")
            );
            if (stoperKonik) {
              const stoperAccessory = {
                ...stoperKonik,
                quantity: 1,
              };
              neededAccessories.push(stoperAccessory);
            }
          }

          // Kilitli Alt Parça seçildiğinde eklenen aksesuarlar
          if (selections.subPart === "kilitli_alt_parca") {
            // Alt Parça Sürgüsü Yuvarlak Galvaniz
            const surguyuvarlak = allAccessories.find((acc) =>
              acc.description
                .toLowerCase()
                .includes("alt parça sürgüsü yuvarlak galvaniz")
            );
            if (surguyuvarlak) {
              const surguYuvarlakAccessory = {
                ...surguyuvarlak,
                quantity: 1,
              };
              neededAccessories.push(surguYuvarlakAccessory);
            }

            // Alt Parça Sürgüsü Yassı Galvaniz
            const surguyassi = allAccessories.find((acc) =>
              acc.description
                .toLowerCase()
                .includes("alt parça sürgüsü yassı galvaniz")
            );
            if (surguyassi) {
              const surguYassiAccessory = {
                ...surguyassi,
                quantity: 1,
              };
              neededAccessories.push(surguYassiAccessory);
            }
          }

          // 55'lik Lamel Denge Makarası kontrolü
          if (
            selections.dikmeType.startsWith("midi_") &&
            selections.boxType === "250mm"
          ) {
            const dengeMakarasi = allAccessories.find((acc) =>
              acc.description
                .toLowerCase()
                .includes("55'lik lamel denge makarası")
            );
            if (dengeMakarasi) {
              const dengeMakarasiAccessory = {
                ...dengeMakarasi,
                quantity: 1,
              };
              neededAccessories.push(dengeMakarasiAccessory);
            }
          }

          // Panjur Dikme Makası kontrolü - mini dikme ve 39mm Alüminyum Poliüretanlı lamel için
          if (
            selections.dikmeType.startsWith("mini_") &&
            selections.lamelTickness === "39_sl" &&
            selections.lamelType === "aluminyum_poliuretanli"
          ) {
            // Panjur Dikme Makası
            const dikmeMakasi = allAccessories.find((acc) =>
              acc.description.toLowerCase().includes("panjur dikme makası")
            );
            if (dikmeMakasi) {
              const dikmeMakasiAccessory = {
                ...dikmeMakasi,
                quantity: dikmeCount,
              };
              neededAccessories.push(dikmeMakasiAccessory);
            }

            // Panjur Dikme Menteşesi
            const dikmeMentesesi = allAccessories.find((acc) =>
              acc.description.toLowerCase().includes("panjur dikme menteşesi")
            );
            if (dikmeMentesesi) {
              const dikmeMentesesiAccessory = {
                ...dikmeMentesesi,
                quantity: dikmeCount,
              };
              neededAccessories.push(dikmeMentesesiAccessory);
            }
          }

          // Tambur profili hesaplama
          const tamburDesc =
            selections.movementType === "manuel"
              ? "40mm Sekizgen Boru 0,40"
              : "60mm Sekizgen Boru 0,60";

          const tamburProfile = allAccessories.find((acc) =>
            acc.description.toLowerCase().includes(tamburDesc.toLowerCase())
          );
          if (tamburProfile) {
            const tamburAccessory = {
              ...tamburProfile,
              quantity: 1,
            };
            neededAccessories.push(tamburAccessory);
          }

          // Calculate total price
          const total = neededAccessories.reduce((sum, acc) => {
            const price = parseFloat(acc.price.replace(",", "."));
            const quantity = acc.quantity || 1;
            return sum + price * quantity;
          }, 0);

          setAccessories(neededAccessories);
          setTotalPrice(total * selections.quantity);
        }
      } catch (error) {
        console.error("Error calculating accessories:", error);
        setAccessories([]);
        setTotalPrice(0);
      }
    };

    fetchAndCalculateAccessories();
  }, [selections, dikmeCount]);

  return { accessories, totalPrice };
}
