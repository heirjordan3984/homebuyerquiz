import { useState } from 'react';
import { ArrowRight, Shield, Star, MapPin } from 'lucide-react';

interface GateScreenProps {
  onSubmit: (name: string, email: string, phone: string) => void;
  progressPercent: number;
  address?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
}

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

function buildStreetViewUrl(lat: number, lng: number): string {
  return `https://maps.googleapis.com/maps/api/streetview?size=600x320&location=${lat},${lng}&fov=90&pitch=0&key=${GOOGLE_API_KEY}`;
}

export default function GateScreen({ onSubmit, progressPercent, address, city, lat, lng }: GateScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [imgError, setImgError] = useState(false);

  function validate() {
    const e: { name?: string; email?: string; phone?: string } = {};
    if (!name.trim()) e.name = 'Please enter your name.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Please enter a valid email.';
    const digits = phone.replace(/\D/g, '');
    if (!phone.trim()) e.phone = 'Please enter your phone number.';
    else if (digits.length < 10) e.phone = 'Please enter a valid phone number.';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit(name.trim(), email.trim(), phone.trim());
  }

  const streetViewUrl = lat && lng && GOOGLE_API_KEY ? buildStreetViewUrl(lat, lng) : null;
  const showPhoto = streetViewUrl && !imgError;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Gold top bar */}
      <div className="w-full h-1" style={{ backgroundColor: '#C9A84C' }} />

      {/* Progress bar */}
      <div className="w-full h-1.5" style={{ backgroundColor: '#F0EDE8' }}>
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%`, backgroundColor: '#C9A84C' }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Property photo or fallback icon */}
          {showPhoto ? (
            <div className="mb-6 rounded-2xl overflow-hidden shadow-lg border" style={{ borderColor: '#E0DAD0' }}>
              <div className="relative">
                <img
                  src={streetViewUrl}
                  alt="Property exterior"
                  className="w-full block object-cover"
                  style={{ height: '220px' }}
                  onError={() => setImgError(true)}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-1.5"
                  style={{ backgroundColor: 'rgba(13,27,42,0.82)', backdropFilter: 'blur(4px)' }}
                >
                  <MapPin size={12} style={{ color: '#C9A84C', flexShrink: 0 }} />
                  <p className="text-white text-xs font-medium truncate">{address}</p>
                </div>
              </div>
            </div>
          ) : address ? (
            <div className="mb-6 rounded-2xl overflow-hidden shadow-md border px-4 py-3 flex items-center gap-2" style={{ borderColor: '#E0DAD0', backgroundColor: '#F5F2EC' }}>
              <MapPin size={14} style={{ color: '#C9A84C', flexShrink: 0 }} />
              <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{address}</p>
            </div>
          ) : (
            <div className="flex justify-center mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: '#C9A84C' }}
              >
                <MapPin size={24} color="#fff" strokeWidth={2.5} />
              </div>
            </div>
          )}

          {/* Heading */}
          <h1
            className="text-center text-2xl font-bold mb-2 leading-snug"
            style={{ color: '#1A1A1A', fontFamily: 'Georgia, serif' }}
          >
            {address ? (
              <>Your Results For <span style={{ color: '#C9A84C' }}>{address}</span> Are Ready</>
            ) : (
              'Your Results Are Ready'
            )}
          </h1>
          <p className="text-center text-sm mb-8" style={{ color: '#6B6B6B' }}>
            Enter your details below to unlock your personalized home-buying readiness report and market data{city ? ` for ${city}` : ''}.{' '}
            <span className="font-semibold" style={{ color: '#1A1A1A' }}>100% free, no strings attached.</span>
          </p>

          {/* Trust badges */}
          <div className="flex justify-center gap-5 mb-8">
            {[
              { icon: <Shield size={14} />, label: 'Private & Secure' },
              { icon: <Star size={14} />, label: 'No Spam, Ever' },
              { icon: <ArrowRight size={14} />, label: 'Instant Access' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: '#6B6B6B' }}>
                <span style={{ color: '#C9A84C' }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: '#4A4A4A' }}>
                Full Name <span style={{ color: '#C9A84C' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: undefined })); }}
                placeholder="Jane Smith"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
                style={{
                  borderColor: errors.name ? '#E53E3E' : '#E0DAD0',
                  backgroundColor: '#FFFFFF',
                  color: '#1A1A1A',
                  boxShadow: errors.name ? '0 0 0 3px rgba(229,62,62,0.12)' : undefined,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.18)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.name ? '#E53E3E' : '#E0DAD0'; e.currentTarget.style.boxShadow = errors.name ? '0 0 0 3px rgba(229,62,62,0.12)' : 'none'; }}
              />
              {errors.name && <p className="mt-1 text-xs" style={{ color: '#E53E3E' }}>{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: '#4A4A4A' }}>
                Email Address <span style={{ color: '#C9A84C' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
                placeholder="jane@example.com"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
                style={{
                  borderColor: errors.email ? '#E53E3E' : '#E0DAD0',
                  backgroundColor: '#FFFFFF',
                  color: '#1A1A1A',
                  boxShadow: errors.email ? '0 0 0 3px rgba(229,62,62,0.12)' : undefined,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.18)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.email ? '#E53E3E' : '#E0DAD0'; e.currentTarget.style.boxShadow = errors.email ? '0 0 0 3px rgba(229,62,62,0.12)' : 'none'; }}
              />
              {errors.email && <p className="mt-1 text-xs" style={{ color: '#E53E3E' }}>{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: '#4A4A4A' }}>
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
                style={{ borderColor: errors.phone ? '#E53E3E' : '#E0DAD0', backgroundColor: '#FFFFFF', color: '#1A1A1A' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.18)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.phone ? '#E53E3E' : '#E0DAD0'; e.currentTarget.style.boxShadow = errors.phone ? '0 0 0 3px rgba(229,62,62,0.12)' : 'none'; }}
              />
              {errors.phone && <p className="mt-1 text-xs" style={{ color: '#E53E3E' }}>{errors.phone}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 mt-2"
              style={{ backgroundColor: '#C9A84C', color: '#FFFFFF' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B8942E'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#C9A84C'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Unlock My Results
              <ArrowRight size={16} />
            </button>

            <p className="text-center text-xs mt-3" style={{ color: '#9A9A9A' }}>
              Your data is encrypted and securely stored.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
