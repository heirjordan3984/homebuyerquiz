import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type CallType = 'phone' | 'zoom';

interface BookingScreenProps {
  onBack: () => void;
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  propertyAddress?: string | null;
}

const TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function buildMonthGrid(viewMonth: Date): (Date | null)[] {
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function parseSlotToHourMinute(slot: string): { hour: number; minute: number } {
  const match = slot.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return { hour: 9, minute: 0 };
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
}

export default function BookingScreen({
  onBack,
  leadName,
  leadEmail,
  leadPhone,
  propertyAddress,
}: BookingScreenProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const minDate = useMemo(() => addDays(today, 1), [today]);
  const maxDate = useMemo(() => addDays(today, 45), [today]);

  const [callType, setCallType] = useState<CallType>('phone');
  const [viewMonth, setViewMonth] = useState<Date>(
    new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [name, setName] = useState(leadName ?? '');
  const [email, setEmail] = useState(leadEmail ?? '');
  const [phone, setPhone] = useState(leadPhone ?? '');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(leadName ?? '');
    setEmail(leadEmail ?? '');
    setPhone(leadPhone ?? '');
  }, [leadName, leadEmail, leadPhone]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const monthCells = buildMonthGrid(viewMonth);
  const canPrevMonth =
    new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getTime() >
    new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const canNextMonth =
    new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1).getTime() <=
    new Date(maxDate.getFullYear(), maxDate.getMonth(), 1).getTime();

  function isDateSelectable(d: Date | null): boolean {
    if (!d) return false;
    if (d.getTime() < minDate.getTime()) return false;
    if (d.getTime() > maxDate.getTime()) return false;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) return false;
    return true;
  }

  function emailValid(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSubmit() {
    setError(null);
    if (!selectedDate) return setError('Please choose a date.');
    if (!selectedSlot) return setError('Please choose a time.');
    if (!name.trim()) return setError('Please enter your name.');
    if (!emailValid(email)) return setError('Please enter a valid email.');
    if (callType === 'phone' && !phone.trim())
      return setError('Phone number is required for a phone call.');

    const { hour, minute } = parseSlotToHourMinute(selectedSlot);
    const scheduled = new Date(selectedDate);
    scheduled.setHours(hour, minute, 0, 0);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

    setSubmitting(true);
    const { error: insertError } = await supabase.from('advisor_bookings').insert({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      property_address: propertyAddress ?? '',
      call_type: callType,
      scheduled_at: scheduled.toISOString(),
      timezone: tz,
      notes: notes.trim(),
    });
    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'Schedule');
    }

    if (email.trim().toLowerCase() !== 'gabrielbcarvalho2014@gmail.com') {
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/slack-notify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'booking',
          data: {
            name: name.trim(),
            callType,
            scheduledAt: scheduled.toISOString(),
            timezone: tz,
          },
        }),
      }).catch((err) => console.error('[slack-notify] booking error:', err));
    }

    setSubmitted(true);
  }

  const bullets = [
    {
      icon: TrendingUp,
      title: 'A strategy tuned to your purchase',
      detail:
        'Walk through your specific market position and the highest-leverage moves to lower your purchase price.',
    },
    {
      icon: ShieldCheck,
      title: 'Zero pressure, zero pitch',
      detail:
        'A frank advisor — not a listing agent. You leave with clarity whether you buy or not.',
    },
    {
      icon: Sparkles,
      title: 'Real numbers, not guesses',
      detail:
        'See where this home stands today and what the right plan could save you on your purchase.',
    },
  ];

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const accent = '#C9A84C';
  const navy = '#0D1B2A';
  const muted = '#5A6573';
  const border = '#E0DAD0';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="w-full h-1" style={{ backgroundColor: accent }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-12">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 font-dm text-xs font-medium tracking-wide mb-5 transition-colors"
          style={{ color: muted }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = navy; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = muted; }}
        >
          <ArrowLeft size={14} />
          Back to results
        </button>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#FAFAF8', border: `1px solid ${border}` }}
        >
        {submitted ? (
          <div className="px-6 sm:px-10 py-12 text-center">
            <div
              className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-5"
              style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}
            >
              <CheckCircle size={28} style={{ color: accent }} />
            </div>
            <h2
              className="font-playfair font-bold mb-3"
              style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', color: navy }}
            >
              Your call is booked
            </h2>
            <p className="font-dm text-sm leading-relaxed mb-2" style={{ color: muted }}>
              We sent the details to {email}. Your advisor will reach out at the time
              you selected.
            </p>
            {selectedDate && selectedSlot && (
              <p
                className="font-dm font-medium text-sm mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(201,168,76,0.12)',
                  color: navy,
                  border: `1px solid rgba(201,168,76,0.3)`,
                }}
              >
                <CalendarIcon size={14} style={{ color: accent }} />
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                · {selectedSlot} ({callType === 'phone' ? 'Phone' : 'Zoom'})
              </p>
            )}
            <div>
              <button
                onClick={onBack}
                className="font-dm font-medium px-6 py-3 rounded-full text-sm transition-transform hover:scale-[1.02] active:scale-95"
                style={{ backgroundColor: navy, color: 'white' }}
              >
                Back to results
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            {/* Left rail: pitch */}
            <div
              className="px-6 sm:px-8 py-8 md:py-10"
              style={{
                backgroundColor: navy,
                color: 'white',
              }}
            >
              <p
                className="font-dm font-medium tracking-[0.18em] uppercase text-xs mb-3"
                style={{ color: accent }}
              >
                Free Advisor Call
              </p>
              <h2
                className="font-playfair font-bold leading-tight mb-3"
                style={{ fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)' }}
              >
                Get a clear plan in 20 minutes
              </h2>
              <p
                className="font-dm text-sm leading-relaxed mb-6"
                style={{ color: 'rgba(255,255,255,0.72)' }}
              >
                A short, focused call with a real estate advisor — no pitch, no commitment.
              </p>

              <ul className="space-y-4">
                {bullets.map(({ icon: Icon, title, detail }) => (
                  <li key={title} className="flex gap-3">
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                      style={{ backgroundColor: 'rgba(201,168,76,0.18)' }}
                    >
                      <Icon size={14} style={{ color: accent }} />
                    </div>
                    <div>
                      <p className="font-dm font-semibold text-sm leading-snug mb-0.5">
                        {title}
                      </p>
                      <p
                        className="font-dm text-xs leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.65)' }}
                      >
                        {detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div
                className="mt-8 pt-6 flex items-center gap-2 text-xs font-dm"
                style={{ borderTop: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}
              >
                <Clock size={12} style={{ color: accent }} />
                Typically 15–20 minutes · Limited spots each week
              </div>
            </div>

            {/* Right rail: form */}
            <div className="px-6 sm:px-8 py-8 md:py-10">
              <h3
                className="font-playfair font-bold mb-1"
                style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', color: navy }}
              >
                Pick a time that works
              </h3>
              <p className="font-dm text-xs mb-5" style={{ color: muted }}>
                Choose how you'd like to meet, then select a day and time.
              </p>

              {/* Call type toggle */}
              <div
                className="grid grid-cols-2 gap-2 p-1 rounded-xl mb-5"
                style={{ backgroundColor: '#F0EDE8' }}
              >
                {(['phone', 'zoom'] as CallType[]).map((type) => {
                  const selected = callType === type;
                  const Icon = type === 'phone' ? Phone : Video;
                  return (
                    <button
                      key={type}
                      onClick={() => setCallType(type)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg font-dm font-medium text-sm transition-all"
                      style={{
                        backgroundColor: selected ? 'white' : 'transparent',
                        color: selected ? navy : muted,
                        boxShadow: selected ? '0 1px 3px rgba(13,27,42,0.08)' : 'none',
                        border: selected ? `1px solid ${border}` : '1px solid transparent',
                      }}
                    >
                      <Icon size={14} style={{ color: selected ? accent : muted }} />
                      {type === 'phone' ? 'Phone Call' : 'Zoom Call'}
                    </button>
                  );
                })}
              </div>

              {/* Calendar */}
              <div
                className="rounded-xl p-3 sm:p-4 mb-5"
                style={{ backgroundColor: 'white', border: `1px solid ${border}` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() =>
                      canPrevMonth &&
                      setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
                    }
                    disabled={!canPrevMonth}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                    style={{ color: navy }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <p className="font-playfair font-semibold text-sm" style={{ color: navy }}>
                    {formatMonthYear(viewMonth)}
                  </p>
                  <button
                    onClick={() =>
                      canNextMonth &&
                      setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
                    }
                    disabled={!canNextMonth}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                    style={{ color: navy }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
                  {dayHeaders.map((d) => (
                    <div
                      key={d}
                      className="text-center font-dm text-[10px] uppercase tracking-wider py-1"
                      style={{ color: muted }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {monthCells.map((d, idx) => {
                    if (!d) return <div key={idx} />;
                    const selectable = isDateSelectable(d);
                    const isSelected = selectedDate ? sameDay(selectedDate, d) : false;
                    return (
                      <button
                        key={idx}
                        disabled={!selectable}
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedSlot(null);
                        }}
                        className="aspect-square rounded-lg font-dm text-sm transition-all"
                        style={{
                          backgroundColor: isSelected
                            ? accent
                            : selectable
                            ? 'transparent'
                            : 'transparent',
                          color: isSelected ? navy : selectable ? navy : '#C7C2BA',
                          fontWeight: isSelected ? 600 : 400,
                          border: isSelected
                            ? `1px solid ${accent}`
                            : selectable
                            ? `1px solid transparent`
                            : '1px solid transparent',
                          cursor: selectable ? 'pointer' : 'not-allowed',
                        }}
                        onMouseEnter={(e) => {
                          if (selectable && !isSelected)
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                              'rgba(201,168,76,0.12)';
                        }}
                        onMouseLeave={(e) => {
                          if (selectable && !isSelected)
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div className="mb-5">
                  <p
                    className="font-dm font-medium text-xs uppercase tracking-wider mb-2"
                    style={{ color: muted }}
                  >
                    Available times ·{' '}
                    {selectedDate.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const selected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className="py-2 rounded-lg font-dm text-sm transition-all"
                          style={{
                            backgroundColor: selected ? navy : 'white',
                            color: selected ? 'white' : navy,
                            border: `1px solid ${selected ? navy : border}`,
                          }}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contact details */}
              <div className="space-y-3 mb-4">
                <div>
                  <label
                    className="font-dm font-medium text-[11px] uppercase tracking-wider block mb-1"
                    style={{ color: muted }}
                  >
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full font-dm text-sm px-3 py-2.5 rounded-lg outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'white',
                      border: `1px solid ${border}`,
                      color: navy,
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className="font-dm font-medium text-[11px] uppercase tracking-wider block mb-1"
                      style={{ color: muted }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full font-dm text-sm px-3 py-2.5 rounded-lg outline-none"
                      style={{
                        backgroundColor: 'white',
                        border: `1px solid ${border}`,
                        color: navy,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="font-dm font-medium text-[11px] uppercase tracking-wider block mb-1"
                      style={{ color: muted }}
                    >
                      Phone {callType === 'phone' && <span style={{ color: accent }}>*</span>}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full font-dm text-sm px-3 py-2.5 rounded-lg outline-none"
                      style={{
                        backgroundColor: 'white',
                        border: `1px solid ${border}`,
                        color: navy,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="font-dm font-medium text-[11px] uppercase tracking-wider block mb-1"
                    style={{ color: muted }}
                  >
                    Anything you'd like the advisor to know? (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full font-dm text-sm px-3 py-2.5 rounded-lg outline-none resize-none"
                    style={{
                      backgroundColor: 'white',
                      border: `1px solid ${border}`,
                      color: navy,
                    }}
                  />
                </div>
              </div>

              {error && (
                <div
                  className="font-dm text-xs px-3 py-2 rounded-lg mb-3"
                  style={{
                    backgroundColor: '#FBEEEE',
                    border: '1px solid #F1D6D6',
                    color: '#8A2A2A',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full font-dm font-semibold py-3.5 rounded-full text-sm transition-all duration-300 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: accent, color: navy }}
              >
                {submitting ? 'Booking…' : 'Confirm My Call'}
                {!submitting && <ChevronRight size={15} />}
              </button>
              <p
                className="font-dm text-[11px] text-center mt-2"
                style={{ color: muted }}
              >
                You'll get a confirmation by email.
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
