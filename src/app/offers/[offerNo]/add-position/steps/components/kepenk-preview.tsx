"use client";

import {
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useTheme } from "next-themes";

interface KepenkPreviewProps {
  width: number;
  height: number;
  boxHeight?: number; // kutu yüksekliği (mm)
  className?: string;
  lamelType?: string;
  gozluLamelVar?: boolean;
  gozluLamelBaslangic?: number;
  gozluLamelBitis?: number;
}

export interface KepenkPreviewRef {
  exportCanvas: () => string | null;
}

export const KepenkPreview = forwardRef<
  KepenkPreviewRef,
  KepenkPreviewProps
>(
  (
    {
      width = 1000,
      height = 1000,
      boxHeight = 300,
      className = "",
      lamelType,
      gozluLamelVar = false,
      gozluLamelBaslangic = 0,
      gozluLamelBitis = 0,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();

    // Export canvas function exposed via ref
    useImperativeHandle(ref, () => ({
      exportCanvas: () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.toDataURL("image/png");
      },
    }));

    // Kepenk çizim fonksiyonu
    const drawKepenk = useCallback(
      (
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        canvasWidth: number,
        canvasHeight: number
      ) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Canvas'ı temizle
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Ölçekleme faktörleri
        const BASE_SIZE = 2000; // Base size for scaling
        const MIN_SIZE = 250; // Minimum dimension size

        // Normalize dimensions
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

        // Center the kepenk in the canvas
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;

        const finalWidth = scaledWidth * scale;
        const finalHeight = scaledHeight * scale;

        const x = centerX - finalWidth / 2;
        const y = centerY - finalHeight / 2;

        // Renkler
        const isDark = theme === "dark";
        const bgColor = isDark ? "#1a1a1a" : "#ffffff";
        const borderColor = isDark ? "#666" : "#333";
        const lamelColor = isDark ? "#888" : "#ddd";
        const gozluLamelColor = isDark ? "#4a90e2" : "#87ceeb"; // Açık mavi gözlü lamel için
        const boxColor = isDark ? "#555" : "#aaa";
        const textColor = isDark ? "#fff" : "#000";

        // Arka plan
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Kutu (üstte)
        const boxHeightScaled = (boxHeight / height) * finalHeight;
        ctx.fillStyle = boxColor;
        ctx.fillRect(x, y, finalWidth, boxHeightScaled);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, finalWidth, boxHeightScaled);

        // Dikmeler (yanlarda)
        const dikmeWidth = finalWidth * 0.05; // Dikme genişliği
        ctx.fillStyle = boxColor;
        ctx.fillRect(x, y + boxHeightScaled, dikmeWidth, finalHeight - boxHeightScaled);
        ctx.fillRect(x + finalWidth - dikmeWidth, y + boxHeightScaled, dikmeWidth, finalHeight - boxHeightScaled);
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(x, y + boxHeightScaled, dikmeWidth, finalHeight - boxHeightScaled);
        ctx.strokeRect(x + finalWidth - dikmeWidth, y + boxHeightScaled, dikmeWidth, finalHeight - boxHeightScaled);

        // Lamel alanı (kutu altı)
        const lamelAreaY = y + boxHeightScaled;
        const lamelAreaHeight = finalHeight - boxHeightScaled;

        // Gözlü lamel kontrolü
        const hasGozluLamel = gozluLamelVar && 
          gozluLamelBaslangic !== undefined && 
          gozluLamelBitis !== undefined &&
          gozluLamelBaslangic > 0 &&
          gozluLamelBitis > gozluLamelBaslangic &&
          gozluLamelBitis <= height;

        if (hasGozluLamel) {
          // Gözlü lamel bölgesi - alt parçadan yukarıya doğru hesapla
          // Başlangıç ve bitiş değerleri alt parçadan itibaren yukarıya doğru
          const altParcaHeight = finalHeight * 0.03;
          const lamelAreaBottom = y + finalHeight - altParcaHeight;
          
          // Başlangıç: alt parçadan gozluLamelBaslangic mm yukarıda (altta görünecek)
          const gozluBottomY = lamelAreaBottom - (gozluLamelBaslangic / height) * lamelAreaHeight;
          // Bitiş: alt parçadan gozluLamelBitis mm yukarıda (yukarıda görünecek)
          const gozluTopY = lamelAreaBottom - (gozluLamelBitis / height) * lamelAreaHeight;
          const gozluHeight = gozluBottomY - gozluTopY;

          // Gözlü lamel bölgesini çiz (delikli görünüm için - kepenk görünümü)
          // Lamel görünümü için önce normal lameller gibi çiz
          const lamelCountInGozlu = Math.ceil(gozluHeight / 15); // Her 15px'de bir lamel
          const lamelHeightInGozlu = gozluHeight / lamelCountInGozlu;
          
          for (let i = 0; i < lamelCountInGozlu; i++) {
            const lamelY = gozluTopY + i * lamelHeightInGozlu;
            const lamelRealHeight = lamelHeightInGozlu * 0.9; // Lamel yüksekliği (aralarında boşluk)
            const lamelSpacing = lamelHeightInGozlu * 0.1;
            const adjustedLamelY = lamelY + lamelSpacing / 2;
            
            // Lamel gövdesi (gradient ile 3D görünüm)
            const lamelGradient = ctx.createLinearGradient(
              x + dikmeWidth,
              adjustedLamelY,
              x + dikmeWidth,
              adjustedLamelY + lamelRealHeight
            );
            const baseColor = gozluLamelColor;
            const lightColor = isDark ? "#a0a0a0" : "#e0e0e0";
            const darkColor = isDark ? "#606060" : "#b0b0b0";
            lamelGradient.addColorStop(0, darkColor);
            lamelGradient.addColorStop(0.2, lightColor);
            lamelGradient.addColorStop(0.8, lightColor);
            lamelGradient.addColorStop(1, darkColor);
            
            ctx.fillStyle = lamelGradient;
            ctx.fillRect(x + dikmeWidth, adjustedLamelY, finalWidth - 2 * dikmeWidth, lamelRealHeight);
            
            // Delikli pattern (dikdörtgen delikler - resimdeki gibi)
            const holeWidth = Math.max(2, (finalWidth - 2 * dikmeWidth) * 0.015); // Delik genişliği
            const holeHeight = Math.max(1.5, lamelRealHeight * 0.12); // Delik yüksekliği
            const holeSpacingX = holeWidth * 2.5; // Yatay delikler arası mesafe
            const holeSpacingY = holeHeight * 2; // Dikey delikler arası mesafe
            
            const startX = x + dikmeWidth + holeSpacingX / 2;
            const startY = adjustedLamelY + holeSpacingY / 2;
            
            // Delikleri çiz (dikdörtgen, koyu renk - içeriyi gösteriyor)
            ctx.fillStyle = isDark ? "#000000" : "#333333"; // Koyu renk delikler
            for (let holeY = startY; holeY < adjustedLamelY + lamelRealHeight - holeSpacingY / 2; holeY += holeSpacingY) {
              for (let holeX = startX; holeX < x + finalWidth - dikmeWidth - holeSpacingX / 2; holeX += holeSpacingX) {
                ctx.fillRect(holeX, holeY, holeWidth, holeHeight);
              }
            }
            
            // Lamel kenar çizgileri
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x + dikmeWidth, adjustedLamelY, finalWidth - 2 * dikmeWidth, lamelRealHeight);
          }
          
          // Gözlü lamel bölgesi dış çerçevesi
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(x + dikmeWidth, gozluTopY, finalWidth - 2 * dikmeWidth, gozluHeight);

          // Başlangıç çizgisi ve etiketi (altta - alt parçadan başlangıç mm yukarıda)
          ctx.strokeStyle = "#ff6b6b"; // Kırmızı çizgi
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]); // Kesikli çizgi
          ctx.beginPath();
          ctx.moveTo(x + dikmeWidth, gozluBottomY);
          ctx.lineTo(x + finalWidth - dikmeWidth, gozluBottomY);
          ctx.stroke();
          ctx.setLineDash([]); // Kesikli çizgiyi sıfırla
          
          ctx.fillStyle = "#ff6b6b";
          ctx.font = `bold ${Math.max(11, finalWidth * 0.018)}px Arial`;
          ctx.textAlign = "right";
          ctx.textBaseline = "top";
          // Etiketi canvas'ın sağ kenarında göster (kepenk çiziminden bağımsız)
          const labelX = canvasWidth - 15; // Canvas sağ kenarından 15px içeride
          ctx.fillText(
            `${gozluLamelBaslangic}mm`,
            labelX,
            gozluBottomY + 3
          );

          // Bitiş çizgisi ve etiketi (yukarıda - alt parçadan bitiş mm yukarıda)
          ctx.strokeStyle = "#4ecdc4"; // Turkuaz çizgi
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]); // Kesikli çizgi
          ctx.beginPath();
          ctx.moveTo(x + dikmeWidth, gozluTopY);
          ctx.lineTo(x + finalWidth - dikmeWidth, gozluTopY);
          ctx.stroke();
          ctx.setLineDash([]); // Kesikli çizgiyi sıfırla
          
          ctx.fillStyle = "#4ecdc4";
          ctx.font = `bold ${Math.max(11, finalWidth * 0.018)}px Arial`;
          ctx.textAlign = "right";
          ctx.textBaseline = "bottom";
          // Etiketi canvas'ın sağ kenarında göster (kepenk çiziminden bağımsız)
          ctx.fillText(
            `${gozluLamelBitis}mm`,
            labelX,
            gozluTopY - 3
          );

          // Normal lamel bölgeleri (üst ve alt) - lamelli görünüm
          // Üst normal lamel (kutu altından gözlü lamel bitişine kadar)
          if (gozluLamelBitis < height) {
            const normalTopHeight = gozluTopY - lamelAreaY;
            const normalLamelCount = Math.ceil(normalTopHeight / 15);
            const normalLamelHeight = normalTopHeight / normalLamelCount;
            
            for (let i = 0; i < normalLamelCount; i++) {
              const lamelY = lamelAreaY + i * normalLamelHeight;
              const lamelRealHeight = normalLamelHeight * 0.9;
              const lamelSpacing = normalLamelHeight * 0.1;
              const adjustedLamelY = lamelY + lamelSpacing / 2;
              
              // Lamel gövdesi (gradient ile 3D görünüm)
              const lamelGradient = ctx.createLinearGradient(
                x + dikmeWidth,
                adjustedLamelY,
                x + dikmeWidth,
                adjustedLamelY + lamelRealHeight
              );
              const lightColorNormal = isDark ? "#c0c0c0" : "#f0f0f0";
              const darkColorNormal = isDark ? "#808080" : "#c0c0c0";
              lamelGradient.addColorStop(0, darkColorNormal);
              lamelGradient.addColorStop(0.2, lightColorNormal);
              lamelGradient.addColorStop(0.8, lightColorNormal);
              lamelGradient.addColorStop(1, darkColorNormal);
              
              ctx.fillStyle = lamelGradient;
              ctx.fillRect(x + dikmeWidth, adjustedLamelY, finalWidth - 2 * dikmeWidth, lamelRealHeight);
              
              // Lamel kenar çizgileri
              ctx.strokeStyle = borderColor;
              ctx.lineWidth = 0.5;
              ctx.strokeRect(x + dikmeWidth, adjustedLamelY, finalWidth - 2 * dikmeWidth, lamelRealHeight);
            }
          }

          // Alt normal lamel (gözlü lamel başlangıcından alt parçaya kadar)
          if (gozluLamelBaslangic > 0) {
            const altParcaHeight = finalHeight * 0.03;
            const lamelAreaBottom = y + finalHeight - altParcaHeight;
            const normalBottomY = gozluBottomY;
            const normalBottomHeight = lamelAreaBottom - gozluBottomY;
            const normalLamelCount = Math.ceil(normalBottomHeight / 15);
            const normalLamelHeight = normalBottomHeight / normalLamelCount;
            
            for (let i = 0; i < normalLamelCount; i++) {
              const lamelY = normalBottomY + i * normalLamelHeight;
              const lamelRealHeight = normalLamelHeight * 0.9;
              const lamelSpacing = normalLamelHeight * 0.1;
              const adjustedLamelY = lamelY + lamelSpacing / 2;
              
              // Lamel gövdesi (gradient ile 3D görünüm)
              const lamelGradient = ctx.createLinearGradient(
                x + dikmeWidth,
                adjustedLamelY,
                x + dikmeWidth,
                adjustedLamelY + lamelRealHeight
              );
              const lightColorNormal = isDark ? "#c0c0c0" : "#f0f0f0";
              const darkColorNormal = isDark ? "#808080" : "#c0c0c0";
              lamelGradient.addColorStop(0, darkColorNormal);
              lamelGradient.addColorStop(0.2, lightColorNormal);
              lamelGradient.addColorStop(0.8, lightColorNormal);
              lamelGradient.addColorStop(1, darkColorNormal);
              
              ctx.fillStyle = lamelGradient;
              ctx.fillRect(x + dikmeWidth, adjustedLamelY, finalWidth - 2 * dikmeWidth, lamelRealHeight);
              
              // Lamel kenar çizgileri
              ctx.strokeStyle = borderColor;
              ctx.lineWidth = 0.5;
              ctx.strokeRect(x + dikmeWidth, adjustedLamelY, finalWidth - 2 * dikmeWidth, lamelRealHeight);
            }
          }
        } else {
          // Normal lamel (tüm alan) - lamelli görünüm
          const normalLamelCount = Math.ceil(lamelAreaHeight / 15);
          const normalLamelHeight = lamelAreaHeight / normalLamelCount;
          
          for (let i = 0; i < normalLamelCount; i++) {
            const lamelY = lamelAreaY + i * normalLamelHeight;
            const lamelRealHeight = normalLamelHeight * 0.9;
            const lamelSpacing = normalLamelHeight * 0.1;
            const adjustedLamelY = lamelY + lamelSpacing / 2;
            
            // Lamel gövdesi (gradient ile 3D görünüm)
            const lamelGradient = ctx.createLinearGradient(
              x + dikmeWidth,
              adjustedLamelY,
              x + dikmeWidth,
              adjustedLamelY + lamelRealHeight
            );
            const lightColorNormal = isDark ? "#c0c0c0" : "#f0f0f0";
            const darkColorNormal = isDark ? "#808080" : "#c0c0c0";
            lamelGradient.addColorStop(0, darkColorNormal);
            lamelGradient.addColorStop(0.2, lightColorNormal);
            lamelGradient.addColorStop(0.8, lightColorNormal);
            lamelGradient.addColorStop(1, darkColorNormal);
            
            ctx.fillStyle = lamelGradient;
            ctx.fillRect(x + dikmeWidth, adjustedLamelY, finalWidth - 2 * dikmeWidth, lamelRealHeight);
            
            // Lamel kenar çizgileri
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x + dikmeWidth, adjustedLamelY, finalWidth - 2 * dikmeWidth, lamelRealHeight);
          }
        }

        // Alt parça (altta)
        const altParcaHeight = finalHeight * 0.03;
        ctx.fillStyle = boxColor;
        ctx.fillRect(x + dikmeWidth, y + finalHeight - altParcaHeight, finalWidth - 2 * dikmeWidth, altParcaHeight);
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(x + dikmeWidth, y + finalHeight - altParcaHeight, finalWidth - 2 * dikmeWidth, altParcaHeight);

        // Ölçü etiketleri
        ctx.fillStyle = textColor;
        ctx.font = `${Math.max(12, finalWidth * 0.025)}px Arial`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        // Genişlik etiketi (üstte)
        ctx.fillText(`${width}mm`, x + finalWidth / 2 - 30, y - 20);

        // Yükseklik etiketi (solda)
        ctx.save();
        ctx.translate(x - 30, y + finalHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${height}mm`, 0, 0);
        ctx.restore();
      },
      [boxHeight, theme, gozluLamelVar, gozluLamelBaslangic, gozluLamelBitis]
    );

    // Canvas çizim fonksiyonu
    const drawCanvas = useCallback(() => {
      if (!canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;

      drawKepenk(canvas, width, height, canvasWidth, canvasHeight);

      // Çizim bittiğinde global bellek'e yüksek kaliteli dataURL yaz
      try {
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        (window as unknown as Record<string, unknown>)[
          "__kepenkCizimDataUrl"
        ] = dataUrl;
      } catch {
        // ignore
      }
    }, [drawKepenk, width, height]);

    // Canvas boyutlarını güncelle
    useEffect(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // Yüksek çözünürlük için devicePixelRatio kullan
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      // Canvas'ın gerçek boyutunu ayarla (yüksek çözünürlük)
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;

      // CSS boyutunu ayarla (görüntü boyutu)
      canvas.style.width = displayWidth + "px";
      canvas.style.height = displayHeight + "px";

      // Context'i scale et
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      // Çizimi başlat
      drawCanvas();
    }, [drawCanvas, width, height, gozluLamelVar, gozluLamelBaslangic, gozluLamelBitis]);

    // Props değiştiğinde çizimi yenile
    useEffect(() => {
      drawCanvas();
    }, [drawCanvas, gozluLamelVar, gozluLamelBaslangic, gozluLamelBitis]);

    // Ekran boyutu değiştiğinde çizimi yenile
    useEffect(() => {
      const handleResize = () => {
        setTimeout(() => {
          drawCanvas();
        }, 100);
      };

      window.addEventListener("resize", handleResize);

      let resizeObserver: ResizeObserver | null = null;
      if (canvasRef.current) {
        resizeObserver = new ResizeObserver(() => {
          setTimeout(() => {
            drawCanvas();
          }, 50);
        });

        const container = canvasRef.current.parentElement;
        if (container) {
          resizeObserver.observe(container);
        }
      }

      return () => {
        window.removeEventListener("resize", handleResize);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }, [drawCanvas]);

    return (
      <div className={`w-full h-full flex flex-col bg-white rounded-lg ${className}`}>
        <div className="flex-1 flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            className="w-full h-full bg-white"
            style={{ width: "100%", height: "100%" }}
            data-kepenk-canvas="true"
          />
        </div>
      </div>
    );
  }
);

KepenkPreview.displayName = "KepenkPreview";

