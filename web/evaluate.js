export function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

const FIXTURES = [
  {
    title: "The Most Misunderstood Concept in Physics",
    evaluation: {
      status: "aligned",
      confidence: 0.78,
      reason:
        "This sounds like a physics explainer. It never says momentum or impulse, but it still looks like studying physics.",
      suggestedAction: "continue",
      classifier: "demo-fixture",
    },
  },
  {
    title: "This changed everything",
    evaluation: {
      status: "uncertain",
      confidence: 0.36,
      reason:
        "This title doesn’t say what the video is about, so Razor isn’t sure yet.",
      suggestedAction: "review",
      classifier: "demo-fixture",
    },
  },
  {
    title: "I Failed Physics, Then Became a UFC Fighter",
    evaluation: {
      status: "drifting",
      confidence: 0.84,
      reason:
        "It says Physics, but this is a fighting story — not a lesson on your topic.",
      suggestedAction: "return_to_goal",
      classifier: "demo-fixture",
    },
  },
];

const OFF_TOPIC =
  /\b(chess|gaming|gamer|gameplay|minecraft|fortnite|roblox|valorant|football|soccer|nba|nfl|cricket|tennis|anime|manga|makeup|skincare|cooking|recipe|vlog|unboxing|prank|reaction|music|song|official video|trailer|podcast|asmr|comedy|tiktok|ufc|mma|highlights|celebrity|movie|netflix|series)\b/i;
const STUDY_TOPIC =
  /\b(momentum|impulse|igcse|newton|collision|kinematics|inertia|conservation of momentum|resultant force)\b/i;

function intentionTokens(intention) {
  const text = normalize(intention);
  const generic = [
    "physics",
    "maths",
    "math",
    "chemistry",
    "biology",
    "history",
    "english",
    "science",
    "revise",
    "revision",
  ];
  const specificHints = [
    "momentum",
    "impulse",
    "igcse",
    "newton",
    "collision",
    "kinematics",
    "algebra",
    "calculus",
    "organic",
    "stoichiometry",
  ];
  return {
    generic: generic.filter((token) => text.includes(token)),
    specific: specificHints.filter((token) => text.includes(token)),
  };
}

function isVague(title) {
  const words = normalize(title).split(" ").filter(Boolean);
  if (words.length <= 4 && !OFF_TOPIC.test(title) && !STUDY_TOPIC.test(title)) {
    return true;
  }
  return /^(this|watch this|wait|wow|part \d+|ep\.? \d+|must watch)/i.test(title.trim());
}

function drifting(reason, confidence = 0.84) {
  return {
    status: "drifting",
    confidence,
    reason,
    suggestedAction: "return_to_goal",
    classifier: "heuristic",
  };
}

function heuristic(intention, title) {
  const tokens = intentionTokens(intention);
  const titleNorm = normalize(title);
  const offTopic = OFF_TOPIC.test(title) || OFF_TOPIC.test(titleNorm);
  const hasSpecific =
    tokens.specific.some((token) => titleNorm.includes(token)) || STUDY_TOPIC.test(title);
  const hasGeneric = tokens.generic.some((token) => titleNorm.includes(token));

  if (offTopic && !hasSpecific) {
    return drifting("This looks like something else — not the topic you started with.");
  }
  if (hasSpecific) {
    return {
      status: "aligned",
      confidence: 0.74,
      reason: "The title names something from what you’re studying.",
      suggestedAction: "continue",
      classifier: "heuristic",
    };
  }
  if (hasGeneric && !offTopic) {
    return {
      status: "uncertain",
      confidence: 0.48,
      reason:
        "The title shares a big subject word, but not the specific topic. Hard to tell from the name alone.",
      suggestedAction: "review",
      classifier: "heuristic",
    };
  }
  if (isVague(title)) {
    return {
      status: "uncertain",
      confidence: 0.36,
      reason: "The title is too vague to tell if it matches what you’re studying.",
      suggestedAction: "review",
      classifier: "heuristic",
    };
  }
  return drifting("This doesn’t match what you sat down to study.");
}

export function evaluate(intention, context) {
  const title = ((context && context.title) || "").trim();
  if (!title) {
    return {
      status: "uncertain",
      confidence: 0.2,
      reason: "Razor couldn’t read a video title yet.",
      suggestedAction: "review",
      classifier: "heuristic",
    };
  }
  const fixture = FIXTURES.find((entry) => normalize(entry.title) === normalize(title));
  if (fixture) {
    return fixture.evaluation;
  }
  return heuristic(intention, title);
}

export function searchQueryFor(intention) {
  return String(intention || "")
    .replace(/[—–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const DEMO_INTENTION = "Study IGCSE Physics — momentum and impulse";

export const DEMO_VIDEOS = [
  {
    id: "aligned-misunderstood",
    title: "The Most Misunderstood Concept in Physics",
    channel: "Field Notes Lab",
    duration: "12:48",
    views: "2.1M views",
    blurb: "Why students mix up ideas that sound similar. No formula dump. Does not say momentum or impulse.",
    expected: "aligned",
  },
  {
    id: "uncertain-changed",
    title: "This changed everything",
    channel: "late night notes",
    duration: "18:02",
    views: "890K views",
    blurb: "A title with no subject. Razor won’t pretend it knows.",
    expected: "uncertain",
  },
  {
    id: "drifting-failed-physics",
    title: "I Failed Physics, Then Became a UFC Fighter",
    channel: "Ring Lights",
    duration: "22:11",
    views: "4.4M views",
    blurb: "Contains the word Physics. It is still a sports story, not a lesson.",
    expected: "drifting",
  },
];
