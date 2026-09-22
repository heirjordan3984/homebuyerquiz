export interface Question {
  id: number;
  topic: string;
  question: string;
  type?: 'options' | 'text';
  placeholder?: string;
  options: string[];
}

export const questions: Question[] = [
  {
    id: 1,
    topic: "Property Type",
    question: "What type of property are you thinking about buying?",
    options: [
      "Single-Family Home",
      "Condo or Townhouse",
      "Multi-Family",
      "Land or Lot",
    ],
  },
  {
    id: 2,
    topic: "Location",
    question: "What state are you looking to buy in?",
    options: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
      "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
      "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
      "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
      "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
      "New Hampshire", "New Jersey", "New Mexico", "New York",
      "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
      "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
      "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
      "West Virginia", "Wisconsin", "Wyoming",
    ],
  },
  {
    id: 3,
    topic: "Target Area",
    type: 'text',
    question: "What city or area in {state} are you looking to buy in?",
    placeholder: "Enter a city or area...",
    options: [],
  },
  {
    id: 4,
    topic: "Timeline",
    question: "How soon are you thinking about making a move?",
    options: [
      "In the next 30 days",
      "1-3 months",
      "3-6 months",
      "6-12 months",
      "Just exploring",
    ],
  },
  {
    id: 5,
    topic: "Home Condition",
    question: "What condition are you open to?",
    options: [
      "Move-in ready only",
      "Minor cosmetic fixes are fine",
      "Willing to renovate for the right deal",
      "Open to anything if the price is right",
    ],
  },
  {
    id: 6,
    topic: "Budget Range",
    question: "What's your target price range?",
    options: [
      "Under $250K",
      "$250K - $450K",
      "$450K - $700K",
      "$700K - $1M",
      "$1M+",
    ],
  },
  {
    id: 7,
    topic: "Priorities",
    question: "What matters most to you when you buy?",
    options: [
      "Best possible price",
      "Fast close, less hassle",
      "Knowing exactly what I'll pay monthly",
      "Finding the right neighborhood",
    ],
  },
  {
    id: 8,
    topic: "Market Awareness",
    question: "How closely have you been watching what homes sell for in your area?",
    options: [
      "Very closely, I track it",
      "Somewhat, I've seen a few listings",
      "Not much at all",
      "Haven't looked yet",
    ],
  },
  {
    id: 9,
    topic: "Motivation",
    question: "What's driving the potential move?",
    options: [
      "Upsizing",
      "Downsizing",
      "Relocating",
      "First-time buyer or life change",
    ],
  },
  {
    id: 10,
    topic: "Financing",
    question: "What's your financing situation?",
    options: [
      "Pre-approved and locked in a rate",
      "Pre-qualified but still shopping rates",
      "Haven't started — I need help finding the best option",
      "Paying all cash",
    ],
  },
  {
    id: 11,
    topic: "Deal Preference",
    question: "What kind of deal are you hoping to find?",
    options: [
      "A home priced below market value",
      "An off-market property before it's listed",
      "A motivated seller willing to negotiate",
      "Any of the above — just the best value",
    ],
  },
  {
    id: 12,
    topic: "Credit Profile",
    question: "Where does your credit score sit right now?",
    options: [
      "Excellent (740+)",
      "Good (670-739)",
      "Fair (580-669)",
      "Not sure / rather not say",
    ],
  },
  {
    id: 13,
    topic: "Current Housing",
    question: "What's your current living situation?",
    options: [
      "Renting — lease is flexible",
      "Renting — locked into a lease",
      "Own a home I need to sell first",
      "Living with family or other arrangement",
    ],
  },
  {
    id: 14,
    topic: "Investment Intent",
    question: "What's the goal for this property?",
    options: [
      "Primary home — I'm living there long-term",
      "Primary home — a stepping stone for a few years",
      "Investment or rental income",
      "Second home or vacation property",
    ],
  },
  {
    id: 15,
    topic: "Must-Haves",
    question: "Which of these matters most for your search?",
    options: [
      "Good school district",
      "Short commute to work",
      "Outdoor space or land",
      "Walkable neighborhood with amenities",
    ],
  },
  {
    id: 16,
    topic: "Deal Breakers",
    question: "What's a deal breaker for you?",
    options: [
      "HOA fees or restrictions",
      "Major structural or foundation issues",
      "Flood zone or high insurance area",
      "Nothing — if the price is right, I'm flexible",
    ],
  },
  {
    id: 17,
    topic: "Offer Strategy",
    question: "If the right home showed up tomorrow, how fast could you move?",
    options: [
      "Ready to make an offer this week",
      "Could act within a couple of weeks",
      "I'd need a month or more to get things in order",
      "Not ready to commit yet — just want to see what's out there",
    ],
  },
  {
    id: 18,
    topic: "Down Payment",
    question: "How much are you planning to put down?",
    options: [
      "Less than 10% — looking for low down payment options",
      "10-20% — standard range",
      "20%+ — avoiding PMI",
      "Paying in full — no mortgage needed",
    ],
  },
  {
    id: 19,
    topic: "Realtor Status",
    question: "Are you currently working with a realtor?",
    options: [
      "Yes",
      "No",
    ],
  },
];
