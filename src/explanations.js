import { getTimeSlot } from './ranking.js';

/**
 * Describe the actual ranked entry using fixed templates.
 * Values are the scorer's weighted contributions; tags do not affect scoring.
 */
export function explainEvent(entry, preferences) {
  const { event, contributions, score, time } = entry;
  const level = preferences.categoryPreference[event.category] ?? 0;
  const slot = getTimeSlot(event.time);
  const factors = [
    { label: 'Interest Match contribution', value: contributions.interest },
    { label: 'Time Match contribution', value: contributions.time },
    { label: 'Affordability contribution', value: contributions.affordability },
  ];
  const largest = Math.max(...factors.map((factor) => factor.value));
  const mainFactors = factors
    .filter((factor) => factor.value === largest)
    .map((factor) => factor.label.replace(' contribution', ''));
  const timeReason = time === 100
    ? `${slot} matches the preferred ${preferences.preferredTimeSlot} slot`
    : `${slot} does not match the preferred ${preferences.preferredTimeSlot} slot`;
  const fee = event.price === 0 ? 'Free entry' : `The £${event.price} fee`;

  return {
    factors,
    score,
    summary: `${event.category} is rated ${level}/5, contributing ${contributions.interest} points. `
      + `${timeReason}, contributing ${contributions.time} points. `
      + `${fee} contributes ${contributions.affordability} affordability points. `
      + `${mainFactors.join(' and ')} ${mainFactors.length === 1 ? 'is the largest factor' : 'are the joint largest factors'}.`,
    ordering: 'Events are ordered by total score, highest first. Equal scores use ascending event ID.',
  };
}
