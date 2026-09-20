import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

interface InfoSlideProps {
  headline: string;
  body: string;
  illustration: ReactNode;
  onContinue: () => void;
  progressPercent: number;
}

export default function InfoSlide({ headline, body, illustration, onContinue, progressPercent }: InfoSlideProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, [headline]);

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundColor: '#FAFAF8' }}
    >
      {/* Top bar */}
      <div
        className="w-full flex items-center gap-3 px-4 pt-5 pb-3"
        style={{ backgroundColor: '#FAFAF8' }}
      >
        <div className="w-9 shrink-0" />
        <div className="flex-1 flex justify-center">
          <span
            className="font-dm font-medium tracking-[0.25em] text-xs uppercase"
            style={{ color: '#C9A84C' }}
          >
            HomeIQ
          </span>
        </div>
        <div className="w-9 shrink-0" />
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 relative" style={{ backgroundColor: '#F0EDE6' }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full progress-bar-fill"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: '#C9A84C',
          }}
        />
      </div>

      {/* Content */}
      <div
        className={`flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-8 max-w-2xl mx-auto w-full transition-all duration-[280ms] ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ transitionTimingFunction: 'ease' }}
      >
        {/* Eyebrow pill */}
        <div className="mb-5 flex justify-center">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-dm text-xs font-medium"
            style={{
              border: '1.5px solid rgba(201,168,76,0.4)',
              backgroundColor: '#FFFFFF',
              color: '#0D1B2A',
            }}
          >
            <Sparkles size={11} style={{ color: '#C9A84C', flexShrink: 0 }} />
            Good to know
          </div>
        </div>

        {/* Headline */}
        <h2
          className="font-playfair text-center leading-snug mb-4"
          style={{
            fontSize: 'clamp(1.25rem, 4.5vw, 1.875rem)',
            color: '#0D1B2A',
            fontWeight: 700,
            maxWidth: '520px',
          }}
        >
          {headline}
        </h2>

        {/* Body */}
        <p
          className="font-dm text-center leading-relaxed mb-8"
          style={{
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            color: '#4B5563',
            maxWidth: '460px',
          }}
        >
          {body}
        </p>

        {/* Illustration card */}
        <div
          className="w-full mb-8 rounded-2xl overflow-hidden"
          style={{
            maxWidth: '520px',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E8E8E8',
            boxShadow: '0 4px 32px rgba(13,27,42,0.07)',
          }}
        >
          {illustration}
        </div>

        {/* CTA */}
        <button
          onClick={onContinue}
          className="w-full max-w-sm rounded-xl font-dm font-bold transition-all duration-200 active:scale-[0.98]"
          style={{
            padding: '15px 20px',
            backgroundColor: '#C9A84C',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '0.9375rem',
            boxShadow: '0 4px 16px rgba(201,168,76,0.3)',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#B8953E';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(201,168,76,0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#C9A84C';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(201,168,76,0.3)';
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
