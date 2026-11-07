/! IKOTV Auto Schedule * N11BOLAHD

*/

(() => { “use strict”;

const CONFIG = { api: { matches:
“https://rough-bread-fac0-ikotv-api.novendibagus5.workers.dev/api/matches”,
matchInfo:
“https://rough-bread-fac0-ikotv-api.novendibagus5.workers.dev/match-info”,
streamUrl:
“https://rough-bread-fac0-ikotv-api.novendibagus5.workers.dev/stream-url”
},

    selectors: {
      schedule: "#ikotvSchedule",
      player: "#tv"
    },

    countdownMs: 1000,
    liveCheckMs: 30000,

    libs: {
      hls: "https://cdn.jsdelivr.net/npm/hls.js@1.6.2/dist/hls.min.js",
      mpegts: "https://cdn.jsdelivr.net/npm/mpegts.js@1.7.3/dist/mpegts.min.js",
      shaka: "https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.16.12/shaka-player.compiled.js",
      shakaCSS: "https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.16.12/controls.css"
    }

};

let allMatches = []; let currentSearch = ““; let countdownTimer = null;
let liveTimer = null;

function $(selector, root = document) { return
root.querySelector(selector); }

function escapeHTML(value) { return String(value ?? ““)
.replace(/&/g,”&“) .replace(/</g,”<“) .replace(/>/g,”>“) .replace(/”/g,
“"“) .replace(/’/g,”'“); }

function safeURL(value) { try { return new URL(String(value),
location.href).href; } catch (_) { return String(value || ““).trim(); }
}

function getArray(result) { if (!result) return [];

    const candidates = [
      result?.data?.matchs,
      result?.data?.matches,
      result?.data?.list,
      result?.matchs,
      result?.matches,
      result?.list,
      result?.data
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return [];

}

function formatTime(timestamp) { const date = new
Date(Number(timestamp) * 1000);

    if (isNaN(date.getTime())) {
      return "--:--";
    }

    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

}

function formatDate(timestamp) { const date = new
Date(Number(timestamp) * 1000);

    if (isNaN(date.getTime())) {
      return "Unknown Date";
    }

    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

}

function dateKey(timestamp) { const date = new Date(Number(timestamp) *
1000);

    if (isNaN(date.getTime())) {
      return "";
    }

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");

}

function countdown(timestamp) { const diff = Number(timestamp) * 1000 -
Date.now();

    if (diff <= 0) {
      return "LIVE";
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}

function getStatus(match) { const now = Math.floor(Date.now() / 1000);
const start = Number(match.time || 0);

    if (match.isLive === true) {
      return "live";
    }

    if (now < start) {
      return "upcoming";
    }

    return "waiting";

}

function normalizeMatch(match) { return { …match, id: match.id ??
match.match_id ?? match.matchId, time: Number(match.time ??
match.start_time ?? match.startTime ?? 0), home: match.home ??
match.home_name ?? match.homeName ?? “Home”, away: match.away ??
match.away_name ?? match.awayName ?? “Away”, competition:
match.competition ?? match.competition_name ?? match.competitionName ??
““, homeLogo: match.homeLogo ?? match.home_logo ?? match.home_image ??
match.homeImage ??”“, awayLogo: match.awayLogo ?? match.away_logo ??
match.away_image ?? match.awayImage ??”“, isLive: match.isLive === true
}; }

function ensureDOM() { if (!$(CONFIG.selectors.schedule)) { const
schedule = document.createElement(“div”); schedule.id = “ikotvSchedule”;
document.body.appendChild(schedule); }

    if (!$(CONFIG.selectors.player)) {
      const tv = document.createElement("div");
      tv.id = "tv";
      document.body.appendChild(tv);
    }

}

function injectCSS() { if ($(“#ikotvAutoScheduleCSS”)) { return; }

    const style = document.createElement("style");
    style.id = "ikotvAutoScheduleCSS";

    style.textContent = `
      #ikotvSchedule{
        width:95%;
        max-width:900px;
        margin:20px auto;
        color:#fff;
        font-family:"Courier New",monospace;
      }

      .iko-date{
        position:sticky;
        top:0;
        z-index:20;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        background:#111;
        color:#00d979;
        border-left:4px solid #00d979;
        padding:10px 12px;
        margin:14px 0 8px;
        font-weight:bold;
        box-sizing:border-box;
      }

      .iko-date-actions{
        display:flex;
        align-items:center;
        gap:8px;
      }

      .iko-update-btn{
        border:1px solid #00d979;
        background:#111;
        color:#00d979;
        padding:4px 10px;
        cursor:pointer;
        font-family:inherit;
        font-size:12px;
      }

      .iko-update-btn:hover{
        background:#00d979;
        color:#111;
      }

      .iko-search-input{
        width:130px;
        height:28px;
        box-sizing:border-box;
        background:#111;
        color:#fff;
        border:1px solid #333;
        outline:none;
        padding:4px 7px;
        font-family:inherit;
      }

      .iko-search-input:focus{
        border-color:#00d979;
      }

      .iko-card{
        background:#111;
        border:1px solid #222;
        border-left:3px solid #00d979;
        padding:10px;
        margin:8px 0;
        box-sizing:border-box;
      }

      .iko-card:hover{
        border-color:#00d979;
      }

      .iko-card-main{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
      }

      .iko-match{
        flex:1;
        min-width:0;
      }

      .iko-time{
        color:#00d979;
        font-weight:bold;
        font-size:14px;
        margin-bottom:4px;
      }

      .iko-comp{
        color:#aaa;
        font-size:11px;
        margin-bottom:6px;
      }

      .iko-teams{
        display:flex;
        align-items:center;
        gap:8px;
        color:#fff;
        font-size:13px;
        line-height:1.4;
      }

      .iko-team{
        display:flex;
        align-items:center;
        gap:6px;
        min-width:0;
      }

      .iko-team img{
        width:24px;
        height:24px;
        object-fit:contain;
        flex:none;
      }

      .iko-vs{
        color:#777;
      }

      .iko-right{
        display:flex;
        align-items:center;
        gap:8px;
        flex:none;
      }

      .iko-status{
        font-size:11px;
        font-weight:bold;
        padding:4px 7px;
        border:1px solid #333;
        white-space:nowrap;
      }

      .iko-status.live{
        color:#ff4040;
        border-color:#ff4040;
      }

      .iko-status.upcoming{
        color:#00d979;
        border-color:#00d979;
      }

      .iko-status.waiting{
        color:#888;
        border-color:#333;
      }

      .iko-watch{
        display:inline-block;
        text-decoration:none;
        color:#111;
        background:#00d979;
        border:1px solid #00d979;
        padding:5px 10px;
        font-size:11px;
        font-family:inherit;
        cursor:pointer;
      }

      .iko-watch:hover{
        background:#111;
        color:#00d979;
      }

      .iko-empty{
        text-align:center;
        color:#888;
        padding:20px 10px;
      }

      #tv{
        width:100%;
        max-width:100%;
        margin:0 auto;
        background:#000;
        min-height:0;
        color:#fff;
      }

      #tv video{
        width:100%;
        height:auto;
        display:block;
        background:#000;
      }

      .iko-player{
        width:100%;
        background:#000;
      }

      .iko-server-list{
        display:flex;
        flex-wrap:wrap;
        gap:7px;
        padding:10px;
        background:#111;
        border-top:1px solid #222;
      }

      .iko-server-btn{
        border:1px solid #00d979;
        background:#111;
        color:#00d979;
        padding:6px 10px;
        cursor:pointer;
        font-family:"Courier New",monospace;
        font-size:11px;
      }

      .iko-server-btn.active,
      .iko-server-btn:hover{
        background:#00d979;
        color:#111;
      }

      @media(max-width:600px){
        #ikotvSchedule{
          width:100%;
        }

        .iko-card-main{
          align-items:flex-start;
        }

        .iko-right{
          flex-direction:column;
          align-items:flex-end;
        }

        .iko-teams{
          flex-direction:column;
          align-items:flex-start;
        }

        .iko-vs{
          display:none;
        }

        .iko-date{
          flex-wrap:wrap;
        }
      }
    `;

    document.head.appendChild(style);

}

function loadScript(src) { return new Promise((resolve, reject) => {
const existing = Array.from(document.scripts).find( script => script.src
=== src );

      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
        } else {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", reject, { once: true });
        }
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;

      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };

      script.onerror = reject;

      document.head.appendChild(script);
    });

}

async function loadLibraries() { try { if (!window.Hls) { await
loadScript(CONFIG.libs.hls); } } catch (error) { console.warn(“[IKOTV]
HLS.js gagal dimuat:”, error); }

    try {
      if (!window.mpegts) {
        await loadScript(CONFIG.libs.mpegts);
      }
    } catch (error) {
      console.warn("[IKOTV] mpegts.js gagal dimuat:", error);
    }

    try {
      if (!window.shaka) {
        await loadScript(CONFIG.libs.shaka);
      }
    } catch (error) {
      console.warn("[IKOTV] Shaka Player gagal dimuat:", error);
    }

    if (!document.querySelector('link[data-ikotv-shaka-css]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CONFIG.libs.shakaCSS;
      link.dataset.ikotvShakaCss = "true";
      document.head.appendChild(link);
    }

}

async function postJSON(url, body = {}) { const response = await
fetch(url, { method: “POST”, headers: { “Content-Type”:
“application/json” }, body: JSON.stringify(body) });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();

}

async function getMatchesAPI() { const response = await
fetch(CONFIG.api.matches, { method: “GET”, cache: “no-store” });

    if (!response.ok) {
      throw new Error(`Matches HTTP ${response.status}`);
    }

    return response.json();

}

async function fetchMatches() { const result = await getMatchesAPI();
const matches = getArray(result).map(normalizeMatch);

    let live = [];

    try {
      const liveResult = await fetch(
        `${CONFIG.api.matches}/live`,
        {
          method: "GET",
          cache: "no-store"
        }
      );

      if (liveResult.ok) {
        const liveJSON = await liveResult.json();
        live = getArray(liveJSON).map(match => ({
          ...normalizeMatch(match),
          isLive: true
        }));
      }
    } catch (error) {
      console.warn("[IKOTV] Live API gagal:", error);
    }

    const map = new Map();

    [...matches, ...live].forEach(match => {
      const id = String(match.id ?? `${match.home}-${match.away}-${match.time}`);

      if (map.has(id)) {
        map.set(id, {
          ...map.get(id),
          ...match,
          isLive:
            match.isLive === true ||
            map.get(id).isLive === true
        });
      } else {
        map.set(id, match);
      }
    });

    return Array.from(map.values());

}

async function fetchMatchInfo(matchId) { const candidates = [
${CONFIG.api.matchInfo}/${encodeURIComponent(matchId)},
${CONFIG.api.matchInfo}?id=${encodeURIComponent(matchId)} ];

    let lastError = null;

    for (const url of candidates) {
      try {
        const response = await fetch(url, {
          method: "GET",
          cache: "no-store"
        });

        if (!response.ok) {
          lastError = new Error(`Match info HTTP ${response.status}`);
          continue;
        }

        return await response.json();
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Match info gagal");

}

async function fetchStreamURL(matchId) { try { const result = await
postJSON(CONFIG.api.streamUrl, { id: matchId, match_id: matchId,
matchId: matchId });

      if (result?.data?.videos && Array.isArray(result.data.videos)) {
        return result.data.videos;
      }

      return result;
    } catch (error) {
      console.warn("[IKOTV] stream-url POST gagal:", error);

      try {
        const result = await fetchMatchInfo(matchId);

        if (result?.data?.videos && Array.isArray(result.data.videos)) {
          return result.data.videos;
        }

        return result;
      } catch (fallbackError) {
        console.error("[IKOTV] Semua stream source gagal:", fallbackError);
        throw fallbackError;
      }
    }

}

function destroyIKOTVPlayer() { const tv = $(CONFIG.selectors.player);

    if (!tv) {
      return;
    }

    try {
      if (tv._hls) {
        tv._hls.destroy();
        tv._hls = null;
      }
    } catch (_) {}

    try {
      if (tv._mpegts) {
        tv._mpegts.destroy();
        tv._mpegts = null;
      }
    } catch (_) {}

    try {
      if (tv._shaka) {
        tv._shaka.destroy();
        tv._shaka = null;
      }
    } catch (_) {}

    tv.innerHTML = "";

}

function getStreamType(video) { const type = String( video?.type ||
video?.format || video?.protocol || video?.type_name || “”
).toLowerCase();

    if (type.includes("dash") || type.includes("mpd")) {
      return "dash";
    }

    if (type.includes("hls") || type.includes("m3u8")) {
      return "hls";
    }

    if (type.includes("flv")) {
      return "flv";
    }

    if (type.includes("iframe") || type.includes("embed")) {
      return "iframe";
    }

    const url = String(video?.url || "");

    if (/\.mpd(?:[?#]|$)/i.test(url)) {
      return "dash";
    }

    if (/\.m3u8(?:[?#]|$)/i.test(url)) {
      return "hls";
    }

    if (/\.flv(?:[?#]|$)/i.test(url)) {
      return "flv";
    }

    if (/\/(iframe|embed|player)\b/i.test(url)) {
      return "iframe";
    }

    return type || "hls";

}

function normalizeIKOTVDASH(url) { return String(url || ““).trim(); }

async function playIKOTVHLS(url) { const tv =
$(CONFIG.selectors.player);

    if (!tv) {
      return;
    }

    destroyIKOTVPlayer();

    const video = document.createElement("video");
    video.controls = true;
    video.playsInline = true;
    video.autoplay = false;
    video.preload = "metadata";

    tv.appendChild(video);

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });

      tv._hls = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.ERROR, function (_, data) {
        console.warn("[IKOTV HLS ERROR]", data);

        if (data?.fatal) {
          try {
            if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              hls.destroy();
            }
          } catch (_) {}
        }
      });

      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      return;
    }

    video.src = url;

}

function playIKOTVIframe(url) { const tv = $(CONFIG.selectors.player);

    if (!tv) {
      return;
    }

    destroyIKOTVPlayer();

    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.allowFullscreen = true;
    iframe.setAttribute(
      "allow",
      "autoplay; fullscreen; encrypted-media; picture-in-picture"
    );
    iframe.style.width = "100%";
    iframe.style.height = "500px";
    iframe.style.border = "0";
    iframe.style.display = "block";

    tv.appendChild(iframe);

}

function getClearKeys(video) { if (!video) { return null; }

    if (video.clearKeys && typeof video.clearKeys === "object") {
      return video.clearKeys;
    }

    const kid =
      video.kid ||
      video.KID ||
      video.kid_hex ||
      video.kidHex ||
      "";

    const key =
      video.key ||
      video.KEY ||
      video.key_hex ||
      video.keyHex ||
      "";

    if (!kid || !key) {
      return null;
    }

    return {
      [String(kid).replace(/-/g, "").toLowerCase()]:
        String(key).replace(/-/g, "").toLowerCase()
    };

}

async function playIKOTVDASH(url, video) { const tv =
$(CONFIG.selectors.player);

    if (!tv) {
      return;
    }

    destroyIKOTVPlayer();

    if (!window.shaka) {
      console.error("[IKOTV] Shaka Player tidak tersedia");
      playIKOTVIframe(url);
      return;
    }

    const videoElement = document.createElement("video");

    videoElement.controls = true;
    videoElement.playsInline = true;
    videoElement.autoplay = false;
    videoElement.preload = "metadata";

    tv.appendChild(videoElement);

    try {
      const player = new window.shaka.Player();
      await player.attach(videoElement);

      tv._shaka = player;

      const clearKeys = getClearKeys(video);

      if (clearKeys) {
        player.configure({
          drm: {
            clearKeys: clearKeys
          }
        });
      }

      await player.load(normalizeIKOTVDASH(url));
    } catch (error) {
      console.error("[IKOTV DASH ERROR]", error);

      try {
        destroyIKOTVPlayer();
        playIKOTVIframe(url);
      } catch (_) {}
    }

}

function playIKOTVFLV(url) { const tv = $(CONFIG.selectors.player);

    if (!tv) {
      return;
    }

    destroyIKOTVPlayer();

    if (window.mpegts && window.mpegts.isSupported()) {
      const video = document.createElement("video");

      video.controls = true;
      video.playsInline = true;
      video.autoplay = false;
      video.preload = "metadata";

      tv.appendChild(video);

      const player = window.mpegts.createPlayer({
        type: "flv",
        url: url,
        isLive: true
      });

      tv._mpegts = player;

      player.attachMediaElement(video);
      player.load();

      return;
    }

    console.warn("[IKOTV] mpegts.js tidak tersedia, mencoba iframe");
    playIKOTVIframe(url);

}

async function playIKOTVStream(video) { if (!video || !video.url) {
return; }

    const type = getStreamType(video);

    console.log("[IKOTV] PLAY SERVER:", video);
    console.log("[IKOTV] STREAM TYPE:", type);
    console.log("[IKOTV] PLAYER:", {
      hls: !!window.Hls,
      mpegts: !!window.mpegts,
      shaka: !!window.shaka
    });

    if (type === "dash") {
      await playIKOTVDASH(video.url, video);
      return;
    }

    if (type === "iframe") {
      playIKOTVIframe(video.url);
      return;
    }

    if (type === "flv") {
      playIKOTVFLV(video.url);
      return;
    }

    await playIKOTVHLS(video.url);

}

function renderSchedule(matches) { const container =
$(CONFIG.selectors.schedule);

    if (!container) {
      return;
    }

    const filtered = matches
      .filter(match => {
        const text = [
          match.home,
          match.away,
          match.competition
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(currentSearch.toLowerCase());
      })
      .sort((a, b) => Number(a.time) - Number(b.time));

    if (!filtered.length) {
      container.innerHTML = `<div class="iko-empty">No matches found.</div>`;
      return;
    }

    const groups = new Map();

    filtered.forEach(match => {
      const key = dateKey(match.time);

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key).push(match);
    });

    let html = "";

    groups.forEach((group, key) => {
      const first = group[0];

      html += `
        <div class="iko-date">
          <span>${escapeHTML(formatDate(first.time))}</span>

          <div class="iko-date-actions">
            <input
              class="iko-search-input"
              type="search"
              placeholder="Search match..."
              value="${escapeHTML(currentSearch)}"
            >

            <button class="iko-update-btn" type="button">
              ↻ UPDATE
            </button>
          </div>
        </div>
      `;

      group.forEach(match => {
        const status = getStatus(match);

        let statusText = "";
        let watchButton = "";

        if (status === "live") {
          statusText = "LIVE";

          watchButton = `
            <button
              class="iko-watch"
              type="button"
              data-match-id="${escapeHTML(match.id)}"
            >
              WATCH LIVE
            </button>
          `;
        } else if (status === "upcoming") {
          statusText = countdown(match.time);

          watchButton = `
            <span class="iko-status upcoming">
              ${escapeHTML(statusText)}
            </span>
          `;
        } else {
          statusText = "WAITING";

          watchButton = `
            <span class="iko-status waiting">
              WAITING
            </span>
          `;
        }

        html += `
          <div class="iko-card">
            <div class="iko-card-main">

              <div class="iko-match">
                <div class="iko-time">
                  ${escapeHTML(formatTime(match.time))}
                </div>

                <div class="iko-comp">
                  ${escapeHTML(match.competition || "")}
                </div>

                <div class="iko-teams">
                  <div class="iko-team">
                    ${
                      match.homeLogo
                        ? `<img src="${escapeHTML(safeURL(match.homeLogo))}" alt="">`
                        : ""
                    }

                    <span>${escapeHTML(match.home)}</span>
                  </div>

                  <span class="iko-vs">vs</span>

                  <div class="iko-team">
                    ${
                      match.awayLogo
                        ? `<img src="${escapeHTML(safeURL(match.awayLogo))}" alt="">`
                        : ""
                    }

                    <span>${escapeHTML(match.away)}</span>
                  </div>
                </div>
              </div>

              <div class="iko-right">
                <div class="iko-status ${status}">
                  ${escapeHTML(statusText)}
                </div>

                ${watchButton}
              </div>

            </div>
          </div>
        `;
      });
    });

    container.innerHTML = html;
    setupSearchButtons();
    setupUpdateButtons();

    container.querySelectorAll(".iko-watch").forEach(button => {
      button.addEventListener("click", () => {
        const matchId = button.dataset.matchId;

        if (matchId) {
          openIKOMatch(matchId);
        }
      });
    });

}

function setupSearchButtons() { const container =
$(CONFIG.selectors.schedule);

    if (!container) {
      return;
    }

    container.querySelectorAll(".iko-search-input").forEach(input => {
      input.addEventListener("input", event => {
        currentSearch = event.target.value || "";
        renderSchedule(allMatches);
      });
    });

}

function setupUpdateButtons() { const container =
$(CONFIG.selectors.schedule);

    if (!container) {
      return;
    }

    container.querySelectorAll(".iko-update-btn").forEach(button => {
      button.addEventListener("click", async () => {
        button.disabled = true;
        button.textContent = "UPDATING...";

        try {
          allMatches = await fetchMatches();
          renderSchedule(allMatches);
        } catch (error) {
          console.error("[IKOTV] Update gagal:", error);
        } finally {
          button.disabled = false;
          button.textContent = "↻ UPDATE";
        }
      });
    });

}

async function openIKOMatch(matchId) { try { console.log(“[IKOTV] OPEN
MATCH:”, matchId);

      const result = await fetchStreamURL(matchId);

      console.log("[IKOTV] RAW STREAM:", result);

      const videos = extractVideos(result);

      console.log("[IKOTV] FINAL SERVER LIST:", videos);

      if (!videos.length) {
        alert("Server stream tidak ditemukan.");
        return;
      }

      const tv = $(CONFIG.selectors.player);

      if (!tv) {
        return;
      }

      tv.innerHTML = "";

      const playerWrap = document.createElement("div");
      playerWrap.className = "iko-player";

      const videoArea = document.createElement("div");
      videoArea.className = "iko-video-area";

      const serverList = document.createElement("div");
      serverList.className = "iko-server-list";

      playerWrap.appendChild(videoArea);
      playerWrap.appendChild(serverList);

      tv.appendChild(playerWrap);

      const videoElement = document.createElement("div");
      videoElement.style.width = "100%";
      videoElement.style.minHeight = "0";

      videoArea.appendChild(videoElement);

      function setActive(index) {
        serverList
          .querySelectorAll(".iko-server-btn")
          .forEach((button, buttonIndex) => {
            button.classList.toggle("active", buttonIndex === index);
          });
      }

      videos.forEach((video, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "iko-server-btn";
        button.textContent =
          video.display_name ||
          video.name ||
          `LIVE ${index + 1}`;

        button.addEventListener("click", async () => {
          setActive(index);

          const oldPlayer = $(CONFIG.selectors.player);

          if (oldPlayer) {
            oldPlayer.innerHTML = "";
          }

          const freshWrap = document.createElement("div");
          freshWrap.className = "iko-player";

          const freshVideoArea = document.createElement("div");
          freshVideoArea.className = "iko-video-area";

          const freshServerList = document.createElement("div");
          freshServerList.className = "iko-server-list";

          freshWrap.appendChild(freshVideoArea);
          freshWrap.appendChild(freshServerList);

          oldPlayer.appendChild(freshWrap);

          videos.forEach((serverVideo, serverIndex) => {
            const serverButton = document.createElement("button");

            serverButton.type = "button";
            serverButton.className = "iko-server-btn";

            if (serverIndex === index) {
              serverButton.classList.add("active");
            }

            serverButton.textContent =
              serverVideo.display_name ||
              serverVideo.name ||
              `LIVE ${serverIndex + 1}`;

            serverButton.addEventListener("click", async () => {
              setActive(serverIndex);

              oldPlayer.innerHTML = "";

              const newWrap = document.createElement("div");
              newWrap.className = "iko-player";

              const newVideoArea = document.createElement("div");
              newVideoArea.className = "iko-video-area";

              const newServerList = document.createElement("div");
              newServerList.className = "iko-server-list";

              newWrap.appendChild(newVideoArea);
              newWrap.appendChild(newServerList);

              oldPlayer.appendChild(newWrap);

              videos.forEach((sv, si) => {
                const b = document.createElement("button");

                b.type = "button";
                b.className = "iko-server-btn";

                if (si === serverIndex) {
                  b.classList.add("active");
                }

                b.textContent =
                  sv.display_name ||
                  sv.name ||
                  `LIVE ${si + 1}`;

                b.addEventListener("click", () => {
                  playIKOTVStream(sv);
                });

                newServerList.appendChild(b);
              });

              await playIKOTVStream(serverVideo);
            });

            freshServerList.appendChild(serverButton);
          });

          oldPlayer.innerHTML = "";
          oldPlayer.appendChild(freshWrap);

          await playIKOTVStream(video);
        });

        serverList.appendChild(button);
      });

      setActive(0);

      await playIKOTVStream(videos[0]);

    } catch (error) {
      console.error("[IKOTV] OPEN MATCH ERROR:", error);
      alert("Gagal mengambil stream pertandingan.");
    }

}

/ ========================================================= * EXTRACT
VIDEOS * ========================================================= */

function extractVideos(result) { const videos = [];

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

      if (
        /\.(m3u8|flv|mpd|mp4|m4s|ts)(?:[?#]|$)/i.test(value)
      ) {
        return true;
      }

      if (
        /\/(iframe|embed|player|stream|video|source|media)\b/i.test(value)
      ) {
        return true;
      }

      if (
        /[?&](m3u8|mpd|flv|mp4|stream|video|player|url|src|file|source)=/i.test(
          value
        )
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
        "player",
        "data"
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

      if (/\.(mpd)(?:[?#]|$)/i.test(url)) {
        type = "dash";
      } else if (/\.(m3u8)(?:[?#]|$)/i.test(url)) {
        type = "hls";
      } else if (/\.(flv)(?:[?#]|$)/i.test(url)) {
        type = "flv";
      } else if (/\.(mp4)(?:[?#]|$)/i.test(url)) {
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
          if (
            item &&
            typeof item === "object" &&
            !Array.isArray(item)
          ) {
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
     * Fallback scan:
     * Jika API memiliki struktur lain, cari object/array
     * yang mengandung URL stream tanpa mengubah object
     * utama menjadi satu server palsu.
     */
    function scanNested(value, path = "", depth = 0) {
      if (!value || depth > 6) {
        return;
      }

      if (typeof value === "string") {
        const url = safeURL(value);

        if (isVideoURL(url)) {
          const alreadyExists = videos.some(
            video =>
              String(video.url).trim().toLowerCase() ===
              String(url).trim().toLowerCase()
          );

          if (!alreadyExists) {
            addVideo(
              {
                url: url,
                name: path.split(".").pop() || ""
              },
              videos.length,
              path.split(".").pop() || ""
            );
          }
        }

        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          scanNested(item, `${path}[${index}]`, depth + 1);
        });

        return;
      }

      if (typeof value === "object") {
        Object.entries(value).forEach(([key, child]) => {
          const nextPath = path ? `${path}.${key}` : key;

          if (
            typeof child === "string" &&
            isVideoURL(safeURL(child))
          ) {
            const url = safeURL(child);

            const alreadyExists = videos.some(
              video =>
                String(video.url).trim().toLowerCase() ===
                String(url).trim().toLowerCase()
            );

            if (!alreadyExists) {
              addVideo(
                {
                  url: url,
                  name: key
                },
                videos.length,
                key
              );
            }

            return;
          }

          if (
            child &&
            typeof child === "object"
          ) {
            scanNested(child, nextPath, depth + 1);
          }
        });
      }
    }

    if (!videos.length) {
      scanNested(result);
    }

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

/ ========================================================= * REFRESH /
COUNTDOWN * ========================================================= */

function updateCountdowns() { if (!allMatches.length) { return; }

    const cards = document.querySelectorAll(
      `${CONFIG.selectors.schedule} .iko-card`
    );

    cards.forEach(card => {
      const watch = card.querySelector(".iko-watch");
      const status = card.querySelector(".iko-status");

      if (!watch && !status) {
        return;
      }
    });

}

async function refreshSchedule() { try { console.log(“[IKOTV] FETCHING
SCHEDULE…”);

      const matches = await fetchMatches();

      allMatches = matches;

      console.log(
        "[IKOTV] MATCH COUNT:",
        allMatches.length
      );

      renderSchedule(allMatches);

    } catch (error) {
      console.error("[IKOTV] SCHEDULE ERROR:", error);

      const container = $(CONFIG.selectors.schedule);

      if (container) {
        container.innerHTML = `
          <div class="iko-empty">
            Failed to load schedule.
          </div>
        `;
      }
    }

}

function startCountdown() { if (countdownTimer) {
clearInterval(countdownTimer); }

    countdownTimer = setInterval(() => {
      renderSchedule(allMatches);
    }, CONFIG.countdownMs);

}

function startLiveMonitor() { if (liveTimer) { clearInterval(liveTimer);
}

    liveTimer = setInterval(async () => {
      try {
        const matches = await fetchMatches();

        allMatches = matches;

        renderSchedule(allMatches);
      } catch (error) {
        console.warn("[IKOTV] LIVE CHECK ERROR:", error);
      }
    }, CONFIG.liveCheckMs);

}

async function init() { console.log(“[IKOTV] START”);

    ensureDOM();
    injectCSS();

    await loadLibraries();
    await refreshSchedule();

    startCountdown();
    startLiveMonitor();

}

if ( document.readyState === “loading” ) { document.addEventListener(
“DOMContentLoaded”, init, { once: true } ); } else { init(); } })();
