import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, ArrowRight, Loader } from 'lucide-react';

export interface PlaceDetails {
  address: string;
  placeId: string;
  lat: number | null;
  lng: number | null;
  mapsUrl: string;
}

interface AddressAutocompleteProps {
  value: string;
  onSubmit: (value: string, placeDetails?: PlaceDetails) => void;
  placeholder?: string;
}

interface PredictionItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

let mapsLoaded = false;
let mapsLoadPromise: Promise<void> | null = null;

function loadMapsScript(): Promise<void> {
  if (mapsLoaded) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise<void>((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('No Google Maps API key'));
      return;
    }

    if ((window as any).google?.maps?.places) {
      mapsLoaded = true;
      resolve();
      return;
    }

    const callbackName = '__gmapsCB_' + Date.now();
    (window as any)[callbackName] = () => {
      mapsLoaded = true;
      resolve();
      delete (window as any)[callbackName];
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      mapsLoadPromise = null;
      reject(new Error('Maps failed to load'));
    };
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

export default function AddressAutocomplete({ value, onSubmit, placeholder }: AddressAutocompleteProps) {
  const [localText, setLocalText] = useState(value ?? '');
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    loadMapsScript()
      .then(() => {
        serviceRef.current = new google.maps.places.AutocompleteService();
        setMapsReady(true);
      })
      .catch((err) => console.error('Maps load error:', err));
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchPredictions = useCallback(
    async (input: string) => {
      if (input.length < 3 || !serviceRef.current) {
        setPredictions([]);
        setShowDropdown(false);
        return;
      }

      const reqId = ++requestIdRef.current;
      setLoading(true);

      serviceRef.current.getPlacePredictions(
        {
          input,
          types: ['(cities)'],
          componentRestrictions: { country: 'us' },
        },
        (results, status) => {
          if (reqId !== requestIdRef.current) return;
          setLoading(false);

          if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
            setPredictions([]);
            setShowDropdown(false);
            return;
          }

          const items: PredictionItem[] = results.slice(0, 5).map((r) => {
            const main = r.structured_formatting.main_text;
            const secondary = r.structured_formatting.secondary_text ?? '';
            return {
              placeId: r.place_id,
              mainText: main,
              secondaryText: secondary,
              fullText: r.description,
            };
          });

          setPredictions(items);
          setShowDropdown(items.length > 0);
        }
      );
    },
    [mapsReady]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setLocalText(val);
    setSelectedIndex(-1);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchPredictions(val), 280);
  }

  async function handleSelectPrediction(item: PredictionItem) {
    setLocalText(item.fullText);
    setPredictions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId: item.placeId }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
        const loc = results[0].geometry.location;
        const address = results[0].formatted_address;
        const details: PlaceDetails = {
          address,
          placeId: item.placeId,
          lat: loc.lat(),
          lng: loc.lng(),
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}&query_place_id=${item.placeId}`,
        };
        onSubmit(details.address, details);
      } else {
        onSubmit(item.fullText);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && predictions[selectedIndex]) {
        handleSelectPrediction(predictions[selectedIndex]);
      } else if (localText.trim()) {
        handleSubmitText();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  }

  function handleSubmitText() {
    if (!localText.trim()) return;
    onSubmit(localText.trim());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: localText.trim() ? '#C9A84C' : '#9CA3AF' }}
        >
          <MapPin size={16} strokeWidth={2} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={localText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Enter a city or area...'}
          autoComplete="off"
          className="w-full rounded-xl font-dm outline-none transition-all duration-200"
          style={{
            padding: '16px 52px 16px 42px',
            backgroundColor: '#FFFFFF',
            color: '#0D1B2A',
            border: '1.5px solid #E5E7EB',
            fontSize: '1rem',
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '1.5px solid rgba(201,168,76,0.55)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.08)';
            if (predictions.length > 0) setShowDropdown(true);
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '1.5px solid #E5E7EB';
            e.currentTarget.style.boxShadow = 'none';
            setTimeout(() => setShowDropdown(false), 150);
          }}
        />

        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader size={16} style={{ color: '#C9A84C', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {!loading && localText.trim() && (
          <button
            onClick={handleSubmitText}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
            style={{ backgroundColor: '#C9A84C', color: '#FFFFFF' }}
          >
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        )}

        {showDropdown && predictions.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #E8E0C8',
              boxShadow: '0 8px 32px rgba(13,27,42,0.12)',
            }}
          >
            {predictions.map((p, i) => (
              <button
                key={p.placeId}
                onMouseDown={() => handleSelectPrediction(p)}
                className="w-full text-left flex items-start gap-3 transition-colors duration-100"
                style={{
                  padding: '11px 16px',
                  backgroundColor: selectedIndex === i ? 'rgba(201,168,76,0.07)' : 'transparent',
                  borderBottom: i < predictions.length - 1 ? '1px solid #F3F0E8' : 'none',
                }}
                onMouseEnter={() => setSelectedIndex(i)}
                onMouseLeave={() => setSelectedIndex(-1)}
              >
                <MapPin
                  size={14}
                  strokeWidth={2}
                  style={{ color: '#C9A84C', flexShrink: 0, marginTop: '2px' }}
                />
                <span className="flex flex-col min-w-0">
                  <span className="font-dm font-medium text-sm truncate" style={{ color: '#0D1B2A' }}>
                    {p.mainText}
                  </span>
                  <span className="font-dm text-xs truncate" style={{ color: '#9CA3AF' }}>
                    {p.secondaryText}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleSubmitText}
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
  );
}
