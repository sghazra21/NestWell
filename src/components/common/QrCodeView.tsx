import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QrCodeViewProps {
  value: string;
  size?: number;
  label?: string;
}

export const QrCodeView: React.FC<QrCodeViewProps> = ({ value, size = 160, label }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#ffffff"
        fgColor="#0F172A"
        level="M"
        includeMargin={false}
      />
      {label && <span className="mt-2 text-xs font-mono font-semibold tracking-wider text-slate-600">{label}</span>}
    </div>
  );
};
