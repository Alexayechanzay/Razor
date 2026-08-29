# Razor

YouTube is useful for homework. The homepage is not.

Razor is a **Chrome extension** for secondary students. You write what you’re studying, pick how long, and YouTube opens on **search for that topic** — not Home. If a video looks off-topic, Razor pauses so the next click is a choice. When the timer ends, Razor is off.

The `web/` folder is a **practice YouTube** for judges who cannot load the extension. It is not a second product.

## 90-second demo

**Intention:** `Study IGCSE Physics — momentum and impulse`  
Set about **2 minutes**.

| Open this title | What you should see |
|---|---|
| The Most Misunderstood Concept in Physics | Quiet. **On topic** — even though it never says momentum or impulse. |
| This changed everything | Quiet chip. **Not sure yet.** |
| I Failed Physics, Then Became a UFC Fighter | Pause + overlay. **Off topic** — even though it says Physics. |

Do not lead with a plain UFC highlights clip. The third title is the keyword trap.

Full click path: [DEMO.md](DEMO.md)  
Copy-paste for the submission form: [SUBMISSION.md](SUBMISSION.md)

## Chrome extension (the product)

1. Chrome → `chrome://extensions`
2. Turn on **Developer mode**
3. **Load unpacked** → choose the `extension` folder in this project
4. Pin Razor. Open the popup. Start studying.
5. After code changes, click **Reload** on the Razor card

Razor only reads the YouTube title (and search) while a session is active. It does not watch browsing history, block the tab, or run after you stop.

## Practice site (backup)

Live backup: [razor-stay-on-topic.netlify.app](https://razor-stay-on-topic.netlify.app)

Local:

```bash
python -m http.server 5173 --directory web
```

Open `http://localhost:5173` → **Start studying**.

## What this is not

No accounts, parents, streaks, chat, or all-day monitoring. No dashboards. Observation stops the moment the session ends.

## Checks

```bash
node scripts/check-evaluate.mjs
node scripts/check-journey.mjs
```
