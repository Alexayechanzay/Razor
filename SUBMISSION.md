# Submission copy

Paste or adapt these fields. Replace the practice URL after Netlify deploy if it changes.

## Name

Razor

## Tagline

Keeps YouTube on the topic you sat down to study.

## One sentence

A student-started Chrome extension that opens YouTube on a goal search and pauses only when a title looks off-topic — then stops watching when the session ends.

## Problem

Secondary students need YouTube for school. Home and Up Next replace that homework with a feed before they make a real choice. Blockers fail because the lesson *is* on YouTube. A late “this isn’t physics” overlay restates what they already know.

## What we built

- One-field start: topic + custom time (1 minute–4 hours)
- Session states: idle → active → ended
- Search Mode: start lands on intention search, not Home
- Off-topic search is bounced back to that search
- Title check: on topic / not sure yet / off topic
- Off-topic watch: pause after ~2 seconds, respectful overlay, student can continue
- Hard stop: nothing is observed after end or expiry
- Practice YouTube in `web/` if judges cannot load the extension

## Locked demo

Intention: **Study IGCSE Physics — momentum and impulse**

1. *The Most Misunderstood Concept in Physics* → on topic (no momentum/impulse keywords)
2. *This changed everything* → not sure yet
3. *I Failed Physics, Then Became a UFC Fighter* → off topic (contains “Physics”)

## What we refused

Accounts, parents, streaks, chat, diagnosis, device-wide monitoring, required review screens, TikTok, calendars.

## Stack

Chrome Manifest V3 extension (popup, service worker, content script). Static practice site (`web/`) on Netlify. Demo fixtures + labeled heuristic — not a live model.

## Links

| What | Where |
|---|---|
| Practice site | https://razor-stay-on-topic.netlify.app |
| Extension | Load unpacked from `extension/` |
| Demo script | `DEMO.md` |

## Built by

Aye
