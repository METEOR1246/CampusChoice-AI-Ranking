# CampusChoice: Explainable and Controllable Event Ranking

**README prose word count:** 1,727

CampusChoice is a browser prototype for the University of Birmingham's Intelligent Interactive Systems A2. It builds on A1's question: **How does AI-generated ranking influence users' decision-making and perceived control?** This prototype explores that question using transparent rules, optional explanations and explicit preference controls.

## Project status

- **Implemented:** M2 Basic Ranking; M3 Explained Ranking; M4 tag-based Adjustable Ranking; M5 decision scenarios, choice summaries and optional control ratings; the Interest Discovery suggestion dialog; responsive event cards and ten AI-generated event illustrations.
- **Final enhancement release:** This revision on `main` includes the Interest Discovery modal, three event-pair rules, suppression and fresh-evidence re-inference after deselection, the diagonal light-blue-to-white background, related tests and updated documentation. It builds on the M4/M5 release [6a090f4](https://github.com/METEOR1246/CampusChoice-AI-Ranking/commit/6a090f48b4975c3c6febcb5772efc92d275f5b07). The project owner authorised this release; its commit is identifiable in Git history by `feat: finalise interest discovery and project documentation`.
- **Simulated:** All ten events, their prices and schedules, and the fixed student preference profile are demonstration data. Recommendations and tentative interest suggestions are calculated locally; no real university service is connected.
- **Submission materials:** The final A2 report and three screenshot-based storyboards have been completed and reviewed. The report is prepared for separate submission, while the source code and development evidence are available in this repository.
- **Outside scope:** Bookings, accounts, backend services, persistent profiling, analytics/export and a trained recommendation model. No user study or evidence of improved decision-making is claimed.

Temporary interests, selections, inference history and ratings live in memory and disappear on refresh.

## Technology and setup

| Tool | Purpose |
| --- | --- |
| HTML, CSS, vanilla JavaScript ES modules | Accessible controls, responsive presentation, ranking and interaction state; no frontend framework |
| Node.js and npm | Development environment, dependencies and scripts |
| Vite | Local server, production bundling and available-image manifest |
| Vitest | Automated scoring, explanation, inference and interaction checks |
| jsdom | DOM environment for interaction tests; native dialog methods are stubbed |
| Git | Version history and milestone evidence |

Use **Node.js 24** (verified with v24.14.0). In the repository directory:

```bash
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173/`. No API keys, database or backend are required.

```bash
npm test
npm run build
npm run preview
```

The build writes `dist/`; preview serves that build, normally at `http://localhost:4173/`. Stop a server with Ctrl+C.

## Features and reproducible demonstrations

### Basic Ranking (Milestone 2)

Refresh to start in Basic Ranking. Inspect all ten events, including title, category, time, fee and description. Coding Workshop is first with score 90; Interview Skills Clinic is second with 85.

Open **View details**, close the dialog, then **Select event**. Check the card highlight and selection banner. Select another event to replace the choice, then clear it. The fictional-data notice remains visible. Detailed scoring is now reserved for Explained mode.

### Explained Ranking (Milestone 3)

Switch to **Explained Ranking** and open **Why recommended?** on Coding Workshop. Its contributions are 50 Interest, 30 Time and 10 Affordability, totalling 90. Collapse the explanation or inspect another independently. Switching between Basic and Explained preserves baseline scores and event selection; mode changes collapse explanations.

### Adjustable Ranking (Milestone 4)

Switch to **Adjustable Ranking**. The eight topics are Technology & AI, Career Development, Sports, Wellbeing, Music, Photography, Volunteering, and Food & Culture.

Select **Sports**: Football Social scores 91 and moves to first. All ten events remain visible; this reorders rather than filters. Topic buttons in event details share the main controls' state. **Reset preferences** restores the original scores and order. Basic and Explained always use the baseline; returning to Adjustable resumes temporary topics.

### Decision tasks (Milestone 5)

Expand **Try a decision scenario** and start **Everyday Choice**. Browse, optionally inspect explanations, select an event and inspect **Your decision**. It records the task, event, mode, baseline and choice-time positions, active Adjustable topics, and whether an explanation was opened.

Optionally answer **“I felt in control of my final choice.”** from 1 (Strongly disagree) to 5 (Strongly agree); nothing is preselected.

Start **Changing Priorities**, switch to Adjustable, choose Volunteering or Food & Culture, and select an event. Change an interest after rating: the selection, summary and rating clear, while the task and updated interests remain. Choose again to record the new ranking state. **Restart task** restores baseline preferences and clears task records and inference history, retaining the mode. There is no prescribed correct choice.

### Interest Discovery

1. Refresh, then switch to **Adjustable Ranking** with no topics selected.
2. Open Coding Workshop (E01) details and close them.
3. Open AI Ethics Seminar (E02) details and close them.
4. Observe **We noticed a possible interest**, naming both events and Technology & AI. The suggestion appears after details close.
5. Choose **Add interest**: the topic becomes selected, AI Ethics Seminar moves from fifth to second, and any existing decision/rating clears.
6. Reset preferences to restore the baseline.

For dismissal, refresh and repeat steps 1–4, then choose **Not now** or Escape. Reopening the pair does not repeat the dismissed suggestion until task start/restart or refresh.

| Required distinct details views | Suggested topics |
| --- | --- |
| E01 Coding Workshop + E02 AI Ethics Seminar | Technology & AI |
| E03 Graduate Careers Fair + E04 Interview Skills Clinic | Career Development |
| E05 Football Social + E06 Campus Yoga | Sports and Wellbeing, accepted together |

Only these three pairs qualify. Repeated views of one event, event selection, and Basic/Explained browsing provide no qualifying evidence. A rule is suppressed while any proposed topic is selected; after removal it needs two fresh views. Accepted interests can be suggested again after removal and fresh evidence; dismissals persist until task/session reset. Preferences never change without acceptance.

### Storyboard sequences for A2

Suggested frames to capture manually:

- **Everyday exploration:** Basic list → details → selection → decision summary and optional rating.
- **Understanding ranking:** Explained list → weighted explanation → comparison → informed event choice.
- **Changing priorities:** scenario → topic selection → changed ranks → choice → preference change clears decision → fresh choice or restart.

These are reproducible demonstration plans, not participant observations or completed storyboard assets.

## Scoring, inference and limitations

The fixed profile rates Technology 5/5, Career 4/5, Community 3/5, Sports 2/5 and Arts 1/5, preferring Evening (17:00 onwards).

```text
OriginalInterest = category preference × 20
Time = 100 for the preferred time slot, otherwise 0
Affordability = max(0, 100 − 5 × price in GBP)
BaselineScore = 0.5 × OriginalInterest + 0.3 × Time + 0.2 × Affordability

With selected topics in Adjustable mode:
TagMatch = 100 if the event's assigned topic is selected, otherwise 0
AdjustedInterest = 0.3 × OriginalInterest + 0.7 × TagMatch
Score = 0.5 × AdjustedInterest + 0.3 × Time + 0.2 × Affordability
```

Empty topic choices bypass adjustment. Ties use ascending event ID. The topic coefficient is configurable as `TAG_MATCH_COEFFICIENT` in `src/ranking.js`, defaulting to 0.7. Each event has one assigned canonical topic; descriptive tags do not determine matching.

Explanations use actual score contributions and fixed text templates. Interest Discovery uses distinct event IDs and predefined pairs. **Neither recommendation nor interest inference uses generative AI or a trained model at runtime.**

Weights, binary topic matching and pair associations are design assumptions, not learned or empirically validated predictions. Browsing may indicate curiosity rather than interest. The optional rating is a temporary self-report, not a scientific evaluation; there is no participant dataset or aggregate analysis.

## Design basis

The design applies human-centred interaction principles: explanations expose the ranking's mental model; optional disclosure limits cognitive load; selected topics, movement indicators and live messages provide feedback. Explicit confirmation, removal and reset support agency and error recovery. Separating the baseline from temporary interests and choice-time records clarifies context. These are design intentions, not demonstrated improvements.

## Development record

Commit dates below come from local Git history in **UTC**. Historical verification is reported from the README stored in each commit; those old versions were not rerun during this review.

| Stage/date | Significant change and reason | Verification/evidence |
| --- | --- | --- |
| M2, 8 November 2026 | Added fictional dataset, deterministic ranking, details and selection to make the initial prototype inspectable | Recorded 17 passing tests and successful build; [baa625b](https://github.com/METEOR1246/CampusChoice-AI-Ranking/commit/baa625b6ec787b13feb8870af536e69b2132200d) |
| M3, 14 November 2026 | Added optional score explanations, responsive cards, mode switch and ten illustrations to support understanding and browsing | Recorded 38 passing tests and successful build; [f72494f](https://github.com/METEOR1246/CampusChoice-AI-Ranking/commit/f72494fe50778ebd0175cec89d02a221b45bec0d) |
| M4/M5, 15 November 2026 | Added eight-topic adjustment, scenarios, decision records and feedback; preference changes invalidate outdated choices | Recorded 95 passing tests and successful build; combined commit [6a090f4](https://github.com/METEOR1246/CampusChoice-AI-Ranking/commit/6a090f48b4975c3c6febcb5772efc92d275f5b07) |
| Final enhancement release, 17 November 2026 | Added the confirmation modal, three explicit pairs, suppression and re-inference after fresh views; refined the diagonal blue-white background and inspection guide | Release tests/build below; this revision is recorded as `feat: finalise interest discovery and project documentation` |

The old M4/M5 prose used 16 November, later than its actual commit timestamp; the table uses Git's date. No separate M4 or M5 commit exists in the inspected history.

### Release verification

**Executed 17 November 2026 at 23:17 UTC**, using the local runner's timestamp:

- `npm test`: **140 passed in four files** — 33 ranking, 5 explanation, 22 inference and 80 interaction tests.
- `npm run build`: **passed**, transforming 16 modules.

Coverage includes baseline/adjusted scores, deterministic ordering, disclosure, task records, preference-change invalidation, discovery eligibility, suppression, acceptance and reset. jsdom checks do not establish native browser accessibility or user-study outcomes.

Manual review of the final interface and key interaction flows has been completed. Desktop (1440px) and mobile (390px/320px) layouts were checked without horizontal overflow. The review covered the three ranking modes, preference adjustments, Interest Discovery suggestions and user feedback. These checks verify the prototype's intended behaviour but do not constitute a formal accessibility evaluation or user study.

## AI assistance

ChatGPT and TRAE assisted with project planning, refining system interactions, interface changes, testing, reviewing outputs and identifying and correcting errors. I was responsible for the overall page design, original system code and key design decisions. I reviewed AI suggestions, decided which changes to adopt, and inspected the resulting behaviour in local previews; automated tests were also used to check the implementation.

Two examples show how this assistance was used:

- **Interest Discovery:** I asked ChatGPT how to improve CampusChoice so that it more clearly demonstrated the characteristics of an intelligent interactive system. ChatGPT proposed adding **Interest Discovery**, a lightweight behaviour-based interest suggestion feature that demonstrates a sensing–inference–feedback loop. I decided to adopt the proposal, then requested that its initially inconspicuous inline suggestion beneath the interest tags be replaced with a more noticeable confirmation dialog. TRAE assisted with implementation and tests, while I inspected the updated interaction in the local preview and checked the results. I subsequently authorised the final enhancement release.
- **Adjustable Ranking:** An early design proposed three percentage-weight sliders. After considering how someone would actually use the prototype, I chose interest-topic tags instead, making it easier to express preferences naturally rather than requiring fine-grained algorithm controls. This was a deliberate human-centred design revision, not an automatically accepted AI output. The revised behaviour was checked through local interaction and regression tests.

ChatGPT also generated ten cover illustrations for the fictional events. These are demonstration images, not photographs of real University of Birmingham activities; they are served locally and do not influence recommendation scores. The application uses transparent, rule-based ranking and interest inference, with no generative AI model at runtime.

## Additional files

- [src/data/](src/data/): fictional events, fixed profile and topic mappings.
- [src/ranking.js](src/ranking.js), [src/explanations.js](src/explanations.js), [src/interest-discovery.js](src/interest-discovery.js): inspectable scoring, explanation and inference rules.
- [src/decision-tasks.js](src/decision-tasks.js), [src/main.js](src/main.js), [src/ui.js](src/ui.js): task definitions, state and rendering.
- [src/styles.css](src/styles.css), [index.html](index.html): styling and app shell; mode/image helpers are in `src/`.
- [tests/](tests/): four automated suites; [package.json](package.json), [package-lock.json](package-lock.json) and [vite.config.js](vite.config.js): scripts, pinned dependencies and configuration.
- [public/images/events/](public/images/events/): ten WebP illustrations.

The final A2 report, including three screenshot-based storyboards, has been completed and is prepared for separate submission. It is not included in this repository. No user-study dataset or image-generation logs are included.
