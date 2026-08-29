import { DEMO_INTENTION, DEMO_VIDEOS, evaluate } from "../web/evaluate.js";
import {
  createActiveSession,
  endSession,
  isExpired,
  remainingMs,
} from "../web/session.js";

const session = createActiveSession(DEMO_INTENTION, 2);
if (session.status !== "active" || !session.endsAt) {
  throw new Error("Session did not start as active");
}
if (remainingMs(session) <= 0 || remainingMs(session) > 2 * 60 * 1000) {
  throw new Error("Countdown window is wrong");
}

for (const video of DEMO_VIDEOS) {
  const result = evaluate(session.intention, { title: video.title });
  if (result.status !== video.expected) {
    throw new Error(`${video.title} expected ${video.expected}, got ${result.status}`);
  }
  if (video.id === "aligned-misunderstood" && result.classifier !== "demo-fixture") {
    throw new Error("Aligned demo must use the fixture, not a keyword heuristic");
  }
}

const naive = /momentum|impulse|igcse/i.test("The Most Misunderstood Concept in Physics");
if (naive) {
  throw new Error("The aligned title should not contain the study-topic keywords");
}
if (!/physics/i.test("I Failed Physics, Then Became a UFC Fighter")) {
  throw new Error("The drifting title must contain Physics so a keyword matcher would fail");
}

const ended = endSession(session);
if (ended.status !== "ended") {
  throw new Error("Stop did not end the session");
}

const expired = createActiveSession(DEMO_INTENTION, 2);
expired.endsAt = new Date(Date.now() - 1000).toISOString();
if (!isExpired(expired)) {
  throw new Error("Expiry check failed");
}

console.log("Core journey checks passed: start, three locked titles, keyword-trap, end, expiry.");
