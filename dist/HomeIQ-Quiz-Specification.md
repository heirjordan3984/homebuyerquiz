# HomeIQ Buyer Quiz — Complete Rebuild Specification

---

## TABLE OF CONTENTS

1. [Brand & Design System](#1-brand--design-system)
2. [Complete User Flow](#2-complete-user-flow)
3. [Screen 1: Intro / Landing Page](#3-screen-1-intro--landing-page)
4. [Screen 2–19: Quiz Questions (Full List)](#4-screen-219-quiz-questions-full-list)
5. [Info Slides (5 Educational Interstitials)](#5-info-slides-5-educational-interstitials)
6. [Screen: Address Input (Google Autocomplete)](#6-screen-address-input-google-autocomplete)
7. [Screen: Evaluating / Loading](#7-screen-evaluating--loading)
8. [Screen: Lead Capture Gate](#8-screen-lead-capture-gate)
9. [Results: Slide 1 — Market Intelligence](#9-results-slide-1--market-intelligence)
10. [Results: Slide 2 — Savings Potential](#10-results-slide-2--savings-potential)
11. [Results: Full Analysis Page](#11-results-full-analysis-page)
12. [Results: Booking Screen](#12-results-booking-screen)
13. [Scoring Logic](#13-scoring-logic)
14. [Animations & Micro-Interactions](#14-animations--micro-interactions)
15. [Image Inventory](#15-image-inventory)
16. [Technical Notes](#16-technical-notes)

---

## 1. BRAND & DESIGN SYSTEM

### Brand Name
**HomeIQ**

### Fonts
- **Headings:** Playfair Display (serif) — used for all major headings, prices, and display text. Weights: 600 (semibold), 700 (bold).
- **Body / UI:** DM Sans (sans-serif) — used for all body text, buttons, labels, form inputs, and small text. Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold).
- Maximum 3 font weights used at any time.

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Gold (Primary)** | `#C9A84C` | Primary action buttons, accent bars, icons, progress indicators, brand elements |
| **Gold Hover** | `#D4B86A` | Button hover state |
| **Gold Light** | `rgba(201,168,76,0.12)` | Icon circle backgrounds, subtle highlights |
| **Gold BG** | `#FFF8EC` | Callout/tip box backgrounds |
| **Gold Border** | `rgba(201,168,76,0.3)` | Callout box borders |
| **Navy (Text)** | `#0D1B2A` | Primary text color, dark section backgrounds |
| **Navy Lighter** | `#162436` | Gradient endpoint for dark sections |
| **Page Background** | `#FAFAF8` | Main page background |
| **Warm White** | `#FFFFFF` | Cards, inputs, results pages |
| **Warm Cream** | `#F9F7F2` | Card body backgrounds |
| **Cream Dark** | `#FDFAF4` | Info card interiors |
| **Border Tan** | `#E8E0C8` | Card borders |
| **Border Light** | `#E5E7EB` | Input borders, dividers |
| **Border Very Light** | `#F3F0E8` | Dropdown dividers |
| **Gray 600** | `#4B5563` | Secondary text |
| **Gray 500** | `#6B7280` | Body/description text |
| **Gray 400** | `#9CA3AF` | Muted labels, placeholders |
| **Gray 300** | `#D1D5DB` | Disabled text |
| **Muted Text** | `#5A6573` | Booking screen muted text |
| **Green (Success)** | `#2D6A4F` | Positive values, equity, savings |
| **Green Light BG** | `#F0FDF4` | Success card backgrounds |
| **Green Pill BG** | `#D8F3DC` | "Ready" badges |
| **Green Bright** | `#4ADE80` | Live indicator dots |
| **Green Text** | `#16A34A` | Trend percentage text |
| **Orange** | `#B5530A` | "Getting Close" badges |
| **Orange BG** | `#FFF3E4` | Warning badges |
| **Red Error** | `#DC2626` / `#E53E3E` | Error text, validation |
| **Red Alert BG** | `#FADBD8` | Alert badges |
| **Red Alert Text** | `#922B21` | Alert badge text |
| **Error BG** | `#FBEEEE` | Error message background |
| **Error Border** | `#F1D6D6` | Error message border |
| **Error Text** | `#8A2A2A` | Error message text |

### Spacing System
- 8px base spacing system
- Border radius: `rounded-xl` (12px) for cards, `rounded-full` for buttons and pills
- Cards have `1.5px solid #E8E0C8` borders

### Global Page Background
`#FAFAF8` (very warm off-white)

### Custom CSS
- All scrollbars are hidden globally (`scrollbar-width: none`, `::-webkit-scrollbar { display: none }`)
- Custom range slider styling (`.equity-slider`) with gold `#C9A84C` thumb, 6px height track
- Smooth scroll behavior on html element
- Font antialiasing enabled (`-webkit-font-smoothing: antialiased`)

---

## 2. COMPLETE USER FLOW

The quiz follows this exact sequence. Each item advances to the next on user action (selecting an answer or tapping Continue).

```
1.  Intro Screen (contains Q1: Property Type embedded)
2.  Q2: State Selection (dropdown)
3.  Q4: Purchase Timeline
4.  INFO SLIDE 1: "The Hidden Cost Most Buyers Miss"
5.  Q5: Home Condition Preference
6.  Q6: Budget Range
7.  Q7: Top Priority
8.  INFO SLIDE 2: "Why Most Buyers Overpay"
9.  Q8: Market Awareness
10. Q9: Primary Motivation
11. Q10: Financing Status
12. INFO SLIDE 3: "The Agent Gap Nobody Talks About"
13. Q11: Deal Preference
14. Q12: Credit Profile
15. Q13: Current Housing Situation
16. INFO SLIDE 4: "The Buy-Sell Sequence That Saves Thousands"
17. Q14: Investment Intent
18. Q15: Must-Have Features
19. Q16: Deal Breakers
20. INFO SLIDE 5: "The Real Cost of Waiting"
21. Q19: Realtor Status
22. Q3: Property Address (text input with Google autocomplete)
23. EVALUATING SCREEN (animated loading)
24. GATE SCREEN (lead capture: name, email, phone)
25. RESULTS: Full Analysis → Slide 1 (Market Intelligence) → Slide 2 (Savings Potential) → Booking
```

---

## 3. SCREEN 1: INTRO / LANDING PAGE

### Layout
Full-screen, white background (`#FFFFFF`), centered content, max-width 480px.

### Top Section
- **Gold accent bar:** Full-width, 4px tall, `#C9A84C`, at the very top of the page.
- **Brand:** "HomeIQ" in DM Sans, medium weight, tracking `0.25em`, uppercase, `#C9A84C`, size 12px. Below that: a small gold diamond icon (◇) at 10px.

### Hero Text
- **Headline:** "Find Your Perfect Home — Without the Guesswork" in Playfair Display, bold. Size responsive: `clamp(1.5rem, 5vw, 2.5rem)`. Color: `#0D1B2A`. Centered.
- **Subheadline:** "Answer a few quick questions and get a personalized market analysis, home valuation, and expert strategy — in under 3 minutes." in DM Sans, size 15px, line-height relaxed. Color: `#6B7280`. Max-width 400px, centered.

### Trust Indicators (3 items in a row)
Displayed as a horizontal flex row, centered, with dividers. Each has:
- An icon (gold color, 13px)
- A text label (DM Sans, 12px, `#6B7280`)

The three items:
1. Clock icon → "Takes 2 min"
2. Shield icon → "100% Free"
3. BarChart3 icon → "Instant Results"

### First Question (Embedded)
Below the trust row is a label: "LET'S START" (DM Sans, medium, uppercase, tracking `0.18em`, 11px, `#C9A84C`).

Then the first question appears inline: **"What type of property are you looking for?"** (Playfair Display, bold, `clamp(1.05rem, 2.5vw, 1.35rem)`, `#0D1B2A`).

Answer options displayed as vertical buttons (see Quiz Question format below). The 4 options are:
1. "Single-family home" (icon: Home)
2. "Condo / Townhouse" (icon: Building2)
3. "Multi-family / Investment" (icon: TrendingUp)
4. "I'm not sure yet" (icon: HelpCircle)

### Bottom Disclaimer
"Your information stays private. We never sell your data." (DM Sans, 11px, `#C9A84C`, centered, with Lock icon).

---

## 4. SCREEN 2–19: QUIZ QUESTIONS (FULL LIST)

### Question Screen Layout
- Background: `#FAFAF8`
- Max-width: 600px container, centered
- Padding: 24px horizontal, 40px vertical (mobile), 56px vertical (desktop)

### Progress Bar (top of every question screen)
- Full-width bar, 3px tall
- Background track: `#F3F4F6`
- Filled portion: `#C9A84C`
- Animated width transition (700ms ease-out)
- Below the bar: current step number shown as "3 OF 18" (DM Sans, 11px, medium, tracking `0.14em`, uppercase, `#C9A84C`)
- Step counter animates in with fade-up (opacity 0→1, translateY 6px→0, 400ms)

### Question Text
- Playfair Display, size `clamp(1.15rem, 3.5vw, 1.65rem)`, color `#0D1B2A`, centered
- Fades in with animation (opacity 0→1, translateY 12px→0, 500ms)

### Answer Options
Vertical stack of buttons, 10px gap. Each button:
- Full width, `rounded-xl` (12px radius)
- Background: `#FFFFFF`
- Border: `1.5px solid #E5E7EB`
- Padding: 18px horizontal, 16px vertical (mobile 14px vertical)
- Text: DM Sans, medium weight, 15px, color `#374151`
- Left icon: Lucide icon, 16px, color `#C9A84C`
- Layout: flex row with `items-center`, `gap-3`

**Hover state:** border changes to `rgba(201,168,76,0.55)`, background `rgba(201,168,76,0.04)`, box-shadow `0 0 0 3px rgba(201,168,76,0.08)`

**Selected state (flash before advancing):** background `rgba(201,168,76,0.10)`, border `rgba(201,168,76,0.6)`, 200ms duration, then auto-advances to next screen after 250ms delay.

Each answer button fades in staggered: delay = index * 60ms, opacity 0→1, translateY 8px→0, 350ms.

### Complete Question List

Below is every question with its ID, text, and answer options (with Lucide icon names).

---

**Q1 (id: 1) — "What type of property are you looking for?"**
(Shown embedded in the Intro screen, NOT as a standalone question screen)
1. "Single-family home" — icon: Home
2. "Condo / Townhouse" — icon: Building2
3. "Multi-family / Investment" — icon: TrendingUp
4. "I'm not sure yet" — icon: HelpCircle

---

**Q2 (id: 2) — "Where are you looking to buy?"**
Type: **Dropdown / searchable state selector** (NOT multiple choice buttons)
- Label shown above: "Where are you looking to buy?" (Playfair Display)
- A search input field with Search icon on the left
- Placeholder: "Search for a state..."
- Shows a scrollable list of all 50 US states + DC (51 items)
- Each state shown with MapPin icon (gold when hovered)
- Typing filters the list in real-time
- Selecting a state auto-advances
- Grouped alphabetically
- Popular states shown first in a "Popular" section: California, Florida, Texas, New York, Illinois, Georgia, North Carolina, Arizona, Ohio, Pennsylvania

Full state list: Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware, Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana, Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina, North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina, South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia, Wisconsin, Wyoming, District of Columbia

---

**Q3 (id: 3) — "What's the address of the home you're considering?"**
Type: **Text input with Google Places autocomplete**
(Shown near the end of the quiz, NOT in question order. See flow above.)
- MapPin icon on the left of input, turns gold when text entered
- Placeholder: "Enter your property address..."
- Google Places autocomplete dropdown appears after 3+ characters typed (280ms debounce)
- Restricted to US addresses only
- Dropdown shows up to 5 suggestions, each with MapPin icon + main text + secondary text
- Selecting a suggestion geocodes and auto-advances
- A "Continue" button below the input (gold `#C9A84C` when text present, gray `#E5E7EB` when empty)
- On focus: border turns gold, subtle gold box-shadow

---

**Q4 (id: 4) — "When are you looking to buy?"**
1. "Within 30 days" — icon: Zap
2. "1–3 months" — icon: Calendar
3. "3–6 months" — icon: Clock
4. "Just exploring" — icon: Search

---

**Q5 (id: 5) — "What kind of home condition are you comfortable with?"**
1. "Move-in ready only" — icon: Sparkles
2. "Minor cosmetic updates OK" — icon: Paintbrush
3. "Open to renovation projects" — icon: Wrench
4. "Major fixer-upper is fine" — icon: Hammer

---

**Q6 (id: 6) — "What's your target budget range?"**
1. "Under $250K" — icon: DollarSign
2. "$250K – $500K" — icon: DollarSign
3. "$500K – $1M" — icon: DollarSign
4. "$1M+" — icon: DollarSign

---

**Q7 (id: 7) — "What's your top priority in a home purchase?"**
1. "Getting the best price" — icon: TrendingDown
2. "Buying quickly" — icon: Zap
3. "Staying within budget" — icon: PiggyBank
4. "Finding the right neighborhood" — icon: MapPin

---

**Q8 (id: 8) — "How closely have you been watching the housing market?"**
1. "I check listings daily" — icon: Eye
2. "A few times a week" — icon: BarChart3
3. "Occasionally browsing" — icon: Search
4. "Haven't started yet" — icon: Clock

---

**Q9 (id: 9) — "What's your primary motivation for buying?"**
1. "Growing family needs more space" — icon: Users
2. "Investment / wealth building" — icon: TrendingUp
3. "Relocating for work" — icon: Briefcase
4. "First home purchase" — icon: Home
5. "Downsizing / simplifying" — icon: ArrowDownRight

---

**Q10 (id: 10) — "Where are you with financing?"**
1. "Pre-approved and ready" — icon: CheckCircle
2. "Talking to lenders now" — icon: MessageSquare
3. "Haven't started yet" — icon: Clock
4. "Paying cash" — icon: Banknote

---

**Q11 (id: 11) — "What type of deal appeals to you most?"**
1. "Below-market value / undervalued" — icon: TrendingDown
2. "Fair price, great condition" — icon: CheckCircle
3. "New construction" — icon: Building2
4. "Foreclosure / auction" — icon: Gavel

---

**Q12 (id: 12) — "How would you describe your credit profile?"**
1. "Excellent (740+)" — icon: Star
2. "Good (670–739)" — icon: ThumbsUp
3. "Fair (580–669)" — icon: Minus
4. "Needs work (below 580)" — icon: AlertTriangle
5. "I'm not sure" — icon: HelpCircle

---

**Q13 (id: 13) — "What's your current housing situation?"**
1. "I own and need to sell first" — icon: Home
2. "I'm renting" — icon: Key
3. "Living with family / friends" — icon: Users
4. "Other" — icon: MoreHorizontal

---

**Q14 (id: 14) — "Are you also considering this as an investment?"**
1. "Yes — I want rental income potential" — icon: DollarSign
2. "Possibly — open to house hacking" — icon: Lightbulb
3. "No — primary residence only" — icon: Home
4. "Undecided" — icon: HelpCircle

---

**Q15 (id: 15) — "Which features are must-haves?"**
1. "Updated kitchen / bathrooms" — icon: Sparkles
2. "Large yard / outdoor space" — icon: Trees
3. "Garage / parking" — icon: Car
4. "Home office space" — icon: Monitor

---

**Q16 (id: 16) — "What's a deal breaker for you?"**
1. "Major structural issues" — icon: AlertTriangle
2. "Bad neighborhood / high crime" — icon: ShieldAlert
3. "Long commute" — icon: Clock
4. "HOA restrictions" — icon: FileText

---

**Q17 (id: 17) — "How would you describe your offer strategy?"**
(Not used in the current flow, but exists in data)
1. "Aggressive — I want the best deal" — icon: Target
2. "Balanced — fair for both sides" — icon: Scale
3. "Conservative — I don't want to lose it" — icon: Shield
4. "Not sure yet" — icon: HelpCircle

---

**Q18 (id: 18) — "How much do you have saved for a down payment?"**
(Not used in the current flow, but exists in data)
1. "Less than 10%" — icon: Coins
2. "10–20%" — icon: PiggyBank
3. "20–50%" — icon: Wallet
4. "50%+" — icon: Landmark

---

**Q19 (id: 19) — "Do you currently have a real estate agent?"**
1. "Yes, and I'm happy with them" — icon: ThumbsUp
2. "Yes, but I'm open to switching" — icon: RefreshCw
3. "No — I'm looking for one" — icon: Search
4. "I plan to buy without an agent" — icon: User

---

## 5. INFO SLIDES (5 Educational Interstitials)

Info slides appear between groups of questions. They are full-screen educational moments that auto-advance after a countdown.

### Info Slide Layout
- Full-screen, `min-height: 100dvh`, `#FAFAF8` background
- Max-width 480px container, centered
- Content fades in with staggered animation

### Top: Pill Badge
A rounded-full pill at the top: "BUYER INSIGHT" or "MARKET INSIGHT" or "SMART BUYER TIP" or "STRATEGY NOTE" or "TIMING INSIGHT" in DM Sans, 10.5px, semibold, uppercase, tracking `0.2em`, gold text on gold-tinted background.

### SVG Illustration
Each slide has a custom SVG illustration (approximately 200x200px area). These are abstract/geometric illustrations rendered inline. Colors use the gold, navy, cream, and green palette. They are NOT photos — they are stylized vector illustrations.

### Headline
Playfair Display, bold, `clamp(1.25rem, 4vw, 1.8rem)`, `#0D1B2A`, centered.

### Body Text
DM Sans, 14.5px, line-height relaxed (1.6), `#6B7280`, max-width 380px, centered.

### "Continue" Button
Full-width, `rounded-full`, `#C9A84C` background, `#0D1B2A` text, DM Sans semibold, 14.5px, 56px tall. Contains a countdown number that ticks down from 7 to 0, shown as "(7)" appended to the button text. When countdown reaches 0, auto-advances. Button says "Continue (7)" → "Continue (6)" → ... → auto-advance.

### The 5 Info Slides

**SLIDE 1: "The Hidden Cost Most Buyers Miss"**
- Pill: "BUYER INSIGHT"
- Image: `/buyer-inspection.webp` — Used as background behind the SVG illustration area. The SVG illustration shows a stylized house with a magnifying glass revealing hidden elements, rendered in gold/navy tones.
- Headline: "The Hidden Cost Most Buyers Miss"
- Body: "Most buyers focus on the listing price — but it's the inspection findings, repair estimates, and closing costs that determine what you actually pay. Homes that look perfect on the surface can carry $10,000–$30,000 in hidden costs that only surface after you're under contract."

**SLIDE 2: "Why Most Buyers Overpay"**
- Pill: "MARKET INSIGHT"
- Image: `/buyer-savings.webp` — The SVG illustration shows a bar chart with dollar signs, depicting price comparison, in gold/navy tones.
- Headline: "Why Most Buyers Overpay"
- Body: "The difference between a great deal and overpaying often comes down to offer strategy — not the home itself. Buyers who understand comparable sales, market timing, and negotiation psychology pay 3–7% less on average. On a $400,000 home, that's $12,000–$28,000."

**SLIDE 3: "The Agent Gap Nobody Talks About"**
- Pill: "SMART BUYER TIP"
- Image: `/buyer-agent-gap.webp` — The SVG illustration shows two figures with a gap/bridge between them, one side higher than the other, in gold/navy tones.
- Headline: "The Agent Gap Nobody Talks About"
- Body: "Not all buyer's agents perform equally. Studies show the top 10% of agents negotiate 5–8% better outcomes than the average agent in the same market. Choosing the right representation is the single highest-leverage decision in your home purchase."

**SLIDE 4: "The Buy-Sell Sequence That Saves Thousands"**
- Pill: "STRATEGY NOTE"
- Image: `/buyer-timing.webp` — The SVG illustration shows a calendar/timeline with arrows showing sequence, in gold/navy tones.
- Headline: "The Buy-Sell Sequence That Saves Thousands"
- Body: "If you need to sell before you buy, timing is everything. The wrong sequence can cost you temporary housing, double moves, or force you to accept a low offer. The right advisor builds a plan that coordinates both sides — so you move once, on your terms."

**SLIDE 5: "The Real Cost of Waiting"**
- Pill: "TIMING INSIGHT"
- Image: `/buyer-cost-of-waiting.webp` — The SVG illustration shows a clock with money/coins flowing away, in gold/navy tones.
- Headline: "The Real Cost of Waiting"
- Body: "Home prices have historically appreciated 3–5% per year. On a $400,000 home, waiting 12 months could mean paying $12,000–$20,000 more — not counting rising interest rates. The best time to start is when you have clarity, not when you feel certain."

---

## 6. SCREEN: ADDRESS INPUT (GOOGLE AUTOCOMPLETE)

This is question Q3 but appears near the end of the quiz (position 22 in the flow).

### Layout
Same as other quiz questions. Progress bar at top, question text centered.

### Question Text
"What's the address of the home you're considering?" (Playfair Display)

### Input Field
- Full width, `rounded-xl`
- White background, `1.5px solid #E5E7EB` border
- Padding: 16px right (52px for button), 16px top/bottom, 42px left (for icon)
- Left: MapPin icon (16px), gray when empty, gold when text entered
- Placeholder: "Enter your property address..."
- On focus: border `1.5px solid rgba(201,168,76,0.55)`, box-shadow `0 0 0 3px rgba(201,168,76,0.08)`

### Autocomplete Dropdown
- Appears 1px below input
- White background, `1.5px solid #E8E0C8` border, `rounded-xl`
- Box-shadow: `0 8px 32px rgba(13,27,42,0.12)`
- Up to 5 results, each with MapPin icon (gold), main text (semibold, 14px, navy), secondary text (12px, gray)
- Hover/selected: `rgba(201,168,76,0.07)` background
- Dividers: `1px solid #F3F0E8`

### Submit Button (below input)
- Full width, `rounded-xl`, DM Sans semibold, 14px
- Gold background when text present, gray `#E5E7EB` when empty
- Text: "Continue"
- Also: a small circular arrow button inside the input (right side) when text is present

### Also: Arrow button inside the input
When text is entered, a small 32px gold circle with ArrowRight icon appears on the right side of the input.

---

## 7. SCREEN: EVALUATING / LOADING

After the address is entered, a dramatic loading screen appears.

### Layout
- Full screen, min-height `100dvh`, `#FAFAF8` background
- Max-width 480px, centered
- Gold 4px bar at top

### Brand
"HomeIQ" centered at top, gold, uppercase, tracking `0.25em`, 12px

### Content (centered)
- **Headline:** "Evaluating Your Market Position" — Playfair Display, `clamp(1.3rem, 4vw, 2rem)`, `#0D1B2A`
- **Subhead:** "We're pulling live data to build your personalized report." — DM Sans, 14px, `#6B7280`

### Animated Step List
7 steps displayed sequentially. Each step appears one at a time with animation. Steps:

1. "Analyzing your buyer profile..."
2. "Checking market conditions in your area..."
3. "Evaluating property values nearby..."
4. "Comparing recent sales data..."
5. "Assessing negotiation leverage..."
6. "Reviewing local competition..."
7. "Building your personalized strategy..."

Each step:
- Appears with fade-in + slide-up animation (opacity 0→1, translateY 8px→0)
- Shows a spinning Loader icon (gold) while active, then a CheckCircle icon (green `#2D6A4F`) when complete
- Text: DM Sans, 14px, navy when active, `#6B7280` when completed
- Steps complete one every ~800ms

### Progress Bar (below steps)
- Full width bar, 6px tall, `rounded-full`
- Background: `#F3F4F6`
- Fill: gold `#C9A84C`, width animates from 0% to 100% over the duration
- Below bar: percentage text "0%" → "100%" (DM Sans, 12px, gold, right-aligned)

### Bottom Reassurance
"Your results are almost ready — this takes about 10 seconds." — DM Sans, 13px, `#9CA3AF`, centered

After all steps complete (100%), automatically advances to the Gate screen after 500ms.

---

## 8. SCREEN: LEAD CAPTURE GATE

### Layout
- Full screen, min-height `100dvh`, `#FAFAF8` background
- Max-width 480px, centered
- Gold 4px bar at top

### Brand
"HomeIQ" centered at top

### Content
- **Top label:** "YOUR RESULTS ARE READY" — DM Sans, semibold, uppercase, tracking `0.2em`, 11px, `#C9A84C`
- **Headline:** "Where should we send your free analysis?" — Playfair Display, bold, `clamp(1.3rem, 4vw, 1.9rem)`, `#0D1B2A`
- **Subhead:** "Get your personalized market report, home valuation, and strategy — delivered instantly." — DM Sans, 14px, `#6B7280`

### Feature Pills (3 items)
Three inline pill badges in a centered flex row:
1. BarChart3 icon + "Market Report"
2. DollarSign icon + "Home Valuation"
3. TrendingUp icon + "Strategy Plan"

Each pill: `rounded-full`, gold text/icon on gold tint background, DM Sans 11px semibold.

### Form Fields
Three input fields stacked vertically with 14px gap:

1. **Full Name**
   - User icon (left), 16px
   - Placeholder: "Full name"
   - Rounded-xl, white bg, `1.5px solid #E5E7EB` border

2. **Email Address**
   - Mail icon (left), 16px
   - Placeholder: "Email address"
   - type="email"

3. **Phone Number**
   - Phone icon (left), 16px
   - Placeholder: "Phone number (optional)"
   - type="tel"

All inputs:
- Padding: 16px horizontal (42px left for icon)
- DM Sans, 15px (mobile 16px to prevent iOS zoom)
- On focus: gold border + gold box-shadow
- Icon color: gray when empty, gold when filled

### Submit Button
- "See My Results" with ArrowRight icon
- Full width, `rounded-full`, 56px tall
- Gold background, navy text
- DM Sans, semibold, 14.5px
- Disabled state: `#E5E7EB` bg, `#9CA3AF` text (enabled when name + valid email filled)
- Active: scale-down to 0.98

### Privacy Text
"We respect your privacy. No spam, ever." — DM Sans, 11px, `#C9A84C`, centered, with Shield icon.

### Validation
- Name: must not be empty
- Email: must match basic email regex
- Phone: optional
- Error shown below form: red text, red-tinted background pill

---

## 9. RESULTS: SLIDE 1 — MARKET INTELLIGENCE

### Layout
- White (`#FFFFFF`) background
- Gold 4px bar at top
- Max-width 672px (2xl), centered

### Top
- "HomeIQ" brand centered
- **Slide indicator:** 3 dots/pills. First one is wide (24px) and gold, others are small (8px) and gray. Shows progress through results slides.

### Header
- Label: "MARKET INTELLIGENCE" (DM Sans, medium, uppercase, tracking `0.12em`, 12px, gold)
- Headline: "Here's Why Right Now Is the Window:" (Playfair Display, `clamp(1.4rem, 4.5vw, 2.4rem)`, navy)
- Dynamic subhead based on market data (sale-to-list ratio, days on market, etc.)

### Market Data Cards
Rounded-xl cards with icon (in gold circle) + title + body text. Displayed based on available data:
- "X-Day Average Time to Contract" — when avg days <= 45
- "Serious Buyers Are Active Now" — with search volume data
- "X% Sale-to-List Ratio" — when ratio data available
- "Offer Strategy Is Everything" — fallback when no ratio data

### Buyer Search Interest Table
A data visualization card showing keyword search volumes:
- Dark navy header: "Keyword Search Volume: Buyer Intent" with BarChart3 icon, "Live Data" green dot
- 8 keyword rows, each with:
  - Search term (dynamically includes city name)
  - Keyword difficulty badge (High/Med/Low)
  - Trend percentage (green)
  - Volume number
  - Horizontal bar chart (gold for top, green for peak, gray for others)
- Monthly total shown as green badge

### County Market Activity Card
- Dark navy header: "[City] Market Activity" with 12-Month View indicator
- 3 KPI boxes: New Listings, Active Listings, Days on Market
- Bar chart showing 12 months of listing data
- Legend: This month (gold), Peak month (green), Other months (gray)
- Live market data grid below: Median Sale, Avg Days Listed, Sale/List Ratio, Price/Sq Ft

### Bottom Callout
Gold-tinted box with Zap icon: "The bottom line: [City] can be a great buyer market..."

### CTA Button
"See Your Savings Potential" with ArrowRight — gold button, full width, `rounded-full`

---

## 10. RESULTS: SLIDE 2 — SAVINGS POTENTIAL

### Header
- Slide indicator: second dot is active
- Label: "YOUR SAVINGS POTENTIAL"
- Headline: "[Name], Here's What You Could Save on This Home" (uses first name if available)
- Subhead mentions down payment percentage

### Property Value Card
Large card with navy header showing address, then cream body:
- **Big number:** Estimated down payment amount (Playfair Display, green `#2D6A4F`, `clamp(2rem, 7vw, 3rem)`)
- **Down payment slider:** Range input from 5% to 100%, gold styling, shows current percentage
- **Two stat boxes:** Home Value (gray bg) and Agent Impact (gold bg, showing 5-8% range)
- **Savings range:** Two boxes comparing "Average Agent" vs "Right Advisor" with dollar amounts
- Gradient progress bar and "Difference: $X in real dollars" text

### Appreciation Note (conditional)
Green-tinted box showing home appreciation since last sale.

### "Here's how to get the best deal" Section
Headline followed by the **Top-Buyer Checklist** — a premium card with:
- Navy header: "The Top-Buyer Checklist" with Star icon
- Subtitle: "What separates buyers who get a great deal from the rest."
- 10 checklist items, each with green CheckCircle icon:
  1. "Get pre-approved before you tour"
  2. "Research the neighborhood"
  3. "Tour homes the day they list"
  4. "Never skip the home inspection"
  5. "Understand closing costs upfront"
  6. "Make a competitive, clean offer"
  7. "Negotiate repairs, not just price"
  8. "Check comparable sales yourself"
  9. "Choose the right buyer's agent"
  10. "Time your offer strategically"
- Each has a title (semibold) and detail text
- Gold footer: "The right team does all of this for you..."

### Dark CTA Block (conditional, when property data available)
Navy rounded card showing: "This home is listed at $X. The right agent could save you $Y–$Z."

### Bottom CTA
"Book My Free Advisor Call" with ArrowRight — gold button

---

## 11. RESULTS: FULL ANALYSIS PAGE

### Header
- "HomeIQ" brand
- Label: "YOUR BUYING SITUATION"
- Headline: "The [City] Market Is Moving. Here's What We Know About This Market"

### Address Bar
Cream card showing property address with MapPin icon and "Maps" link

### Property Valuation Card
Navy header + cream body showing:
- Large estimated value (Playfair Display, navy, responsive font size)
- Range below
- Gold callout: "The spread between a top-performing buyer's agent and an average one... 3-7% of final purchase price. On this home, that's $X-$Y in real dollars saved."

### Deep Property Intelligence Card
A comprehensive data card with navy header "Deep Property Intelligence — Owner, Equity & Tax Record" with Sparkles icon.

Sections (2-column grid on desktop):
- **Ownership:** Owner name, mailing address, years owned, occupancy
- **Building:** Bedrooms, bathrooms, living area, lot size, year built, stories, type, features
- **Valuation & Equity:** Estimated value, value range, estimated equity, equity %, LTV, confidence
- **Mortgage & Liens:** Original loan, lender, loan date, type, financing, interest rate, est. balance, total open liens
- **Tax Assessment:** Assessed value, market value, annual tax, tax year
- **Sale History:** Last sale price/date, buyer/seller, prior sale
- **Neighborhood:** Median income, median home value, avg household size
- **Foreclosure** (if applicable): Status, filing date, borrower, lender
- **Involuntary Liens** (if applicable)

Flag pills at top: Owner-Occupied, High Equity, Free & Clear, Absentee Owner, etc. Color-coded (green=good, orange=warn, red=alert, tan=neutral).

### Comparable Sales Section
Up to 4 comparable sales, each shown as a card with:
- Google Street View photo (or satellite map fallback, or Pexels stock photo fallback)
- Numbered badge overlay
- Address, bed/bath/sqft/distance
- Sale price and date

### Active Listings Section
Up to 3 active listings with similar card format, "Active" green badge overlay.

### CTA
"Continue to Market Report" button

---

## 12. RESULTS: BOOKING SCREEN

### Layout
Two-column on desktop (grid), single column on mobile.
`#FAFAF8` background, gold 4px bar at top.

### Left Column (navy background)
- Label: "FREE ADVISOR CALL" (gold, uppercase, tracking)
- Headline: "Get a clear plan in 20 minutes" (Playfair Display, white)
- Subhead: "A short, focused call with a real estate advisor — no pitch, no commitment." (white/72% opacity)
- 3 benefit bullets with gold icon circles:
  1. TrendingUp → "A strategy tuned to your purchase" / "Walk through your specific market position..."
  2. ShieldCheck → "Zero pressure, zero pitch" / "A frank advisor — not a listing agent..."
  3. Sparkles → "Real numbers, not guesses" / "See where this home stands today..."
- Footer: Clock icon + "Typically 15–20 minutes · Limited spots each week"

### Right Column (light background)
- Headline: "Pick a time that works" (Playfair Display)
- Subhead: "Choose how you'd like to meet, then select a day and time."

**Call Type Toggle:** Phone Call / Zoom Call — pill toggle with Phone and Video icons. Selected state has white bg with shadow.

**Calendar:**
- Month navigation with ChevronLeft/ChevronRight
- Day headers: Sun Mon Tue Wed Thu Fri Sat
- Grid of date cells, weekdays only selectable (no weekends)
- Available range: tomorrow through 45 days out
- Selected date: gold background
- Hover: subtle gold tint

**Time Slots** (shown after date selected):
- Header: "Available times · [date]"
- Grid of 3-4 columns: 9:00 AM, 10:00 AM, 11:00 AM, 1:00 PM, 2:00 PM, 3:00 PM, 4:00 PM, 5:00 PM
- Selected: navy bg, white text

**Contact Form:**
- Full name (pre-filled from gate)
- Email (pre-filled)
- Phone (pre-filled, required for phone calls)
- "Anything you'd like the advisor to know?" textarea (optional)

**Submit:** "Confirm My Call" button (gold, full width, rounded-full) with ChevronRight icon
**Footer:** "You'll get a confirmation by email."

### Confirmation State (after submit)
Centered layout with:
- Gold circle with CheckCircle icon
- "Your call is booked" (Playfair Display)
- Email confirmation text
- Date/time/type badge
- "Back to results" button (navy)

---

## 13. SCORING LOGIC

The quiz produces a result with 4 fields:

### Readiness (based on Q4 timeline + Q5 condition)
- **"Ready to Move"** — timeline is "Within 30 days" or "1-3 months" AND condition is "Move-in ready" or "Minor cosmetic"
- **"Getting Close"** — timeline is "1-3 months" or "3-6 months" but condition is renovation/fixer, OR timeline is moderate
- **"Early Stage"** — timeline is "Just exploring" or answers suggest early research phase

### Complexity (based on Q5 condition + Q6 budget)
- **"Low"** — Move-in ready AND budget is lower two options
- **"Higher"** — Open to renovation OR major fixer-upper in budget options
- **"Moderate"** — Everything else

### Priority (based on Q7)
- Option 1 → "Price Maximizer"
- Option 2 → "Speed Buyer"
- Option 3 → "Budget Optimizer"
- Option 4 → "Neighborhood Seeker"

### Insights (2-3 dynamic paragraphs)
Up to 3 insights are generated based on answer combinations:

1. **Condition vs. priority mismatch** (renovation + best price): "There's often a gap between what buyers expect to pay for a home that needs work..."
2. **Good timing + market awareness** (3-6 months + checking often): "You're in a strong position. Buyers who spend 3-6 months researching strategically..."
3. **Worried about agent choice**: "That concern is well-founded. Studies consistently show that the spread between top-performing buyer's agents..."
4. **Turnkey + best price**: "Buying turnkey and getting the best price can coexist..."
5. **First-time or bad experience**: "Whether this is your first purchase or a chance to do it right..."
6. **Fast timeline + fixer**: "A tight timeline paired with a willingness to take on projects is the most common combination that leads to overspending..."
7. **Just exploring**: "Being early in the process is an advantage most buyers wish they had..."
8. **Stress-free priority**: "A smooth purchase isn't just about finding a home quickly..."
9. **"Don't know what I don't know" worry**: "That's the most honest answer in the room..."

Fallback insights (always at least 2):
- "Every purchase has a unique set of variables..."
- "The buyers who come out ahead aren't necessarily the ones with the biggest budgets..."

---

## 14. ANIMATIONS & MICRO-INTERACTIONS

### Page Transitions
- Each new screen fades in: opacity 0→1, translateY 12→0px, 500ms ease-out
- Content elements within screens have staggered fade-in

### Quiz Answer Selection
- On tap: 200ms border/background transition to gold highlight
- 250ms delay, then auto-advance to next screen

### Progress Bar
- Width transitions smoothly: `transition: width 700ms ease-out`

### Info Slide Countdown
- Number updates every 1000ms
- Button text: "Continue (7)" → "Continue (6)" → ... → auto-advance at 0

### Evaluating Screen
- Steps appear one by one (~800ms interval)
- Each step: fade-in + slide-up
- Spinning loader → checkmark transition
- Progress bar: continuous smooth fill from 0-100%
- Percentage counter increments smoothly

### Buttons
- Hover: `scale(1.02)` with 200ms transition
- Active/tap: `scale(0.95)` or `scale(0.98)` with instant response
- Color transitions: 200ms

### Range Slider (Results)
- Thumb is 20px gold circle with gold ring
- Track fills with gold from left side
- Updates values in real-time as dragged

### Cards/Inputs Focus
- Border color transition: 200ms
- Box-shadow appears: 200ms

### Loading Skeletons
- Used in results when data is loading
- `animate-pulse` (opacity pulses)
- Gray placeholder bars of various widths

---

## 15. IMAGE INVENTORY

All images are in the `/public/` directory and should be downloaded for use:

| Filename | Description | Used In |
|----------|-------------|---------|
| `buyer-inspection.webp` | Background for Info Slide 1 illustration — inspection/hidden costs theme | Info Slide 1 |
| `buyer-savings.webp` | Background for Info Slide 2 illustration — savings/overpaying theme | Info Slide 2 |
| `buyer-agent-gap.webp` | Background for Info Slide 3 illustration — agent performance gap theme | Info Slide 3 |
| `buyer-timing.webp` | Background for Info Slide 4 illustration — timing/sequence theme | Info Slide 4 |
| `buyer-cost-of-waiting.webp` | Background for Info Slide 5 illustration — cost of delay theme | Info Slide 5 |
| `download.jpeg` | Family/testimonial photo 1 | Not actively used in quiz flow |
| `download_(1).jpeg` | Family/testimonial photo 2 | Not actively used in quiz flow |
| `download_(2).jpeg` | Family/testimonial photo 3 | Not actively used in quiz flow |
| `download_(3).jpeg` | Family/testimonial photo 4 | Not actively used in quiz flow |
| `happy-homeowners-with-their-children-scaled.jpg` | Happy homeowners family photo | Not actively used in quiz flow |
| `home-seller.jpg` | Home seller photo | Not actively used in quiz flow |
| `have_the_angle_of_the_picture__Nano_Banana_2_88599.jpg` | AI-generated illustration | Not actively used in quiz flow |
| `instead_of_the_white_backgroun_Nano_Banana_2_63921.jpg` | AI-generated illustration | Not actively used in quiz flow |
| `make_the_calendar_more_visible_Nano_Banana_2_53188.jpg` | AI-generated calendar illustration | Not actively used in quiz flow |
| `make_the_money_on_the_table_la_Nano_Banana_2_15840.jpg` | AI-generated money illustration | Not actively used in quiz flow |

**Note:** The info slide illustrations also have inline SVG counterparts (geometric/abstract vector art) that render on top of or instead of the background images. These SVGs use the gold/navy/cream palette and depict:
1. A magnifying glass over a house (inspection)
2. A bar chart with dollar signs (savings)
3. A bridge/gap between two figures (agent gap)
4. A calendar with arrows (timing)
5. A clock with coins (cost of waiting)

---

## 16. TECHNICAL NOTES

### Data Sources
- **Google Places API** — Address autocomplete
- **Google Street View API** — Property photos in results
- **Google Static Maps API** — Satellite view fallback
- **Rentcast API** — Market data (median prices, sale-to-list ratio, days on market, comparables, active listings, AVM/automated valuation model)
- **BatchData API** — Deep property intelligence (owner info, equity, mortgage, tax assessment, sale history, building details, foreclosure status, demographics)

### External Integrations
- **Supabase** — Database for lead submissions, advisor bookings
- **Slack** — Notification on new lead submission and booking
- **Facebook Pixel** — `fbq('track', 'Lead')` on gate submission, `fbq('track', 'Schedule')` on booking

### Key Behaviors
- Quiz answers auto-advance (no explicit "Next" button needed for multiple choice)
- Text inputs require explicit "Continue" button press
- Info slides auto-advance after 7-second countdown (or user can tap Continue early)
- Address input uses Google Places with US-only restriction
- Results pages pull live market data after quiz completion
- Down payment slider on Slide 2 defaults to equity percentage from property data, or estimates from quiz answer
- All monetary calculations are based on live property valuation data when available, with sensible fallbacks when not

### Mobile Considerations
- All font sizes use `clamp()` for responsive scaling
- Input font size is 16px on mobile to prevent iOS zoom
- Touch targets are minimum 44px
- Full-width buttons on all screen sizes
- Single column layout throughout (except booking screen calendar side-by-side on desktop)
