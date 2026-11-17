/**
 * CampusChoice — Basic, Explained and Adjustable Ranking application entry point.
 *
 * Wires the local dataset, the rule-based ranking module and the DOM together.
 * Scope: browsing a ranked list, viewing details and selecting one event.
 * Baseline explanations and temporary interest preferences remain independent.
 */

import './styles.css';
import { EVENTS } from './data/events.js';
import { DEMO_USER } from './data/preferences.js';
import { INTEREST_TOPICS, matchesInterestTopic } from './data/interest-topics.js';
import { rankEvents } from './ranking.js';
import { initModeSwitch } from './mode-switch.js';
import { DECISION_TASKS, CONTROL_RATINGS, captureDecision } from './decision-tasks.js';
import { DISCOVERY_RULES, createDiscoveryState, syncDiscoveryPreferences, observeDetail, nextSuggestion, resolveSuggestion } from './interest-discovery.js';
import {
  renderPreferences,
  renderRankedList,
  renderSelectionBanner,
  renderDetails,
  renderInterests,
  renderDecision,
} from './ui.js';

const baseline = rankEvents(EVENTS, DEMO_USER);
const baselineRanks = new Map(baseline.map((entry) => [entry.event.id, entry.rank]));
let ranked = baseline;
// Session-only choices: never write into the original demo profile.
let selectedTopics = [];
let detailsEventId = null;
const availableTopics = new Map(INTEREST_TOPICS.map((topic) => [topic.id, topic.label]));

/** @type {string|null} */
let selectedEventId = null;
let mode = 'basic';
const expandedIds = new Set();
// Task context, choice snapshot and feedback are separate from baseline/interests.
let activeTask = null;
let decision = null;
let explanationOpened = false;
let controlRating = null;
let discovery = createDiscoveryState();

const prefsEl = document.getElementById('preferences');
const listEl = document.getElementById('event-list');
const bannerEl = document.getElementById('selection-banner');
const dialogEl = document.getElementById('details-dialog');
const detailsBody = document.getElementById('details-body');
const detailsClose = document.getElementById('details-close');
const interestsEl = document.getElementById('interest-preferences');
const rankingStatus = document.getElementById('ranking-status');
const decisionEl = document.getElementById('decision-summary');
const taskStatus = document.getElementById('task-status');
const discoveryEl = document.getElementById('interest-discovery');
const discoveryStatus = document.getElementById('discovery-status');
const preferenceChangeMessage = 'Your preferences have changed and the ranking has been updated. Please choose an event again.';
let discoveryOpenerId = null;

function renderDiscovery(offer = false) {
  discoveryStatus.hidden = mode !== 'adjustable' || !discoveryStatus.textContent;
  discovery = syncDiscoveryPreferences(discovery, selectedTopics);
  if (mode !== 'adjustable' || dialogEl.open || !discovery.pendingRule) {
    if (discoveryEl.open) discoveryEl.close();
  }
  // Only a completed detail interaction may open a modal, never a tag removal.
  if (!offer || mode !== 'adjustable' || dialogEl.open || discoveryEl.open) return;
  discovery = nextSuggestion(discovery, selectedTopics);
  const rule = DISCOVERY_RULES.find((item) => item.id === discovery.pendingRule);
  if (!rule) return;
  discoveryEl.dataset.rule = rule.id;
  document.getElementById('discovery-reason').textContent = rule.message;
  discoveryEl.querySelector('[data-discovery="accept"]').textContent =
    rule.topics.length === 2 ? 'Add both interests' : 'Add interest';
  discoveryOpenerId = document.activeElement?.dataset.eventId ?? null;
  discoveryEl.showModal();
  discoveryEl.querySelector('[data-discovery="dismiss"]').focus();
}

function restoreDiscoveryFocus() {
  listEl.querySelector(`[data-action="details"][data-event-id="${discoveryOpenerId}"]`)?.focus({ preventScroll: true });
}

function handleDiscovery(dismissing) {
  const rule = DISCOVERY_RULES.find((item) => item.id === discovery.pendingRule);
  if (!rule) return;
  discovery = resolveSuggestion(discovery, dismissing);
  discoveryEl.close();
  if (dismissing) {
    discoveryStatus.textContent = `${rule.label} suggestion dismissed. Your interests and decision are unchanged.`;
  } else {
    updateInterests([...new Set([...selectedTopics, ...rule.topics])],
      `Added ${rule.label}. Ranking updated; all 10 events are shown.`);
    discoveryStatus.textContent = `${rule.label} added to your interests. You can remove the topics or reset preferences.`;
  }
  discoveryStatus.hidden = mode !== 'adjustable';
  restoreDiscoveryFocus();
}

discoveryEl.addEventListener('cancel', (event) => {
  event.preventDefault();
  handleDiscovery(true);
});
discoveryEl.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const first = discoveryEl.querySelector('[data-discovery="accept"]');
  const last = discoveryEl.querySelector('[data-discovery="dismiss"]');
  if ((event.shiftKey && document.activeElement === first)
    || (!event.shiftKey && document.activeElement === last)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
});
discoveryEl.addEventListener('close', () => {
  // A native/external close is a dismissal; internal closes resolve state first.
  if (discovery.pendingRule && mode === 'adjustable') handleDiscovery(true);
  restoreDiscoveryFocus();
});
discoveryEl.addEventListener('click', (event) => {
  if (event.target === discoveryEl) {
    const bounds = discoveryEl.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) handleDiscovery(true);
    return;
  }
  const button = event.target.closest('[data-discovery]');
  if (!button || !discoveryEl.open || mode !== 'adjustable' || dialogEl.open) return;
  handleDiscovery(button.dataset.discovery === 'dismiss');
});

function renderTaskDecision() {
  renderDecision(decisionEl, decision, explanationOpened, controlRating);
}

function recordExplanation() {
  if (!activeTask || explanationOpened) return;
  explanationOpened = true;
  renderTaskDecision();
}

function startTask(task) {
  activeTask = task;
  selectedEventId = null;
  selectedTopics = [];
  ranked = baseline;
  expandedIds.clear();
  decision = null;
  explanationOpened = false;
  controlRating = null;
  discovery = createDiscoveryState();
  discoveryStatus.textContent = '';
  document.getElementById('task-context').hidden = false;
  document.getElementById('active-task-name').textContent = `Active task: ${task.name}`;
  document.getElementById('active-task-scenario').textContent = task.scenario;
  render();
  taskStatus.textContent = `${task.name} started fresh. Selection, interests, explanation tracking and feedback cleared.`;
  rankingStatus.textContent = 'Original ranking restored; all 10 events are shown.';
}

document.querySelector('.decision-tasks').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const task = DECISION_TASKS.find((item) => item.id === button.dataset.task);
  if (task) startTask(task);
  if (button.id === 'restart-task' && activeTask) startTask(activeTask);
  if (button.id === 'leave-task') {
    activeTask = null;
    decision = null;
    explanationOpened = false;
    controlRating = null;
    document.getElementById('task-context').hidden = true;
    renderTaskDecision();
    taskStatus.textContent = 'Normal browsing. Task tracking and feedback cleared; your selection and interests are retained.';
    document.querySelector('#task-options summary').focus();
  }
});

decisionEl.addEventListener('change', (event) => {
  if (!activeTask || !decision || event.target.name !== 'control-rating') return;
  const value = Number(event.target.value);
  if (!Number.isInteger(value) || value < 1 || value > 5) return;
  controlRating = value;
  document.getElementById('feedback-status').textContent =
    `Feedback recorded: ${value} — ${CONTROL_RATINGS[value - 1]}. You can change your answer.`;
});

/** Look up a ranked entry by event ID. */
function findEntry(eventId) {
  return ranked.find((entry) => entry.event.id === eventId) ?? null;
}

function render() {
  renderPreferences(prefsEl, DEMO_USER);
  renderRankedList(listEl, ranked, selectedEventId, mode, expandedIds, baselineRanks, selectedTopics);
  renderSelectionBanner(bannerEl, findEntry(selectedEventId));
  interestsEl.hidden = mode !== 'adjustable';
  renderInterests(interestsEl, selectedTopics);
  renderTaskDecision();
  renderDiscovery();
}

/** Select an event, or toggle it off if it is already selected. */
function selectEvent(eventId) {
  selectedEventId = selectedEventId === eventId ? null : eventId;
  if (activeTask) {
    decision = selectedEventId
      ? captureDecision(activeTask, findEntry(selectedEventId), mode, baselineRanks, selectedTopics)
      : null;
    controlRating = null;
  }
  render();
  if (selectedEventId && rankingStatus.textContent === preferenceChangeMessage) {
    rankingStatus.textContent = 'Event selected using the updated ranking; all 10 events are shown.';
  }
  listEl.querySelector(`[data-action="select"][data-event-id="${eventId}"]`)?.focus();
}

/** Clear the current selection. */
function clearSelection() {
  selectedEventId = null;
  decision = null;
  controlRating = null;
  render();
}

/** Open the details dialog for an event. */
function openDetails(eventId) {
  const entry = findEntry(eventId);
  if (!entry) return;
  detailsEventId = eventId;
  renderDetails(detailsBody, entry, mode, selectedTopics);
  if (mode === 'explained') recordExplanation();
  if (typeof dialogEl.showModal === 'function') {
    dialogEl.showModal();
  } else {
    dialogEl.setAttribute('open', '');
  }
  if (mode === 'adjustable') discovery = observeDetail(discovery, eventId, selectedTopics);
  renderDiscovery();
}

/** Only changed preferences invalidate a choice; task context and new topics remain. */
function updateInterests(nextTopics, message) {
  const changed = nextTopics.length !== selectedTopics.length
    || nextTopics.some((topic) => !selectedTopics.includes(topic));
  if (!changed) return;
  selectedTopics = nextTopics;
  discovery = syncDiscoveryPreferences(discovery, selectedTopics);
  discoveryStatus.textContent = '';
  if (selectedEventId) {
    selectedEventId = null;
    decision = null;
    controlRating = null;
    message = preferenceChangeMessage;
  }
  ranked = rankEvents(EVENTS, DEMO_USER, selectedTopics);
  render();
  rankingStatus.textContent = message;
  if (dialogEl.open && detailsEventId) {
    const entry = findEntry(detailsEventId);
    // Preserve native topic buttons and keyboard focus while their state updates.
    detailsBody.querySelectorAll('[data-action="toggle-topic"]').forEach((button) => {
      button.setAttribute('aria-pressed', String(selectedTopics.includes(button.dataset.topic)));
    });
    const status = document.getElementById('details-ranking-status');
    status.textContent = `${message} ${entry.event.title}: score ${entry.score} · current rank #${entry.rank}. ${
      selectedTopics.length ? (matchesInterestTopic(entry.event, selectedTopics)
        ? 'Matches your selected interests.' : 'No selected topic match.') : 'No topics selected.'}`;
  }
}

function handleInterests(event) {
  if (mode !== 'adjustable') return;
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.action === 'reset-topics') {
    updateInterests([], 'Preferences reset. Original ranking restored; all 10 events are shown.');
    interestsEl.querySelector('h2').setAttribute('tabindex', '-1');
    interestsEl.querySelector('h2').focus();
  } else if (button.dataset.action === 'toggle-topic' && availableTopics.has(button.dataset.topic)) {
    const { topic } = button.dataset;
    const removing = selectedTopics.includes(topic);
    const nextTopics = removing ? selectedTopics.filter((value) => value !== topic) : [...selectedTopics, topic];
    const inPreferences = interestsEl.contains(button);
    updateInterests(nextTopics, `${removing ? 'Removed' : 'Added'} ${availableTopics.get(topic)}. ${
      nextTopics.length ? 'Ranking updated' : 'Original ranking restored'}; all 10 events are shown.`);
    if (inPreferences) {
      interestsEl.querySelector(`[data-topic="${topic}"]`).focus({ preventScroll: true });
    }
  }
}
interestsEl.addEventListener('click', handleInterests);
detailsBody.addEventListener('click', handleInterests);

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
    if (expanded) recordExplanation();
    document.getElementById(`explanation-${eventId}`).hidden = !expanded;
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? 'Hide explanation' : 'Why recommended?';
  }
});

initModeSwitch(document.querySelector('.mode-switch'), (value) => {
  mode = value;
  ranked = mode === 'adjustable' ? rankEvents(EVENTS, DEMO_USER, selectedTopics) : baseline;
  expandedIds.clear();
  render();
  rankingStatus.textContent = mode === 'adjustable'
    ? `${selectedTopics.length ? 'Your interest ranking is active' : 'Original ranking — choose your interest topics above'}; all 10 events are shown.`
    : 'Original demo ranking. Temporary interests do not apply in this mode.';
  document.getElementById('ranking-formula').hidden = mode !== 'explained';
});

bannerEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="clear"]');
  if (button) clearSelection();
});

detailsClose.addEventListener('click', () => dialogEl.close());
dialogEl.addEventListener('close', () => {
  // Re-ranking replaces cards, so the browser's original opener may no longer exist.
  listEl.querySelector(`[data-action="details"][data-event-id="${detailsEventId}"]`)?.focus();
  detailsEventId = null;
  renderDiscovery(true);
});

// Close the dialog when clicking the backdrop.
dialogEl.addEventListener('click', (event) => {
  if (event.target === dialogEl) dialogEl.close();
});

render();
