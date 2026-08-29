import { DEMO_INTENTION, DEMO_VIDEOS, evaluate } from "../web/evaluate.js";

const expected = {
  "The Most Misunderstood Concept in Physics": "aligned",
  "This changed everything": "uncertain",
  "I Failed Physics, Then Became a UFC Fighter": "drifting",
};

let failed = 0;
for (const [title, status] of Object.entries(expected)) {
  const result = evaluate(DEMO_INTENTION, { title });
  const ok = result.status === status;
  console.log(`${ok ? "ok" : "FAIL"}  ${status.padEnd(10)}  ${title}`);
  if (!ok) {
    failed += 1;
    console.log("     got", result);
  }
}

for (const video of DEMO_VIDEOS) {
  const result = evaluate(DEMO_INTENTION, { title: video.title });
  if (result.status !== video.expected) {
    failed += 1;
    console.log("FAIL video map", video.id, result.status);
  }
}

const extra = {
  "The ONLY Chess Guide you need (1 hour+)": "drifting",
  gaming: "drifting",
  "IGCSE Physics momentum": "aligned",
};

for (const [title, status] of Object.entries(extra)) {
  const result = evaluate(DEMO_INTENTION, { title });
  const ok = result.status === status;
  console.log(`${ok ? "ok" : "FAIL"}  ${status.padEnd(10)}  ${title}`);
  if (!ok) {
    failed += 1;
    console.log("     got", result);
  }
}

if (failed) {
  process.exit(1);
}
console.log("Demo classifier fixtures match the locked script.");
