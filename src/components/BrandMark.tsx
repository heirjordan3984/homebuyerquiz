import { useBranding } from '../hooks/useBranding';

type BrandMarkProps = {
  className?: string;
  style?: React.CSSProperties;
};

export default function BrandMark({ className, style }: BrandMarkProps) {
  const { businessName, logoUrl } = useBranding();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={businessName}
        className={className}
        style={{ maxHeight: '40px', maxWidth: '180px', objectFit: 'contain', ...style }}
      />
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
