// --- Fungsi Utama Load Sofascore + Countdown ---
function loadSofaScore(matchId, boxId, region = "Asia/Jakarta") {
  const eventUrl = `https://api.sofascore.com/api/v1/event/${matchId}`;
  const countdownId = "countdown" + boxId;
  const liveScoreId = "liveScore" + boxId;
  const liveStatusId = "liveStatus" + boxId;
  const matchBox = document.getElementById("match" + boxId);
  const finishedContainer = document.getElementById("finishedMatches");

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
      document.getElementById("kickoff" + boxId).innerText = kickoffString + " " + regionAbbr;

      // Nama tim
      document.getElementById("teams" + boxId).innerText = home.name + " VS " + away.name;

      // Logo tim
      document.getElementById("logoHome" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + home.id + "/image";
      document.getElementById("logoAway" + boxId).src =
        "https://api.sofascore.app/api/v1/team/" + away.id + "/image";

      // Mulai countdown
      startCountdown(kickoffDate.getTime(), countdownId);

      // Monitor status & update skor
      const interval = setInterval(async () => {
        const res = await fetch(eventUrl);
        const data = await res.json();
        const event = data.event;
        if (!event || !matchBox) return;

        const liveScoreEl = document.getElementById(liveScoreId);
        const liveStatusEl = document.getElementById(liveStatusId);
        const countdownEl = document.getElementById(countdownId);

        // Update skor
        let scoreText = `${event.homeScore.current} - ${event.awayScore.current}`;
        liveScoreEl.innerHTML = scoreText;

        // Status
        if (event.status.type === "upcoming") {
          // upcoming → countdown tampil, skor & status sembunyi
          countdownEl.style.display = "block";
          liveScoreEl.style.display = "none";
          liveStatusEl.style.display = "none";
        } else if (event.status.type === "inprogress") {
          // live → countdown hilang, tampil skor & LIVE
          countdownEl.style.display = "none";
          liveScoreEl.style.display = "block";
          liveStatusEl.style.display = "block";
          liveStatusEl.innerHTML = `<strong style="color:white;-webkit-text-stroke: 0.2px black;">🔴 LIVE NOW</strong>`;
        } else if (event.status.type === "finished") {
          // finished → skor tetap, status MATCH ENDED
          countdownEl.style.display = "none";
          liveScoreEl.style.display = "block";
          liveStatusEl.style.display = "block";
          liveStatusEl.innerHTML = `<strong style="color:white;-webkit-text-stroke: 0.2px black;">⛔ MATCH ENDED ⛔</strong>`;
          clearInterval(interval);
          if (finishedContainer && matchBox.parentNode !== finishedContainer) {
            finishedContainer.appendChild(matchBox);
          }
        }
      }, 3000);
    });
}

// --- Fungsi Countdown ---
function startCountdown(targetTime, countdownId) {
  window["countdown_" + countdownId] = setInterval(function () {
    const now = new Date().getTime();
    const distance = targetTime - now;
    const el = document.getElementById(countdownId);

    if (distance < 0) {
      clearInterval(window["countdown_" + countdownId]);
      el.innerHTML = "";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    el.innerText =
      (days > 0 ? days + "D - " : "") +
      hours + "H - " +
      minutes + "M - " +
      seconds + "S";
  }, 1000);
                                                        }
              
