export type SessionStatus = "idle" | "active" | "ended";

export type FocusSession = {
  id: string;
  intention: string;
  durationMinutes: number;
  startedAt?: string;
  endsAt?: string;
  status: SessionStatus;
};

export type PageContext = {
  url: string;
  hostname: string;
  title: string;
  capturedAt: string;
  source: "youtube" | "demo";
};

export type DriftStatus = "aligned" | "uncertain" | "drifting";

export type DriftEvaluation = {
  status: DriftStatus;
  confidence: number;
  reason: string;
  suggestedAction: "continue" | "review" | "return_to_goal";
  classifier: "demo-fixture" | "heuristic";
};

export type DemoVideo = {
  id: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  blurb: string;
  expected: DriftStatus;
};
