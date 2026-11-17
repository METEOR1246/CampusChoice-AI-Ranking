/** Explicit design assumptions; these associations are not learned predictions. */
export const DISCOVERY_RULES = [
  {
    id: 'technology-ai', events: ['E01', 'E02'], topics: ['technology-ai'],
    label: 'Technology & AI',
    message: 'You explored Coding Workshop and AI Ethics Seminar. You might be interested in Technology & AI. Would you like to prioritise this topic?',
  },
  {
    id: 'career-development', events: ['E03', 'E04'], topics: ['career-development'],
    label: 'Career Development',
    message: 'You explored Graduate Careers Fair and Interview Skills Clinic. You might be interested in Career Development. Would you like to prioritise this topic?',
  },
  {
    id: 'sports-wellbeing', events: ['E05', 'E06'], topics: ['sports', 'wellbeing'],
    label: 'Sports and Wellbeing',
    message: 'You explored Football Social and Campus Yoga. You might be interested in sports and wellbeing activities. Would you like to prioritise both topics?',
  },
];

export function createDiscoveryState() {
  return {
    viewedByRule: {}, suppressedRules: [], eligibleRules: [],
    dismissedRules: [], acceptedRules: [], pendingRule: null,
  };
}

/** Drop evidence both while suppressed and when a rule becomes available again. */
export function syncDiscoveryPreferences(state, selectedTopics) {
  const suppressedRules = DISCOVERY_RULES.filter((rule) =>
    rule.topics.some((topic) => selectedTopics.includes(topic))).map((rule) => rule.id);
  const cleared = new Set([...suppressedRules, ...state.suppressedRules]);
  const viewedByRule = Object.fromEntries(Object.entries(state.viewedByRule)
    .filter(([id]) => !cleared.has(id)));
  const acceptedRules = state.acceptedRules.filter((id) =>
    suppressedRules.includes(id) || !state.suppressedRules.includes(id));
  const eligibleRules = DISCOVERY_RULES.filter((rule) =>
    !suppressedRules.includes(rule.id) && !state.dismissedRules.includes(rule.id)
    && !acceptedRules.includes(rule.id)
    && rule.events.every((id) => viewedByRule[rule.id]?.includes(id))).map((rule) => rule.id);
  return {
    ...state, viewedByRule, suppressedRules, acceptedRules, eligibleRules,
    pendingRule: eligibleRules.includes(state.pendingRule) ? state.pendingRule : null,
  };
}

/** Pure observation: exact event pairs, distinct IDs, no evidence while suppressed. */
export function observeDetail(state, eventId, selectedTopics = []) {
  const synced = syncDiscoveryPreferences(state, selectedTopics);
  const rule = DISCOVERY_RULES.find((item) => item.events.includes(eventId));
  if (!rule || synced.suppressedRules.includes(rule.id)
    || synced.dismissedRules.includes(rule.id) || synced.acceptedRules.includes(rule.id)) return synced;
  const viewed = synced.viewedByRule[rule.id] ?? [];
  return syncDiscoveryPreferences({
    ...synced,
    viewedByRule: { ...synced.viewedByRule, [rule.id]: [...new Set([...viewed, eventId])] },
  }, selectedTopics);
}

/** Select one eligible rule; display timing remains a separate UI responsibility. */
export function nextSuggestion(state, selectedTopics = []) {
  const synced = syncDiscoveryPreferences(state, selectedTopics);
  return { ...synced, pendingRule: synced.pendingRule ?? synced.eligibleRules[0] ?? null };
}

/** Resolution never mutates preferences. Acceptance is applied by the shared UI path. */
export function resolveSuggestion(state, dismissed = false) {
  if (!state.pendingRule) return state;
  const id = state.pendingRule;
  return {
    ...state,
    viewedByRule: Object.fromEntries(Object.entries(state.viewedByRule).filter(([key]) => key !== id)),
    eligibleRules: state.eligibleRules.filter((key) => key !== id),
    dismissedRules: dismissed ? [...new Set([...state.dismissedRules, id])] : state.dismissedRules,
    acceptedRules: dismissed ? state.acceptedRules : [...new Set([...state.acceptedRules, id])],
    pendingRule: null,
  };
}
