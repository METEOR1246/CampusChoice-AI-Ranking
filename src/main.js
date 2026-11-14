/**
 * CampusChoice — Basic and Explained Ranking application entry point.
 *
 * Wires the local dataset, the rule-based ranking module and the DOM together.
 * Scope: browsing a ranked list, viewing details and selecting one event.
 * Explanations use the same ranked entries. Adjustable Ranking is out of scope.
 */

import './styles.css';
import { EVENTS } from './data/events.js';
import { DEMO_USER } from './data/preferences.js';
import { rankEvents } from './ranking.js';
import { initModeSwitch } from './mode-switch.js';
import {
  renderPreferences,
  renderRankedList,
  renderSelectionBanner,
  renderDetails,
} from './ui.js';

const ranked = rankEvents(EVENTS, DEMO_USER);

/** @type {string|null} */
let selectedEventId = null;
let mode = 'basic';
const expandedIds = new Set();

const prefsEl = document.getElementById('preferences');
const listEl = document.getElementById('event-list');
const bannerEl = document.getElementById('selection-banner');
const dialogEl = document.getElementById('details-dialog');
const detailsBody = document.getElementById('details-body');
const detailsClose = document.getElementById('details-close');

/** Look up a ranked entry by event ID. */
function findEntry(eventId) {
  return ranked.find((entry) => entry.event.id === eventId) ?? null;
}

function render() {
  renderPreferences(prefsEl, DEMO_USER);
  renderRankedList(listEl, ranked, selectedEventId, mode, expandedIds);
  renderSelectionBanner(bannerEl, findEntry(selectedEventId));
}

/** Select an event, or toggle it off if it is already selected. */
function selectEvent(eventId) {
  selectedEventId = selectedEventId === eventId ? null : eventId;
  render();
  listEl.querySelector(`[data-action="select"][data-event-id="${eventId}"]`)?.focus();
}

/** Clear the current selection. */
function clearSelection() {
  selectedEventId = null;
  render();
}

/** Open the details dialog for an event. */
function openDetails(eventId) {
  const entry = findEntry(eventId);
  if (!entry) return;
  renderDetails(detailsBody, entry, mode);
  if (typeof dialogEl.showModal === 'function') {
    dialogEl.showModal();
  } else {
    dialogEl.setAttribute('open', '');
  }
}

// Event delegation for list-card actions and the banner button.
listEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, eventId } = button.dataset;
  if (action === 'details') openDetails(eventId);
  if (action === 'select') selectEvent(eventId);
  if (action === 'explain' && mode === 'explained') {
    if (expandedIds.has(eventId)) expandedIds.delete(eventId);
    else expandedIds.add(eventId);
    const expanded = expandedIds.has(eventId);
    document.getElementById(`explanation-${eventId}`).hidden = !expanded;
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? 'Hide explanation' : 'Why recommended?';
  }
});

initModeSwitch(document.querySelector('.mode-switch'), (value) => {
  mode = value;
  // Mode changes affect disclosure only, never the ranking or selected event.
  expandedIds.clear();
  renderRankedList(listEl, ranked, selectedEventId, mode, expandedIds);
  document.getElementById('ranking-formula').hidden = mode !== 'explained';
});

bannerEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="clear"]');
  if (button) clearSelection();
});

detailsClose.addEventListener('click', () => dialogEl.close());

// Close the dialog when clicking the backdrop.
dialogEl.addEventListener('click', (event) => {
  if (event.target === dialogEl) dialogEl.close();
});

render();
