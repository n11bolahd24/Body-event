// --- Fungsi Utama Load Sofascore + Countdown ---
function loadSofaScore(matchId, boxId, region = "Asia/Jakarta") {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;

  fetch(eventUrl)
    .then(res => res.json())
    .then(data => {
      const event = data.event;
      const home = event.homeTeam;
      const away = event.awayTeam;

      // Nama liga
      document.getElementById("league" + boxId).innerText = event.tournament.name;

      // Jadwal kickoff dengan regional
      let kickoffDate = new Date(event.startTimestamp * 1000);
      let options = {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: region
      };
      let kickoffString = new Intl.DateTimeFormat("id-ID", options).format(kickoffDate);

      let regionAbbr = "WIB"; 
      if (region === "Asia/Makassar") regionAbbr = "WITA";
      if (region === "Asia/Jayapura") regionAbbr = "WIT";

      document.getElementById("kickoff" + boxId).innerText =
        kickoffString + " " + regionAbbr;

      // Nama tim
      document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;

      // Logo tim
      document.getElementById("logoHome" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
      document.getElementById("logoAway" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

      // Mulai countdown & monitor status
      startCountdown(kickoffDate.getTime(), boxId);
      monitorMatchStatus(matchId, boxId);
    });
}

// --- Fungsi Update Live Score & Pindah Match Ended ---
function monitorMatchStatus(matchId, boxId) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const interval = setInterval(async () => {
    const res = await fetch(eventUrl);
    const data = await res.json();
    const event = data.event;

    const liveContainer = document.getElementById("liveContainer" + boxId);
    const statusEl = document.getElementById("status" + boxId);
    const countdownEl = document.getElementById("countdown" + boxId);
    const liveScoreEl = document.getElementById("liveScore" + boxId);
    const matchBox = document.getElementById("match" + boxId);
    const finishedContainer = document.getElementById("finishedMatches");

    if (!event || !matchBox || !finishedContainer) return;

    // Jika pertandingan LIVE
    if (event.status.type === "inprogress") {
      liveContainer.classList.remove("hidden");
      liveContainer.classList.add("blink");
      liveContainer.innerHTML = "<strong style='color:red;'>🔴 LIVE NOW</strong>";
      statusEl.innerText = "Kick Off";
      countdownEl.innerText = "";

      // Update skor + babak
      let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
      if (event.status.description) {
        scoreText += ` <span style="font-size:12px; color:#ffcc00;">(${event.status.description})</span>`;
      }
      liveScoreEl.innerHTML = scoreText;
    }

    // Jika pertandingan FINISHED
    if (event.status.type === "finished") {
      clearInterval(interval);
      liveContainer.classList.remove("blink");
      liveContainer.innerHTML = "<strong style='color:gray;'>⛔ MATCH ENDED ⛔</strong>";
      statusEl.innerText = "Match Ended";
      countdownEl.innerText = "";

      // Skor fulltime tetap tampil + babak terakhir (FT)
      let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
      if (event.status.description) {
        scoreText += ` <span style="font-size:12px; color:#ffcc00;">(${event.status.description})</span>`;
      }
      liveScoreEl.innerHTML = scoreText;

      // Pindahkan ke Match Ended
      if (matchBox.parentNode.id !== "finishedMatches") {
        finishedContainer.appendChild(matchBox);
      }
    }
  }, 3000);
}

// --- Fungsi Countdown ---
function startCountdown(targetTime, boxId) {
  var countdownId = "countdown" + boxId;
  var statusId = "status" + boxId;

  var countdown = setInterval(function () {
    var now = new Date().getTime();
    var distance = targetTime - now;

    if (distance < 0) {
      clearInterval(countdown);
      var liveEl = document.getElementById(countdownId);
      liveEl.innerText = "🔴 LIVE NOW";
      liveEl.classList.add("blink");
      document.getElementById(statusId).innerText = "Kick Off";
      return;
    }

    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById(countdownId).innerText =
      (days > 0 ? days + "D " : "") +
      hours + "H - " +
      minutes + "M - " +
      seconds + "S";
  }, 1000);
}
