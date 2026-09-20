export function IllustrationPreparationTrap() {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16 / 10',
        background: 'linear-gradient(135deg, #FAFAF8 0%, #F5F1E8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
      }}
    >
      <svg
        viewBox="0 0 320 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', maxWidth: '300px' }}
      >
        {/* Clipboard body */}
        <rect
          x="80"
          y="40"
          width="160"
          height="130"
          rx="12"
          fill="#FFFFFF"
          stroke="#0D1B2A"
          strokeWidth="2"
        />
        {/* Clipboard clip */}
        <rect
          x="130"
          y="30"
          width="60"
          height="20"
          rx="6"
          fill="#0D1B2A"
        />
        <rect
          x="138"
          y="34"
          width="44"
          height="12"
          rx="3"
          fill="#C9A84C"
        />

        {/* Checklist lines */}
        <g stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round">
          <line x1="100" y1="78" x2="200" y2="78" />
          <line x1="100" y1="100" x2="180" y2="100" />
          <line x1="100" y1="122" x2="210" y2="122" />
          <line x1="100" y1="144" x2="160" y2="144" />
        </g>

        {/* Checkmarks - first two checked */}
        <g>
          <circle cx="100" cy="78" r="8" fill="#C9A84C" />
          <path
            d="M96 78 L99 81 L104 75"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="100" cy="100" r="8" fill="#C9A84C" />
          <path
            d="M96 100 L99 103 L104 97"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Unchecked circles */}
          <circle cx="100" cy="122" r="8" fill="none" stroke="#D1D5DB" strokeWidth="2" />
          <circle cx="100" cy="144" r="8" fill="none" stroke="#D1D5DB" strokeWidth="2" />
        </g>

        {/* Magnifying glass overlay */}
        <g>
          <circle
            cx="232"
            cy="132"
            r="28"
            fill="none"
            stroke="#0D1B2A"
            strokeWidth="3"
          />
          <circle cx="232" cy="132" r="22" fill="rgba(201,168,76,0.10)" />
          {/* Dollar sign inside lens */}
          <text
            x="232"
            y="139"
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fill="#C9A84C"
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            $
          </text>
          {/* Handle */}
          <line
            x1="252"
            y1="152"
            x2="268"
            y2="168"
            stroke="#0D1B2A"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

export function IllustrationPricingGap() {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16 / 10',
        background: 'linear-gradient(160deg, #FAFAF8 0%, #F5F1E8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 32px',
      }}
    >
      <svg
        viewBox="0 0 360 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', maxWidth: '340px' }}
      >
        {/* House silhouette at top center */}
        <g>
          <path
            d="M180 28 L148 52 L148 80 L212 80 L212 52 Z"
            fill="#0D1B2A"
            opacity="0.08"
          />
          <path
            d="M180 28 L148 52 L148 80 L212 80 L212 52 Z"
            fill="none"
            stroke="#0D1B2A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect x="172" y="62" width="16" height="18" rx="2" fill="#C9A84C" opacity="0.5" />
        </g>

        {/* Comparison cards */}
        {/* Left card - Emotional bid */}
        <g>
          <rect x="32" y="95" width="130" height="100" rx="10" fill="#FFFFFF" />
          <rect x="32" y="95" width="130" height="100" rx="10" stroke="#E5E7EB" strokeWidth="1.5" />
          {/* Red indicator bar */}
          <rect x="32" y="95" width="130" height="5" rx="2.5" fill="#DC2626" opacity="0.7" />
          {/* Amount */}
          <text
            x="97"
            y="135"
            textAnchor="middle"
            fontSize="22"
            fontWeight="800"
            fill="#0D1B2A"
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            $468K
          </text>
          {/* Label */}
          <text
            x="97"
            y="155"
            textAnchor="middle"
            fontSize="10"
            fontWeight="500"
            fill="#9CA3AF"
            fontFamily="'DM Sans', system-ui, sans-serif"
            letterSpacing="0.5"
          >
            EMOTIONAL BID
          </text>
          {/* Extra cost callout */}
          <rect x="60" y="167" width="74" height="18" rx="9" fill="#DC2626" opacity="0.08" />
          <text
            x="97"
            y="179"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="#DC2626"
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            +$18,000
          </text>
        </g>

        {/* Right card - Smart offer */}
        <g>
          <rect x="198" y="95" width="130" height="100" rx="10" fill="#FFFFFF" />
          <rect x="198" y="95" width="130" height="100" rx="10" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5" />
          {/* Gold indicator bar */}
          <rect x="198" y="95" width="130" height="5" rx="2.5" fill="#C9A84C" />
          {/* Amount */}
          <text
            x="263"
            y="135"
            textAnchor="middle"
            fontSize="22"
            fontWeight="800"
            fill="#0D1B2A"
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            $450K
          </text>
          {/* Label */}
          <text
            x="263"
            y="155"
            textAnchor="middle"
            fontSize="10"
            fontWeight="500"
            fill="#C9A84C"
            fontFamily="'DM Sans', system-ui, sans-serif"
            letterSpacing="0.5"
          >
            SMART OFFER
          </text>
          {/* Savings callout */}
          <rect x="222" y="167" width="82" height="18" rx="9" fill="rgba(201,168,76,0.12)" />
          <text
            x="263"
            y="179"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="#92700F"
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            Fair market value
          </text>
        </g>

        {/* Connecting arrow */}
        <g>
          <line x1="162" y1="145" x2="198" y2="145" stroke="#0D1B2A" strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M194 141 L200 145 L194 149" fill="none" stroke="#0D1B2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Bottom note */}
        <text
          x="180"
          y="212"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="500"
          fill="#9CA3AF"
          fontFamily="'DM Sans', system-ui, sans-serif"
        >
          Same home. Different strategy.
        </text>
      </svg>
    </div>
  );
}

export function IllustrationAgentGap() {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16 / 10',
        background: 'linear-gradient(160deg, #FAFAF8 0%, #F5F1E8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 32px',
      }}
    >
      <svg
        viewBox="0 0 360 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', maxWidth: '340px' }}
      >
        {/* House silhouette centered at top */}
        <g>
          <path
            d="M180 20 L140 48 L140 78 L220 78 L220 48 Z"
            fill="#0D1B2A"
            opacity="0.07"
          />
          <path
            d="M180 20 L140 48 L140 78 L220 78 L220 48 Z"
            fill="none"
            stroke="#0D1B2A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect x="170" y="58" width="20" height="20" rx="2" fill="#C9A84C" opacity="0.4" />
        </g>

        {/* "Same home" label */}
        <text
          x="180"
          y="95"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="500"
          fill="#9CA3AF"
          fontFamily="'DM Sans', system-ui, sans-serif"
          letterSpacing="0.5"
        >
          SAME HOME
        </text>

        {/* Divider lines going down to two buyers */}
        <line x1="180" y1="100" x2="100" y2="118" stroke="#E5E7EB" strokeWidth="1.5" />
        <line x1="180" y1="100" x2="260" y2="118" stroke="#E5E7EB" strokeWidth="1.5" />

        {/* Left buyer card - average */}
        <g>
          <rect x="38" y="120" width="124" height="80" rx="10" fill="#FFFFFF" />
          <rect x="38" y="120" width="124" height="80" rx="10" stroke="#E5E7EB" strokeWidth="1.5" />
          {/* Person icon */}
          <circle cx="68" cy="140" r="10" fill="#E5E7EB" />
          <circle cx="68" cy="136" r="4" fill="#9CA3AF" />
          <path d="M60 145 Q68 150 76 145" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
          {/* Price */}
          <text
            x="100"
            y="170"
            textAnchor="middle"
            fontSize="18"
            fontWeight="800"
            fill="#0D1B2A"
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            $450K
          </text>
          {/* Label */}
          <text
            x="100"
            y="188"
            textAnchor="middle"
            fontSize="9"
            fontWeight="500"
            fill="#9CA3AF"
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            Average buyer
          </text>
        </g>

        {/* Right buyer card - smart */}
        <g>
          <rect x="198" y="120" width="124" height="80" rx="10" fill="#FFFFFF" />
          <rect x="198" y="120" width="124" height="80" rx="10" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5" />
          {/* Gold top bar */}
          <rect x="198" y="120" width="124" height="4" rx="2" fill="#C9A84C" />
          {/* Person icon */}
          <circle cx="228" cy="140" r="10" fill="rgba(201,168,76,0.15)" />
          <circle cx="228" cy="136" r="4" fill="#C9A84C" />
          <path d="M220 145 Q228 150 236 145" stroke="#C9A84C" strokeWidth="1.5" fill="none" />
          {/* Price */}
          <text
            x="260"
            y="170"
            textAnchor="middle"
            fontSize="18"
            fontWeight="800"
            fill="#0D1B2A"
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            $396K
          </text>
          {/* Label */}
          <text
            x="260"
            y="188"
            textAnchor="middle"
            fontSize="9"
            fontWeight="500"
            fill="#C9A84C"
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            Prepared buyer
          </text>
        </g>

        {/* Savings callout at bottom center */}
        <g>
          <rect x="134" y="205" width="92" height="14" rx="7" fill="rgba(201,168,76,0.12)" />
          <text
            x="180"
            y="215"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="#92700F"
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            $54K difference
          </text>
        </g>
      </svg>
    </div>
  );
}

export function IllustrationBuySellSequence() {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16 / 10',
        background: 'linear-gradient(160deg, #FAFAF8 0%, #F5F1E8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 32px',
      }}
    >
      <svg
        viewBox="0 0 300 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', maxWidth: '300px' }}
      >
        {/* Wrong order */}
        <g>
          <rect x="20" y="40" width="120" height="50" rx="8" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />
          <text x="80" y="60" textAnchor="middle" fontSize="10" fontWeight="600" fill="#DC2626" fontFamily="'DM Sans', system-ui, sans-serif">Sell first, rush to buy</text>
          <text x="80" y="78" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0D1B2A" fontFamily="'DM Sans', system-ui, sans-serif">-$22K</text>
        </g>

        {/* Right order */}
        <g>
          <rect x="160" y="40" width="120" height="50" rx="8" fill="#FFFFFF" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5" />
          <rect x="160" y="40" width="120" height="4" rx="2" fill="#C9A84C" />
          <text x="220" y="60" textAnchor="middle" fontSize="10" fontWeight="600" fill="#C9A84C" fontFamily="'DM Sans', system-ui, sans-serif">Right sequence</text>
          <text x="220" y="78" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0D1B2A" fontFamily="'DM Sans', system-ui, sans-serif">+$22K</text>
        </g>

        {/* Simple arrow between */}
        <text x="150" y="69" textAnchor="middle" fontSize="14" fill="#D1D5DB" fontFamily="'DM Sans', system-ui, sans-serif">&#8594;</text>

        {/* Bottom takeaway */}
        <text x="150" y="130" textAnchor="middle" fontSize="11" fontWeight="500" fill="#6B7280" fontFamily="'DM Sans', system-ui, sans-serif">Same home. Same market.</text>
        <text x="150" y="148" textAnchor="middle" fontSize="11" fontWeight="600" fill="#0D1B2A" fontFamily="'DM Sans', system-ui, sans-serif">Different sequence = $44K swing.</text>
      </svg>
    </div>
  );
}

export function IllustrationCostOfWaiting() {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16 / 10',
        background: 'linear-gradient(160deg, #FAFAF8 0%, #F5F1E8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 32px',
      }}
    >
      <svg
        viewBox="0 0 300 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', maxWidth: '300px' }}
      >
        {/* Month labels */}
        <text x="60" y="145" textAnchor="middle" fontSize="9" fontWeight="500" fill="#9CA3AF" fontFamily="'DM Sans', system-ui, sans-serif">Today</text>
        <text x="130" y="145" textAnchor="middle" fontSize="9" fontWeight="500" fill="#9CA3AF" fontFamily="'DM Sans', system-ui, sans-serif">+3 mo</text>
        <text x="200" y="145" textAnchor="middle" fontSize="9" fontWeight="500" fill="#9CA3AF" fontFamily="'DM Sans', system-ui, sans-serif">+6 mo</text>

        {/* Rising cost bars */}
        <rect x="42" y="90" width="36" height="40" rx="4" fill="#C9A84C" opacity="0.2" />
        <rect x="112" y="70" width="36" height="60" rx="4" fill="#C9A84C" opacity="0.4" />
        <rect x="182" y="46" width="36" height="84" rx="4" fill="#C9A84C" opacity="0.7" />

        {/* Dollar amounts on bars */}
        <text x="60" y="82" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0D1B2A" fontFamily="'DM Sans', system-ui, sans-serif">$0</text>
        <text x="130" y="62" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0D1B2A" fontFamily="'DM Sans', system-ui, sans-serif">$4,200</text>
        <text x="200" y="38" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0D1B2A" fontFamily="'DM Sans', system-ui, sans-serif">$8,400</text>



        {/* Bottom label */}
        <text x="150" y="170" textAnchor="middle" fontSize="10" fontWeight="500" fill="#6B7280" fontFamily="'DM Sans', system-ui, sans-serif">Estimated cost of delay at current rate trends</text>
      </svg>
    </div>
  );
}
