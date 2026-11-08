/**
 * Ranking module for CampusChoice (Milestone 2).
 *
 * This is a deliberately simple, transparent, rule-based scoring function.
 * It is NOT a trained AI model — every component is a fixed formula that can
 * be read and verified by hand.
 *
 *   Interest      = category preference (1–5) × 20            → 0–100
 *   Time          = 100 if event slot == preferred slot, else 0
 *   Affordability = max(0, 100 − 5 × price in GBP)           → 0–100
 *   Score         = 0.5 × Interest + 0.3 × Time + 0.2 × Affordability
 *
 * Ties are broken deterministically by ascending event ID.
 */

/** Component weights used by the score formula. */
export const WEIGHTS = {
  interest: 0.5,
  time: 0.3,
  affordability: 0.2,
};

/** Points awarded per level of category preference. */
export const INTEREST_PER_LEVEL = 20;

/** Affordability penalty applied per whole GBP of ticket price. */
export const PRICE_PENALTY_PER_GBP = 5;

/**
 * Derive a time slot from a 24-hour "HH:MM" string.
 * Morning: before 12:00 · Afternoon: 12:00–16:59 · Evening: 17:00 onwards.
 *
 * @param {string} time e.g. "19:00"
 * @returns {string} "Morning" | "Afternoon" | "Evening"
 */
export function getTimeSlot(time) {
  const hour = Number.parseInt(String(time).split(':')[0], 10);
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

/**
 * Interest component: category preference expressed on a 0–100 scale.
 *
 * @param {string} category
 * @param {import('./data/preferences.js').UserPreferences} preferences
 * @returns {number}
 */
export function computeInterest(category, preferences) {
  const level = preferences.categoryPreference[category] ?? 0;
  return level * INTEREST_PER_LEVEL;
}

/**
 * Time component: 100 when the event matches the preferred slot, otherwise 0.
 *
 * @param {string} time
 * @param {import('./data/preferences.js').UserPreferences} preferences
 * @returns {number}
 */
export function computeTime(time, preferences) {
  return getTimeSlot(time) === preferences.preferredTimeSlot ? 100 : 0;
}

/**
 * Affordability component: cheaper events score higher, floored at 0.
 *
 * @param {number} price Ticket price in GBP.
 * @returns {number}
 */
export function computeAffordability(price) {
  return Math.max(0, 100 - PRICE_PENALTY_PER_GBP * price);
}

/**
 * Score a single event and expose each component for inspection.
 *
 * @param {import('./data/events.js').Event} event
 * @param {import('./data/preferences.js').UserPreferences} preferences
 * @returns {{ interest: number, time: number, affordability: number, score: number }}
 */
export function scoreEvent(event, preferences) {
  const interest = computeInterest(event.category, preferences);
  const time = computeTime(event.time, preferences);
  const affordability = computeAffordability(event.price);
  const score =
    WEIGHTS.interest * interest +
    WEIGHTS.time * time +
    WEIGHTS.affordability * affordability;

  return { interest, time, affordability, score };
}

/**
 * Rank all events from highest to lowest score.
 * Equal scores are ordered by ascending event ID for a stable, deterministic result.
 *
 * @param {import('./data/events.js').Event[]} events
 * @param {import('./data/preferences.js').UserPreferences} preferences
 * @returns {Array<{ event: import('./data/events.js').Event, interest: number, time: number, affordability: number, score: number, rank: number }>}
 */
export function rankEvents(events, preferences) {
  return events
    .map((event) => ({ event, ...scoreEvent(event, preferences) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.event.id.localeCompare(b.event.id);
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
