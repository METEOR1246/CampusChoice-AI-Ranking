/**
 * Canonical preference topics and explicit event-ID assignments.
 * Descriptive event.tags remain unchanged and never determine topic matching.
 */
export const INTEREST_TOPICS = [
  { id: 'technology-ai', label: 'Technology & AI', eventIds: ['E01', 'E02'] },
  { id: 'career-development', label: 'Career Development', eventIds: ['E03', 'E04'] },
  { id: 'sports', label: 'Sports', eventIds: ['E05'] },
  { id: 'wellbeing', label: 'Wellbeing', eventIds: ['E06'] },
  { id: 'music', label: 'Music', eventIds: ['E07'] },
  { id: 'photography', label: 'Photography', eventIds: ['E08'] },
  { id: 'volunteering', label: 'Volunteering', eventIds: ['E09'] },
  { id: 'food-culture', label: 'Food & Culture', eventIds: ['E10'] },
];

export const EVENT_TOPIC_IDS = Object.fromEntries(INTEREST_TOPICS.flatMap(
  (topic) => topic.eventIds.map((eventId) => [eventId, topic.id]),
));

/** Shared by scoring and UI feedback, so both use precisely the same match. */
export function matchesInterestTopic(event, selectedTopics) {
  return selectedTopics.includes(EVENT_TOPIC_IDS[event.id]);
}
