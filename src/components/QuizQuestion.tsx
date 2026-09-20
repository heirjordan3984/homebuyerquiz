import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import type { Question } from '../data/questions';
import AddressAutocomplete from './AddressAutocomplete';
import type { PlaceDetails } from './AddressAutocomplete';

interface QuizQuestionProps {
  question: Question;
  totalQuestions: number;
  questionsAnswered: number;
  textAnswer?: string;
  selectedState?: string;
  onAnswer: (optionIndex: number) => void;
  onTextAnswer: (value: string, placeDetails?: PlaceDetails) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export default function QuizQuestion({
  question,
  totalQuestions,
  questionsAnswered,
  textAnswer,
  selectedState,
  onAnswer,
  onTextAnswer,
  onBack,
  canGoBack,
}: QuizQuestionProps) {
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(false);
  const [localText, setLocalText] = useState(textAnswer ?? '');
  const [localSelected, setLocalSelected] = useState<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVisible(false);
    setLocalText(textAnswer ?? '');
    setLocalSelected(undefined);
    const t = setTimeout(() => {
      setVisible(true);
      if (question.type === 'text') {
        inputRef.current?.focus();
      }
    }, 20);
    return () => clearTimeout(t);
  }, [question.id]);

  const progress = (questionsAnswered / totalQuestions) * 100;

  function handleSelect(index: number) {
    if (animating) return;
    setLocalSelected(index);
    setAnimating(true);
    onAnswer(index);
    setTimeout(() => setAnimating(false), 400);
  }

  function handleTextSubmit() {
    if (!localText.trim()) return;
    onTextAnswer(localText.trim());
  }

  function handleTextKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTextSubmit();
    }
  }

  const hasLongOptions = question.options.some((o) => o.length > 30);
  const isTwoColumn = question.options.length >= 4 && !hasLongOptions;
  const isText = question.type === 'text';
  const isAddress = isText && question.id === 3;
  const isStateList = question.id === 2;

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
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 shrink-0 active:scale-90"
          style={{
            color: canGoBack ? '#9CA3AF' : 'transparent',
            cursor: canGoBack ? 'pointer' : 'default',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            if (canGoBack) (e.currentTarget as HTMLButtonElement).style.color = '#0D1B2A';
          }}
          onMouseLeave={(e) => {
            if (canGoBack) (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF';
          }}
        >
          {canGoBack && <ChevronLeft size={20} strokeWidth={2} />}
        </button>

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
      <div
        className="w-full h-1 relative"
        style={{ backgroundColor: '#EEEDE9' }}
      >
        <div
          className="progress-bar-fill absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: '#C9A84C',
          }}
        />
      </div>

      {/* Question content */}
      <div
        className={`flex-1 flex flex-col justify-center px-4 sm:px-6 py-8 max-w-2xl mx-auto w-full transition-all duration-300 ${
          visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
      >
        {/* Topic */}
        <p
          className="font-dm font-semibold tracking-[0.18em] uppercase text-xs mb-4 text-center"
          style={{ color: '#C9A84C' }}
        >
          {question.topic}
        </p>

        {/* Question text */}
        <h2
          className="font-playfair leading-snug mb-7 text-center"
          style={{
            fontSize: 'clamp(1.1rem, 4vw, 1.75rem)',
            color: '#0D1B2A',
            fontWeight: 700,
          }}
        >
          {question.question.replace('{state}', selectedState || 'your state')}
        </h2>

        {isAddress ? (
          <AddressAutocomplete
            value={localText}
            onSubmit={(val, placeDetails) => onTextAnswer(val, placeDetails)}
            placeholder={question.placeholder}
          />
        ) : isStateList ? (
          <div className="flex flex-col gap-4">
            <div
              className="overflow-y-auto quiz-state-scroll flex flex-col gap-2.5"
              style={{ maxHeight: '280px', paddingRight: '4px' }}
            >
              {question.options.map((option, index) => {
                const isSelected = localSelected === index;
                return (
                  <button
                    key={`${question.id}-${index}`}
                    onClick={() => handleSelect(index)}
                    className={`quiz-option text-left rounded-xl font-dm font-medium text-sm flex items-center justify-between active:scale-[0.98] ${
                      isSelected ? 'quiz-option-selected' : ''
                    }`}
                    style={{
                      padding: '14px 16px',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {option}
                    {isSelected && (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: '#C9A84C' }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { if (localSelected !== undefined) handleSelect(localSelected); }}
              disabled={localSelected === undefined}
              className="w-full rounded-xl font-dm font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
              style={{
                padding: '14px 16px',
                backgroundColor: localSelected !== undefined ? '#C9A84C' : '#E5E7EB',
                color: localSelected !== undefined ? '#FFFFFF' : '#9CA3AF',
                cursor: localSelected !== undefined ? 'pointer' : 'default',
                border: 'none',
              }}
            >
              Continue
            </button>
          </div>
        ) : isText ? (
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                onKeyDown={handleTextKeyDown}
                placeholder={question.placeholder ?? 'Type your answer...'}
                className="w-full rounded-xl font-dm text-sm outline-none transition-all duration-200"
                style={{
                  padding: '16px 52px 16px 18px',
                  backgroundColor: '#FFFFFF',
                  color: '#0D1B2A',
                  border: localText.trim() ? '1.5px solid rgba(201,168,76,0.55)' : '1.5px solid #E5E7EB',
                  fontSize: '1rem',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '1.5px solid rgba(201,168,76,0.55)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.08)';
                }}
                onBlur={(e) => {
                  if (!localText.trim()) {
                    e.currentTarget.style.border = '1.5px solid #E5E7EB';
                  }
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {localText.trim() && (
                <button
                  onClick={handleTextSubmit}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
                  style={{
                    backgroundColor: '#C9A84C',
                    color: '#FFFFFF',
                  }}
                >
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              )}
            </div>
            <button
              onClick={handleTextSubmit}
              disabled={!localText.trim()}
              className="w-full rounded-xl font-dm font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
              style={{
                padding: '14px 16px',
                backgroundColor: localText.trim() ? '#C9A84C' : '#E5E7EB',
                color: localText.trim() ? '#FFFFFF' : '#9CA3AF',
                cursor: localText.trim() ? 'pointer' : 'default',
                border: 'none',
              }}
            >
              Continue
            </button>
          </div>
        ) : (
          <div
            key={`opts-${question.id}`}
            className={`grid gap-2.5 ${
              isTwoColumn ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {question.options.map((option, index) => {
              const isSelected = localSelected === index;
              const isOrphan =
                isTwoColumn &&
                index === question.options.length - 1 &&
                question.options.length % 2 === 1;
              return (
                <button
                  key={`${question.id}-${index}`}
                  onClick={() => handleSelect(index)}
                  className={`quiz-option text-left rounded-xl font-dm font-medium text-sm flex items-center gap-3 active:scale-[0.98] ${
                    isSelected ? 'quiz-option-selected' : ''
                  } ${isOrphan ? 'sm:col-span-2 sm:mx-auto sm:w-1/2' : ''}`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span
                    className={`quiz-option-letter w-7 h-7 rounded-full border flex items-center justify-center text-xs shrink-0 font-dm font-semibold ${
                      isSelected ? 'quiz-option-letter-selected' : ''
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
