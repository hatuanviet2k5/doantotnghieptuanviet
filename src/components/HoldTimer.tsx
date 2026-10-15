import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface HoldTimerProps {
  expiresAt?: string | Date;
  initialSeconds?: number;
  onExpire?: () => void;
  className?: string;
}

export const HoldTimer: React.FC<HoldTimerProps> = ({
  expiresAt,
  initialSeconds = 300, // 5 minutes default
  onExpire,
  className = '',
}) => {
  const calculateRemaining = (): number => {
    if (expiresAt) {
      const expiry = new Date(expiresAt).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((expiry - now) / 1000));
    }
    return initialSeconds;
  };

  const [remaining, setRemaining] = useState<number>(calculateRemaining);
  const totalSecondsRef = useRef<number>(initialSeconds || calculateRemaining() || 300);
  const hasExpiredRef = useRef<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            if (onExpire) {
              onExpire();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onExpire]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining <= 60;
  const progress = Math.min(100, Math.max(0, (remaining / totalSecondsRef.current) * 100));

  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        isUrgent
          ? 'bg-rose-50/80 border-rose-200 text-rose-800 animate-pulse'
          : 'bg-amber-50/80 border-amber-200 text-amber-900'
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isUrgent ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
          ) : (
            <Clock className="w-5 h-5 text-amber-600" />
          )}
          <span className="text-sm font-semibold">
            {isUrgent ? 'Sắp hết thời gian giữ sách!' : 'Thời gian giữ sách còn lại:'}
          </span>
        </div>

        <div className="font-mono text-2xl font-black tracking-wider">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            isUrgent ? 'bg-rose-500' : 'bg-amber-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Vui lòng đến quầy thư viện và xuất trình mã QR trước khi đồng hồ đếm ngược kết thúc (phiếu sẽ tự động huỷ khi hết giờ).
      </p>
    </div>
  );
};
