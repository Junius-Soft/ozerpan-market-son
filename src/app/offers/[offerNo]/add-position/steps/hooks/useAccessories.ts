import { PanjurSelections, PriceItem } from "@/types/panjur";
import {
  calculateSystemWidth,
  calculateSystemHeight,
  calculateLamelCount,
  calculateLamelGenisligi,
} from "@/utils/panjur";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface AccessoryResult {
  accessories: PriceItem[];
}

export function useAccessories(selections: PanjurSelections): AccessoryResult {
  const [accessories, setAccessories] = useState<PriceItem[]>([]);
  const searchParams = useSearchParams();

  const sectionCount = searchParams.get("typeId");
  const dikmeCount = Number(sectionCount) * 2;

  useEffect(() => {
    const fetchAndCalculateAccessories = async () => {
      try {
        const response = await fetch(
          `/api/accessories?productId=${selections.productId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch accessories");
        }
        const data = await response.json();
        const allAccessories: PriceItem[] = data;
        const neededAccessories: PriceItem[] = [];

        if (allAccessories && selections.productId === "panjur") {
          const width = calculateSystemWidth(
            selections.width,
            selections.dikmeOlcuAlmaSekli,
            selections.dikmeType
          );

          const height = calculateSystemHeight(
            selections.height,
            selections.kutuOlcuAlmaSekli,
            selections.boxType
          );

          const lamelWidth = calculateLamelGenisligi(
            width,
            selections.dikmeType
          );

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
              neededAccessories.push({ ...yanKapak, quantity: 1 });
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
            neededAccessories.push({ ...tamburProfili, quantity: width });

            if (selections.movementType === "motorlu") {
              // Motor aksesuarları
              const boruBasi = allAccessories.find((acc) =>
                acc.description
                  .toLowerCase()
                  .includes("60 boru başı rulmanlı siyah")
              );
              if (boruBasi) {
                neededAccessories.push({ ...boruBasi, quantity: 1 });
              }

              const rulman = allAccessories.find((acc) =>
                acc.description.toLowerCase().includes("rulman 12x28")
              );
              if (rulman) {
                neededAccessories.push({ ...rulman, quantity: 1 });
              }

              if (selections.boxType === "250mm") {
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
                // Makaralı aksesuarları
                const boruBasi = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes("40 boru başı rulmanlı siyah")
                );
                if (boruBasi) {
                  neededAccessories.push({ ...boruBasi, quantity: 1 });
                }

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

                const rulmanMakarali = allAccessories.find((acc) =>
                  acc.description.toLowerCase().includes("rulman 12x28")
                );
                if (rulmanMakarali) {
                  neededAccessories.push({ ...rulmanMakarali, quantity: 2 });
                }

                const windeMakara = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes("winde otomatik makara")
                );
                if (windeMakara) {
                  neededAccessories.push({ ...windeMakara, quantity: 1 });
                }

                const kordonMakara = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes("kordon geçme makarası 14 mm pvc")
                );
                if (kordonMakara) {
                  neededAccessories.push({ ...kordonMakara, quantity: 1 });
                }
              } else if (selections.manuelSekli === "reduktorlu") {
                // Redüktörlü aksesuarlar
                const accessories = [
                  {
                    name: "40 boru başı rulmanlı siyah",
                    quantity: 1,
                  },
                  {
                    name: "rulman 12x28",
                    quantity: 1,
                  },
                  {
                    name: "panjur redüktörü beyaz",
                    quantity: 1,
                  },
                  {
                    name: "redüktör boru başı 40 mm-C 371 uyumlu",
                    quantity: 1,
                  },
                  {
                    name: "Ara kol-C 371 uyumlu",
                    quantity: 1,
                  },
                  {
                    name: "Çevirme kolu-1200 mm",
                    quantity: 1,
                  },
                ];

                for (const acc of accessories) {
                  const found = allAccessories.find((a) =>
                    a.description.toLowerCase().includes(acc.name.toLowerCase())
                  );
                  if (found) {
                    neededAccessories.push({
                      ...found,
                      quantity: acc.quantity,
                    });
                  }
                }
              }
            }
          }

          // Lamel tipine göre PVC TAPA ve Zımba Teli hesaplama
          const tapaType = selections.dikmeType.startsWith("mini_")
            ? "SL-39"
            : "SL-55";
          const searchTapaKey = `pvc tapa ${tapaType}`.toLowerCase();

          const pvcTapa = allAccessories.find((acc) =>
            acc.description.toLowerCase().includes(searchTapaKey)
          );

          if (pvcTapa) {
            const finalLamelCount = calculateLamelCount(
              height,
              selections.boxType,
              selections.lamelTickness
            );

            // Tek sayı ise bir artırıp ikiye böl, çift ise direkt ikiye böl
            const tapaQuantity =
              finalLamelCount % 2 === 0
                ? finalLamelCount / 2
                : (finalLamelCount + 1) / 2;

            neededAccessories.push({ ...pvcTapa, quantity: tapaQuantity });

            // Zımba Teli 5mm (PVC tapa miktarı kadar)
            const zimbaTeli = allAccessories.find((acc) =>
              acc.description.toLowerCase().includes("zımba teli 5")
            );
            if (zimbaTeli) {
              neededAccessories.push({ ...zimbaTeli, quantity: tapaQuantity });
            }
          }

          // Çelik Askı hesaplama
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

            if (lamelWidth > 1000 && lamelWidth <= 1500) {
              askiQuantity = 4;
            } else if (lamelWidth > 1500 && lamelWidth <= 2250) {
              askiQuantity = 6;
            } else if (lamelWidth > 2250 && lamelWidth <= 3500) {
              askiQuantity = 8;
            } else if (lamelWidth > 3500) {
              askiQuantity = 10;
            }

            neededAccessories.push({ ...celikAski, quantity: askiQuantity });
          }

          // Alt Parça Lastiği hesaplama
          const lastikType = selections.dikmeType.startsWith("mini_")
            ? "39'luk alt parça lastiği gri"
            : "55'lik alt parça lastiği gri";

          const altParcaLastigi = allAccessories.find((acc) =>
            acc.description.toLowerCase().includes(lastikType.toLowerCase())
          );
          if (altParcaLastigi) {
            neededAccessories.push({ ...altParcaLastigi, quantity: 1 });
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
              neededAccessories.push({ ...stoperKonik, quantity: 1 });
            }
          }

          // Kilitli Alt Parça aksesuarları
          if (selections.subPart === "kilitli_alt_parca") {
            const kilitliAccessories = [
              "alt parça sürgüsü yuvarlak galvaniz",
              "alt parça sürgüsü yassı galvaniz",
            ];

            for (const accName of kilitliAccessories) {
              const found = allAccessories.find((acc) =>
                acc.description.toLowerCase().includes(accName)
              );
              if (found) {
                neededAccessories.push({ ...found, quantity: 1 });
              }
            }
          }

          // Lamel Denge Makarası kontrolü
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
              neededAccessories.push({ ...dengeMakarasi, quantity: 1 });
            }
          }

          // Mini dikme ve 39mm Alüminyum Poliüretanlı lamel aksesuarları
          if (
            selections.dikmeType.startsWith("mini_") &&
            selections.lamelTickness === "39_sl" &&
            selections.lamelType === "aluminyum_poliuretanli"
          ) {
            const miniDikmeAccessories = [
              {
                name: "panjur dikme makası",
                quantity: dikmeCount,
              },
              {
                name: "panjur dikme menteşesi",
                quantity: dikmeCount,
              },
            ];

            for (const acc of miniDikmeAccessories) {
              const found = allAccessories.find((a) =>
                a.description.toLowerCase().includes(acc.name)
              );
              if (found) {
                neededAccessories.push({ ...found, quantity: acc.quantity });
              }
            }
          }

          setAccessories(neededAccessories);
        }
      } catch (error) {
        console.error("Error calculating accessories:", error);
        setAccessories([]);
      }
    };

    fetchAndCalculateAccessories();
  }, [selections, dikmeCount]);

  return { accessories };
}
