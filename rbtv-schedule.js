
/*!
 * RBTV Auto Schedule
 * N11BOLAHD
 * Initial API Integration
 */

(function () {
  "use strict";

  /* =========================================================
     CONFIG
  ========================================================= */

  const CONFIG = {
    api: {
      matches:
        "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live"
    },

    scheduleSelector: "#rbtvSchedule",

    sportType: 1,
    language: 34,

    countdownMs: 1000,

    headers: {
      "Accept": "application/json, text/plain, */*"
    }
  };


  /* =========================================================
     STATE
  ========================================================= */

  let matches = [];
  let loadingSchedule = false;


  /* =========================================================
     ELEMENT
  ========================================================= */

  function getScheduleElement() {
    return document.querySelector(CONFIG.scheduleSelector);
  }


  /* =========================================================
     DATE / TIME
  ========================================================= */

  function formatDate(date) {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "2-digit",
      timeZone: "Asia/Jakarta"
    }).format(date);
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta"
    }).format(date);
  }


  /* =========================================================
     COUNTDOWN
  ========================================================= */

  function getCountdown(target) {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      return "00:00:00";
    }

    const totalSeconds = Math.floor(diff / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0")
    );
  }


  /* =========================================================
     STATUS
  ========================================================= */

  function getStatus(match) {
    const now = Date.now();

    const matchTime = Number(match.matchDate || match.time || 0);

    if (!matchTime) {
      return {
        type: "unknown",
        text: "WAITING"
      };
    }

    if (match.status === "ONGOING") {
      return {
        type: "live",
        text: "LIVE"
      };
    }

    if (match.status === "FINISH") {
      return {
        type: "finished",
        text: "FINISHED"
      };
    }

    if (now < matchTime) {
      return {
        type: "upcoming",
        text: "UPCOMING"
      };
    }

    return {
      type: "waiting",
      text: "WAITING"
    };
  }


  /* =========================================================
     BINARY RESPONSE DECODER
     
     RBTV endpoint currently returns binary/control data.
     First try normal JSON.
  ========================================================= */

  async function decodeResponse(response) {
    const buffer = await response.arrayBuffer();

    console.log("[RBTV] Response bytes:", buffer.byteLength);

    const bytes = new Uint8Array(buffer);

    /*
     * Try UTF-8 decoding first.
     */
    let text = "";

    try {
      text = new TextDecoder("utf-8", {
        fatal: false
      }).decode(bytes);
    } catch (e) {
      console.warn("[RBTV] UTF-8 decode failed", e);
    }

    console.log(
      "[RBTV] Decoded preview:",
      text.substring(0, 1000)
    );

    /*
     * Try JSON.
     */
    try {
      const json = JSON.parse(text);

      console.log("[RBTV] JSON response:", json);

      return {
        type: "json",
        data: json
      };
    } catch (e) {
      /*
       * Not plain JSON.
       */
    }

    /*
     * Return binary information for the next decoder stage.
     */
    return {
      type: "binary",
      bytes: bytes,
      text: text
    };
  }


  /* =========================================================
     EXTRACT POSSIBLE TEXT
  ========================================================= */

  function extractReadableStrings(text) {
    const result = [];

    /*
     * Extract readable UTF-8 sequences.
     */
    const matches = text.match(
      /[\x20-\x7E\u00C0-\uFFFF]{3,}/g
    );

    if (!matches) {
      return result;
    }

    const seen = new Set();

    for (const value of matches) {
      const clean = value
        .replace(/\s+/g, " ")
        .trim();

      if (!clean) continue;

      if (clean.length < 3) continue;

      if (!seen.has(clean)) {
        seen.add(clean);
        result.push(clean);
      }
    }

    return result;
  }


  /* =========================================================
     FETCH MATCHES
  ========================================================= */

  async function fetchMatches() {
    if (loadingSchedule) return;

    loadingSchedule = true;

    const el = getScheduleElement();

    if (el) {
      el.innerHTML = `
        <div class="rbtv-loading">
          Loading RBTV schedule...
        </div>
      `;
    }

    try {
      const url =
        CONFIG.api.matches +
        "?sportType=" +
        encodeURIComponent(CONFIG.sportType) +
        "&language=" +
        encodeURIComponent(CONFIG.language) +
        "&stream=true";

      console.log("[RBTV] REQUEST:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: CONFIG.headers,
        cache: "no-store"
      });

      console.log(
        "[RBTV] HTTP:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error(
          "HTTP " +
          response.status +
          " " +
          response.statusText
        );
      }

      const result = await decodeResponse(response);

      /*
       * JSON
       */
      if (result.type === "json") {
        processData(result.data);
        return;
      }

      /*
       * Binary
       */
      const readable = extractReadableStrings(result.text);

      console.log(
        "[RBTV] Readable strings:",
        readable
      );

      renderBinaryDebug(readable);

    } catch (error) {
      console.error("[RBTV] API ERROR:", error);

      if (el) {
        el.innerHTML = `
          <div class="rbtv-error">
            RBTV API ERROR
            <br>
            ${escapeHtml(error.message)}
          </div>
        `;
      }

    } finally {
      loadingSchedule = false;
    }
  }


  /* =========================================================
     PROCESS JSON
  ========================================================= */

  function processData(data) {
    console.log("[RBTV] RAW DATA:", data);

    let list = [];

    if (Array.isArray(data)) {
      list = data;
    } else if (Array.isArray(data?.data)) {
      list = data.data;
    } else if (Array.isArray(data?.data?.matches)) {
      list = data.data.matches;
    } else if (Array.isArray(data?.matches)) {
      list = data.matches;
    } else if (Array.isArray(data?.list)) {
      list = data.list;
    } else if (Array.isArray(data?.data?.list)) {
      list = data.data.list;
    }

    console.log("[RBTV] MATCH ARRAY:", list);

    matches = list;

    renderSchedule();
  }


  /* =========================================================
     RENDER SCHEDULE
  ========================================================= */

  function renderSchedule() {
    const el = getScheduleElement();

    if (!el) {
      console.warn(
        "[RBTV] Schedule element not found:",
        CONFIG.scheduleSelector
      );
      return;
    }

    if (!matches.length) {
      el.innerHTML = `
        <div class="rbtv-empty">
          No matches found
        </div>
      `;
      return;
    }

    const sorted = [...matches].sort(function (a, b) {
      return (
        Number(a.matchDate || a.time || 0) -
        Number(b.matchDate || b.time || 0)
      );
    });

    let html = "";

    let currentDate = "";

    sorted.forEach(function (match, index) {
      const matchTime = Number(
        match.matchDate ||
        match.time ||
        0
      );

      const dateObject = new Date(matchTime);

      const dateLabel = formatDate(dateObject);

      if (dateLabel !== currentDate) {
        currentDate = dateLabel;

        html += `
          <div class="rbtv-date">
            ${escapeHtml(dateLabel)}
          </div>
        `;
      }

      const status = getStatus(match);

      const home =
        match.home?.name ||
        match.homeName ||
        "HOME";

      const away =
        match.away?.name ||
        match.awayName ||
        "AWAY";

      const competition =
        match.league?.name ||
        match.competition?.name ||
        match.competition ||
        match.stage?.name ||
        "";

      const homeLogo =
        match.home?.logo ||
        match.home?.teamLogo ||
        "";

      const awayLogo =
        match.away?.logo ||
        match.away?.teamLogo ||
        "";

      html += `
        <div
          class="rbtv-match"
          data-match-time="${matchTime}"
        >

          <div class="rbtv-competition">
            ${escapeHtml(competition)}
          </div>

          <div class="rbtv-time">
            ${matchTime ? formatTime(dateObject) : "--:--"}
          </div>

          <div class="rbtv-teams">

            <div class="rbtv-team">

              ${
                homeLogo
                  ? `
                    <img
                      src="${escapeHtml(homeLogo)}"
                      alt=""
                      loading="lazy"
                    >
                  `
                  : ""
              }

              <span>
                ${escapeHtml(home)}
              </span>

            </div>

            <div class="rbtv-vs">
              VS
            </div>

            <div class="rbtv-team">

              ${
                awayLogo
                  ? `
                    <img
                      src="${escapeHtml(awayLogo)}"
                      alt=""
                      loading="lazy"
                    >
                  `
                  : ""
              }

              <span>
                ${escapeHtml(away)}
              </span>

            </div>

          </div>

          <div class="rbtv-status ${status.type}">
            ${status.text}
          </div>

          ${
            status.type === "upcoming" && matchTime
              ? `
                <div
                  class="rbtv-countdown"
                  data-countdown="${matchTime}"
                >
                  ${getCountdown(matchTime)}
                </div>
              `
              : ""
          }

        </div>
      `;
    });

    el.innerHTML = html;
  }


  /* =========================================================
     BINARY DEBUG
  ========================================================= */

  function renderBinaryDebug(strings) {
    const el = getScheduleElement();

    if (!el) return;

    /*
     * We don't pretend binary data is already decoded.
     * Show useful information while decoder is being built.
     */

    const useful = strings
      .filter(function (x) {
        return x.length >= 4;
      })
      .slice(0, 50);

    el.innerHTML = `
      <div class="rbtv-api-debug">

        <div class="rbtv-debug-title">
          RBTV API CONNECTED
        </div>

        <div class="rbtv-debug-info">
          Response is binary encoded.
        </div>

        <div class="rbtv-debug-info">
          Match decoder is required.
        </div>

        ${
          useful.length
            ? `
              <div class="rbtv-debug-list">
                ${useful
                  .map(
                    function (item) {
                      return `
                        <div>
                          ${escapeHtml(item)}
                        </div>
                      `;
                    }
                  )
                  .join("")}
              </div>
            `
            : ""
        }

      </div>
    `;
  }


  /* =========================================================
     COUNTDOWN UPDATE
  ========================================================= */

  function updateCountdowns() {
    document
      .querySelectorAll("[data-countdown]")
      .forEach(function (el) {

        const target = Number(
          el.getAttribute("data-countdown")
        );

        if (!target) return;

        const diff = target - Date.now();

        if (diff <= 0) {
          el.textContent = "00:00:00";

          /*
           * Refresh status when kickoff is reached.
           */
          setTimeout(function () {
            renderSchedule();
          }, 100);

          return;
        }

        el.textContent = getCountdown(target);
      });
  }


  /* =========================================================
     ESCAPE HTML
  ========================================================= */

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  /* =========================================================
     INIT
  ========================================================= */

  function init() {
    console.log("[RBTV] Auto Schedule starting...");

    fetchMatches();

    setInterval(
      updateCountdowns,
      CONFIG.countdownMs
    );
  }


  /*
   * Public API
   */
  window.RBTVSchedule = {
    update: fetchMatches,
    getMatches: function () {
      return matches;
    }
  };


  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();

  }

})();
