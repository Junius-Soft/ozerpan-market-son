"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setMiddleBarPositions, setSectionHeights } from "@/store/shutterSlice";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface ShutterPreviewProps {
  width: number;
  height: number;
  boxHeight?: number; // kutu yüksekliği (mm)
  className?: string;
  lamelColor?: string;
  boxColor?: string;
  subPartColor?: string;
  dikmeColor?: string;
  hareketBaglanti: "sol" | "sag";
  movementType: "manuel" | "motorlu";
  seperation: number; // Ayrım sayısı (örneğin, panjur için)
  lamelCount: number; // Lamel sayısı
  changeMiddlebarPostion: boolean;
  systemHeight: number; // Sistem yüksekliği (mm)
  systemWidth: number; // Sistem genişliği (mm)
}

export function ShutterPreview({
  width = 1000,
  height = 1000,
  boxHeight,
  className = "",
  lamelColor,
  boxColor,
  subPartColor,
  dikmeColor,
  hareketBaglanti,
  movementType,
  seperation,
  lamelCount,
  changeMiddlebarPostion,
  systemHeight,
  systemWidth,
}: ShutterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Redux state'den middleBarPositions ve sectionHeights'ı al
  const middleBarPositions = useSelector(
    (state: RootState) => state.shutter.middleBarPositions
  );
  const sectionHeights = useSelector(
    (state: RootState) => state.shutter.sectionHeights
  );
  const dispatch = useDispatch();
  console.log({ middleBarPositions });
  // seperation veya width değiştiğinde middleBarPositions'ı eşit aralıklı olarak güncelle
  // On first mount, preserve Redux value (from page.tsx), but on width change after mount, reset to equal intervals
  const initialLoad = useRef(true);
  const prevWidth = useRef(width);
  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      prevWidth.current = width;
      // Do not reset on first mount, let Redux initial value persist
      return;
    }
    // Only reset if width actually changed
    if (width !== prevWidth.current) {
      prevWidth.current = width;
      if (seperation > 1) {
        dispatch(
          setMiddleBarPositions(
            Array.from({ length: seperation - 1 }, (_, i) =>
              Math.round((width / seperation) * (i + 1))
            )
          )
        );
      } else {
        dispatch(setMiddleBarPositions([]));
      }
    }
  }, [seperation, width, dispatch]);
  const [selectedBar, setSelectedBar] = useState<{
    x: number;
    index: number;
    value: number | null;
  } | null>(null);
  // Bölme yüksekliği inputu için state
  const [selectedSection, setSelectedSection] = useState<{
    left: number;
    right: number;
    index: number;
    value: number | null;
  } | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  // Canvas koordinatlarını tutmak için ref
  const middleBarArrRef = useRef<{ x: number; width: number; index: number }[]>(
    []
  );
  // Bölme bracket/metin alanlarının koordinatlarını tutmak için ref
  // Her bölmenin lamel alanı koordinatlarını tutmak için ref
  const sectionLamelArrRef = useRef<
    | {
        left: number;
        right: number;
        top: number;
        bottom: number;
        index: number;
      }[]
    | null
  >(null);
  const drawShutter = useCallback(
    (
      canvas: HTMLCanvasElement,
      width: number,
      height: number,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      // Her bölmenin lamel alanı koordinatlarını topla
      const sectionLamels: {
        left: number;
        right: number;
        top: number;
        bottom: number;
        index: number;
      }[] = [];
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Define colors based on theme and props
      const colors = {
        frame: dikmeColor || (theme === "dark" ? "#94a3b8" : "#475569"),
        frameBackground: boxColor || (theme === "dark" ? "#64748b" : "#94a3b8"),
        frameBorder: dikmeColor || (theme === "dark" ? "#94a3b8" : "#64748b"),
        motor: subPartColor || (theme === "dark" ? "#64748b" : "#475569"),
        lamelLight: lamelColor || (theme === "dark" ? "#94a3b8" : "#e2e8f0"),
        lamelDark: lamelColor || (theme === "dark" ? "#64748b" : "#94a3b8"),
        text: theme === "dark" ? "#e2e8f0" : "#1e293b",
        lamelBorder: lamelColor || (theme === "dark" ? "#94a3b8" : "#64748b"),
      };

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate scaling factor to fit the rectangle within canvas
      const BASE_SIZE = 1500; // Base size for scaling
      const MIN_SIZE = 250; // Minimum dimension size

      // Normalize dimensions to be at least MIN_SIZE
      const normalizedWidth = Math.max(MIN_SIZE, width);
      const normalizedHeight = Math.max(MIN_SIZE, height);

      // Calculate the display scale based on the larger dimension
      const largerDimension = Math.max(normalizedWidth, normalizedHeight);
      const displayScale = BASE_SIZE / largerDimension;

      // Apply the scale to get display dimensions
      const scaledWidth = normalizedWidth * displayScale;
      const scaledHeight = normalizedHeight * displayScale;

      // --- Genişlik metni için canvas'ın altından sabit boşluk bırak ---
      const textFontSize = 16; // px
      const textPadding = 12; // metin ile canvas altı arası boşluk (daha aşağıda)
      const leftPadding = 60; // Sol taraf için ekstra padding (kutu yüksekliği metni ve bracket için)
      const rightPadding = 60; // Sağ taraf için ekstra padding (yükseklik metni ve bracket için)
      const topBottomPadding = 15; // Üst ve alt için padding (px)
      const extraHeight = 60; // Alt bracket/metinler için ek alan (updateCanvasSize ile uyumlu)

      // Main shutter drawing should fit inside the original container area (canvasHeight - extraHeight)
      const availableWidth = canvasWidth - leftPadding - rightPadding;
      const availableHeight =
        canvasHeight -
        extraHeight -
        textFontSize -
        textPadding * 2 -
        topBottomPadding * 2;

      // Çizimi, canvas'ın altına metin için boşluk bırakacak şekilde dikeyde ortala
      const canvasScale = Math.min(
        availableWidth / scaledWidth,
        availableHeight / scaledHeight
      );
      const finalWidth = scaledWidth * canvasScale;
      const finalHeight = scaledHeight * canvasScale;
      // Padding'i uygula ve ortala (sol ve sağ tarafta daha fazla boşluk bırakarak)
      const x = leftPadding + (availableWidth - finalWidth) / 2;
      // y: main drawing is centered in the area above the extraHeight
      const y = (canvasHeight - extraHeight - finalHeight) / 2;

      // Draw shutter-like visualization
      const motorHeight = Math.min(80, finalHeight * 0.2); // Maksimum sınırı 80'e çıkardık ve yüzdeyi %20'ye çıkardık
      const remainingHeight = finalHeight - motorHeight;

      // --- Lameller için minimum yükseklik kontrolü ---
      const MIN_LAMEL_HEIGHT = 14; // px (daha görünür olması için artırıldı)
      let numberOfLamels = lamelCount;
      let adjustedLamelHeight = remainingHeight / numberOfLamels;
      if (adjustedLamelHeight < MIN_LAMEL_HEIGHT) {
        numberOfLamels = Math.max(
          1,
          Math.floor(remainingHeight / MIN_LAMEL_HEIGHT)
        );
        adjustedLamelHeight = remainingHeight / numberOfLamels;
      }

      // Draw inner frame (en dıştaki çerçeve, alt parçayı da kapsayacak şekilde)
      // En dıştaki çerçeve kaldırıldı

      // Draw kutu (üstteki alan)
      ctx.fillStyle = boxColor || colors.frameBackground;
      ctx.fillRect(x, y, finalWidth, motorHeight);

      // --- Hareket bağlantı kutusu (motor kutusunun içinde) ---
      const connectionBoxWidth = Math.max(30, finalWidth * 0.15); // %15 genişlik, min 30px
      const connectionBoxHeight = motorHeight * 0.6; // kutu yüksekliğinin %60'i
      const connectionBoxY = y + (motorHeight - connectionBoxHeight) / 2; // dikeyde ortala
      const margin = 10; // kenarlardan boşluk

      let connectionBoxX = 0;
      if (hareketBaglanti === "sag") {
        // Motor kutusunun sağ tarafında
        connectionBoxX = x + finalWidth - connectionBoxWidth - margin;
      } else {
        // Motor kutusunun sol tarafında
        connectionBoxX = x + margin;
      }

      // Hareket bağlantı kutusunu çiz
      ctx.fillStyle = theme === "dark" ? "#374151" : "#f3f4f6"; // Farklı arka plan rengi
      ctx.fillRect(
        connectionBoxX,
        connectionBoxY,
        connectionBoxWidth,
        connectionBoxHeight
      );

      // Kutu çerçevesi
      ctx.strokeStyle = dikmeColor || colors.frameBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        connectionBoxX,
        connectionBoxY,
        connectionBoxWidth,
        connectionBoxHeight
      );

      // Hareket tipi yazısı (K veya M)
      ctx.fillStyle = colors.text;
      ctx.font = `${Math.max(
        10,
        connectionBoxHeight * 0.4
      )}px 'Noto Sans', 'Arial', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const movementText = movementType === "manuel" ? "K" : "M";
      ctx.fillText(
        movementText,
        connectionBoxX + connectionBoxWidth / 2,
        connectionBoxY + connectionBoxHeight / 2
      );
      // --- Dikey dikmeler (kutudan sonra başlasın, daha ince) ---
      const dikmeWidth = Math.max(8, finalWidth * 0.03); // min 8px, %3 genişlik
      // Orta dikmelerin ve sectionLamels'ın koordinatlarını topla
      const middleBarArr: { x: number; width: number; index: number }[] = [];
      // Only collect dikme positions here, draw dikme after lamels and alt parça
      if (seperation > 1) {
        const totalSections = seperation;
        const sectionWidth = (finalWidth - dikmeWidth * 2) / totalSections;
        const positions: number[] =
          middleBarPositions.length === seperation - 1
            ? middleBarPositions
            : Array.from({ length: seperation - 1 }, (_, i) =>
                Math.round((width / seperation) * (i + 1))
              );
        const xPositions: number[] = [0, ...middleBarPositions, width].map(
          (mm) => x + (mm / width) * finalWidth
        );
        for (let i = 0; i < totalSections; i++) {
          sectionLamels.push({
            left: xPositions[i],
            right: xPositions[i + 1],
            top: y + motorHeight,
            bottom: y + motorHeight + remainingHeight,
            index: i,
          });
        }
        sectionLamelArrRef.current = sectionLamels;
        // Collect dikme positions
        middleBarArr.push({ x: x, width: dikmeWidth, index: 0 });
        for (let i = 1; i < seperation; i++) {
          let dikmeX;
          if (middleBarPositions.length === seperation - 1) {
            dikmeX =
              x + (positions[i - 1] / width) * finalWidth - dikmeWidth / 2;
          } else {
            dikmeX = x + dikmeWidth + sectionWidth * i - dikmeWidth / 2;
          }
          middleBarArr.push({ x: dikmeX, width: dikmeWidth, index: i });
        }
        middleBarArr.push({
          x: x + finalWidth - dikmeWidth,
          width: dikmeWidth,
          index: seperation,
        });
      } else {
        // Tek bölme: sol ve sağ dikme
        middleBarArr.push({ x: x, width: dikmeWidth, index: 0 });
        middleBarArr.push({
          x: x + finalWidth - dikmeWidth,
          width: dikmeWidth,
          index: 1,
        });
      }
      middleBarArrRef.current = middleBarArr;

      // --- Lamellerin genişliği kutudan biraz az olacak (dikmelerin arasında kalacak) ---
      // Her bölmeyi ayrı çiz
      if (seperation > 1 && sectionLamels.length === seperation) {
        for (let sectionIdx = 0; sectionIdx < seperation; sectionIdx++) {
          const section = sectionLamels[sectionIdx];
          // Bölme yüksekliği (mm cinsinden, state'ten)
          const sectionHeightMm = sectionHeights[sectionIdx] ?? height;
          // Canvas'ta bölme yüksekliği
          const totalSectionHeightPx = section.bottom - section.top;
          // mm -> px oranı
          const mmToPx = totalSectionHeightPx / height;
          // Bu bölmenin lamel alanı yüksekliği (mm cinsinden)
          const sectionHeightPx = sectionHeightMm * mmToPx;
          // Lamel sayısı (her bölme için eşit dağıtılmış, kalan lameller son bölmeye eklenir)
          let lamelsInSection = Math.floor(lamelCount / seperation);
          if (sectionIdx === seperation - 1) {
            lamelsInSection += lamelCount % seperation;
          }
          // Her bölme için lamel yüksekliği
          let lamelHeightPx = sectionHeightPx / Math.max(1, lamelsInSection);
          if (lamelHeightPx < MIN_LAMEL_HEIGHT) {
            lamelsInSection = Math.max(
              1,
              Math.floor(sectionHeightPx / MIN_LAMEL_HEIGHT)
            );
            lamelHeightPx = sectionHeightPx / lamelsInSection;
          }
          const lamelX = section.left;
          const lamelWidth = section.right - section.left;
          for (let i = 0; i < lamelsInSection; i++) {
            const lamelY = section.top + i * lamelHeightPx;
            const lamelRealHeight = lamelHeightPx * 0.85;
            const lamelSpacing = lamelHeightPx * 0.15;
            const adjustedLamelY = lamelY + lamelSpacing / 2;
            // Guard: skip if any coordinate is not finite or width/height is invalid
            if (
              !Number.isFinite(lamelX) ||
              !Number.isFinite(lamelWidth) ||
              !Number.isFinite(adjustedLamelY) ||
              !Number.isFinite(lamelRealHeight) ||
              lamelWidth <= 0 ||
              lamelRealHeight <= 0
            ) {
              continue;
            }

            // ...existing code for drawing lamel...
            const mainGradient = ctx.createLinearGradient(
              lamelX,
              adjustedLamelY,
              lamelX,
              adjustedLamelY + lamelRealHeight
            );
            const baseColor =
              lamelColor || (theme === "dark" ? "#94a3b8" : "#e2e8f0");
            const lightColor = lamelColor
              ? lightenColor(baseColor, 0.3)
              : theme === "dark"
              ? "#cbd5e1"
              : "#f8fafc";
            const darkColor = lamelColor
              ? darkenColor(baseColor, 0.3)
              : theme === "dark"
              ? "#64748b"
              : "#94a3b8";
            mainGradient.addColorStop(0, darkColor);
            mainGradient.addColorStop(0.2, lightColor);
            mainGradient.addColorStop(0.8, lightColor);
            mainGradient.addColorStop(1, darkColor);
            ctx.fillStyle = mainGradient;
            ctx.fillRect(lamelX, adjustedLamelY, lamelWidth, lamelRealHeight);

            // ...existing code for highlight, shadow, borders, side gradients...
            const highlightOpacity = theme === "dark" ? 0.4 : 0.6;
            const highlightGradient = ctx.createLinearGradient(
              lamelX,
              adjustedLamelY,
              lamelX,
              adjustedLamelY + lamelRealHeight * 0.4
            );
            highlightGradient.addColorStop(
              0,
              `rgba(255, 255, 255, ${highlightOpacity})`
            );
            highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = highlightGradient;
            ctx.fillRect(
              lamelX,
              adjustedLamelY,
              lamelWidth,
              lamelRealHeight * 0.4
            );

            const shadowOpacity = theme === "dark" ? 0.5 : 0.3;
            const shadowGradient = ctx.createLinearGradient(
              lamelX,
              adjustedLamelY + lamelRealHeight * 0.6,
              lamelX,
              adjustedLamelY + lamelRealHeight
            );
            shadowGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
            shadowGradient.addColorStop(1, `rgba(0, 0, 0, ${shadowOpacity})`);
            ctx.fillStyle = shadowGradient;
            ctx.fillRect(
              lamelX,
              adjustedLamelY + lamelRealHeight * 0.6,
              lamelWidth,
              lamelRealHeight * 0.4
            );

            ctx.strokeStyle = darkColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(lamelX, adjustedLamelY);
            ctx.lineTo(lamelX + lamelWidth, adjustedLamelY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(lamelX, adjustedLamelY + lamelRealHeight);
            ctx.lineTo(lamelX + lamelWidth, adjustedLamelY + lamelRealHeight);
            ctx.stroke();

            const sideGradientLeft = ctx.createLinearGradient(
              lamelX,
              adjustedLamelY,
              lamelX + 8,
              adjustedLamelY
            );
            sideGradientLeft.addColorStop(
              0,
              `rgba(0, 0, 0, ${shadowOpacity * 0.5})`
            );
            sideGradientLeft.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = sideGradientLeft;
            ctx.fillRect(lamelX, adjustedLamelY, 8, lamelRealHeight);

            const sideGradientRight = ctx.createLinearGradient(
              lamelX + lamelWidth - 8,
              adjustedLamelY,
              lamelX + lamelWidth,
              adjustedLamelY
            );
            sideGradientRight.addColorStop(0, "rgba(0, 0, 0, 0)");
            sideGradientRight.addColorStop(
              1,
              `rgba(0, 0, 0, ${shadowOpacity * 0.5})`
            );
            ctx.fillStyle = sideGradientRight;
            ctx.fillRect(
              lamelX + lamelWidth - 8,
              adjustedLamelY,
              8,
              lamelRealHeight
            );
          }
        }
      } else {
        // Tek bölme (eski mantık)
        const lamelX = x + dikmeWidth;
        const lamelWidth = finalWidth - dikmeWidth * 2;
        for (let i = 0; i < numberOfLamels; i++) {
          const lamelY = y + motorHeight + i * adjustedLamelHeight;
          const lamelRealHeight = adjustedLamelHeight * 0.85;
          const lamelSpacing = adjustedLamelHeight * 0.15;
          const adjustedLamelY = lamelY + lamelSpacing / 2;
          // Guard: skip if any coordinate is not finite or width/height is invalid
          if (
            !Number.isFinite(lamelX) ||
            !Number.isFinite(lamelWidth) ||
            !Number.isFinite(adjustedLamelY) ||
            !Number.isFinite(lamelRealHeight) ||
            lamelWidth <= 0 ||
            lamelRealHeight <= 0
          ) {
            continue;
          }
          // ...existing code for drawing lamel...
          const mainGradient = ctx.createLinearGradient(
            lamelX,
            adjustedLamelY,
            lamelX,
            adjustedLamelY + lamelRealHeight
          );
          const baseColor =
            lamelColor || (theme === "dark" ? "#94a3b8" : "#e2e8f0");
          const lightColor = lamelColor
            ? lightenColor(baseColor, 0.3)
            : theme === "dark"
            ? "#cbd5e1"
            : "#f8fafc";
          const darkColor = lamelColor
            ? darkenColor(baseColor, 0.3)
            : theme === "dark"
            ? "#64748b"
            : "#94a3b8";
          mainGradient.addColorStop(0, darkColor);
          mainGradient.addColorStop(0.2, lightColor);
          mainGradient.addColorStop(0.8, lightColor);
          mainGradient.addColorStop(1, darkColor);
          ctx.fillStyle = mainGradient;
          ctx.fillRect(lamelX, adjustedLamelY, lamelWidth, lamelRealHeight);

          // ...existing code for highlight, shadow, borders, side gradients...
          const highlightOpacity = theme === "dark" ? 0.4 : 0.6;
          const highlightGradient = ctx.createLinearGradient(
            lamelX,
            adjustedLamelY,
            lamelX,
            adjustedLamelY + lamelRealHeight * 0.4
          );
          highlightGradient.addColorStop(
            0,
            `rgba(255, 255, 255, ${highlightOpacity})`
          );
          highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = highlightGradient;
          ctx.fillRect(
            lamelX,
            adjustedLamelY,
            lamelWidth,
            lamelRealHeight * 0.4
          );

          const shadowOpacity = theme === "dark" ? 0.5 : 0.3;
          const shadowGradient = ctx.createLinearGradient(
            lamelX,
            adjustedLamelY + lamelRealHeight * 0.6,
            lamelX,
            adjustedLamelY + lamelRealHeight
          );
          shadowGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
          shadowGradient.addColorStop(1, `rgba(0, 0, 0, ${shadowOpacity})`);
          ctx.fillStyle = shadowGradient;
          ctx.fillRect(
            lamelX,
            adjustedLamelY + lamelRealHeight * 0.6,
            lamelWidth,
            lamelRealHeight * 0.4
          );

          ctx.strokeStyle = darkColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lamelX, adjustedLamelY);
          ctx.lineTo(lamelX + lamelWidth, adjustedLamelY);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(lamelX, adjustedLamelY + lamelRealHeight);
          ctx.lineTo(lamelX + lamelWidth, adjustedLamelY + lamelRealHeight);
          ctx.stroke();

          const sideGradientLeft = ctx.createLinearGradient(
            lamelX,
            adjustedLamelY,
            lamelX + 8,
            adjustedLamelY
          );
          sideGradientLeft.addColorStop(
            0,
            `rgba(0, 0, 0, ${shadowOpacity * 0.5})`
          );
          sideGradientLeft.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = sideGradientLeft;
          ctx.fillRect(lamelX, adjustedLamelY, 8, lamelRealHeight);

          const sideGradientRight = ctx.createLinearGradient(
            lamelX + lamelWidth - 8,
            adjustedLamelY,
            lamelX + lamelWidth,
            adjustedLamelY
          );
          sideGradientRight.addColorStop(0, "rgba(0, 0, 0, 0)");
          sideGradientRight.addColorStop(
            1,
            `rgba(0, 0, 0, ${shadowOpacity * 0.5})`
          );
          ctx.fillStyle = sideGradientRight;
          ctx.fillRect(
            lamelX + lamelWidth - 8,
            adjustedLamelY,
            8,
            lamelRealHeight
          );
        }
      }

      // DİKMELERİ lamellerin üstünde çiz (sadece bir kez, yukarıda yapıldı)

      // Renkleri açma/koyulaştırma yardımcı fonksiyonları
      function lightenColor(color: string, amount: number): string {
        if (color.startsWith("#")) {
          const hex = color.slice(1);
          const num = parseInt(hex, 16);
          const r = Math.min(
            255,
            Math.floor((num >> 16) + (255 - (num >> 16)) * amount)
          );
          const g = Math.min(
            255,
            Math.floor(
              ((num >> 8) & 0x00ff) + (255 - ((num >> 8) & 0x00ff)) * amount
            )
          );
          const b = Math.min(
            255,
            Math.floor((num & 0x0000ff) + (255 - (num & 0x0000ff)) * amount)
          );
          return `rgb(${r}, ${g}, ${b})`;
        }
        return color;
      }

      function darkenColor(color: string, amount: number): string {
        if (color.startsWith("#")) {
          const hex = color.slice(1);
          const num = parseInt(hex, 16);
          const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
          const g = Math.max(
            0,
            Math.floor(((num >> 8) & 0x00ff) * (1 - amount))
          );
          const b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - amount)));
          return `rgb(${r}, ${g}, ${b})`;
        }
        return color;
      }

      // Alt parça (bottom part) çizimi - lamellerin üstünde olacak şekilde
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = subPartColor || colors.lamelDark;
      if (seperation > 1 && sectionLamels.length === seperation) {
        // Her bölmenin altına kendi alt parçasını çiz
        for (let sectionIdx = 0; sectionIdx < seperation; sectionIdx++) {
          const section = sectionLamels[sectionIdx];
          const lamelX = section.left;
          const lamelWidth = section.right - section.left;
          // Bölme yüksekliği (mm cinsinden, state'ten)
          const sectionHeightMm = sectionHeights[sectionIdx] ?? height;
          const totalSectionHeightPx = section.bottom - section.top;
          const mmToPx = totalSectionHeightPx / height;
          const sectionHeightPx = sectionHeightMm * mmToPx;
          // Alt parça yüksekliği (mm'ye göre ölçekli)
          let altParcaHeight = 18;
          if (sectionHeights[sectionIdx]) {
            altParcaHeight = Math.max(14, Math.round(18 * mmToPx));
          }
          // Alt parça sectionHeightPx'in en altına çizilecek
          const altParcaY = section.top + sectionHeightPx - altParcaHeight;
          ctx.fillRect(lamelX, altParcaY, lamelWidth, altParcaHeight);
        }
      } else {
        // Tek bölme için alt parça
        const lamelX = x + dikmeWidth;
        const lamelWidth = finalWidth - dikmeWidth * 2;
        let altParcaHeight = 18;
        if (height) {
          const totalSectionHeightPx = finalHeight - motorHeight;
          const mmToPx = totalSectionHeightPx / height;
          altParcaHeight = Math.max(14, Math.round(18 * mmToPx));
        }
        const altParcaY =
          y + motorHeight + (finalHeight - motorHeight) - altParcaHeight;
        ctx.fillRect(lamelX, altParcaY, lamelWidth, altParcaHeight);
      }
      ctx.restore();

      // DİKMELERİ lamellerin ve alt parçanın üstünde çiz (her zaman en son, üstte olacak şekilde)
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = dikmeColor || colors.frame;
      // For each dikme, dikme yüksekliği tam olarak sectionHeightPx (alt parça dahil, ama ekstra eklenmeden)
      if (seperation > 1 && sectionLamels.length === seperation) {
        for (let i = 0; i < middleBarArrRef.current.length; i++) {
          const bar = middleBarArrRef.current[i];
          const dikmeTop = y + motorHeight;
          let dikmeHeight = 0;
          if (i === 0) {
            // Leftmost dikme: ilk bölmenin yüksekliği
            const section = sectionLamels[0];
            const sectionHeightMm = sectionHeights[0] ?? height;
            const totalSectionHeightPx = section.bottom - section.top;
            const mmToPx = totalSectionHeightPx / height;
            dikmeHeight = sectionHeightMm * mmToPx;
          } else if (i === middleBarArrRef.current.length - 1) {
            // Rightmost dikme: son bölmenin yüksekliği
            const section = sectionLamels[sectionLamels.length - 1];
            const sectionHeightMm =
              sectionHeights[sectionLamels.length - 1] ?? height;
            const totalSectionHeightPx = section.bottom - section.top;
            const mmToPx = totalSectionHeightPx / height;
            dikmeHeight = sectionHeightMm * mmToPx;
          } else {
            // Orta dikme: sol ve sağındaki bölmelerin max yüksekliği
            const leftSection = sectionLamels[i - 1];
            const rightSection = sectionLamels[i];
            const leftHeightMm = sectionHeights[leftSection.index] ?? height;
            const rightHeightMm = sectionHeights[rightSection.index] ?? height;
            const leftTotalPx = leftSection.bottom - leftSection.top;
            const rightTotalPx = rightSection.bottom - rightSection.top;
            const leftMmToPx = leftTotalPx / height;
            const rightMmToPx = rightTotalPx / height;
            const leftPx = leftHeightMm * leftMmToPx;
            const rightPx = rightHeightMm * rightMmToPx;
            dikmeHeight = Math.max(leftPx, rightPx);
          }
          ctx.fillRect(bar.x, dikmeTop, bar.width, dikmeHeight);
        }
      } else {
        // Tek bölme: sol ve sağ dikme tam yükseklik (alt parça dahil, ekstra eklenmeden)
        const dikmeHeight = finalHeight - motorHeight;
        for (const bar of middleBarArrRef.current) {
          ctx.fillRect(bar.x, y + motorHeight, bar.width, dikmeHeight);
        }
      }
      ctx.restore();

      // Bölme genişliklerini panjurun altına bracket ve metinle göster
      if (seperation > 1 && sectionLamels.length === seperation) {
        // En uzun section'ın alt kenarını (alt parça dahil) bul
        let maxSectionBottom = 0;
        for (let sectionIdx = 0; sectionIdx < seperation; sectionIdx++) {
          const section = sectionLamels[sectionIdx];
          if (!section) continue;
          const sectionHeightMm = sectionHeights[sectionIdx] ?? height;
          const totalSectionHeightPx = section.bottom - section.top;
          const mmToPx = totalSectionHeightPx / height;
          const sectionHeightPx = sectionHeightMm * mmToPx;
          const sectionBottom = section.top + sectionHeightPx;
          if (sectionBottom > maxSectionBottom) {
            maxSectionBottom = sectionBottom;
          }
        }
        const totalSections = seperation;
        const bracketYOffset = 8; // az bir boşluk bırakmak için
        const bracketYNew = maxSectionBottom + bracketYOffset;
        ctx.save();
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 1;
        ctx.font = "13px 'Noto Sans', 'Arial', sans-serif";
        ctx.fillStyle = colors.text;
        ctx.textAlign = "center";

        // mm pozisyonlarını topla: sol dikme, orta dikmeler, sağ dikme
        // Canvas x koordinatlarını bul
        const positions: number[] = [0, ...middleBarPositions, width];
        // Canvas x koordinatları
        const xPositions: number[] = positions.map(
          (mm) => x + (mm / width) * finalWidth
        );

        for (let i = 0; i < totalSections; i++) {
          // Her bracket: xPositions[i] ile xPositions[i+1] arası
          const left = xPositions[i];
          const right = xPositions[i + 1];
          // Bracket çiz (yatay)
          ctx.beginPath();
          // Sol dikey
          ctx.moveTo(left, bracketYNew - 7);
          ctx.lineTo(left, bracketYNew + 7);
          // Yatay
          ctx.moveTo(left, bracketYNew);
          ctx.lineTo(right, bracketYNew);
          // Sağ dikey
          ctx.moveTo(right, bracketYNew - 7);
          ctx.lineTo(right, bracketYNew + 7);
          ctx.stroke();
          // Metin (bölme genişliği): iki dikme arası mm (sadece dikme konumundan hesaplanır)
          const bolmeGenislik = Math.round(positions[i + 1] - positions[i]);
          // Ölçü değeri üstte, "mm" altta olacak şekilde iki satır yaz
          ctx.save();
          ctx.textAlign = "center";
          ctx.font = "13px 'Noto Sans', 'Arial', sans-serif";
          ctx.fillText(
            `${bolmeGenislik}`,
            (left + right) / 2,
            bracketYNew + 13
          );
          ctx.fillText("mm", (left + right) / 2, bracketYNew + 27);
          ctx.restore();
        }
        ctx.restore();
      }

      // Add dimensions text
      ctx.fillStyle = colors.text;
      ctx.font = "14px 'Noto Sans', 'Arial', sans-serif";
      ctx.textAlign = "center";

      // Width text (artık üstte, kutunun üstüne ortalanmış)
      ctx.fillText(`${systemWidth} mm`, x + finalWidth / 2, y - 25);

      // --- Üst genişlik için bracket çiz (yatay) ---
      ctx.save();
      ctx.strokeStyle = "#64748b"; // koyu gri bracket
      ctx.lineWidth = 1;
      // Yatay bracket fonksiyonu
      function drawHorizontalBracket(
        ctx: CanvasRenderingContext2D,
        x1: number,
        x2: number,
        y: number,
        height: number
      ) {
        // x1: sol, x2: sağ, y: yatay çizgi seviyesi, height: bracket yüksekliği
        const shortLine = height * 0.8;
        ctx.beginPath();
        // Sol dikey çizgi
        ctx.moveTo(x1, y - shortLine / 2);
        ctx.lineTo(x1, y + shortLine / 2);
        // Yatay çizgi
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        // Sağ dikey çizgi
        ctx.moveTo(x2, y - shortLine / 2);
        ctx.lineTo(x2, y + shortLine / 2);
        ctx.stroke();
      }
      // Bracket'ı kutunun üstüne, width yazısının hemen altına çiz
      drawHorizontalBracket(
        ctx,
        x,
        x + finalWidth,
        y - 12, // bracket pozisyonunu biraz yukarı al
        18
      );
      ctx.restore();

      // --- Sağda ve solda toplam yükseklik için bracket ve metin (en uzun section'a kadar) ---
      // En uzun section'ın alt kenarını (alt parça dahil) bul
      let maxSectionBottom = 0;
      for (let sectionIdx = 0; sectionIdx < seperation; sectionIdx++) {
        const section = sectionLamels[sectionIdx];
        if (!section) continue;
        const sectionHeightMm = sectionHeights[sectionIdx] ?? height;
        const totalSectionHeightPx = section.bottom - section.top;
        const mmToPx = totalSectionHeightPx / height;
        const sectionHeightPx = sectionHeightMm * mmToPx;
        const sectionBottom = section.top + sectionHeightPx;
        if (sectionBottom > maxSectionBottom) {
          maxSectionBottom = sectionBottom;
        }
      }
      const rightBracketOffset = 4;
      // Sağ bracket (dikey), tüm panjurun yüksekliği kadar (kutu dahil)
      ctx.save();
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1;
      drawVerticalBracket(
        ctx,
        x + finalWidth + rightBracketOffset,
        y,
        y + finalHeight,
        18
      );
      ctx.restore();

      // Soldaki 2. bracket: en uzun bölme yüksekliği - motor yüksekliği kadar olmalı
      // Sadece çoklu bölmede (seperation > 1) bu bracket'ı çiz
      if (seperation > 1) {
        ctx.save();
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 1;
        drawVerticalBracket(ctx, x - 18, y + motorHeight, maxSectionBottom, 18);
        ctx.restore();
      }

      // Toplam yükseklik metni (sağda, ortalanmış, dikey ve ters, en uzun section'a ortalı, iki satır)
      // Sağdaki yükseklik metni: bracket'ın tam ortasına hizala (tekli panjurda da tam ortalı olur)
      ctx.save();
      ctx.font = "14px 'Noto Sans', 'Arial', sans-serif";
      ctx.fillStyle = colors.text;
      ctx.textAlign = "center";
      // Bracket'ın tam ortasını bul: y ile y+finalHeight arası
      const rightBracketCenterY = y + finalHeight / 2;
      ctx.translate(
        x + finalWidth + rightBracketOffset + 28,
        rightBracketCenterY
      );
      ctx.rotate(Math.PI / 2);
      ctx.fillText(`${systemHeight}`, 0, -6);
      ctx.fillText("mm", 0, 6);
      ctx.restore();

      // Kutu yüksekliği ve kalan yükseklik için ayrı ölçü yazısı ve çizgileri
      if (boxHeight && systemHeight > 0) {
        // --- Kutu yüksekliği için bracket çiz ---
        ctx.save();
        ctx.strokeStyle = "#64748b"; // yatay bracket ile aynı renk
        ctx.lineWidth = 1;
        drawVerticalBracket(ctx, x - 18, y, y + motorHeight, 18);
        ctx.restore();

        // Kutu kısmının ortasına kutu yüksekliği metni (iki satır)
        ctx.save();
        ctx.font = "12px 'Noto Sans', 'Arial', sans-serif";
        ctx.fillStyle = colors.text;
        ctx.textAlign = "center";
        ctx.translate(x - 35, y + motorHeight / 2);
        ctx.rotate(-Math.PI / 2);
        // İki satır halinde yaz
        ctx.fillText(`${boxHeight}`, 0, -6); // Üst satır (sayı)
        ctx.fillText("mm", 0, 6); // Alt satır (birim)
        ctx.restore();

        // --- Kalan yükseklik için bracket çiz ---
        const kalanYukseklik = systemHeight - boxHeight;
        if (kalanYukseklik > 0) {
          ctx.save();
          ctx.strokeStyle = "#64748b"; // yatay bracket ile aynı renk
          ctx.lineWidth = 1;
          // Kalan yükseklik bracket'ı panjurun alt kenarına hizalı
          drawVerticalBracket(
            ctx,
            x - 18,
            y + motorHeight,
            y + finalHeight,
            18
          );
          ctx.restore();

          // Kalan yükseklik metni (iki satır)
          ctx.save();
          ctx.font = "12px 'Noto Sans', 'Arial', sans-serif";
          ctx.fillStyle = colors.text;
          ctx.textAlign = "center";
          ctx.translate(
            x - 35,
            y + motorHeight + (finalHeight - motorHeight) / 2
          );
          ctx.rotate(-Math.PI / 2);
          // İki satır halinde yaz
          ctx.fillText(`${kalanYukseklik}`, 0, -6); // Üst satır (sayı)
          ctx.fillText("mm", 0, 6); // Alt satır (birim)
          ctx.restore();
        }
      }

      // --- Bracket (süslü parantez) fonksiyonu ---
      function drawVerticalBracket(
        ctx: CanvasRenderingContext2D,
        x: number,
        y1: number,
        y2: number,
        width: number
      ) {
        // y1: üst, y2: alt, x: bracket'ın sol noktası, width: bracket genişliği
        // Bu bracket, görseldeki gibi üstte ve altta kısa yatay çizgi, ortada uzun dikey çizgi şeklinde olacak
        // const h = y2 - y1; // unused
        const shortLine = width * 0.8; // kısa yatay çizgi uzunluğu
        ctx.beginPath();
        // Üst yatay çizgi
        ctx.moveTo(x, y1);
        ctx.lineTo(x + shortLine, y1);
        // Dikey çizgi
        ctx.moveTo(x + shortLine / 2, y1);
        ctx.lineTo(x + shortLine / 2, y2);
        // Alt yatay çizgi
        ctx.moveTo(x, y2);
        ctx.lineTo(x + shortLine, y2);
        ctx.stroke();
      }
    },
    [
      theme,
      lamelColor,
      boxColor,
      subPartColor,
      dikmeColor,
      boxHeight,
      hareketBaglanti,
      movementType,
      lamelCount,
      seperation,
      middleBarPositions,
      sectionHeights,
      systemHeight,
      systemWidth,
    ]
  );

  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    // Alt bracket ve metinler için ekstra alan ekle
    const extraHeight = 40;
    const containerHeight = containerRect.height + extraHeight;

    // Set canvas size to match container (yükseklik artırıldı)
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    drawShutter(canvas, width, height, containerWidth, containerHeight);
  }, [width, height, drawShutter]);

  // Canvas'a tıklama olayı ekle (doğrudan component gövdesinde)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      // Orta dikmelerin alanında mı? (sadece orta dikmeler: index > 0 ve index < last)
      if (changeMiddlebarPostion) {
        const bars = middleBarArrRef.current;
        for (const bar of bars) {
          // Skip first and last dikme (index 0 and last)
          if (bar.index === 0 || bar.index === bars.length - 1) continue;
          const container = containerRef.current;
          if (!container) continue;
          const containerHeight = canvas.height;
          const dikmeTop = 60;
          const dikmeBottom = containerHeight - 60;
          if (
            clickX >= bar.x &&
            clickX <= bar.x + bar.width &&
            clickY >= dikmeTop &&
            clickY <= dikmeBottom
          ) {
            setSelectedBar({ x: bar.x, index: bar.index, value: null });
            setInputValue("");
            return;
          }
        }
      }
      // Bölme lamel alanına tıklama (yükseklik inputu)
      if (sectionLamelArrRef.current) {
        for (const section of sectionLamelArrRef.current) {
          if (
            clickX >= section.left &&
            clickX <= section.right &&
            clickY >= section.top &&
            clickY <= section.bottom
          ) {
            setSelectedSection({
              left: section.left,
              right: section.right,
              index: section.index,
              value: sectionHeights[section.index] ?? null,
            });
            setInputValue(sectionHeights[section.index]?.toString() ?? "");
            return;
          }
        }
      }
    };
    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("click", handleClick);
    };
  }, [changeMiddlebarPostion, sectionHeights, middleBarPositions]);
  // Bölme yüksekliği input submit
  const handleSectionHeightSubmit = (
    e: React.FormEvent | React.KeyboardEvent | React.MouseEvent
  ) => {
    if (e) e.preventDefault?.();
    if (!selectedSection) return;
    let val = parseInt(inputValue);
    if (!isNaN(val) && val > 0) {
      // Eğer girilen yükseklik genel yüksekse, genel yüksekliğe eşitle
      if (val > height) {
        val = height;
      }
      const arr = [...sectionHeights];
      arr[selectedSection.index] = val;
      dispatch(setSectionHeights(arr));
      setSelectedSection(null);
    }
  };

  // Input submit işlemi
  const handleInputSubmit = (
    e: React.FormEvent | React.KeyboardEvent | React.MouseEvent
  ) => {
    if (e) e.preventDefault?.();
    if (!selectedBar) return;
    const val = parseInt(inputValue);
    if (!isNaN(val) && val > 0 && val < width) {
      // Pozisyonu güncelle
      const arr = [...middleBarPositions];
      arr[selectedBar.index - 1] = val;
      dispatch(setMiddleBarPositions(arr));
      setSelectedBar(null);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    resizeObserver.observe(container);
    updateCanvasSize(); // Initial draw

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateCanvasSize, middleBarPositions]);

  // Dışarı tıklama ile overlay'i kapatma
  useEffect(() => {
    if (!selectedBar && !selectedSection) return;
    function handleClickOutside(e: MouseEvent) {
      const barOverlay = document.getElementById("middle-bar-input-overlay");
      const sectionOverlay = document.getElementById(
        "section-height-input-overlay"
      );
      if (
        (barOverlay && !barOverlay.contains(e.target as Node)) ||
        (sectionOverlay && !sectionOverlay.contains(e.target as Node))
      ) {
        setSelectedBar(null);
        setSelectedSection(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedBar, selectedSection]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full grid place-items-center bg-background ${className}`}
      style={{ position: "relative" }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Orta dikme input overlay */}
      {selectedBar && (
        <Card
          id="middle-bar-input-overlay"
          style={{
            position: "absolute",
            left: selectedBar.x,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            background: "white",
            border: "1px solid #64748b",
            borderRadius: 6,
            padding: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Genişlik (mm)"
              style={{ width: 100, fontSize: 15 }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInputSubmit(e);
                }
              }}
            />
            <button
              type="button"
              style={{
                padding: "4px 12px",
                fontSize: 14,
                background: "#64748b",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
              onClick={handleInputSubmit}
            >
              OK
            </button>
          </div>
        </Card>
      )}
      {/* Bölme yüksekliği input overlay */}
      {selectedSection && (
        <Card
          id="section-height-input-overlay"
          style={{
            position: "absolute",
            left: (selectedSection.left + selectedSection.right) / 2,
            top: "80%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            background: "white",
            border: "1px solid #64748b",
            borderRadius: 6,
            padding: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Input
              type="number"
              value={inputValue}
              placeholder="Yükseklik (mm)"
              onChange={(e) => setInputValue(e.target.value)}
              style={{ width: 100, fontSize: 15 }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSectionHeightSubmit(e);
                }
              }}
            />
            <button
              type="button"
              style={{
                padding: "4px 12px",
                fontSize: 14,
                background: "#64748b",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
              onClick={handleSectionHeightSubmit}
            >
              OK
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
