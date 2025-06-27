"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface ShutterPreviewProps {
  width: number;
  height: number;
  className?: string;
  lamelColor?: string;
  boxColor?: string;
  subPartColor?: string;
  dikmeColor?: string;
}

export function ShutterPreview({
  width = 1000,
  height = 1000,
  className = "",
  lamelColor,
  boxColor,
  subPartColor,
  dikmeColor,
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
      const bottomTextY = canvasHeight - textPadding; // metin her zaman buraya yazılır
      const availableWidth = canvasWidth;
      const availableHeight = canvasHeight - textFontSize - textPadding * 2;

      // Çizimi, canvas'ın altına metin için boşluk bırakacak şekilde dikeyde ortala
      const canvasScale = Math.min(
        availableWidth / scaledWidth,
        availableHeight / scaledHeight
      );
      const finalWidth = scaledWidth * canvasScale;
      const finalHeight = scaledHeight * canvasScale;
      const x = (canvasWidth - finalWidth) / 2;
      const y = (availableHeight - finalHeight) / 2;

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
      ctx.font = "bold 16px Inter";
      ctx.textAlign = "center";

      // Width text (her zaman canvas'ın altına sabitlenmiş)
      ctx.fillText(`${width}mm`, x + finalWidth / 2, bottomTextY);

      // Height text (rotated)
      ctx.save();
      ctx.translate(Math.max(25, x - 25), y + finalHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${height}mm`, 0, 0);
      ctx.restore();
    },
    [theme, lamelColor, boxColor, subPartColor, dikmeColor] // theme'i dependency array'e ekledik
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
