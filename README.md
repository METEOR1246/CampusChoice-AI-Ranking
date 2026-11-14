# CampusChoice: Explainable and Controllable Event Ranking

**Status:** Milestone 3 complete — Basic and Explained Ranking, responsive event
cards and ten local event illustrations (14 November 2026).

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
2. **Explained Ranking (implemented):** The same ranking includes an optional "Why recommended?" explanation on each event card.
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

## Explained Ranking (Milestone 3)

Use the **Ranking mode** switch above the list to choose Basic Ranking or
Explained Ranking. Basic Ranking is the default. Both modes retain event
details and selection controls. The interface redesign described below gives
Basic mode a simpler details view, with detailed scoring reserved for Explained.
Both modes share the same dataset, fixed demo
preferences and ranked entries; switching modes changes neither scores nor the
selected event.

In Explained Ranking, each card has a **Why recommended?** button. It reveals
the Interest Match, Time Match and Affordability contributions, the total score,
and a short explanation generated from fixed templates. **Hide explanation**
collapses it. Buttons expose `aria-expanded` and `aria-controls`; toggling
retains keyboard focus. Panels open independently and remain open when selecting
an event. Switching modes resets panels to collapsed.

`scoreEvent` returns raw factors, their weighted contributions and the total.
The total is the sum of those contributions. Explanations use the actual ranked
entry, rather than recalculating a separate score. Coding Workshop contributes
**50 + 30 + 10 = 90**.

**Limitations:** These explanations describe a fixed rule-based formula for
fictional events and a demo user. They do not predict satisfaction or infer
personal interests. Interest tags and descriptions do not affect the score.
The largest contribution identifies the main factor within that event's score;
it does not establish why a user should choose it. The panel also explains
descending score order and the event ID tie-break. No generative AI, trained
model, behavioural inference or adjustable preferences are used.

## Interface redesign and event images

The header and compact fictional-data notice lead into a top control section
with demo preferences and a segmented sliding mode switch. The ranked list
uses the full content width. Cards place a 16:9 image area to the left on
desktop and above the event information on mobile. Purple explanation controls
distinguish Explained mode; Basic hides explanation controls, detailed modal
breakdowns and the footer formula.

Click either segment, use Tab and the arrow keys, or drag/swipe horizontally
to switch modes. The indicator animates between segments; reduced-motion
preferences disable the animation. Scores and selected events remain unchanged.

Ten locally supplied WebP event illustrations are included in
`public/images/events/`. Each event's `image` field maps to one of these
filenames. A neutral CSS placeholder with “Image coming soon” remains visible
until the image loads, or if a file is absent or cannot decode:

```
coding-workshop.webp
ai-ethics-seminar.webp
graduate-careers-fair.webp
interview-skills-clinic.webp
football-social.webp
campus-yoga.webp
student-music-night.webp
photography-walk.webp
community-volunteering-meetup.webp
international-food-exchange.webp
```

To replace an illustration, use the same filename in that directory. A small Vite plugin
discovers available files and refreshes the development page when files are
added or removed. The application displays an image only after it has loaded
successfully; absent files produce no image requests or broken image elements.
For production, rebuild after adding images so the manifest and copied public
assets include them. CSS `aspect-ratio: 16 / 9` and `object-fit: cover` preserve
the layout. Image metadata has no effect on recommendation scoring.

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
│   ├── explanations.js   # Fixed templates using actual score contributions
│   ├── mode-switch.js    # Accessible segmented control with pointer dragging
│   ├── event-images.js   # Show existing images only after successful loading
│   ├── ui.js             # DOM rendering helpers
│   ├── styles.css        # Styling, including selection feedback
│   └── data/
│       ├── events.js     # Ten fictional events
│       └── preferences.js# Demo user preferences
└── tests/
    ├── ranking.test.js   # Scoring and ordering tests (Vitest)
    ├── explanations.test.js # Contributions and explanation accuracy
    └── interactions.test.js # Mode, disclosure, details and selection tests
```

`public/images/events/` contains all ten event illustrations and a directory marker;
`vite.config.js` supplies the available-image manifest.

## Running or Inspecting

Requires Node.js 22.13+ or 24+ (verified on Node 24).

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
- identical rankings and scores across both modes;
- all ten weighted contributions, their sums and accurate explanations;
- accessible expand/collapse controls, independent panels and retained focus;
- event details, selection replacement/clearing and selection retention on mode changes.

Current status: **38 tests passing in 3 files** (14 November 2026).
Interaction tests run in jsdom, a development-only dependency; ranking and
explanation tests use Node. The jsdom suite tests the actual app entry point
with the real HTML shell, using dialog method stubs to check wiring and content.
Native modal and keyboard behaviour is also checked in the local browser.
Run `npm install` after updating dependencies; testing commands are unchanged.
The original 32 tests remain, with six additional interaction checks for drag
switching/cancellation, Basic-mode details, ten reserved image paths,
successful future image loading and decode-failure fallback.

## Project Status

**Implemented:** Basic Ranking (Milestone 2) and Explained Ranking (Milestone 3),
including optional explanations from shared score contributions, mode switching,
event details, selection feedback, responsive event cards, ten local event
illustrations, regression tests and documentation.

**Planned:** Adjustable Ranking (editable preference weights with reset), and records of
interactions for evaluation.

**Outside current scope:** Real bookings, student accounts, autonomous agents,
backend services, databases, frameworks (e.g. React) and paid AI APIs.

## Design Basis

The design draws on Weeks 1–4 concepts, particularly inference under
uncertainty, feedback, mental models, cognitive load, user agency, and context
engineering.

Milestone 3 builds on A1's explainability and decision-making question. Showing
the actual weighted factors supports **mental models** of recommendation
production. Optional panels provide **progressive disclosure** to reduce
cognitive load. Button labels, expanded-state indicators and visible panels
provide **feedback**. Keeping the choice with the user supports **Human-Centred
AI** and informed decisions. These are design intentions; no new user evaluation
or evidence of improved decision-making is claimed.

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
- **Milestone 3 (14 November 2026):** Added Basic/Explained mode switching and
  optional per-event explanations using shared weighted score contributions.
  Preserved scores, ordering, event details and selection across modes.
- **Milestone 3 verification (14 November 2026):** `npm test` passed all 32
  tests in 3 files; `npm run build` succeeded. A test fixture URL-loading error
  was corrected using Vite's raw HTML import before the successful complete run.
  Local browser checks confirmed Coding Workshop's 50/30/10 contributions,
  selection and ranking retention when returning to Basic, and native details
  opening and closing. `npm audit` reported zero vulnerabilities.
  At this stage Milestone 3 awaited the user's manual acceptance review.
- **Interface redesign (14 November 2026):** Replaced the sidebar with top
  controls and full-width responsive event cards; added a sliding mode switch
  supporting native keyboard controls, mouse dragging and touch swiping.
  Prepared ten CSS image placeholders and local image paths; no actual images
  were created. Basic details hide scoring breakdowns; Explained retains them.
- **Redesign verification (14 November 2026):** All 38 tests passed and the
  production build succeeded. Headless Microsoft Edge checks at 1440px, 390px
  and 320px confirmed horizontal/stacked cards, ten 16:9 areas, no horizontal
  overflow, keyboard switching, mouse dragging/touch swiping, unchanged selection
  and scores, explanations, and modal behavior. There were zero event-image
  requests and zero page errors. At this stage the redesign was uncommitted
  for manual review.
- **Event visuals and release preparation (14 November 2026):** Added the ten
  locally supplied WebP illustrations using the existing event image paths.
  Updated the development record and AI image-use disclosure; preserved the
  earlier milestone history. The user authorised a commit titled
  `feat: complete explained ranking and event visuals` and a push to the
  existing repository's `main` branch.
- **Release verification (14 November 2026):** Reran `npm test` (38 tests passed
  in 3 files) and `npm run build` (successful with local event images included).
  The production preview loaded and decoded all ten illustrations successfully.
  Switching modes retained the selected event and scores; no page errors occurred.
  Dependencies and generated build output remain excluded from Git.

## AI Assistance

ChatGPT assisted with early project planning and the initial README draft.
The Milestone 2 implementation was produced with AI assistance (project
scaffolding, ranking module, UI and tests), then manually reviewed and verified
by running `npm test`, `npm run build`, and the dev server.

For Milestone 3, the coding assistant helped implement the scoring contributions,
fixed explanation templates, mode/disclosure controls, automated regression
tests and documentation. Verification results above are from actual tool runs.
AI assistance during development does not involve an AI API at runtime or
generate reasons for recommendations.
The assistant also implemented the interface redesign, CSS placeholders and
image-loading preparation, and ran the automated and browser checks recorded
above. Temporary browser tooling and screenshots were kept outside the source
tree; no event illustrations were generated.

The scoring algorithm is a fixed, rule-based formula and is described as such;
it is not presented as a trained AI model.

## AI Image Use

The ten local event illustrations are demonstration visuals for fictional
events. They are not evidence or photographs of real University of Birmingham
activities, attendees or venues, and do not imply university endorsement.

AI image creation is separate from the recommendation system. Images do not
affect interest, time, affordability, scores, tie-breaking or explanations.
The application serves the supplied WebP files locally; it calls no image
generator or paid AI API at runtime. Explanations still come from the shared
rule-based scoring function and fixed text templates.

The repository contains the supplied image files but no original generation
prompts or generator records, so it does not attribute them to a specific AI
tool. Earlier “no images generated” records describe the placeholder-only
development stage; the coding assistant did not generate these supplied
illustrations during implementation.

## Additional Files

The runnable prototype and tests listed under "Project structure" above were
added in Milestone 2.
Milestone 3 adds `src/explanations.js`, explanation tests and DOM interaction tests.
