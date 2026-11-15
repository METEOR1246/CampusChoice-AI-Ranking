import { describe, it, expect } from 'vitest';
import { EVENTS } from '../src/data/events.js';
import { DEMO_USER } from '../src/data/preferences.js';
import { INTEREST_TOPICS, EVENT_TOPIC_IDS, matchesInterestTopic } from '../src/data/interest-topics.js';
import {
  getTimeSlot,
  computeInterest,
  computeTime,
  computeAffordability,
  scoreEvent,
  rankEvents,
  WEIGHTS,
  INTEREST_PER_LEVEL,
  PRICE_PENALTY_PER_GBP,
  TAG_MATCH_COEFFICIENT,
} from '../src/ranking.js';

const byId = (id) => EVENTS.find((event) => event.id === id);

describe('dataset', () => {
  it('contains ten events with unique IDs', () => {
    expect(EVENTS).toHaveLength(10);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(10);
  });

  it('has the ten IDs specified in the brief', () => {
    expect(EVENTS.map((e) => e.id)).toEqual([
      'E01', 'E02', 'E03', 'E04', 'E05',
      'E06', 'E07', 'E08', 'E09', 'E10',
    ]);
  });

  it('matches the specified category / day / time / price facts', () => {
    expect(byId('E01')).toMatchObject({ category: 'Technology', day: 'Wednesday', time: '19:00', price: 10 });
    expect(byId('E02')).toMatchObject({ category: 'Technology', day: 'Tuesday', time: '14:00', price: 10 });
    expect(byId('E03')).toMatchObject({ category: 'Career', day: 'Thursday', time: '14:00', price: 0 });
    expect(byId('E04')).toMatchObject({ category: 'Career', day: 'Monday', time: '19:00', price: 5 });
    expect(byId('E05')).toMatchObject({ category: 'Sports', day: 'Friday', time: '19:00', price: 0 });
    expect(byId('E06')).toMatchObject({ category: 'Sports', day: 'Tuesday', time: '10:00', price: 5 });
    expect(byId('E07')).toMatchObject({ category: 'Arts', day: 'Saturday', time: '19:00', price: 10 });
    expect(byId('E08')).toMatchObject({ category: 'Arts', day: 'Saturday', time: '14:00', price: 0 });
    expect(byId('E09')).toMatchObject({ category: 'Community', day: 'Wednesday', time: '19:00', price: 0 });
    expect(byId('E10')).toMatchObject({ category: 'Community', day: 'Sunday', time: '14:00', price: 5 });
  });
});

describe('topic preference ranking', () => {
  it('maps the actual ten event IDs and titles to exactly the requested eight topics', () => {
    const expected = [
      ['E01', 'Coding Workshop', 'Technology & AI'],
      ['E02', 'AI Ethics Seminar', 'Technology & AI'],
      ['E03', 'Graduate Careers Fair', 'Career Development'],
      ['E04', 'Interview Skills Clinic', 'Career Development'],
      ['E05', 'Football Social', 'Sports'],
      ['E06', 'Campus Yoga', 'Wellbeing'],
      ['E07', 'Student Music Night', 'Music'],
      ['E08', 'Photography Walk', 'Photography'],
      ['E09', 'Community Volunteering Meetup', 'Volunteering'],
      ['E10', 'International Food Exchange', 'Food & Culture'],
    ];
    expect(INTEREST_TOPICS.map(({ label }) => label)).toEqual([
      'Technology & AI', 'Career Development', 'Sports', 'Wellbeing',
      'Music', 'Photography', 'Volunteering', 'Food & Culture',
    ]);
    expect(INTEREST_TOPICS.flatMap(({ eventIds }) => eventIds)).toEqual(EVENTS.map(({ id }) => id));
    expect(new Set(INTEREST_TOPICS.map(({ id }) => id)).size).toBe(8);
    expect(EVENTS.map((event) => [event.id, event.title,
      INTEREST_TOPICS.find((topic) => topic.id === EVENT_TOPIC_IDS[event.id]).label])).toEqual(expected);
  });
  it('bypasses adjustment for empty preferences, preserving every baseline entry exactly', () => {
    expect(rankEvents(EVENTS, DEMO_USER, [])).toEqual(rankEvents(EVENTS, DEMO_USER));
    for (const event of EVENTS) {
      expect(scoreEvent(event, DEMO_USER, [])).toEqual(scoreEvent(event, DEMO_USER));
    }
  });

  it('uses the requested 0.7 coefficient and explicit topic matching', () => {
    expect(TAG_MATCH_COEFFICIENT).toBe(0.7);
    expect(scoreEvent(byId('E06'), DEMO_USER, ['wellbeing']))
      .toMatchObject({ interest: 82, time: 0, affordability: 75, score: 56 });
    expect(scoreEvent(byId('E05'), DEMO_USER, ['sports']))
      .toMatchObject({ interest: 82, time: 100, affordability: 100, score: 91 });
    expect(scoreEvent(byId('E01'), DEMO_USER, ['wellbeing']))
      .toMatchObject({ interest: 30, time: 100, affordability: 50, score: 55 });
  });

  it('supports multiple topics without stacking matching points', () => {
    const selected = ['sports', 'wellbeing', 'photography'];
    expect(scoreEvent(byId('E06'), DEMO_USER, selected))
      .toEqual(scoreEvent(byId('E06'), DEMO_USER, ['wellbeing']));
    expect(scoreEvent(byId('E05'), DEMO_USER, selected).score).toBe(91);
    expect(scoreEvent(byId('E08'), DEMO_USER, selected).score).toBe(58);
    expect(scoreEvent(byId('E06'), DEMO_USER, ['sports']).score).toBe(21);
    expect(scoreEvent(byId('E05'), DEMO_USER, ['wellbeing']).score).toBe(56);
  });

  it('supports configuring tag influence without changing the outer weights', () => {
    expect(scoreEvent(byId('E06'), DEMO_USER, ['wellbeing'], 0.5))
      .toMatchObject({ interest: 70, score: 50 });
    expect(rankEvents(EVENTS, DEMO_USER, ['wellbeing'], 0)).toEqual(rankEvents(EVENTS, DEMO_USER));
  });

  it.each(INTEREST_TOPICS)('scores every event correctly when selecting $label', (topic) => {
      const ranked = rankEvents(EVENTS, DEMO_USER, [topic.id]);
      expect(ranked).toHaveLength(10);
      expect(new Set(ranked.map(({ event }) => event.id))).toEqual(new Set(EVENTS.map(({ id }) => id)));
      for (const entry of ranked) {
        const original = scoreEvent(entry.event, DEMO_USER);
        const match = topic.eventIds.includes(entry.event.id) ? 100 : 0;
        expect(entry.interest).toBeCloseTo(0.3 * original.interest + 0.7 * match, 10);
        expect(entry.score).toBeCloseTo(entry.contributions.interest + entry.contributions.time + entry.contributions.affordability, 10);
        expect(entry.score).toBeCloseTo(0.5 * (0.3 * original.interest + 0.7 * match)
          + original.contributions.time + original.contributions.affordability, 10);
        expect(matchesInterestTopic(entry.event, [topic.id])).toBe(match === 100);
      }
  });

  it('recalculates after removal and reset without mutating the demo context', () => {
    const context = JSON.stringify({ EVENTS, DEMO_USER });
    const selected = ['wellbeing', 'photography'];
    const combined = rankEvents(EVENTS, DEMO_USER, selected);
    const remaining = rankEvents(EVENTS, DEMO_USER, selected.filter((topic) => topic !== 'wellbeing'));
    expect(combined).not.toEqual(remaining);
    expect(remaining).toEqual(rankEvents(EVENTS, DEMO_USER, ['photography']));
    expect(rankEvents(EVENTS, DEMO_USER, selected.filter(() => false))).toEqual(rankEvents(EVENTS, DEMO_USER));
    expect(selected).toEqual(['wellbeing', 'photography']);
    expect(JSON.stringify({ EVENTS, DEMO_USER })).toBe(context);
  });

  it('breaks adjusted score ties by ID even with reversed dataset order', () => {
    const tied = EVENTS.map((event) => ({ ...event, category: 'Arts', price: 0, time: '19:00', tags: ['social'] }));
    expect(rankEvents([...tied].reverse(), DEMO_USER, INTEREST_TOPICS.map(({ id }) => id)).map(({ event }) => event.id))
      .toEqual(EVENTS.map(({ id }) => id));
  });

  it('ignores descriptive tags and titles when matching an event topic', () => {
    const changed = { ...byId('E06'), title: 'Sports Food Technology', tags: ['sports', 'social', 'team'] };
    expect(matchesInterestTopic(changed, ['sports'])).toBe(false);
    expect(matchesInterestTopic(changed, ['wellbeing'])).toBe(true);
    expect(scoreEvent(changed, DEMO_USER, ['wellbeing']))
      .toEqual(scoreEvent(byId('E06'), DEMO_USER, ['wellbeing']));
  });
});

describe('getTimeSlot', () => {
  it('classifies hours into morning, afternoon and evening', () => {
    expect(getTimeSlot('10:00')).toBe('Morning');
    expect(getTimeSlot('14:00')).toBe('Afternoon');
    expect(getTimeSlot('19:00')).toBe('Evening');
  });

  it('treats 12:00 as afternoon and 17:00 as evening (boundaries)', () => {
    expect(getTimeSlot('12:00')).toBe('Afternoon');
    expect(getTimeSlot('17:00')).toBe('Evening');
  });
});

describe('component formulas', () => {
  it('uses the weights stated in the brief', () => {
    expect(WEIGHTS).toEqual({ interest: 0.5, time: 0.3, affordability: 0.2 });
    expect(INTEREST_PER_LEVEL).toBe(20);
    expect(PRICE_PENALTY_PER_GBP).toBe(5);
  });

  it('Interest = category preference × 20', () => {
    expect(computeInterest('Technology', DEMO_USER)).toBe(100); // 5 × 20
    expect(computeInterest('Arts', DEMO_USER)).toBe(20); // 1 × 20
    expect(computeInterest('Unknown', DEMO_USER)).toBe(0); // missing category
  });

  it('Time = 100 only for the preferred slot (Evening)', () => {
    expect(computeTime('19:00', DEMO_USER)).toBe(100);
    expect(computeTime('14:00', DEMO_USER)).toBe(0);
    expect(computeTime('10:00', DEMO_USER)).toBe(0);
  });

  it('Affordability = max(0, 100 − 5 × price)', () => {
    expect(computeAffordability(0)).toBe(100);
    expect(computeAffordability(5)).toBe(75);
    expect(computeAffordability(10)).toBe(50);
    expect(computeAffordability(30)).toBe(0); // floor, not negative
  });
});

describe('scoreEvent', () => {
  it('scores E01 (Technology, Evening, £10) as 90', () => {
    const result = scoreEvent(byId('E01'), DEMO_USER);
    expect(result).toMatchObject({ interest: 100, time: 100, affordability: 50, score: 90 });
    // 0.5×100 + 0.3×100 + 0.2×50 = 90
  });

  it('scores each of the ten events with the documented formula', () => {
    const expected = {
      E01: { interest: 100, time: 100, affordability: 50, score: 90 },
      E02: { interest: 100, time: 0, affordability: 50, score: 60 },
      E03: { interest: 80, time: 0, affordability: 100, score: 60 },
      E04: { interest: 80, time: 100, affordability: 75, score: 85 },
      E05: { interest: 40, time: 100, affordability: 100, score: 70 },
      E06: { interest: 40, time: 0, affordability: 75, score: 35 },
      E07: { interest: 20, time: 100, affordability: 50, score: 50 },
      E08: { interest: 20, time: 0, affordability: 100, score: 30 },
      E09: { interest: 60, time: 100, affordability: 100, score: 80 },
      E10: { interest: 60, time: 0, affordability: 75, score: 45 },
    };

    for (const [id, parts] of Object.entries(expected)) {
      expect(scoreEvent(byId(id), DEMO_USER)).toMatchObject(parts);
    }
  });

  it('computes score as the weighted sum of the three components', () => {
    for (const event of EVENTS) {
      const { interest, time, affordability, score } = scoreEvent(event, DEMO_USER);
      const expected =
        WEIGHTS.interest * interest + WEIGHTS.time * time + WEIGHTS.affordability * affordability;
      expect(score).toBeCloseTo(expected, 10);
    }
  });
});

describe('rankEvents', () => {
  it('orders events by descending score', () => {
    const ranked = rankEvents(EVENTS, DEMO_USER);
    for (let i = 1; i < ranked.length; i += 1) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  it('produces the exact expected order with ID tie-breaking', () => {
    const ranked = rankEvents(EVENTS, DEMO_USER);
    expect(ranked.map((entry) => entry.event.id)).toEqual([
      'E01', // 90
      'E04', // 85
      'E09', // 80
      'E05', // 70
      'E02', // 60  (tie → lower ID first)
      'E03', // 60
      'E07', // 50
      'E10', // 45
      'E06', // 35
      'E08', // 30
    ]);
  });

  it('breaks score ties deterministically by ascending event ID', () => {
    const ranked = rankEvents(EVENTS, DEMO_USER);
    const e02 = ranked.findIndex((e) => e.event.id === 'E02');
    const e03 = ranked.findIndex((e) => e.event.id === 'E03');
    expect(ranked[e02].score).toBe(ranked[e03].score);
    expect(e02).toBeLessThan(e03); // E02 must come before E03
  });

  it('assigns sequential 1-based ranks', () => {
    const ranked = rankEvents(EVENTS, DEMO_USER);
    expect(ranked.map((entry) => entry.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('is deterministic and does not mutate the input array', () => {
    const originalOrder = EVENTS.map((e) => e.id);
    const first = rankEvents(EVENTS, DEMO_USER).map((e) => e.event.id);
    const second = rankEvents(EVENTS, DEMO_USER).map((e) => e.event.id);

    expect(first).toEqual(second);
    expect(EVENTS.map((e) => e.id)).toEqual(originalOrder);
  });
});
