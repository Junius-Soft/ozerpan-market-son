"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface ShutterPreviewProps {
  width: number;
  height: number;
  className?: string;
}

export function ShutterPreview({
  width = 1000,
  height = 1000,
  className = "",
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

      // Define colors based on theme
      const colors = {
        frame: theme === "dark" ? "#94a3b8" : "#475569",
        frameBackground: theme === "dark" ? "#64748b" : "#94a3b8",
        frameBorder: theme === "dark" ? "#94a3b8" : "#64748b",
        motor: theme === "dark" ? "#64748b" : "#475569",
        lamelLight: theme === "dark" ? "#94a3b8" : "#e2e8f0",
        lamelDark: theme === "dark" ? "#64748b" : "#94a3b8",
        text: theme === "dark" ? "#e2e8f0" : "#1e293b",
        lamelBorder: theme === "dark" ? "#94a3b8" : "#64748b",
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

      // Calculate the final scale to fit in canvas
      const canvasScale =
        Math.min(canvasWidth / scaledWidth, canvasHeight / scaledHeight) * 0.8; // 0.8 to leave some margin

      // Calculate final dimensions
      const finalWidth = scaledWidth * canvasScale;
      const finalHeight = scaledHeight * canvasScale;

      // Calculate position to center the rectangle
      const x = (canvasWidth - finalWidth) / 2;
      const y = (canvasHeight - finalHeight) / 2;

      // Draw shutter-like visualization
      const motorHeight = Math.min(40, finalHeight * 0.15);
      const remainingHeight = finalHeight - motorHeight;
      const lamelHeight = Math.min(20, remainingHeight / 15);
      const numberOfLamels = Math.floor(remainingHeight / lamelHeight);
      const adjustedLamelHeight = remainingHeight / numberOfLamels;

      // Draw outer frame
      ctx.strokeStyle = colors.frame;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 3, y - 3, finalWidth + 6, finalHeight + 6);
      ctx.fillStyle = colors.frameBackground;
      ctx.fillRect(x - 3, y - 3, finalWidth + 6, finalHeight + 6);

      // Draw inner frame
      ctx.strokeStyle = colors.frameBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, finalWidth, finalHeight);

      // Draw motor section
      const motorGradient = ctx.createLinearGradient(x, y, x, y + motorHeight);
      motorGradient.addColorStop(0, colors.frameBorder);
      motorGradient.addColorStop(0.5, colors.frameBackground);
      motorGradient.addColorStop(1, colors.frameBorder);
      ctx.fillStyle = motorGradient;
      ctx.fillRect(x, y, finalWidth, motorHeight);

      // Add motor section details
      ctx.fillStyle = colors.motor;
      ctx.fillRect(
        x + finalWidth * 0.1,
        y + motorHeight * 0.3,
        finalWidth * 0.8,
        motorHeight * 0.4
      );

      // Add motor section border
      ctx.beginPath();
      ctx.moveTo(x, y + motorHeight);
      ctx.lineTo(x + finalWidth, y + motorHeight);
      ctx.strokeStyle = colors.frame;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw lamels
      for (let i = 0; i < numberOfLamels; i++) {
        const lamelY = y + motorHeight + i * adjustedLamelHeight;

        // Create main gradient for lamel
        const mainGradient = ctx.createLinearGradient(
          x,
          lamelY,
          x,
          lamelY + adjustedLamelHeight
        );
        mainGradient.addColorStop(0, colors.lamelDark);
        mainGradient.addColorStop(0.4, colors.lamelLight);
        mainGradient.addColorStop(0.6, colors.lamelLight);
        mainGradient.addColorStop(1, colors.lamelDark);

        // Draw main lamel body
        ctx.fillStyle = mainGradient;
        ctx.fillRect(x, lamelY, finalWidth, adjustedLamelHeight);

        // Add highlight and shadow with theme-appropriate opacity
        const highlightOpacity = theme === "dark" ? "0.2" : "0.4";
        const shadowOpacity = theme === "dark" ? "0.3" : "0.1";

        // Add highlight to top edge
        const highlightGradient = ctx.createLinearGradient(
          x,
          lamelY,
          x,
          lamelY + adjustedLamelHeight * 0.3
        );
        highlightGradient.addColorStop(
          0,
          `rgba(255, 255, 255, ${highlightOpacity})`
        );
        highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = highlightGradient;
        ctx.fillRect(x, lamelY, finalWidth, adjustedLamelHeight * 0.3);

        // Add shadow to bottom edge
        const shadowGradient = ctx.createLinearGradient(
          x,
          lamelY + adjustedLamelHeight * 0.7,
          x,
          lamelY + adjustedLamelHeight
        );
        shadowGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        shadowGradient.addColorStop(1, `rgba(0, 0, 0, ${shadowOpacity})`);
        ctx.fillStyle = shadowGradient;
        ctx.fillRect(
          x,
          lamelY + adjustedLamelHeight * 0.7,
          finalWidth,
          adjustedLamelHeight * 0.3
        );

        // Draw lamel border
        ctx.beginPath();
        ctx.moveTo(x, lamelY);
        ctx.lineTo(x + finalWidth, lamelY);
        ctx.strokeStyle = colors.lamelBorder;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Add dimensions text
      ctx.fillStyle = colors.text;
      ctx.font = "bold 16px Inter";
      ctx.textAlign = "center";

      // Width text
      ctx.fillText(`${width}mm`, x + finalWidth / 2, y + finalHeight + 30);

      // Height text (rotated)
      ctx.save();
      ctx.translate(x - 25, y + finalHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${height}mm`, 0, 0);
      ctx.restore();
    },
    [theme] // theme'i dependency array'e ekledik
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
