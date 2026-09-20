import { useState } from 'react';
import type { ResultsView } from './ResultsScreen';

type Phase = 'intro' | 'quiz' | 'gate' | 'evaluating' | 'results';

interface DevNavigatorProps {
  phase: Phase;
  currentScreenIndex: number;
  screenLabels: string[];
  resultsView: ResultsView;
  resultsSlideLabels: { view: ResultsView; label: string }[];
  onJumpTo: (phase: Phase, screenIndex: number, resultsView?: ResultsView) => void;
}

export default function DevNavigator({ phase, currentScreenIndex, screenLabels, resultsView, resultsSlideLabels, onJumpTo }: DevNavigatorProps) {
  const [open, setOpen] = useState(false);

  type NavItem = { label: string; phase: Phase; index: number; resultsView?: ResultsView };

  const allScreens: NavItem[] = [
    { label: 'Intro', phase: 'intro', index: -1 },
    ...screenLabels.flatMap((label, i) => {
      if (label === 'Evaluating') return [{ label, phase: 'evaluating' as Phase, index: i }];
      if (label === 'Gate (lead capture)') return [{ label, phase: 'gate' as Phase, index: i }];
      if (label.startsWith('Results')) {
        return resultsSlideLabels.map((rs) => ({
          label: rs.label,
          phase: 'results' as Phase,
          index: i,
          resultsView: rs.view,
        }));
      }
      return [{ label, phase: 'quiz' as Phase, index: i }];
    }),
  ];

  function isCurrent(item: NavItem) {
    if (item.phase === 'intro' && phase === 'intro') return true;
    if (item.phase !== phase) return false;
    if (item.phase === 'results') return item.resultsView === resultsView;
    if (item.phase === 'quiz' || item.phase === 'gate' || item.phase === 'evaluating') return item.index === currentScreenIndex;
    return false;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        fontFamily: 'monospace',
      }}
    >
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            right: 0,
            width: '240px',
            maxHeight: '440px',
            overflowY: 'auto',
            backgroundColor: '#0D1117',
            border: '1px solid #30363D',
            borderRadius: '10px',
            padding: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <p style={{ color: '#8B949E', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 8px 8px', margin: 0 }}>
            DEV NAVIGATOR
          </p>
          {allScreens.map((item, i) => {
            const isResults = item.phase === 'results';
            const isFirstResultsSlide = isResults && item.resultsView === 'slide1';
            return (
              <div key={i}>
                {isFirstResultsSlide && (
                  <div style={{ height: '1px', backgroundColor: '#21262D', margin: '4px 0' }} />
                )}
                <button
                  onClick={() => {
                    onJumpTo(item.phase, item.index, item.resultsView);
                    setOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: isResults ? '5px 10px 5px 20px' : '6px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: isResults ? '10px' : '11px',
                    cursor: 'pointer',
                    backgroundColor: isCurrent(item) ? '#1F6FEB' : 'transparent',
                    color: isCurrent(item) ? '#FFFFFF' : isResults ? '#8B949E' : '#C9D1D9',
                    marginBottom: '2px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent(item)) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#21262D';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent(item)) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }}
                >
                  {isCurrent(item) ? '▶ ' : isResults ? '  └ ' : '  '}{item.label}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        title="Dev Navigator"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '1.5px solid #30363D',
          backgroundColor: '#0D1117',
          color: '#58A6FF',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        {open ? '✕' : '⌘'}
      </button>
    </div>
  );
}
