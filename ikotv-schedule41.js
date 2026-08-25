/*!
 * IKOTV Auto Schedule + ArtPlayer
 * N11BOLAHD
 *
 * Requires:
 * - https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.min.js
 * - https://cdn.jsdelivr.net/npm/artplayer-plugin-hls-quality/dist/artplayer-plugin-hls-quality.js
 * - Hls.js is loaded automatically by this script for browsers that need it.
 */

(() => {
  "use strict";

  const CONFIG = {
    api: {
      matches: "https://rough-bread-fac0-ikotv-api.novendibagus5.workers.dev/",
      matchInfo: "https://ikotv.cc/api/match-info",
      streamUrl: "https://rough-bread-fac0-ikotv-api.novendibagus5.workers.dev/stream-url"
    },

    // Change these only if you want another placement.
    scheduleSelector: "#ikotvSchedule",
    playerSelector: "#tv",

    refreshMs: 60000,
    countdownMs: 1000,

    // IKOTV match timestamps are treated as Unix seconds.
    // This only controls when a match is considered ended.
    matchDurationHours: 2,

    // CDN libraries
    artplayer:
      "https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.min.js",
    hls:
      "https://cdn.jsdelivr.net/npm/hls.js@1.6.2/dist/hls.min.js",
    hlsQuality:
      "https://cdn.jsdelivr.net/npm/artplayer-plugin-hls-quality/dist/artplayer-plugin-hls-quality.js"
  };

  let matches = [];
  let art = null;
  let currentMatchId = null;
  let currentVideos = [];
  let loadingSchedule = false;

/* =========================================================
     fungsi ini hanya sementara,
  ========================================================= */
  async function testMatchInfo(matchId) {

  console.log(
    "[IKOTV TEST] MATCH INFO ID:",
    matchId
  );

  try {

    const result =
      await fetchMatchInfo(matchId);

    console.log(
      "[IKOTV TEST] MATCH INFO RESULT:",
      result
    );

    return result;

  } catch (error) {

    console.error(
      "[IKOTV TEST] MATCH INFO ERROR:",
      error
    );

    return null;

  }
  }
  /* =========================================================
     UTILITIES
  ========================================================= */

  function $(selector) {
    return document.querySelector(selector);
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeURL(value) {
    if (!value) return "";
    try {
      const u = new URL(value, location.href);
      if (u.protocol === "https:" || u.protocol === "http:") return u.href;
    } catch (_) {}
    return "";
  }

  function getArray(result) {

  const candidates = [
    result?.data?.matchs,      // IKOTV API
    result?.data?.matches,
    result?.data?.list,
    result?.matchs,
    result?.matches,
    result?.list,
    result?.data
  ];

  for (const item of candidates) {

    if (Array.isArray(item)) {
      return item;
    }

  }

  return [];
}

  function formatTime(timestamp) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date(Number(timestamp) * 1000));
  }

  function formatDate(timestamp) {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(new Date(Number(timestamp) * 1000));
  }

  function dateKey(timestamp) {
    const d = new Date(Number(timestamp) * 1000);
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  }

  function countdown(timestamp) {
    const diff = Number(timestamp) * 1000 - Date.now();

    if (diff <= 0) return "";

    let seconds = Math.floor(diff / 1000);
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0")
    ].join(":");
  }

  function getStatus(match) {

  const now = Math.floor(Date.now() / 1000);

  const start = Number(match.time || 0);

  const end =
    start +
    CONFIG.matchDurationHours * 3600;

  if (now < start) return "upcoming";

  if (now <= end) return "live";

  return "ended";
}

  function normalizeMatch(match) {

  const home =
    match?.hometeam ||
    match?.home_team ||
    match?.home ||
    {};

  const away =
    match?.awayteam ||
    match?.away_team ||
    match?.away ||
    {};

  const comp =
    match?.matchevent ||
    match?.competition ||
    {};

  return {

    id: String(
      match?.id ??
      match?.match_id ??
      match?.matchId ??
      ""
    ),

    time: Number(
      match?.time ??
      match?.match_time ??
      match?.matchTime ??
      0
    ),

    statusRaw: Number(
      match?.status ??
      match?.match_status ??
      0
    ),

    home:
      home.name_en ||
      home.short_name_en ||
      home.name ||
      home.name_zh ||
      "Home",

    away:
      away.name_en ||
      away.short_name_en ||
      away.name ||
      away.name_zh ||
      "Away",

    homeLogo: safeURL(
      home.logo_rt ||
      home.logo ||
      ""
    ),

    awayLogo: safeURL(
      away.logo_rt ||
      away.logo ||
      ""
    ),

    competition:
      comp.name_en ||
      comp.short_name_en ||
      comp.name ||
      comp.name_zh ||
      "Football",

    competitionLogo: safeURL(
      comp.logo_rt ||
      comp.logo ||
      ""
    )

  };
}

  /* =========================================================
     DOM
  ========================================================= */

  function ensureDOM() {
  let schedule = $(CONFIG.scheduleSelector);

  if (!schedule) {
    schedule = document.createElement("div");
    schedule.id = "ikotvSchedule";
    document.body.appendChild(schedule);
  }

  const tv = document.getElementById("tv");

  if (!tv) {
    console.error("[IKOTV] Element #tv tidak ditemukan.");
  }

  return {
    schedule,
    player: tv
  };
}

  function injectCSS() {
    if (document.getElementById("ikotvStyles")) return;

    const style = document.createElement("style");
    style.id = "ikotvStyles";

    style.textContent = `
      #ikotvSchedule,

/* =========================================================
   IKOTV MPD / AUTO HD CUSTOM LIVE CONTROL
========================================================= */

.iko-mpd-player {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 190px;
  background: #000;
  overflow: hidden;
}

.iko-mpd-player video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  background: #000;
}

.iko-mpd-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 32px 10px 8px;
  background: linear-gradient(
    transparent,
    rgba(0,0,0,.88)
  );
  z-index: 20;
  box-sizing: border-box;
}

.iko-mpd-live {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;

  color: #fff;
  font-size: 9px;
  font-weight: 900;
}

.iko-mpd-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ff3030;

  box-shadow:
    0 0 8px rgba(255,48,48,.8);

  animation: ikoLivePulse 1.2s infinite;
}

@keyframes ikoLivePulse {
  0%,100% {
    opacity: 1;
  }

  50% {
    opacity: .35;
  }
}

.iko-mpd-progress {
  position: relative;
  width: 100%;
  height: 4px;

  margin-bottom: 7px;

  background: rgba(255,255,255,.18);
  border-radius: 10px;

  overflow: hidden;
}

.iko-mpd-progress-buffer {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;

  width: 0%;

  background: rgba(255,255,255,.32);
}

.iko-mpd-progress-live {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;

  width: 100%;

  background: #00d979;
}

.iko-mpd-controls {
  display: flex;
  align-items: center;
  gap: 8px;

  color: #fff;
}

.iko-mpd-btn {
  border: 0;
  background: transparent;
  color: #fff;

  padding: 3px 4px;

  cursor: pointer;

  font-size: 14px;
  line-height: 1;
}

.iko-mpd-btn:hover {
  color: #00d979;
}

.iko-mpd-time {
  flex: 1;

  color: #ddd;

  font-family: monospace;
  font-size: 10px;
  font-weight: 700;

  white-space: nowrap;
}

.iko-mpd-quality {
  padding: 4px 7px;

  border: 1px solid rgba(255,255,255,.2);
  border-radius: 4px;

  background: rgba(0,0,0,.65);
  color: #fff;

  font-size: 9px;
  font-weight: 800;

  cursor: pointer;
}

.iko-mpd-quality:hover {
  border-color: #00d979;
  color: #00d979;
}

.iko-mpd-buffering {
  position: absolute;
  left: 50%;
  top: 50%;

  transform: translate(-50%, -50%);

  display: none;

  color: #fff;

  font-size: 10px;
  font-weight: 800;

  background: rgba(0,0,0,.65);

  padding: 7px 10px;
  border-radius: 5px;
}

.iko-mpd-player.buffering .iko-mpd-buffering {
  display: block;
}

@media (max-width:600px) {

  .iko-mpd-overlay {
    padding: 28px 7px 6px;
  }

  .iko-mpd-controls {
    gap: 4px;
  }

  .iko-mpd-btn {
    font-size: 12px;
  }

  .iko-mpd-time {
    font-size: 8px;
  }

  .iko-mpd-quality {
    font-size: 8px;
    padding: 3px 5px;
  }

}

/* =========================================================
   IKOTV SERVER PANEL
========================================================= */

.iko-server-panel {
  width: 100%;
  margin-top: 9px;
  padding: 8px;

  background: #0b0b0b;

  border: 1px solid rgba(0,217,121,.12);
  border-radius: 7px;

  box-sizing: border-box;
}

.iko-server-title {
  margin-bottom: 7px;

  color: #777;

  font-size: 8px;
  font-weight: 900;

  letter-spacing: .7px;
}

.iko-server-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.iko-live-server {
  padding: 7px 10px;

  border: 1px solid rgba(255,255,255,.08);
  border-radius: 5px;

  background: #202020;
  color: #aaa;

  cursor: pointer;

  font-size: 9px;
  font-weight: 800;

  transition:
    background .15s ease,
    color .15s ease,
    border-color .15s ease;
}

.iko-live-server:hover {
  background: #2c2c2c;
  color: #fff;
}

.iko-live-server.active {
  background: #00d979;
  border-color: #00d979;

  color: #001b0f;
}

.iko-server-loading,
.iko-server-error {
  padding: 8px;

  color: #777;

  font-size: 9px;
  text-align: center;
}

.iko-server-error {
  color: #ff7777;
}
      
/* =========================================================
   IKOTV PLAYER — USE MAIN #tv
========================================================= */

#tv .iko-tv-wrapper {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;

  background: #050505;
  overflow: hidden;
}

/* PLAYER TITLE */

#tv .iko-player-title {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 10px;

  padding: 11px 13px;

  background: #101010;

  border-bottom: 1px solid rgba(255,255,255,.06);

  color: #fff;

  font-size: 12px;
  font-weight: 800;

  box-sizing: border-box;
}

/* ARTPLAYER */

#tv #ikotvArt {
  position: relative;

  width: 100%;

  aspect-ratio: 16 / 9;

  min-height: 0;

  background: #000;

  overflow: hidden;
}

/* SERVER */

#tv .iko-servers {
  display: flex;
  flex-wrap: wrap;

  gap: 6px;

  width: 100%;

  padding: 9px 10px;

  background: #101010;

  box-sizing: border-box;
}

/* NOTE */

#tv .iko-note {
  width: 100%;

  padding: 7px 11px;

  background: #0c0c0c;

  color: #555;

  font-size: 9px;

  box-sizing: border-box;
}

/* =========================================================
   GENERAL
========================================================= */

.iko-box {
  width: 100%;
  box-sizing: border-box;
}

/* =========================================================
   DATE HEADER
========================================================= */

.iko-date {
  position: relative;
  margin: 25px 0 12px;
  padding: 12px 16px;

  background:
    linear-gradient(
      90deg,
      #111,
      #171717
    );

  border: 1px solid rgba(255,255,255,.07);
  border-left: 4px solid #00d979;

  border-radius: 8px;

  color: #fff;
  font-size: 13px;
  font-weight: 800;

  letter-spacing: .5px;
  text-transform: uppercase;

  box-sizing: border-box;
}

/* =========================================================
   MATCH CARD
========================================================= */

.iko-card {
  position: relative;

  width: 100%;
  margin: 10px 0;
  padding: 14px 16px;

  background:
    linear-gradient(
      135deg,
      #0d0d0d 0%,
      #151515 50%,
      #101010 100%
    );

  border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px;

  color: #fff;

  box-sizing: border-box;

  transition:
    transform .2s ease,
    border-color .2s ease,
    box-shadow .2s ease;
}

.iko-card:hover {
  transform: translateY(-1px);
  border-color: rgba(0,217,121,.35);
  box-shadow: 0 8px 25px rgba(0,0,0,.25);
}

/* =========================================================
   COMPETITION
========================================================= */

.iko-comp {
  display: flex;
  align-items: center;

  width: 100%;

  margin-bottom: 14px;
  padding-bottom: 9px;

  border-bottom: 1px solid rgba(255,255,255,.06);

  color: #999;

  font-size: 11px;
  font-weight: 700;

  text-transform: uppercase;

  box-sizing: border-box;
}

.iko-comp img {
  width: 22px;
  height: 22px;

  margin-right: 8px;

  object-fit: contain;
  flex: 0 0 22px;
}

/* =========================================================
   MATCH AREA
========================================================= */

.iko-match {
  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    90px
    minmax(0, 1fr);

  align-items: center;

  gap: 12px;

  width: 100%;
}

/* =========================================================
   TEAMS
========================================================= */

.iko-team {
  display: flex;
  align-items: center;

  min-width: 0;

  gap: 10px;

  font-size: 14px;
  font-weight: 700;

  line-height: 1.25;
}

.iko-team.home {
  justify-content: flex-end;
  text-align: right;
}

.iko-team.away {
  justify-content: flex-start;
  text-align: left;
}

.iko-team span {
  overflow-wrap: anywhere;
}

.iko-team img {
  width: 44px;
  height: 44px;

  padding: 3px;

  object-fit: contain;

  background: rgba(255,255,255,.03);

  border-radius: 8px;

  box-sizing: border-box;

  flex: 0 0 44px;
}

/* =========================================================
   CENTER
========================================================= */

.iko-center {
  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  text-align: center;

  min-width: 0;
}

/* KICKOFF TIME */

.iko-time {
  color: #fff;

  font-size: 20px;
  font-weight: 900;

  line-height: 1;

  white-space: nowrap;

  letter-spacing: .3px;
}

/* VS */

.iko-vs {
  margin-top: 5px;

  color: #555;

  font-size: 9px;
  font-weight: 700;

  letter-spacing: 1px;
}

/* =========================================================
   STATUS
========================================================= */

.iko-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 60px;

  margin-top: 7px;
  padding: 4px 8px;

  border-radius: 5px;

  font-size: 8px;
  font-weight: 900;

  letter-spacing: .5px;

  box-sizing: border-box;
}

.iko-status.upcoming {
  background: #292929;
  color: #aaa;
}

.iko-status.live {
  background: #00d979;
  color: #001b0f;

  box-shadow:
    0 0 12px rgba(0,217,121,.25);
}

.iko-status.ended {
  background: #1d1d1d;
  color: #555;
}

/* =========================================================
   COUNTDOWN
========================================================= */

.iko-countdown {
  margin-top: 7px;

  color: #00d979;

  font-family:
    "Courier New",
    monospace;

  font-size: 11px;
  font-weight: 800;

  letter-spacing: .5px;

  white-space: nowrap;
}

/* =========================================================
   BUTTON
========================================================= */

.iko-action {
  width: 100%;

  margin-top: 14px;
}

.iko-watch {
  display: block;

  width: 100%;

  padding: 10px 14px;

  border: 0;
  border-radius: 7px;

  background: #00d979;
  color: #001b0f;

  cursor: pointer;

  font-size: 11px;
  font-weight: 900;

  letter-spacing: .3px;

  transition:
    opacity .2s ease,
    transform .15s ease;
}

.iko-watch:hover {
  opacity: .88;
}

.iko-watch:active {
  transform: scale(.99);
}

.iko-watch.disabled {
  background: #202020;
  color: #555;

  cursor: not-allowed;
}

/* =========================================================
   PLAYER TITLE
========================================================= */

.iko-player-title {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 10px;

  padding: 11px 13px;

  background: #101010;

  border-bottom: 1px solid rgba(255,255,255,.06);

  color: #fff;

  font-size: 12px;
  font-weight: 800;

  box-sizing: border-box;
}

.iko-close {
  padding: 6px 10px;

  border: 0;
  border-radius: 5px;

  background: #242424;
  color: #aaa;

  cursor: pointer;

  font-size: 9px;
  font-weight: 800;
}

.iko-close:hover {
  background: #333;
  color: #fff;
}

/* =========================================================
   SERVER BUTTONS
========================================================= */

.iko-servers {
  display: flex;
  flex-wrap: wrap;

  gap: 6px;

  padding: 9px 10px;

  background: #101010;

  box-sizing: border-box;
}

.iko-server {
  padding: 7px 11px;

  border: 1px solid rgba(255,255,255,.08);
  border-radius: 5px;

  background: #202020;
  color: #aaa;

  cursor: pointer;

  font-size: 10px;
  font-weight: 800;

  transition:
    background .2s ease,
    color .2s ease;
}

.iko-server:hover {
  background: #2c2c2c;
  color: #fff;
}

.iko-server.active {
  background: #00d979;
  border-color: #00d979;

  color: #001b0f;
}

/* =========================================================
   NOTE
========================================================= */

.iko-note {
  padding: 7px 11px;

  background: #0c0c0c;

  color: #555;

  font-size: 9px;

  box-sizing: border-box;
}

/* =========================================================
   LOADING / ERROR / EMPTY
========================================================= */

.iko-loading,
.iko-error,
.iko-empty {
  width: 100%;

  padding: 25px 15px;

  background: #111;

  border: 1px solid rgba(255,255,255,.07);
  border-radius: 10px;

  color: #aaa;

  text-align: center;

  font-size: 12px;

  box-sizing: border-box;
}

.iko-error {
  color: #ff7777;
}

/* =========================================================
   LIVE CARD
========================================================= */

.iko-card.live {
  border-color: rgba(0,217,121,.18);
}

.iko-card.live .iko-comp {
  color: #aaa;
}

/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 600px) {

  #ikotvSchedule,
  #ikotvPlayer {
    width: 100%;
    margin: 12px auto;
  }

  .iko-date {
    margin: 18px 0 9px;

    padding: 10px 12px;

    font-size: 11px;
  }

  .iko-card {
    margin: 8px 0;
    padding: 12px 10px;

    border-radius: 10px;
  }

  .iko-comp {
    margin-bottom: 11px;

    padding-bottom: 8px;

    font-size: 9px;
  }

  .iko-comp img {
    width: 19px;
    height: 19px;

    flex-basis: 19px;
  }

  .iko-match {
    grid-template-columns:
      minmax(0, 1fr)
      62px
      minmax(0, 1fr);

    gap: 5px;
  }

  .iko-team {
    gap: 6px;

    font-size: 11px;
  }

  .iko-team img {
    width: 34px;
    height: 34px;

    flex-basis: 34px;

    padding: 2px;

    border-radius: 6px;
  }

  .iko-time {
    font-size: 16px;
  }

  .iko-vs {
    margin-top: 4px;

    font-size: 8px;
  }

  .iko-status {
    min-width: 52px;

    margin-top: 5px;
    padding: 3px 5px;

    font-size: 7px;
  }

  .iko-countdown {
    margin-top: 5px;

    font-size: 9px;
  }

  .iko-action {
    margin-top: 11px;
  }

  .iko-watch {
    padding: 9px 10px;

    font-size: 9px;
  }

  .iko-player-title {
    padding: 9px 10px;

    font-size: 10px;
  }

  .iko-server {
    padding: 6px 9px;

    font-size: 9px;
  }

  #ikotvArt {
    height: 56.25vw;
    min-height: 190px;
  }
}

/* =========================================================
   VERY SMALL SCREEN
========================================================= */

@media (max-width: 380px) {

  .iko-match {
    grid-template-columns:
      minmax(0, 1fr)
      54px
      minmax(0, 1fr);
  }

  .iko-team {
    font-size: 10px;
  }

  .iko-team img {
    width: 30px;
    height: 30px;

    flex-basis: 30px;
  }

  .iko-time {
    font-size: 14px;
  }

  .iko-status {
    min-width: 48px;

    font-size: 6.5px;
  }

  .iko-countdown {
    font-size: 8px;
  }
}


/* =========================================================
   IKOTV COMPACT OVERRIDE perbaikan
========================================================= */

.iko-card {
  padding: 10px 12px !important;
  margin: 7px 0 !important;
  border-radius: 9px !important;
}

.iko-comp {
  margin-bottom: 8px !important;
  padding-bottom: 6px !important;
  font-size: 9px !important;
}

.iko-comp img {
  width: 16px !important;
  height: 16px !important;
  flex: 0 0 16px !important;
  margin-right: 5px !important;
}

/* MATCH GRID */
.iko-match {
  grid-template-columns: minmax(0, 1fr) 58px minmax(0, 1fr) !important;
  gap: 6px !important;
}

/* TEAM */
.iko-team {
  gap: 6px !important;
  font-size: 11px !important;
  line-height: 1.15 !important;
}

/* LOGO KLUB — KECIL */
.iko-team img {
  width: 30px !important;
  height: 30px !important;
  flex: 0 0 30px !important;

  padding: 2px !important;

  border-radius: 5px !important;

  background: transparent !important;
}

/* TIME */
.iko-time {
  font-size: 15px !important;
  line-height: 1 !important;
}

/* VS */
.iko-vs {
  margin-top: 3px !important;
  font-size: 7px !important;
}

/* STATUS */
.iko-status {
  min-width: 48px !important;

  margin-top: 4px !important;
  padding: 3px 5px !important;

  font-size: 7px !important;
}

/* COUNTDOWN */
.iko-countdown {
  margin-top: 4px !important;
  font-size: 9px !important;
}

/* BUTTON */
.iko-action {
  margin-top: 9px !important;
}

.iko-watch {
  padding: 8px 10px !important;
  border-radius: 6px !important;
  font-size: 9px !important;
}

/* DATE */
.iko-date {
  margin: 15px 0 7px !important;
  padding: 8px 11px !important;

  font-size: 10px !important;

  border-left-width: 3px !important;
}

/* MOBILE */
@media (max-width: 600px) {

  .iko-card {
    padding: 9px 8px !important;
  }

  .iko-match {
    grid-template-columns:
      minmax(0, 1fr)
      52px
      minmax(0, 1fr) !important;

    gap: 4px !important;
  }

  .iko-team {
    gap: 4px !important;
    font-size: 10px !important;
  }

  .iko-team img {
    width: 26px !important;
    height: 26px !important;
    flex: 0 0 26px !important;
  }

  .iko-time {
    font-size: 13px !important;
  }

  .iko-vs {
    font-size: 6px !important;
  }

  .iko-status {
    min-width: 44px !important;
    font-size: 6px !important;
    padding: 2px 4px !important;
  }

  .iko-countdown {
    font-size: 8px !important;
  }

  .iko-watch {
    padding: 7px 8px !important;
    font-size: 8px !important;
  }
}


    `;

    document.head.appendChild(style);
  }


  
  /* =========================================================
     LOAD EXTERNAL LIBRARIES
  ========================================================= */

  function loadScript(src, test) {
    return new Promise((resolve, reject) => {
      if (test && test()) {
        resolve();
        return;
      }

      const existing = [...document.scripts].find(
        s => s.src === src
      );

      if (existing) {
        existing.addEventListener(
          "load",
          () => resolve(),
          { once: true }
        );

        existing.addEventListener(
          "error",
          () => reject(
            new Error("Gagal memuat " + src)
          ),
          { once: true }
        );

        return;
      }

      const script = document.createElement("script");

      script.src = src;
      script.async = false;

      script.onload = () => resolve();

      script.onerror = () =>
        reject(
          new Error("Gagal memuat " + src)
        );

      document.head.appendChild(script);
    });
  }

  async function loadLibraries() {
    await loadScript(
      CONFIG.artplayer,
      () => typeof window.Artplayer !== "undefined"
    );

    await loadScript(
      CONFIG.hls,
      () => typeof window.Hls !== "undefined"
    );

    await loadScript(
      CONFIG.hlsQuality,
      () =>
        typeof window.artplayerPluginHlsQuality !== "undefined"
    );
  }

  /* =========================================================
     API
  ========================================================= */

  async function postJSON(url, body) {

  console.log("[IKOTV] REQUEST:", url);
  console.log("[IKOTV] BODY:", body);

  const controller = new AbortController();

  // Jangan biarkan HP stuck "Loading..." selamanya
  const timeout = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {

    const response = await fetch(
      url + (url.includes("?") ? "&" : "?") + "_=" + Date.now(),
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        body: JSON.stringify(body),

        mode: "cors",

        cache: "no-store",

        signal: controller.signal
      }
    );

    console.log(
      "[IKOTV] STATUS:",
      response.status
    );

    const text = await response.text();

    console.log(
      "[IKOTV] RESPONSE:",
      text
    );

    if (!response.ok) {

      throw new Error(
        "HTTP " +
        response.status +
        " - " +
        text.substring(0, 200)
      );

    }

    if (!text) {
      throw new Error("Response API kosong");
    }

    try {

      return JSON.parse(text);

    } catch (error) {

      throw new Error(
        "Response API bukan JSON: " +
        text.substring(0, 200)
      );

    }

  } catch (error) {

    if (error.name === "AbortError") {

      throw new Error(
        "Request timeout 30 detik"
      );

    }

    console.error(
      "[IKOTV] FETCH ERROR:",
      error
    );

    throw error;

  } finally {

    clearTimeout(timeout);

  }
}

  async function fetchMatches() {

  console.log("[IKOTV] Mengambil ALL + LIVE...");

  const [allResult, liveResult] =
    await Promise.all([

      // ==========================
      // SEMUA JADWAL
      // ==========================
      postJSON(
        CONFIG.api.matches,
        {
          date: null,
          filter: "all",
          sport: "football"
        }
      ),

      // ==========================
      // MATCH YANG SEDANG LIVE
      // ==========================
      postJSON(
        CONFIG.api.matches,
        {
          date: null,
          filter: "live",
          sport: "football"
        }
      )

    ]);

  console.log(
    "[IKOTV] ALL:",
    allResult
  );

  console.log(
    "[IKOTV] LIVE:",
    liveResult
  );

  // ==========================
  // PARSE ALL
  // ==========================

  const allMatches =
    getArray(allResult)
      .map(normalizeMatch)
      .filter(
        match =>
          match.id &&
          match.time > 0
      );

  // ==========================
  // PARSE LIVE
  // ==========================

  const liveMatches =
    getArray(liveResult)
      .map(normalizeMatch)
      .filter(
        match =>
          match.id &&
          match.time > 0
      );

  console.log(
    "[IKOTV] ALL COUNT:",
    allMatches.length
  );

  console.log(
    "[IKOTV] LIVE COUNT:",
    liveMatches.length
  );

  // ==========================
  // GABUNG ALL + LIVE
  // ==========================

  const merged =
    new Map();

  // Masukkan semua jadwal
  allMatches.forEach(match => {

    merged.set(
      String(match.id),
      match
    );

  });

  // Masukkan LIVE
  // Kalau pertandingan sudah hilang
  // dari ALL tetapi muncul di LIVE,
  // pertandingan tersebut tetap masuk.
  liveMatches.forEach(match => {

    const id =
      String(match.id);

    if (merged.has(id)) {

      // Pertahankan data jadwal
      // tetapi gunakan informasi terbaru
      // dari LIVE jika tersedia.

      const old =
        merged.get(id);

      merged.set(id, {
        ...old,
        ...match
      });

    } else {

      // Match hanya ada di LIVE
      // tetap masukkan ke jadwal.

      merged.set(
        id,
        match
      );

    }

  });

  const result =
    Array.from(
      merged.values()
    )
    .filter(
      match =>
        match.id &&
        match.time > 0
    )
    .sort(
      (a, b) =>
        a.time - b.time
    );

  console.log(
    "[IKOTV] MERGED COUNT:",
    result.length
  );

  console.log(
    "[IKOTV] MERGED MATCHES:",
    result
  );

  return result;
}

  async function fetchMatchInfo(matchId) {
    const result = await postJSON(
      CONFIG.api.matchInfo,
      {
        matchid: String(matchId),
        sport: "football"
      }
    );

    console.log(
      "[IKOTV] match-info:",
      result
    );

    return result;
  }

  async function fetchStreamURL(matchId) {
    const result = await postJSON(
      CONFIG.api.streamUrl,
      {
        matchid: String(matchId),
        sport: "football"
      }
    );

    console.log(
      "[IKOTV] stream-url:",
      result
    );

    return result;
  }

function isAutoHDMPD(videoData = {}, url = "") {

  const text = [
    videoData?.name,
    videoData?.display_name,
    videoData?.type_name,
    url
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    text.includes("auto hd") ||
    text.includes("auto-hd") ||
    text.includes("mpd") ||
    text.includes(".mpd") ||
    text.includes("?mpd=")
  );
}
  
  /* =========================================================
   IKOTV SHAKA PLAYER → #tv
========================================================= */

let ikotvShakaPlayer = null;
let ikotvVideo = null;

async function playIKOTVStream(url, videoData = {}) {

  if (!url) {
    console.warn("[IKOTV] URL kosong");
    return;
  }

  const tv = document.getElementById("tv");

  if (!tv) {
    console.error("[IKOTV] #tv tidak ditemukan");
    return;
  }

  console.log("[IKOTV] RAW STREAM URL:", url);
  console.log("[IKOTV] VIDEO DATA:", videoData);

  /* ==========================================
     HAPUS PLAYER SEBELUMNYA
  ========================================== */

  try {

    if (ikotvShakaPlayer) {
      await ikotvShakaPlayer.destroy();
      ikotvShakaPlayer = null;
    }

  } catch (error) {

    console.warn(
      "[IKOTV] Gagal destroy Shaka:",
      error
    );

  }

  const isMPD =
    isAutoHDMPD(videoData, url);

  console.log(
    "[IKOTV] AUTO HD / MPD:",
    isMPD
  );

  /* ==========================================
     BUAT PLAYER KHUSUS MPD
  ========================================== */

  tv.innerHTML = `
    <div class="iko-mpd-player" id="ikoMpdPlayer">

      <video
        id="ikotvVideo"
        autoplay
        playsinline
        preload="auto"
      ></video>

      <div class="iko-mpd-buffering">
        BUFFERING...
      </div>

      <div class="iko-mpd-overlay">

        <div class="iko-mpd-live">
          <span class="iko-mpd-live-dot"></span>
          <span>LIVE</span>
        </div>

        <div class="iko-mpd-progress">

          <div
            class="iko-mpd-progress-buffer"
            id="ikoMpdBuffer"
          ></div>

          <div
            class="iko-mpd-progress-live"
            id="ikoMpdProgress"
          ></div>

        </div>

        <div class="iko-mpd-controls">

          <button
            type="button"
            class="iko-mpd-btn"
            id="ikoMpdPlay"
          >
            ▶
          </button>

          <button
            type="button"
            class="iko-mpd-btn"
            id="ikoMpdMute"
          >
            🔊
          </button>

          <div
            class="iko-mpd-time"
            id="ikoMpdTime"
          >
            LIVE 00:00:00
          </div>

          <button
            type="button"
            class="iko-mpd-quality"
            id="ikoMpdQuality"
          >
            AUTO HD
          </button>

          <button
            type="button"
            class="iko-mpd-btn"
            id="ikoMpdFullscreen"
          >
            ⛶
          </button>

        </div>

      </div>

    </div>
  `;

  ikotvVideo =
    document.getElementById("ikotvVideo");

  const mpdPlayer =
    document.getElementById("ikoMpdPlayer");

  const playButton =
    document.getElementById("ikoMpdPlay");

  const muteButton =
    document.getElementById("ikoMpdMute");

  const fullscreenButton =
    document.getElementById("ikoMpdFullscreen");

  const timeElement =
    document.getElementById("ikoMpdTime");

  const qualityElement =
    document.getElementById("ikoMpdQuality");

  const bufferElement =
    document.getElementById("ikoMpdBuffer");

  /* ==========================================
     PLAYER CONTROLS
  ========================================== */

  playButton.onclick = () => {

    if (ikotvVideo.paused) {

      ikotvVideo.play()
        .catch(() => {});

    } else {

      ikotvVideo.pause();

    }

  };

  ikotvVideo.addEventListener(
    "play",
    () => {

      playButton.textContent = "❚❚";

    }
  );

  ikotvVideo.addEventListener(
    "pause",
    () => {

      playButton.textContent = "▶";

    }
  );

  muteButton.onclick = () => {

    ikotvVideo.muted =
      !ikotvVideo.muted;

    muteButton.textContent =
      ikotvVideo.muted
        ? "🔇"
        : "🔊";

  };

  fullscreenButton.onclick = () => {

    if (document.fullscreenElement) {

      document.exitFullscreen()
        .catch(() => {});

    } else {

      mpdPlayer.requestFullscreen()
        .catch(() => {});

    }

  };

  /* ==========================================
     BUFFERING
  ========================================== */

  ikotvVideo.addEventListener(
    "waiting",
    () => {

      mpdPlayer.classList.add(
        "buffering"
      );

    }
  );

  ikotvVideo.addEventListener(
    "playing",
    () => {

      mpdPlayer.classList.remove(
        "buffering"
      );

    }
  );

  ikotvVideo.addEventListener(
    "canplay",
    () => {

      mpdPlayer.classList.remove(
        "buffering"
      );

    }
  );

  /* ==========================================
     CEK SHAKA
  ========================================== */

  if (
    typeof window.shaka === "undefined"
  ) {

    console.error(
      "[IKOTV] Shaka Player belum tersedia"
    );

    return;
  }

  try {

    shaka.polyfill.installAll();

    if (
      !shaka.Player.isBrowserSupported()
    ) {

      throw new Error(
        "Browser tidak mendukung Shaka Player"
      );

    }

    /* ==========================================
       PARSE URL
    ========================================== */

    let streamURL =
      safeURL(url);

    let keyId = null;
    let key = null;

    try {

      const parsedURL =
        new URL(
          url,
          window.location.href
        );

      const mpd =
        parsedURL.searchParams.get(
          "mpd"
        );

      const parsedKeyId =
        parsedURL.searchParams.get(
          "keyId"
        );

      const parsedKey =
        parsedURL.searchParams.get(
          "key"
        );

      if (mpd) {

        streamURL =
          decodeURIComponent(mpd);

        keyId =
          parsedKeyId;

        key =
          parsedKey;

        console.log(
          "[IKOTV] DASH MPD:",
          streamURL
        );

      }

    } catch (parseError) {

      console.warn(
        "[IKOTV] Gagal parsing URL:",
        parseError
      );

    }

    if (!streamURL) {

      throw new Error(
        "URL stream tidak valid"
      );

    }

    /* ==========================================
       BUAT SHAKA
    ========================================== */

    ikotvShakaPlayer =
      new shaka.Player(
        ikotvVideo
      );

    /* ==========================================
       CLEARKEY
    ========================================== */

    if (keyId && key) {

      ikotvShakaPlayer.configure({

        drm: {

          clearKeys: {

            [keyId]: key

          }

        }

      });

    }

    /* ==========================================
       SHAKA ERROR
    ========================================== */

    ikotvShakaPlayer.addEventListener(
      "error",
      event => {

        console.error(
          "[IKOTV] SHAKA ERROR:",
          event.detail
        );

      }
    );

    /* ==========================================
       LOAD
    ========================================== */

    await ikotvShakaPlayer.load(
      streamURL
    );

    console.log(
      "[IKOTV] SHAKA PLAYING:",
      streamURL
    );

    /* ==========================================
       RESOLUTION
    ========================================== */

    try {

      const tracks =
        ikotvShakaPlayer.getVariantTracks();

      const activeTrack =
        tracks.find(
          track =>
            track.active
        );

      if (activeTrack?.height) {

        qualityElement.textContent =
          `${activeTrack.height}p`;

      } else {

        qualityElement.textContent =
          "AUTO HD";

      }

    } catch (_) {

      qualityElement.textContent =
        "AUTO HD";

    }

    /* ==========================================
       LIVE TIMER
    ========================================== */

    let liveStart = null;

    function formatLiveTime(seconds) {

      seconds =
        Math.max(
          0,
          Math.floor(seconds || 0)
        );

      const h =
        Math.floor(
          seconds / 3600
        );

      const m =
        Math.floor(
          (seconds % 3600) / 60
        );

      const s =
        seconds % 60;

      return [
        String(h).padStart(2, "0"),
        String(m).padStart(2, "0"),
        String(s).padStart(2, "0")
      ].join(":");

    }

    function updateLiveUI() {

      if (!ikotvVideo)
        return;

      /*
       * Jangan gunakan duration sebagai
       * timer LIVE.
       *
       * duration MPD bisa sangat besar
       * sehingga muncul seperti 34435:54.
       */

      const current =
        Number(
          ikotvVideo.currentTime
        );

      if (
        liveStart === null &&
        Number.isFinite(current)
      ) {

        liveStart = current;

      }

      const elapsed =
        Number.isFinite(current) &&
        liveStart !== null
          ? current - liveStart
          : 0;

      timeElement.textContent =
        "LIVE " +
        formatLiveTime(elapsed);

      /*
       * Live stream tidak punya
       * progress menuju END.
       *
       * Jadi progress dibuat penuh.
       */

      const seekable =
        ikotvVideo.seekable;

      if (
        seekable &&
        seekable.length
      ) {

        const end =
          seekable.end(
            seekable.length - 1
          );

        const start =
          seekable.start(0);

        const range =
          end - start;

        if (
          range > 0 &&
          Number.isFinite(
            current
          )
        ) {

          const percent =
            Math.max(
              0,
              Math.min(
                100,
                (
                  (current - start) /
                  range
                ) * 100
              )
            );

          document
            .getElementById(
              "ikoMpdProgress"
            )
            .style.width =
            percent + "%";

        }

      }

      requestAnimationFrame(
        updateLiveUI
      );

    }

    updateLiveUI();

    /* ==========================================
       BUFFER BAR
    ========================================== */

    ikotvVideo.addEventListener(
      "progress",
      () => {

        try {

          if (
            !ikotvVideo.buffered.length
          )
            return;

          const bufferedEnd =
            ikotvVideo.buffered.end(
              ikotvVideo.buffered.length - 1
            );

          const current =
            ikotvVideo.currentTime;

          const buffered =
            bufferedEnd - current;

          /*
           * Maksimal visual buffer
           * 30 detik.
           */

          const percent =
            Math.max(
              0,
              Math.min(
                100,
                (buffered / 30) * 100
              )
            );

          bufferElement.style.width =
            percent + "%";

        } catch (_) {}

      }
    );

    /* ==========================================
       AUTOPLAY
    ========================================== */

    ikotvVideo
      .play()
      .catch(error => {

        console.warn(
          "[IKOTV] Autoplay diblokir:",
          error
        );

      });

  } catch (error) {

    console.error(
      "[IKOTV] SHAKA LOAD ERROR:",
      error
    );

    console.error(
      "[IKOTV] ERROR NAME:",
      error?.name
    );

    console.error(
      "[IKOTV] ERROR MESSAGE:",
      error?.message
    );

    tv.innerHTML = `
      <div style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:100%;
        height:100%;
        min-height:250px;
        background:#000;
        color:#ff7777;
        font-family:Arial;
        font-size:13px;
        text-align:center;
        padding:20px;
        box-sizing:border-box;
      ">
        Gagal memuat stream IKOTV.
      </div>
    `;

  }

}
  
  
  /* =========================================================
     SCHEDULE RENDER
  ========================================================= */

  function renderSchedule() {
    const { schedule } = ensureDOM();

    if (!matches.length) {
      schedule.innerHTML = `
        <div class="iko-empty">
          Tidak ada jadwal IKOTV.
        </div>
      `;
      return;
    }

    const groups = {};

    matches.forEach(match => {
      const key = dateKey(match.time);

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(match);
    });

    let html = "";

    Object.keys(groups)
      .sort()
      .forEach(key => {
        const group = groups[key];

        html += `
          <div class="iko-box">
            <div class="iko-date">
              ${escapeHTML(
                formatDate(group[0].time)
              )}
            </div>
        `;

        group.forEach(match => {
          const status = getStatus(match);

          let statusText = "UPCOMING";
          let button = "";
          let liveClass = "";

          if (status === "live") {
            statusText = "LIVE";
            liveClass = "live";

            button = `
              <button
                class="iko-watch"
                data-ikotv-watch="${escapeHTML(match.id)}"
              >
                WATCH LIVE
              </button>
            `;
          } else if (status === "ended") {
            statusText = "ENDED";

            button = `
  <button
    class="iko-watch disabled"
    disabled
  >
    WAITING FOR KICKOFF
  </button>
`;
          } else {
            const cd = countdown(match.time);

            statusText = "UPCOMING";

            button = `
              <button
                class="iko-watch disabled"
                disabled
              >
                 WAITING FOR KICKOFF
              </button>
            `;
          }

          const cd =
            status === "upcoming"
              ? countdown(match.time)
              : "";

          const homeLogo =
            match.homeLogo
              ? `
                <img
                  src="${escapeHTML(match.homeLogo)}"
                  alt=""
                  loading="lazy"
                >
              `
              : "";

          const awayLogo =
            match.awayLogo
              ? `
                <img
                  src="${escapeHTML(match.awayLogo)}"
                  alt=""
                  loading="lazy"
                >
              `
              : "";

          const compLogo =
            match.competitionLogo
              ? `
                <img
                  src="${escapeHTML(match.competitionLogo)}"
                  alt=""
                  loading="lazy"
                >
              `
              : "";

          html += `
            <div
  class="iko-card ${liveClass}"
  data-ikotv-match="${escapeHTML(match.id)}"
>

              <div class="iko-comp">
                ${compLogo}
                <span>
                  ${escapeHTML(match.competition)}
                </span>
              </div>

              <div class="iko-match">

                <div class="iko-team home">
                  <span>
                    ${escapeHTML(match.home)}
                  </span>
                  ${homeLogo}
                </div>

                <div class="iko-center">

                  <div class="iko-time">
                    ${escapeHTML(
                      formatTime(match.time)
                    )}
                  </div>

                  <div class="iko-vs">
                    VS
                  </div>

                  <div class="iko-status ${status}">
                    ${statusText}
                  </div>

                  ${
                    cd
                      ? `
                        <div class="iko-countdown">
                          ${cd}
                        </div>
                      `
                      : ""
                  }

                </div>

                <div class="iko-team away">
                  ${awayLogo}

                  <span>
                    ${escapeHTML(match.away)}
                  </span>
                </div>

              </div>

              <div class="iko-action">
                ${button}
              </div>

            </div>
          `;
        });

        html += `
          </div>
        `;
      });

    schedule.innerHTML = html;

    schedule
      .querySelectorAll("[data-ikotv-watch]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            openIKOMatch(
              button.dataset.ikotvWatch
            );
          }
        );
      });
  }

  /* =========================================================
     PLAYER UI
  ========================================================= */

  function showPlayer(match, videos) {

  const tv = document.getElementById("tv");

  if (!tv) {
    console.error("[IKOTV] Element #tv tidak ditemukan");
    return;
  }

  const validVideos = videos.filter(
    v => safeURL(v.url)
  );

  currentVideos = validVideos;

  const title =
    `${match.home} vs ${match.away}`;

  /*
   * IKOTV MENGGUNAKAN TV UTAMA
   */
  tv.innerHTML = `
    <div class="iko-tv-wrapper">

      <div class="iko-player-title">

        <span>
          ${escapeHTML(title)}
        </span>

        <button
          class="iko-close"
          id="ikoClosePlayer"
        >
          CLOSE
        </button>

      </div>

      <div id="ikotvArt"></div>

      <div
        class="iko-servers"
        id="ikoServers"
      ></div>

      <div class="iko-note">
        IKOTV • ArtPlayer • HLS
      </div>

    </div>
  `;

  const closeButton =
    document.getElementById("ikoClosePlayer");

  if (closeButton) {

    closeButton.onclick = () => {

      if (art) {

        try {
          art.destroy(false);
        } catch (_) {}

        art = null;
      }

      currentMatchId = null;
      currentVideos = [];

      /*
       * Kosongkan TV
       */
      tv.innerHTML = "";
    };

  }

  renderServers();

  /*
   * MAIN TV
   */
  playVideo(
    validVideos[0]?.url || "",
    validVideos[0]
  );
}

  function renderServers(activeIndex = 0) {
    const box = $("#ikoServers");

    if (!box) return;

    if (!currentVideos.length) {
      box.innerHTML = "";
      return;
    }

    box.innerHTML =
      currentVideos
        .map((video, index) => {

          const label =
            video.display_name ||
            video.name ||
            video.type_name ||
            `SERVER ${index + 1}`;

          return `
            <button
              class="iko-server ${
                index === activeIndex
                  ? "active"
                  : ""
              }"
              data-iko-server="${index}"
            >
              ${escapeHTML(label)}
            </button>
          `;
        })
        .join("");

    box
      .querySelectorAll(
        "[data-iko-server]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset.ikoServer
              );

            renderServers(index);

            playVideo(
              currentVideos[index].url,
              currentVideos[index]
            );
          }
        );

      });
  }
    /* =========================================================
     VIDEO PLAYER
  ========================================================= */

  async function playVideo(url, videoData = {}) {
    const container = $("#ikotvArt");

    if (!container) return;

    const streamURL = safeURL(url);

    if (!streamURL) {
      container.innerHTML = `
        <div class="iko-error">
          URL stream tidak valid.
        </div>
      `;
      return;
    }

    if (art) {
      try {
        art.destroy(false);
      } catch (_) {}

      art = null;
    }

    container.innerHTML = "";

    try {
      const options = {
        container: container,
        url: streamURL,
        autoplay: true,
        muted: false,
        volume: 0.8,
        fullscreen: true,
        fullscreenWeb: true,
        pip: true,
        screenshot: false,
        setting: true,
        playbackRate: true,
        hotkey: true,
        mutex: true,
        miniProgressBar: false,
        theme: "#00c878",
        lang: "en",
        moreVideoAttr: {
          playsInline: true,
          preload: "auto"
        }
      };

      if (
        typeof window.Hls !== "undefined" &&
        window.Hls.isSupported()
      ) {
        options.customType = function(video, url) {
          const hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });

          hls.loadSource(url);
          hls.attachMedia(video);

          hls.on(
            window.Hls.Events.MANIFEST_PARSED,
            () => {
              video.play().catch(() => {});
            }
          );

          video.addEventListener(
            "error",
            () => {
              console.warn(
                "[IKOTV] Video error",
                video.error
              );
            }
          );
        };
      }

      art = new window.Artplayer(options);

      art.on(
        "ready",
        () => {
          console.log(
            "[IKOTV] ArtPlayer ready"
          );
        }
      );

      art.on(
        "error",
        error => {
          console.warn(
            "[IKOTV] ArtPlayer error:",
            error
          );
        }
      );

    } catch (error) {

      console.error(
        "[IKOTV] Player error:",
        error
      );

      container.innerHTML = `
        <div class="iko-error">
          Gagal memuat player.
        </div>
      `;
    }
  }

/* =========================================================
   OPEN IKOTV MATCH
   SERVER LIST DI BAWAH MATCH
========================================================= */

async function openIKOMatch(matchId) {

  const id = String(matchId || "");

  if (!id) return;

  const match = matches.find(
    item => String(item.id) === id
  );

  if (!match) {
    console.warn(
      "[IKOTV] Match tidak ditemukan:",
      id
    );
    return;
  }

  const card = document.querySelector(
    `[data-ikotv-match="${CSS.escape(id)}"]`
  );

  if (!card) {
    console.warn(
      "[IKOTV] Card match tidak ditemukan:",
      id
    );
    return;
  }

  /* ==========================================
     JIKA SERVER SUDAH TERBUKA → TUTUP
  ========================================== */

  const existing = card.querySelector(
    ".iko-server-panel"
  );

  if (existing) {
    existing.remove();
    return;
  }

  /* ==========================================
     LOADING SERVER
  ========================================== */

  const panel = document.createElement("div");

  panel.className = "iko-server-panel";

  panel.innerHTML = `
    <div class="iko-server-loading">
      Loading server...
    </div>
  `;

  card.appendChild(panel);

  console.log(
    "[IKOTV] Mengambil server untuk match:",
    id
  );

  await testMatchInfo(id);

  try {

    /* ==========================================
       REQUEST STREAM URL
    ========================================== */

    const result = await fetchStreamURL(id);

    console.log(
      "[IKOTV] STREAM-URL RESULT:",
      result
    );

    /* ==========================================
       PARSE SERVER
    ========================================== */

    const videos = extractVideos(result);

    console.log(
      "[IKOTV] EXTRACTED VIDEOS:",
      videos
    );

    /* ==========================================
       SERVER TIDAK DITEMUKAN
    ========================================== */

    if (!videos.length) {

      panel.innerHTML = `
        <div class="iko-server-error">
          Server stream tidak tersedia.
        </div>
      `;

      console.warn(
        "[IKOTV] Tidak ada server ditemukan.",
        result
      );

      return;
    }

    /* ==========================================
       RENDER SERVER
    ========================================== */

    panel.innerHTML = `
      <div class="iko-server-title">
        LIVE SERVER
      </div>

      <div class="iko-server-list">

        ${videos.map((video, index) => {

          const label =
            video.display_name ||
            video.name ||
            video.type_name ||
            `LIVE ${index + 1}`;

          return `
            <button
              type="button"
              class="iko-live-server"
              data-iko-stream="${index}"
            >
              ${escapeHTML(label)}
            </button>
          `;

        }).join("")}

      </div>
    `;

    /* ==========================================
       SERVER BUTTON EVENT
    ========================================== */

    panel
      .querySelectorAll("[data-iko-stream]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset.ikoStream
              );

            const video =
              videos[index];

            if (!video) {
              console.warn(
                "[IKOTV] Video server tidak ditemukan:",
                index
              );
              return;
            }

            panel
              .querySelectorAll(
                ".iko-live-server"
              )
              .forEach(btn => {
                btn.classList.remove("active");
              });

            button.classList.add("active");

            console.log(
              "[IKOTV] Memutar server:",
              video
            );

            playIKOTVStream(
              video.url,
              video
             );

          }
        );

      });

  } catch (error) {

    /*
     * JANGAN RENDER ULANG JADWAL DI SINI.
     * Hanya ubah isi panel server.
     */

    console.error(
      "[IKOTV] SERVER REQUEST ERROR:",
      error
    );

    console.error(
      "[IKOTV] ERROR NAME:",
      error?.name
    );

    console.error(
      "[IKOTV] ERROR MESSAGE:",
      error?.message
    );

    console.error(
      "[IKOTV] MATCH ID:",
      id
    );

    /*
     * Pastikan panel masih ada.
     */
    if (panel && panel.isConnected) {

      panel.innerHTML = `
        <div class="iko-server-error">
          Gagal mengambil server IKOTV.
        </div>
      `;

    }

  }

}
  /* =========================================================
     STREAM RESPONSE PARSER
  ========================================================= */

  function extractVideos(result) {
    const videos = [];

    function addVideo(item, fallbackName = "") {

      if (!item) return;

      if (typeof item === "string") {

        const url = safeURL(item);

        if (url) {
          videos.push({
            url: url,
            name: fallbackName
          });
        }

        return;
      }

      if (typeof item !== "object") {
        return;
      }

      const url =
        item.url ||
        item.play_url ||
        item.playUrl ||
        item.stream_url ||
        item.streamUrl ||
        item.m3u8 ||
        item.src ||
        item.file ||
        item.link ||
        "";

      const validURL =
        safeURL(url);

      if (!validURL) return;

      videos.push({
        url: validURL,

        name:
          item.name ||
          item.server_name ||
          item.serverName ||
          fallbackName,

        display_name:
          item.display_name ||
          item.displayName ||
          item.server_name ||
          item.serverName ||
          item.name ||
          fallbackName,

        type_name:
          item.type_name ||
          item.typeName ||
          item.type ||
          ""
      });
    }

    const candidates = [
      result?.data?.videos,
      result?.data?.streams,
      result?.data?.servers,
      result?.data?.list,
      result?.videos,
      result?.streams,
      result?.servers,
      result?.list,
      result?.data
    ];

    for (const candidate of candidates) {

      if (Array.isArray(candidate)) {

        candidate.forEach(
          item => addVideo(item)
        );

        if (videos.length) {
          break;
        }
      }
    }

    if (!videos.length) {

      const recursiveScan =
        value => {

          if (!value || typeof value !== "object") {
            return;
          }

          if (Array.isArray(value)) {

            value.forEach(
              item =>
                recursiveScan(item)
            );

            return;
          }

          const possibleURL =
            value.url ||
            value.play_url ||
            value.playUrl ||
            value.stream_url ||
            value.streamUrl ||
            value.m3u8 ||
            value.src ||
            value.file ||
            value.link;

          if (
            typeof possibleURL === "string" &&
            safeURL(possibleURL)
          ) {
            addVideo(value);
          }

          Object.values(value)
            .forEach(
              child =>
                recursiveScan(child)
            );
        };

      recursiveScan(result);
    }

    const unique = [];
    const seen = new Set();

    videos.forEach(video => {

      if (!seen.has(video.url)) {

        seen.add(video.url);
        unique.push(video);

      }
    });

    return unique;
  }
    /* =========================================================
     REFRESH / COUNTDOWN
  ========================================================= */

function updateCountdowns() {
  if (!matches.length) return;

  let needRender = false;

  const cards = document.querySelectorAll(".iko-card");

  cards.forEach(card => {

    const matchId =
      card.dataset.ikotvMatch;

    if (!matchId) return;

    const match =
      matches.find(
        item =>
          String(item.id) === String(matchId)
      );

    if (!match) return;

    const currentStatus =
      getStatus(match);

    /*
     * Ambil status yang sedang tampil
     */
    const statusElement =
      card.querySelector(".iko-status");

    if (!statusElement) return;

    const displayedStatus =
      statusElement.classList.contains("live")
        ? "live"
        : statusElement.classList.contains("ended")
          ? "ended"
          : "upcoming";

    /*
     * HANYA render ulang kalau status
     * pertandingan benar-benar berubah.
     *
     * Jangan render setiap detik karena
     * itu akan menghapus server panel.
     */
    if (
      currentStatus !== displayedStatus
    ) {

      needRender = true;

      return;
    }

    /*
     * Update countdown saja
     */
    if (
      currentStatus === "upcoming"
    ) {

      const countdownElement =
        card.querySelector(
          ".iko-countdown"
        );

      if (countdownElement) {

        const value =
          countdown(match.time);

        if (value) {
          countdownElement.textContent =
            value;
        }

      }

    }

  });

  /*
   * Render ulang HANYA ketika status
   * UPCOMING -> LIVE
   * atau
   * LIVE -> ENDED
   */
  if (needRender) {
    renderSchedule();
  }
}

  /* =========================================================
     LOAD SCHEDULE
  ========================================================= */

  async function loadSchedule() {

    if (loadingSchedule) {
      return;
    }

    loadingSchedule = true;

    const { schedule } =
      ensureDOM();

    try {

      schedule.innerHTML = `
        <div class="iko-loading">
          Loading schedule...
        </div>
      `;

      const newMatches =
  await fetchMatches();

matches = newMatches;

renderSchedule();

      console.log(
        "[IKOTV] Schedule loaded:",
        matches.length
      );

    } catch (error) {

  console.error(
    "[IKOTV] Schedule error:",
    error
  );

  schedule.innerHTML = `
    <div class="iko-error">
      Gagal memuat jadwal.
      <br>
      <small>
        ${escapeHTML(
          error?.message || "Unknown error"
        )}
      </small>

      <br><br>

      <button
        type="button"
        onclick="window.IKOTV && window.IKOTV.reload()"
        style="
          padding:8px 14px;
          border:0;
          border-radius:6px;
          background:#00d979;
          color:#001b0f;
          font-weight:800;
          cursor:pointer;
        "
      >
        RETRY
      </button>
    </div>
  `;

}
    finally {

      loadingSchedule = false;

    }
  }

  /* =========================================================
     AUTO REFRESH
  ========================================================= */

  function startAutoRefresh() {

    setInterval(
      () => {

        loadSchedule();

      },
      CONFIG.refreshMs
    );
  }

  function startCountdownTimer() {

    setInterval(
      () => {

        updateCountdowns();

      },
      CONFIG.countdownMs
    );
  }

  /* =========================================================
     INIT
  ========================================================= */

  async function init() {

    try {

      injectCSS();

      ensureDOM();

      await loadLibraries();

      await loadSchedule();

      startAutoRefresh();

      startCountdownTimer();

      console.log(
        "[IKOTV] Initialized successfully."
      );

    } catch (error) {

      console.error(
        "[IKOTV] Initialization error:",
        error
      );

      const { schedule } =
        ensureDOM();

      schedule.innerHTML = `
        <div class="iko-error">
          IKOTV gagal diinisialisasi.
          <br>
          <small>
            ${escapeHTML(
              error?.message || ""
            )}
          </small>
        </div>
      `;
    }
  }

  /* =========================================================
     PUBLIC API
  ========================================================= */

  window.IKOTV = {

    init,

    reload: loadSchedule,

    openMatch: openIKOMatch,

    getMatches: () =>
      matches.slice(),

    config: CONFIG

  };

  /* =========================================================
     AUTO START
  ========================================================= */

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );

  } else {

    init();

  }

})();
