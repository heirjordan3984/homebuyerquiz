import { useEffect, useState } from 'react';

interface EvaluatingScreenProps {
  onComplete: () => void;
}

const steps = [
  { label: 'Analyzing your buyer profile', duration: 2800 },
  { label: 'Assessing market conditions', duration: 2600 },
  { label: 'Calculating your readiness score', duration: 3000 },
  { label: 'Identifying key buying factors', duration: 2400 },
  { label: 'Generating personalized insights', duration: 2800 },
];

const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0) + 800;

export default function EvaluatingScreen({ onComplete }: EvaluatingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    steps.forEach((step, i) => {
      timers.push(
        setTimeout(() => {
          setCurrentStep(i);
        }, elapsed)
      );
      elapsed += step.duration;
      timers.push(
        setTimeout(() => {
          setCompletedSteps((prev) => [...prev, i]);
        }, elapsed - 120)
      );
    });

    timers.push(
      setTimeout(() => {
        setExiting(true);
        setTimeout(onComplete, 500);
      }, totalDuration)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{
        backgroundColor: '#FAFAF8',
        opacity: exiting ? 0 : visible ? 1 : 0,
        transition: exiting ? 'opacity 0.5s ease' : 'opacity 0.4s ease',
      }}
    >
      {/* Subtle background rings */}
      <div
        className="absolute rounded-full"
        style={{
          width: 480,
          height: 480,
          border: '1px solid rgba(201,168,76,0.07)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 320,
          height: 320,
          border: '1px solid rgba(201,168,76,0.1)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Wordmark */}
        <p
          className="font-dm font-medium tracking-[0.25em] text-xs uppercase text-center mb-12"
          style={{ color: '#C9A84C' }}
        >
          HomeIQ
        </p>

        {/* Spinner */}
        <div className="flex justify-center mb-10">
          <div className="relative w-16 h-16">
            <svg
              className="w-16 h-16"
              viewBox="0 0 64 64"
              fill="none"
              style={{ animation: 'spin 1.6s linear infinite' }}
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#EEEDE9"
                strokeWidth="3"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#C9A84C"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="60 116"
                strokeDashoffset="0"
              />
            </svg>
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                fontSize: '20px',
                color: '#C9A84C',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  stroke="#C9A84C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 22V12h6v10"
                  stroke="#C9A84C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Headline */}
        <h2
          className="font-playfair text-center mb-2 leading-snug"
          style={{ fontSize: 'clamp(1.2rem, 5vw, 1.6rem)', color: '#0D1B2A' }}
        >
          Evaluating Your Results
        </h2>
        <p
          className="font-dm text-center text-sm mb-10"
          style={{ color: '#9CA3AF' }}
        >
          This only takes a moment...
        </p>

        {/* Steps list */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isCompleted = completedSteps.includes(i);
            const isActive = currentStep === i && !isCompleted;
            const isPending = !isCompleted && !isActive;

            return (
              <div
                key={i}
                className="flex items-center gap-3 transition-all duration-300"
                style={{
                  opacity: isPending && i > currentStep + 1 ? 0.35 : 1,
                }}
              >
                {/* Status indicator */}
                <div
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-400"
                  style={{
                    backgroundColor: isCompleted
                      ? '#C9A84C'
                      : isActive
                      ? 'rgba(201,168,76,0.15)'
                      : '#EEEDE9',
                    border: isActive
                      ? '1.5px solid rgba(201,168,76,0.5)'
                      : 'none',
                  }}
                >
                  {isCompleted ? (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4l2.5 2.5L9 1"
                        stroke="#fff"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : isActive ? (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: '#C9A84C',
                        animation: 'pulse 1s ease-in-out infinite',
                      }}
                    />
                  ) : (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#D1D5DB' }}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className="font-dm text-sm transition-all duration-300"
                  style={{
                    color: isCompleted
                      ? '#6B7280'
                      : isActive
                      ? '#0D1B2A'
                      : '#9CA3AF',
                    fontWeight: isActive ? 500 : 400,
                    textDecoration: isCompleted ? 'none' : 'none',
                  }}
                >
                  {step.label}
                </span>

                {/* Completed checkmark text */}
                {isCompleted && (
                  <span
                    className="ml-auto font-dm text-xs"
                    style={{ color: '#C9A84C' }}
                  >
                    Done
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div
          className="mt-8 h-0.5 rounded-full overflow-hidden"
          style={{ backgroundColor: '#EEEDE9' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: '#C9A84C',
              width: `${((completedSteps.length) / steps.length) * 100}%`,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <p
          className="font-dm text-xs text-center mt-2"
          style={{ color: '#C9A84C' }}
        >
          {Math.round((completedSteps.length / steps.length) * 100)}% complete
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.75); }
        }
      `}</style>
    </div>
  );
}
