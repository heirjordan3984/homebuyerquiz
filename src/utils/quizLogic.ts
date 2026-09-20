export type Answers = Record<number, number>;

export interface QuizResult {
  readiness: string;
  complexity: string;
  priority: string;
  insights: string[];
}

export function computeResults(answers: Answers): QuizResult {
  const timing = answers[4];
  const condition = answers[5];
  const renovation = answers[6];
  const priority = answers[7];
  const agentExp = answers[10];
  const bigWorry = answers[11];
  const marketWatch = answers[8];

  // Readiness Score: based on timing (Q4) and condition (Q5)
  let readiness = "Early Stage";
  if (timing === 0 || timing === 1) {
    if (condition === 0 || condition === 1) {
      readiness = "Ready to Move";
    } else {
      readiness = "Getting Close";
    }
  } else if (timing === 1 || timing === 2) {
    readiness = "Getting Close";
  } else {
    readiness = "Early Stage";
  }

  // Complexity Level: based on condition (Q5) and renovation willingness (Q6)
  let complexity = "Moderate";
  if (condition === 0 && (renovation === 0 || renovation === 1)) {
    complexity = "Low";
  } else if (condition === 2 || renovation === 2) {
    complexity = "Higher";
  } else if (condition === 3 || renovation === 3) {
    complexity = "Moderate";
  } else {
    complexity = "Low";
  }

  // Priority Match: based on Q7
  const priorityMap: Record<number, string> = {
    0: "Price Maximizer",
    1: "Speed Buyer",
    2: "Budget Optimizer",
    3: "Neighborhood Seeker",
  };
  const priorityLabel = priorityMap[priority ?? 0] ?? "Price Maximizer";

  // Build insights
  const insights: string[] = [];

  // Insight 1: Condition vs. priority mismatch
  if (condition === 2 && priority === 0) {
    insights.push(
      "There's often a gap between what buyers expect to pay for a home that needs work and what sellers are asking, but the right negotiation strategy can close that gap significantly. The difference isn't always the repairs themselves. It's knowing which ones actually move the needle on value."
    );
  }

  // Insight 2: Good timing + market awareness
  if ((timing === 1 || timing === 2) && (marketWatch === 0 || marketWatch === 1)) {
    insights.push(
      "You're in a strong position. Buyers who spend 3-6 months researching strategically, not just browsing listings, tend to get meaningfully better deals than those who rush to bid. The window you have right now is an asset, not a delay."
    );
  }

  // Insight 3: Worried about picking wrong agent
  if (bigWorry === 1) {
    insights.push(
      "That concern is well-founded. Studies consistently show that the spread between top-performing buyer's agents and average agents in a given market can be 5-8% in final purchase price. On a $500,000 home, that's $25,000-$40,000. Agent selection is the highest-leverage decision in this process."
    );
  }

  // Insight 4: Turnkey preference but wants best price
  if (renovation === 2 && priority === 0) {
    insights.push(
      "Buying turnkey and getting the best price can coexist, but it requires precise offer strategy and targeted negotiation. The buyers who achieve this successfully are positioned to find sellers who value a clean, fast close, not sellers who are holding out for top dollar."
    );
  }

  // Insight 5: First-time buyer or bad past experience
  if (agentExp === 1 || agentExp === 2) {
    insights.push(
      "Whether this is your first purchase or a chance to do it right after a disappointing experience, the most important thing is finding representation that aligns with your specific goals, not just someone who's available. Interviewing more than one agent is almost always worth the time."
    );
  }

  // Insight 6: Moving soon but open to fixer-uppers
  if (timing === 0 && (condition === 2 || condition === 3)) {
    insights.push(
      "A tight timeline paired with a willingness to take on projects is the most common combination that leads to overspending. The buyers who navigate this best aren't the ones who move fastest. They're the ones who make smart, targeted decisions in the time they have."
    );
  }

  // Insight 7: Just exploring / not sure timing
  if (timing === 3 || readiness === "Early Stage") {
    insights.push(
      "Being early in the process is an advantage most buyers wish they had. The decisions you make in the next 60-90 days about financing, neighborhood selection, and agent choice will have more impact on your outcome than almost anything else."
    );
  }

  // Insight 8: Stress-free / hassle-free priority
  if (priority === 3 || priority === 1) {
    insights.push(
      "A smooth purchase isn't just about finding a home quickly. It's about anticipating the complications before they surface. The buyers who experience the most stress-free transactions typically have an agent who's done the upfront work to remove uncertainty before the offer is made."
    );
  }

  // Insight 9: "Not knowing what I don't know" worry
  if (bigWorry === 4) {
    insights.push(
      "That's the most honest answer in the room, and it's more common than buyers admit. The biggest gaps in buying outcomes aren't about the home itself. They're about the information asymmetry between buyers and the market. The right advisor closes that gap before it costs you."
    );
  }

  // Ensure we always have at least 2 insights
  if (insights.length < 2) {
    insights.push(
      "Every purchase has a unique set of variables. Your timeline, budget, priorities, and local market all interact in ways that aren't obvious from the outside. A clear-eyed assessment of these factors, done early, is what separates a good outcome from a great one."
    );
    insights.push(
      "The buyers who come out ahead aren't necessarily the ones with the biggest budgets. They're the ones who make the right decisions at the right moments, starting with how they prepare, how they negotiate, and who they choose to represent them."
    );
  }

  return {
    readiness,
    complexity,
    priority: priorityLabel,
    insights: insights.slice(0, 3),
  };
}
