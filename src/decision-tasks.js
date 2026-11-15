/** Optional task context; never changes the dataset or ranking formula. */
export const DECISION_TASKS = [
  {
    id: 'everyday',
    name: 'Everyday Choice',
    scenario: 'You have some free time next week and want to attend a university event. Explore the recommendations and choose an event that interests you.',
  },
  {
    id: 'changing',
    name: 'Changing Priorities',
    scenario: 'Your priorities have changed. You now prefer activities that help you meet people and get involved in the community rather than technology or career events. Explore the recommendations and choose an event that suits your new interests.',
  },
];

export const MODE_NAMES = {
  basic: 'Basic Ranking',
  explained: 'Explained Ranking',
  adjustable: 'Adjustable Ranking',
};

export const CONTROL_RATINGS = [
  'Strongly disagree', 'Disagree', 'Neither agree nor disagree', 'Agree', 'Strongly agree',
];

/** Capture actual ranking state at choice time, independently of later browsing. */
export function captureDecision(task, entry, mode, baselineRanks, selectedTopics) {
  return {
    taskId: task.id,
    taskName: task.name,
    mode,
    eventId: entry.event.id,
    eventName: entry.event.title,
    rank: entry.rank,
    baselineRank: baselineRanks.get(entry.event.id),
    selectedTopics: mode === 'adjustable' ? [...selectedTopics] : [],
  };
}
