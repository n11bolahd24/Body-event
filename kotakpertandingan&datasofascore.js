// --- Fungsi Utama Load Sofascore + Countdown + Update Live ---  
function loadSofaScore(matchId, boxId) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;

  fetch(eventUrl)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      const home = event.homeTeam;
      const away = event.awayTeam;

      // Nama & logo liga
      const leagueEl = document.getElementById("league" + boxId);
      if (leagueEl) {
        leagueEl.innerHTML = `
          <span style="display:inline-flex;align-items:center;">
            <img src="https://api.sofascore.app/api/v1/unique-tournament/${event.tournament.uniqueTournament.id}/image/dark"
                 alt="${event.tournament.name}"
                 style="height:18px;width:18px;margin-right:4px;">
            <span>${event.tournament.name}</span>
          </span>`;
      }

      // Jadwal kickoff otomatis zona waktu pengunjung
      const kickoffDate = new Date(event.startTimestamp * 1000);
      const tanggal = kickoffDate.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
      const jam = kickoffDate.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short"
      });
      const kickEl = document.getElementById("kickoff" + boxId);
      if (kickEl) {
        kickEl.innerHTML = `${tanggal} | K.O ${jam}`;
      }

      // Nama tim
      const teamsEl = document.getElementById("teams" + boxId);
      if (teamsEl) {
        teamsEl.innerText = home.name + " VS " + away.name;
      }

      // Logo tim
      const logoHomeEl = document.getElementById("logoHome" + boxId);
      const logoAwayEl = document.getElementById("logoAway" + boxId);
      if (logoHomeEl) {
        logoHomeEl.src = "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
      }
      if (logoAwayEl) {
        logoAwayEl.src = "https://api.sofascore.app/api/v1/team/" + away.id + "/image";
      }

      // Mulai countdown & monitor status
      startCountdown(kickoffDate.getTime(), boxId);
      monitorMatchStatus(matchId, boxId);
    })
    .catch(err => {
      console.error("loadSofaScore error:", err, matchId, boxId);
    });
}

// --- Fungsi Update Live Score & Match Status ---
function monitorMatchStatus(matchId, boxId) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const matchBox = document.getElementById("match" + boxId);
  const liveContainer = document.getElementById("liveContainer" + boxId);
  const countdownEl = document.getElementById("countdown" + boxId);
  const liveScoreEl = document.getElementById("liveScore" + boxId);
  const matchStatusEl = document.getElementById("matchStatus" + boxId);
  const finishedContainer = document.getElementById("finishedMatches");

  const interval = setInterval(async () => {
    try {
      const res = await fetch(eventUrl);
      const data = await res.json();
      const event = data.event;
      if (!event || !matchBox) return;

      if (event.status.type === "upcoming") {
        if (liveScoreEl) liveScoreEl.style.display = "none";
        if (matchStatusEl) matchStatusEl.style.display = "none";
        if (liveContainer) liveContainer.classList.add("hidden");
      }

      if (event.status.type === "inprogress" || event.status.type === "penalties") {
        // Hentikan countdown karena pertandingan sudah mulai
        if (window["countdown_" + boxId]) {
          clearInterval(window["countdown_" + boxId]);
        }
        if (countdownEl) countdownEl.innerHTML = "";

        if (liveContainer) {
          liveContainer.classList.remove("hidden");
          liveContainer.classList.add("blink");
          liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>🔴 LIVE NOW 🔥</strong>";
        }

        // Skor realtime
        let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
        if (
          event.homeScore.penalties !== undefined &&
          event.awayScore.penalties !== undefined
        ) {
          scoreText += ` <span style="font-size:12px;">(P: ${event.homeScore.penalties} - ${event.awayScore.penalties})</span>`;
        }
        if (liveScoreEl) {
          liveScoreEl.innerHTML = scoreText;
          liveScoreEl.style.display = "block";
        }

        // Status menit / deskripsi
        let statusText = "";
        if (event.status.type === "penalties") {
          statusText = "PENALTIES";
        } else if (event.time && event.time.currentPeriodStartTimestamp) {
          const startTs = event.time.currentPeriodStartTimestamp * 1000;
          const elapsed = Math.floor((Date.now() - startTs) / 60000);

          switch (event.status.description) {
            case "1st half":
              statusText = elapsed >= 45 ? "45+'" : `${elapsed}'`;
              break;
            case "2nd half":
              const m2 = 45 + elapsed;
              statusText = m2 >= 90 ? "90+'" : `${m2}'`;
              break;
            case "1st extra":
              const m3 = 90 + elapsed;
              statusText = m3 >= 105 ? "105+'" : `${m3}'`;
              break;
            case "2nd extra":
              const m4 = 105 + elapsed;
              statusText = m4 >= 120 ? "120+'" : `${m4}'`;
              break;
            default:
              statusText = event.status.description || "LIVE";
          }
        } else {
          statusText = event.status.description || "LIVE";
        }

        if (matchStatusEl) {
          matchStatusEl.innerHTML = statusText;
          matchStatusEl.style.display = "block";
        }
      }

      if (event.status.type === "finished") {
        clearInterval(interval);
        if (window["countdown_" + boxId]) {
          clearInterval(window["countdown_" + boxId]);
        }

        if (countdownEl) countdownEl.innerHTML = "";
        if (liveContainer) {
          liveContainer.classList.remove("blink");
          liveContainer.style.animation = "none";
          liveContainer.classList.remove("hidden");
          liveContainer.innerHTML = "<strong style='color:white;-webkit-text-stroke:0.2px black;'>⛔ MATCH ENDED ⛔</strong>";
        }

        let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
        if (
          event.homeScore.penalties !== undefined &&
          event.awayScore.penalties !== undefined
        ) {
          scoreText += ` <span style="font-size:12px;">(P: ${event.homeScore.penalties} - ${event.awayScore.penalties})</span>`;
        }
        if (liveScoreEl) {
          liveScoreEl.innerHTML = scoreText;
          liveScoreEl.style.display = "block";
        }

        if (matchStatusEl) {
          matchStatusEl.innerHTML = "Full Time";
          matchStatusEl.style.display = "block";
        }

        if (finishedContainer && matchBox.parentNode !== finishedContainer) {
          finishedContainer.appendChild(matchBox);
        }
      }
    } catch (err) {
      console.error("monitorMatchStatus error:", err, matchId, boxId);
    }
  }, 3000);
}

// --- Fungsi Countdown Biasa (SofaScore) ---
function startCountdown(targetTime, boxId) {
  const countdownId = "countdown" + boxId;
  window["countdown_" + boxId] = setInterval(function () {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance < 0) {
      clearInterval(window["countdown_" + boxId]);
      const countdownEl = document.getElementById(countdownId);
      if (countdownEl) countdownEl.innerHTML = "";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const countdownEl = document.getElementById(countdownId);
    if (countdownEl) {
      countdownEl.innerText =
        (days > 0 ? days + "D - " : "") +
        hours + "H - " +
        minutes + "M - " +
        seconds + "S";
    }
  }, 1000);
}

// --- Fungsi untuk buat tampilan kotak pertandingan + countdown server + tombol server ---
function renderMatch(matchId, matchKey, serverFuncs, boxClass = "kotak", kickoffTime = "2025-10-14T18:00:00+07:00") {
  const html = `
    <div class="${boxClass}" id="match${matchKey}" class="kotak matchbox">
      <div class="countdown" id="countdown${matchKey}" style="color:white; font-weight:bold;"></div>
      <div class="live-container" id="liveContainer${matchKey}" style="text-align:center; height:20px;">
        <span id="liveStatus${matchKey}" style="display:inline-block; width:150px; font-weight:bold;"></span>
      </div>
      <div class="club1" style="position: relative; z-index: 1;">
        <br/>
        <div style="position: absolute; top: 0%; left: 50%; transform: translateX(-50%); z-index: 0; font-size: 29px;">
          <br/><br/>
          <strong id="formattedTime${matchKey}" style="color: red;"></strong>
        </div>
      </div>
      <div class="club">
        <center>
          <span id="league${matchKey}" style="position:relative; top:5px; left:-11px; font-weight:bold; font-size:12px; color:white;">NAMA LIGA</span>
          <div id="liveScore${matchKey}" style="position:relative; top:0px; left:0px;font-size:20px; font-family:'Arial', sans-serif; font-weight:bold; color:orange; text-align:center;"></div>
          <div id="matchStatus${matchKey}" style="font-family:'Courier New', monospace; font-size:10px; font-weight:bold; color:orange; text-align:center; margin:-1px 1px;"></div>
          <font id="teams${matchKey}" style="font-size:15px; font-weight:bold">NAMA CLUB VS NAMA CLUB</font><br>
          <div id="kickoff${matchKey}" style="font-size:12px; color:white; text-align:center; margin:1px 0; font-style:italic;"></div>
        </center>
      </div>
      <img id="logoHome${matchKey}" style="position:absolute; height:55px; width:55px; top:20%; left:10%; border-radius:5px;">
      <img id="logoAway${matchKey}" style="position:absolute; height=55px; width:55px; top:20%; right:10%; border-radius:5px;">
      <center>
        <div id="countdownServer${matchKey}" style="color:yellow; font-weight:bold; margin-top:5px;"></div>
        <span id="serverLinks${matchKey}" style="font-size: large; display:none;">
          ${serverFuncs.map((fn, i) => `
            <a class="tv" href="javascript:${fn}();"><b><span>SERVER ${i + 1}</span></b></a>
          `).join("")}
        </span>
      </center><br>
    </div>
  `;

  const container = document.getElementById("matches");
  if (container) {
    container.insertAdjacentHTML("beforeend", html);
  } else {
    console.warn("renderMatch: container #matches tidak ditemukan");
  }

  // Setelah ditambahkan ke DOM, panggil loadSofaScore agar isinya terisi
  loadSofaScore(matchId, matchKey);

  // Setup countdown server
  const kickoff = new Date(kickoffTime).getTime();
  const serverEl = document.getElementById("serverLinks" + matchKey);
  const countdownServerEl = document.getElementById("countdownServer" + matchKey);

  const userLang = navigator.language || navigator.userLanguage;
  const isIndonesian = userLang.toLowerCase().startsWith("id");

  function updateServerCountdown() {
    const now = Date.now();
    const diff = kickoff - now;

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeStr = "";
      if (days > 0) timeStr += days + "d ";
      if (hours > 0 || days > 0) timeStr += hours + "h ";
      timeStr += minutes + "m " + seconds + "s";

      const label = isIndonesian
        ? "Server aktif dalam " + timeStr
        : "Server will be active in " + timeStr;

      if (countdownServerEl) countdownServerEl.textContent = label;
    } else {
      if (countdownServerEl) countdownServerEl.style.display = "none";
      if (serverEl) serverEl.style.display = "inline-block";
      clearInterval(timerServer);
    }
  }

  updateServerCountdown();
  const timerServer = setInterval(updateServerCountdown, 1000);
}
