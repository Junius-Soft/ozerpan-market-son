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

interface PanjurSelections {
  productId: string;
  width: number;
  height: number;
  quantity: number;
  boxType: string;
  dikmeType: string;
  lamelTickness: string;
  lamel_color: string;
  box_color: string;
  dikme_color: string;
  movementType: string;
  motorMarka?: string;
  motorSekli?: string;
  manuelSekli?: string;
  makaraliTip?: string;
  subPart: string;
}

interface AccessoryResult {
  accessories: Accessory[];
  totalPrice: number;
}

export function useAccessories(selections: PanjurSelections): AccessoryResult {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

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
              } else if (selections.manuelSekli === "rediktorlu") {
                // Boru Başı Rulmanlı
                const boruBasiRediktor = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes("40 boru başı rulmanlı siyah")
                );
                if (boruBasiRediktor) {
                  neededAccessories.push({ ...boruBasiRediktor, quantity: 1 });
                }

                // Rulman 12x28 for Rediktörlü
                const rulmanRediktor = allAccessories.find((acc) =>
                  acc.description.toLowerCase().includes("rulman 12x28")
                );
                if (rulmanRediktor) {
                  neededAccessories.push({ ...rulmanRediktor, quantity: 1 });
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
                    .includes("redüktör boru başı 40 mm beyaz")
                );
                if (reduktorBoruBasi) {
                  neededAccessories.push({ ...reduktorBoruBasi, quantity: 1 });
                }

                // Panjur Redüktörü Ara Kol
                const araKol = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes("panjur redüktörü ara kol beyaz")
                );
                if (araKol) {
                  neededAccessories.push({ ...araKol, quantity: 1 });
                }

                // Panjur Redüktörü Çevirme Kolu
                const cevirmeKol = allAccessories.find((acc) =>
                  acc.description
                    .toLowerCase()
                    .includes("panjur redüktörü çevirme kolu 110 cm beyaz")
                );
                if (cevirmeKol) {
                  neededAccessories.push({ ...cevirmeKol, quantity: 1 });
                }
              }
            }
          }

          // Lamel tipine göre PVC TAPA ve Zımba Teli hesaplama
          if (
            ["39_sl", "45_se", "55_sl", "55_se"].includes(
              selections.lamelTickness
            )
          ) {
            let tapaType = "sl-39"; // Default değer
            let lamelWidth = 39; // Default değer
            let askiType = "130"; // Default değer

            switch (selections.lamelTickness) {
              case "39_sl":
                tapaType = "sl-39";
                lamelWidth = 39;
                askiType = "130";
                break;
              case "45_se":
                tapaType = "se-45";
                lamelWidth = 45;
                askiType = "45";
                break;
              case "55_sl":
                tapaType = "sl-55";
                lamelWidth = 55;
                askiType = "170";
                break;
              case "55_se":
                tapaType = "se-55";
                lamelWidth = 55;
                askiType = "170";
                break;
            }

            // PVC TAPA hesaplama
            const pvcTapa = allAccessories.find((acc) =>
              acc.description.toLowerCase().includes(`pvc tapa ${tapaType}`)
            );

            if (pvcTapa) {
              // Lamel sayısını hesapla
              const lamelCount = Math.ceil(selections.height / lamelWidth);
              // Çift sayıya yuvarlama
              const adjustedLamelCount =
                lamelCount % 2 === 0 ? lamelCount : lamelCount + 1;
              const tapaQuantity = adjustedLamelCount / 2;

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
            const celikAski = allAccessories.find((acc) =>
              acc.description.toLowerCase().includes(`çelik askı ${askiType}`)
            );

            if (celikAski) {
              let askiQuantity = 2; // Default miktar

              if (selections.width > 1000 && selections.width <= 1500) {
                askiQuantity = 4;
              } else if (selections.width > 1500 && selections.width <= 2250) {
                askiQuantity = 6;
              } else if (selections.width > 2250 && selections.width <= 3500) {
                askiQuantity = 8;
              } else if (selections.width > 3500) {
                askiQuantity = 10;
              }

              const askiAccessory = { ...celikAski, quantity: askiQuantity };
              neededAccessories.push(askiAccessory);

              // Askı Teli hesaplama (her çelik askı için bir adet)
              const askiTeli = allAccessories.find((acc) =>
                acc.description.toLowerCase().includes("askı teli")
              );
              if (askiTeli) {
                const askiTeliAccessory = {
                  ...askiTeli,
                  quantity: askiQuantity,
                };
                neededAccessories.push(askiTeliAccessory);
              }
            }

            // Alt Parça Aksesuarları (Tüm lamel tipleri için)
            if (
              ["39_sl", "45_se", "55_sl", "55_se"].includes(
                selections.lamelTickness
              )
            ) {
              // Alt Parça Lastiği hesaplama
              let lastikType: string;
              if (selections.lamelTickness === "39_sl") {
                lastikType = "39'luk alt parça lastiği gri";
              } else if (selections.lamelTickness === "45_se") {
                lastikType = "45'lik alt parça lastiği gri";
              } else {
                lastikType = "55'lik alt parça lastiği gri"; // SL-55 ve SE-55 için
              }

              const altParcaLastigi = allAccessories.find((acc) =>
                acc.description.toLowerCase().includes(lastikType.toLowerCase())
              );
              if (altParcaLastigi) {
                const lastikAccessory = {
                  ...altParcaLastigi,
                  quantity: selections.width,
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
  }, [selections]);

  return { accessories, totalPrice };
}
