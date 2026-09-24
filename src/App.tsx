import { useState, useEffect, useRef } from 'react';
import { BarChart3 } from 'lucide-react';
import type { PlaceDetails } from './components/AddressAutocomplete';
import IntroScreen from './components/IntroScreen';
import QuizQuestion from './components/QuizQuestion';
import InfoSlide from './components/InfoSlide';
import GateScreen from './components/GateScreen';
import EvaluatingScreen from './components/EvaluatingScreen';
import ResultsScreen from './components/ResultsScreen';
import DevNavigator from './components/DevNavigator';
import type { RentcastData } from './types/rentcast';
import {
  IllustrationPreparationTrap,
  IllustrationPricingGap,
  IllustrationAgentGap,
  IllustrationBuySellSequence,
  IllustrationCostOfWaiting,
} from './components/InfoSlideIllustrations';
import { questions } from './data/questions';
import { infoSlides } from './data/infoSlides';
import { computeResults, type Answers } from './utils/quizLogic';
import { supabase } from './lib/supabase';
import AdminShell from './components/AdminShell';
import AdminDashboard from './components/AdminDashboard';

type Phase = 'intro' | 'quiz' | 'gate' | 'evaluating' | 'results';
type ResultsView = 'slide1' | 'slide2' | 'slide3' | 'full';
type ScreenType = 'question' | 'infoSlide' | 'evaluating' | 'gate' | 'results';

interface Screen {
  type: ScreenType;
  index?: number;
}

const screenSequence: Screen[] = [
  { type: 'question', index: 0 },
  { type: 'question', index: 1 },
  { type: 'question', index: 3 },
  { type: 'infoSlide', index: 0 },
  { type: 'question', index: 4 },
  { type: 'question', index: 5 },
  { type: 'question', index: 6 },
  { type: 'infoSlide', index: 1 },
  { type: 'question', index: 7 },
  { type: 'question', index: 8 },
  { type: 'question', index: 9 },
  { type: 'infoSlide', index: 2 },
  { type: 'question', index: 10 },
  { type: 'question', index: 11 },
  { type: 'question', index: 12 },
  { type: 'infoSlide', index: 3 },
  { type: 'question', index: 13 },
  { type: 'question', index: 14 },
  { type: 'question', index: 15 },
  { type: 'infoSlide', index: 4 },
  { type: 'question', index: 18 },
  { type: 'question', index: 2 },
  { type: 'evaluating' },
  { type: 'gate' },
  { type: 'results' },
];

const TOTAL_QUESTIONS = 18;

const illustrations = [
  <IllustrationPreparationTrap />,
  <IllustrationPricingGap />,
  <IllustrationAgentGap />,
  <IllustrationBuySellSequence />,
  <IllustrationCostOfWaiting />,
];

const screenLabels: string[] = screenSequence.map((s, i) => {
  if (s.type === 'question' && s.index !== undefined) return `Q${s.index + 1}: ${questions[s.index].question.slice(0, 32)}…`;
  if (s.type === 'infoSlide' && s.index !== undefined) return `Info ${s.index + 1}: ${infoSlides[s.index].headline.slice(0, 28)}…`;
  if (s.type === 'evaluating') return 'Evaluating';
  if (s.type === 'gate') return 'Gate (lead capture)';
  if (s.type === 'results') return 'Results — Full Analysis';
  return `Screen ${i}`;
});



function countQuestionsAnsweredBefore(screenIndex: number): number {
  return screenSequence.slice(0, screenIndex).filter((s) => s.type === 'question').length;
}

const SESSION_KEY = 'homeiq_session';
const QUIZ_TOKEN_KEY = 'homeiq_quiz_token';

function getOrCreateQuizToken(): string {
  try {
    let token = sessionStorage.getItem(QUIZ_TOKEN_KEY);
    if (!token) {
      token = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(QUIZ_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return `fallback-${Date.now()}`;
  }
}

function trackQuizProgress(step: number, stepType: string, stepLabel: string, questionsAnswered: number, completed?: boolean, leadEmail?: string) {
  try {
    const token = getOrCreateQuizToken();
    supabase
      .from('quiz_sessions')
      .upsert({
        session_token: token,
        current_step: step,
        step_type: stepType,
        step_label: stepLabel,
        questions_answered: questionsAnswered,
        total_questions: TOTAL_QUESTIONS,
        completed: completed ?? false,
        lead_email: leadEmail ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_token' })
      .then(({ error }) => {
        if (error) console.error('[quiz_sessions] upsert error:', error);
      });
  } catch (e) {
    // non-critical, don't break the quiz
  }
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(data: object) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {}
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

function useHashRoute() {
  const [hash, setHash] = useState<string>(typeof window !== 'undefined' ? window.location.hash : '');
  useEffect(() => {
    function onChange() {
      setHash(window.location.hash);
    }
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

function App() {
  const hash = useHashRoute();
  const saved = loadSession();

  const [phase, setPhase] = useState<Phase>(saved?.phase ?? 'intro');
  const [currentScreenIndex, setCurrentScreenIndex] = useState<number>(saved?.currentScreenIndex ?? 0);
  const [answers, setAnswers] = useState<Answers>(saved?.answers ?? {});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>(saved?.textAnswers ?? {});
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(saved?.placeDetails ?? null);
  const [rentcastData, setRentcastData] = useState<RentcastData | null>(null);
  const [rentcastLoading, setRentcastLoading] = useState(false);
  const [leadName, setLeadName] = useState<string>(saved?.leadName ?? '');
  const [leadEmail, setLeadEmail] = useState<string>(saved?.leadEmail ?? '');
  const [leadPhone, setLeadPhone] = useState<string>(saved?.leadPhone ?? '');
  const [resultsView, setResultsView] = useState<ResultsView>(saved?.resultsView ?? 'full');

  useEffect(() => {
    saveSession({ phase, currentScreenIndex, answers, textAnswers, placeDetails, leadName, leadEmail, leadPhone, resultsView });
  }, [phase, currentScreenIndex, answers, textAnswers, placeDetails, leadName, leadEmail, leadPhone, resultsView]);

  useEffect(() => {
    if (hash === '#admin' || hash === '#dashboard') return;
    const screen = screenSequence[currentScreenIndex];
    if (!screen) return;
    const qAnswered = countQuestionsAnsweredBefore(currentScreenIndex);
    const label = screenLabels[currentScreenIndex] ?? `Step ${currentScreenIndex}`;
    trackQuizProgress(currentScreenIndex, screen.type, label, qAnswered);
  }, [phase, currentScreenIndex, hash]);

  const fetchedAddressRef = useRef<string | null>(null);

  useEffect(() => {
    if (phase !== 'results') return;
    const addressToLookup = placeDetails?.address ?? textAnswers[3];
    if (!addressToLookup) return;
    if (fetchedAddressRef.current === addressToLookup) return;
    fetchedAddressRef.current = addressToLookup;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'Apikey': supabaseKey,
    };

    setRentcastLoading(true);

    fetch(`${supabaseUrl}/functions/v1/rentcast-lookup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        address: addressToLookup,
        lat: placeDetails?.lat ?? null,
        lng: placeDetails?.lng ?? null,
        priceMin: (() => { const b = answers[6]; if (b == null) return null; const ranges = [[0,250000],[250000,450000],[450000,700000],[700000,1000000],[1000000,null]]; return ranges[b]?.[0] ?? null; })(),
        priceMax: (() => { const b = answers[6]; if (b == null) return null; const ranges = [[0,250000],[250000,450000],[450000,700000],[700000,1000000],[1000000,null]]; return ranges[b]?.[1] ?? null; })(),
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setRentcastData(data);
        else console.error('[Rentcast] HTTP', res.status, 'payload:', data);
      })
      .catch((err) => {
        console.error('[Rentcast] fetch error:', err);
        fetchedAddressRef.current = null;
      })
      .finally(() => setRentcastLoading(false));
  }, [phase, placeDetails, textAnswers]);

  function handleFirstAnswer(optionIndex: number) {
    const newAnswers = { ...answers, [questions[0].id]: optionIndex };
    setAnswers(newAnswers);
    setCurrentScreenIndex(1);
    setTimeout(() => setPhase('quiz'), 320);
  }

  function advance() {
    const next = currentScreenIndex + 1;
    if (next >= screenSequence.length) {
      setPhase('gate');
      return;
    }
    const nextScreen = screenSequence[next];
    if (nextScreen.type === 'evaluating') {
      setPhase('evaluating');
      setCurrentScreenIndex(next);
      return;
    }
    if (nextScreen.type === 'gate') {
      setPhase('gate');
      setCurrentScreenIndex(next);
      return;
    }
    if (nextScreen.type === 'results') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setPhase('results');
      return;
    }
    setCurrentScreenIndex(next);
  }

  function handleEvaluatingComplete() {
    const gateIndex = screenSequence.findIndex((s) => s.type === 'gate');
    if (gateIndex !== -1) {
      setPhase('gate');
      setCurrentScreenIndex(gateIndex);
    } else {
      setPhase('gate');
    }
  }

  function handleGateSubmit(name: string, _email: string, _phone: string) {
    setLeadName(name);
    setLeadEmail(_email);
    setLeadPhone(_phone);
    setPhase('results');

    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'Lead');
    }

    const addressToLookup = placeDetails?.address ?? textAnswers[3];

    const quizAnswers = questions.map((q) => {
      const optionIndex = answers[q.id];
      const textValue = textAnswers[q.id];
      return {
        id: q.id,
        topic: q.topic,
        question: q.question,
        type: q.type ?? 'options',
        selected_option_index: optionIndex ?? null,
        selected_option_text:
          optionIndex !== undefined && q.options[optionIndex] !== undefined
            ? q.options[optionIndex]
            : null,
        text_answer: textValue ?? null,
      };
    });

    supabase
      .from('lead_submissions')
      .insert({
        name,
        email: _email,
        phone: _phone,
        property_address: addressToLookup ?? '',
        property_lat: placeDetails?.lat ?? null,
        property_lng: placeDetails?.lng ?? null,
        quiz_answers: quizAnswers,
      })
      .then(({ error }) => {
        if (error) console.error('[lead_submissions] insert error:', error);
      });

    trackQuizProgress(currentScreenIndex, 'gate', 'Completed', TOTAL_QUESTIONS, true, _email);

    const propertyValue =
      rentcastData?.market?.medianSalePrice ??
      rentcastData?.market?.averageSalePrice ??
      null;

    if (_email.trim().toLowerCase() !== 'gabrielbcarvalho2014@gmail.com') {
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/slack-notify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'lead',
          data: {
            name,
            email: _email,
            phone: _phone,
            address: addressToLookup ?? '',
            propertyValue,
          },
        }),
      }).catch((err) => console.error('[slack-notify] lead error:', err));
    }
  }

  function handleAnswer(optionIndex: number) {
    const screen = screenSequence[currentScreenIndex];
    if (screen.type !== 'question' || screen.index === undefined) return;
    const q = questions[screen.index];
    const newAnswers = { ...answers, [q.id]: optionIndex };
    setAnswers(newAnswers);
    setTimeout(() => advance(), 350);
  }

  function handleTextAnswer(value: string, details?: PlaceDetails) {
    const screen = screenSequence[currentScreenIndex];
    if (screen.type !== 'question' || screen.index === undefined) return;
    const q = questions[screen.index];
    setTextAnswers({ ...textAnswers, [q.id]: value });
    if (details) setPlaceDetails(details);
    setTimeout(() => advance(), 100);
  }

  function handleBack() {
    if (currentScreenIndex <= 1) {
      setPhase('intro');
      return;
    }
    let prev = currentScreenIndex - 1;
    while (prev > 0 && screenSequence[prev].type === 'infoSlide') {
      prev--;
    }
    setCurrentScreenIndex(prev);
  }

  function handleRetake() {
    clearSession();
    try { sessionStorage.removeItem(QUIZ_TOKEN_KEY); } catch {}
    setPhase('intro');
    setCurrentScreenIndex(0);
    setAnswers({});
    setTextAnswers({});
    setPlaceDetails(null);
    setRentcastData(null);
    setRentcastLoading(false);
    setLeadName('');
    setLeadEmail('');
    setLeadPhone('');
    setResultsView('full');
    fetchedAddressRef.current = null;
  }

  function handleDevJump(targetPhase: Phase, targetIndex: number, targetResultsView?: ResultsView) {
    if (targetPhase === 'intro') {
      setPhase('intro');
      setCurrentScreenIndex(0);
    } else if (targetPhase === 'evaluating') {
      setPhase('evaluating');
      if (targetIndex >= 0) setCurrentScreenIndex(targetIndex);
    } else if (targetPhase === 'results') {
      setPhase('results');
      setResultsView(targetResultsView ?? 'slide1');
    } else if (targetPhase === 'gate') {
      setPhase('gate');
      setCurrentScreenIndex(targetIndex);
    } else {
      setPhase('quiz');
      setCurrentScreenIndex(targetIndex);
    }
  }

    const resultsSlideLabels: { view: ResultsView; label: string }[] = [
    { view: 'slide1', label: 'Slide 1: Market Opportunity' },
    { view: 'slide2', label: 'Slide 2: Profit Potential' },
    { view: 'slide3', label: 'Slide 3: Book Call' },
    { view: 'full', label: 'Results — Full Analysis' },
  ];

  const isDev = import.meta.env.DEV;
  const navigator = isDev ? (
    <DevNavigator
      phase={phase}
      currentScreenIndex={currentScreenIndex}
      screenLabels={screenLabels}
      resultsView={resultsView}
      resultsSlideLabels={resultsSlideLabels}
      onJumpTo={handleDevJump}
    />
  ) : null;
  const dashboardButton = isDev ? (
    <a
      href="#admin"
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95"
      style={{
        backgroundColor: 'rgba(13,27,42,0.85)',
        color: '#C9A84C',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 12px rgba(13,27,42,0.2)',
      }}
    >
      <BarChart3 size={14} />
      Dashboard
    </a>
  ) : null;

  if (hash === '#admin') {
    return <AdminShell />;
  }

  if (hash === '#dashboard') {
    return <AdminDashboard />;
  }

  if (phase === 'intro') {
    return <><IntroScreen onFirstAnswer={handleFirstAnswer} />{navigator}{dashboardButton}</>;
  }

  if (phase === 'gate') {
    const rawGateArea = placeDetails?.address ?? textAnswers[3] ?? null;
    const gateArea = rawGateArea ? rawGateArea.replace(/, USA$/, '') : null;
    const gateCity = gateArea ? (gateArea.split(',')[0]?.trim() || null) : null;
    return (
      <>
        <GateScreen onSubmit={handleGateSubmit} progressPercent={100} address={gateArea} city={gateCity} lat={placeDetails?.lat ?? null} lng={placeDetails?.lng ?? null} />
        {navigator}
        {dashboardButton}
      </>
    );
  }

  if (phase === 'evaluating') {
    return <><EvaluatingScreen onComplete={handleEvaluatingComplete} />{navigator}{dashboardButton}</>;
  }

  if (phase === 'results') {
    const result = computeResults(answers);
    const downPaymentAnswer = answers[18] ?? null;
    function handleResultsViewChange(v: ResultsView) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setResultsView(v);
    }
    const budgetAnswer = answers[6] ?? null;
    return <><ResultsScreen result={result} placeDetails={placeDetails} addressText={textAnswers[3] ?? null} rentcastData={rentcastData} rentcastLoading={rentcastLoading} onRetake={handleRetake} leadName={leadName} leadEmail={leadEmail} leadPhone={leadPhone} downPaymentAnswer={downPaymentAnswer} budgetAnswer={budgetAnswer} view={resultsView} onViewChange={handleResultsViewChange} />{navigator}{dashboardButton}</>;
  }

  const currentScreen = screenSequence[currentScreenIndex];
  const questionsAnswered = countQuestionsAnsweredBefore(currentScreenIndex);
  const progressPercent = (questionsAnswered / TOTAL_QUESTIONS) * 100;

  if (currentScreen.type === 'infoSlide' && currentScreen.index !== undefined) {
    const slide = infoSlides[currentScreen.index];
    return (
      <>
        <InfoSlide
          key={`info-${currentScreen.index}`}
          headline={slide.headline}
          body={slide.body}
          illustration={illustrations[currentScreen.index]}
          onContinue={advance}
          progressPercent={progressPercent}
        />
        {navigator}
        {dashboardButton}
      </>
    );
  }

  if (currentScreen.type === 'question' && currentScreen.index !== undefined) {
    const question = questions[currentScreen.index];
    const stateQuestion = questions.find(q => q.id === 2);
    const stateAnswer = stateQuestion && answers[2] !== undefined ? stateQuestion.options[answers[2]] : undefined;
    return (
      <>
        <QuizQuestion
          key={question.id}
          question={question}
          totalQuestions={TOTAL_QUESTIONS}
          questionsAnswered={questionsAnswered}
          textAnswer={textAnswers[question.id]}
          selectedState={stateAnswer}
          onAnswer={handleAnswer}
          onTextAnswer={handleTextAnswer}
          onBack={handleBack}
          canGoBack={true}
        />
        {navigator}
        {dashboardButton}
      </>
    );
  }

  return <>{navigator}</>;
}

export default App;
