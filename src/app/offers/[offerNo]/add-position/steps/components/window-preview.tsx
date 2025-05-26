"use client";

import { useCallback, useEffect, useRef } from "react";

interface WindowPreviewProps {
  width: number;
  height: number;
  className?: string;
}

export function WindowPreview({
  width = 1000,
  height = 1000,
  className = "",
}: WindowPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to draw the window
  const drawWindow = useCallback(
    (
      canvas: HTMLCanvasElement,
      width: number,
      height: number,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

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
      const scaleX = canvasWidth / BASE_SIZE;
      const scaleY = canvasHeight / BASE_SIZE;
      const scale = Math.min(scaleX, scaleY) * 0.8;

      // Center the window in the canvas
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;

      const finalWidth = scaledWidth * scale;
      const finalHeight = scaledHeight * scale;

      const rectX = centerX - finalWidth / 2;
      const rectY = centerY - finalHeight / 2;

      // Draw window frame
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(rectX, rectY, finalWidth, finalHeight);

      // Draw window border
      ctx.strokeStyle = "#666";
      ctx.lineWidth = Math.max(2, scale * 10);
      ctx.strokeRect(rectX, rectY, finalWidth, finalHeight);

      // Draw window glass
      ctx.fillStyle = "#add8e6";
      const glassMargin = Math.max(3, scale * 15);
      ctx.fillRect(
        rectX + glassMargin,
        rectY + glassMargin,
        finalWidth - glassMargin * 2,
        finalHeight - glassMargin * 2
      );

      // Draw window glass reflections
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(1, scale * 5);
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(rectX + glassMargin, rectY + glassMargin);
      ctx.lineTo(rectX + finalWidth - glassMargin, rectY + glassMargin);
      ctx.stroke();

      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(rectX + glassMargin, rectY + glassMargin);
      ctx.lineTo(rectX + glassMargin, rectY + finalHeight - glassMargin);
      ctx.stroke();

      ctx.globalAlpha = 1.0;
    },
    []
  );

  // Function to handle window resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Set canvas dimensions to match container
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Redraw with new dimensions
    drawWindow(canvas, width, height, canvas.width, canvas.height);
  }, [width, height, drawWindow]);

  // Initial setup and resize handling
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // Initial draw
    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [handleResize]);

  // Redraw when width or height changes
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    drawWindow(canvas, width, height, canvas.width, canvas.height);
  }, [width, height, drawWindow]);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="text-xs text-center mt-1">
        {width} x {height} cm
      </div>
    </div>
  );
}
