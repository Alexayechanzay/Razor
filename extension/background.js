importScripts("evaluate.js");

const SESSION_KEY = "razorSession";
const ALARM_NAME = "razor-session-end";

function sanitizeDuration(minutes) {
  const value = Math.round(Number(minutes));
  if (!Number.isFinite(value)) {
    return 25;
  }
  return Math.min(240, Math.max(1, value));
}

function createSession(intention, durationMinutes) {
  durationMinutes = sanitizeDuration(durationMinutes);
  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
  return {
    id: "session-" + startedAt.getTime().toString(36),
    intention: intention.trim(),
    durationMinutes: durationMinutes,
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
    status: "active",
  };
}

async function getSession() {
  const stored = await chrome.storage.local.get(SESSION_KEY);
  return stored[SESSION_KEY] || null;
}

async function setSession(session) {
  if (!session) {
    await chrome.storage.local.remove(SESSION_KEY);
    return;
  }
  await chrome.storage.local.set({ [SESSION_KEY]: session });
}

async function startSession(intention, durationMinutes) {
  const session = createSession(intention, durationMinutes);
  await setSession(session);
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.create(ALARM_NAME, { when: Date.parse(session.endsAt) });
  const url = RazorEvaluate.youtubeSearchUrl(session.intention);
  await chrome.tabs.create({ url: url });
  return session;
}

async function endSession() {
  const session = await getSession();
  if (!session) {
    return null;
  }
  const ended = Object.assign({}, session, { status: "ended" });
  await setSession(ended);
  await chrome.alarms.clear(ALARM_NAME);
  return ended;
}

chrome.runtime.onInstalled.addListener(() => {
  console.info("[Razor] Extension ready. Nothing is observed until a session starts.");
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) {
    return;
  }
  await endSession();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    return;
  }

  if (message.type === "RAZOR_START") {
    startSession(message.intention, message.durationMinutes).then(sendResponse);
    return true;
  }

  if (message.type === "RAZOR_STOP") {
    endSession().then(sendResponse);
    return true;
  }

  if (message.type === "RAZOR_GET") {
    getSession().then(sendResponse);
    return true;
  }

  if (message.type === "RAZOR_DRIFT_WARNING") {
    const title = message.pageTitle || "unrelated activity";
    chrome.notifications.create("razor-drift-" + Date.now(), {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Hold on — this might not be your topic",
      message:
        "You started: " +
        (message.intention || "") +
        "\nNow: " +
        title,
      priority: 2,
    });
    sendResponse({ ok: true });
    return true;
  }
});
