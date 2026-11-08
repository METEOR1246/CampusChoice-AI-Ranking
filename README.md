# CampusChoice: Explainable and Controllable Event Ranking

**Status:** Milestone 2 implemented — working basic ranking prototype (8 November 2026)

## Overview

CampusChoice is an interactive prototype for the University of Birmingham's
Intelligent Interactive Systems Assignment 2.

It builds on Assignment 1's research question: **How does AI-generated ranking
influence users' decision-making and perceived control?**

The project explores how university students interact with ranked event
recommendations, and whether explanations and preference controls change their
understanding and choices.

## Planned Interaction Modes

1. **Basic Ranking (implemented):** Students browse and select from a ranked event list.
2. **Explained Ranking (not yet implemented):** The same initial ranking includes an optional "Why recommended?" explanation.
3. **Adjustable Ranking (not yet implemented):** Students can modify preference weights, view updated rankings, and reset their changes.

The initial ranking and event dataset remain consistent across modes to support
meaningful comparison.

## Implemented Features (Milestone 2)

- A ranked list of all ten events, ordered by score (highest first).
- Each event shows title, category, day, time, fee and description.
- A details view (modal dialog) with the full description, interest tags and a
  score breakdown.
- Selection of a single event, change of selection, and clearing of selection,
  with clear visual feedback (highlighted card + selection banner).
- A prominent notice stating that all events are fictional demonstration data.
- Modular JavaScript: data, ranking logic, UI rendering and app wiring are
  separated across files.
- Automated tests covering ranking scores and deterministic ordering.

## The Ranking Model

The prototype uses a **transparent, rule-based scoring function** — not a
trained AI model. Every component can be read and verified by hand:

```
Interest      = category preference (1–5) × 20             → 0–100
Time          = 100 if the event is in the preferred slot, else 0
Affordability = max(0, 100 − 5 × price in GBP)             → 0–100

Score = 0.5 × Interest + 0.3 × Time + 0.2 × Affordability
```

Equal scores are broken deterministically by ascending **event ID**.

**Demo user preferences:** Technology 5/5, Career 4/5, Community 3/5,
Sports 2/5, Arts 1/5. **Preferred time slot:** Evening (17:00 onwards;
Afternoon is 12:00–16:59, Morning is before 12:00).

With these preferences the resulting order is:

| Rank | Event | Score |
| --- | --- | --- |
| 1 | E01 Coding Workshop | 90 |
| 2 | E04 Interview Skills Clinic | 85 |
| 3 | E09 Community Volunteering Meetup | 80 |
| 4 | E05 Football Social | 70 |
| 5 | E02 AI Ethics Seminar | 60 |
| 6 | E03 Graduate Careers Fair | 60 |
| 7 | E07 Student Music Night | 50 |
| 8 | E10 International Food Exchange | 45 |
| 9 | E06 Campus Yoga | 35 |
| 10 | E08 Photography Walk | 30 |

E02 and E03 both score 60; E02 appears first because the tie-breaker uses the
lower event ID.

## Technical Approach

- **Vite** dev/build tooling, **Vanilla JavaScript** (ES modules), plain
  **HTML** and **CSS**. No framework and no runtime dependencies.
- A small **local JSON-style dataset** of fictional university events
  (`src/data/events.js`).
- The ranking logic is a pure function in `src/ranking.js`, kept separate from
  the DOM so it is directly testable.

### Project structure

```
CampusChoice-AI-Ranking/
├── index.html            # App shell, fictional-data notice, layout
├── package.json          # Scripts and dev dependencies
├── vite.config.js        # Vite dev server + Vitest configuration
├── src/
│   ├── main.js           # Entry point: wires data, ranking and DOM
│   ├── ranking.js        # Pure rule-based scoring and ranking
│   ├── ui.js             # DOM rendering helpers
│   ├── styles.css        # Styling, including selection feedback
│   └── data/
│       ├── events.js     # Ten fictional events
│       └── preferences.js# Demo user preferences
└── tests/
    └── ranking.test.js   # Scoring and ordering tests (Vitest)
```

## Running or Inspecting

Requires Node.js 18+ (developed and verified on Node 24).

```bash
npm install      # install dev dependencies (Vite, Vitest)
npm run dev      # start the dev server → http://localhost:5173/
npm test         # run the test suite once
npm run build    # create a production build in dist/
npm run preview  # serve the production build locally
```

Open the local URL printed by `npm run dev` (default
`http://localhost:5173/`). No API keys, backend or database are required.

## Testing

`npm test` runs the Vitest suite. It checks:

- the dataset contains the ten specified events with the correct facts;
- each scoring component (Interest, Time, Affordability) against the formula;
- the full expected score for every event;
- the exact ranked order and deterministic ID tie-breaking;
- that ranking does not mutate the input.

Current status: **17 tests passing.**

## Project Status

**Implemented:** Basic Ranking prototype (Milestone 2), including the dataset,
ranking logic, ranked list, event details, selection with visual feedback,
tests, and documentation.

**Planned:** Explained Ranking (optional "Why recommended?" explanations),
Adjustable Ranking (editable preference weights with reset), and records of
interactions for evaluation.

**Outside current scope:** Real bookings, student accounts, autonomous agents,
backend services, databases, frameworks (e.g. React) and paid AI APIs.

## Design Basis

The design draws on Weeks 1–4 concepts, particularly inference under
uncertainty, feedback, mental models, cognitive load, user agency, and context
engineering.

## Development Record

- **Initial setup (7 November 2026):** Documented the research goal, proposed
  interaction modes, project scope, and limitations.
- **Milestone 2 (8 November 2026):** Implemented the Basic Ranking prototype —
  fictional event dataset, rule-based scoring/ranking module, browser interface
  (ranked list, details dialog, selection feedback, fictional-data notice),
  Vitest test suite, and run/verification instructions.
- **Milestone 2 manual acceptance testing (8 November 2026):** Passed all four
  manual checks:
  1. All ten events display correctly in ranked order.
  2. Event details open and close correctly.
  3. Event selection provides clear visual feedback.
  4. Selecting a different event correctly replaces the previous selection.
- **Milestone 2 verification (8 November 2026):** `npm test` passed (17 tests)
  and `npm run build` produced a successful production build.

## AI Assistance

ChatGPT assisted with early project planning and the initial README draft.
The Milestone 2 implementation was produced with AI assistance (project
scaffolding, ranking module, UI and tests), then manually reviewed and verified
by running `npm test`, `npm run build`, and the dev server.

The scoring algorithm is a fixed, rule-based formula and is described as such;
it is not presented as a trained AI model.

## Additional Files

The runnable prototype and tests listed under "Project structure" above were
added in Milestone 2.
