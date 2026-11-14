import { describe, expect, it } from 'vitest';
import { EVENTS } from '../src/data/events.js';
import { DEMO_USER } from '../src/data/preferences.js';
import { rankEvents, scoreEvent } from '../src/ranking.js';
import { explainEvent } from '../src/explanations.js';

describe('weighted scoring and explanations', () => {
  it('returns Coding Workshop contributions of 50, 30 and 10, totalling 90', () => {
    expect(scoreEvent(EVENTS[0], DEMO_USER)).toMatchObject({
      contributions: { interest: 50, time: 30, affordability: 10 },
      score: 90,
    });
  });

  it('matches all ten expected contributions and sums them to the score', () => {
    const expected = [
      [50, 30, 10], [50, 0, 10], [40, 0, 20], [40, 30, 15], [20, 30, 20],
      [20, 0, 15], [10, 30, 10], [10, 0, 20], [30, 30, 20], [30, 0, 15],
    ];
    EVENTS.forEach((event, index) => {
      const { contributions, score } = scoreEvent(event, DEMO_USER);
      const values = Object.values(contributions);
      expect(values).toEqual(expected[index]);
      expect(values.reduce((sum, value) => sum + value, 0)).toBe(score);
    });
  });

  it('gives all ten events explanations using the ranked scoring result', () => {
    for (const entry of rankEvents(EVENTS, DEMO_USER)) {
      const explanation = explainEvent(entry, DEMO_USER);
      expect(explanation.factors.map(({ value }) => value)).toEqual(Object.values(entry.contributions));
      expect(explanation.score).toBe(entry.score);
      expect(explanation.summary).toContain(entry.event.category);
      expect(explanation.summary).toContain(`${DEMO_USER.categoryPreference[entry.event.category]}/5`);
      expect(explanation.summary).toContain(`${entry.contributions.time} points`);
      expect(explanation.summary).toContain(`${entry.contributions.affordability} affordability points`);
      expect(explanation.ordering).toContain('event ID');
      for (const { value } of explanation.factors) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('describes time mismatches and free entry accurately', () => {
    const ranked = rankEvents(EVENTS, DEMO_USER);
    const explanation = explainEvent(ranked.find(({ event }) => event.id === 'E03'), DEMO_USER);
    expect(explanation.summary).toContain('Afternoon does not match the preferred Evening slot');
    expect(explanation.summary).toContain('Free entry contributes 20 affordability points');
    expect(explanation.summary).toContain('Interest Match is the largest factor');
  });

  it('describes joint largest factors without implying a unique reason', () => {
    const entry = rankEvents(EVENTS, DEMO_USER).find(({ event }) => event.id === 'E09');
    expect(explainEvent(entry, DEMO_USER).summary)
      .toContain('Interest Match and Time Match are the joint largest factors');
  });
});
