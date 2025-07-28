import { useState, useEffect } from "react";
import {
  PriceItem,
  CalculationResult,
  SelectedProduct,
  PanjurSelections,
} from "@/types/panjur";
import {
  findLamelPrice,
  findSubPartPrice,
  findDikmePrice,
  findBoxPrice,
  findSmartHomePrice,
  findRemotePrice,
  findReceiverPrice,
  findTamburProfiliAccessoryPrice,
  findYukseltmeProfiliPrice,
  calculateSystemWidth,
  calculateSystemHeight,
  calculateLamelCount,
  calculateLamelGenisligi,
  calculateDikmeHeight,
  getBoxHeight,
  findSectionWidths,
} from "@/utils/panjur";
import { useSearchParams } from "next/navigation";
import { useAccessories } from "./useAccessories";
import { ProductTab } from "@/documents/products";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

// Custom hook
export const usePanjurCalculator = (
  values: PanjurSelections,
  availableTabs?: ProductTab[]
) => {
  const [result, setResult] = useState<CalculationResult>({
    systemWidth: 0,
    systemHeight: 0,
    lamelCount: 0,
    lamelGenisligi: 0,
    lamelPrice: 0,
    dikmeHeight: 0,
    dikmeCount: 2,
    boxHeight: 0,
    subPartWidth: 0,
    totalPrice: 0,
    selectedProducts: { products: [], accessories: [] },
    errors: [],
  });
  const searchParams = useSearchParams();
  const sectionCount = Number(searchParams.get("typeId"));
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const { accessories } = useAccessories(values);

  // Redux state'lerini çek
  const middleBarPositions = useSelector(
    (state: RootState) => state.shutter.middleBarPositions
  );
  const sectionHeights = useSelector(
    (state: RootState) => state.shutter.sectionHeights
  );

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(`/api/product-prices?productId=panjur`);
        if (!response.ok) {
          throw new Error("Failed to fetch prices");
        }
        const data = await response.json();
        setPrices(data);
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    };

    fetchPrices();
  }, []);

  useEffect(() => {
    if (!prices.length || !values) return;

    // Lamel count hesaplanırken çağrılacak
    const calculate = () => {
      const errors: string[] = [];

      const systemWidth = calculateSystemWidth(
        values.width,
        values.dikmeOlcuAlmaSekli,
        values.dikmeType
      );

      const systemHeight = calculateSystemHeight(
        values.height,
        values.kutuOlcuAlmaSekli,
        values.boxType
      );

      // Her bölmenin genişliklerini hesapla
      const sectionWidths = findSectionWidths(middleBarPositions, values.width);

      // Her bölme için sistem genişliklerini hesapla
      const sectionSystemWidths = sectionWidths.map((sectionWidth) =>
        calculateSystemWidth(
          sectionWidth,
          values.dikmeOlcuAlmaSekli,
          values.dikmeType
        )
      );

      // Her bölme için sistem yüksekliklerini hesapla
      const sectionSystemHeights = sectionHeights.map((sectionHeight) =>
        calculateSystemHeight(
          sectionHeight,
          values.kutuOlcuAlmaSekli,
          values.boxType
        )
      );

      const kutuYuksekligi = getBoxHeight(values.boxType);

      // Her dikme için yüksekliği hesapla (bitişik bölmelerin maksimumuna göre)
      const calculateDikmeHeightsForSections = (
        sectionSystemHeights: number[]
      ): number[] => {
        if (sectionSystemHeights.length === 1) {
          // Tek bölme: sadece o bölmenin yüksekliği
          return [
            calculateDikmeHeight(
              sectionSystemHeights[0],
              values.boxType,
              values.dikmeType
            ),
            calculateDikmeHeight(
              sectionSystemHeights[0],
              values.boxType,
              values.dikmeType
            ),
          ];
        }

        const dikmeHeights: number[] = [];

        // Sol dikme (sadece ilk bölme)
        dikmeHeights.push(
          calculateDikmeHeight(
            sectionSystemHeights[0],
            values.boxType,
            values.dikmeType
          )
        );

        // Orta dikmeler (bitişik iki bölmenin maksimumu)
        for (let i = 0; i < sectionSystemHeights.length - 1; i++) {
          const maxHeight = Math.max(
            sectionSystemHeights[i],
            sectionSystemHeights[i + 1]
          );
          dikmeHeights.push(
            calculateDikmeHeight(maxHeight, values.boxType, values.dikmeType)
          );
        }

        // Sağ dikme (sadece son bölme)
        dikmeHeights.push(
          calculateDikmeHeight(
            sectionSystemHeights[sectionSystemHeights.length - 1],
            values.boxType,
            values.dikmeType
          )
        );

        return dikmeHeights;
      };

      const dikmeHeights =
        calculateDikmeHeightsForSections(sectionSystemHeights);
      // Her bölme için lamel genişlikleri
      const sectionLamelWidths = sectionSystemWidths.map((sectionSystemWidth) =>
        calculateLamelGenisligi(sectionSystemWidth, values.dikmeType)
      );

      // Her bölme için lamel sayıları
      const sectionLamelCounts = sectionSystemHeights.map(
        (sectionSystemHeight) =>
          calculateLamelCount(
            sectionSystemHeight,
            values.boxType,
            values.lamelTickness
          )
      );

      // Gerçek dikme sayısı: sol ve sağ 1'er adet, ortalar 2'şer adet
      const dikmeCount =
        dikmeHeights.length === 1
          ? 2 // Tek bölme: sol ve sağ dikme
          : 2 + (dikmeHeights.length - 2) * 2; // Sol(1) + Orta(2*n) + Sağ(1)

      // Set initial measurements - ortalama değerleri kullan
      const avgLamelGenisligi =
        sectionLamelWidths.reduce((sum, w) => sum + w, 0) /
        sectionLamelWidths.length;
      const totalLamelCount = sectionLamelCounts.reduce((sum, c) => sum + c, 0);
      const avgDikmeHeight =
        dikmeHeights.reduce((sum: number, h: number) => sum + h, 0) /
        dikmeHeights.length;

      setResult((prev) => ({
        ...prev,
        systemWidth,
        systemHeight,
        lamelCount: totalLamelCount,
        lamelGenisligi: avgLamelGenisligi,
        dikmeHeight: avgDikmeHeight,
        dikmeCount,
        boxHeight: kutuYuksekligi,
        subPartWidth: avgLamelGenisligi,
      }));

      // Price calculations - her bölme için ayrı hesapla
      let totalLamelPrice = 0;
      const lamelSelectedProducts: SelectedProduct[] = [];

      // Her bölme için lamel fiyatı hesapla
      sectionLamelWidths.forEach((lamelGenisligi, index) => {
        const lamelCount = sectionLamelCounts[index];
        const [lamelUnitPrice, lamelSelectedProduct] = findLamelPrice(
          prices,
          values.lamelTickness,
          values.lamelType,
          values.lamel_color,
          lamelCount,
          lamelGenisligi
        );

        const lamelGenisligiMetre = lamelGenisligi / 1000;
        const sectionLamelPrice =
          lamelUnitPrice * lamelGenisligiMetre * lamelCount;
        totalLamelPrice += sectionLamelPrice;

        if (lamelSelectedProduct) {
          // Bölme bilgisini ekleyerek ürünü kaydet
          lamelSelectedProducts.push({
            ...lamelSelectedProduct,
            description: `${lamelSelectedProduct.description} (Bölme ${
              index + 1
            })`,
            totalPrice: sectionLamelPrice,
          });
        }
      });

      const subPartResults = findSubPartPrice(
        prices,
        values.subPart,
        values.subPart_color || values.lamel_color,
        middleBarPositions,
        values.width
      );
      console.log({ subPartResults });
      // Toplam alt parça fiyatı ve ürünleri
      const subPartPrice = subPartResults.reduce((sum, r) => sum + r.price, 0);
      // Alt parça ürünlerini topluca ekle
      const subPartSelectedProducts: SelectedProduct[] = subPartResults
        .map((r) => r.selectedProduct)
        .filter((p): p is SelectedProduct => !!p);

      // Dikme fiyatı hesaplama - pozisyona göre adet sayısı
      let totalDikmePrice = 0;
      const dikmeSelectedProducts: SelectedProduct[] = [];
      console.log({ dikmeHeights });
      // Her dikme pozisyonu için fiyat hesapla
      dikmeHeights.forEach((dikmeHeight: number, index: number) => {
        // Dikme adet sayısını pozisyona göre belirle
        const dikmeCountAtPosition =
          index === 0 || index === dikmeHeights.length - 1
            ? 1 // Sol ve sağ dikmeler: 1'er adet
            : 2; // Orta dikmeler: 2'şer adet

        const [dikmeUnitPrice, dikmeSelectedProduct] = findDikmePrice(
          prices,
          values.dikmeType,
          values.dikme_color || values.lamel_color,
          dikmeCountAtPosition,
          dikmeHeight
        );

        const dikmePriceForThisPosition = dikmeUnitPrice * dikmeCountAtPosition;
        totalDikmePrice += dikmePriceForThisPosition;

        if (dikmeSelectedProduct) {
          // Dikme pozisyon bilgisini ekleyerek ürünü kaydet
          const dikmePosition =
            index === 0
              ? "Sol"
              : index === dikmeHeights.length - 1
              ? "Sağ"
              : `Orta (${index})`;

          const adetText = dikmeCountAtPosition === 1 ? "1 Adet" : "2 Adet";

          dikmeSelectedProducts.push({
            ...dikmeSelectedProduct,
            description: `${dikmeSelectedProduct.description} (${dikmePosition} Dikme - ${adetText})`,
            totalPrice: dikmePriceForThisPosition,
          });
        }
      });

      const { frontPrice, backPrice, selectedFrontBox, selectedBackBox } =
        findBoxPrice(prices, values.boxType, values.box_color, systemWidth);
      const boxPrice = frontPrice + backPrice;
      // Uzaktan kumanda fiyatı hesaplama
      const [remotePrice, remoteSelectedProduct] = findRemotePrice(
        prices,
        values.remote
      );

      // Akıllı ev sistemi fiyatlandırması
      const [smarthomePrice, smarthomeSelectedProduct] = findSmartHomePrice(
        prices,
        values.smarthome
      );

      // Get the movement tab
      const movementTab = availableTabs?.find((tab) => tab.id === "movement");

      // Calculate receiver price
      const [receiverPrice, receiverSelectedProduct] = findReceiverPrice(
        prices,
        values.receiver,
        movementTab
      );

      // Tambur Profili fiyatı hesaplama
      const [tamburPrice, tamburSelectedProduct] =
        findTamburProfiliAccessoryPrice(
          prices,
          values.movementType,
          values.width
        );

      // Yükseltme Profili fiyatı hesaplama (sadece dikmeAdapter === "var" ise)
      let yukseltmeProfiliPrice = 0;
      const yukseltmeProfiliSelectedProducts: SelectedProduct[] = [];

      if (values.dikmeAdapter === "var") {
        // Her dikme pozisyonu için yükseltme profili fiyatı hesapla
        dikmeHeights.forEach((dikmeHeight: number, index: number) => {
          // Dikme adet sayısını pozisyona göre belirle
          const dikmeCountAtPosition =
            index === 0 || index === dikmeHeights.length - 1
              ? 1 // Sol ve sağ dikmeler: 1'er adet
              : 2; // Orta dikmeler: 2'şer adet

          // Yükseltme profili dikme yüksekliğine göre değil, sistem yüksekliğine göre hesaplanıyor
          // Bu yüzden dikme pozisyonuna karşılık gelen sistem yüksekliğini bulmalıyız
          let relevantSystemHeight: number;
          if (index === 0) {
            // Sol dikme - ilk bölmenin sistem yüksekliği
            relevantSystemHeight = sectionSystemHeights[0];
          } else if (index === dikmeHeights.length - 1) {
            // Sağ dikme - son bölmenin sistem yüksekliği
            relevantSystemHeight =
              sectionSystemHeights[sectionSystemHeights.length - 1];
          } else {
            // Orta dikme - bitişik iki bölmenin maksimumu
            relevantSystemHeight = Math.max(
              sectionSystemHeights[index - 1],
              sectionSystemHeights[index]
            );
          }

          const [sectionYukseltmePrice, sectionYukseltmeSelectedProduct] =
            findYukseltmeProfiliPrice(
              prices,
              values.dikme_color || values.lamel_color,
              dikmeCountAtPosition,
              relevantSystemHeight
            );

          yukseltmeProfiliPrice += sectionYukseltmePrice;

          if (sectionYukseltmeSelectedProduct) {
            // Dikme pozisyon bilgisini ekleyerek ürünü kaydet
            const dikmePosition =
              index === 0
                ? "Sol"
                : index === dikmeHeights.length - 1
                ? "Sağ"
                : `Orta (${index})`;

            const adetText = dikmeCountAtPosition === 1 ? "1 Adet" : "2 Adet";

            yukseltmeProfiliSelectedProducts.push({
              ...sectionYukseltmeSelectedProduct,
              description: `${sectionYukseltmeSelectedProduct.description} (${dikmePosition} Dikme - ${adetText})`,
              totalPrice: sectionYukseltmePrice,
            });
          }
        });
      }

      // Aksesuarların fiyatını hesapla
      const accessoriesPrice = (accessories || []).reduce((total, acc) => {
        return total + parseFloat(acc.price) * (acc.quantity || 1);
      }, 0);

      const rawTotalPriceEUR =
        totalLamelPrice +
        subPartPrice +
        totalDikmePrice +
        boxPrice +
        tamburPrice +
        yukseltmeProfiliPrice +
        remotePrice +
        smarthomePrice +
        receiverPrice +
        accessoriesPrice;

      const totalPrice = rawTotalPriceEUR;

      // Aksesuarları SelectedProduct formatına dönüştür ve tüm ürünleri birleştir
      const productItems = [
        ...lamelSelectedProducts,
        ...subPartSelectedProducts,
        ...dikmeSelectedProducts,
        selectedFrontBox,
        selectedBackBox,
        tamburSelectedProduct,
        ...yukseltmeProfiliSelectedProducts,
        remoteSelectedProduct,
        smarthomeSelectedProduct,
        receiverSelectedProduct,
      ].filter(
        (product): product is SelectedProduct =>
          product !== null && product !== undefined
      );

      const selectedProducts = {
        products: productItems,
        accessories: accessories || [],
      };

      setResult((prev) => ({
        ...prev,
        lamelPrice: totalLamelPrice,
        totalPrice,
        selectedProducts,
        errors,
      }));
    };

    calculate();
  }, [
    prices,
    values,
    sectionCount,
    accessories,
    availableTabs,
    middleBarPositions,
    sectionHeights,
  ]);

  return result;
};
