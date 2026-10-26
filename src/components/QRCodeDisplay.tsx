import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ url, size = 180, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: size,
          margin: 1.5,
          color: {
            dark: '#1e293b',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [url, size]);

  return (
    <div className={`inline-flex flex-col items-center p-2 bg-white rounded-xl shadow-xs border border-slate-200 ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
};
