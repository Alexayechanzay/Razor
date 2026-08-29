export const SESSION_KEY = "razor.session";
export const COOLDOWN_KEY = "razor.continueCooldown";

function sanitizeDuration(minutes) {
  const value = Math.round(Number(minutes));
  if (!Number.isFinite(value)) {
    return 25;
  }
  return Math.min(240, Math.max(1, value));
}

export function createActiveSession(intention, durationMinutes) {
  durationMinutes = sanitizeDuration(durationMinutes);
  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

  return {
    id: `session-${startedAt.getTime().toString(36)}`,
    intention: intention.trim(),
    durationMinutes,
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
    status: "active",
  };
}

export function endSession(session) {
  return { ...session, status: "ended" };
}

export function isExpired(session, now = Date.now()) {
  return session?.status === "active" && session.endsAt && now >= Date.parse(session.endsAt);
}

export function remainingMs(session, now = Date.now()) {
  if (!session || session.status !== "active" || !session.endsAt) {
    return 0;
  }
  return Math.max(0, Date.parse(session.endsAt) - now);
}

export function formatCountdown(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function isOnCooldown(id) {
  try {
    const map = JSON.parse(sessionStorage.getItem(COOLDOWN_KEY) || "{}");
    return typeof map[id] === "number" && map[id] > Date.now();
  } catch {
    return false;
  }
}

export function setCooldown(id, minutes = 20) {
  const map = JSON.parse(sessionStorage.getItem(COOLDOWN_KEY) || "{}");
  map[id] = Date.now() + minutes * 60 * 1000;
  sessionStorage.setItem(COOLDOWN_KEY, JSON.stringify(map));
}

export function clearCooldowns() {
  sessionStorage.removeItem(COOLDOWN_KEY);
}
