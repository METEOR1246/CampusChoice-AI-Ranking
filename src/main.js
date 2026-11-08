/**
 * CampusChoice — Milestone 2 (Basic Ranking) application entry point.
 *
 * Wires the local dataset, the rule-based ranking module and the DOM together.
 * Scope: browsing a ranked list, viewing details and selecting one event.
 * Explained Ranking, Adjustable Ranking and behavioural inference are out of scope.
 */

import './styles.css';
import { EVENTS } from './data/events.js';
import { DEMO_USER } from './data/preferences.js';
import { rankEvents } from './ranking.js';
import {
  renderPreferences,
  renderRankedList,
  renderSelectionBanner,
  renderDetails,
} from './ui.js';

const ranked = rankEvents(EVENTS, DEMO_USER);

/** @type {string|null} */
let selectedEventId = null;

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
  renderRankedList(listEl, ranked, selectedEventId);
  renderSelectionBanner(bannerEl, findEntry(selectedEventId));
}

/** Select an event, or toggle it off if it is already selected. */
function selectEvent(eventId) {
  selectedEventId = selectedEventId === eventId ? null : eventId;
  render();
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
  renderDetails(detailsBody, entry);
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
