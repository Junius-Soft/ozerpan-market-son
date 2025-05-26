"use client";

import { useCallback, useEffect, useRef } from "react";

interface DoorPreviewProps {
  width: number;
  height: number;
  className?: string;
}

export function DoorPreview({
  width = 800,
  height = 2100,
  className = "",
}: DoorPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to draw the door
  const drawDoor = useCallback(
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
      const BASE_SIZE = 2100; // Base size for scaling (typical door height)
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

      // Center the door in the canvas
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;

      const finalWidth = scaledWidth * scale;
      const finalHeight = scaledHeight * scale;

      const rectX = centerX - finalWidth / 2;
      const rectY = centerY - finalHeight / 2;

      // Draw door frame
      ctx.fillStyle = "#8B4513"; // Wood color
      ctx.fillRect(rectX, rectY, finalWidth, finalHeight);

      // Draw door border
      ctx.strokeStyle = "#5D4037";
      ctx.lineWidth = Math.max(2, scale * 10);
      ctx.strokeRect(rectX, rectY, finalWidth, finalHeight);

      // Draw door panels
      const panelMargin = Math.max(5, scale * 20);
      const panelWidth = finalWidth - panelMargin * 2;
      const panelHeight = (finalHeight - panelMargin * 3) / 2;

      // Upper panel
      ctx.fillStyle = "#A1887F";
      ctx.fillRect(
        rectX + panelMargin,
        rectY + panelMargin,
        panelWidth,
        panelHeight
      );
      ctx.strokeRect(
        rectX + panelMargin,
        rectY + panelMargin,
        panelWidth,
        panelHeight
      );

      // Lower panel
      ctx.fillRect(
        rectX + panelMargin,
        rectY + panelMargin * 2 + panelHeight,
        panelWidth,
        panelHeight
      );
      ctx.strokeRect(
        rectX + panelMargin,
        rectY + panelMargin * 2 + panelHeight,
        panelWidth,
        panelHeight
      );

      // Draw door handle
      const handleSize = Math.max(5, scale * 15);
      const handleY = rectY + finalHeight / 2;
      ctx.fillStyle = "#FFD700"; // Gold color

      // Handle base
      ctx.beginPath();
      ctx.ellipse(
        rectX + finalWidth - handleSize * 2,
        handleY,
        handleSize,
        handleSize * 1.5,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.strokeStyle = "#5D4037";
      ctx.lineWidth = 1;
      ctx.stroke();
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
    drawDoor(canvas, width, height, canvas.width, canvas.height);
  }, [width, height, drawDoor]);

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
    drawDoor(canvas, width, height, canvas.width, canvas.height);
  }, [width, height, drawDoor]);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="text-xs text-center mt-1">
        {width} x {height} cm
      </div>
    </div>
  );
}
