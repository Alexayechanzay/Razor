import type { FocusSession } from "./types";

export const SESSION_STORAGE_KEY = "razor.session";
export const CONTINUE_COOLDOWN_KEY = "razor.continueCooldown";

export function createSessionId(): string {
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createActiveSession(intention: string, durationMinutes: number): FocusSession {
  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

  return {
    id: createSessionId(),
    intention: intention.trim(),
    durationMinutes,
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
    status: "active",
  };
}

export function endSession(session: FocusSession): FocusSession {
  return { ...session, status: "ended" };
}

export function isExpired(session: FocusSession, now = Date.now()): boolean {
  if (session.status !== "active" || !session.endsAt) {
    return false;
  }
  return now >= Date.parse(session.endsAt);
}

export function remainingMs(session: FocusSession, now = Date.now()): number {
  if (session.status !== "active" || !session.endsAt) {
    return 0;
  }
  return Math.max(0, Date.parse(session.endsAt) - now);
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function loadSession(): FocusSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as FocusSession;
  } catch {
    return null;
  }
}

export function saveSession(session: FocusSession | null): void {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function isOnCooldown(urlOrId: string): boolean {
  try {
    const raw = sessionStorage.getItem(CONTINUE_COOLDOWN_KEY);
    if (!raw) {
      return false;
    }
    const map = JSON.parse(raw) as Record<string, number>;
    const until = map[urlOrId];
    return typeof until === "number" && until > Date.now();
  } catch {
    return false;
  }
}

export function setCooldown(urlOrId: string, minutes = 20): void {
  const raw = sessionStorage.getItem(CONTINUE_COOLDOWN_KEY);
  const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
  map[urlOrId] = Date.now() + minutes * 60 * 1000;
  sessionStorage.setItem(CONTINUE_COOLDOWN_KEY, JSON.stringify(map));
}

export function clearCooldowns(): void {
  sessionStorage.removeItem(CONTINUE_COOLDOWN_KEY);
}
