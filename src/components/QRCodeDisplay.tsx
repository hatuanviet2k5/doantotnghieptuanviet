import React, { useState } from 'react';
import { Copy, Check, QrCode as QrIcon, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface QRCodeDisplayProps {
  qrCode?: string;
  ticketCode: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrCode,
  ticketCode,
  size = 180,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  // Fallback SVG if qrCode is missing
  const defaultQrCode = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="100%" height="100%" fill="#ffffff" rx="8"/>
      <rect x="20" y="20" width="40" height="40" fill="#1e40af" rx="4"/>
      <rect x="28" y="28" width="24" height="24" fill="#ffffff" rx="2"/>
      <rect x="34" y="34" width="12" height="12" fill="#1e40af" rx="2"/>
      <rect x="140" y="20" width="40" height="40" fill="#1e40af" rx="4"/>
      <rect x="148" y="28" width="24" height="24" fill="#ffffff" rx="2"/>
      <rect x="154" y="34" width="12" height="12" fill="#1e40af" rx="2"/>
      <rect x="20" y="140" width="40" height="40" fill="#1e40af" rx="4"/>
      <rect x="28" y="148" width="24" height="24" fill="#ffffff" rx="2"/>
      <rect x="34" y="154" width="12" height="12" fill="#1e40af" rx="2"/>
      <circle cx="80" cy="50" r="6" fill="#1e40af"/>
      <circle cx="100" cy="50" r="6" fill="#1e40af"/>
      <circle cx="120" cy="50" r="6" fill="#1e40af"/>
      <circle cx="80" cy="100" r="6" fill="#2563eb"/>
      <circle cx="100" cy="100" r="6" fill="#2563eb"/>
      <circle cx="120" cy="100" r="6" fill="#2563eb"/>
      <circle cx="80" cy="150" r="6" fill="#1e40af"/>
      <circle cx="100" cy="150" r="6" fill="#1e40af"/>
      <circle cx="120" cy="150" r="6" fill="#1e40af"/>
      <text x="100" y="190" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#1e3a8a">${ticketCode}</text>
    </svg>`
  )}`;

  const src = qrCode || defaultQrCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(ticketCode);
    setCopied(true);
    toast.success('Đã sao chép mã phiếu!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `QRCode_${ticketCode}.png`;
    link.click();
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200/90 shadow-sm ${className}`}
    >
      <div className="relative p-3 bg-white rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
        <img
          src={src}
          alt={`Mã QR ${ticketCode}`}
          style={{ width: size, height: size }}
          className="object-contain rounded-lg"
        />
        <div className="absolute top-1 right-1 opacity-20 pointer-events-none">
          <QrIcon className="w-4 h-4 text-primary-900" />
        </div>
      </div>

      {/* Ticket code display */}
      <div className="mt-4 flex flex-col items-center gap-1.5 w-full">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Mã số phiếu mượn
        </span>
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="font-mono text-base font-bold text-primary-900 tracking-wider">
            {ticketCode}
          </span>
          <button
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-primary-600 transition"
            title="Sao chép mã"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg transition"
        >
          <Download className="w-3.5 h-3.5" />
          Tải ảnh QR
        </button>
      </div>
    </div>
  );
};
