"use client";

import { useCallback, useEffect, useRef } from "react";

interface InsectScreenPreviewProps {
  width: number;
  height: number;
  className?: string;
}

export function InsectScreenPreview({
  width = 600,
  height = 800,
  className = "",
}: InsectScreenPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to draw the insect screen
  const drawInsectScreen = useCallback(
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

      // Center the insect screen in the canvas
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;

      const finalWidth = scaledWidth * scale;
      const finalHeight = scaledHeight * scale;

      const rectX = centerX - finalWidth / 2;
      const rectY = centerY - finalHeight / 2;

      // Draw insect screen frame
      ctx.fillStyle = "#DDDDDD"; // Light gray for aluminum frame
      ctx.fillRect(rectX, rectY, finalWidth, finalHeight);

      // Draw screen border
      ctx.strokeStyle = "#999999";
      ctx.lineWidth = Math.max(2, scale * 8);
      ctx.strokeRect(rectX, rectY, finalWidth, finalHeight);

      // Draw insect mesh
      const meshMargin = Math.max(3, scale * 12);

      ctx.fillStyle = "#EEEEEE"; // Slightly lighter gray for the mesh
      ctx.fillRect(
        rectX + meshMargin,
        rectY + meshMargin,
        finalWidth - meshMargin * 2,
        finalHeight - meshMargin * 2
      );

      // Draw mesh pattern
      const meshSize = Math.max(1, scale * 4); // Size of mesh grid
      ctx.strokeStyle = "#CCCCCC";
      ctx.lineWidth = Math.max(0.5, scale * 0.8);

      // Vertical mesh lines
      for (
        let x = rectX + meshMargin;
        x <= rectX + finalWidth - meshMargin;
        x += meshSize
      ) {
        ctx.beginPath();
        ctx.moveTo(x, rectY + meshMargin);
        ctx.lineTo(x, rectY + finalHeight - meshMargin);
        ctx.stroke();
      }

      // Horizontal mesh lines
      for (
        let y = rectY + meshMargin;
        y <= rectY + finalHeight - meshMargin;
        y += meshSize
      ) {
        ctx.beginPath();
        ctx.moveTo(rectX + meshMargin, y);
        ctx.lineTo(rectX + finalWidth - meshMargin, y);
        ctx.stroke();
      }

      // Draw handle
      if (finalWidth > 100 * scale) {
        const handleWidth = Math.max(3, scale * 15);
        const handleHeight = Math.max(15, scale * 40);
        const handleY = rectY + finalHeight / 2 - handleHeight / 2;

        ctx.fillStyle = "#999999";
        ctx.fillRect(
          rectX + finalWidth - handleWidth - meshMargin / 2,
          handleY,
          handleWidth,
          handleHeight
        );
      }
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
    drawInsectScreen(canvas, width, height, canvas.width, canvas.height);
  }, [width, height, drawInsectScreen]);

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
    drawInsectScreen(canvas, width, height, canvas.width, canvas.height);
  }, [width, height, drawInsectScreen]);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="text-xs text-center mt-1">
        {width} x {height} cm
      </div>
    </div>
  );
}
