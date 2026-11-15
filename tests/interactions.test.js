// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import shell from '../index.html?raw';
import { EVENTS } from '../src/data/events.js';
import { INTEREST_TOPICS, EVENT_TOPIC_IDS } from '../src/data/interest-topics.js';
import { DECISION_TASKS, MODE_NAMES } from '../src/decision-tasks.js';
import { rankEvents } from '../src/ranking.js';
import { DEMO_USER } from '../src/data/preferences.js';

const query = (selector) => document.querySelector(selector);
const action = (name, id = 'E01') => query(`[data-action="${name}"][data-event-id="${id}"]`);
const panel = (id = 'E01') => document.getElementById(`explanation-${id}`);
const switchMode = (mode) => query(`input[value="${mode}"]`).click();
const ranking = () => [...document.querySelectorAll('.event-card')].map((card) => ({
  id: card.dataset.eventId,
  title: card.querySelector('.card-title').textContent,
  score: Number(card.querySelector('.score-value').textContent),
}));

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = shell.match(/<body>([\s\S]*?)<\/body>/)[1];
  // jsdom verifies wiring and dialog content; native modal behaviour is checked in the browser.
  const dialog = query('#details-dialog');
  dialog.showModal = vi.fn(() => dialog.setAttribute('open', ''));
  dialog.close = vi.fn(() => dialog.removeAttribute('open'));
  await import('../src/main.js');
});

afterEach(() => vi.unstubAllGlobals());

describe('guided decision tasks', () => {
  const start = (id = 'everyday') => query(`[data-task="${id}"]`).click();
  const summary = () => query('#decision-summary');
  const topic = (id) => query(`#interest-preferences [data-topic="${id}"]`).click();
  const rate = (value) => query(`input[name="control-rating"][value="${value}"]`).click();

  it('allows normal browsing without starting a task or recording a decision', () => {
    expect(query('#task-options').open).toBe(false);
    expect(query('#task-context').hidden).toBe(true);
    action('select').click();
    expect(summary().hidden).toBe(true);
    expect(query('input[name="control-rating"]')).toBeNull();
    expect(query('.event-card.is-selected').dataset.eventId).toBe('E01');
  });

  describe.each(DECISION_TASKS)('$name', (task) => {
    it.each(['basic', 'explained', 'adjustable'])('starts and supports a real choice in %s mode without changing data', (mode) => {
      const dataset = JSON.stringify(EVENTS);
      const profile = JSON.stringify(DEMO_USER);
      const original = ranking();
      switchMode(mode);
      start(task.id);
      expect(query('#active-task-name').textContent).toBe(`Active task: ${task.name}`);
      expect(query('#active-task-scenario').textContent).toBe(task.scenario);
      expect(query('#task-context').hidden).toBe(false);
      expect(query(`input[value="${mode}"]`).checked).toBe(true);
      expect(query('.event-card.is-selected')).toBeNull();
      expect(query('#interest-preferences [aria-pressed="true"]')).toBeNull();
      expect(ranking()).toEqual(original);
      expect(JSON.stringify(EVENTS)).toBe(dataset);
      expect(JSON.stringify(DEMO_USER)).toBe(profile);
      action('select', 'E08').click();
      expect(summary().hidden).toBe(false);
      expect(summary().textContent).toContain(task.name);
      expect(summary().textContent).toContain(MODE_NAMES[mode]);
      expect(summary().textContent).toContain('Photography Walk');
      expect(summary().textContent).toContain('(E08)');
      expect(summary().textContent).toContain('Original ranking: #10');
      expect(summary().textContent).toContain('Current ranking at selection: #10');
    });
  });

  it('uses calculated adjusted and baseline positions and copies the chosen topics', () => {
    start('changing');
    switchMode('adjustable');
    topic('volunteering');
    topic('food-culture');
    const adjusted = rankEvents(EVENTS, DEMO_USER, ['volunteering', 'food-culture']);
    const original = rankEvents(EVENTS, DEMO_USER);
    for (const entry of adjusted) {
      action('select', entry.event.id).click();
      expect(summary().textContent).toContain(entry.event.title);
      expect(summary().textContent).toContain(`Original ranking: #${original.find((item) => item.event.id === entry.event.id).rank}`);
      expect(summary().textContent).toContain(`Current ranking at selection: #${entry.rank}`);
      expect(summary().textContent).toContain('Interest topics at selection: Volunteering, Food & Culture');
    }
    topic('food-culture');
    expect(summary().hidden).toBe(true);
    action('select', 'E09').click();
    switchMode('basic');
    // Mode comparison preserves the new choice made after preferences changed.
    expect(summary().textContent).toContain('Adjustable Ranking');
    expect(summary().textContent).toContain('Interest topics at selection: Volunteering');
    action('select', 'E04').click();
    action('select', 'E09').click();
    expect(summary().textContent).toContain('Basic Ranking');
    expect(summary().textContent).toContain('Temporary interest topics did not apply in this mode.');
    expect(summary().textContent).toContain('Current ranking at selection: #3');
  });

  it('records opened explanations, including other events, but not pre-task openings', () => {
    switchMode('explained');
    action('explain').click();
    start();
    action('select', 'E09').click();
    expect(summary().textContent).toContain('explanation opened during this task: No');
    action('explain', 'E04').click();
    expect(summary().textContent).toContain('explanation opened during this task: Yes');
    action('explain', 'E04').click();
    switchMode('basic');
    expect(summary().textContent).toContain('explanation opened during this task: Yes');
    query('#restart-task').click();
    action('select').click();
    expect(summary().textContent).toContain('explanation opened during this task: No');
  });

  it.each(['basic', 'adjustable', 'explained'])('records a details breakdown only in %s when actually available', (mode) => {
    start();
    switchMode(mode);
    action('details', 'E02').click();
    query('#details-close').click();
    action('select', 'E04').click();
    expect(summary().textContent).toContain(`explanation opened during this task: ${mode === 'explained' ? 'Yes' : 'No'}`);
  });

  it('reflects interests chosen inside event details in the choice snapshot', () => {
    start('changing');
    switchMode('adjustable');
    action('details', 'E09').click();
    query('#details-body [data-topic="volunteering"]').click();
    query('#details-close').click();
    action('select', 'E09').click();
    expect(summary().textContent).toContain('Interest topics at selection: Volunteering');
    expect(summary().textContent).toContain('Current ranking at selection: #1');
  });

  it('has no preselected rating and accepts all five values with changeable confirmation', () => {
    start();
    action('select').click();
    expect(document.querySelectorAll('input[name="control-rating"]')).toHaveLength(5);
    expect(query('input[name="control-rating"]:checked')).toBeNull();
    expect(query('#feedback-status').textContent).toBe('No rating selected.');
    const labels = ['Strongly disagree', 'Disagree', 'Neither agree nor disagree', 'Agree', 'Strongly agree'];
    for (let value = 1; value <= 5; value++) {
      rate(value);
      expect(query('input[name="control-rating"]:checked').value).toBe(String(value));
      expect(query('#feedback-status').textContent).toContain(`Feedback recorded: ${value} — ${labels[value - 1]}`);
    }
  });

  it('clears old feedback on replacement, toggle-off and banner clearing', () => {
    start();
    action('select').click();
    rate(4);
    action('select', 'E04').click();
    expect(summary().textContent).toContain('Interview Skills Clinic');
    expect(query('input[name="control-rating"]:checked')).toBeNull();
    rate(3);
    action('select', 'E04').click();
    expect(summary().hidden).toBe(true);
    action('select', 'E04').click();
    expect(query('input[name="control-rating"]:checked')).toBeNull();
    rate(2);
    query('[data-action="clear"]').click();
    expect(summary().hidden).toBe(true);
    action('select').click();
    expect(query('input[name="control-rating"]:checked')).toBeNull();
  });

  it('retains task, interests, selection and feedback through mode comparisons but clears the choice on preference reset', () => {
    start('changing');
    switchMode('adjustable');
    topic('volunteering');
    action('select', 'E09').click();
    rate(5);
    for (const mode of ['basic', 'explained', 'adjustable']) {
      switchMode(mode);
      expect(query('#active-task-name').textContent).toContain('Changing Priorities');
      expect(query('.event-card.is-selected').dataset.eventId).toBe('E09');
      expect(query('input[name="control-rating"]:checked').value).toBe('5');
      expect(summary().textContent).toContain('Current ranking at selection: #1');
    }
    query('[data-action="reset-topics"]').click();
    expect(query('.event-card.is-selected')).toBeNull();
    expect(query('input[name="control-rating"]')).toBeNull();
    expect(summary().hidden).toBe(true);
    expect(query('#active-task-name').textContent).toContain('Changing Priorities');
  });

  it.each(['restart', 'different task'])('%s explicitly resets all task state and restores the baseline in the current mode', (operation) => {
    const baseline = ranking();
    start();
    switchMode('explained');
    action('explain').click();
    switchMode('adjustable');
    topic('food-culture');
    action('select', 'E10').click();
    rate(4);
    if (operation === 'restart') query('#restart-task').click();
    else start('changing');
    expect(query('input[value="adjustable"]').checked).toBe(true);
    expect(ranking()).toEqual(baseline);
    expect(query('.event-card.is-selected')).toBeNull();
    expect(query('#interest-preferences [aria-pressed="true"]')).toBeNull();
    expect(summary().hidden).toBe(true);
    expect(query('#task-status').textContent).toContain('started fresh');
    expect(query('#active-task-name').textContent).toContain(operation === 'restart' ? 'Everyday Choice' : 'Changing Priorities');
    action('select').click();
    expect(query('input[name="control-rating"]:checked')).toBeNull();
    expect(summary().textContent).toContain('explanation opened during this task: No');
  });

  it('returns to untracked normal browsing while retaining the current choice and topics', () => {
    start();
    switchMode('adjustable');
    topic('music');
    action('select', 'E07').click();
    rate(3);
    query('#leave-task').click();
    expect(summary().hidden).toBe(true);
    expect(query('#task-context').hidden).toBe(true);
    expect(query('.event-card.is-selected').dataset.eventId).toBe('E07');
    expect(query('#interest-preferences [data-topic="music"]').getAttribute('aria-pressed')).toBe('true');
    action('select', 'E04').click();
    expect(summary().hidden).toBe(true);
  });
});

describe('preference changes invalidate existing decisions', () => {
  const message = 'Your preferences have changed and the ranking has been updated. Please choose an event again.';
  const topic = (id) => query(`#interest-preferences [data-topic="${id}"]`).click();

  it.each(['add', 'remove', 'reset'])('%s clears selection, summary and feedback but keeps the task and effective new preferences', (change) => {
    query('[data-task="changing"]').click();
    switchMode('explained');
    action('explain').click();
    switchMode('adjustable');
    topic('volunteering');
    if (change === 'remove') topic('food-culture');
    action('select', 'E09').click();
    query('input[name="control-rating"][value="4"]').click();
    if (change === 'add') topic('food-culture');
    if (change === 'remove') topic('volunteering');
    if (change === 'reset') query('[data-action="reset-topics"]').click();
    const expectedTopics = change === 'add' ? ['volunteering', 'food-culture']
      : change === 'remove' ? ['food-culture'] : [];
    expect(query('.event-card.is-selected')).toBeNull();
    expect(document.querySelectorAll('.event-card [data-action="select"][aria-pressed="false"]')).toHaveLength(10);
    expect(query('#decision-summary').hidden).toBe(true);
    expect(query('#decision-summary').innerHTML).toBe('');
    expect(query('input[name="control-rating"]')).toBeNull();
    expect(query('#selection-banner').textContent).toContain('No event selected');
    expect(query('#ranking-status').textContent).toBe(message);
    expect(query('#active-task-name').textContent).toBe('Active task: Changing Priorities');
    expect([...document.querySelectorAll('#interest-preferences [aria-pressed="true"]')].map((button) => button.dataset.topic))
      .toEqual(expectedTopics);
    const expectedRanking = rankEvents(EVENTS, DEMO_USER, expectedTopics);
    expect(ranking()).toEqual(expectedRanking.map((entry) => ({ id: entry.event.id, title: entry.event.title, score: entry.score })));
    action('select', 'E10').click();
    const newRank = expectedRanking.find((entry) => entry.event.id === 'E10').rank;
    expect(query('#decision-summary').textContent).toContain('International Food Exchange (E10)');
    expect(query('#decision-summary').textContent).toContain(`Original ranking: #8 · Current ranking at selection: #${newRank}`);
    expect(query('#decision-summary').textContent).toContain(change === 'add'
      ? 'Interest topics at selection: Volunteering, Food & Culture'
      : change === 'remove' ? 'Interest topics at selection: Food & Culture'
        : 'Interest topics at selection: None (baseline ranking)');
    expect(query('#decision-summary').textContent).toContain('explanation opened during this task: Yes');
    expect(query('input[name="control-rating"]:checked')).toBeNull();
    expect(query('#ranking-status').textContent).not.toContain('Please choose an event again.');
  });

  it('keeps a selection and feedback when resetting already empty preferences', () => {
    query('[data-task="everyday"]').click();
    switchMode('adjustable');
    action('select', 'E04').click();
    query('input[name="control-rating"][value="5"]').click();
    const before = ranking();
    // Dispatch directly to verify the no-change guard even if a disabled button emits an event.
    query('[data-action="reset-topics"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(ranking()).toEqual(before);
    expect(query('.event-card.is-selected').dataset.eventId).toBe('E04');
    expect(query('input[name="control-rating"]:checked').value).toBe('5');
    expect(query('#decision-summary').hidden).toBe(false);
  });

  it('clears normal-browsing selection on a preference change without requiring a task', () => {
    switchMode('adjustable');
    action('select', 'E01').click();
    topic('sports');
    expect(query('.event-card.is-selected')).toBeNull();
    expect(query('#ranking-status').textContent).toBe(message);
    expect(query('#interest-preferences [data-topic="sports"]').getAttribute('aria-pressed')).toBe('true');
    expect(query('#task-context').hidden).toBe(true);
    action('select', 'E05').click();
    expect(query('.event-card.is-selected').dataset.eventId).toBe('E05');
    expect(query('#decision-summary').hidden).toBe(true);
  });

  it('updates tags without a selection without showing a request to choose again', () => {
    switchMode('adjustable');
    topic('music');
    topic('food-culture');
    topic('music');
    expect(ranking()).toHaveLength(10);
    expect(query('.event-card.is-selected')).toBeNull();
    expect(query('#decision-summary').hidden).toBe(true);
    expect(query('#ranking-status').textContent).toContain('Ranking updated');
    expect(query('#ranking-status').textContent).not.toContain('Please choose an event again.');
  });

  it('keeps selection when viewing details and resets it only on an actual detail-topic change', () => {
    query('[data-task="changing"]').click();
    switchMode('adjustable');
    action('select', 'E09').click();
    query('input[name="control-rating"][value="3"]').click();
    action('details', 'E09').click();
    expect(query('.event-card.is-selected').dataset.eventId).toBe('E09');
    query('#details-close').click();
    expect(query('input[name="control-rating"]:checked').value).toBe('3');
    action('details', 'E09').click();
    const detailTopic = query('#details-body [data-topic="volunteering"]');
    detailTopic.focus();
    detailTopic.click();
    expect(document.activeElement).toBe(detailTopic);
    expect(query('#details-dialog').open).toBe(true);
    expect(query('#details-ranking-status').textContent).toContain(message);
    expect(query('.event-card.is-selected')).toBeNull();
    expect(query('#decision-summary').hidden).toBe(true);
    expect(query('#interest-preferences [data-topic="volunteering"]').getAttribute('aria-pressed')).toBe('true');
    query('#details-close').click();
    action('select', 'E09').click();
    expect(query('#decision-summary').textContent).toContain('Current ranking at selection: #1');
    expect(query('input[name="control-rating"]:checked')).toBeNull();
  });
});

describe('ranking modes and disclosure', () => {
  it('starts in Basic mode with no explanation controls or automatic selection', () => {
    expect(query('input[value="basic"]').checked).toBe(true);
    expect(document.querySelectorAll('.event-card')).toHaveLength(10);
    expect(query('[data-action="explain"]')).toBeNull();
    expect(query('.event-card.is-selected')).toBeNull();
  });

  it('keeps identical initial rankings, scores and titles across both modes', () => {
    const basic = ranking();
    expect(basic.map(({ id }) => id)).toEqual([
      'E01', 'E04', 'E09', 'E05', 'E02', 'E03', 'E07', 'E10', 'E06', 'E08',
    ]);
    expect(basic.map(({ score }) => score)).toEqual([90, 85, 80, 70, 60, 60, 50, 45, 35, 30]);
    switchMode('explained');
    expect(ranking()).toEqual(basic);
    switchMode('basic');
    expect(ranking()).toEqual(basic);
  });

  it('provides ten collapsed panels, and each button expands and collapses its panel', () => {
    switchMode('explained');
    const buttons = [...document.querySelectorAll('[data-action="explain"]')];
    expect(buttons).toHaveLength(10);
    for (const button of buttons) {
      const controlled = document.getElementById(button.getAttribute('aria-controls'));
      expect(controlled.hidden).toBe(true);
      expect(button.getAttribute('aria-expanded')).toBe('false');
      button.click();
      expect(controlled.hidden).toBe(false);
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(button.textContent).toBe('Hide explanation');
      button.click();
      expect(controlled.hidden).toBe(true);
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.textContent).toBe('Why recommended?');
    }
  });

  it('shows the actual weighted Coding Workshop contributions and total', () => {
    switchMode('explained');
    action('explain').click();
    const rows = [...panel().querySelectorAll('.breakdown li')];
    expect(rows.map((row) => row.querySelector('strong').textContent)).toEqual(['50', '30', '10']);
    expect(panel().querySelector('.details-total strong').textContent).toBe('90');
    expect(panel().textContent).toContain('Technology is rated 5/5');
  });

  it('keeps disclosures independent and retains keyboard focus on toggle', () => {
    switchMode('explained');
    action('explain').focus();
    action('explain').click();
    expect(document.activeElement).toBe(action('explain'));
    expect(panel().hidden).toBe(false);
    expect(panel('E04').hidden).toBe(true);
    action('explain').click();
    expect(document.activeElement).toBe(action('explain'));
  });

  it('preserves the selected event when switching modes and resets disclosure', () => {
    action('select', 'E04').click();
    switchMode('explained');
    action('explain', 'E04').click();
    switchMode('basic');
    expect(query('.event-card.is-selected').dataset.eventId).toBe('E04');
    expect(action('select', 'E04').getAttribute('aria-pressed')).toBe('true');
    expect(query('#selection-banner').textContent).toContain('Interview Skills Clinic');
    expect(query('[data-action="explain"]')).toBeNull();
    switchMode('explained');
    expect(query('.event-card.is-selected').dataset.eventId).toBe('E04');
    expect(panel('E04').hidden).toBe(true);
  });
});

describe.each(['basic', 'explained'])('%s mode existing interactions', (mode) => {
  it('selects, replaces and clears the selected event with visible feedback', () => {
    switchMode(mode);
    action('select').click();
    expect(query('.event-card.is-selected').dataset.eventId).toBe('E01');
    expect(action('select').getAttribute('aria-pressed')).toBe('true');
    action('select', 'E04').click();
    expect(document.querySelectorAll('.event-card.is-selected')).toHaveLength(1);
    expect(query('.event-card.is-selected').dataset.eventId).toBe('E04');
    expect(action('select').getAttribute('aria-pressed')).toBe('false');
    expect(query('#selection-banner').textContent).toContain('Interview Skills Clinic');
    query('[data-action="clear"]').click();
    expect(query('.event-card.is-selected')).toBeNull();
    expect(query('#selection-banner').textContent).toContain('No event selected');
  });

  it('opens details and closes with the close button or backdrop', () => {
    switchMode(mode);
    action('select', 'E04').click();
    action('details').click();
    expect(query('#details-dialog').open).toBe(true);
    expect(query('#details-title').textContent).toBe('Coding Workshop');
    expect(query('#details-body').textContent).toContain('#coding');
    query('#details-close').click();
    expect(query('#details-dialog').open).toBe(false);
    action('details', 'E04').click();
    expect(query('#details-title').textContent).toBe('Interview Skills Clinic');
    query('#details-dialog').click();
    expect(query('#details-dialog').open).toBe(false);
    expect(query('.event-card.is-selected').dataset.eventId).toBe('E04');
  });
});

describe('redesigned controls and image areas', () => {
  const pointer = (track, type, x) => {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, { pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: 20 });
    track.dispatchEvent(event);
  };

  it('switches modes by dragging without changing the selected event or ranking', () => {
    action('select', 'E04').click();
    const before = ranking();
    const track = query('.mode-track');
    track.setPointerCapture = vi.fn();
    track.getBoundingClientRect = () => ({ left: 0, width: 400 });
    pointer(track, 'pointerdown', 50);
    pointer(track, 'pointermove', 200);
    expect(track.classList.contains('is-dragging')).toBe(true);
    pointer(track, 'pointerup', 200);
    expect(track.dataset.mode).toBe('explained');
    expect(query('input[value="explained"]').checked).toBe(true);
    expect(query('.event-card.is-selected').dataset.eventId).toBe('E04');
    expect(ranking()).toEqual(before);
    pointer(track, 'pointerdown', 200);
    pointer(track, 'pointermove', 50);
    pointer(track, 'pointerup', 50);
    expect(track.dataset.mode).toBe('basic');
    expect(query('[data-action="explain"]')).toBeNull();
  });

  it('cancels a drag without changing mode', () => {
    const track = query('.mode-track');
    track.setPointerCapture = vi.fn();
    track.getBoundingClientRect = () => ({ left: 0, width: 400 });
    pointer(track, 'pointerdown', 50);
    pointer(track, 'pointermove', 350);
    pointer(track, 'pointercancel', 350);
    expect(track.dataset.mode).toBe('basic');
    expect(track.classList.contains('is-dragging')).toBe(false);
    expect(track.style.getPropertyValue('--slide')).toBe('');
  });

  it('keeps detailed score breakdowns out of Basic mode details', () => {
    action('details').click();
    expect(query('#details-body .breakdown')).toBeNull();
    expect(query('#ranking-formula').hidden).toBe(true);
    query('#details-close').click();
    switchMode('explained');
    action('details').click();
    expect(query('#details-body .breakdown')).not.toBeNull();
    expect(query('#ranking-formula').hidden).toBe(false);
  });

  it('provides ten placeholders with the exact reserved paths and no missing image elements', () => {
    const areas = [...document.querySelectorAll('.event-media')];
    expect(areas).toHaveLength(10);
    expect(document.querySelectorAll('.image-placeholder')).toHaveLength(10);
    expect(document.querySelectorAll('.event-media img')).toHaveLength(0);
    expect(EVENTS.map(({ image }) => image)).toEqual([
      '/images/events/coding-workshop.webp', '/images/events/ai-ethics-seminar.webp',
      '/images/events/graduate-careers-fair.webp', '/images/events/interview-skills-clinic.webp',
      '/images/events/football-social.webp', '/images/events/campus-yoga.webp',
      '/images/events/student-music-night.webp', '/images/events/photography-walk.webp',
      '/images/events/community-volunteering-meetup.webp', '/images/events/international-food-exchange.webp',
    ]);
    for (const area of areas) {
      expect(area.textContent).toContain('Image coming soon');
      expect(EVENTS.some(({ image }) => image === area.dataset.image)).toBe(true);
    }
  });

  it('reveals a future available image only after successful loading', async () => {
    const { mountEventImages } = await import('../src/event-images.js');
    const image = document.createElement('img');
    const createImage = vi.fn(function () { return image; });
    vi.stubGlobal('Image', createImage);
    const area = query('.event-media[data-title="Coding Workshop"]');
    mountEventImages(query('#event-list'), [area.dataset.image]);
    expect(createImage).toHaveBeenCalledTimes(1);
    expect(area.querySelector('img')).toBeNull();
    expect(area.querySelector('.image-placeholder').hidden).toBe(false);
    image.dispatchEvent(new Event('load'));
    expect(area.querySelector('img')).toBe(image);
    expect(image.getAttribute('src')).toBe('/images/events/coding-workshop.webp');
    expect(image.alt).toBe('Coding Workshop event illustration');
    expect(area.querySelector('.image-placeholder').hidden).toBe(true);
  });

  it('keeps the placeholder when a supplied image fails to decode', async () => {
    const { mountEventImages } = await import('../src/event-images.js');
    const image = document.createElement('img');
    vi.stubGlobal('Image', vi.fn(function () { return image; }));
    const area = query('.event-media');
    mountEventImages(query('#event-list'), [area.dataset.image]);
    image.dispatchEvent(new Event('error'));
    expect(area.querySelector('img')).toBeNull();
    expect(area.querySelector('.image-placeholder').hidden).toBe(false);
  });
});

describe('Adjustable Ranking canonical topics', () => {
  const mainTopic = (id) => query(`#interest-preferences [data-topic="${id}"]`);
  const detailTopic = (id) => query(`#details-body [data-topic="${id}"]`);

  it('starts with exactly eight canonical native buttons and the exact baseline', () => {
    const baseline = ranking();
    switchMode('adjustable');
    expect(ranking()).toEqual(baseline);
    const buttons = [...document.querySelectorAll('#interest-preferences [data-topic]')];
    expect(buttons).toHaveLength(8);
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Technology & AI', 'Career Development', 'Sports', 'Wellbeing',
      'Music', 'Photography', 'Volunteering', 'Food & Culture',
    ]);
    expect(query('#interest-preferences').hidden).toBe(false);
    expect(query('[data-action="reset-topics"]').disabled).toBe(true);
    expect(query('.interest-summary').textContent).toBe('0 of 8 topics selected');
    for (const button of buttons) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.type).toBe('button');
      expect(button.getAttribute('aria-pressed')).toBe('false');
    }
  });

  it.each(INTEREST_TOPICS)('selects and removes $label while keeping all ten events', (topic) => {
    const baseline = ranking();
    switchMode('adjustable');
    mainTopic(topic.id).focus();
    mainTopic(topic.id).click();
    expect(mainTopic(topic.id).getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(mainTopic(topic.id));
    expect(ranking()).toHaveLength(10);
    expect(query('.interest-summary').textContent).toBe('1 of 8 topics selected');
    expect(query('#ranking-status').textContent).toContain('Ranking updated');
    for (const entry of ranking()) {
      const event = EVENTS.find(({ id }) => id === entry.id);
      const originalInterest = { Technology: 100, Career: 80, Sports: 40, Arts: 20, Community: 60 }[event.category];
      const match = topic.eventIds.includes(event.id) ? 100 : 0;
      const baselineScore = baseline.find(({ id }) => id === entry.id).score;
      expect(entry.score).toBeCloseTo(baselineScore - 0.5 * originalInterest
        + 0.5 * (0.3 * originalInterest + 0.7 * match), 10);
    }
    mainTopic(topic.id).click();
    expect(mainTopic(topic.id).getAttribute('aria-pressed')).toBe('false');
    expect(ranking()).toEqual(baseline);
    expect(query('#ranking-status').textContent).toContain('Original ranking restored');
  });

  it('supports multiple topics, removal and selection reset with movement feedback', () => {
    const baseline = ranking();
    action('select', 'E06').click();
    switchMode('adjustable');
    mainTopic('sports').click();
    mainTopic('wellbeing').click();
    mainTopic('photography').click();
    expect(query('.interest-summary').textContent).toBe('3 of 8 topics selected');
    expect(ranking()[0]).toMatchObject({ id: 'E05', score: 91 });
    expect(ranking().find(({ id }) => id === 'E06').score).toBe(56);
    expect(ranking().find(({ id }) => id === 'E08').score).toBe(58);
    expect(query('.rank-movement--up')).not.toBeNull();
    expect(query('.rank-movement--down')).not.toBeNull();
    expect(query('.event-card.is-selected')).toBeNull();
    mainTopic('wellbeing').click();
    expect(ranking().find(({ id }) => id === 'E06').score).toBe(21);
    mainTopic('sports').click();
    mainTopic('photography').click();
    expect(ranking()).toEqual(baseline);
    expect(document.activeElement).toBe(mainTopic('photography'));
    expect(query('.event-card.is-selected')).toBeNull();
  });

  it('reset restores baseline scores/order and clears selection without losing topics on mode switches', () => {
    const baseline = ranking();
    action('select', 'E08').click();
    switchMode('adjustable');
    mainTopic('photography').click();
    mainTopic('career-development').click();
    action('select', 'E08').click();
    const adjusted = ranking();
    for (const mode of ['basic', 'explained']) {
      switchMode(mode);
      expect(ranking()).toEqual(baseline);
      expect(query('#interest-preferences').hidden).toBe(true);
      expect(query('.rank-movement')).toBeNull();
      action('details').click();
      expect(query('#details-body [data-action="toggle-topic"]')).toBeNull();
      query('#details-close').click();
      expect(query('.event-card.is-selected').dataset.eventId).toBe('E08');
    }
    action('explain').click();
    expect(panel().querySelector('.details-total strong').textContent).toBe('90');
    switchMode('adjustable');
    expect(ranking()).toEqual(adjusted);
    expect(mainTopic('photography').getAttribute('aria-pressed')).toBe('true');
    expect(mainTopic('career-development').getAttribute('aria-pressed')).toBe('true');
    query('[data-action="reset-topics"]').click();
    expect(ranking()).toEqual(baseline);
    expect(query('.event-card.is-selected')).toBeNull();
    expect(query('#selection-banner').textContent).toContain('No event selected');
    expect(query('#interest-preferences [aria-pressed="true"]')).toBeNull();
    expect(query('#ranking-status').textContent).toContain('Your preferences have changed');
    switchMode('basic');
    switchMode('adjustable');
    expect(query('#interest-preferences [aria-pressed="true"]')).toBeNull();
  });

  it('shows each event’s mapped topic as the only interactive preference and retains descriptive metadata', () => {
    switchMode('adjustable');
    for (const event of EVENTS) {
      action('details', event.id).click();
      expect(query('#details-title').textContent).toBe(event.title);
      const buttons = [...document.querySelectorAll('#details-body [data-action="toggle-topic"]')];
      expect(buttons).toHaveLength(1);
      expect(buttons[0].dataset.topic).toBe(EVENT_TOPIC_IDS[event.id]);
      expect([...document.querySelectorAll('#details-body .tag:not(button)')].map((tag) => tag.textContent))
        .toEqual(event.tags.map((tag) => `#${tag}`));
      expect(query('#details-body [data-action="toggle-tag"]')).toBeNull();
      query('#details-close').click();
    }
  });

  it('synchronises shared Technology & AI choices across main controls and both matching event details', () => {
    switchMode('adjustable');
    mainTopic('technology-ai').click();
    action('details', 'E01').click();
    expect(detailTopic('technology-ai').getAttribute('aria-pressed')).toBe('true');
    detailTopic('technology-ai').focus();
    detailTopic('technology-ai').click();
    expect(document.activeElement).toBe(detailTopic('technology-ai'));
    expect(mainTopic('technology-ai').getAttribute('aria-pressed')).toBe('false');
    expect(query('#details-ranking-status').textContent).toContain('score 90');
    detailTopic('technology-ai').click();
    expect(mainTopic('technology-ai').getAttribute('aria-pressed')).toBe('true');
    query('#details-close').click();
    action('details', 'E02').click();
    expect(detailTopic('technology-ai').getAttribute('aria-pressed')).toBe('true');
    detailTopic('technology-ai').click();
    expect(mainTopic('technology-ai').getAttribute('aria-pressed')).toBe('false');
    expect(query('.interest-summary').textContent).toBe('0 of 8 topics selected');
    expect(query('#details-dialog').open).toBe(true);
  });

  it('updates detail scores and restores focus to the current opener after re-ranking', () => {
    switchMode('adjustable');
    action('details', 'E06').click();
    detailTopic('wellbeing').focus();
    detailTopic('wellbeing').click();
    expect(document.activeElement).toBe(detailTopic('wellbeing'));
    expect(query('#details-ranking-status').textContent).toContain('score 56');
    expect(mainTopic('wellbeing').getAttribute('aria-pressed')).toBe('true');
    query('#details-close').click();
    query('#details-dialog').dispatchEvent(new Event('close'));
    expect(document.activeElement).toBe(action('details', 'E06'));
  });

  it('supports dragging directly to the third segment', () => {
    const track = query('.mode-track');
    track.setPointerCapture = vi.fn();
    track.getBoundingClientRect = () => ({ left: 0, width: 400 });
    for (const [type, x] of [['pointerdown', 50], ['pointermove', 350], ['pointerup', 350]]) {
      const event = new Event(type, { bubbles: true });
      Object.assign(event, { pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: 20 });
      track.dispatchEvent(event);
    }
    expect(track.dataset.mode).toBe('adjustable');
    expect(query('input[value="adjustable"]').checked).toBe(true);
    expect(query('#interest-preferences').hidden).toBe(false);
  });
});
