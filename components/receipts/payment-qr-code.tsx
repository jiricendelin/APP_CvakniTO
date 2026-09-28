"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function PaymentQrCode({ payload }: { payload: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    void QRCode.toCanvas(canvas, payload, {
      width: 280,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
  }, [payload]);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block max-w-full rounded-md"
      aria-label="QR kód pro platbu převodem"
    />
  );
}
