const HOST_ID = "razor-root";
const PAUSE_AFTER_MS = 2000;
const cache = new Map();
const cooldown = new Map();
let currentSession = null;
let pauseTimer = null;
let pauseHold = null;
let overlayVisible = false;
let armedKey = "";
let lastRedirectAt = 0;
let searchLockInstalled = false;
let debounceTimer = null;

function isExpired(session) {
  return (
    session &&
    session.status === "active" &&
    session.endsAt &&
    Date.now() >= Date.parse(session.endsAt)
  );
}

function isActive(session) {
  return Boolean(session && session.status === "active" && !isExpired(session));
}

function isWatchPage() {
  return /\/watch/.test(location.pathname) || /\/shorts\//.test(location.pathname);
}

function isHomeOrFeed() {
  const path = location.pathname;
  return path === "/" || path === "" || path.indexOf("/feed/") === 0;
}

function isResultsPage() {
  return location.pathname.indexOf("/results") === 0;
}

function currentSearchQuery() {
  try {
    return new URLSearchParams(location.search).get("search_query") || "";
  } catch (error) {
    return "";
  }
}

function readTitle() {
  const selectors = [
    "h1.ytd-watch-metadata yt-formatted-string",
    "ytd-watch-metadata h1 yt-formatted-string",
    "#title h1",
    "h1 yt-formatted-string",
    "yt-shorts-video-title-view-model h2",
  ];
  for (let i = 0; i < selectors.length; i += 1) {
    const node = document.querySelector(selectors[i]);
    const text = node && node.textContent && node.textContent.trim();
    if (text) {
      return text;
    }
  }
  return document.title.replace(/ - YouTube$/i, "").trim();
}

function player() {
  return document.querySelector("video.html5-main-video, ytd-player video, video");
}

function pausePlayer() {
  const video = player();
  if (video && !video.paused) {
    video.pause();
  }
}

function playPlayer() {
  const video = player();
  if (video) {
    const play = video.play();
    if (play && play.catch) {
      play.catch(function () {});
    }
  }
}

function startHoldPause() {
  overlayVisible = true;
  pausePlayer();
  if (pauseHold) {
    window.clearInterval(pauseHold);
  }
  pauseHold = window.setInterval(pausePlayer, 350);
}

function stopHoldPause() {
  overlayVisible = false;
  if (pauseHold) {
    window.clearInterval(pauseHold);
    pauseHold = null;
  }
  if (pauseTimer) {
    window.clearTimeout(pauseTimer);
    pauseTimer = null;
  }
}

function goToIntentionSearch(session) {
  const url = RazorEvaluate.youtubeSearchUrl(session.intention);
  if (isResultsPage()) {
    const current = currentSearchQuery();
    if (current && RazorEvaluate.isSearchAllowed(session.intention, current)) {
      return false;
    }
  }
  if (Date.now() - lastRedirectAt < 1200) {
    return false;
  }
  lastRedirectAt = Date.now();
  location.replace(url);
  return true;
}

function lockSearchInput(session) {
  const input = document.querySelector("input#search, input[name='search_query']");
  if (!input) {
    return;
  }
  const intended = RazorEvaluate.searchQueryFor(session.intention);
  if (!input.value.trim()) {
    input.value = intended;
  }

  const blockOffTopic = function (event) {
    if (!isActive(currentSession)) {
      return;
    }
    const typed = (input.value || "").trim();
    if (!typed || RazorEvaluate.isSearchAllowed(session.intention, typed)) {
      return;
    }
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    sessionStorage.setItem("razor.blockedSearch", typed);
    notifyDrift(session.intention, typed, "Off-intention search");
    input.value = intended;
    goToIntentionSearch(session);
  };

  if (input.dataset.razorLock === "1") {
    return;
  }
  input.dataset.razorLock = "1";
  input.addEventListener(
    "keydown",
    function (event) {
      if (event.key === "Enter") {
        blockOffTopic(event);
      }
    },
    true,
  );
  const form = input.closest("form");
  if (form) {
    form.addEventListener("submit", blockOffTopic, true);
  }
  document.addEventListener(
    "click",
    function (event) {
      const target = event.target && event.target.closest
        ? event.target.closest("#search-icon-legacy, button#search-icon-legacy, #search-form button")
        : null;
      if (target) {
        blockOffTopic(event);
      }
    },
    true,
  );
  searchLockInstalled = true;
}

function ensureHost() {
  let host = document.getElementById(HOST_ID);
  if (host) {
    return host;
  }
  host = document.createElement("div");
  host.id = HOST_ID;
  document.documentElement.appendChild(host);
  host.attachShadow({ mode: "open" });
  return host;
}

function clearUi() {
  stopHoldPause();
  armedKey = "";
  const host = document.getElementById(HOST_ID);
  if (host) {
    host.remove();
  }
}

function renderUi(html) {
  const host = ensureHost();
  host.shadowRoot.innerHTML = html;
  return host.shadowRoot;
}

function styles() {
  return `
    :host { all: initial; }
    .strip, .overlay-card, .warn-toast, button { font-family: "Segoe UI", system-ui, sans-serif; }
    .strip {
      position: fixed; top: 64px; left: 12px; z-index: 2147483646;
      display: flex; align-items: center; gap: 10px;
      background: #f7f4ee; color: #1e293b; border-radius: 16px;
      padding: 8px 12px; box-shadow: 0 8px 24px rgba(15, 23, 42, .18);
      max-width: 300px; pointer-events: none;
    }
    .strip p { margin: 2px 0 0; color: #64748b; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 210px; }
    .dot { width: 9px; height: 9px; border-radius: 50%; background: #94a3b8; flex-shrink: 0; }
    .dot.aligned { background: #0f766e; }
    .dot.uncertain { background: #d97706; }
    .dot.drifting { background: #ea580c; }
    .warn-toast {
      position: fixed; top: 56px; left: 50%; transform: translateX(-50%);
      z-index: 2147483646; width: min(480px, calc(100% - 24px));
      background: #fff7ed; color: #9a3412; border: 1.5px solid #fdba74;
      border-radius: 16px; padding: 12px 16px; box-shadow: 0 12px 32px rgba(0,0,0,.2);
    }
    .warn-toast strong { display: block; font-size: 14px; margin-bottom: 4px; color: #c2410c; }
    .warn-toast p { margin: 0; font-size: 13px; color: #9a3412; }
    .overlay {
      position: fixed; inset: 0; z-index: 2147483647;
      background: rgba(15, 23, 42, .55); display: grid; place-items: center; padding: 20px;
    }
    .overlay-card {
      width: min(440px, 100%); background: #f7f4ee; color: #1e293b;
      border-radius: 20px; padding: 22px 22px 18px;
      box-shadow: 0 24px 50px rgba(15, 23, 42, .28);
    }
    .overlay-card h2 { margin: 0 0 12px; font-size: 1.35rem; line-height: 1.25; }
    .eyebrow { color: #0f766e; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin: 0 0 6px; }
    .eyebrow.warn { color: #c2410c; }
    .pair { margin: 0 0 10px; }
    .pair span { display: block; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px; }
    button { border: 0; border-radius: 999px; padding: 10px 14px; cursor: pointer; font: inherit; font-weight: 700; }
    .primary { background: #0f766e; color: #fff; }
    .ghost { background: transparent; border: 1.5px solid #e2ddd4; color: #1e293b; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .note { margin: 12px 0 0; color: #64748b; font-size: 12px; }
  `;
}

function strip(session, evaluation) {
  const status = evaluation ? evaluation.status : "idle";
  const label =
    status === "aligned"
      ? "On topic"
      : status === "uncertain"
        ? "Not sure yet"
        : status === "drifting"
          ? "Off topic"
          : "Studying";
  return `
    <style>${styles()}</style>
    <div class="strip" role="status">
      <span class="dot ${status}"></span>
      <div>
        <strong>${escapeHtml(label)}</strong>
        <p>${escapeHtml(session.intention)}</p>
      </div>
    </div>
  `;
}

function warningToast(session, activity) {
  return `
    ${strip(session, { status: "drifting" })}
    <div class="warn-toast" role="alert">
      <strong>Hold on — this might not be your topic</strong>
      <p>You started “${escapeHtml(session.intention)}”. This looks like: ${escapeHtml(activity)}. Pausing in a moment.</p>
    </div>
  `;
}

function overlay(session, title, evaluation) {
  return `
    ${strip(session, evaluation)}
    <div class="overlay" role="alertdialog" aria-label="This might not be your topic">
      <div class="overlay-card">
        <p class="eyebrow warn">Quick check</p>
        <h2>This doesn’t look like what you sat down to study.</h2>
        <p class="pair"><span>You started</span>${escapeHtml(session.intention)}</p>
        <p class="pair"><span>Now playing</span>${escapeHtml(title)}</p>
        <p class="pair"><span>Why we paused</span>${escapeHtml(evaluation.reason)}</p>
        <div class="actions">
          <button class="primary" id="razor-return" type="button">Back to my topic</button>
          <button class="ghost" id="razor-continue" type="button">Keep watching</button>
        </div>
        <p class="note">You’re in charge. Razor only paused so this is a choice, not a rabbit hole.</p>
      </div>
    </div>
  `;
}

function searchBlockedBanner(session, blockedQuery) {
  return `
    ${strip(session, { status: "drifting" })}
    <div class="warn-toast" role="alert">
      <strong>That search isn’t your topic</strong>
      <p>“${escapeHtml(blockedQuery)}” doesn’t match “${escapeHtml(session.intention)}”, so Razor took you back to your study search.</p>
    </div>
  `;
}

function notifyDrift(intention, pageTitle, reason) {
  try {
    chrome.runtime.sendMessage({
      type: "RAZOR_DRIFT_WARNING",
      intention: intention,
      pageTitle: pageTitle,
      reason: reason,
    });
  } catch (error) {
    console.info("[Razor] Could not send drift notification", error);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bindActions(root, session, pageKey) {
  const back = root.querySelector("#razor-return");
  const cont = root.querySelector("#razor-continue");
  if (back) {
    back.addEventListener("click", function () {
      stopHoldPause();
      location.href = RazorEvaluate.youtubeSearchUrl(session.intention);
    });
  }
  if (cont) {
    cont.addEventListener("click", function () {
      cooldown.set(pageKey, Date.now() + 20 * 60 * 1000);
      stopHoldPause();
      playPlayer();
      renderUi(strip(session, cache.get(pageKey) || { status: "drifting" }));
    });
  }
}

function armPause(session, title, evaluation, pageKey) {
  renderUi(warningToast(session, title));
  notifyDrift(session.intention, title, evaluation.reason);
  if (pauseTimer) {
    window.clearTimeout(pauseTimer);
  }
  pauseTimer = window.setTimeout(function () {
    if (!isActive(currentSession)) {
      return;
    }
    if (cooldown.get(pageKey) > Date.now()) {
      return;
    }
    pausePlayer();
    const root = renderUi(overlay(session, title, evaluation));
    bindActions(root, session, pageKey);
    startHoldPause();
  }, PAUSE_AFTER_MS);
}

function evaluatePage(session) {
  if (!isActive(session)) {
    clearUi();
    return;
  }

  lockSearchInput(session);

  if (isHomeOrFeed()) {
    goToIntentionSearch(session);
    renderUi(strip(session, null));
    return;
  }

  if (isResultsPage()) {
    const query = currentSearchQuery();
    if (query && !RazorEvaluate.isSearchAllowed(session.intention, query)) {
      sessionStorage.setItem("razor.blockedSearch", query);
      notifyDrift(session.intention, query, "Off-intention search");
      goToIntentionSearch(session);
      return;
    }
    stopHoldPause();
    armedKey = "";
    const blocked = sessionStorage.getItem("razor.blockedSearch");
    if (blocked) {
      sessionStorage.removeItem("razor.blockedSearch");
      renderUi(searchBlockedBanner(session, blocked));
      window.setTimeout(function () {
        if (isActive(currentSession) && isResultsPage()) {
          renderUi(strip(session, null));
        }
      }, 5000);
      return;
    }
    renderUi(strip(session, null));
    return;
  }

  if (!isWatchPage()) {
    renderUi(strip(session, null));
    return;
  }

  const title = readTitle();
  if (!title || title === "YouTube") {
    return;
  }

  const pageKey = location.pathname + location.search + "::" + title;
  if (cooldown.get(pageKey) > Date.now()) {
    stopHoldPause();
    renderUi(strip(session, cache.get(pageKey) || null));
    return;
  }

  let evaluation = cache.get(pageKey);
  if (!evaluation) {
    evaluation = RazorEvaluate.evaluate(session.intention, { title: title });
    cache.set(pageKey, evaluation);
    console.info("[Razor]", evaluation.status, title);
  }

  if (evaluation.status === "drifting") {
    if (armedKey !== pageKey) {
      armedKey = pageKey;
      armPause(session, title, evaluation, pageKey);
    }
    return;
  }

  stopHoldPause();
  armedKey = "";
  renderUi(strip(session, evaluation));
}

function scheduleCheck() {
  if (!isActive(currentSession)) {
    clearUi();
    return;
  }
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(function () {
    evaluatePage(currentSession);
  }, 350);
}

function applySession(session) {
  currentSession = session;
  armedKey = "";
  searchLockInstalled = false;
  if (!isActive(session)) {
    clearUi();
    return;
  }
  scheduleCheck();
}

chrome.storage.local.get("razorSession", function (stored) {
  applySession(stored.razorSession || null);
});

chrome.storage.onChanged.addListener(function (changes, area) {
  if (area === "local" && changes.razorSession) {
    applySession(changes.razorSession.newValue || null);
  }
});

document.addEventListener("yt-navigate-finish", scheduleCheck);
window.addEventListener("yt-navigate-finish", scheduleCheck);
document.addEventListener("yt-navigate-start", function () {
  if (!isActive(currentSession)) {
    return;
  }
  stopHoldPause();
  armedKey = "";
});
setInterval(function () {
  if (isActive(currentSession)) {
    scheduleCheck();
  }
}, 900);
void searchLockInstalled;
