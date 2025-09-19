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
// --- Fungsi Update Live Score & Status (Score di atas, Babak di bawah) ---
function monitorMatchStatus(matchId, boxId) {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const matchBox = document.getElementById("match" + boxId);
  const liveContainer = document.getElementById("liveContainer" + boxId);
  const countdownEl = document.getElementById("countdown" + boxId);
  const liveScoreEl = document.getElementById("liveScore" + boxId);
  const liveStatusEl = document.getElementById("liveStatus" + boxId);
  const finishedContainer = document.getElementById("finishedMatches");

  // Awal → sembunyikan live container
  liveContainer.classList.add('hidden');
  liveScoreEl.innerHTML = "";
  liveStatusEl.innerHTML = "";

  const interval = setInterval(async () => {
    const res = await fetch(eventUrl);
    const data = await res.json();
    const event = data.event;
    if (!event || !matchBox) return;

    // Jika upcoming → tampilkan countdown, sembunyikan live
    if (event.status.type === "upcoming") {
      liveContainer.classList.add('hidden');
      return;
    }

    // Pertandingan mulai → sembunyikan countdown
    if (event.status.type === "inprogress") {
      countdownEl.innerHTML = "";
      liveContainer.classList.remove('hidden');
      liveContainer.classList.add('blink');
      liveScoreEl.innerHTML = `${event.homeScore.current} - ${event.awayScore.current}`;
      liveStatusEl.innerHTML = `<strong style="color:white;-webkit-text-stroke: 0.2px black;">🔴 LIVE NOW</strong>`;
    }

    // Pertandingan selesai → tampil MATCH ENDED
    if (event.status.type === "finished") {
      clearInterval(interval);
      countdownEl.innerHTML = ""; // countdown tetap hilang
      liveContainer.classList.remove('blink');
      liveContainer.style.animation = "none";
      liveContainer.classList.remove('hidden');
      liveScoreEl.innerHTML = `${event.homeScore.current} - ${event.awayScore.current}`;
      liveStatusEl.innerHTML = `<strong style="color:white;-webkit-text-stroke: 0.2px black;">⛔ MATCH ENDED ⛔</strong>`;
      if (finishedContainer && matchBox.parentNode !== finishedContainer) {
        finishedContainer.appendChild(matchBox);
      }
    }

  }, 3000);
}
