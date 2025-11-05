// --- Fungsi Utama Load Sofascore + Countdown ---
function loadSofaScore(matchId, boxId) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;

  fetch(eventUrl)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      const home = event.homeTeam;
      const away = event.awayTeam;

      // --- Logo + nama liga ---
      const leagueEl = document.getElementById("league" + boxId);
      if (leagueEl) {
        leagueEl.innerHTML = `
          <span style="display:inline-flex;align-items:center;gap:5px;">
            <img src="https://api.sofascore.app/api/v1/unique-tournament/${event.tournament.uniqueTournament.id}/image/dark"
                 style="height:18px;width:18px;border-radius:3px;">
            <span>${event.tournament.name}</span>
          </span>`;
      }

      // --- Jadwal kickoff otomatis zona waktu user ---
      const kickoffDate = new Date(event.startTimestamp * 1000);
      const tanggal = kickoffDate.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      const jam = kickoffDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      document.getElementById("kickoff" + boxId).innerHTML = `${tanggal} | Kickoff ${jam}`;

      // --- Gabungkan nama + logo tim (home & away) ---
      const teamsEl = document.getElementById("teams" + boxId);
      if (teamsEl) {
        teamsEl.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;gap:18px;font-weight:600;">
            <div style="display:flex;align-items:center;gap:6px;">
              <img src="https://api.sofascore.app/api/v1/team/${home.id}/image" style="width:30px;height:30px;border-radius:50%;">
              <span>${home.name}</span>
            </div>
            <div style="font-size:20px;font-weight:bold;">:</div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span>${away.name}</span>
              <img src="https://api.sofascore.app/api/v1/team/${away.id}/image" style="width:30px;height:30px;border-radius:50%;">
            </div>
          </div>`;
      }

      // --- Mulai countdown dan status ---
      startCountdown(kickoffDate.getTime(), boxId);
      monitorMatchStatus(matchId, boxId);
    });
}

// --- Update skor & status realtime ---
function monitorMatchStatus(matchId, boxId) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const matchBox = document.getElementById("match" + boxId);
  const liveContainer = document.getElementById("liveContainer" + boxId);
  const countdownEl = document.getElementById("countdown" + boxId);
  const liveScoreEl = document.getElementById("liveScore" + boxId);
  const matchStatusEl = document.getElementById("matchStatus" + boxId);

  const interval = setInterval(async () => {
    const res = await fetch(eventUrl);
    const data = await res.json();
    const event = data.event;
    if (!event || !matchBox) return;

    if (event.status.type === "upcoming") {
      liveScoreEl.style.display = "none";
      matchStatusEl.style.display = "none";
      liveContainer.innerHTML = "";
    }

    if (event.status.type === "inprogress" || event.status.type === "penalties") {
      if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);
      countdownEl.innerHTML = "";

      liveContainer.innerHTML = "<strong style='color:#fff;-webkit-text-stroke:0.5px black;'>🔴 LIVE NOW</strong>";

      let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
      if (event.homeScore.penalties !== undefined && event.awayScore.penalties !== undefined) {
        scoreText += ` (P: ${event.homeScore.penalties} - ${event.awayScore.penalties})`;
      }

      liveScoreEl.innerHTML = scoreText;
      liveScoreEl.style.display = "block";

      matchStatusEl.innerHTML = event.status.description || "LIVE";
      matchStatusEl.style.display = "block";
    }

    if (event.status.type === "finished") {
      clearInterval(interval);
      if (window["countdown_" + boxId]) clearInterval(window["countdown_" + boxId]);
      countdownEl.innerHTML = "";

      liveContainer.innerHTML = "<strong style='color:#fff;'>⛔ MATCH ENDED</strong>";

      let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
      liveScoreEl.innerHTML = scoreText;
      liveScoreEl.style.display = "block";
      matchStatusEl.innerHTML = "Full Time";
      matchStatusEl.style.display = "block";
    }
  }, 4000);
}

// --- Countdown sebelum kick-off ---
function startCountdown(targetTime, boxId) {
  const countdownId = "countdown" + boxId;
  window["countdown_" + boxId] = setInterval(function () {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance < 0) {
      clearInterval(window["countdown_" + boxId]);
      document.getElementById(countdownId).innerHTML = "";
      return;
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById(countdownId).innerText = `${hours}H ${minutes}M ${seconds}S`;
  }, 1000);
}
