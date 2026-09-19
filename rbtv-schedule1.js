
(function () {
  "use strict";

  console.log("[RBTV] SCRIPT START");

  const CONFIG = {
    api: {
      matches: "https://apis-data10.tcllu137fien.ru/sfver915c76f70397a83f69a18051c6c8d037e40acf/api/match/live"
    },

    scheduleSelector: "#rbtvSchedule",
    sportType: 1,
    language: 34
  };

  let matches = [];

  function log() {
    console.log.apply(console, ["[RBTV]"].concat([].slice.call(arguments)));
  }

  function getContainer() {
    const el = document.querySelector(CONFIG.scheduleSelector);

    if (!el) {
      console.error(
        "[RBTV] CONTAINER TIDAK DITEMUKAN:",
        CONFIG.scheduleSelector
      );
      return null;
    }

    return el;
  }

  function extractStrings(buffer) {
    const bytes = new Uint8Array(buffer);

    let text = "";

    for (let i = 0; i < bytes.length; i++) {
      const c = bytes[i];

      if (
        (c >= 32 && c <= 126) ||
        c === 10 ||
        c === 13 ||
        c === 9
      ) {
        text += String.fromCharCode(c);
      } else {
        text += " ";
      }
    }

    return text
      .replace(/\s+/g, " ")
      .trim();
  }

  async function fetchMatches() {
    log("FETCH START");

    const url =
      CONFIG.api.matches +
      "?sportType=" +
      encodeURIComponent(CONFIG.sportType) +
      "&language=" +
      encodeURIComponent(CONFIG.language) +
      "&stream=true";

    log("URL:", url);

    const container = getContainer();

    if (container) {
      container.innerHTML =
        '<div style="padding:15px;text-align:center;">Loading RBTV schedule...</div>';
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store"
      });

      log("HTTP STATUS:", response.status);
      log("CONTENT TYPE:", response.headers.get("content-type"));

      if (!response.ok) {
        throw new Error(
          "HTTP " + response.status + " " + response.statusText
        );
      }

      const buffer = await response.arrayBuffer();

      log("BUFFER SIZE:", buffer.byteLength);

      const readable = extractStrings(buffer);

      log("READABLE LENGTH:", readable.length);
      log("READABLE PREVIEW:", readable.substring(0, 3000));

      /*
       * Coba JSON biasa
       */
      const decoder = new TextDecoder("utf-8");

      let text = decoder.decode(buffer);

      try {
        const json = JSON.parse(text);

        log("JSON BERHASIL");

        processData(json);
        return;

      } catch (e) {
        log("BUKAN JSON BIASA");
      }

      /*
       * Untuk sementara simpan hasil binary
       */
      matches = [];

      if (container) {
        container.innerHTML = `
          <div style="
            padding:15px;
            font-family:monospace;
            font-size:12px;
            line-height:1.5;
          ">
            <div style="font-weight:bold;margin-bottom:8px;">
              RBTV API TERHUBUNG
            </div>

            <div>
              HTTP: ${response.status}
            </div>

            <div>
              Response: ${buffer.byteLength} bytes
            </div>

            <div style="margin-top:8px;">
              Data RBTV masih dalam format encoded/binary.
            </div>
          </div>
        `;
      }

    } catch (error) {
      console.error("[RBTV] API ERROR:", error);

      const container = getContainer();

      if (container) {
        container.innerHTML = `
          <div style="
            padding:15px;
            color:#ff5555;
            font-family:monospace;
            font-size:12px;
          ">
            RBTV API ERROR<br><br>
            ${String(error.message || error)}
          </div>
        `;
      }
    }
  }

  function processData(data) {
    log("PROCESS DATA:", data);

    let list = [];

    if (Array.isArray(data)) {
      list = data;
    } else if (Array.isArray(data.data)) {
      list = data.data;
    } else if (Array.isArray(data.matches)) {
      list = data.matches;
    } else if (data.data && Array.isArray(data.data.matches)) {
      list = data.data.matches;
    } else if (data.list && Array.isArray(data.list)) {
      list = data.list;
    } else if (data.data && Array.isArray(data.data.list)) {
      list = data.data.list;
    }

    log("MATCH COUNT:", list.length);

    matches = list;

    renderSchedule();
  }

  function renderSchedule() {
    const container = getContainer();

    if (!container) return;

    if (!matches.length) {
      container.innerHTML =
        '<div style="padding:15px;text-align:center;">No RBTV matches</div>';

      return;
    }

    container.innerHTML = matches
      .map(function (match, index) {

        const home =
          match.home?.name ||
          match.homeTeamName ||
          match.home_team?.name ||
          "Home";

        const away =
          match.away?.name ||
          match.awayTeamName ||
          match.away_team?.name ||
          "Away";

        const competition =
          match.competition?.name ||
          match.competitionName ||
          "Football";

        const timestamp =
          match.matchDate ||
          match.matchTime ||
          match.match_time;

        let dateText = "";

        if (timestamp) {
          const time =
            Number(timestamp) < 10000000000
              ? Number(timestamp) * 1000
              : Number(timestamp);

          dateText = new Date(time).toLocaleString("id-ID");
        }

        return `
          <div class="rbtv-match">
            <div>${competition}</div>
            <div>${dateText}</div>
            <div>
              ${home}
              <strong> vs </strong>
              ${away}
            </div>
          </div>
        `;
      })
      .join("");
  }

  /*
   * PUBLIC API
   */
  window.RBTVSchedule = {
    update: fetchMatches,

    getMatches: function () {
      return matches;
    }
  };

  log("RBTVSchedule READY");

  /*
   * Jalankan setelah DOM siap
   */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      fetchMatches();
    });
  } else {
    fetchMatches();
  }

})();
