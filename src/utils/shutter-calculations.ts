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

    let effectiveWidth = sectionWidths[index];
    let effectiveHeight = sectionHeights[index] || totalHeight;
    const connectedSections = [index]; // Bağlı olan bölmeleri takip et

    // Zincir bağlantıları takip et - önce sağa doğru
    let currentIndex = index;
    while (
      currentIndex < sectionWidths.length - 1 &&
      sectionConnections[currentIndex] &&
      sectionConnections[currentIndex] === "right"
    ) {
      const rightIndex = currentIndex + 1;
      effectiveWidth += sectionWidths[rightIndex];
      effectiveHeight = Math.max(
        effectiveHeight,
        sectionHeights[rightIndex] || totalHeight
      );
      connectedSections.push(rightIndex);
      processedSections.add(rightIndex);
      currentIndex = rightIndex;
    }

    // Sonra sola doğru (eğer başlangıç bölmesinde sol bağlantı varsa)
    currentIndex = index;
    while (
      currentIndex > 0 &&
      sectionConnections[currentIndex] &&
      sectionConnections[currentIndex] === "left"
    ) {
      const leftIndex = currentIndex - 1;
      effectiveWidth += sectionWidths[leftIndex];
      effectiveHeight = Math.max(
        effectiveHeight,
        sectionHeights[leftIndex] || totalHeight
      );
      connectedSections.push(leftIndex);
      processedSections.add(leftIndex);
      currentIndex = leftIndex;
    }

    // Bu bölme(ler)i işlenmiş olarak işaretle
    connectedSections.forEach((idx) => processedSections.add(idx));

    // Bölme indekslerini sırala
    connectedSections.sort((a, b) => a - b);

    effectiveGroups.push({
      sectionIndices: connectedSections,
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
