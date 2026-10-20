import { useEffect, useRef, useState } from 'react';
import { useBranding } from '../hooks/useBranding';

type BrandMarkProps = {
  className?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'hero';
};

function analyzeLogoBrightness(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(false);
        const size = 80;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let totalBrightness = 0;
        let opaquePixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 128) continue;
          opaquePixels++;
          totalBrightness += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        }
        if (opaquePixels === 0) return resolve(false);
        resolve(totalBrightness / opaquePixels > 170);
      } catch {
        resolve(false);
      }
    };
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

export default function BrandMark({ className, style, variant = 'default' }: BrandMarkProps) {
  const { businessName, logoUrl } = useBranding();
  const [isLight, setIsLight] = useState(false);
  const analyzedRef = useRef<string | null>(null);

  useEffect(() => {
    if (logoUrl && analyzedRef.current !== logoUrl) {
      analyzedRef.current = logoUrl;
      analyzeLogoBrightness(logoUrl).then(setIsLight);
    }
  }, [logoUrl]);

  if (logoUrl && variant === 'hero') {
    return (
      <div
        className={`flex items-center justify-center ${className ?? ''}`}
        style={{
          ...(isLight
            ? { backgroundColor: '#0D1B2A', borderRadius: '14px', padding: '12px 24px' }
            : {}),
          ...style,
        }}
      >
        <img
          src={logoUrl}
          alt={businessName}
          style={{ maxHeight: '64px', maxWidth: '260px', objectFit: 'contain' }}
        />
      </div>
    );
  }

  return (
    <span
      className={`font-dm font-medium tracking-[0.25em] text-xs uppercase ${className ?? ''}`}
      style={{ color: '#C9A84C', ...style }}
    >
      {businessName}
    </span>
  );
}
