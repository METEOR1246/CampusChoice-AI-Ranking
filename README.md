# CampusChoice: Explainable and Controllable Event Ranking

**Status:** Milestone 5 implemented — optional decision tasks, decision summaries
and perceived-control feedback alongside the three existing ranking modes
(16 November 2026).
M4 and M5 release verified: 95 automated tests pass and the production build succeeds.
Earlier development records below preserve the review status at each stage.

## Overview

CampusChoice is an interactive prototype for the University of Birmingham's
Intelligent Interactive Systems Assignment 2.

It builds on Assignment 1's research question: **How does AI-generated ranking
influence users' decision-making and perceived control?**

The project explores how university students interact with ranked event
recommendations, and whether explanations and preference controls change their
understanding and choices.

## Interaction Modes

1. **Basic Ranking (implemented):** Students browse and select from a ranked event list.
2. **Explained Ranking (implemented):** The same ranking includes an optional "Why recommended?" explanation on each event card.
3. **Adjustable Ranking (implemented):** Students select eight consolidated interest topics,
   immediately re-rank all ten events, remove tags or reset to the original ranking.

The initial ranking and event dataset remain consistent across modes to support
meaningful comparison.

## Decision Tasks and Interaction Evaluation (Milestone 5)

**Interaction problem:** University students may rely on automatically ranked
recommendations without understanding why particular events appear first or how
to adjust recommendations when their priorities change. CampusChoice explores
how optional explanations and explicit preference controls can support informed
choices and perceived control. The system ranks; the student makes the decision.

Expand **Try a decision scenario** near the ranking controls. Tasks are optional;
normal browsing, event details and selection work without starting one.
The same ten fictional events, images and scoring calculations serve both tasks
and all three modes. Neither task chooses an answer or activates interest topics.

- **Everyday Choice:** “You have some free time next week and want to attend a
  university event. Explore the recommendations and choose an event that interests you.”
- **Changing Priorities:** “Your priorities have changed. You now prefer activities
  that help you meet people and get involved in the community rather than technology
  or career events. Explore the recommendations and choose an event that suits your
  new interests.”

To demonstrate **Everyday Choice**, expand the section, click **Start Everyday
Choice**, browse in Basic or another mode, optionally inspect details/explanations,
and select any event. **Your decision** displays the task, selected event ID/name,
mode at selection, baseline position, position at selection and whether any
recommendation explanation has been opened during the task.

To demonstrate **Changing Priorities**, click **Start Changing Priorities**, read
the visible scenario and explore in any mode. If desired, choose Adjustable
Ranking and intentionally select interests such as Volunteering or Food & Culture.
Observe the recalculated list, then select whichever event suits your priorities.
The summary includes the topics actually active at choice time. There is no
correct answer, required topic or required explanation.

After selection, optionally answer **“I felt in control of my final choice.”**
using native radios: **1 — Strongly disagree**, **2 — Disagree**,
**3 — Neither agree nor disagree**, **4 — Agree**, **5 — Strongly agree**.
Nothing is preselected. The selected radio and confirmation show the recorded
value; users can change it or leave it unanswered. Choosing another event,
toggling the choice off or clearing selection removes outdated feedback.

**Restart task**, or starting either scenario again, clears the selection, topic
adjustments, expanded explanations, decision record, explanation tracking and
feedback, and restores every original score and position. The current mode stays
active. Mode switches retain task, selection, interests and feedback; Basic and
Explained continue to use the baseline. Adding/removing a topic, or **Reset
preferences** when topics are active, clears any existing event choice, decision
summary and control rating. Updated topics and the active task stay intact.
The live status explains: **“Your preferences have changed and the ranking has
been updated. Please choose an event again.”** All cards become unselected;
users then make a fresh choice using the updated ranking. Resetting already empty
preferences does not invalidate a choice. Without an existing choice, preferences
simply update the ranking. **Return to normal browsing** clears task tracking and feedback while
retaining the current event choice and interests.

### State and development decisions

`src/decision-tasks.js` defines scenarios, rating labels and a choice-snapshot
helper. `src/main.js` keeps the immutable baseline and baseline rank map separate
from temporary topic IDs, active task, decision snapshot, explanation-use flag and
feedback value. No local/session storage, database, account, external analytics
or backend is used. Refreshing clears everything temporary; no names, email
addresses or other personal information are collected.

The snapshot reads the event and rank directly from the active ranked entries
and reads original position from `baselineRanks`. It copies topic IDs only for an
Adjustable choice. Later mode changes leave those choice-time facts intact,
explicitly labelled **at selection**, while cards and the existing banner reflect
current browsing. The shared preference-update function compares effective topic
sets before updating. A real preference change invalidates an existing choice and
its rating, whether made in the main picker or event details; a no-op does not.
Selecting an event again captures the latest rank and active topics with no
preselected rating. Explanation use is cumulative within the task, including
opening another event's card explanation or the actual Explained-mode details
breakdown, before or after selection. Basic/Adjustable details do not count.
This records opening, not whether someone read or understood the explanation.

The task chooser uses native `details` disclosure and buttons; active context
remains visible when the chooser is collapsed. The summary sits above the event
cards after selection. Feedback uses labelled native radios, visible focus and a
live confirmation. No new ranking algorithm, mode, event or page was introduced.

The course principles guide design intentions:

- **Week 1 — Human-Centred Intelligent Interaction:** Automatic ranking supports
  browsing while the user retains the final choice.
- **Week 2 — Perception, Attention and Feedback:** Selection highlights, ranking
  status, reset confirmation and feedback confirmation expose consequences.
- **Week 2 — Mental Models and Cognitive Load:** Visible task, mode, interests and
  choice-time ranks clarify state; optional disclosure and one question limit steps.
- **Week 2 — Action, Agency and Decision:** Users may choose, reconsider, change
  modes, adjust interests, restart or browse without a task.
- **Week 4 — Context Engineering and Memory:** Baseline profile, temporary
  adjustments, task context and feedback are separate; no automatic learning is implied.

### Storyboard sequences for A2

These are illustrative interaction sequences to capture later, not observations
from a user study:

1. **Everyday exploration:** Start Everyday Choice in Basic, browse and open an
   event's details, select an event, inspect the decision summary and optionally
   give a control rating. Frames show the system ranking and the student's choice.
2. **Understanding a recommendation:** Start Everyday Choice, switch to Explained,
   open “Why recommended?” for an event, compare its factors with another event,
   then choose. Frames show explanation disclosure and the actual choice record.
3. **Changed priorities:** Start Changing Priorities, switch to Adjustable,
   deliberately select Volunteering and Food & Culture, compare shifted ranks,
   choose an event and rate control. Choose a different event to demonstrate the
   updated summary and cleared rating, then restart to show baseline restoration.

**Evaluation limitations:** This is a lightweight demonstration mechanism, not a
completed scientific user study. A single optional self-report cannot establish
effectiveness, causality or generalisable results. There is no participant
recruitment, counterbalancing, task-success score, click/timing log, export,
persistence or aggregate analysis. Restart/refresh loses records. Fictional events
and a fixed demo profile limit realism. No user-test outcomes or academic
references have been invented; improved decision-making has not been proven.

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
personal interests. Interest tags and descriptions do not affect scores in Basic
or Explained mode; selected tags affect only Adjustable mode.
The largest contribution identifies the main factor within that event's score;
it does not establish why a user should choose it. The panel also explains
descending score order and the event ID tie-break. No generative AI, trained
model or behavioural inference is used. Explained mode always uses the original
demo preferences, independently of temporary Adjustable interests.

## Adjustable Ranking (Milestone 4)

Choose **Adjustable Ranking** and select topics in **Your interest tags**.
Exactly eight canonical topics replace the earlier 36 raw-tag controls. Compact
chips wrap naturally without a nested scroll area. Each is a native button with
selected/unselected styling, `aria-pressed` and visible keyboard focus. Click,
Enter or Space toggles it; multiple topics can be selected. A short count appears
beside Reset preferences, which clears all choices.

`src/data/interest-topics.js` is the single source for topic labels, stable IDs
and explicit event-ID assignments. There is no substring or raw-tag matching:

| Topic | Event IDs |
| --- | --- |
| Technology & AI | E01 Coding Workshop, E02 AI Ethics Seminar |
| Career Development | E03 Graduate Careers Fair, E04 Interview Skills Clinic |
| Sports | E05 Football Social |
| Wellbeing | E06 Campus Yoga |
| Music | E07 Student Music Night |
| Photography | E08 Photography Walk |
| Volunteering | E09 Community Volunteering Meetup |
| Food & Culture | E10 International Food Exchange |

Each **View details** contains its event's canonical topic button, sharing the
main picker's state. Descriptive tags such as `beginners`, `social` and `team`
remain intact as non-interactive metadata. Main choices appear selected in
details, and detail toggles immediately update the main picker. Closing details
or switching modes does not create a separate preference state.

Every change recalculates scores immediately. All ten events stay visible:
this is re-ranking, not filtering. A live status reports the update, and cards
show topic-match feedback and movement **relative to the original ranking**.
The open details view updates its score/rank without closing or losing topic focus.
Closing it returns focus to the event's current details button after re-ordering.
Under the Milestone 5 refinement, changed interests clear an existing selection
and ask the user to choose again. Opening/closing details, opening explanations
and switching modes alone preserve the selection.

```
No selected topics:
  Interest = OriginalInterest       (exact baseline, without adjustment)

With selected topics:
  TopicMatch = 100 if the event's assigned topic is selected, otherwise 0
  AdjustedInterest = 0.3 × OriginalInterest + 0.7 × TopicMatch
  Score = 0.5 × AdjustedInterest + 0.3 × Time + 0.2 × Affordability
```

Time, Affordability, outer weights and ascending Event ID tie-breaking are
unchanged. Selecting multiple topics supports every corresponding event without
stacking extra points. For example, selecting **Sports** gives Football Social
AdjustedInterest **82** (= 0.3 × 40 + 0.7 × 100) and score **91**. Campus Yoga
is matched separately by **Wellbeing**, which gives it score **56**. Selecting
both topics supports both events.
Coding Workshop does not match: its adjusted interest becomes **30** and score
**55**. A matching event already at Interest 100 stays at 100, so matching does
not guarantee a score increase or first place.

`TAG_MATCH_COEFFICIENT` in `src/ranking.js` configures the topic influence; its
default is **0.7**, with original-interest influence `1 − coefficient`.
`scoreEvent` and `rankEvents` also accept a coefficient argument for testing
or configuration (0–1). The implementation uses the equivalent interpolation
`OriginalInterest + coefficient × (TopicMatch − OriginalInterest)`.
The export name is retained from the original tag-based implementation.
This is an **initial design choice, not an empirically validated parameter**.

Temporary topic choices are held separately from `DEMO_USER` in memory. Basic and
Explained always show the exact baseline and informational tags. Returning to
Adjustable resumes the temporary interests; Reset clears them and restores every
original score and rank. Refreshing the page clears session choices.

**Limitations:** Binary topic matching ignores strength and nuance. Nonmatching
events lose much of their original interest contribution while any topic is
selected. Each event has exactly one assigned topic; users cannot enter new
ones. Movement compares against baseline rather than
the immediately preceding update. No preference persistence, trained model,
behavioural inference or user evaluation has been introduced.

## Interface redesign and event images

The header and compact fictional-data notice lead into a top control section
with demo preferences and a segmented sliding mode switch. The ranked list
uses the full content width. Cards place a 16:9 image area to the left on
desktop and above the event information on mobile. Purple explanation controls
distinguish Explained mode; Basic hides explanation controls, detailed modal
breakdowns and the footer formula.

Click any of the three segments, use Tab and the arrow keys, or drag/swipe horizontally
to switch modes. The indicator animates between segments; reduced-motion
preferences disable the animation. Event selection is retained; Basic and
Explained keep original scores, while Adjustable applies its temporary tags.

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
│   ├── decision-tasks.js # Scenarios, labels and actual choice snapshots
│   ├── mode-switch.js    # Accessible segmented control with pointer dragging
│   ├── event-images.js   # Show existing images only after successful loading
│   ├── ui.js             # DOM rendering helpers
│   ├── styles.css        # Styling, including selection feedback
│   └── data/
│       ├── events.js     # Ten fictional events
│       ├── interest-topics.js # Eight canonical topics and explicit event mapping
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
- identical baseline rankings and scores across all three modes without topics;
- all ten weighted contributions, their sums and accurate explanations;
- accessible expand/collapse controls, independent panels and retained focus;
- event details, selection replacement/clearing and selection retention on mode changes.
- the default coefficient, configurable influence and binary topic matching;
- exact canonical labels and ID/title mapping for all ten dataset events;
- correct adjusted scores and contributions for every topic and multiple choices;
- all ten events retained, adjusted tie-breaking and no demo-context mutation;
- removal and Reset restoring the exact original ranking;
- Basic/Explained independence and selection retained through mode switching;
- changed preferences clearing selection, decision and feedback while keeping
  updated topics/task; no-op preference reset retaining the existing choice;
- mouse topic toggles, native keyboard button semantics, pressed states and focus;
- third-segment dragging and modal focus return after card replacement.

Current status: **95 tests passing in 3 files** (16 November 2026):
33 ranking, 5 explanation and 57 interaction checks. Milestone 5 adds 19
interaction checks for both tasks across all modes, unchanged data/profile,
accurate baseline/adjusted ranks, topic snapshots, actual explanation openings,
all five ratings/no default, choice replacement, reset and normal browsing.
The preference-change refinement adds 7 checks and updates prior retention
expectations: adding/removing/resetting topics invalidates an existing decision,
updated interests and task remain active, empty Reset is a no-op, main/detail
changes share the rule, and a new choice records the actual updated rank/topics.
Interaction tests run in jsdom, a development-only dependency; ranking and
explanation tests use Node. The jsdom suite tests the actual app entry point
with the real HTML shell, using dialog method stubs to check wiring and content.
Native modal and keyboard behaviour is also checked in the local browser.
Run `npm install` after updating dependencies; testing commands are unchanged.
The original 32 tests remain, with six earlier interaction checks for drag
switching/cancellation, Basic-mode details, ten reserved image paths,
successful future image loading and decode-failure fallback. Milestone 4 adds
16 checks for adjustable scoring, preferences and accessibility; the existing
drag fixture now targets the middle segment of the three-way switch.
Native Edge checks at 1440px, 390px and 320px additionally verify actual Enter/
Space activation, keyboard removal/Reset, radio arrow keys, mouse dragging,
touch swiping, modal focus return, no horizontal overflow, all ten decoded
16:9 images and zero page errors. Browser tooling is separate from the Vitest
suite; jsdom does not simulate native keyboard activation or modal focus.
The original raw-tag adjustment checks have been updated to canonical topics.
The suite verifies all eight topic scores, multiple selections and removal,
exact reset, main/detail synchronization, preserved descriptive metadata,
baseline mode independence and matching that ignores raw tags or titles.

## Project Status

**Implemented:** Basic Ranking (Milestone 2), Explained Ranking (Milestone 3)
and tag-based Adjustable Ranking (Milestone 4), optional decision tasks,
choice summaries and temporary perceived-control feedback (Milestone 5),
including optional explanations from shared score contributions, mode switching,
event details, selection feedback, responsive event cards, ten local event
illustrations, regression tests and documentation.

**Evaluation:** Temporary per-task choice records and optional feedback only;
no scientific user study or automated conclusions.

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

Milestone 4 applies Weeks 1–4 concepts as design intentions:

- **Human-Centred Interaction:** Users choose their interests and make their
  final event choice; changed preferences now prompt an intentional fresh choice.
- **Mental Models:** Visible selected tags, match feedback and movement help
  explain the influence of temporary preferences.
- **Cognitive Load:** Familiar interest labels avoid requiring users to
  understand numerical weights; all interest labels are directly available in
  a compact main-page picker and remain accessible in event details.
- **Feedback:** Each change immediately updates ranking scores, positions,
  visible status and the open details view.
- **Agency and Error Recovery:** Tags toggle on/off, compact choices can be
  removed and Reset restores the exact baseline. The Milestone 5 refinement
  clears existing selection when interests change, keeping the final choice with the user.
- **Context Engineering:** The immutable demo context remains separate from
  temporary tag choices; displayed scores and ranks reflect the active mode.

These decisions have not been validated through user evaluation.

## Development Record

- **M4/M5 release verification (16 November 2026):** Reviewed all uncommitted
  changes against the previously pushed M3 commit. The release includes the
  third ranking mode, eight shared interest topics, actual re-ranking and
  movement feedback, both decision tasks, actual choice tracking, optional
  control ratings and preference-change selection invalidation. Reran `npm test`:
  **95 tests passed in 3 files** (33 ranking, 5 explanation, 57 interaction).
  Reran `npm run build`: successful, with 15 modules transformed. Existing
  Basic/Explained baselines, event details, selection and all ten events remain
  covered by regression tests. The user authorised commit and push to existing
  `main`. M4/M5 changes share application, UI, documentation and test hunks, so
  one combined commit preserves the verified final implementation. Dependencies,
  build output, temporary screenshots and unrelated files are excluded.

- **M5 preference-change refinement (16 November 2026):** Changed only preference
  update/selection handling, affected interaction tests and documentation.
  Effective topic changes now clear an existing event selection, decision summary
  and rating, retain updated topics and task-wide explanation tracking, and show
  the requested live message asking for a fresh choice. Empty preference reset,
  details/explanation disclosure and mode switching do not invalidate selection.
  Kept interface styling and all event images unchanged. `npm test` passed
  **95 tests in 3 files** (33 ranking, 5 explanation, 57 interaction);
  `npm run build` succeeded. Production Edge checks at 1440px and 390px passed
  add/remove/reset, keyboard detail-topic changes, selection retention on modal
  disclosure and mode comparison, fresh decision/rating state, ten decoded
  images, no horizontal overflow and zero page errors. AI assisted implementation,
  tests and documentation. No commit or push was performed; manual review is pending.

- **Milestone 5 (16 November 2026):** Added two optional guided scenarios,
  explicit start/restart, visible task context, actual choice-time snapshots,
  task-wide explanation-use tracking and optional five-point control feedback.
  Kept the dataset, event images, scoring algorithm, three modes, eight topics,
  details and original selection interaction. Mode/topic comparisons preserve
  the choice snapshot; changed selections clear feedback. Normal browsing needs
  no task. No commit or push was performed.
- **Milestone 5 verification (16 November 2026):** `npm test` passed **88 tests
  in 3 files** (33 ranking, 5 explanation, 50 interaction).
  `npm run build` succeeded (15 modules transformed). Production preview at
  `http://localhost:4173/` passed native Edge sequences at 1440px, 390px and 320px:
  keyboard scenario activation, radio Space/arrow changes, explanation tracking,
  mode/feedback retention, intentional topic adjustment, baseline/current ranks,
  replacement feedback clearing, restart and return to browsing. All ten local
  image elements loaded successfully; no horizontal overflow or page errors.
  Desktop/mobile screenshots were inspected. These are implementation checks,
  not participant evaluation or evidence of design effectiveness.

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
- **Milestone 4 (15 November 2026):** Implemented the third mode with actual
  dataset tag toggles, temporary interest summary, removal and Reset; used
  configurable binary tag influence inside the existing weighted score.
  Preserved all events, images, baseline explanations, deterministic ties
  and final selection. Added visible/live feedback and baseline movement.
- **Milestone 4 verification (15 November 2026):** `npm test` passed all 54
  tests in 3 files and `npm run build` succeeded. Native Edge checks at 1440px,
  390px and 320px passed keyboard, mouse/touch, mode independence, selection,
  details focus, layout and all-ten-image checks with zero page errors.
  Narrow demo-profile labels were adjusted after visual review. An initial
  browser-script failure was fixed by waiting for the native asynchronous dialog
  close/focus event before sending the next key; the subsequent run passed.
  No commit or push was performed; manual review remains outstanding.
- **Milestone 4 main-page tag refinement (15 November 2026):** Made all unique
  dataset tags directly selectable as wrapping chips, with a bounded scroll
  area, selected-count summary and shared state with event details. Preserved
  the scoring formula, all ten events, images, event selection and mode
  independence. Updated tests and instructions with AI coding assistance.
  `npm test` passed 57 tests in 3 files and `npm run build` succeeded.
  Production Edge checks at 1440px, 390px and 320px verified all 36 tags,
  keyboard toggles, focus/scroll retention, synchronization, Reset, original
  Basic/Explained scores and ten decoded images, with no horizontal overflow
  or page errors. The picker measured 170px on desktop and 184px on mobile.
  No commit or push was performed; the interface awaits manual review.
- **Milestone 4 topic consolidation (16 November 2026):** Replaced redundant
  raw-tag controls with eight canonical topics and explicit event-ID assignments
  in `src/data/interest-topics.js`, verified against all ten dataset titles.
  Preserved the 0.7 adjustment coefficient, outer weights, deterministic ties,
  event data/images, selection and Basic/Explained baselines. Detail controls
  share canonical topic state; raw tags remain descriptive metadata.
  Removed the nested picker scroll area and lengthy helper text.
  AI assisted implementation, tests and documentation. `npm test` passed
  69 tests in 3 files and `npm run build` succeeded. Production Edge checks
  at 1440px, 390px and 320px passed eight-topic visibility, keyboard toggles,
  multiple selections, synchronization, reset, baseline modes and all ten
  decoded images, with no chip overlap, horizontal overflow or page errors.
  No commit or push was performed; manual review remains pending.

## AI Assistance

For Milestone 5, the coding assistant implemented task context, choice snapshots,
the optional feedback controls, regression tests and this documentation, including
suggested storyboard sequences. The reported automated results come from actual
executions. The sequences are proposed demonstrations; they are not fabricated
participant behaviour or user-test results. The user subsequently authorised the
combined M4/M5 release; earlier records describe the prior uncommitted stages.

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

For Milestone 4, the coding assistant implemented tag scoring, UI state and
feedback, extended regression tests, reviewed responsive screenshots and updated
documentation. Test, build and browser results above are actual executions.
The 0.7 coefficient was specified by the milestone brief; it was not learned
from data. No new images were generated or event scenarios added, and no
AI service participates in runtime ranking. Release verification checks software
behaviour and does not establish effectiveness through participant evaluation.

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
