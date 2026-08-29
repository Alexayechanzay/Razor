# Razor — Locked product decisions

These decisions come from the critical MVP analysis and Aye’s hackathon answers. They override the original blueprint where the two conflict.

## 1. Confirmed constraints

| Constraint | Decision |
|---|---|
| Time | About **4 hours** |
| Required stack | **None.** n8n is not required. Live AI is optional and not on the demo-critical path. |
| Demo format | **Chrome extension + simulated YouTube backup.** Judges can load the unpacked extension; the Netlify/web demo still works if they do not. |
| Auth / database | None |
| Accounts, parents, streaks, chat | Excluded |

## 2. Problem reframe (accepted)

The original blueprint treated the core failure as *unnoticed drift* after Maya is already watching something unrelated.

**We reject that as the primary problem.** By the time she is watching entertainment, she usually already knows. An overlay that says “this is not physics” restates the obvious.

**The problem we own:**

> Maya needs YouTube for a specific study intention, but YouTube’s default surface replaces that intention with recommendations. She needs a temporary, self-started contract that puts her on an intentional search path and pauses her only when the video she opens may not match the purpose she chose.

Drift is a **choice-architecture failure** at the feed, not a recognition failure after playback.

## 3. Locked MVP shape

1. **Primary value:** Intention-locked YouTube *search* entry + a visible intention chip for the session only.
2. **Secondary value:** One respectful pause when the *opened* video looks misaligned. `uncertain` is a quiet state. Never a hard block.
3. **Classifier job:** Win cases keywords cannot (aligned without topic words; drifting despite “Physics” in the title). Not “detect UFC.”
4. **Start ceremony:** One field (“What do you want to accomplish?”) + duration chips. No required review screen.
5. **Control plane:** Extension popup starts the live-YouTube loop. The web app is an explainer + a standalone simulated backup — not a second place you *must* create a session to use the extension.
6. **Session states:** `idle` | `active` | `ended`. No pause. Observation stops the moment the session ends.
7. **Classifier:** Deterministic demo fixtures + a labeled heuristic. Honest “demo classifier” copy. Optional webhook later, same `DriftEvaluation` type.

## 4. Locked demo script (do not lead with UFC)

Intention: **Study IGCSE Physics — momentum and impulse**

| Video | Expected | Why this is the demo |
|---|---|---|
| The Most Misunderstood Concept in Physics | `aligned` | No momentum/impulse/IGCSE keywords. A keyword matcher looking for the study topic misses it. |
| This changed everything | `uncertain` | Not enough context. Razor must not fake confidence. |
| I Failed Physics, Then Became a UFC Fighter | `drifting` | Contains “Physics.” A keyword matcher would wrongly call it aligned. |

UFC-only titles are too easy. They are not the judge-facing script.

## 5. Implementation lock

Built after the constraints above were confirmed:

- Chrome extension in `extension/` — session lives in `chrome.storage.local`. Start opens YouTube search.
- Simulated backup in `web/` — zero-build static app (hash routes). npm/Vite was dropped after the registry reset mid-install; a static backup is also the safer 4-hour path.
- Shared demo classifier: fixtures for the three locked titles, heuristic otherwise, labeled honestly.
- No n8n, no accounts, no live model on the critical path.
- Typed contract kept in `src/lib/` for the session and evaluation shapes.
