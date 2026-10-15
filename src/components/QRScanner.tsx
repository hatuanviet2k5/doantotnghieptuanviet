import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { Camera, CameraOff, RefreshCw, Keyboard, CheckCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  isActive?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, isActive = true }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [showManual, setShowManual] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    if (!isActive) {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      setIsScanning(false);
      return;
    }

    const codeReader = new BrowserQRCodeReader();
    let isSubscribed = true;

    async function startScanner() {
      try {
        setCameraError(null);
        setIsScanning(true);

        const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          setHasCamera(false);
          setCameraError('Không tìm thấy thiết bị camera trên máy.');
          setIsScanning(false);
          return;
        }

        // Try environment facing camera first, or first available
        const selectedDevice =
          videoInputDevices.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
          videoInputDevices[0].deviceId;

        if (videoRef.current && isSubscribed) {
          const controls = await codeReader.decodeFromVideoDevice(
            selectedDevice,
            videoRef.current,
            (result, error) => {
              if (result && isSubscribed) {
                const text = result.getText();
                if (text) {
                  onScan(text);
                }
              }
              if (error && !(error.name === 'NotFoundException')) {
                // NotFoundException happens every frame when no QR is in view - normal
              }
            }
          );
          controlsRef.current = controls;
        }
      } catch (err: any) {
        if (isSubscribed) {
          setCameraError(
            err.message || 'Không thể truy cập camera. Vui lòng cấp quyền truy cập hoặc nhập mã tay.'
          );
          setHasCamera(false);
          setIsScanning(false);
        }
      }
    }

    startScanner();

    return () => {
      isSubscribed = false;
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [isActive, onScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-xl max-w-lg mx-auto">
      {/* Video Viewfinder */}
      <div className="relative aspect-video w-full flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          className={`h-full w-full object-cover ${cameraError ? 'hidden' : 'block'}`}
          playsInline
          muted
        />

        {/* Viewfinder Target Overlay */}
        {!cameraError && isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened edges */}
            <div className="absolute inset-0 border-[40px] sm:border-[60px] border-black/50" />

            {/* Target box */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-primary-400 rounded-xl">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br" />

              {/* Scanning red laser line */}
              <div className="absolute left-2 right-2 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-scan" />
            </div>
          </div>
        )}

        {/* Camera error / fallback display */}
        {cameraError && (
          <div className="p-6 text-center text-slate-300">
            <CameraOff className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-sm font-medium">{cameraError}</p>
            <p className="mt-1 text-xs text-slate-500">
              Bạn có thể nhập trực tiếp mã phiếu bên dưới để tiếp tục.
            </p>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-primary-400" />
            Hướng camera vào mã QR phiếu mượn
          </span>
          <button
            type="button"
            onClick={() => setShowManual(!showManual)}
            className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-medium transition"
          >
            <Keyboard className="w-3.5 h-3.5" />
            {showManual ? 'Ẩn nhập tay' : 'Nhập mã phiếu tay'}
          </button>
        </div>

        {/* Manual code input */}
        {showManual && (
          <form onSubmit={handleManualSubmit} className="flex gap-2 mt-1">
            <input
              type="text"
              placeholder="VD: TK-202410-001"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition flex items-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              Xác nhận
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
