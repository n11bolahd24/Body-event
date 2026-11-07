/*!
 * IKOTV Auto Schedule
 * N11BOLAHD

 */

(() => {
  "use strict";

  const CONFIG = {
    api: {
      matches: "https://rough-bread-fac0-ikotv-api.novendibagus5.workers.dev/api/matches",
      matchInfo: "https://rough-bread-fac0-ikotv-api.novendibagus5.workers.dev/match-info",
      streamUrl: "https://rough-bread-fac0-ikotv-api.novendibagus5.workers.dev/stream-url"
    },

    channels: {
  motogp: {
    id: 2,
    name: "MotoGP",
    slug: "/channels/live-streaming-motogp"
  },
  badminton: {
    id: 1,
    name: "Badminton",
    slug: "/channels/live-streaming-badminton"
  }
},

    // Change these only if you want another placement.
    scheduleSelector: "#ikotvSchedule",
    playerSelector: "#tv",

    
    countdownMs: 1000,

    // Cek status LIVE IKOTV setiap 30 detik
    liveCheckMs: 30000,


  /* ==============================
     PLAYER LIBRARIES
  ============================== */
  hls:
    "https://cdn.jsdelivr.net/npm/hls.js@1.6.2/dist/hls.min.js",
  mpegts:
    "https://cdn.jsdelivr.net/npm/mpegts.js@1.7.3/dist/mpegts.min.js",  
  shaka:
    "https://cdn.jsdelivr.net/npm/shaka-player@4.16.12/dist/shaka-player.compiled.min.js",
  shakaCSS:
    "https://cdn.jsdelivr.net/npm/shaka-player@4.16.12/dist/controls.min.css"
 };

  let matches = [];
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

  const now =
    Math.floor(Date.now() / 1000);

  const start =
    Number(match.time || 0);

  // Jika IKOTV masih memasukkan match
  // ke daftar LIVE
  if (match.isLive === true) {
    return "live";
  }

  // Pertandingan belum dimulai
  if (now < start) {
    return "upcoming";
  }

  // Sudah kickoff tetapi IKOTV
  // belum mendeteksi LIVE
  return "waiting";
}

function normalizeMatch(match) {

  // ==========================
  // CHANNEL IKOTV
  // ==========================

  if (match?.isChannel === true) {

    return {

      id: String(
        match?.id ??
        ""
      ),

      time: "LIVE TV",

      statusRaw: Number(
        match?.status ??
        2
      ),

      isLive: true,

      isChannel: true,

      channelSlug:
        match?.channelSlug ||
        "",

      home:
        match?.title ||
        match?.name ||
        match?.teams?.home?.name ||
        "Live Channel",

      away:
        match?.teams?.away?.name ||
        "",

      homeLogo: safeURL(
        match?.teams?.home?.logo?.imageUrl ||
        match?.logo_url ||
        ""
      ),

      awayLogo: safeURL(
        match?.teams?.away?.logo?.imageUrl ||
        ""
      ),

      competition:
        match?.league ||
        "EVENTS",

      competitionLogo: "",

      title:
        match?.title ||
        match?.name ||
        "Live Channel"

    };

  }

  // ==========================
  // MATCH FOOTBALL
  // ==========================

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
}  /* =========================================================
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

  color: #fff;

  font-size: 10px;
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
  color: #fff;

  cursor: pointer;

  font-size: 12px;
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
   STICKY DATE + UPDATE
========================================================= */

.iko-date {
  position: sticky;
  top: 0;
  z-index: 100;

  display: flex;
  align-items: center;
  justify-content: space-between;

  min-height: 64px;

  margin: 25px 0 12px;
  padding: 10px 16px;

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

  box-sizing: border-box;

  box-shadow:
    0 5px 18px rgba(0,0,0,.35);
}

/* =========================================================
   UPDATE BUTTON
========================================================= */

.iko-update-btn {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 5px;

  min-width: 92px;
  height: 38px;

  padding: 0 12px;

  border: 1px solid #00d979;
  border-radius: 7px;

  background: rgba(0,0,0,.35);

  color: #00d979;

  font-size: 11px;
  font-weight: 900;

  cursor: pointer;

  transition:
    background .2s ease,
    color .2s ease,
    transform .15s ease;
}

.iko-update-btn:hover {
  background: #00d979;
  color: #001b0f;
}

.iko-update-btn:active {
  transform: scale(.96);
}

.iko-update-btn.loading {
  pointer-events: none;
  opacity: .7;
}

.iko-update-icon {
  font-size: 18px;
  line-height: 1;
}

.iko-update-text {
  line-height: 1;
}

/* spinner ketika update */
.iko-update-btn.loading
.iko-update-icon {
  animation: ikoUpdateSpin .8s linear infinite;
}

@keyframes ikoUpdateSpin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* =========================================================
   SEARCH MATCH BUTTON
========================================================= */

.iko-date-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}



.iko-search-input {
  width: 130px;
  height: 28px;
  box-sizing: border-box;
  padding: 0 8px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 7px;
  background: rgba(0,0,0,.45);
  color: #fff;
  outline: none;
  font-size: 14px;
  font-weight: normal;
}

.iko-search-input::placeholder {
  color: rgba(255,255,255,.55);
}

.iko-search-input:focus {
  border-color: #00d979;
}

.iko-search-not-found {
  text-align: center;
  padding: 15px 10px;
  color: #aaa;
  font-size: 12px;
  font-weight: normal;
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

  color: #ffffff;

  font-family:
    "Courier New",
    monospace;

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

  font-family:
    "Courier New",
    monospace;

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
  font-family:
    "Courier New",
    monospace;

  font-size: 20px;
  font-weight: 900;

  line-height: 1;

  white-space: nowrap;

  letter-spacing: .3px;
}

/* VS */

.iko-vs {
  margin-top: 5px;

  color: #ffffff;

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
  background: #525050;
  color: #ffffff;
}

.iko-status.waiting {
  background: #525050;
  color: #ffffff;
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

  width: auto;
  min-width: 110px;
  margin: 0 auto;

  padding: 8px 14px;

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
  background: #525050;
  color: #ffffff;

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
  color: #ffffff;

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
    gap: 4px !important;
    font-size: 13px !important;
  }

  .iko-team img {
    width: 32px !important;
    height: 32px !important;
    flex: 0 0 32px !important;
  }

  .iko-time {
    font-size: 17px !important;
  }

  .iko-vs {
    font-size: 10px !important;
  }

  .iko-status {
    min-width: 50px !important;
    font-size: 9px !important;
    padding: 3px 5px !important;
  }

  .iko-countdown {
    font-size: 10px !important;
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

  
  .iko-date {
  top: 0;

  min-height: 58px;

  margin: 15px 0 8px;

  padding: 8px 10px;
}

.iko-update-btn {
  min-width: 82px;
  height: 34px;

  padding: 0 9px;

  font-size: 9px;
}

.iko-update-icon {
  font-size: 16px;
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

/* =========================================================
   IKOTV SIZE +6
========================================================= */

/* LOGO KLUB */
.iko-team img {
  width: 36px !important;
  height: 36px !important;
  flex: 0 0 36px !important;
}

/* NAMA TIM */
.iko-team {
  font-size: 17px !important;
  line-height: 1.15 !important;
}

/* KICKOFF TIME */
.iko-time {
  font-size: 21px !important;
  line-height: 1 !important;
}

/* VS */
.iko-vs {
  margin-top: 3px !important;
  font-size: 13px !important;
}

/* =========================================================
   STATUS UPCOMING PC/LAPTOP — NORMAL & 1 BARIS
========================================================= */

.iko-status {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;

  width: 72px !important;
  min-width: 72px !important;
  height: 22px !important;

  margin-top: 4px !important;
  padding: 0 !important;

  box-sizing: border-box !important;

  border-radius: 5px !important;

  font-size: 9px !important;
  font-weight: 900 !important;

  line-height: 1 !important;
  letter-spacing: .3px !important;

  white-space: nowrap !important;
  overflow: hidden !important;
}

/* COUNTDOWN */
.iko-countdown {
  margin-top: 5px !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  letter-spacing: .5px !important;
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

  .iko-date-actions {
  gap: 4px;
}



@media (max-width: 600px) {

  .iko-search-input {
    width: 105px;
    height: 28px;
    font-size: 10px;
    padding: 0 7px;
  }

}
  
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
/* =========================================================
   IKOTV LIVE — RED BLINK
========================================================= */

.iko-status.live {
  background: #e50914 !important;
  color: #fff !important;

  animation: ikoLivePulse 1s infinite !important;

  box-shadow: none !important;
}

@keyframes ikoLivePulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: .5;
  }

  100% {
    opacity: 1;
  }
}

/* =========================================================
   IKOTV DATE + UPDATE COMPACT
========================================================= */

.iko-date {
  min-height: 0 !important;
  height: auto !important;

  margin: 10px 0 7px !important;
  padding: 6px 10px !important;

  border-left-width: 3px !important;
}

/* TEXT TANGGAL */
.iko-date-title {
  font-size: 10px !important;
  line-height: 1.2 !important;
}

/* UPDATE BUTTON */
.iko-update-btn {
  min-width: 72px !important;
  width: auto !important;
  height: 28px !important;

  padding: 0 8px !important;

  font-size: 8px !important;
}

/* ICON UPDATE */
.iko-update-icon {
  font-size: 14px !important;
}

/* TEXT UPDATE */
.iko-update-text {
  font-size: 8px !important;
}

@media (min-width: 601px) {

  .iko-match {
    grid-template-columns:
      minmax(0, 1fr)
      78px
      minmax(0, 1fr) !important;

    gap: 12px !important;
  }

  .iko-status {
    width: 68px !important;
    min-width: 68px !important;
    height: 21px !important;
    padding: 0 !important;

    font-size: 9px !important;
    white-space: nowrap !important;
  }

}

@media (max-width: 600px) {

  .iko-match {
    grid-template-columns:
      minmax(0, 1fr)
      58px
      minmax(0, 1fr) !important;

    gap: 8px !important;
  }

  .iko-status {
    width: 50px !important;
    min-width: 50px !important;

    height: 18px !important;
    padding: 0 !important;

    font-size: 7px !important;
    line-height: 1 !important;

    white-space: nowrap !important;
  }

}

/* =========================================================
   IKOTV — FONT KHUSUS
   Nama Team TETAP font default
========================================================= */

/* COMPETITION */
.iko-comp {
  font-family: "Courier New", monospace !important;
}

/* KICKOFF TIME */
.iko-time {
  font-family: "Courier New", monospace !important;
}

/* VS */
.iko-vs {
  font-family: "Courier New", monospace !important;
}

/* STATUS: UPCOMING / LIVE / ENDED */
.iko-status {
  font-family: "Courier New", monospace !important;
}

/* COUNTDOWN */
.iko-countdown {
  font-family: "Courier New", monospace !important;
}


/* UPDATE */
.iko-update-btn,
.iko-update-text {
  font-family: "Courier New", monospace !important;
}

/* LIVE SERVER + NAMA SERVER */
.iko-server-panel,
.iko-server-title,
.iko-live-server,
.iko-server-list {
  font-family: "Courier New", monospace !important;
}

/* PLAYER */
.iko-player-title,
.iko-close,
.iko-server,
.iko-note {
  font-family: "Courier New", monospace !important;
}

/* LOADING / ERROR / EMPTY */
.iko-loading,
.iko-error,
.iko-empty,
.iko-server-loading,
.iko-server-error {
  font-family: "Courier New", monospace !important;
}


/* =========================================================
   NAMA TEAM
   KEMBALI KE FONT DEFAULT TEMPLATE
========================================================= */

.iko-team,
.iko-team span {
  font-family: inherit !important;
}

/* =========================================================
   IKOTV — HOVER BACKGROUND SAJA
========================================================= */

.iko-card {
  transition: background .2s ease !important;
}

.iko-card:hover {
  background:
    linear-gradient(
      135deg,
      #111b17 0%,
      #17231e 50%,
      #111b17 100%
    ) !important;
}
/* =========================================================
   TOMBOL — BORDER SESUAI PANJANG TEXT
========================================================= */

.iko-watch {
  width: fit-content !important;
  min-width: 0 !important;
  max-width: 100% !important;

  margin-left: auto !important;
  margin-right: auto !important;

  white-space: nowrap !important;
  box-sizing: border-box !important;
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

  /* ==============================
     HLS.JS
  ============================== */

  await loadScript(
    CONFIG.hls,
    () => typeof window.Hls !== "undefined"
  );

/* ==============================
   MPEG-TS / FLV PLAYER
============================== */

await loadScript(
  CONFIG.mpegts,
  () => typeof window.mpegts !== "undefined"
);
  /* ==============================
     SHAKA PLAYER
  ============================== */

  await loadScript(
    CONFIG.shaka,
    () => typeof window.shaka !== "undefined"
  );


  /* ==============================
     SHAKA CSS
  ============================== */

  if (
    !document.querySelector(
      `link[href="${CONFIG.shakaCSS}"]`
    )
  ) {

    const link =
      document.createElement("link");

    link.rel = "stylesheet";
    link.href = CONFIG.shakaCSS;

    document.head.appendChild(link);
  }


  console.log(
    "[IKOTV] HLS.js + Shaka Player loaded."
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
        "Request timeout 30s"
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


/* =========================================================
   GET API MATCHES
   /api/matches IKOTV menggunakan GET
========================================================= */

async function getMatchesAPI(filter) {

  const url =
    CONFIG.api.matches +
    "?date=" +
    encodeURIComponent("") +
    "&filter=" +
    encodeURIComponent(filter) +
    "&sport=football" +
    "&_=" +
    Date.now();

  console.log(
    "[IKOTV] GET REQUEST:",
    url
  );

  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, 30000);

  try {

    const response =
      await fetch(
        url,
        {
          method: "GET",

          headers: {
            "Accept":
              "application/json"
          },

          mode: "cors",

          cache: "no-store",

          signal:
            controller.signal
        }
      );

    console.log(
      "[IKOTV] GET STATUS:",
      response.status
    );

    const text =
      await response.text();

    console.log(
      "[IKOTV] GET RESPONSE:",
      text
    );

    if (!response.ok) {

      throw new Error(
        "HTTP " +
        response.status +
        " - " +
        text.substring(
          0,
          200
        )
      );

    }

    if (!text) {

      throw new Error(
        "Response API kosong"
      );

    }

    try {

      return JSON.parse(
        text
      );

    } catch (error) {

      throw new Error(
        "Response API bukan JSON: " +
        text.substring(
          0,
          200
        )
      );

    }

  } catch (error) {

    if (
      error.name ===
      "AbortError"
    ) {

      throw new Error(
        "Request timeout 30s"
      );

    }

    console.error(
      "[IKOTV] GET FETCH ERROR:",
      error
    );

    throw error;

  } finally {

    clearTimeout(
      timeout
    );

  }

}


  // ==========================
// AMBIL CHANNEL IKOTV
// ==========================

async function getIKOTVChannels() {

  const channelSlugs = [
    "live-streaming-motogp",
    "live-streaming-badminton"
  ];

  const results = [];

  for (const slug of channelSlugs) {

    const url =
      "https://ikotv.cc/channels/" +
      slug +
      "?_=" +
      Date.now();

    console.log(
      "[IKOTV] GET CHANNEL:",
      url
    );

    try {

      const response =
        await fetch(
          url,
          {
            method: "GET",
            cache: "no-store"
          }
        );

      console.log(
        "[IKOTV] CHANNEL STATUS:",
        slug,
        response.status
      );

      const html =
        await response.text();

      if (!response.ok) {

        console.warn(
          "[IKOTV] CHANNEL HTTP ERROR:",
          slug,
          response.status
        );

        continue;

      }

      // Cari object channel di halaman IKOTV
      const match =
        html.match(
          /"channel"\s*:\s*(\{[\s\S]*?\})\s*(?:,|})/
        );

      if (!match) {

        console.warn(
          "[IKOTV] CHANNEL DATA TIDAK DITEMUKAN:",
          slug
        );

        continue;

      }

      let channel;

      try {

        channel =
          JSON.parse(
            match[1]
          );

      } catch (error) {

        console.warn(
          "[IKOTV] GAGAL PARSE CHANNEL:",
          slug,
          error
        );

        continue;

      }

      if (!channel) {
        continue;
      }

      console.log(
        "[IKOTV] CHANNEL FOUND:",
        channel
      );

      results.push({

        id:
          "channel-" +
          String(
            channel.id
          ),

        title:
          channel.name ||
          "Live Channel",

        league:
          "EVENTS",

        category:
          "",

        teams: {

          home: {

            name:
              channel.name ||
              "Live Channel",

            logo: {

              imageUrl:
                channel.logo_url ||
                ""

            }

          },

          away: {

            name:
              channel.event_name ||
              "",

            logo: {

              imageUrl:
                ""

            }

          }

        },

        score: {

          home: 0,
          away: 0

        },

        time:
          "LIVE TV",

        isLive: true,

        status: 2,

        kickoff_time: 0,

        isChannel: true,

        channelSlug:
          "/channels/" +
          slug

      });

    } catch (error) {

      console.error(
        "[IKOTV] CHANNEL FETCH ERROR:",
        slug,
        error
      );

    }

  }

  console.log(
    "[IKOTV] CHANNEL TOTAL:",
    results.length
  );

  console.log(
    "[IKOTV] CHANNEL MATCHES:",
    results
  );

  return results;

}

  async function fetchMatches() {

  console.log("[IKOTV] Mengambil ALL + LIVE...");

  const [allResult, liveResult] =
    await Promise.all([

      // ==========================
      // SEMUA JADWAL
      // ==========================
      getMatchesAPI("all"),

      // ==========================
      // MATCH YANG SEDANG LIVE
      // ==========================
      getMatchesAPI("live")

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
          (
            match.isChannel === true ||
            match.time > 0
          )
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
          (
            match.isChannel === true ||
            match.time > 0
          )
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

    const old =
      merged.get(id);

    merged.set(id, {
      ...old,
      ...match,
      isLive: true
    });

  } else {

    merged.set(id, {
      ...match,
      isLive: true
    });

  }

});
    
  const now =
  Math.floor(Date.now() / 1000);

const result =
  Array.from(
    merged.values()
  )
  .filter(match => {

    if (
      !match.id ||
      !match.time
    ) {
      return false;
    }

    const start =
      Number(match.time);

    // Belum kickoff → tetap tampil
    if (now < start) {
      return true;
    }

    // Sudah kickoff tetapi belum terdeteksi LIVE
    // → TETAP tampil sebagai WAITING
    if (!match.isLive) {
      return true;
    }

    // Sudah LIVE → tetap tampil
    return true;

  })
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


async function fetchIKOTVChannels() {
  const channels = [];

  const channelPages = [
    {
      id: 2,
      name: "MotoGP",
      slug: "live-streaming-motogp"
    },
    {
      id: 1,
      name: "Badminton",
      slug: "live-streaming-badminton"
    }
  ];

  for (const ch of channelPages) {
    try {
      console.log(
        "[IKOTV CHANNEL] Fetch:",
        ch.name,
        "https://ikotv.cc/channels/" + ch.slug
      );

      const res = await fetch(
        "https://ikotv.cc/channels/" +
        ch.slug +
        "?_=" + Date.now(),
        {
          method: "GET",
          cache: "no-store"
        }
      );

      if (!res.ok) {
        console.warn(
          "[IKOTV CHANNEL] HTTP",
          ch.name,
          res.status
        );
        continue;
      }

      const html = await res.text();

      console.log(
        "[IKOTV CHANNEL] HTML:",
        ch.name,
        html.length
      );

      /*
       * Channel data di halaman iKOTV berada
       * di object Next.js / server-rendered data.
       *
       * Kita cari object channel berdasarkan
       * channel_id / name / slug.
       */
      const channelMatch =
        html.match(
          new RegExp(
            `"channel"\\s*:\\s*\\{[^]*?"id"\\s*:\\s*${ch.id}[^]*?\\}`
          )
        );

      if (!channelMatch) {
        console.warn(
          "[IKOTV CHANNEL] Data channel tidak ditemukan:",
          ch.name
        );
        continue;
      }

      console.log(
        "[IKOTV CHANNEL] Found:",
        ch.name
      );

    } catch (err) {
      console.error(
        "[IKOTV CHANNEL] Error:",
        ch.name,
        err
      );
    }
  }

  return channels;
}  

  async function fetchMatchInfo(matchId) {
  const url =
    CONFIG.api.matchInfo +
    "?matchid=" +
    encodeURIComponent(String(matchId)) +
    "&sport=football&_=" +
    Date.now();

  console.log("[IKOTV] MATCH INFO REQUEST:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    },
    mode: "cors",
    cache: "no-store"
  });

  const text = await response.text();

  console.log("[IKOTV] MATCH INFO STATUS:", response.status);
  console.log("[IKOTV] MATCH INFO RESPONSE:", text);

  if (!response.ok) {
    throw new Error(
      "HTTP " +
      response.status +
      " - " +
      text.substring(0, 300)
    );
  }

  if (!text) {
    throw new Error("Response match-info kosong");
  }

  const result = JSON.parse(text);

  console.log("[IKOTV] match-info:", result);

  return result;
}

  async function fetchStreamURL(matchId) {

  console.log(
    "[IKOTV] Mengambil STREAM URL untuk match:",
    matchId
  );

  const url =
    CONFIG.api.streamUrl +
    "?matchid=" +
    encodeURIComponent(String(matchId)) +
    "&sport=football&_=" +
    Date.now();

  console.log(
    "[IKOTV] STREAM-URL REQUEST:",
    url
  );

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    },
    mode: "cors",
    cache: "no-store"
  });

  const text =
    await response.text();

  console.log(
    "[IKOTV] STREAM-URL STATUS:",
    response.status
  );

  console.log(
    "[IKOTV] STREAM-URL RESPONSE:",
    text
  );

  if (!response.ok) {

    throw new Error(
      "HTTP " +
      response.status +
      " - " +
      text.substring(0, 300)
    );

  }

  if (!text) {

    throw new Error(
      "Response stream-url kosong"
    );

  }

  let result;

  try {

    result =
      JSON.parse(text);

  } catch (error) {

    console.error(
      "[IKOTV] STREAM-URL bukan JSON:",
      text
    );

    throw new Error(
      "Response stream-url bukan JSON"
    );

  }

  console.log(
    "[IKOTV] STREAM-URL RESULT:",
    result
  );

  return result;
}


/* =========================================================
   IKOTV HTML5 VIDEO + HLS.JS PLAYER
   Menggunakan native video controls
   seperti player pada script sebelumnya
========================================================= */

let ikotvHls = null;
let ikotvShaka = null;
let ikotvMpegts = null;
let ikotvVideo = null;

/* =========================================================
   IKOTV UNIVERSAL PLAYER

   M3U8
   -> HLS.js

   MPD
   -> Shaka Player

   MPD + ClearKey
   -> Shaka Player + DRM ClearKey
========================================================= */

async function destroyIKOTVPlayer() {

  /* ==============================
     DESTROY HLS
  ============================== */

  if (ikotvHls) {

    try {
      ikotvHls.destroy();
    } catch (_) {}

    ikotvHls = null;
  }

/* ==============================
   DESTROY FLV / MPEG-TS
============================== */

if (ikotvMpegts) {

  try {
    ikotvMpegts.pause();
    ikotvMpegts.unload();
    ikotvMpegts.detachMediaElement();
    ikotvMpegts.destroy();
  } catch (_) {}

  ikotvMpegts = null;
}
  /* ==============================
     DESTROY SHAKA
  ============================== */

  if (ikotvShaka) {

    try {
      await ikotvShaka.destroy();
    } catch (_) {}

    ikotvShaka = null;
  }

}


function getStreamType(url, videoData = {}) {

  const lower =
    String(url || "").toLowerCase();

  const type =
    String(
      videoData.type ||
      videoData.format ||
      videoData.protocol ||
      videoData.type_name ||
      videoData.typeName ||
      ""
    ).toLowerCase();


 /*
 * ==========================================
 * HD [auto] / IFRAME PLAYER
 * ==========================================
 *
 * Walaupun URL iframe berisi:
 *
 * ?mpd=...
 * &keyId=...
 * &key=...
 *
 * tetap dimainkan sebagai IFRAME.
 */
if (type === "iframe") {
  return "iframe";
}

/* ==========================================
   EXPLICIT FLV
========================================== */

if (
  type === "flv" ||
  type.includes("flv") ||
  /\.flv(?:[?#]|$)/i.test(lower)
) {
  return "flv";
}
  /*
   * ==========================================
   * EXPLICIT DASH
   * ==========================================
   */

  if (
    type === "dash" ||
    type === "mpd" ||
    type.includes("dash") ||
    type.includes("mpd")
  ) {
    return "dash";
  }


  /*
   * ==========================================
   * CLEARKEY
   * ==========================================
   */

  if (
    videoData.kid ||
    videoData.KID ||
    videoData.kid_hex ||
    videoData.kidHex ||
    videoData.key ||
    videoData.KEY ||
    videoData.key_hex ||
    videoData.keyHex ||
    videoData.clearKeys ||
    videoData.clear_keys ||
    videoData.clearkeys
  ) {
    return "dash";
  }


  /*
   * ==========================================
   * URL MPD
   * ==========================================
   */

  if (
    /\.mpd(?:[?#]|$)/i.test(lower)
  ) {
    return "dash";
  }


  /*
   * ==========================================
   * EXPLICIT HLS
   * ==========================================
   */

  if (
    type === "hls" ||
    type === "m3u8" ||
    type.includes("hls")
  ) {
    return "hls";
  }


  /*
   * ==========================================
   * URL M3U8
   * ==========================================
   */

  if (
    /\.m3u8(?:[?#]|$)/i.test(lower)
  ) {
    return "hls";
  }


   /*
   * ==========================================
   * IFRAME PLAYER
   * ==========================================
   */

  if (type === "iframe") {
    return "iframe";
  }


  /*
   * DEFAULT
   * ==========================================
   */

  return "hls";
}

  
  function normalizeIKOTVDASH(videoData = {}) {

  const originalURL =
    String(videoData.url || "");

  /*
   * Kalau bukan iframe MPD,
   * gunakan data biasa.
   */

  if (
    !/[?&]mpd=/i.test(originalURL)
  ) {

    return {
      url: originalURL,
      kid:
        videoData.kid ||
        videoData.KID ||
        "",
      key:
        videoData.key ||
        videoData.KEY ||
        "",
      clearKeys:
        videoData.clearKeys ||
        null
    };

  }


  try {

    const iframeURL =
      new URL(originalURL);

    /*
     * Ambil MPD
     */

    const mpd =
      iframeURL.searchParams.get("mpd") || "";


    /*
     * Ambil KID
     */

    const kid =
      iframeURL.searchParams.get("keyId") ||
      iframeURL.searchParams.get("kid") ||
      "";


    /*
     * Ambil KEY
     */

    const key =
      iframeURL.searchParams.get("key") || "";


    console.log(
      "[IKOTV] AUTO HD MPD:",
      mpd
    );

    console.log(
      "[IKOTV] AUTO HD KID:",
      kid
    );

    console.log(
      "[IKOTV] AUTO HD KEY tersedia:",
      !!key
    );


    return {

      url:
        mpd,

      kid:
        kid,

      key:
        key,

      clearKeys:
        kid && key
          ? {
              [String(kid)
                .replace(/-/g, "")
                .toLowerCase()
              ]:
                String(key)
                  .replace(/-/g, "")
                  .toLowerCase()
            }
          : null

    };

  } catch (error) {

    console.error(
      "[IKOTV] Gagal parsing Auto HD:",
      error
    );

    return null;

  }

}
  /* =========================================================
   PLAY M3U8
========================================================= */

function playIKOTVHLS(url, video) {

  return new Promise((resolve, reject) => {

    console.log(
      "[IKOTV] PLAYER: HLS.js"
    );

    if (
      typeof window.Hls === "undefined"
    ) {

      reject(
        new Error(
          "HLS.js belum tersedia."
        )
      );

      return;
    }


    /*
     * Browser native HLS
     */

    if (
      !window.Hls.isSupported() &&
      video.canPlayType(
        "application/vnd.apple.mpegurl"
      )
    ) {

      console.log(
        "[IKOTV] Menggunakan native HLS."
      );

      video.src = url;


      video.addEventListener(
        "loadedmetadata",
        () => {

          video
            .play()
            .catch(() => {});

          resolve();

        },
        { once: true }
      );

      return;
    }


    /*
     * HLS.js
     */

    if (
      window.Hls.isSupported()
    ) {

      ikotvHls =
  new window.Hls({

    enableWorker: true,

    lowLatencyMode: false,

    backBufferLength: 30,

    maxBufferLength: 60,

    maxMaxBufferLength: 120,

    startFragPrefetch: true,

    maxBufferHole: 0.5,

    nudgeOffset: 0.1,

    nudgeMaxRetry: 5

  });

      ikotvHls.loadSource(url);

      ikotvHls.attachMedia(video);


      ikotvHls.on(
        window.Hls.Events.MANIFEST_PARSED,
        () => {

          console.log(
            "[IKOTV] HLS manifest parsed."
          );

          video
            .play()
            .catch(() => {});

          resolve();

        }
      );


      ikotvHls.on(
  window.Hls.Events.ERROR,
  (event, data) => {

    console.warn(
      "[IKOTV] HLS error:",
      data
    );

    /* ==========================================
       BUFFER STALL
    ========================================== */

    if (
      data.details ===
      window.Hls.ErrorDetails.BUFFER_STALLED_ERROR
    ) {

      console.warn(
        "[IKOTV] Buffer stalled. Mencoba recovery..."
      );

      try {

        ikotvHls.startLoad();

      } catch (error) {

        console.warn(
          "[IKOTV] Buffer recovery gagal:",
          error
        );

      }

      return;
    }


    /* ==========================================
       FATAL ERROR
    ========================================== */

    if (data.fatal) {

      console.error(
        "[IKOTV] HLS fatal error:",
        data
      );

      reject(
        new Error(
          "HLS fatal error: " +
          data.type
        )
      );

    }

  }
);

      return;
    }


    reject(
      new Error(
        "Browser tidak mendukung HLS."
      )
    );

  });

}

/* =========================================================
   PLAY IFRAME
========================================================= */

function playIKOTVIframe(url, videoData = {}) {

  return new Promise((resolve, reject) => {

    console.log(
      "[IKOTV] PLAYER: IFRAME"
    );

    if (!url) {

      reject(
        new Error(
          "URL iframe kosong."
        )
      );

      return;
    }


    const tv =
      document.getElementById("tv");


    if (!tv) {

      reject(
        new Error(
          "#tv tidak ditemukan."
        )
      );

      return;
    }


    /*
     * Bersihkan video/player lama
     */

    try {

      if (ikotvHls) {

        ikotvHls.destroy();

        ikotvHls = null;

      }

    } catch (e) {

      console.warn(
        "[IKOTV] Gagal destroy HLS:",
        e
      );

    }


    /*
     * Buat iframe
     */

    tv.innerHTML = `
      <iframe
        src="${escapeHTML(url)}"
        allow="autoplay; fullscreen; encrypted-media"
        allowfullscreen
        frameborder="0"
        scrolling="no"
        style="
  width:100%;
  height:100%;
  display:block;
  border:0;
  margin:0;
  padding:0;
  background:#000;
"
      ></iframe>
    `;


    console.log(
      "[IKOTV] IFRAME loaded:",
      url
    );


    resolve();

  });

}

  
/* =========================================================
   NORMALIZE CLEARKEY
========================================================= */

function getClearKeys(videoData = {}) {

  /*
   * Jika API sudah mengirim
   * object clearKeys
   */

  if (
    videoData.clearKeys &&
    typeof videoData.clearKeys === "object"
  ) {

    return videoData.clearKeys;
  }


  /*
   * Jika API mengirim:
   *
   * kid
   * key
   */

  const kid =
    videoData.kid ||
    videoData.KID ||
    videoData.kid_hex ||
    videoData.kidHex ||
    "";


  const key =
    videoData.key ||
    videoData.KEY ||
    videoData.key_hex ||
    videoData.keyHex ||
    "";


  if (
    kid &&
    key
  ) {

    return {
      [String(kid).replace(/-/g, "").toLowerCase()]:
        String(key).replace(/-/g, "").toLowerCase()
    };

  }


  return null;
}


/* =========================================================
   PLAY MPD / DASH
========================================================= */

async function playIKOTVDASH(
  url,
  videoData = {},
  video
) {

  console.log(
    "[IKOTV] PLAYER: Shaka Player"
  );


  if (
    typeof window.shaka === "undefined"
  ) {

    throw new Error(
      "Shaka Player belum tersedia."
    );

  }


  /*
   * Buat Shaka
   */

  ikotvShaka =
    new window.shaka.Player(video);


  /*
   * Error handler
   */

  ikotvShaka.addEventListener(
    "error",
    event => {

      console.error(
        "[IKOTV] Shaka error:",
        event.detail
      );

    }
  );


  /*
   * ClearKey
   */

  const clearKeys =
    getClearKeys(videoData);


  if (
    clearKeys &&
    Object.keys(clearKeys).length
  ) {

    console.log(
      "[IKOTV] ClearKey configuration tersedia."
    );


    ikotvShaka.configure({

      drm: {

        clearKeys:

          clearKeys

      }

    });

  }


  /*
   * Load MPD
   */

  await ikotvShaka.load(url);


  console.log(
    "[IKOTV] MPD loaded successfully."
  );


  /*
   * Play
   */

  video
    .play()
    .catch(error => {

      console.warn(
        "[IKOTV] Autoplay diblokir:",
        error
      );

    });

}

/* =========================================================
   PLAY FLV
   Menggunakan MPEG-TS.js
========================================================= */

function playIKOTVFLV(url, video) {

  return new Promise((resolve, reject) => {

    console.log("[IKOTV] PLAYER: MPEG-TS.js / FLV");

    if (typeof window.mpegts === "undefined") {
      reject(new Error("MPEG-TS.js belum tersedia."));
      return;
    }

    if (!window.mpegts.isSupported()) {
      reject(new Error(
        "Browser tidak mendukung pemutaran FLV melalui MediaSource."
      ));
      return;
    }

    try {

      ikotvMpegts = window.mpegts.createPlayer(
        {
          type: "flv",
          isLive: true,
          url: url
        },
        {
          enableWorker: true,
          enableStashBuffer: false,
          stashInitialSize: 128
        }
      );

      ikotvMpegts.on(
        window.mpegts.Events.ERROR,
        (errorType, errorDetail, errorInfo) => {

          console.error(
            "[IKOTV] FLV error:",
            errorType,
            errorDetail,
            errorInfo
          );

        }
      );

      ikotvMpegts.attachMediaElement(video);
      ikotvMpegts.load();

      video.play()
        .then(() => {
          console.log("[IKOTV] FLV berhasil diputar.");
          resolve();
        })
        .catch(error => {

          console.warn(
            "[IKOTV] Autoplay FLV gagal:",
            error
          );

          // Player tetap terpasang; pengguna bisa menekan Play.
          resolve();

        });

    } catch (error) {

      reject(error);

    }

  });
}
/* =========================================================
   UNIVERSAL PLAY
========================================================= */

async function playIKOTVStream(
  url,
  videoData = {}
) {

  if (!url) {

    console.warn(
      "[IKOTV] URL stream kosong."
    );

    return;
  }


  const tv =
    document.getElementById("tv");


  if (!tv) {

    console.error(
      "[IKOTV] #tv tidak ditemukan."
    );

    return;
  }


  console.log(
    "[IKOTV] RAW STREAM:",
    url
  );


  /*
   * Tentukan jenis stream
   */

  const type =
    getStreamType(
      url,
      videoData
    );

  let dashData = null;

if (type === "dash") {

  dashData =
    normalizeIKOTVDASH({
      ...videoData,
      url: url
    });

  if (
    !dashData ||
    !dashData.url
  ) {

    throw new Error(
      "URL MPD Auto HD tidak ditemukan."
    );

  }

}


  console.log(
    "[IKOTV] STREAM TYPE:",
    type
  );


  /*
   * Bersihkan player lama
   */

  await destroyIKOTVPlayer();


  /*
   * Buat video
   */

  tv.innerHTML = `

    <video
      id="ikotvVideo"
      controls
      playsinline
      preload="auto"
      style="
        width:100%;
        height:100%;
        display:block;
        background:#000;
      "
    ></video>

  `;


  ikotvVideo =
    document.getElementById(
      "ikotvVideo"
    );


  if (!ikotvVideo) {

    console.error(
      "[IKOTV] Video element gagal dibuat."
    );

    return;
  }


  /*
   * Jangan tambahkan cache-buster
   * untuk MPD.
   *
   * Beberapa manifest DASH
   * sensitif terhadap query tambahan.
   */

  const streamURL =
    type === "hls"

      ? url +
        (url.includes("?")
          ? "&"
          : "?") +
        "_=" +
        Date.now()

      : url;


  try {

  /* ==========================
   FLV
========================== */

if (type === "flv") {

  await playIKOTVFLV(
    url,
    ikotvVideo
  );

  return;
}  
    /*
 * ==========================
 * HLS
 * ==========================
 */

if (type === "hls") {

  await playIKOTVHLS(
    streamURL,
    ikotvVideo
  );

  return;
}


/*
 * ==========================
 * IFRAME
 * ==========================
 */

if (type === "iframe") {

  await playIKOTVIframe(
    url,
    videoData
  );

  return;
}


/*
 * ==========================
 * DASH
 * ==========================
 */

if (type === "dash") {

  await playIKOTVDASH(
    dashData.url,
    {
      ...videoData,
      ...dashData
    },
    ikotvVideo
  );

  return;
}


  } catch (error) {

    console.error(
      "[IKOTV] Player gagal:",
      error
    );


    tv.innerHTML = `

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:center;

          width:100%;
          height:100%;
          min-height:250px;

          background:#000;

          color:#ff7777;

          font-family:
            'Courier New',
            monospace;

          font-size:12px;

          text-align:center;

          padding:20px;

          box-sizing:border-box;
        "
      >

        Failed to play the stream.
        <br>
        ${escapeHTML(
          error?.message || ""
        )}

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

  <span class="iko-date-title">
    ${escapeHTML(
      formatDate(group[0].time)
    )}
  </span>

<div class="iko-date-actions">
  <button type="button" class="iko-update-btn" data-ikotv-update>
    <span class="iko-update-icon">↻</span>
    <span class="iko-update-text">UPDATE</span>
  </button>
</div>

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

} else if (status === "waiting") {

  statusText = "WAITING";

  button = `
    <button
      class="iko-watch disabled"
      disabled
    >
      WAITING FOR KICKOFF
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
    const firstDate = schedule.querySelector(".iko-date");

if (firstDate) {
  const actions = firstDate.querySelector(".iko-date-actions");

  const search = document.createElement("input");
  search.type = "text";
  search.className = "iko-search-input";
  search.setAttribute("data-ikotv-search", "");
  search.placeholder = "Search match...";
  search.autocomplete = "off";

  actions.prepend(search);
}

setupUpdateButtons();
setupSearchButtons();    

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

function setupSearchButtons() {
  const schedule = document.querySelector(CONFIG.scheduleSelector);
  if (!schedule) return;

  const input = schedule.querySelector("[data-ikotv-search]");
  if (!input) return;

  input.oninput = () => {
    const keyword = input.value.trim().toLowerCase();

    const boxes = [...schedule.querySelectorAll(".iko-box")];

    // =========================
    // SEARCH KOSONG
    // =========================
    if (!keyword) {

      boxes.forEach(box => {
        box.style.display = "";

        box.querySelector(".iko-date").style.display = "";

        box.querySelectorAll(".iko-card").forEach(card => {
          card.style.display = "";
        });
      });

      const message =
        schedule.querySelector(".iko-search-not-found");

      if (message) {
        message.remove();
      }

      // Kembalikan Search Match ke tanggal pertama
      const firstBox = boxes[0];

      if (firstBox) {
        const actions =
          firstBox.querySelector(".iko-date-actions");

        if (actions) {
          actions.prepend(input);
        }
      }

      return;
    }

    // =========================
    // PROSES SEARCH
    // =========================
    let firstMatchDate = null;
    let totalFound = 0;

    boxes.forEach(box => {

      const date =
        box.querySelector(".iko-date");

      let foundInBox = false;

      box.querySelectorAll(".iko-card").forEach(card => {

        const text =
          card.textContent.toLowerCase();

        const match =
          text.includes(keyword);

        card.style.display =
          match ? "" : "none";

        if (match) {
          foundInBox = true;
          totalFound++;
        }

      });

      // Ada pertandingan yang cocok
      if (foundInBox) {

        box.style.display = "";
        date.style.display = "";

        if (!firstMatchDate) {
          firstMatchDate = date;
        }

      } else {

        // Tidak ada pertandingan yang cocok
        box.style.display = "none";
      }
    });

    // =========================
    // PINDAHKAN SEARCH KE
    // TANGGAL PERTAMA YANG COCOK
    // =========================
    if (firstMatchDate) {

  const actions =
    firstMatchDate.querySelector(".iko-date-actions");

  if (actions && input.parentElement !== actions) {
    actions.prepend(input);
  }

  // Tetap fokus ke Search Match
  input.focus();

  // Cursor tetap di paling kanan
  const length = input.value.length;
  input.setSelectionRange(length, length);

} else {

      // =========================
      // TIDAK ADA HASIL
      // =========================

      // Tetap tampilkan tanggal pertama
      // supaya Search Match masih bisa dihapus
      const firstBox = boxes[0];

      if (firstBox) {

        firstBox.style.display = "";

        const firstDate =
          firstBox.querySelector(".iko-date");

        firstDate.style.display = "";

        const actions =
          firstDate.querySelector(".iko-date-actions");

        if (actions) {
          actions.prepend(input);
        }
      }
    }

    // =========================
    // MATCH NOT FOUND
    // =========================
    const oldMessage =
      schedule.querySelector(".iko-search-not-found");

    if (oldMessage) {
      oldMessage.remove();
    }

    if (totalFound === 0) {

  const message =
    document.createElement("div");

  message.className =
    "iko-search-not-found";

  message.textContent =
    "MATCH NOT FOUND";

  schedule.appendChild(message);

  // Tetap fokus di Search Match
  input.focus();

  // Cursor tetap di akhir teks
  const length = input.value.length;
  input.setSelectionRange(length, length);
}
  };
}
/* =========================================================
   MANUAL UPDATE BUTTON
========================================================= */

function setupUpdateButtons() {

  const schedule =
    document.querySelector(
      CONFIG.scheduleSelector
    );

  if (!schedule) return;

  schedule
    .querySelectorAll(
      "[data-ikotv-update]"
    )
    .forEach(button => {

      button.onclick = async () => {

        if (loadingSchedule) {
          return;
        }

        button.classList.add("loading");

        const icon =
          button.querySelector(
            ".iko-update-icon"
          );

        const text =
          button.querySelector(
            ".iko-update-text"
          );

        if (icon) {
          icon.textContent = "⟳";
        }

        if (text) {
          text.textContent = "UPDATING";
        }

        try {

          await loadSchedule();

        } finally {

          button.classList.remove(
            "loading"
          );

          if (icon) {
            icon.textContent = "↻";
          }

          if (text) {
            text.textContent = "UPDATE";
          }

        }

      };

    });

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
      "[IKOTV] FULL MATCH RESULT:",
      result
    );

    console.log(
      "[IKOTV] STREAM-URL RAW RESULT:",
      JSON.stringify(result, null, 2)
    );

    /* ==========================================
       PARSE SERVER
    ========================================== */

    const videos = extractVideos(result);

    console.log(
      "[IKOTV] EXTRACTED SERVERS:",
      videos
    );

console.log("========== IKOTV ALL STREAM URL ==========");

videos.forEach((video, index) => {

  console.log(
    `[IKOTV STREAM ${index + 1}]`,
    video.display_name ||
    video.name ||
    video.type_name ||
    `LIVE ${index + 1}`
  );

  console.log(
    `[IKOTV URL ${index + 1}]`,
    video.url
  );

});

console.log(
  "[IKOTV TOTAL STREAM]:",
  videos.length
);

console.log("==========================================");

    /* ==========================================
       SERVER TIDAK DITEMUKAN
    ========================================== */

    if (!videos.length) {

      panel.innerHTML = `
        <div class="iko-server-error">
          Stream server is unavailable..
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
        LIVE SERVER : 👇
      </div>

      <div class="iko-server-list">

        ${videos.map((video, index) => {

  const originalLabel =
  video.display_name ||
  video.name ||
  video.type_name ||
  `LIVE ${index + 1}`;

const label =
  /^SC\d+$/i.test(String(originalLabel).trim())
    ? String(originalLabel).trim().replace(/^SC/i, "CH")
    : originalLabel;

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
   HLS + MPD + CLEARKEY
========================================================= */

function extractVideos(result) {
  const videos = [];

  function isImageURL(url) {
    return /\.(jpg|jpeg|png|webp|gif|svg|ico|bmp|avif)(?:[?#]|$)/i
      .test(String(url || ""));
  }

  function isVideoURL(url) {
    if (!url || typeof url !== "string") {
      return false;
    }

    const value = url.trim();

    if (!/^https?:\/\//i.test(value)) {
      return false;
    }

    if (isImageURL(value)) {
      return false;
    }

    if (/\.(m3u8|flv|mpd|mp4|m4s|ts)(?:[?#]|$)/i.test(value)) {
      return true;
    }

    if (/\/(iframe|embed|player|stream|video|source|media)\b/i.test(value)) {
      return true;
    }

    if (
      /[?&](m3u8|mpd|flv|mp4|stream|video|player|url|src|file|source)=/i.test(value)
    ) {
      return true;
    }

    return false;
  }

  function getVideoURL(item) {
    if (!item) {
      return "";
    }

    if (typeof item === "string") {
      const url = safeURL(item);
      return isVideoURL(url) ? url : "";
    }

    if (typeof item !== "object") {
      return "";
    }

    const fields = [
      "url",
      "src",
      "stream_url",
      "streamUrl",
      "stream",
      "play_url",
      "playUrl",
      "m3u8",
      "hls",
      "flv",
      "mpd",
      "dash",
      "manifest",
      "manifest_url",
      "manifestUrl",
      "iframe",
      "iframe_url",
      "iframeUrl",
      "embed",
      "embed_url",
      "embedUrl",
      "player",
      "player_url",
      "playerUrl",
      "link",
      "file",
      "file_url",
      "fileUrl",
      "source_url",
      "sourceUrl",
      "video_url",
      "videoUrl"
    ];

    for (const field of fields) {
      const value = item[field];

      if (typeof value !== "string") {
        continue;
      }

      const url = safeURL(value);

      if (isVideoURL(url)) {
        return url;
      }
    }

    const nestedFields = [
      "source",
      "sources",
      "stream",
      "streams",
      "video",
      "videos",
      "media",
      "file",
      "player"
    ];

    for (const field of nestedFields) {
      const nested = item[field];

      if (nested && typeof nested === "object") {
        if (Array.isArray(nested)) {
          for (const child of nested) {
            const nestedURL = getVideoURL(child);

            if (nestedURL) {
              return nestedURL;
            }
          }
        } else {
          const nestedURL = getVideoURL(nested);

          if (nestedURL) {
            return nestedURL;
          }
        }
      }
    }

    return "";
  }

  function getVideoName(item, index, fallbackName = "") {
    if (item && typeof item === "object") {
      const name =
        item.display_name ||
        item.displayName ||
        item.server_name ||
        item.serverName ||
        item.server ||
        item.name ||
        item.title ||
        item.label ||
        item.channel ||
        item.channel_name ||
        item.channelName ||
        item.provider ||
        item.source_name ||
        item.sourceName ||
        fallbackName ||
        "";

      if (String(name).trim()) {
        return String(name).trim();
      }
    }

    if (String(fallbackName).trim()) {
      return String(fallbackName).trim();
    }

    return `LIVE ${index + 1}`;
  }

  function getType(item, url) {
    let type = "";

    if (item && typeof item === "object") {
      type =
        item.type ||
        item.format ||
        item.protocol ||
        item.type_name ||
        item.typeName ||
        "";
    }

    if (/\.mpd(?:[?#]|$)/i.test(url)) {
      type = "dash";
    } else if (/\.m3u8(?:[?#]|$)/i.test(url)) {
      type = "hls";
    } else if (/\.flv(?:[?#]|$)/i.test(url)) {
      type = "flv";
    } else if (/\.mp4(?:[?#]|$)/i.test(url)) {
      type = "mp4";
    }

    return String(type || "").toLowerCase();
  }

  function getKeys(item) {
    let kid = "";
    let key = "";
    let clearKeys = null;

    if (item && typeof item === "object") {
      kid =
        item.kid ||
        item.KID ||
        item.kid_hex ||
        item.kidHex ||
        item.default_kid ||
        item.defaultKID ||
        "";

      key =
        item.key ||
        item.KEY ||
        item.key_hex ||
        item.keyHex ||
        "";

      clearKeys =
        item.clearKeys ||
        item.clear_keys ||
        item.clearkeys ||
        item.clear_keys_map ||
        item.drm?.clearKeys ||
        null;
    }

    if (!clearKeys && kid && key) {
      clearKeys = {
        [String(kid).replace(/-/g, "").toLowerCase()]:
          String(key).replace(/-/g, "").toLowerCase()
      };
    }

    return {
      kid,
      key,
      clearKeys
    };
  }

  function addVideo(item, index, fallbackName = "") {
    const url = getVideoURL(item);

    if (!url) {
      return;
    }

    const keys = getKeys(item);
    const type = getType(item, url);
    const name = getVideoName(item, index, fallbackName);

    videos.push({
      url: url,
      type: type,
      kid: keys.kid,
      key: keys.key,
      clearKeys: keys.clearKeys,
      name: name,
      display_name: name,
      type_name: type
    });

    console.log("[IKOTV] SERVER FOUND:", {
      index: index + 1,
      name: name,
      type: type,
      url: url
    });
  }

  function processCollection(collection, baseIndex = 0) {
    if (!collection) {
      return;
    }

    if (Array.isArray(collection)) {
      collection.forEach((item, index) => {
        addVideo(item, baseIndex + index);
      });

      return;
    }

    if (typeof collection === "object") {
      Object.entries(collection).forEach(([objectKey, item], index) => {
        if (item && typeof item === "object") {
          addVideo(item, baseIndex + index, objectKey);
        } else if (typeof item === "string") {
          addVideo(
            {
              url: item,
              name: objectKey
            },
            baseIndex + index,
            objectKey
          );
        }
      });
    }
  }

  /*
   * PENTING:
   * Jangan pakai break setelah menemukan videos.
   * Semua sumber server diproses.
   */
  const candidates = [
    ["data.videos", result?.data?.videos],
    ["videos", result?.videos],

    ["data.streams", result?.data?.streams],
    ["streams", result?.streams],

    ["data.servers", result?.data?.servers],
    ["servers", result?.servers],

    ["data.sources", result?.data?.sources],
    ["sources", result?.sources],

    ["data.channels", result?.data?.channels],
    ["channels", result?.channels],

    ["data.links", result?.data?.links],
    ["links", result?.links],

    ["data.players", result?.data?.players],
    ["players", result?.players]
  ];

  let totalIndex = 0;

  for (const [label, candidate] of candidates) {
    if (!candidate) {
      continue;
    }

    const before = videos.length;

    processCollection(candidate, totalIndex);

    const added = videos.length - before;

    if (added > 0) {
      console.log(
        `[IKOTV] ${label}: ${added} server ditemukan`
      );

      totalIndex += added;
    }
  }

  /*
   * Deduplicate berdasarkan URL.
   */
  const unique = [];
  const seen = new Set();

  videos.forEach(video => {
    const key = String(video.url)
      .trim()
      .toLowerCase();

    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    unique.push(video);
  });

  /*
   * Jika nama server kosong, beri nama LIVE 1, LIVE 2, dst.
   */
  unique.forEach((video, index) => {
    if (
      !video.name ||
      /^LIVE \d+$/i.test(String(video.name))
    ) {
      video.name = `LIVE ${index + 1}`;
      video.display_name = video.name;
    }
  });

  console.log("[IKOTV] PARSED MATCH SERVERS:", unique);
  console.log("[IKOTV] MATCH SERVER COUNT:", unique.length);

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
      : statusElement.classList.contains("waiting")
        ? "waiting"
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
      Failed to load the schedule. Turn your internet connection off and on, then try again!
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
   COUNTDOWN TIMER
========================================================= */

function startCountdownTimer() {

  setInterval(
    () => {

      updateCountdowns();

    },
    CONFIG.countdownMs
  );

}
/* =========================================================
   AUTO CHECK LIVE IKOTV
   Match yang sudah hilang dari LIVE IKOTV
   akan otomatis dihapus dari jadwal
========================================================= */

let liveMonitorStarted = false;

function startLiveMonitor() {

  if (liveMonitorStarted) {
    return;
  }

  liveMonitorStarted = true;

  setInterval(
    async () => {

      if (loadingSchedule) {
        return;
      }

      try {

        const oldMatches =
          matches.map(match => ({
            id: String(match.id),
            time: match.time,
            isLive: match.isLive === true
          }));

        const newMatches =
          await fetchMatches();

        const oldIDs =
          oldMatches
            .map(match => String(match.id))
            .join(",");

        const newIDs =
          newMatches
            .map(match => String(match.id))
            .join(",");

        const oldLive =
          oldMatches
            .filter(match => match.isLive)
            .map(match => String(match.id))
            .join(",");

        const newLive =
          newMatches
            .filter(match => match.isLive)
            .map(match => String(match.id))
            .join(",");

        const changed =
          oldIDs !== newIDs ||
          oldLive !== newLive;

        matches =
          newMatches;

        /*
         * Hanya render ulang kalau
         * daftar pertandingan memang berubah.
         *
         * Jadi tidak render setiap 30 detik
         * kalau tidak ada perubahan.
         */
        if (changed) {

          console.log(
            "[IKOTV] LIVE status berubah. Update schedule."
          );

          renderSchedule();

        }

      } catch (error) {

        console.warn(
          "[IKOTV] Auto LIVE check gagal:",
          error
        );

      }

    },
    CONFIG.liveCheckMs
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

     startCountdownTimer();

     startLiveMonitor();

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
