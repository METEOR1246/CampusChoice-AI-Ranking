// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import shell from '../index.html?raw';
import { EVENTS } from '../src/data/events.js';

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
    pointer(track, 'pointermove', 350);
    expect(track.classList.contains('is-dragging')).toBe(true);
    pointer(track, 'pointerup', 350);
    expect(track.dataset.mode).toBe('explained');
    expect(query('input[value="explained"]').checked).toBe(true);
    expect(query('.event-card.is-selected').dataset.eventId).toBe('E04');
    expect(ranking()).toEqual(before);
    pointer(track, 'pointerdown', 350);
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
