/*!
 * IKOTV Auto Schedule + ArtPlayer
 * N11BOLAHD
 * Separate module from ColaTV
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
      matches: "https://ikotv.cc/api/matches",
      matchInfo: "https://ikotv.cc/api/match-info",
      streamUrl: "https://ikotv.cc/api/stream-url"
    },

    // Change these only if you want another placement.
    scheduleSelector: "#ikotvSchedule",
    playerSelector: "#ikotvPlayer",

    refreshMs: 60000,
    countdownMs: 1000,

    // IKOTV match timestamps are treated as Unix seconds.
    // This only controls when a match is considered ended.
    matchDurationHours: 3,

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
      result?.data?.matches,
      result?.data?.list,
      result?.matches,
      result?.list,
      result?.data
    ];

    for (const item of candidates) {
      if (Array.isArray(item)) return item;
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
    const end = start + CONFIG.matchDurationHours * 3600;

    if (now < start) return "upcoming";
    if (now <= end) return "live";
    return "ended";
  }

  function normalizeMatch(match) {
    const home = match?.hometeam || {};
    const away = match?.awayteam || {};
    const comp = match?.matchevent || {};

    return {
      id: String(match?.id ?? ""),
      time: Number(match?.time ?? 0),
      statusRaw: Number(match?.status ?? 0),

      home: home.name_en || home.short_name_en || "Home",
      away: away.name_en || away.short_name_en || "Away",

      homeLogo: safeURL(home.logo_rt || home.logo || ""),
      awayLogo: safeURL(away.logo_rt || away.logo || ""),

      competition:
        comp.name_en ||
        comp.short_name_en ||
        "Football",

      competitionLogo:
        safeURL(comp.logo_rt || comp.logo || "")
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

    let player = $(CONFIG.playerSelector);

    if (!player) {
      player = document.createElement("div");
      player.id = "ikotvPlayer";
      document.body.appendChild(player);
    }

    return { schedule, player };
  }

  function injectCSS() {
    if (document.getElementById("ikotvStyles")) return;

    const style = document.createElement("style");
    style.id = "ikotvStyles";

    style.textContent = `
      #ikotvSchedule,
      #ikotvPlayer {
        width: 100%;
        max-width: 900px;
        margin: 16px auto;
        font-family: Arial, Helvetica, sans-serif;
      }

      #ikotvPlayer {
        display: none;
        background: #000;
        border-radius: 12px;
        overflow: hidden;
      }

      #ikotvArt {
        width: 100%;
        height: min(56.25vw, 506px);
        min-height: 220px;
        background: #000;
      }
            .iko-box {
        box-sizing: border-box;
        width: 100%;
      }

      .iko-loading,
      .iko-error,
      .iko-empty {
        padding: 24px;
        text-align: center;
        color: #fff;
        background: #111;
        border-radius: 12px;
      }

      .iko-date {
        margin: 18px 0 10px;
        padding: 10px 14px;
        border-left: 4px solid #00d979;
        background: #111;
        color: #fff;
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .iko-card {
        margin: 10px 0;
        padding: 14px;
        border-radius: 14px;
        background: linear-gradient(135deg, #101010, #1b1b1b);
        border: 1px solid rgba(255,255,255,.08);
        color: #fff;
      }

      .iko-comp {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        color: #aaa;
        font-size: 12px;
      }

      .iko-comp img {
        width: 20px;
        height: 20px;
        object-fit: contain;
      }

      .iko-match {
        display: grid;
        grid-template-columns: 1fr 70px 1fr;
        align-items: center;
        gap: 10px;
      }

      .iko-team {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        font-weight: 700;
      }

      .iko-team.home {
        justify-content: flex-end;
        text-align: right;
      }

      .iko-team.away {
        justify-content: flex-start;
        text-align: left;
      }

      .iko-team img {
        width: 42px;
        height: 42px;
        object-fit: contain;
        flex: 0 0 42px;
      }

      .iko-center {
        text-align: center;
      }

      .iko-time {
        font-size: 18px;
        font-weight: 800;
      }

      .iko-vs {
        margin-top: 2px;
        color: #777;
        font-size: 10px;
      }

      .iko-status {
        display: inline-block;
        margin-top: 5px;
        padding: 3px 7px;
        border-radius: 5px;
        font-size: 9px;
        font-weight: 800;
        text-transform: uppercase;
      }

      .iko-status.upcoming {
        background: #333;
        color: #fff;
      }

      .iko-status.live {
        background: #00c878;
        color: #000;
      }

      .iko-status.ended {
        background: #222;
        color: #777;
      }

      .iko-countdown {
        margin-top: 5px;
        color: #00d979;
        font-family: monospace;
        font-size: 11px;
        font-weight: 700;
      }

      .iko-action {
        margin-top: 14px;
        text-align: center;
      }

      .iko-watch {
        width: 100%;
        padding: 10px 15px;
        border: 0;
        border-radius: 8px;
        background: #00c878;
        color: #000;
        cursor: pointer;
        font-size: 13px;
        font-weight: 800;
      }

      .iko-watch:hover {
        opacity: .85;
      }

      .iko-watch.disabled {
        background: #252525;
        color: #777;
        cursor: not-allowed;
      }

      .iko-player-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        background: #111;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
      }

      .iko-close {
        padding: 6px 10px;
        border: 0;
        border-radius: 5px;
        background: #252525;
        color: #fff;
        cursor: pointer;
        font-size: 10px;
      }

      .iko-servers {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 10px;
        background: #111;
      }

      .iko-server {
        border: 0;
        border-radius: 5px;
        background: #252525;
        padding: 8px 12px;
        color: #fff;
        cursor: pointer;
        font-size: 11px;
        font-weight: 700;
      }

      .iko-server.active {
        background: #00c878;
        color: #000;
      }

      .iko-note {
        padding: 8px 12px;
        color: #aaa;
        background: #111;
        font-size: 11px;
      }

      @media (max-width: 600px) {
        #ikotvArt {
          height: 56.25vw;
          min-height: 190px;
        }

        .iko-match {
          grid-template-columns: 1fr 58px 1fr;
        }

        .iko-team {
          font-size: 12px;
        }

        .iko-team img {
          width: 32px;
          height: 32px;
          flex-basis: 32px;
        }

        .iko-time {
          font-size: 15px;
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
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    return response.json();
  }

  async function fetchMatches() {
    const result = await postJSON(
      CONFIG.api.matches,
      {
        date: null,
        filter: "all",
        sport: "football"
      }
    );

    console.log("[IKOTV] matches:", result);

    return getArray(result)
      .map(normalizeMatch)
      .filter(
        match =>
          match.id &&
          match.time > 0
      )
      .sort(
        (a, b) =>
          a.time - b.time
      );
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
                MATCH ENDED
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
                SERVER WILL BE ACTIVE
                30 MINUTES BEFORE KICKOFF
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
            <div class="iko-card ${liveClass}">

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
    const { player } = ensureDOM();

    player.style.display = "block";

    const validVideos =
      videos.filter(
        v => safeURL(v.url)
      );

    currentVideos = validVideos;

    const title =
      `${match.home} vs ${match.away}`;

    player.innerHTML = `
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
    `;

    $("#ikoClosePlayer").onclick = () => {

      if (art) {
        try {
          art.destroy(false);
        } catch (_) {}

        art = null;
      }

      player.style.display = "none";

      currentMatchId = null;
      currentVideos = [];
    };

    renderServers();

    player.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

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
     MATCH OPEN
  ========================================================= */

  async function openIKOMatch(matchId) {
    const id = String(matchId || "");

    if (!id) return;

    const match =
      matches.find(
        item =>
          String(item.id) === id
      );

    if (!match) {
      console.warn(
        "[IKOTV] Match not found:",
        id
      );
      return;
    }

    currentMatchId = id;

    const { player } = ensureDOM();

    player.style.display = "block";

    player.innerHTML = `
      <div class="iko-player-title">

        <span>
          ${escapeHTML(
            `${match.home} vs ${match.away}`
          )}
        </span>

        <button
          class="iko-close"
          id="ikoClosePlayer"
        >
          CLOSE
        </button>

      </div>

      <div
        class="iko-loading"
        id="ikoLoading"
      >
        Loading server...
      </div>
    `;

    $("#ikoClosePlayer").onclick = () => {

      if (art) {
        try {
          art.destroy(false);
        } catch (_) {}

        art = null;
      }

      player.style.display = "none";
      currentMatchId = null;
      currentVideos = [];
    };

    player.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    try {

      const result =
        await fetchStreamURL(id);

      const videos =
        extractVideos(result);

      if (!videos.length) {

        player.innerHTML = `
          <div class="iko-player-title">

            <span>
              ${escapeHTML(
                `${match.home} vs ${match.away}`
              )}
            </span>

            <button
              class="iko-close"
              id="ikoClosePlayer"
            >
              CLOSE
            </button>

          </div>

          <div class="iko-error">
            Server stream tidak tersedia.
          </div>
        `;

        $("#ikoClosePlayer").onclick = () => {
          player.style.display = "none";
          currentMatchId = null;
          currentVideos = [];
        };

        return;
      }

      showPlayer(
        match,
        videos
      );

    } catch (error) {

      console.error(
        "[IKOTV] open match error:",
        error
      );

      player.innerHTML = `
        <div class="iko-player-title">

          <span>
            ${escapeHTML(
              `${match.home} vs ${match.away}`
            )}
          </span>

          <button
            class="iko-close"
            id="ikoClosePlayer"
          >
            CLOSE
          </button>

        </div>

        <div class="iko-error">
          Gagal mengambil server IKOTV.
        </div>
      `;

      $("#ikoClosePlayer").onclick = () => {
        player.style.display = "none";
        currentMatchId = null;
        currentVideos = [];
      };
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

    const countdownElements =
      document.querySelectorAll(
        ".iko-countdown"
      );

    countdownElements.forEach(element => {

      const card =
        element.closest(".iko-card");

      if (!card) return;

      const matchIndex =
        [...document.querySelectorAll(".iko-card")]
          .indexOf(card);

      if (matchIndex < 0) return;

      /*
       * The schedule can contain cards grouped by date,
       * so find the match from its displayed time instead
       * of relying only on the global index.
       */

      const timeElement =
        card.querySelector(".iko-time");

      if (!timeElement) return;

      const displayedTime =
        timeElement.textContent.trim();

      const match =
        matches.find(item =>
          formatTime(item.time) === displayedTime &&
          getStatus(item) === "upcoming"
        );

      if (!match) return;

      const value =
        countdown(match.time);

      if (value) {
        element.textContent = value;
      }
    });

    /*
     * Re-render when a match changes state.
     * This makes UPCOMING -> LIVE -> ENDED
     * happen automatically.
     */
    renderSchedule();
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
          Loading IKOTV schedule...
        </div>
      `;

      matches =
        await fetchMatches();

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
          Gagal memuat jadwal IKOTV.
          <br>
          <small>
            ${escapeHTML(
              error?.message || ""
            )}
          </small>
        </div>
      `;

    } finally {

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
