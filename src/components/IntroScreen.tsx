import { useState, useEffect } from 'react';
import { Sparkles, DollarSign, Star, CheckCircle } from 'lucide-react';
import { questions } from '../data/questions';

const BASE = 'https://zlgzefcnaszfonnmfgcb.supabase.co/storage/v1/object/public/homeowner-images/';
const GRID_IMAGES = Array.from({ length: 55 }, (_, i) => `${BASE}homeowner_${String(i + 1).padStart(2, '0')}.jpg`);

const STAT_BADGES = [
  { Icon: DollarSign, label: 'Proven', sub: 'Data-Backed' },
  { Icon: Star, label: '4.9 Stars', sub: 'Verified' },
  { Icon: CheckCircle, label: '100% Free', sub: 'No strings attached' },
];

const TODAY = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const firstQuestion = questions[0];

interface IntroScreenProps {
  onFirstAnswer: (optionIndex: number) => void;
}

export default function IntroScreen({ onFirstAnswer }: IntroScreenProps) {
  const [region, setRegion] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data) => {
        if (data.region) setRegion(data.region);
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 pt-8 pb-16 relative overflow-hidden"
      style={{ backgroundColor: '#FAFAF8' }}
    >
      {/* Live count pill */}
      <div className="animate-fade-in stagger-1 mb-6 w-full flex justify-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-dm text-xs font-medium text-center"
          style={{
            border: '1.5px solid rgba(201,168,76,0.4)',
            backgroundColor: '#FFFFFF',
            color: '#0D1B2A',
          }}
        >
          <Sparkles size={12} style={{ color: '#C9A84C', flexShrink: 0 }} />
          167 families bought below market as of {TODAY}
        </div>
      </div>

      {/* Main headline */}
      <h1
        className="animate-fade-in stagger-2 font-playfair text-center leading-tight mb-3 px-2"
        style={{
          fontSize: 'clamp(1.4rem, 6.72vw, 3.2rem)',
          color: '#0D1B2A',
          maxWidth: '720px',
          fontWeight: 700,
        }}
      >
        Discover your exact home buying power:{' '}
        <span
          style={{
            color: '#C9A84C',
            fontStyle: 'italic',
          }}
        >
          house price, down payment, & monthly mortgage.
        </span>
      </h1>

      {/* Bold italic subheadline */}
      <h2
        className="animate-fade-in stagger-2 font-dm text-center leading-snug mb-7 px-2"
        style={{
          fontSize: 'clamp(1.112rem, 3.51vw, 1.755rem)',
          color: '#4B5563',
          maxWidth: '600px',
          fontStyle: 'normal',
          fontWeight: 400,
        }}
      >
        New 60-second FREE tool reveals exactly what you can offer before you walk in the door.
      </h2>

      {/* Stat badges */}
      <div className="animate-fade-in stagger-3 flex items-center justify-center gap-1.5 mb-8 w-full px-2">
        {STAT_BADGES.map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-1.5 px-2 py-2 rounded-full flex-1 min-w-0 justify-center"
            style={{
              border: '1.5px solid rgba(201,168,76,0.35)',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(13,27,42,0.05)',
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'rgba(201,168,76,0.12)',
              }}
            >
              <badge.Icon size={11} style={{ color: '#C9A84C' }} />
            </div>
            <div className="text-left min-w-0">
              <div className="font-dm font-semibold leading-none truncate" style={{ fontSize: '10px', color: '#0D1B2A' }}>
                {badge.label}
              </div>
              <div className="font-dm leading-none mt-0.5 truncate" style={{ fontSize: '9px', color: '#9CA3AF' }}>
                {badge.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Social proof count + image grid */}
      <div className="animate-fade-in stagger-3 w-full mb-8" style={{ maxWidth: '900px' }}>
        <p
          className="font-dm font-semibold text-center mb-4 px-2"
          style={{
            fontSize: 'clamp(0.85rem, 2.5vw, 1.2rem)',
            color: '#0D1B2A',
          }}
        >
          2,446+ homebuyers{region ? ` in ${region}` : ''} have used this assessment to buy their home
        </p>

        {/* Desktop: static grid */}
        <div
          className="hidden sm:grid gap-1"
          style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}
        >
          {GRID_IMAGES.slice(0, 48).map((src, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-md"
              style={{ aspectRatio: '1/1' }}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority={i < 16 ? 'high' : 'auto'}
              />
            </div>
          ))}
        </div>

        {/* Mobile: looping scroll rows */}
        <div className="sm:hidden flex flex-col gap-1.5 overflow-hidden">
          {[0, 1, 2, 3].map((rowIndex) => {
            const rowImages = GRID_IMAGES.filter((_, i) => i % 4 === rowIndex);
            if (rowImages.length === 0) return null;
            const doubled = [...rowImages, ...rowImages];
            const imgSize = 54;
            const gap = 6;
            const singleRowWidth = rowImages.length * (imgSize + gap);
            const duration = (singleRowWidth / 40).toFixed(1);
            return (
              <div key={rowIndex} className="overflow-hidden w-full">
                <div
                  className="flex gap-1.5"
                  style={{
                    width: `${singleRowWidth * 2}px`,
                    animation: `marquee-row-${rowIndex} ${duration}s linear infinite`,
                    willChange: 'transform',
                  }}
                >
                  {doubled.map((src, i) => (
                    <div
                      key={i}
                      className="relative overflow-hidden rounded-md shrink-0"
                      style={{ width: imgSize, height: imgSize }}
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="eager"
                        fetchPriority={rowIndex < 2 ? 'high' : 'auto'}
                      />
                    </div>
                  ))}
                </div>
                <style>{`
                  @keyframes marquee-row-${rowIndex} {
                    from { transform: translateX(0); }
                    to { transform: translateX(-${singleRowWidth}px); }
                  }
                `}</style>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline first question card */}
      <div
        className="animate-fade-in stagger-4 w-full rounded-2xl p-5 sm:p-7 md:p-9"
        style={{
          maxWidth: '660px',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #E8E8E8',
          boxShadow: '0 4px 32px rgba(13,27,42,0.07)',
        }}
      >
        <h2
          className="font-playfair leading-snug mb-5"
          style={{
            fontSize: 'clamp(1.1rem, 3.5vw, 1.7rem)',
            color: '#0D1B2A',
          }}
        >
          {firstQuestion.question}
        </h2>
        <div className="grid grid-cols-1 gap-2.5">
          {firstQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => onFirstAnswer(index)}
              className="text-left px-4 py-3.5 rounded-xl font-dm font-medium text-sm transition-all duration-200 flex items-center gap-3 active:scale-[0.98]"
              style={{
                backgroundColor: '#F9FAFB',
                color: '#374151',
                border: '1.5px solid #E5E7EB',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.backgroundColor = 'rgba(201,168,76,0.07)';
                el.style.borderColor = 'rgba(201,168,76,0.5)';
                el.style.color = '#0D1B2A';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.backgroundColor = '#F9FAFB';
                el.style.borderColor = '#E5E7EB';
                el.style.color = '#374151';
              }}
            >
              <span
                className="w-7 h-7 rounded-full border flex items-center justify-center text-xs shrink-0 font-dm font-semibold"
                style={{
                  borderColor: '#D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#9CA3AF',
                }}
              >
                {String.fromCharCode(65 + index)}
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
