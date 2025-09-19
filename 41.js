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

      // Jadwal kickoff
      let kickoffDate = new Date(event.startTimestamp * 1000);
      let options = { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: region };
      let kickoffString = new Intl.DateTimeFormat("id-ID", options).format(kickoffDate);
      let regionAbbr = region.includes("Makassar") ? "WITA" : region.includes("Jayapura") ? "WIT" : "WIB";
      document.getElementById("kickoff" + boxId).innerText = kickoffString + " " + regionAbbr;

      // Logo & nama tim
      document.getElementById("logoHome" + boxId).src = "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
      document.getElementById("logoAway" + boxId).src = "https://api.sofascore.app/api/v1/team/" + away.id + "/image";
      document.getElementById("teamNameHome" + boxId).innerText = home.name;
      document.getElementById("teamNameAway" + boxId).innerText = away.name;

      // Mulai countdown & status
      startCountdown(kickoffDate.getTime(), boxId);
      monitorMatchStatus(matchId, boxId);
    });
}

// --- Monitor Live Score & Match Ended ---
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

    if (event.status.type === "inprogress") {
      liveContainer.classList.remove("hidden");
      liveContainer.classList.add("blink");
      liveContainer.innerHTML = "<strong style='color:red;'>🔴 LIVE NOW</strong>";
      countdownEl.innerText = "";
      let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
      if (event.status.description) scoreText += ` <span style="font-size:12px; color:#ffcc00;">(${event.status.description})</span>`;
      liveScoreEl.innerHTML = scoreText;
    }

    if (event.status.type === "finished") {
      clearInterval(interval);
      liveContainer.classList.remove("blink");
      liveContainer.innerHTML = "<strong style='color:gray;'>⛔ MATCH ENDED ⛔</strong>";
      statusEl.innerText = "Match Ended";
      countdownEl.innerText = "";
      let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
      if (event.status.description) scoreText += ` <span style="font-size:12px; color:#ffcc00;">(${event.status.description})</span>`;
      liveScoreEl.innerHTML = scoreText;
      if (matchBox.parentNode.id !== "finishedMatches") finishedContainer.appendChild(matchBox);
    }
  }, 3000);
}

// --- Countdown ---
function startCountdown(targetTime, boxId) {
  const countdownId = "countdown" + boxId;
  const statusId = "status" + boxId;
  const countdown = setInterval(() => {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance < 0) {
      clearInterval(countdown);
      document.getElementById(countdownId).innerText = "🔴 LIVE NOW";
      document.getElementById(countdownId).classList.add("blink");
      document.getElementById(statusId).innerText = "";
      return;
    }

    const days = Math.floor(distance / (1000*60*60*24));
    const hours = Math.floor((distance % (1000*60*60*24)) / (1000*60*60));
    const minutes = Math.floor((distance % (1000*60*60)) / (1000*60));
    const seconds = Math.floor((distance % (1000*60)) / 1000);

    document.getElementById(countdownId).innerText = 
      (days>0 ? days+"D " : "") + hours+"H - "+minutes+"M - "+seconds+"S";
  }, 1000);
}
