import { DEMO_VIDEOS } from "./demoVideos";
import type { DriftEvaluation, PageContext } from "./types";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
}

const FIXTURES: { title: string; evaluation: DriftEvaluation }[] = [
  {
    title: "The Most Misunderstood Concept in Physics",
    evaluation: {
      status: "aligned",
      confidence: 0.78,
      reason:
        "This reads as a conceptual physics explainer. It never names momentum or impulse, so a topic-keyword check would miss it. It still matches a student trying to understand physics ideas.",
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
        "The title has no subject. From the page name alone, there is not enough context to say this matches or leaves the study intention.",
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
        "The title contains “Physics,” but the story is a fighting career, not a lesson. A keyword matcher that sees Physics would call this aligned. Purpose-aware comparison does not.",
      suggestedAction: "return_to_goal",
      classifier: "demo-fixture",
    },
  },
];

const ENTERTAINMENT =
  /\b(ufc|mma|gaming|gameplay|prank|celebrity|vlog|trailer|highlights|music video|reaction|roast|unboxing|tiktok|shorts compilation|became a .+ fighter)\b/i;

const STUDY_TOPIC =
  /\b(momentum|impulse|igcse|newton|collision|kinematics|inertia|conservation of momentum|resultant force)\b/i;

function intentionTokens(intention: string): { specific: string[]; generic: string[] } {
  const text = normalize(intention);
  const generic = ["physics", "maths", "math", "chemistry", "biology", "history", "english", "science", "study", "revise", "revision"];
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

function heuristic(intention: string, title: string): DriftEvaluation {
  const tokens = intentionTokens(intention);
  const titleNorm = normalize(title);
  const looksEntertainment = ENTERTAINMENT.test(title) || ENTERTAINMENT.test(titleNorm);
  const hasSpecific =
    tokens.specific.some((token) => titleNorm.includes(token)) || STUDY_TOPIC.test(title);
  const hasGeneric = tokens.generic.some((token) => titleNorm.includes(token));

  if (looksEntertainment && hasGeneric) {
    return {
      status: "drifting",
      confidence: 0.8,
      reason:
        "The title mentions a school subject but reads as entertainment. Alignment is about the study intention, not a shared keyword.",
      suggestedAction: "return_to_goal",
      classifier: "heuristic",
    };
  }

  if (looksEntertainment && !hasSpecific) {
    return {
      status: "drifting",
      confidence: 0.77,
      reason: "This title looks like entertainment and does not match the active study intention.",
      suggestedAction: "return_to_goal",
      classifier: "heuristic",
    };
  }

  if (hasSpecific) {
    return {
      status: "aligned",
      confidence: 0.74,
      reason: "The title names a topic from the active intention.",
      suggestedAction: "continue",
      classifier: "heuristic",
    };
  }

  if (hasGeneric && !looksEntertainment) {
    return {
      status: "uncertain",
      confidence: 0.48,
      reason:
        "The title shares a broad subject word with the intention, but not the specific topic. There is not enough context to be sure.",
      suggestedAction: "review",
      classifier: "heuristic",
    };
  }

  return {
    status: "uncertain",
    confidence: 0.4,
    reason: "The title is too thin to compare with the active intention.",
    suggestedAction: "review",
    classifier: "heuristic",
  };
}

export function evaluate(intention: string, context: Pick<PageContext, "title">): DriftEvaluation {
  const title = context.title.trim();
  if (!title) {
    return {
      status: "uncertain",
      confidence: 0.2,
      reason: "No page title was available to compare with the intention.",
      suggestedAction: "review",
      classifier: "heuristic",
    };
  }

  const fixture = FIXTURES.find((entry) => normalize(entry.title) === normalize(title));
  if (fixture) {
    return fixture.evaluation;
  }

  const demo = DEMO_VIDEOS.find((video) => normalize(video.title) === normalize(title));
  if (demo) {
    const fromFixture = FIXTURES.find((entry) => normalize(entry.title) === normalize(demo.title));
    if (fromFixture) {
      return fromFixture.evaluation;
    }
  }

  return heuristic(intention, title);
}

export function searchQueryFor(intention: string): string {
  return intention.replace(/[—–]/g, " ").replace(/\s+/g, " ").trim();
}
