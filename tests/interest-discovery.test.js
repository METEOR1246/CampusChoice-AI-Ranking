import { describe, it, expect } from 'vitest';
import {
  DISCOVERY_RULES, createDiscoveryState, syncDiscoveryPreferences,
  observeDetail, nextSuggestion, resolveSuggestion,
} from '../src/interest-discovery.js';

const viewed = (...ids) => ids.reduce((state, id) => observeDetail(state, id), createDiscoveryState());

describe('explicit rule-based interest inference', () => {
  it('defines exactly three pairs using four existing topic IDs', () => {
    expect(DISCOVERY_RULES.map(({ events, topics }) => ({ events, topics }))).toEqual([
      { events: ['E01', 'E02'], topics: ['technology-ai'] },
      { events: ['E03', 'E04'], topics: ['career-development'] },
      { events: ['E05', 'E06'], topics: ['sports', 'wellbeing'] },
    ]);
    expect(createDiscoveryState()).toEqual({
      viewedByRule: {}, suppressedRules: [], eligibleRules: [],
      dismissedRules: [], acceptedRules: [], pendingRule: null,
    });
  });

  it.each(DISCOVERY_RULES)('requires both distinct events for $id', (rule) => {
    expect(nextSuggestion(viewed(rule.events[0])).pendingRule).toBeNull();
    expect(nextSuggestion(viewed(...rule.events)).pendingRule).toBe(rule.id);
    expect(nextSuggestion(viewed(...rule.events.toReversed())).pendingRule).toBe(rule.id);
  });

  it.each([['E01', 'E01'], ['E05', 'E05'], ['E01', 'E03'], ['E05', 'E09'], ['E07', 'E08']])(
    'does not qualify repeated or unspecified pairs %s/%s', (first, second) => {
      expect(nextSuggestion(viewed(first, second, 'unknown')).pendingRule).toBeNull();
    });

  it.each(['technology-ai', 'career-development', 'sports', 'wellbeing'])(
    'discards evidence while %s is selected and on deselection', (topic) => {
      const rule = DISCOVERY_RULES.find((item) => item.topics.includes(topic));
      let state = viewed(rule.events[0]);
      for (const id of rule.events) state = observeDetail(state, id, [topic]);
      expect(state.viewedByRule[rule.id]).toBeUndefined();
      expect(state.dismissedRules).toEqual([]);
      state = syncDiscoveryPreferences(state, []);
      expect(nextSuggestion(state).pendingRule).toBeNull();
      state = observeDetail(state, rule.events[0]);
      expect(nextSuggestion(state).pendingRule).toBeNull();
      state = observeDetail(state, rule.events[1]);
      expect(nextSuggestion(state).pendingRule).toBe(rule.id);
    });

  it('tracks rules independently and resolves only one pending rule', () => {
    let state = nextSuggestion(viewed('E01', 'E02', 'E03', 'E04', 'E05', 'E06'));
    expect(state.eligibleRules).toEqual(['technology-ai', 'career-development', 'sports-wellbeing']);
    expect(state.pendingRule).toBe('technology-ai');
    state = nextSuggestion(resolveSuggestion(state, true));
    expect(state.pendingRule).toBe('career-development');
    expect(state.dismissedRules).toEqual(['technology-ai']);
  });

  it.each(DISCOVERY_RULES)('preserves dismissal through selection/deselection for $id', (rule) => {
    let state = resolveSuggestion(nextSuggestion(viewed(...rule.events)), true);
    state = syncDiscoveryPreferences(state, rule.topics);
    state = syncDiscoveryPreferences(state, []);
    for (const id of rule.events) state = observeDetail(state, id);
    expect(nextSuggestion(state).pendingRule).toBeNull();
    expect(state.dismissedRules).toEqual([rule.id]);
    expect(nextSuggestion(viewed(...rule.events)).pendingRule).toBe(rule.id);
  });

  it.each(DISCOVERY_RULES)('allows a new acceptance cycle only after fresh views for $id', (rule) => {
    let state = resolveSuggestion(nextSuggestion(viewed(...rule.events)));
    expect(state.acceptedRules).toEqual([rule.id]);
    state = syncDiscoveryPreferences(state, rule.topics);
    for (const id of rule.events) state = observeDetail(state, id, rule.topics);
    state = syncDiscoveryPreferences(state, []);
    expect(nextSuggestion(state).pendingRule).toBeNull();
    state = observeDetail(state, rule.events[0]);
    expect(nextSuggestion(state).pendingRule).toBeNull();
    state = observeDetail(state, rule.events[1]);
    expect(nextSuggestion(state).pendingRule).toBe(rule.id);
  });

  it('clears a pending combined rule when either topic is selected', () => {
    const state = nextSuggestion(viewed('E05', 'E06'));
    expect(syncDiscoveryPreferences(state, ['sports']).pendingRule).toBeNull();
    expect(syncDiscoveryPreferences(state, ['wellbeing']).eligibleRules).toEqual([]);
  });

  it('does not mutate input state or explicit preferences', () => {
    const state = viewed('E01', 'E02');
    const original = JSON.stringify(state);
    const selected = ['sports'];
    resolveSuggestion(nextSuggestion(state, selected));
    observeDetail(state, 'E05', selected);
    expect(JSON.stringify(state)).toBe(original);
    expect(selected).toEqual(['sports']);
  });
});
