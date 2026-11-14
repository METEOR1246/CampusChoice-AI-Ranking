/**
 * UI rendering helpers for CampusChoice.
 *
 * Kept free of ranking maths so the scoring logic stays testable in isolation.
 * All user-supplied strings come from the local dataset.
 */

import { explainEvent } from './explanations.js';
import { DEMO_USER } from './data/preferences.js';
import { mountEventImages } from './event-images.js';

/** Format a price in GBP, rendering zero as "Free". */
export function formatPrice(price) {
  return price === 0 ? 'Free' : `£${price}`;
}

/**
 * Render the demo user's preference summary.
 *
 * @param {HTMLElement} container
 * @param {import('./data/preferences.js').UserPreferences} preferences
 */
export function renderPreferences(container, preferences) {
  const rows = Object.entries(preferences.categoryPreference)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([category, level]) => `
        <li class="pref-row">
          <span class="pref-cat">${category}</span>
          <span class="pref-bar" aria-hidden="true">
            <span class="pref-fill" style="width:${level * 20}%"></span>
          </span>
          <span class="pref-level">${level}/5</span>
        </li>`,
    )
    .join('');

  container.innerHTML = `
    <h2 id="prefs-heading">Demo user preferences</h2>
    <ul class="pref-list">${rows}</ul>
    <p class="pref-time">
      Preferred time slot: <strong>${preferences.preferredTimeSlot}</strong>
    </p>
  `;
}

/**
 * Render the ranked event list.
 *
 * @param {HTMLElement} container
 * @param {Array<ReturnType<import('./ranking.js').rankEvents>[number]>} ranked
 * @param {string|null} selectedEventId
 * @param {'basic'|'explained'} mode
 * @param {Set<string>} expandedIds
 */
export function renderRankedList(container, ranked, selectedEventId, mode = 'basic', expandedIds = new Set()) {
  container.innerHTML = ranked
    .map((entry) => {
      const { event, score, rank } = entry;
      const isSelected = event.id === selectedEventId;
      const expanded = expandedIds.has(event.id);
      return `
        <li>
          <article
            class="event-card${isSelected ? ' is-selected' : ''}"
            data-event-id="${event.id}"
          >
            <div class="event-media" data-image="${event.image}" data-title="${event.title}">
              <div class="image-placeholder">
                <span class="image-icon" aria-hidden="true"></span>
                <span>Image coming soon</span>
              </div>
            </div>
            <div class="event-content">
            <div class="card-head">
              <span class="rank-badge" aria-label="Rank ${rank}">#${rank}</span>
              <div class="card-title-block">
                <h3 class="card-title">${event.title}</h3>
                <p class="card-meta">
                  <span class="chip chip--${event.category.toLowerCase()}">${event.category}</span>
                  <span class="meta-item">${event.day} ${event.time}</span>
                  <span class="meta-item">${formatPrice(event.price)}</span>
                </p>
              </div>
              <span class="score-badge" aria-label="Score ${score}">
                <span class="score-value">${score}</span>
                <span class="score-label">score</span>
              </span>
            </div>

            <p class="card-desc">${event.description}</p>

            <div class="card-actions">
              <button
                type="button"
                class="btn btn--ghost"
                data-action="details"
                data-event-id="${event.id}"
              >
                View details
              </button>
              <button
                type="button"
                class="btn ${isSelected ? 'btn--selected' : 'btn--primary'}"
                data-action="select"
                data-event-id="${event.id}"
                aria-pressed="${isSelected}"
              >
                ${isSelected ? 'Selected ✓' : 'Select event'}
              </button>
              ${mode === 'explained' ? `
                <button type="button" class="btn btn--explain"
                  data-action="explain" data-event-id="${event.id}"
                  aria-expanded="${expanded}" aria-controls="explanation-${event.id}">
                  ${expanded ? 'Hide explanation' : 'Why recommended?'}
                </button>` : ''}
            </div>
            ${mode === 'explained' ? renderExplanation(entry, expanded) : ''}
            </div>
          </article>
        </li>`;
    })
    .join('');
  mountEventImages(container);
}

/** Progressive disclosure of weighted points, rather than raw factor scores. */
function renderExplanation(entry, expanded) {
  const explanation = explainEvent(entry, DEMO_USER);
  return `
    <section id="explanation-${entry.event.id}" class="explanation-panel"
      aria-labelledby="explanation-title-${entry.event.id}" ${expanded ? '' : 'hidden'}>
      <h4 id="explanation-title-${entry.event.id}">Why ${entry.event.title} is recommended</h4>
      <ul class="breakdown">
        ${explanation.factors.map(({ label, value }) =>
          `<li><span>${label}</span><strong>${value}</strong><span class="breakdown-note">points</span></li>`).join('')}
      </ul>
      <p class="details-total">Total ranking score: <strong>${explanation.score}</strong></p>
      <p>${explanation.summary}</p>
      <p class="list-sub">${explanation.ordering}</p>
    </section>`;
}

/**
 * Render the selection banner describing the current choice.
 *
 * @param {HTMLElement} container
 * @param {{ event: import('./data/events.js').Event, rank: number }|null} selected
 */
export function renderSelectionBanner(container, selected) {
  if (!selected) {
    container.className = 'selection-banner';
    container.innerHTML =
      '<span class="selection-empty">No event selected yet — choose an event to highlight it.</span>';
    return;
  }

  container.className = 'selection-banner is-active';
  container.innerHTML = `
    <span class="selection-text">
      Your selection: <strong>${selected.event.title}</strong>
      <span class="selection-meta">(${selected.event.id} · ranked #${selected.rank})</span>
    </span>
    <button type="button" class="btn btn--link" data-action="clear">Change selection</button>
  `;
}

/**
 * Render the details dialog body for an event.
 *
 * @param {HTMLElement} container
 * @param {{ event: import('./data/events.js').Event, interest: number, time: number, affordability: number, score: number, rank: number }} entry
 * @param {'basic'|'explained'} mode
 */
export function renderDetails(container, entry, mode = 'basic') {
  const { event, interest, time, affordability, score, rank } = entry;
  const tags = event.tags.map((tag) => `<span class="tag">#${tag}</span>`).join('');

  container.innerHTML = `
    <h2 id="details-title" class="details-title">${event.title}</h2>
    <p class="card-meta details-meta">
      <span class="chip chip--${event.category.toLowerCase()}">${event.category}</span>
      <span class="meta-item">${event.day} ${event.time}</span>
      <span class="meta-item">${formatPrice(event.price)}</span>
    </p>

    <p class="details-desc">${event.description}</p>

    <div class="tag-row">${tags}</div>

    ${mode === 'explained' ? `<h3 class="details-subhead">Ranking breakdown</h3>
    <ul class="breakdown">
      <li><span>Interest</span><span>${interest}</span><span class="breakdown-note">0.5 weight</span></li>
      <li><span>Time</span><span>${time}</span><span class="breakdown-note">0.3 weight</span></li>
      <li><span>Affordability</span><span>${affordability}</span><span class="breakdown-note">0.2 weight</span></li>
    </ul>
    <p class="details-total">
      Total score <strong>${score}</strong> · current rank <strong>#${rank}</strong>
    </p>` : ''}
  `;
}
