"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGlobalState } from "@/contexts/global-state";
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
}: ShutterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Global state'den middleBarPositions ve setter'ı al
  const { middleBarPositions, setMiddleBarPositions } = useGlobalState();

  // seperation veya width değiştiğinde middleBarPositions'ı eşit aralıklı olarak güncelle
  useEffect(() => {
    if (seperation > 1) {
      setMiddleBarPositions(
        Array.from({ length: seperation - 1 }, (_, i) =>
          Math.round((width / seperation) * (i + 1))
        )
      );
    } else {
      setMiddleBarPositions([]);
    }
  }, [seperation, width, setMiddleBarPositions]);
  const [selectedBar, setSelectedBar] = useState<{
    x: number;
    index: number;
    value: number | null;
  } | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  // Canvas koordinatlarını tutmak için ref
  const middleBarArrRef = useRef<{ x: number; width: number; index: number }[]>(
    []
  );
  const drawShutter = useCallback(
    (
      canvas: HTMLCanvasElement,
      width: number,
      height: number,
      canvasWidth: number,
      canvasHeight: number
    ) => {
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
      ctx.strokeStyle = theme === "dark" ? "#94a3b8" : "#475569";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, finalWidth, finalHeight + adjustedLamelHeight);

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
      // ...lamel çizimi kodu...

      // Lamellerin genişliği kutudan biraz az olacak (dikmelerin arasında kalacak)
      const lamelX = x + dikmeWidth;
      const lamelWidth = finalWidth - dikmeWidth * 2;
      for (let i = 0; i < numberOfLamels; i++) {
        const lamelY = y + motorHeight + i * adjustedLamelHeight;

        // Lamel arası boşluk için biraz daha küçük lamel yüksekliği
        const lamelRealHeight = adjustedLamelHeight * 0.85; // %15 boşluk bırak
        const lamelSpacing = adjustedLamelHeight * 0.15;
        const adjustedLamelY = lamelY + lamelSpacing / 2;

        // Ana lamel gövdesi için daha belirgin gradient
        const mainGradient = ctx.createLinearGradient(
          lamelX,
          adjustedLamelY,
          lamelX,
          adjustedLamelY + lamelRealHeight
        );

        // Daha belirgin renk geçişleri
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

        // Ana lamel gövdesi
        ctx.fillStyle = mainGradient;
        ctx.fillRect(lamelX, adjustedLamelY, lamelWidth, lamelRealHeight);

        // Üst highlight (daha belirgin)
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
        ctx.fillRect(lamelX, adjustedLamelY, lamelWidth, lamelRealHeight * 0.4);

        // Alt gölge (daha belirgin)
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

        // Lamel kenarlıkları (üst ve alt)
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 1;

        // Üst kenarlık
        ctx.beginPath();
        ctx.moveTo(lamelX, adjustedLamelY);
        ctx.lineTo(lamelX + lamelWidth, adjustedLamelY);
        ctx.stroke();

        // Alt kenarlık
        ctx.beginPath();
        ctx.moveTo(lamelX, adjustedLamelY + lamelRealHeight);
        ctx.lineTo(lamelX + lamelWidth, adjustedLamelY + lamelRealHeight);
        ctx.stroke();

        // Yan gölgeler (3D efekti için)
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

      // DİKMELERİ lamellerin üstünde çiz
      ctx.fillStyle = dikmeColor || colors.frameBorder;
      // Sol dikme
      ctx.fillRect(
        x,
        y + motorHeight,
        dikmeWidth,
        finalHeight + adjustedLamelHeight - motorHeight
      );
      // Sağ dikme
      ctx.fillRect(
        x + finalWidth - dikmeWidth,
        y + motorHeight,
        dikmeWidth,
        finalHeight + adjustedLamelHeight - motorHeight
      );

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
      // Alt parça da aynı şekilde dikmelerin arasında olmalı

      ctx.fillStyle = subPartColor || colors.lamelDark;
      ctx.fillRect(
        lamelX,
        y + motorHeight + numberOfLamels * adjustedLamelHeight,
        lamelWidth,
        adjustedLamelHeight
      );

      // DİKKAT: Orta dikmeleri alt parçadan sonra çiz
      ctx.fillStyle = dikmeColor || colors.frameBorder;
      const dikmeHeight = finalHeight + adjustedLamelHeight - motorHeight;
      // Orta dikmelerin koordinatlarını topla
      const middleBarArr: { x: number; width: number; index: number }[] = [];
      if (seperation > 1) {
        const totalSections = seperation;
        const sectionWidth = (finalWidth - dikmeWidth * 2) / totalSections;
        // Eğer pozisyonlar state'te varsa onları kullan, yoksa eşit aralıkla çiz
        const positions: number[] =
          middleBarPositions.length === seperation - 1
            ? middleBarPositions
            : Array.from({ length: seperation - 1 }, (_, i) =>
                Math.round((width / seperation) * (i + 1))
              );
        // Her pozisyonu mm'den canvas x koordinatına çevir
        for (let i = 1; i < seperation; i++) {
          let dikmeX;
          if (middleBarPositions.length === seperation - 1) {
            // mm -> canvas koordinatı
            dikmeX =
              x + (positions[i - 1] / width) * finalWidth - dikmeWidth / 2;
          } else {
            dikmeX = x + dikmeWidth + sectionWidth * i - dikmeWidth / 2;
          }
          ctx.fillRect(dikmeX, y + motorHeight, dikmeWidth, dikmeHeight);
          middleBarArr.push({ x: dikmeX, width: dikmeWidth, index: i });
        }
      }
      // Ref'e kaydet
      middleBarArrRef.current = middleBarArr;

      // Bölme genişliklerini panjurun altına bracket ve metinle göster
      if (seperation > 1) {
        const totalSections = seperation;
        const bracketYOffset = 12;
        const bracketYNew =
          y + finalHeight + adjustedLamelHeight + bracketYOffset;
        ctx.save();
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 3;
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
          // Metin (bölme genişliği): iki dikme arası mm
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
      ctx.fillText(`${width} mm`, x + finalWidth / 2, y - 25);

      // --- Üst genişlik için bracket çiz (yatay) ---
      ctx.save();
      ctx.strokeStyle = "#64748b"; // koyu gri bracket
      ctx.lineWidth = 3;
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
        y - 17, // bracket pozisyonunu da ayarla
        18
      );
      ctx.restore();

      // --- Sağda toplam yükseklik için bracket ve metin (alt parça dahil, çizime yakın) ---
      const rightBracketOffset = 4; // bracket ve yazı için çizime yakınlık (daha küçük değer daha yakın)
      ctx.save();
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 3;
      // Sağ bracket (dikey), alt parça dahil
      drawVerticalBracket(
        ctx,
        x + finalWidth + rightBracketOffset, // sağdan daha yakın
        y,
        y + finalHeight + adjustedLamelHeight,
        18
      );
      ctx.restore();

      // Toplam yükseklik metni (sağda, ortalanmış, dikey ve ters, çizime yakın, iki satır)
      ctx.save();
      ctx.font = "14px 'Noto Sans', 'Arial', sans-serif";
      ctx.fillStyle = colors.text;
      ctx.textAlign = "center";
      ctx.translate(
        x + finalWidth + rightBracketOffset + 28,
        y + (finalHeight + adjustedLamelHeight) / 2
      );
      ctx.rotate(Math.PI / 2); // ters çevir
      ctx.fillText(`${height}`, 0, -6); // Üst satır (sayı)
      ctx.fillText("mm", 0, 6); // Alt satır (birim)
      ctx.restore();

      // Kutu yüksekliği ve kalan yükseklik için ayrı ölçü yazısı ve çizgileri
      if (boxHeight && height > 0) {
        // --- Kutu yüksekliği için bracket çiz ---
        ctx.save();
        ctx.strokeStyle = "#64748b"; // yatay bracket ile aynı renk
        ctx.lineWidth = 3;
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
        const kalanYukseklik = height - boxHeight;
        if (kalanYukseklik > 0) {
          ctx.save();
          ctx.strokeStyle = "#64748b"; // yatay bracket ile aynı renk
          ctx.lineWidth = 3;
          drawVerticalBracket(
            ctx,
            x - 18,
            y + motorHeight,
            y + motorHeight + remainingHeight + adjustedLamelHeight,
            18
          );
          ctx.restore();

          // Kalan yükseklik metni (iki satır)
          ctx.save();
          ctx.font = "12px 'Noto Sans', 'Arial', sans-serif";
          ctx.fillStyle = colors.text;
          ctx.textAlign = "center";
          ctx.translate(x - 35, y + motorHeight + remainingHeight / 2);
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
    ] // seperation ve middleBarPositions eklendi
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
      // changeMiddlebarPostion false ise input açılmasın
      if (!changeMiddlebarPostion) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      // Orta dikmelerin alanında mı?
      for (const bar of middleBarArrRef.current) {
        // Yükseklik alanı: motorHeight'dan başlayıp dikmeHeight kadar
        // Yatay alan: bar.x ile bar.x + bar.width arası
        // Yükseklik için yaklaşık alanı container'dan al
        const container = containerRef.current;
        if (!container) continue;
        const containerHeight = canvas.height;
        // motorHeight ve dikmeHeight'ı tahmini al
        // Orta dikmelerin alanı: üstten 60px, alttan 60px
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
          break;
        }
      }
    };
    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("click", handleClick);
    };
  }, [changeMiddlebarPostion]);

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
      setMiddleBarPositions(arr);
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
    if (!selectedBar) return;
    function handleClickOutside(e: MouseEvent) {
      const overlay = document.getElementById("middle-bar-input-overlay");
      if (overlay && !overlay.contains(e.target as Node)) {
        setSelectedBar(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedBar]);

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
    </div>
  );
}
