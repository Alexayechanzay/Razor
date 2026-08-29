import type { DemoVideo } from "./types";

export const DEMO_INTENTION = "Study IGCSE Physics — momentum and impulse";

export const DEMO_VIDEOS: DemoVideo[] = [
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
    blurb: "A title with no subject. There is not enough context to judge alignment.",
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

export function getDemoVideo(id: string): DemoVideo | undefined {
  return DEMO_VIDEOS.find((video) => video.id === id);
}
