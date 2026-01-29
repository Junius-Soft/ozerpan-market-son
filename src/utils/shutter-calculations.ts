// Bölme genişliklerini hesaplama fonksiyonu
export function calculateSectionWidths(
  totalWidth: number,
  middleBarPositions: number[]
): number[] {
  const positions = [0, ...middleBarPositions, totalWidth];
  return positions.slice(0, -1).map((pos, i) => positions[i + 1] - pos);
}

// Birleştirilmiş bölme gruplarını hesaplama fonksiyonu
export function findEffectiveSections(
  totalWidth: number,
  totalHeight: number,
  middleBarPositions: number[],
  sectionHeights: number[],
  sectionConnections: string[],
  returnLargestOnly: boolean = false
):
  | { width: number; height: number } // returnLargestOnly = true
  | Array<{ sectionIndices: number[]; width: number; height: number }> {
  // returnLargestOnly = false
  // Bölme genişliklerini hesapla
  const sectionWidths = calculateSectionWidths(totalWidth, middleBarPositions);

  // Birleştirilmiş bölmeleri takip et
  const processedSections = new Set<number>();
  const effectiveGroups: Array<{
    sectionIndices: number[];
    width: number;
    height: number;
    area: number;
  }> = [];

  for (let index = 0; index < sectionWidths.length; index++) {
    // Bu bölme zaten işlendiyse atla
    if (processedSections.has(index)) continue;

    // Bağlı olan tüm bölmeleri bul
    const connectedSections = new Set<number>([index]);
    let effectiveWidth = sectionWidths[index];
    let effectiveHeight = sectionHeights[index] || totalHeight;

    // Tüm bölmeleri kontrol ederek bağlantı zincirini bul
    let changed = true;
    while (changed) {
      changed = false;

      for (let i = 0; i < sectionWidths.length; i++) {
        if (connectedSections.has(i)) continue;

        // Bu bölme mevcut gruba bağlı mı kontrol et
        let shouldConnect = false;

        // Sol bağlantı: i bölmesi sola bağlıysa ve i-1 grupta varsa
        if (
          i > 0 &&
          sectionConnections[i] === "left" &&
          connectedSections.has(i - 1)
        ) {
          shouldConnect = true;
        }

        // Sağ bağlantı: i bölmesi sağa bağlıysa ve i+1 grupta varsa
        if (
          i < sectionWidths.length - 1 &&
          sectionConnections[i] === "right" &&
          connectedSections.has(i + 1)
        ) {
          shouldConnect = true;
        }

        // Ters yön kontrolleri
        // i-1 bölmesi sağa bağlıysa ve i grupta varsa
        if (
          i > 0 &&
          sectionConnections[i - 1] === "right" &&
          connectedSections.has(i - 1)
        ) {
          shouldConnect = true;
        }

        // i+1 bölmesi sola bağlıysa ve i grupta varsa
        if (
          i < sectionWidths.length - 1 &&
          sectionConnections[i + 1] === "left" &&
          connectedSections.has(i + 1)
        ) {
          shouldConnect = true;
        }

        if (shouldConnect) {
          connectedSections.add(i);
          effectiveWidth += sectionWidths[i];
          effectiveHeight = Math.max(
            effectiveHeight,
            sectionHeights[i] || totalHeight
          );
          changed = true;
        }
      }
    }

    // İşlenmiş bölmeleri işaretle
    connectedSections.forEach((idx) => processedSections.add(idx));

    // Set'i array'e çevir ve sırala
    const sortedConnectedSections = Array.from(connectedSections).sort(
      (a, b) => a - b
    );

    effectiveGroups.push({
      sectionIndices: sortedConnectedSections,
      width: effectiveWidth,
      height: effectiveHeight,
      area: effectiveWidth * effectiveHeight,
    });
  }

  if (returnLargestOnly) {
    // En büyük alanı olan bölmeyi bul
    const largestSection = effectiveGroups.reduce((largest, current) => {
      return current.area > largest.area ? current : largest;
    });

    return {
      width: largestSection.width,
      height: largestSection.height,
    };
  } else {
    // Tüm grupları döndür (area özelliği olmadan)
    return effectiveGroups.map((group) => ({
      sectionIndices: group.sectionIndices,
      width: group.width,
      height: group.height,
    }));
  }
}

/** Bölmeli panjurda lamel limiti kontrolü için tüm etkili bölmeler arasındaki
 * maksimum genişlik ve yüksekliği döndürür. Böylece seçilen lamel her bölmeyi karşılar. */
export function getMaxSectionDimensionsForLamelLimit(
  totalWidth: number,
  totalHeight: number,
  middleBarPositions: number[],
  sectionHeights: number[],
  sectionConnections: string[]
): { width: number; height: number } {
  const groups = findEffectiveSections(
    totalWidth,
    totalHeight,
    middleBarPositions,
    sectionHeights,
    sectionConnections,
    false
  ) as Array<{ sectionIndices: number[]; width: number; height: number }>;

  if (groups.length === 0) {
    return { width: totalWidth, height: totalHeight };
  }

  const width = Math.max(...groups.map((g) => g.width));
  const height = Math.max(...groups.map((g) => g.height));
  return { width, height };
}

// Backward compatibility için eski fonksiyonları koruyalım
export function findLargestEffectiveSection(
  totalWidth: number,
  totalHeight: number,
  middleBarPositions: number[],
  sectionHeights: number[],
  sectionConnections: string[]
): { width: number; height: number } {
  return findEffectiveSections(
    totalWidth,
    totalHeight,
    middleBarPositions,
    sectionHeights,
    sectionConnections,
    true
  ) as { width: number; height: number };
}

export function findMotorResponsibleSections(
  totalWidth: number,
  middleBarPositions: number[],
  sectionHeights: number[],
  sectionConnections: string[]
): Array<{ sectionIndices: number[]; width: number; height: number }> {
  return findEffectiveSections(
    totalWidth,
    totalWidth, // totalHeight yerine totalWidth kullanıyoruz (eski davranışı korumak için)
    middleBarPositions,
    sectionHeights,
    sectionConnections,
    false
  ) as Array<{ sectionIndices: number[]; width: number; height: number }>;
}
