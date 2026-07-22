export const MAX_EXAM_ATTEMPTS = 3;

export const ACCESS_PLANS = Object.freeze([
  { id: "free", name: "Free starter", mockLimit: 1, priceUsd: 0, priceLabel: "Free", free: true },
  {
    id: "past-plus-3",
    name: "Past papers + 3 Crossline mocks",
    mockLimit: 3,
    priceUsd: 17,
    priceLabel: "$17–$40",
    popular: true,
    subjectPrices: { 1: 17, 2: 27, 3: 34.99, 4: 40 }
  },
  {
    id: "past-plus-5",
    name: "Past papers + 5 Crossline mocks",
    mockLimit: 5,
    priceUsd: 27,
    priceLabel: "$27–$67",
    subjectPrices: { 1: 27, 2: 47, 3: 59, 4: 67 }
  }
]);

export function resolveExamAccess({ freeSample = false, official = false, hasPlan = false, unlocked = false, mocksRemaining = 0, attemptsUsed = 0 } = {}) {
  const used = Math.max(0, Number(attemptsUsed || 0));
  const attemptsRemaining = Math.max(0, MAX_EXAM_ATTEMPTS - used);
  const included = Boolean(freeSample || (hasPlan && (official || unlocked || Number(mocksRemaining || 0) > 0)));
  return {
    included,
    canStart: included && attemptsRemaining > 0,
    attemptsUsed: used,
    attemptsRemaining,
    limitReached: included && attemptsRemaining === 0
  };
}
