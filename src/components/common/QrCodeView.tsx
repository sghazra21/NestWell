import React from 'react';

interface QrCodeViewProps {
  value: string;
  size?: number;
  label?: string;
}

export const QrCodeView: React.FC<QrCodeViewProps> = ({ value, size = 160, label }) => {
  // Generates a deterministic, crisp SVG QR-like matrix for realistic visual simulation
  const matrixSize = 21; // 21x21 QR code standard version 1
  const hash = value.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);

  const isDark = (r: number, c: number) => {
    // 3 Corner finder patterns
    if ((r < 7 && c < 7) || (r < 7 && c >= matrixSize - 7) || (r >= matrixSize - 7 && c < 7)) {
      if (r === 0 || r === 6 || c === 0 || c === 6) return true;
      if (r >= matrixSize - 7 && (r === matrixSize - 7 || r === matrixSize - 1 || c === 0 || c === 6)) return true;
      if (c >= matrixSize - 7 && (r === 0 || r === 6 || c === matrixSize - 7 || c === matrixSize - 1)) return true;
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
      if (r >= 2 && r <= 4 && c >= matrixSize - 5 && c <= matrixSize - 3) return true;
      if (r >= matrixSize - 5 && r <= matrixSize - 3 && c >= 2 && c <= 4) return true;
      return false;
    }
    // Timing patterns
    if (r === 6 || c === 6) return (r + c) % 2 === 0;
    // Data pseudo-random based on string value
    const cellHash = (r * 31 + c * 17 + hash) % 100;
    return cellHash > 45;
  };

  const cellSize = size / matrixSize;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rounded-lg"
        aria-label={`QR Code for ${value}`}
      >
        <rect width={size} height={size} fill="#ffffff" />
        {Array.from({ length: matrixSize }).map((_, r) =>
          Array.from({ length: matrixSize }).map((__, c) => {
            if (!isDark(r, c)) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.1}
                height={cellSize + 0.1}
                fill="#0F172A"
              />
            );
          })
        )}
      </svg>
      {label && <span className="mt-2 text-xs font-mono font-semibold tracking-wider text-slate-600">{label}</span>}
    </div>
  );
};
