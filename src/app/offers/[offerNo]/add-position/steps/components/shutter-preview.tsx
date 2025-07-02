"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTheme } from "next-themes";

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
  movementType: "manuel" | "motorlu"
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
}: ShutterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Function to draw the shutter
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
      const canvasPadding = 15; // Her yönden padding (px)
      const availableWidth = canvasWidth - canvasPadding * 2;
      const availableHeight =
        canvasHeight - textFontSize - textPadding * 2 - canvasPadding * 2;

      // Çizimi, canvas'ın altına metin için boşluk bırakacak şekilde dikeyde ortala
      const canvasScale = Math.min(
        availableWidth / scaledWidth,
        availableHeight / scaledHeight
      );
      const finalWidth = scaledWidth * canvasScale;
      const finalHeight = scaledHeight * canvasScale;
      // Padding'i uygula ve ortala
      const x = (canvasWidth - finalWidth) / 2;
      const y = (canvasHeight - finalHeight) / 2;

      // Draw shutter-like visualization
      const motorHeight = Math.min(40, finalHeight * 0.15);
      const remainingHeight = finalHeight - motorHeight;
      const lamelHeight = Math.min(20, remainingHeight / 15);
      const numberOfLamels = Math.floor(remainingHeight / lamelHeight);
      const adjustedLamelHeight = remainingHeight / numberOfLamels;

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
      ctx.fillRect(connectionBoxX, connectionBoxY, connectionBoxWidth, connectionBoxHeight);
      
      // Kutu çerçevesi
      ctx.strokeStyle = dikmeColor || colors.frameBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(connectionBoxX, connectionBoxY, connectionBoxWidth, connectionBoxHeight);

      // Hareket tipi yazısı (K veya M)
      ctx.fillStyle = colors.text;
      ctx.font = `${Math.max(10, connectionBoxHeight * 0.4)}px 'Noto Sans', 'Arial', sans-serif`;
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
      // ---

      // Lamellerin genişliği kutudan biraz az olacak (dikmelerin arasında kalacak)
      const lamelX = x + dikmeWidth;
      const lamelWidth = finalWidth - dikmeWidth * 2;
      for (let i = 0; i < numberOfLamels; i++) {
        const lamelY = y + motorHeight + i * adjustedLamelHeight;

        // Create main gradient for lamel
        const mainGradient = ctx.createLinearGradient(
          lamelX,
          lamelY,
          lamelX,
          lamelY + adjustedLamelHeight
        );
        mainGradient.addColorStop(0, colors.lamelDark);
        mainGradient.addColorStop(0.4, colors.lamelLight);
        mainGradient.addColorStop(0.6, colors.lamelLight);
        mainGradient.addColorStop(1, colors.lamelDark);

        // Draw main lamel body
        ctx.fillStyle = mainGradient;
        ctx.fillRect(lamelX, lamelY, lamelWidth, adjustedLamelHeight);

        // Highlight
        const highlightOpacity = theme === "dark" ? "0.2" : "0.4";
        const highlightGradient = ctx.createLinearGradient(
          lamelX,
          lamelY,
          lamelX,
          lamelY + adjustedLamelHeight * 0.3
        );
        highlightGradient.addColorStop(
          0,
          `rgba(255, 255, 255, ${highlightOpacity})`
        );
        highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = highlightGradient;
        ctx.fillRect(lamelX, lamelY, lamelWidth, adjustedLamelHeight * 0.3);

        // Shadow
        const shadowOpacity = theme === "dark" ? "0.3" : "0.1";
        const shadowGradient = ctx.createLinearGradient(
          lamelX,
          lamelY + adjustedLamelHeight * 0.7,
          lamelX,
          lamelY + adjustedLamelHeight
        );
        shadowGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        shadowGradient.addColorStop(1, `rgba(0, 0, 0, ${shadowOpacity})`);
        ctx.fillStyle = shadowGradient;
        ctx.fillRect(
          lamelX,
          lamelY + adjustedLamelHeight * 0.7,
          lamelWidth,
          adjustedLamelHeight * 0.3
        );

        // Lamel border
        ctx.beginPath();
        ctx.moveTo(lamelX, lamelY);
        ctx.lineTo(lamelX + lamelWidth, lamelY);
        ctx.strokeStyle = colors.lamelBorder;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      // Alt parça da aynı şekilde dikmelerin arasında olmalı
      ctx.fillStyle = subPartColor || colors.lamelDark;
      ctx.fillRect(
        lamelX,
        y + motorHeight + numberOfLamels * adjustedLamelHeight,
        lamelWidth,
        adjustedLamelHeight
      );

      // Add dimensions text
      ctx.fillStyle = colors.text;
      ctx.font = "14px 'Noto Sans', 'Arial', sans-serif";
      ctx.textAlign = "center";

      // Width text (artık üstte, kutunun üstüne ortalanmış)
      ctx.fillText(`${width} mm`, x + finalWidth / 2, y - 16);

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
        y - 10, // biraz daha yukarı al
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

      // Toplam yükseklik metni (sağda, ortalanmış, dikey ve ters, çizime yakın)
      ctx.save();
      ctx.font = "14px 'Noto Sans', 'Arial', sans-serif";
      ctx.fillStyle = colors.text;
      ctx.textAlign = "center";
      ctx.translate(
        x + finalWidth + rightBracketOffset + 17,
        y + (finalHeight + adjustedLamelHeight) / 2
      );
      ctx.rotate(Math.PI / 2); // ters çevir
      ctx.fillText(`${height} mm`, 0, 0);
      ctx.restore();

      // Kutu yüksekliği ve kalan yükseklik için ayrı ölçü yazısı ve çizgileri
      if (boxHeight && height > 0) {
        // --- Kutu yüksekliği için bracket çiz ---
        ctx.save();
        ctx.strokeStyle = "#64748b"; // yatay bracket ile aynı renk
        ctx.lineWidth = 3;
        drawVerticalBracket(ctx, x - 18, y, y + motorHeight, 18);
        ctx.restore();

        // Kutu kısmının ortasına kutu yüksekliği metni
        ctx.save();
        ctx.font = "14px  'Noto Sans', 'Arial', sans-serif";
        ctx.fillStyle = colors.text;
        ctx.textAlign = "center";
        ctx.translate(x - 35, y + motorHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${boxHeight} mm`, 0, 0);
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

          // Kalan yükseklik metni
          ctx.save();
          ctx.font = "14px 'Noto Sans', 'Arial', sans-serif";
          ctx.fillStyle = colors.text;
          ctx.textAlign = "center";
          ctx.translate(x - 35, y + motorHeight + remainingHeight / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(`${kalanYukseklik} mm`, 0, 0);
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
    [theme, lamelColor, boxColor, subPartColor, dikmeColor, boxHeight, hareketBaglanti, movementType] // theme'i dependency array'e ekledik
  );

  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Set canvas size to match container
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    drawShutter(canvas, width, height, containerWidth, containerHeight);
  }, [width, height, drawShutter]);

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
  }, [updateCanvasSize]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full grid place-items-center bg-background ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
