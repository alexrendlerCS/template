"use client";

import { useEffect, useRef } from "react";
import SignaturePad from "signature_pad";

interface SignaturePadCanvasProps {
  onSignatureChange?: (isEmpty: boolean) => void;
  onSignatureData?: (data: string) => void;
}

export function SignaturePadCanvas({
  onSignatureChange,
  onSignatureData,
}: SignaturePadCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    const initializeSignaturePad = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set canvas size based on display ratio
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Scale context to match display ratio
      ctx.scale(ratio, ratio);

      // Clear any existing signature pad
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }

      // Initialize new signature pad
      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "rgb(0, 0, 0)",
        velocityFilterWeight: 0.7,
        minWidth: 0.5,
        maxWidth: 2.5,
        throttle: 16,
        minDistance: 0,
      });

      // Add event listeners
      signaturePadRef.current.addEventListener("beginStroke", () => {
        console.log("Signature stroke begin");
        onSignatureChange?.(false);
      });

      signaturePadRef.current.addEventListener("endStroke", () => {
        console.log("Signature stroke end");
        const data = signaturePadRef.current?.toDataURL() || "";
        onSignatureData?.(data);
      });
    };

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !signaturePadRef.current) return;

      // Save current signature data
      const data = signaturePadRef.current.toData();

      // Reinitialize signature pad
      initializeSignaturePad();

      // Restore signature data if it existed
      if (data.length > 0) {
        signaturePadRef.current?.fromData(data);
      }
    };

    // Initialize signature pad
    initializeSignaturePad();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
    };
  }, []); // Empty dependency array since we want this to run once on mount

  const clear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      onSignatureChange?.(true);
      onSignatureData?.("");
    }
  };

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full h-32 cursor-crosshair border rounded-md bg-white"
        style={{
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      />
    </div>
  );
}
